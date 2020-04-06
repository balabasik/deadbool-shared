import React, { Component } from "react";
import ReactDOM from "react-dom";
import Physics from "./physics";
import GameFrame from "./gameFrame";
import LowBar from "./lowBar";
import HighBar from "./highBar";
import RightBar from "./rightBar";
import GameState from "./gameState";
import { map1Images } from "./map1";
import Keys from "./keys";
import {
  GetAngle,
  GetTime,
  RandomString,
  GetRand,
  GetAvatarSoundIndexes,
  ShrinkString
} from "./utils";
import VideoManager, { VideoProps } from "./videoManager";
import ScoreBoard from "./scoreBoard";
import WinnerPage from "./winnerPage";
import SystemOptions from "../gameMenu/systemOptions";
import GameChat from "./gameChat";
import ClientSoundManager from "./clientSoundManager";
import SoundManager, {
  clickSound1,
  mouseOverSound1
} from "../gameMenu/soundManager";
import { SoundProps, GetSoundProps } from "./soundManager";
import UpdateYoutubeLink from "./updateYoutubeLink";
import Loading from "../gameMenu/loading";

const cursorSize = 32; // comes from the cursor.png

const frameStyle = {
  width: "100%",
  height: "100%",
  position: "absolute",
  borderStyle: "solid",
  borderWidth: 0,
  borderColor: "red",
  overflow: "hidden"
};

const pageStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
  backgroundColor: "#e1f6bb",
  cursor: "url(./avatars_and_guns/cursor.png),auto"
};

const globalHolderStyle = {
  position: "absolute",
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "black",
  backgroundColor: "rgb(4, 5, 13)",
  overflow: "hidden"
};

const stopGameButtonStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 120,
  height: 65,
  boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.7)",
  border: "1px solid black",
  fontFamily: "Arial Black",
  fontSize: "20px",
  backgroundColor: "rgb(249, 114, 126)"
};

const defaultScale = 0.3;
const extraScale = 1.4;

const frameWidth = 1400 * extraScale;
const frameHeight = 720 * extraScale;

// TODO: It should be on per map basis.
const maxZoom = 2.64; // NOTE: This has to be carefully adjusted to avoid over-the-border zoom
const minZoom = 1.5;

function getFrameWidth(zoom) {
  if (zoom == undefined) zoom = minZoom;
  return frameWidth * zoom;
}

function getFrameHeight(zoom) {
  if (zoom == undefined) zoom = minZoom;
  return frameHeight * zoom;
}

function getScale(winW, winH, zoom) {
  return Math.max(
    defaultScale,
    Math.min(winW / getFrameWidth(zoom), winH / getFrameHeight(zoom))
  );
}

function getLeft(winW, winH, zoom) {
  // When you scale, window still thinks of the div as of original size, so we need to compensate for that
  return (
    (winW - getFrameWidth(zoom) * getScale(winW, winH, zoom)) / 2 -
    (getFrameWidth(zoom) * (1 - getScale(winW, winH, zoom))) / 2
  );
}

function getBottom(winW, winH, zoom) {
  return (
    (winH - getFrameHeight(zoom) * getScale(winW, winH, zoom)) / 2 -
    (getFrameHeight(zoom) * (1 - getScale(winW, winH, zoom))) / 2
  );
}

class GamePlay extends Component {
  constructor(props) {
    super(props);
    let w = window.innerWidth;
    let h = window.innerHeight;
    this.state.windowScale = getScale(w, h);
    this.state.windowLeft = getLeft(w, h);
    this.state.windowBottom = getBottom(w, h);

    this.lastMouseClientX = 0;
    this.lastMouseClientY = 0;

    this.soundManager = new SoundManager(this.props.systemOptions);
    this.clockSounds = {};

    this.bulletExplosionCounter = 0;
    this.frame = undefined;
    this.frameInitCount = 0;
  }

  // NOTE: this.props.initState.playerId is the id of the player/watcher
  // gameState.thisPlayer is the id of the player in the game, which will be the same for real players,
  // but different for watchers.

  handleGameStop() {
    if (this.state.stopInitiated) return;

    this.state.stopInitiated = true;
    this.state.physics.stop();
    delete this.state.physics;

    let gameUrl = this.props.initState.gameBaseUrl;
    let gameId = this.props.initState.gameHash;

    let gameInfo = {
      serverGamePass: this.props.initState.serverGamePass,
      userId: this.props.initState.playerId,
      userPass: this.props.initState.playerPass
    };

    let gameInfoJson = JSON.stringify(gameInfo);

    fetch(gameUrl, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `type=stop&gameId=${gameId}&gameInfo=${gameInfoJson}`
    })
      .then(response => response.json())
      .then(data => {
        // TODO: What if we dont get response from server?
        // Need to set some timeout or error handling.
        this.state.stopInitiated = false;
        this.stopGame();
      });
  }

  componentDidMount() {
    window.addEventListener("keydown", event => {
      // Prevent default for the tab key
      if (event.keyCode == 9) event.preventDefault();
      // Next check if we are in the active chat mode
      if (this.state.chatActive) {
        return;
      }
      this.state.keys.onKeyDown(event);
      this.keysUpdatedEvent();
    });
    window.addEventListener("keyup", event => {
      // NOTE: Even if we are in the chat mode we do not return here.
      this.state.keys.onKeyUp(event);
      this.keysUpdatedEvent();
    });
    window.addEventListener("resize", event => {
      this.updateDimensions();
    });

    // After loading page is mounted we start the game engine
    this.state.keys = new Keys();

    // Video manager
    this.state.videoManager = new VideoManager(
      this.updateVideoManager.bind(this)
    );

    // Client sound manager
    this.state.clientSoundManager = new ClientSoundManager(
      this.props.systemOptions,
      this.props.initState.playerId
    );

    this.state.physics = new Physics(
      this.props.initState,
      this.getKeys.bind(this),
      true /*isClient*/,
      this.updateState.bind(this),
      this.onNewPlayer.bind(this),
      this.onRemovePlayer.bind(this),
      this.onReady.bind(this),
      this.onBulletExplosion.bind(this)
    );

    this.state.gameState = this.state.physics.getState();
    this.state.isDead =
      this.state.gameState.players[this.props.initState.playerId] == undefined
        ? true
        : this.state.gameState.players[this.props.initState.playerId].stats
            .isDead;
  }

  onNewThisPlayer(id) {
    this.state.physics.state.thisPlayer = id;
    this.state.clientSoundManager.updateThisPlayer(id);
  }

  keysUpdatedEvent() {
    this.setState({
      escKeyPressed: this.state.keys.CLIENT_META.escActive,
      chatActive: this.state.keys.CLIENT_META.chatActive,
      chatVisible: this.state.keys.CLIENT_META.chatVisible
    });
    if (
      this.state.keys.CLIENT_META.chatVisible ||
      this.state.keys.CLIENT_META.chatActive
    ) {
      let lastSize = this.state.gameState.chatManager.messages.length - 1;
      if (lastSize >= 0) {
        this.setState({
          lastSeenChatHash: this.state.gameState.chatManager.messages[lastSize]
            .id
        });
      }
    }
  }

  onBulletExplosion(options) {
    let type = options.type;
    let x = options.x;
    let y = options.y;
    // For small bullets we dont do anything
    if (type == 0) return;

    let props = new VideoProps();
    props.type = "png";
    props.src = "./avatars_and_guns/explosion_0/explosion_0";
    props.duration = 1000; // ms
    props.w = 960 / 4;
    props.h = 540 / 4;
    props.x = x - props.w / 2; // bottom left
    props.y = y - props.h / 2;
    props.frame = 0;
    props.maxFrame = 5;
    props.id =
      "./avatars_and_guns/explosion_0/explosion_0_" +
      this.bulletExplosionCounter;
    props.removeAfterFinished = false;
    props.active = true;
    props.fps = 40;

    this.bulletExplosionCounter = (this.bulletExplosionCounter + 1) % 15;

    this.state.videoManager.addVideo(props);
  }

  // This is a hack to update the videos in the renderer after new video has been added
  // or old video has been terminated
  updateVideoManager() {
    this.render();
  }

  // Function preloads heavy images.
  preloadMap1Resources(mapId) {
    this.imagesMap1 = [];
    map1Images.forEach(picture => {
      const img = new Image();
      img.src = picture;
      this.imagesMap1.push(img);
    });
  }

  onReady() {
    // TODO: Modify it per map.
    this.updateDimensions();
    // FIXME: It is not really helping at all, so we disable it.
    //this.preloadMap1Resources();
    this.setState({ loading: false });
  }

  updateDimensions(/* event */) {
    let w = window.innerWidth;
    let h = window.innerHeight;
    this.setState({
      windowScale: getScale(w, h, 1),
      windowLeft: getLeft(w, h, 1),
      windowBottom: getBottom(w, h, 1)
    });
    // NOTE: This is required cause otherwise mouse is not set initially!
    if (this.frame == undefined) {
      setTimeout(() => {
        this.updateDimensions();
      }, 50);
      return;
    }
    let rect = this.frame.getBoundingClientRect();
    this.setState({
      frameLeftX: rect.left,
      frameBottomY: rect.bottom
    });
    // NOTE: For some reason rectangle is not getting set properly on startup
    // so we update it several times on startup to set mouse properly.
    // NOTE2: And just in case also update it in 1 second to avoid any delays
    this.frameInitCount++;
    if (this.frameInitCount < 3) {
      setTimeout(() => {
        this.updateDimensions();
      }, 50);
    } else if (this.frameInitCount == 3) {
      setTimeout(() => {
        this.updateDimensions();
      }, 1000);
    }
  }

  componentWillUnmount() {
    if (this.periodicUpdateTimeout != undefined)
      clearTimeout(this.periodicUpdateTimeout);
    window.removeEventListener("keydown", event => {
      event.preventDefault();
      this.state.keys.onKeyDown(event);
    });
    window.removeEventListener("keyup", event => {
      event.preventDefault();
      this.state.keys.onKeyUp(event);
    });
    window.removeEventListener("resize", event => {
      this.updateDimensions();
    });
  }

  onNewPlayer(playerId, avatar) {}

  onRemovePlayer(playerId) {
    this.state.clientSoundManager.deleteAllSoundsForPlayer(playerId);
  }

  // NOTE: When esc is active we do not pass keys to the physics engine
  getKeys() {
    return this.state.escKeyPressed || this.state.chatActive
      ? new Keys()
      : this.state.keys;
  }

  stopGame() {
    this.props.onStop();
  }

  moveCamera(state) {
    // Update the world offset to make player show in the middle
    let player = state.players[state.thisPlayer];

    if (player == undefined) return {};

    // To keep camera around the player
    let moveX = -player.getRightX() + getFrameWidth(this.state.zoomOut) / 2;

    // linear move formula
    /*
    let x1 = 0;
    let y1 = 5;
    let x2 = state.worldHeight - player.getH();
    let y2 = frameHeight - player.getH() - 5;
    let x = player.getBottomY();
    let moveY = -x + (y1 + ((x - x1) * (y2 - y1)) / (x2 == x1 ? 1 : x2 - x1));
    */
    // Move y in the same way we move X
    let moveY = -player.getTopY() + getFrameHeight(this.state.zoomOut) / 2;

    // To avoid going too far left/right
    var border = 85;
    var borderFloor = 35;
    moveX = Math.min(border, moveX);
    moveX = Math.max(
      moveX,
      -(state.worldWidth - getFrameWidth(this.state.zoomOut) + border)
    );

    moveY = Math.min(borderFloor, moveY);
    moveY = Math.max(
      moveY,
      -(state.worldHeight - getFrameHeight(this.state.zoomOut) + border)
    );

    // Take into account sitting
    moveY +=
      (state.physicsStats.gravityG > 0 ? 1 : -1) * this.state.sittingOffset;

    let shiftX = moveX - this.state.worldLeftX;
    let shiftY = moveY - this.state.worldBottomY;

    this.setState({ worldLeftX: moveX, worldBottomY: moveY });
    return { x: shiftX, y: shiftY };
  }

  updateSittingOffset() {
    if (this.sittingTime == undefined) this.sittingTime = GetTime();
    let oldTime = this.sittingTime;
    let newTime = GetTime();
    if (
      this.state.keys != undefined &&
      (this.state.keys.downKey &&
        !this.state.escKeyPressed &&
        !this.state.chatActive)
    ) {
      this.state.sittingOffset += (newTime - oldTime) * 1;
      this.state.sittingOffset = Math.min(100, this.state.sittingOffset);
    } else if (this.state.sittingOffset != 0) {
      this.state.sittingOffset -=
        Math.min((newTime - oldTime) * 1, this.state.sittingOffset) *
        (this.state.sittingOffset > 0 ? 1 : -1);
    }
    this.sittingTime = newTime;
  }

  updateZoomOut() {
    if (this.zoomTime == undefined) this.zoomTime = GetTime();
    let oldZoom = this.state.zoomOut;
    let oldTime = this.zoomTime;
    let newTime = GetTime();
    let zoomCoef = 0.005;
    if (this.state.keys != undefined && this.state.keys.CLIENT_META.zoomKey) {
      this.state.zoomOut += (newTime - oldTime) * zoomCoef;
      this.state.zoomOut = Math.min(maxZoom, this.state.zoomOut);
    } else if (this.state.zoomOut != minZoom) {
      this.state.zoomOut = Math.max(
        this.state.zoomOut - (newTime - oldTime) * zoomCoef,
        minZoom
      );
    }
    this.zoomTime = newTime;

    if (oldZoom != this.state.zoomOut) this.updateDimensions();
  }

  updateState(state) {
    if (state.physicsStats.gameStatus.paused) {
      this.setState({ gameState: state });
      return;
    }

    this.updateSittingOffset();
    this.updateZoomOut();
    this.updateSoundState(state);

    let shift = this.moveCamera(state);
    if (shift.x == undefined) {
      shift.x = 0;
      shift.y = 0;
    }
    let player = state.players[state.thisPlayer];
    if (player == undefined) return;
    this.onMouseMove(
      { clientX: this.lastMouseClientX, clientY: this.lastMouseClientY },
      true
    );
    this.setState({ gameState: state });
    this.setState({
      isDead: state.players[state.thisPlayer].stats.isDead
    });

    if (!state.players[state.thisPlayer].stats.isDead) {
      this.maybePlayAvatarSpecialSound(state.players[state.thisPlayer]);
    }
  }

  maybePlayAvatarSpecialSound(player) {
    // NOTE: We update state every ~50-100ms, avatar sound should be played roughly
    // 1 time per 40 seconds, which gives expected probability of 1/400.
    if (GetRand(400) == 0) {
      let newProps = new SoundProps();
      let soundIds = GetAvatarSoundIndexes(player.avatar);
      if (soundIds.length == 0) return;
      let id = soundIds[GetRand(soundIds.length)];
      let extraProps = {
        src: "/sounds/avatars/" + player.avatar + "_" + id + ".mp3",
        duration: 10000, // 10 seconds
        playTime: 0,
        r: 100,
        playFrom: 0
      };

      this.state.clientSoundManager.addSound({
        ...newProps,
        ...extraProps,
        type: "sound",
        x: player.getLeftX(),
        y: player.getBottomY(),
        initTime: this.state.gameState.timeStamp,
        id: RandomString(),
        group: player.id + "_special",
        targetPlayer: player.id,
        cyclic: false,
        stopGroup: false,
        global: true
      });
    }
  }

  onMouseMove(event, fake) {
    if (!fake) {
      this.lastMouseClientX = event.clientX;
      this.lastMouseClientY = event.clientY;
    }
    let worldX =
      ((event.clientX - this.state.frameLeftX + cursorSize / 2) /
        this.state.windowScale) *
        this.state.zoomOut -
      this.state.worldLeftX;
    let worldY =
      ((this.state.frameBottomY - event.clientY - cursorSize / 2) /
        this.state.windowScale) *
        this.state.zoomOut -
      this.state.worldBottomY;

    let player = this.state.gameState.players[this.state.gameState.thisPlayer];
    this.onMouseMoveWorldCoord(worldX, worldY);
  }

  onMouseMoveWorldCoord(worldX, worldY) {
    if (this.state.gameState == undefined) return;
    let player = this.state.gameState.players[this.state.gameState.thisPlayer];
    if (player == undefined) return;

    let angle = GetAngle(
      worldX,
      player.getLeftX() + player.geometry.pivotX,
      worldY,
      player.getBottomY() + player.geometry.pivotY
    );

    //NOTE: We don't need to overwrite mouseAngle here.
    this.state.keys.setMouse(worldX, worldY, angle);
  }

  onMouseDown(event) {
    event.preventDefault();
    this.state.keys.onMouseDown();
  }

  onMouseUp(event) {
    event.preventDefault();
    this.state.keys.onMouseUp();
  }

  onContextMenu(event) {
    event.preventDefault();
    if (!this.props.initState.watchOnly) {
      this.state.keys.onRightClickDown();
      // NOTE: We release right click immediately once the value is queried by the physics,
      // so there is no reason to do it here.
      //setTimeout(() => this.state.keys.onRightClickUp(), 100);

      // Sound of swapping guns
      if (
        !this.state.gameState.players[this.state.gameState.thisPlayer].stats
          .isDead
      )
        this.addSwapGunSound();
    } else {
      // Update watching player
      // TODO: Handle player quit
      let oldPlayer = this.state.gameState.thisPlayer;
      let newPlayer = oldPlayer;

      let i = 0;
      let next = false;
      while (i < 100) {
        let key = Object.keys(this.state.gameState.players)[i];
        if (!next && key == oldPlayer) {
          if (i == Object.keys(this.state.gameState.players).length - 1) i = 0;
          else i++;
          next = true;
        }
        if (next) {
          let player = this.state.gameState.players[
            Object.keys(this.state.gameState.players)[i]
          ];
          if (player.id != "shadow" && !player.stats.isCopy.active) {
            newPlayer = player.id;
            break;
          }
        }
        i++;
      }
      if (!next) return;
      this.onNewThisPlayer(newPlayer);
    }
  }

  addSwapGunSound() {
    let player = this.state.gameState.players[this.state.gameState.thisPlayer];
    let newProps = new SoundProps();
    this.state.clientSoundManager.addSound({
      ...newProps,
      ...GetSoundProps("swap"),
      x: player.getLeftX(),
      y: player.getBottomY(),
      initTime: this.state.gameState.timeStamp,
      id: RandomString(),
      group: player.id + "_swap",
      targetPlayer: player.id,
      cyclic: false
    });
  }

  updateDescription(description) {
    // NOOP
  }

  // TODO: Limit number of character submitted per message
  onChatInputSubmitted(input) {
    if (input != undefined && (input.text != "" || input.forceClose)) {
      //console.log(input);
      this.state.keys.CLIENT_META.chatActive = false;
      this.setState({ chatActive: false });
      input.text = ShrinkString(input.text, 200);
      if (input.text != "") {
        this.state.physics.onNewChatMessage(input.text, false /*remote*/);
      }
    }
  }

  updateSoundState(state) {
    let timeStamp = state.timeStamp;
    let soundManager = state.soundManager;

    if (
      state.thisPlayer == undefined ||
      this.state.gameState == undefined ||
      this.state.gameState.players[state.thisPlayer] == undefined
    )
      return;

    let player = this.state.gameState.players[state.thisPlayer];
    this.state.clientSoundManager.updateThisPlayer(
      this.state.gameState.thisPlayer
    );

    // Walking sounds
    for (let key in state.players) {
      if (key == "shadow") continue;
      let other = state.players[key];
      if (other.clientStats.isWalking) {
        let newProps = new SoundProps();
        this.state.clientSoundManager.addSound({
          ...newProps,
          ...GetSoundProps("walk"),
          x: other.getLeftX(),
          y: other.getBottomY(),
          initTime: timeStamp,
          id: RandomString(),
          group: other.id + "_walk",
          targetPlayer: other.id,
          cyclic: true
        });
      } else {
        this.state.clientSoundManager.forceStopGroup(other.id + "_walk");
      }
    }

    // Boxes sounds
    for (let key in state.boxes) {
      let box = state.boxes[key];
      if (
        box.stats.extra != undefined &&
        box.stats.extra.sound != undefined &&
        box.stats.extra.sound != ""
      ) {
        let newProps = new SoundProps();
        this.state.clientSoundManager.addSound({
          ...newProps,
          ...GetSoundProps(box.stats.extra.sound),
          x: box.getLeftX(timeStamp),
          y: box.getBottomY(timeStamp),
          initTime: timeStamp,
          id: RandomString(),
          group: box.stats.id + "_sound",
          targetPlayer: this.state.gameState.thisPlayer,
          cyclic: false,
          global: false,
          stopGroup: false
        });
      } else if (
        box.stats.type == "analog_clock" ||
        box.stats.type == "digital_clock"
      ) {
        if (
          (box.stats.extra.timerId == undefined ||
            state.timers[box.stats.extra.timerId].stats.cur != 0) &&
          this.clockSounds[box.stats.id] != Math.floor((timeStamp - 500) / 1000)
        ) {
          this.clockSounds[box.stats.id] = Math.floor((timeStamp - 500) / 1000);
          let newProps = new SoundProps();
          this.state.clientSoundManager.addSound({
            ...newProps,
            ...GetSoundProps("clocktick"),
            x: box.getLeftX(timeStamp),
            y: box.getBottomY(timeStamp),
            initTime: timeStamp,
            id: RandomString(),
            group: box.stats.id + "_clock",
            targetPlayer: this.state.gameState.thisPlayer,
            cyclic: false,
            global: false,
            stopGroup: false
          });
        } else if (
          box.stats.extra.timerId != undefined &&
          state.timers[box.stats.extra.timerId].stats.cur <= 500 &&
          this.clockSounds[box.stats.id] != 0
        ) {
          this.clockSounds[box.stats.id] = 0;
          let newProps = new SoundProps();
          this.state.clientSoundManager.addSound({
            ...newProps,
            ...GetSoundProps("clockdone"),
            x: box.getLeftX(timeStamp),
            y: box.getBottomY(timeStamp),
            initTime: timeStamp,
            id: RandomString(),
            group: box.stats.id + "_clock",
            targetPlayer: this.state.gameState.thisPlayer,
            cyclic: false,
            global: false,
            stopGroup: false
          });
        }
      }
    }

    this.state.clientSoundManager.update(
      timeStamp,
      soundManager,
      player.getLeftX(),
      player.getBottomY()
    );
  }

  handleMouseOverQuitButton() {
    this.soundManager.playSound(mouseOverSound1, true, true);
  }

  handleClickQuitButton() {
    this.soundManager.playSound(clickSound1, true, true);
    this.handleGameStop();
  }

  onOptionsChanged(options) {
    this.soundManager.onNewSystemOptions(options);
    this.state.clientSoundManager.onNewSystemOptions(options);
    this.props.onOptionsChanged(options);
  }

  state = {
    physics: undefined,
    videoManager: undefined,
    clientSoundManager: undefined,
    gameState: undefined,
    keys: undefined,
    frameLeftX: 0,
    frameBottomY: 0,
    worldLeftX: 0,
    worldBottomY: 0,
    windowScale: 1,
    windowLeft: 0,
    windowBottom: 0,
    loading: true,
    isDead: undefined,
    stopInitiated: false,
    sittingOffset: 0,
    zoomOut: minZoom,
    escKeyPressed: false,
    chatVisible: false,
    chatActive: false,
    lastSeenChatHash: "",
    playerLink: ""
  };

  onLinkUpdate(link) {
    this.setState({ playerLink: link });
  }

  onLinkUpdateSubmitted(link) {
    this.setState({ playerLink: "" });
    this.state.physics.updatePlayerLinkExternally(link);
  }

  render() {
    let stopButton = undefined;
    if (this.state.keys != undefined && this.state.escKeyPressed) {
      stopButton = (
        <div
          style={{
            position: "absolute",
            border: "1px solid black",
            backgroundColor: "rgba(124, 118, 238, 0.72)",
            width: 395,
            height: 200,
            left: "50%",
            top: "50%",
            marginLeft: -395 / 2,
            marginTop: -200 / 2 - 30 // a little above middle
          }}
        >
          <SystemOptions
            options={this.props.systemOptions}
            onOptionsChanged={this.onOptionsChanged.bind(this)}
            describeMe={this.updateDescription.bind(this)}
            extraStyle={{ top: 20, left: 20 }}
            soundManager={this.soundManager}
          />
          <UpdateYoutubeLink
            link={this.state.playerLink}
            onNewLink={this.onLinkUpdate.bind(this)}
            onNewLinkSubmitted={this.onLinkUpdateSubmitted.bind(this)}
            soundManager={this.soundManager}
          />
          <button
            style={{
              ...stopGameButtonStyle,
              width: 350,
              height: 40,
              top: 140,
              left: 20
            }}
            onClick={this.handleClickQuitButton.bind(this)}
            onMouseEnter={this.handleMouseOverQuitButton.bind(this)}
          >
            QUIT GAME
          </button>
        </div>
      );
    } else {
      stopButton = <div />;
    }

    let playerScores = undefined;
    if (
      (this.state.keys != undefined && this.state.keys.CLIENT_META.tabKey) ||
      (this.state.isDead &&
        !this.state.gameState.physicsStats.gameStatus.paused)
    ) {
      playerScores = <ScoreBoard gameState={this.state.gameState} />;
    } else {
      playerScores = <div />;
    }

    // Unfortunately logic is complicated because of the winning page + isDead condition
    let darkOverlay =
      (this.state.isDead &&
        !this.state.gameState.physicsStats.gameStatus.paused) ||
      this.state.escKeyPressed ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)"
          }}
        />
      ) : (
        <div />
      );

    let winnerPage =
      this.state.gameState != undefined &&
      this.state.gameState.physicsStats.gameStatus.paused &&
      this.state.gameState.physicsStats.gameStatus.showWinners ? (
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0
          }}
        >
          <WinnerPage
            gameState={this.state.gameState}
            systemOptions={this.props.systemOptions}
            soundManager={this.soundManager}
          />
        </div>
      ) : (
        <div />
      );

    let reviveMessage =
      !this.state.isDead ||
      this.state.gameState.physicsStats.gameStatus.paused ? (
        <div />
      ) : (
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 40,
            left: "50%",
            top: 200,
            marginTop: -50,
            marginLeft: -200,
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "25px",
            color: "rgb(255, 234, 161)",
            border: "1px solid red",
            backgroundColor: "rgb(9, 7, 31)"
          }}
        >
          CLICK ANYWHERE TO REVIVE
        </div>
      );

    let gameMessage =
      this.state.gameState == undefined ||
      this.state.gameState.gameMessage == undefined ||
      this.state.gameState.gameMessage == "" ? (
        ""
      ) : (
        <div
          style={{
            width: 800,
            height: "auto",
            position: "absolute",
            border: "solid 1px black",
            borderRadius: "3px",
            left: "50%",
            top: 50,
            marginLeft: "-400px",
            backgroundColor: "rgba(128, 133, 40, 0.72)",
            textAlign: "center",
            paddingTop: 7,
            paddingBottom: 7,
            paddingLeft: 5,
            paddingRight: 5,
            fontFamily: "Arial",
            fontWeight: "bold",
            fontSize: "35px",
            letterSpacing: "2px",
            color: "rgb(255, 242, 176)",
            lineHeight: 1.15,
            textShadow:
              "2px 2px 0px black, -2px 2px 0px black, 2px -2px 0px black, -2px -2px 0px black"
          }}
        >
          {this.state.gameState.gameMessage}
        </div>
      );

    let player =
      this.state.gameState == undefined
        ? undefined
        : this.state.gameState.players[this.state.gameState.thisPlayer];

    let loadingPage = this.state.loading ? <Loading /> : "";
    let invertStyle = this.props.systemOptions.invertColors
      ? { filter: "invert(1)" }
      : {};
    return (
      <div
        onMouseMove={event => this.onMouseMove(event, false)}
        onMouseDown={event => this.onMouseDown(event)}
        onMouseUp={event => this.onMouseUp(event)}
        onContextMenu={event => this.onContextMenu(event)}
        style={pageStyle}
      >
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            left: 0,
            top: 0,
            backgroundColor: "black"
          }}
        />
        <div
          ref={node => {
            this.frame = node;
          }}
          style={{
            ...globalHolderStyle,
            width: getFrameWidth(1),
            height: getFrameHeight(1),
            transform: "scale(" + this.state.windowScale + ")",
            left: this.state.windowLeft,
            bottom: this.state.windowBottom,
            filter: "saturate(90%)" // TODO: remove to reduce CPU.
          }}
        >
          {this.state.gameState == undefined ||
          this.state.gameState.physicsStats.gameStatus.paused ? (
            <div />
          ) : (
            <div>
              <div
                style={{
                  ...frameStyle,
                  ...invertStyle,
                  width: getFrameWidth(this.state.zoomOut),
                  height: getFrameHeight(this.state.zoomOut),
                  transform: "scale(" + 1 / this.state.zoomOut + ")",
                  left: getLeft(
                    getFrameWidth(1),
                    getFrameHeight(1),
                    this.state.zoomOut
                  ),
                  bottom: getBottom(
                    getFrameWidth(1),
                    getFrameHeight(1),
                    this.state.zoomOut
                  )
                }}
              >
                <GameFrame
                  gameState={{
                    ...this.state.gameState,
                    frameWidth: getFrameWidth(this.state.zoomOut), // TODO: This is for render optimization
                    frameHeight: getFrameHeight(this.state.zoomOut),
                    zoomOut: this.state.zoomOut
                  }}
                  videoManager={this.state.videoManager}
                  worldLeftX={this.state.worldLeftX}
                  worldBottomY={this.state.worldBottomY}
                  systemOptions={this.props.systemOptions}
                />
              </div>
              <HighBar gameState={this.state.gameState} />
              <RightBar gameState={this.state.gameState} />
              <LowBar gameState={this.state.gameState} />
              {gameMessage}
              {loadingPage}
            </div>
          )}
          {winnerPage}
          {reviveMessage}
          <GameChat
            chatVisible={this.state.chatVisible}
            chatActive={this.state.chatActive}
            onInputSubmitted={this.onChatInputSubmitted.bind(this)}
            gameState={this.state.gameState}
            lastSeenHash={this.state.lastSeenChatHash}
          />
          {darkOverlay}
          <div style={{ opacity: "0.9" }}>{playerScores}</div>
          {stopButton}
        </div>
      </div>
    );
  }
}

export default GamePlay;
