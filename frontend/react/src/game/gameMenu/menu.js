import React, { Component } from "react";
import Description, {
  defaultDescription,
  descriptionHeader,
  BuildInfoDescription
} from "./description";
import Heroes from "./heroes";
import JoinGame, { NewJoinSwitch } from "./joinGame";
import NewGame from "./newGame";
import PlayerInfo from "./playerInfo";
import SystemOptions from "./systemOptions";
import WindowButtons from "./windowButtons";
import Wind from "./wind";
import Version from "./../../globalMain/version";
import MoreButton from "./moreButton";
import SoundManager, { clickSound1, mouseOverSound1 } from "./soundManager";
import MenuError from "./error";
import RejoinButton from "./rejoinButton";
import { GetRand, GetHeroList, use_ssl, operatorIp } from "./../gamePlay/utils";
import Rules, { RulesButton } from "./rules";
import ShareButtons from "./shareButtons";
import Patreon from "./patreon";
import MenuChat from "./menuChat";
import MenuNews from "./menuNews";
import ServerRegion from "./serverRegion";
import { GetSpellList } from "./../gamePlay/spells";
import Loading from "./loading";
import Tips from "./tips";

// This is express server port
const port = 5000;
// This is client ip.
const ip = window.location.hostname;

const pageStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
  backgroundColor: "black"
};

const menuBgSrc = "menu/fool_vs_deadbool_bg_centered1.jpg";
const controlsSrc = "menu/controls_full.png";
const map1Logo = "menu/map_1_logo.png";
var menuImages = [menuBgSrc, controlsSrc, map1Logo];

function loadHeroes() {
  GetHeroList().map(hero => {
    if (hero != undefined)
      menuImages.push("avatars_and_guns/avatar_" + hero[0] + ".png");
  });
}

function loadSpells() {
  let spellList = GetHeroList();
  Object.keys(spellList).map(spell => menuImages.push(spell.src));
}

const menuStyle = {
  position: "relative",
  width: 1250,
  height: 800,
  top: 72,
  margin: "0 auto"
};

const joinContainerStyle = {
  position: "absolute",
  top: 230,
  left: 50,
  width: 350,
  height: 483
};

const defaultAvailableHeroesList = GetDefaultHeroes();

function GetDefaultHeroes() {
  let list = {};
  GetHeroList().map(hero => (list[hero[0]] = true));
  list["random"] = true;
  return list;
}

const defaultScale = 0.3;
const extraScale = 1.3;

const frameWidth = 1400 * extraScale;
const frameHeight = 720 * extraScale;

function getScale(winW, winH) {
  return Math.max(
    defaultScale,
    Math.min(winW / frameWidth, winH / frameHeight)
  );
}

function getLeft(winW, winH) {
  // When you scale window still thinks of the div as of original size, so we need to compensate for that.
  return (
    (winW - frameWidth * getScale(winW, winH)) / 2 -
    (frameWidth * (1 - getScale(winW, winH))) / 2
  );
}

function getBottom(winW, winH) {
  return (
    (winH - frameHeight * getScale(winW, winH)) / 2 -
    (frameHeight * (1 - getScale(winW, winH))) / 2
  );
}

class Menu extends Component {
  constructor(props) {
    super(props);

    let w = window.innerWidth;
    let h = window.innerHeight;
    this.state.windowScale = getScale(w, h);
    this.state.windowLeft = getLeft(w, h);
    this.state.windowBottom = getBottom(w, h);

    this.joinGameAvailableHeroesList = defaultAvailableHeroesList;
    this.soundManager = new SoundManager(this.props.systemOptions);
    this.retrieveState();
    if (!this.props.firstClick)
      document.addEventListener("click", this.onFirstButtonClicked.bind(this));
  }

  updateDimensions(event) {
    let w = window.innerWidth;
    let h = window.innerHeight;
    this.setState({
      windowScale: getScale(w, h),
      windowLeft: getLeft(w, h),
      windowBottom: getBottom(w, h)
    });
  }

  state = {
    id: 0,
    description: defaultDescription(this),
    gameState: {
      playerInfo: { playerName: "", playerLink: "", avatar: "" },
      mapId: 1,
      hostId: "",
      gameBaseUrl: "",
      playerId: "",
      playerPass: "",
      avatar: 0,
      gameHash: "",
      gamePass: "",
      joinGamePassword: "",
      newGamePassword: "",
      newGameName: "",
      watchOnly: false,
      serverGamePass: "",
      wsUrl: "",
      gameOptions: {
        maxPlayers: 8,
        canWatch: false,
        randomPlayers: false,
        uniquePlayers: false,
        maxFrags: 50
      }
    },
    joinActive: true,
    availableHeroesList: defaultAvailableHeroesList,
    errorState: { active: false },
    rejoin: false,
    windowScale: 1,
    windowLeft: 0,
    windowBottom: 0,
    rules: false,
    chatVisible: false,
    newsVisible: false,
    mouseOverRules: false,
    operatorIp: operatorIp,
    operatorLag: undefined,
    totalGames: 0,
    totalPlayers: 0,
    loading: true
  };

  // This is needed to play sound cause chrome browser prevents it before first click
  onFirstButtonClicked() {
    if (this.props.firstClick) return;
    this.props.onFirstClick();
    this.playBgSound(true);
    document.removeEventListener("click", this.onFirstButtonClicked.bind(this));
  }

  // src, useSrcAsHash, stopEarly, type, cyclic, hash
  playBgSound(stopPrevious) {
    this.soundManager.playSound(
      "/sounds/menu_bg.mp3",
      true,
      stopPrevious /*stop sound if it is already being played*/,
      "music",
      true,
      "hash",
      0.2 // volume
    );
  }

  handleWindSound(start) {
    if (!start) {
      this.soundManager.forceRemoveSound("/sounds/wind.mp3");
      return;
    }
    this.soundManager.playSound(
      "/sounds/wind.mp3",
      true,
      true,
      "music",
      true,
      "hash",
      0.7 // volume
    );
  }

  preloadMenuImages() {
    // Function preloads heavy images.
    loadHeroes();
    // TODO: Think about not loading spells upfront
    loadSpells();
    this.menuImages = [];
    menuImages.forEach(picture => {
      const img = new Image();
      img.src = picture;
      this.menuImages.push(img);
    });
  }

  componentDidMount() {
    // FIXME: Preloading does not help for some reason at all, so we disable it.
    //this.preloadMenuImages();
    this.setState({ loading: false });
    this.playBgSound(false);
    window.addEventListener("resize", event => {
      this.updateDimensions();
    });
  }

  componentWillUnmount() {
    this.soundManager.forceStopAll();
    window.removeEventListener("resize", event => {
      this.updateDimensions();
    });
  }

  gotoMore() {
    this.soundManager.forceStopAll();
    this.props.gotoMore();
  }

  updateDescription(description) {
    if (description != undefined && description.content != undefined)
      this.setState({ description: description.content });
    else if (description != undefined && description.info != undefined)
      this.setState({ description: BuildInfoDescription(description.info) });
    else this.setState({ description: defaultDescription(this) });
  }

  onRulesMouseOver() {
    this.soundManager.playSound(mouseOverSound1, true, true);
    this.setState({ mouseOverRules: true });
  }
  onRulesMouseLeave() {
    this.setState({ mouseOverRules: false });
  }
  onRulesClick() {
    this.soundManager.playSound(clickSound1, true, true);
    this.setState({ rules: true });
  }

  cleanSavedState() {
    this.savedState = undefined;
    window.localStorage.removeItem("gameState");
    this.setState({ rejoin: false });
  }

  retrieveState() {
    let json = window.localStorage.getItem("gameState");
    if (json == undefined) {
      this.savedState = undefined;
      return;
    }
    try {
      this.savedState = JSON.parse(json);
    } catch (e) {
      this.cleanSavedState();
    }

    if (this.savedState == undefined) return;

    // Reach to the server and check if the game still exists
    let gameInfo = {
      gameId: this.savedState.gameHash,
      gamePass: this.savedState.gamePass,
      playerId: this.savedState.playerId,
      playerPass: this.savedState.playerPass
    };
    let gameInfoJson = JSON.stringify(gameInfo);

    let gameBaseUrl = this.savedState.gameBaseUrl; //"http://" + ip + ":" + port + "/game/";

    // Link here is the local link to the current url.
    fetch(gameBaseUrl, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `type=rejoincheck&gameId=${
        this.savedState.gameHash
      }&gameInfo=${gameInfoJson}`
    })
      .then(response => response.json())
      .then(data => {
        this.setState({
          rejoin: data.success
        });
        if (data.success == undefined || !data.success) {
          this.cleanSavedState();
        }
      })
      .catch(error => {
        this.cleanSavedState();
        this.setState({
          rejoin: false
        });
        this.displayError("error");
      });
  }

  rejoinGame() {
    if (this.savedState == undefined) {
      this.setState({
        rejoin: false
      });
      return;
    }
    let gameHash = this.savedState.gameHash;
    let gameBaseUrl = this.savedState.gameBaseUrl;

    for (let key in this.savedState) {
      this.state.gameState[key] = this.savedState[key];
    }
    this.handleJoinGame(gameHash, gameBaseUrl, true /*rejoin*/);
  }

  startGame() {
    // Recording the game info to local storage
    let json = JSON.stringify(this.state.gameState);
    window.localStorage.setItem("gameState", json);

    this.props.onStart(
      this.state.gameState.gameBaseUrl,
      this.state.gameState.playerId,
      this.state.gameState.playerPass,
      this.state.gameState.mapId,
      this.state.gameState.hostId,
      this.state.gameState.playerInfo,
      this.state.gameState.gameOptions,
      this.state.gameState.gameHash,
      this.state.gameState.serverGamePass,
      this.state.gameState.avatar,
      this.state.gameState.watchOnly,
      this.state.gameState.wsUrl
    );
  }

  handleNewGame() {
    let status = this.validatePlayerInfo();
    if (!status.valid) {
      this.displayError(status.missing);
      return;
    }

    let gameInfo = {
      playerName: this.state.gameState.playerInfo.playerName,
      playerLink: this.state.gameState.playerInfo.playerLink,
      gameName: this.state.gameState.newGameName,
      gamePass: this.state.gameState.newGamePassword,
      avatar: this.state.gameState.avatar,
      mapId: this.state.gameState.mapId,
      options: this.state.gameState.gameOptions
    };
    let gameInfoJson = JSON.stringify(gameInfo);

    // NOTE: We are sending NewGame request to Operator, while Join game request goes directly to backend.
    let fetchUrl =
      (use_ssl ? "https://" : "http://") +
      this.state.operatorIp +
      ":8000/start";
    // Link here is the local link to the current url.
    fetch(fetchUrl, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `type=start&gameInfo=${gameInfoJson}`
    })
      .then(response => response.json())
      .then(data => {
        if (data.success == undefined || !data.success) {
          this.displayError(data.msg == undefined ? "error" : data.msg);
          return;
        }
        this.state.gameState = {
          playerId: data.playerId,
          playerPass: data.playerPass,
          mapId: data.mapId,
          hostId: data.hostId,
          playerInfo: data.playerInfo, // Youtube link has been sanitized on server
          gameOptions: data.gameOptions,
          avatar: data.playerInfo.avatar, // need this info from server for random avatar case
          gameHash: data.gameHash,
          serverGamePass: data.serverGamePass,
          wsUrl: data.wsUrl,
          gameBaseUrl: data.gameBaseUrl, // in case if server decides to start game elsewhere
          watchOnly: false
        };
        this.startGame();
      })
      .catch(error => this.displayError("error"));
  }

  validatePlayerInfo() {
    if (
      this.state.gameState.playerInfo["playerName"] == undefined ||
      this.state.gameState.playerInfo["playerName"] == "" ||
      this.state.gameState.avatar == 0
    ) {
      let missing = "";
      if (
        this.state.gameState.playerInfo["playerName"] == undefined ||
        this.state.gameState.playerInfo["playerName"] == ""
      )
        missing = "name";
      else if (this.state.gameState.avatar == 0) missing = "avatar";

      return { valid: false, missing };
    }
    return { valid: true };
  }

  onNewGameOptions(newOptions) {
    this.state.gameState.gameOptions = newOptions;
    // NOTE: No need to setState here as it will be set in refreshHeroes.
    //  this.setState({ gameOptions: newOptions });
    this.refreshHeroes();
  }

  handleJoinGameError(txt) {
    this.displayError("join");
  }

  handleJoinGame(gameHash, gameBaseUrl, rejoin) {
    if (rejoin == undefined) rejoin = false;
    let status = this.validatePlayerInfo();
    if (!rejoin && !status.valid) {
      this.displayError(status.missing);
      return;
    }
    if (gameHash == "") return;

    let gameInfo = {
      playerName: this.state.gameState.playerInfo.playerName,
      playerLink: this.state.gameState.playerInfo.playerLink,
      gamePass: this.state.gameState.joinGamePassword,
      avatar: this.state.gameState.avatar
    };

    let type = "join";
    if (rejoin) {
      type = "rejoin";
      gameInfo.playerId = this.state.gameState.playerId;
      gameInfo.playerPass = this.state.gameState.playerPass;
    }

    let gameInfoJson = JSON.stringify(gameInfo);
    fetch(gameBaseUrl, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `type=${type}&gameId=${gameHash}&gameInfo=${gameInfoJson}`
    })
      .then(response => response.json())
      .then(data => {
        if (data.success == undefined || !data.success) {
          this.displayError(data.msg == undefined ? "error" : data.msg);
          if (type == "rejoin") this.cleanSavedState();
          return;
        }
        this.state.gameState = {
          playerId: data.playerId,
          playerPass: data.playerPass,
          mapId: data.mapId,
          hostId: data.hostId,
          gameOptions: data.gameOptions,
          playerInfo: data.playerInfo,
          avatar: data.playerInfo.avatar, // we pass down avatar because maybe user has chosen a random
          serverGamePass: data.serverGamePass,
          wsUrl: data.wsUrl,
          gameBaseUrl: data.gameBaseUrl, // in case of server decides to start game elsewhere
          gameHash: gameHash,
          gamePass: this.state.gameState.joinGamePassword,
          watchOnly: false
        };
        this.startGame();
      })
      .catch(error => {
        this.displayError("error");
        if (type == "rejoin") this.cleanSavedState();
      });
  }

  handleWatchGame(gameHash, gameBaseUrl) {
    if (gameHash == "") return;

    let gameInfo = {
      gamePass: this.state.gameState.joinGamePassword
    };
    let gameInfoJson = JSON.stringify(gameInfo);
    fetch(gameBaseUrl, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `type=watch&gameId=${gameHash}&gameInfo=${gameInfoJson}`
    })
      .then(response => response.json())
      .then(data => {
        if (data.success == undefined || !data.success) {
          this.displayError(data.msg == undefined ? "error" : data.msg);
          return;
        }
        this.state.gameState = {
          mapId: data.mapId,
          serverGamePass: data.serverGamePass,
          playerId: data.playerId,
          hostId: data.hostId,
          gameOptions: data.gameOptions,
          playerPass: data.playerPass,
          wsUrl: data.wsUrl,
          gameBaseUrl: data.gameBaseUrl, // in case of server decides to start game elsewhere
          watchOnly: true,
          gameHash: gameHash,
          gamePass: this.state.gameState.joinGamePassword
        };
        this.startGame();
      })
      .catch(error => this.displayError("error"));
  }

  displayError(txt) {
    this.setState({ errorState: { active: true, value: txt, id: GetRand(2) } });
  }

  removeError() {
    this.setState({ errorState: { active: false } });
  }

  updatePlayerInfo(playerInfo) {
    this.state.gameState.playerInfo = playerInfo;
    this.setState({ gameState: this.state.gameState });
  }

  handlePlayerSelected(id) {
    this.state.gameState.avatar = id;
    this.setState({ gameState: this.state.gameState });
  }

  handleJoinGamePasswordChange(password) {
    this.state.gameState.joinGamePassword = password;
    this.setState({ gameState: this.state.gameState });
  }

  handleNewGamePasswordChange(password) {
    this.state.gameState.newGamePassword = password;
    this.setState({ gameState: this.state.gameState });
  }

  handleNewGameNameChange(name) {
    this.state.gameState.newGameName = name;
    this.setState({ gameState: this.state.gameState });
  }

  handleNewMap(id) {
    this.state.gameState.mapId = id;
    this.setState({ gameState: this.state.gameState });
  }

  onNewJoinSwitch() {
    // NOTE: No need to setState, as it will be done in refreshHeroes.
    this.state.joinActive = !this.state.joinActive;
    this.soundManager.playSound(clickSound1, true, true);
    this.refreshHeroes();
  }

  setAvailableHeroesList(newList) {
    // NOTE: No need to setState, as it will be done in refreshHeroes.
    this.joinGameAvailableHeroesList = newList;
    this.refreshHeroes();
  }

  refreshHeroes() {
    let availableList = defaultAvailableHeroesList;
    if (this.state.joinActive) {
      for (let key in Object.keys(availableList)) {
        if (this.joinGameAvailableHeroesList[key]) continue;
        delete availableList[key];
      }
    } else {
      if (this.state.gameState.gameOptions.randomPlayers) {
        availableList = {};
        availableList["random"] = true;
      }
    }
    this.setState({ availableHeroesList: availableList });
  }

  onOptionsChanged(options) {
    this.soundManager.onNewSystemOptions(options);
    this.props.onOptionsChanged(options);
  }

  onGeneralClick() {
    if (this.state.rules) this.setState({ rules: false });
  }

  onChatKnobClick() {
    this.setState({ chatVisible: !this.state.chatVisible });
  }

  onNewsKnobClick() {
    this.setState({ newsVisible: !this.state.newsVisible });
  }

  onOperatorLag(lag) {
    this.setState({ operatorLag: lag });
  }

  onTotalGamesUpdated(message) {
    this.setState({
      totalGames: message.totalGames,
      totalPlayers: message.totalPlayers
    });
  }

  updateOperatorIp(ip) {
    this.setState({ operatorIp: ip });
  }

  render() {
    let invertStyle = this.props.systemOptions.invertColors
      ? { filter: "invert(1)" }
      : {};
    return this.props.isActive ? (
      <div
        style={{
          ...pageStyle,
          ...invertStyle,
          overflow: "hidden"
        }}
        onClick={this.onGeneralClick.bind(this)}
      >
        <div
          style={{
            position: "absolute",
            overflow: "hidden",
            width: frameWidth,
            height: frameHeight,
            transform: "scale(" + this.state.windowScale + ")",
            left: this.state.windowLeft,
            bottom: this.state.windowBottom,
            filter: "saturate(90%)"
          }}
        >
          <img
            style={{
              position: "absolute",
              width: "100%",
              height: "105%",
              top: "51%",
              left: "50%",
              transform: "translateX(-50%) translateY(-50%)",
              verticalAlign: "center",
              filter: "blur(2px) brightness(110%)"
            }}
            src={menuBgSrc}
          />
          {this.props.systemOptions.dynamicActive ? <Wind /> : <div />}
          <Tips />
          <ServerRegion
            soundManager={this.soundManager}
            operatorIp={this.state.operatorIp}
            operatorLag={this.state.operatorLag}
            totalGames={this.state.totalGames}
            totalPlayers={this.state.totalPlayers}
            updateOperatorIp={this.updateOperatorIp.bind(this)}
          />
          <div style={menuStyle}>
            <Heroes
              onPlayerSelected={this.handlePlayerSelected.bind(this)}
              describeMe={this.updateDescription.bind(this)}
              availableList={this.state.availableHeroesList}
              randomPlayers={this.state.gameState.gameOptions.randomPlayers}
              soundManager={this.soundManager}
            />
            <Description content={this.state.description} />
            <div style={joinContainerStyle}>
              <NewJoinSwitch
                onClick={this.onNewJoinSwitch.bind(this)}
                joinActive={this.state.joinActive}
                soundManager={this.soundManager}
              />
              {this.state.joinActive ? (
                <JoinGame
                  onNewPassword={this.handleJoinGamePasswordChange.bind(this)}
                  describeMe={this.updateDescription.bind(this)}
                  onJoin={this.handleJoinGame.bind(this)}
                  onJoinError={this.handleJoinGameError.bind(this)}
                  onWatch={this.handleWatchGame.bind(this)}
                  setAvailableHeroesList={this.setAvailableHeroesList.bind(
                    this
                  )}
                  soundManager={this.soundManager}
                  onOperatorLag={this.onOperatorLag.bind(this)}
                  onTotalGamesUpdated={this.onTotalGamesUpdated.bind(this)}
                  operatorIp={this.state.operatorIp}
                />
              ) : (
                <NewGame
                  onNewPassword={this.handleNewGamePasswordChange.bind(this)}
                  onNewGameName={this.handleNewGameNameChange.bind(this)}
                  onNewGameOptions={this.onNewGameOptions.bind(this)}
                  gameOptions={this.state.gameState.gameOptions}
                  describeMe={this.updateDescription.bind(this)}
                  onStart={this.handleNewGame.bind(this)}
                  selectMap={this.handleNewMap.bind(this)}
                  soundManager={this.soundManager}
                />
              )}
            </div>
            <PlayerInfo
              onUpdate={this.updatePlayerInfo.bind(this)}
              describeMe={this.updateDescription.bind(this)}
              soundManager={this.soundManager}
              operatorIp={this.state.operatorIp}
            />
            <SystemOptions
              options={this.props.systemOptions}
              onOptionsChanged={this.onOptionsChanged.bind(this)}
              describeMe={this.updateDescription.bind(this)}
              soundManager={this.soundManager}
            />
            <RejoinButton
              canRejoin={this.state.rejoin}
              soundManager={this.soundManager}
              handleRejoin={this.rejoinGame.bind(this)}
            />
            <RulesButton
              onRulesClick={this.onRulesClick.bind(this)}
              onRulesMouseOver={this.onRulesMouseOver.bind(this)}
              onRulesMouseLeave={this.onRulesMouseLeave.bind(this)}
              mouseOverRules={this.state.mouseOverRules}
            />
            <MenuError
              soundManager={this.soundManager}
              errorState={this.state.errorState}
              onDone={this.removeError.bind(this)}
            />
          </div>
          <Patreon soundManager={this.soundManager} />
          <MenuChat
            soundManager={this.soundManager}
            thisPlayerName={this.state.gameState.playerInfo.playerName}
            chatVisible={this.state.chatVisible}
            onChatKnobClick={this.onChatKnobClick.bind(this)}
            operatorIp={this.state.operatorIp}
          />
          <MenuNews
            soundManager={this.soundManager}
            newsVisible={this.state.newsVisible}
            onNewsKnobClick={this.onNewsKnobClick.bind(this)}
            operatorIp={this.state.operatorIp}
          />
          <Version />
          <MoreButton
            gotoMore={this.gotoMore.bind(this)}
            soundManager={this.soundManager}
          />
          <ShareButtons soundManager={this.soundManager} />
          {this.state.rules ? <Rules /> : <div />}
          {this.state.loading ? <Loading /> : ""}
        </div>
      </div>
    ) : (
      <div />
    );
  }
}

export default Menu;
export { defaultAvailableHeroesList, menuStyle };
