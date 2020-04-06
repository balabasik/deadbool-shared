import GameState from "./gameState";
import ServerStateFetcher from "./serverStateFetcher";
import {
  GetAngle,
  GetTime,
  RandomString,
  WeightedSumm,
  GetMagicReloadFactor,
  GetRand,
  IntersectLines,
  GetHeroList,
  ShuffleArray
} from "./utils";
import Player, {
  GetRemovePlayerMessage,
  GetNewPlayerMessage,
  GetKillMessage
} from "./player";
import Bullet from "./bullet";
import Geometry from "./geometry";
import Keys from "./keys";
import TemporalPhysics from "./temporalPhysics";
import PerkManager, { GetPerkMessage } from "./perks";
import MessageManager from "./gameMessages";
import GetAvatarSpellSet, {
  GetSpellList,
  CreateMatrixBullet,
  GetSpellMessage
} from "./spells";
import Timer from "./timer";
import ChatManager from "./chatManager";
import Box from "./box";
import SoundManager from "./soundManager";

const allowedMoveThreshold = 10;

function getDistFromBox(x, y, xLeft, xRight, yBottom, yTop) {
  // There are 9 possibilities
  // 1. bullet inside of the box
  if (x >= xLeft && x <= xRight && y >= yBottom && y <= yTop) return 0;
  // 2. west
  if (x <= xLeft && y >= yBottom && y <= yTop) return Math.abs(x - xLeft);
  // 3. west south
  if (x <= xLeft && y <= yBottom)
    return Math.sqrt((x - xLeft) * (x - xLeft) + (y - yBottom) * (y - yBottom));
  // 4. south
  if (x >= xLeft && x <= xRight && y <= yBottom) return Math.abs(y - yBottom);
  // 5. east south
  if (x >= xRight && y <= yBottom)
    return Math.sqrt(
      (x - xRight) * (x - xRight) + (y - yBottom) * (y - yBottom)
    );
  // 6. east
  if (x >= xRight && y >= yBottom && y <= yTop) return Math.abs(x - xRight);
  // 7. east north
  if (x >= xRight && y >= yTop)
    return Math.sqrt((x - xRight) * (x - xRight) + (y - yTop) * (y - yTop));
  // 8. north
  if (x >= xLeft && x <= xRight && y >= yTop) return Math.abs(y - yTop);
  // 9. north west
  if (x <= xLeft && y >= yTop)
    return Math.sqrt((x - xLeft) * (x - xLeft) + (y - yTop) * (y - yTop));
}

class Physics {
  constructor(
    initState,
    requestKeys,
    isClient,
    onNewState,
    onNewPlayer,
    onRemovePlayer,
    onReady,
    onBulletExplosion
  ) {
    // TODO: Some of these fields are only needed for client
    this.initState = initState;
    this.onNewState = onNewState;
    this.onNewPlayer = onNewPlayer;
    this.onRemovePlayer = onRemovePlayer;
    this.onReady = onReady;
    this.onBulletExplosion = onBulletExplosion;
    this.isClient = isClient;
    this.myGameTime = 0;
    this.loadMap(initState.mapId);
    this.requestKeys = requestKeys;
    this.watchOnly = initState.watchOnly;
    this.stopped = false;
    this.timeStampIsSet = false;
    this.firstMapInterpolation = true;
    this.temporalPhysics = new TemporalPhysics(this);
    this.playerDistanceMap = {};

    this.updateCounter = 0;
    this.lastUpdateTime = 0;
    this.lastChatMessage = {};

    // Client specific initialization
    if (this.isClient) {
      if (!this.watchOnly) this.state.thisPlayer = initState.playerId;
      else this.state.thisPlayer = undefined;
      this.state.hostId = initState.hostId;
      // Only loading fetcher if it is a client version
      this.serverStateFetcher = new ServerStateFetcher(
        this,
        initState.gameBaseUrl,
        initState.gameHash,
        initState.serverGamePass,
        initState.playerId,
        initState.playerPass,
        initState.watchOnly,
        initState.wsUrl,
        this.onNewServerState.bind(this),
        this.setKeys.bind(this),
        this.onNewChatMessage.bind(this),
        this.setHost.bind(this)
      );

      this.state.chatManager = new ChatManager();

      // NOTE: creating a shadow player just for testing
      // TODO: remove shadow player completely
      /*
      if (!this.isHost()) {
      let playerInfo = {
        avatar: this.initState.avatar,
        name: "v",
        link: "link"
      };
      let player = new Player("shadow", playerInfo);
      this.state.addPlayer("shadow", player);
      }
      */

      // On client we will not call ready until the server state is fetched
      // and all the players loaded
      this.initComplete = false;
      // TODO: We need some retry logic here in case if first fetch fails
      this.fetchServerState();
    }

    // NOTE: By this time hostId has been set already
    if (!this.isClient || this.isHost()) {
      this.initServerManagers();
      this.initComplete = true;
      // For server we directly call onready as long as constructor finished
      this.updateState();
      this.onReady();
    }

    // In the very end: add ourselves to the playerState if we are the host.
    if (this.isClient && this.isHost())
      this.addPlayerToState(this.state.thisPlayer, this.initState.playerInfo);
  }

  initServerManagers() {
    this.perkManager = new PerkManager(
      this.state.mapId,
      this.onNewPerks.bind(this),
      this
    );
    this.messageManager = new MessageManager();
  }

  destroyServerManagers() {
    delete this.perkManager;
    delete this.messageManager;
  }

  initTimers(mapId) {
    if (this.isClient && !this.isHost()) return;
    if (mapId != 1 && mapId != "1") return; // only handle Map1 for now
    // TODO: Need to do it on per map basis, and in sync with boxes in gameState.
    this.state.timers = [];
    let timer1 = new Timer(
      40000,
      this.state.timeStamp,
      this.onTimerZero.bind(this, 0, "quad", 31, 520)
    );
    this.state.timers.push(timer1);

    let timer2 = new Timer(
      40000,
      this.state.timeStamp,
      this.onTimerZero.bind(this, 1, "skull", 4810, 3130)
    );
    this.state.timers.push(timer2);
  }

  onTimerZero(timerId, type, x, y) {
    if (this.state.timers[timerId].reset == undefined) return;
    this.perkManager.createTimerPerk(
      type,
      x,
      y,
      this.state.timers[timerId].reset.bind(this.state.timers[timerId])
    );
  }

  onNewPerks(perks) {
    this.state.perks = perks;
  }

  setHost(hostId) {
    if (!this.isClient) return;
    if (this.state.hostId == hostId) return;

    if (hostId == undefined) {
      //console.log("Warning hostId is undefined.");
    }

    this.state.hostId = hostId;
    //console.log("Setting host to " + hostId);

    if (hostId == this.state.thisPlayer) {
      //console.log("We are the host.");
      this.initServerManagers();
      this.initTimers(this.state.mapId);
      // NOTE: Resetting physics stats, but keep youtube link info and game status
      let oldStatus = this.state.physicsStats.gameStatus;
      let oldYoutube = this.state.physicsStats.youtube;
      this.state.resetPhysicsStats();
      this.state.physicsStats.gameStatus = oldStatus;
      this.state.physicsStats.youtube = oldYoutube;

      let hostMessage =
        "Old host lagged. New host: " +
        (this.state.players[hostId] == undefined
          ? "UNKNOWN"
          : this.state.players[hostId].playerName);
      this.messageManager.createMessage(hostMessage, 2000, 1);
    } else {
      // If we are not the host but we were at some point we have to remove managers.
      this.destroyServerManagers();
    }
  }

  stop() {
    // TODO: Disconnect the socket.
    delete this.serverStateFetcher;
    if (!this.isClient || this.isHost()) this.perkManager.stop();
    this.stopped = true;
  }

  rejoinPlayerToState(playerId) {
    //console.log(this.state.players[playerId]);
    if (this.state.players[playerId] == undefined) return { success: false };
    this.state.players[playerId].stats.isDead = true;
    return { success: true, avatar: this.state.players[playerId].avatar };
  }

  addPlayerToState(playerId, playerInfo, playerStats) {
    //console.log(playerId, playerInfo);
    if (
      this.state.thisPlayer == undefined &&
      this.watchOnly &&
      playerId != "shadow"
    )
      this.state.thisPlayer = playerId;
    let player = new Player(playerId, playerInfo, playerStats);
    this.state.addPlayer(playerId, player);
    if (this.temporalPhysics.states.length > 0)
      this.temporalPhysics.states[
        this.temporalPhysics.states.length - 1
      ].state.addPlayer(player);

    this.state.playerKeys[playerId] = {
      keys: new Keys({ activeGun: player.stats.activeGun }),
      timeStamp: this.state.timeStamp
    };

    // NOTE: Creating the distance map on all the clients just in case if this player ever becomes a host.
    for (let key in this.playerDistanceMap)
      this.playerDistanceMap[key][playerId] = 0;
    this.playerDistanceMap[playerId] = { playerId: 0 };

    if (!this.isClient || this.isHost()) {
      if (Object.keys(this.state.players).length == 1) {
        // First player
        this.state.physicsStats.youtube.activeYoutubePlayer = playerId;
        this.reevaluateYoutubeLink();
        this.state.physicsStats.youtube.activeYoutubeTimer = 60000;
      }
      if (!player.stats.isCopy.active)
        this.messageManager.createMessage(GetNewPlayerMessage(player), 2000, 1);
    }

    if (this.onNewPlayer != undefined)
      this.onNewPlayer(playerId, playerInfo["avatar"]);
  }

  removePlayerFromState(playerId) {
    if (this.state.players[playerId] == undefined) return;
    if (!this.isClient || this.isHost()) {
      //console.log(playerId, this.state.players[playerId].stats.isCopy.active);
      if (!this.state.players[playerId].stats.isCopy.active)
        this.messageManager.createMessage(
          GetRemovePlayerMessage(this.state.players[playerId]),
          2000,
          1
        );
    }
    this.state.removePlayer(playerId);
    if (this.onRemovePlayer != undefined) this.onRemovePlayer(playerId);
    delete this.state.playerKeys[playerId];
    delete this.playerDistanceMap[playerId];
    for (let key in this.playerDistanceMap)
      delete this.playerDistanceMap[key][playerId];

    // Reevaluate youtube link if player leaves
    if (
      (!this.isClient || this.isHost()) &&
      this.state.physicsStats.youtube.activeYoutubePlayer == playerId &&
      Object.keys(this.state.players).length > 0
    ) {
      let newId = Object.keys(this.state.players)[
        GetRand(Object.keys(this.state.players).length)
      ];
      this.state.physicsStats.youtube.activeYoutubePlayer = newId;
    }
  }

  loadMap(mapId) {
    this.state = new GameState(mapId);
    this.state.gameOptions = this.initState.gameOptions;
    this.initTimers(mapId);
    this.initTime = GetTime();
    this.realInitTime = this.initTime;

    this.state.soundManager = new SoundManager();
    // Add fan sound if it is defined
    if (this.isClient) {
      if (this.state.fan != undefined) {
        this.state.soundManager.addClientSound("fan", {
          x: this.state.fan.centerX,
          y: this.state.fan.centerY,
          targetPlayer: "",
          initTime: this.state.timeStamp,
          id: RandomString(),
          group: "fan",
          cyclic: true
        });
      }
    }
  }

  reevaluateYoutubeLink() {
    // TODO: Save the last time where the video was stopped and continue from there.
    if (
      this.state.players[this.state.physicsStats.youtube.activeYoutubePlayer] !=
        undefined &&
      this.state.players[this.state.physicsStats.youtube.activeYoutubePlayer]
        .playerLink != undefined &&
      this.state.players[this.state.physicsStats.youtube.activeYoutubePlayer]
        .playerLink != ""
    ) {
      this.state.physicsStats.youtube.activeLink = this.state.players[
        this.state.physicsStats.youtube.activeYoutubePlayer
      ].playerLink;
    }
    this.state.physicsStats.youtube.initTime = 0;
  }

  setLagInfo(message) {
    this.state.hostLag = message.hostLag;
    this.state.playerLag = message.playerLag;
  }

  onWsDisconnected() {
    if (this.disconnectedMessageShown == true) {
      setTimeout(() => {
        this.disconnectedMessageShown = false;
      }, 10000);
      return;
    }
    let message = "SERVER DISCONNECTED! RENEW THE PAGE AND REJOIN THE GAME!";
    this.disconnectedMessageShown = true;
    if (this.isHost()) {
      this.messageManager.createMessage(message, 10000, 1);
    } else this.state.gameMessage = message;
  }

  onWsLagging() {
    if (this.laggingMessageShown == true) {
      setTimeout(() => {
        this.laggingMessageShown = false;
      }, 2000);
      return;
    }
    let message = "Game is slow. Try to renew the page, and rejoin the game.";
    this.laggingMessageShown = true;
    //console.log("lagging");
    if (this.isHost()) {
      this.messageManager.createMessage(message, 2000, 1);
    } else this.state.gameMessage = message;
  }

  // setKeys will be called externally only for server version
  // NOTE: Since we are decoupling keys from state this function will be called on client too.
  setKeys(playerId, keys, timeStamp, remote) {
    //console.log("assign", keys);
    //console.log(playerId, this.state.playerKeys);
    if (!(playerId in this.state.playerKeys)) return false;
    //console.log(keys, this.watchOnly);
    if (
      this.isClient &&
      (playerId == this.state.thisPlayer && !this.watchOnly) &&
      remote == true
    )
      return true; // do not set our own keys

    // TODO: Consider abandoning keys if newer keys exist.
    //if (this.state.playerKeys[playerId].timeStamp > timeStamp) return false;

    let player = this.state.players[playerId];
    // Overwriting keys when some magic spell is active
    if (
      // Only overwrite keys if player is not dead
      !player.stats.isDead &&
      player.stats.overwritePlayerKeys.active &&
      player.stats.overwritePlayerKeys.id in this.state.playerKeys
    ) {
      let otherKeys = this.state.playerKeys[player.stats.overwritePlayerKeys.id]
        .keys;
      keys.rightKey = otherKeys.rightKey;
      keys.leftKey = otherKeys.leftKey;
      keys.downKey = otherKeys.downKey;
      keys.upKey = otherKeys.upKey;
      keys.leftClick = otherKeys.leftClick;
      /*console.log(
        "overwritten: ",
        player.playerName,
        this.state.players[player.stats.overwritePlayerKeys.id].playerName
      );*/
    }
    // Also overwriting keys of other players
    for (let key in this.state.players) {
      if (
        this.state.players[key].stats.overwritePlayerKeys.active &&
        this.state.players[key].stats.overwritePlayerKeys.id == playerId &&
        !this.state.players[key].stats.isDead
      ) {
        this.state.playerKeys[key].keys.rightKey = keys.rightKey;
        this.state.playerKeys[key].keys.leftKey = keys.leftKey;
        this.state.playerKeys[key].keys.downKey = keys.downKey;
        this.state.playerKeys[key].keys.upKey = keys.upKey;
        this.state.playerKeys[key].keys.leftClick = keys.leftClick;
        /*console.log(
          "overwritten: ",
          this.state.players[key].playerName,
          player.playerName
        );*/
      }
    }

    // Overwrite by scrambling:
    if (
      this.state.physicsStats.scrambleKeys.active &&
      this.state.physicsStats.scrambleKeys.killer != playerId
    ) {
      let newKeys = { ...keys };
      for (let k in this.state.physicsStats.scrambleKeys.mapping) {
        newKeys[k] = keys[this.state.physicsStats.scrambleKeys.mapping[k]];
      }
      keys = newKeys;
    }

    this.state.playerKeys[playerId].keys = keys;
    this.state.playerKeys[playerId].timeStamp = timeStamp;

    //if (remote == true)
    //  console.log("set", playerId, this.state.playerKeys[playerId].keys);

    return true;
  }

  isHost() {
    /*console.log(
      this.state.hostId,
      this.state.thisPlayer,
      this.initState.hostId,
      this.initState.playerId
    );*/
    // For watchers we always return false
    if (this.watchOnly) return false;
    // This is when game is handled by server
    if (this.initState.hostId == undefined && this.state.hostId == undefined)
      return false;
    // Special case before we create map.
    if (this.state.hostId == undefined || this.state.thisPlayer == undefined) {
      return this.initState.hostId == this.initState.playerId;
    }
    return this.state.hostId == this.state.thisPlayer;
  }

  getState() {
    return this.state;
  }

  updateTimers() {
    for (let timer of this.state.timers) {
      if (timer.update != undefined) timer.update(this.state.timeStamp);
    }
  }

  updateState() {
    if (this.stopped) return;
    this.updateCounter++; // TODO: Check for overflow.
    // If this is a client version we request state of the keys from the game
    if (this.isClient && !this.watchOnly)
      this.setKeys(
        this.state.thisPlayer,
        this.requestKeys(),
        this.state.timeStamp,
        false /* remote */
      );

    if (!this.isClient || this.isHost()) {
      // Record players that were dead before the update
      for (let key in this.state.playerKeys) {
        let player = this.state.players[key];
        if (player == undefined) continue;
        player.wasDead = player.stats.isDead;
      }
      // update timers
      this.updateTimers();
    }

    this.computeNewState(); // NOTE: this may revive players on server

    if (this.isClient && !this.isHost()) this.interpolateStateWithServer();
    else if (!this.state.physicsStats.gameStatus.paused) {
      if (!this.isClient) this.interpolateStateWithClient();
      else if (this.isHost()) this.interpolateHostState();
      this.state.gameMessage = this.messageManager.getTheOldestMessage();
      if (this.initState.gameOptions.maxFrags != 0) {
        let maxCurFrags = 0;
        for (let key in this.state.players) {
          maxCurFrags = Math.max(
            maxCurFrags,
            this.state.players[key].stats.frags
          );
          // Uncomment this for testing the winning page.
          //if (this.state.players[key].stats.frags == -1) this.gameFinished();
        }
        if (maxCurFrags >= this.initState.gameOptions.maxFrags) {
          this.gameFinished();
        }
      }
    }

    this.onNewState(this.state);
    // IF we are the host then broadcast the state
    // NOTE: Need to send chat messages before cleaning it up.
    if (this.isClient && this.isHost())
      this.serverStateFetcher.sendState(this.state);

    if (!this.isClient || this.isHost()) {
      // Forces the clients geometry for some time
      // NOTE: To always force comment this out.
      for (let key in this.state.players) {
        if (
          this.state.players[key].stats.forceClientGeometry.active &&
          this.state.timeStamp -
            this.state.players[key].stats.forceClientGeometry.time >=
            400
        ) {
          this.state.players[key].stats.forceClientGeometry.active = false;
        } else if (!this.state.players[key].stats.forceClientGeometry.active) {
          // Forcing geometry with 20% probability
          //  if (GetRand(5) == 0)
          //  this.state.players[key].stats.forceClientGeometry.active = true;
        }
      }

      // Cleanup the bullets after they have been sent to the client
      this.state.physicsStats.newBullets = [];
      // Cleanup the boxes
      this.state.physicsStats.removeExtraBoxes = {};
    }

    // NOTE: We clean both the server and client sounds as they have already been processed
    this.state.soundManager.clearAll();

    let newUpdateTime = GetTime();
    if (this.lastUpdateTime == 0) this.lastUpdateTime = newUpdateTime;
    // We schedule the next update T-execTime, where T=40ms for client, and 40ms for server
    // UPDATE: For host we update state every 60ms
    let baseDelay = this.isClient && this.isHost() ? 40 : 40;
    let delay = Math.min(
      baseDelay,
      Math.max(0, 2 * baseDelay - (newUpdateTime - this.lastUpdateTime))
    );
    //console.log(newUpdateTime - this.lastUpdateTime);
    this.lastUpdateTime = newUpdateTime;
    setTimeout(this.updateState.bind(this), delay);
  }

  // TODO: If host leaves then new host has to restart the game.
  gameFinished() {
    // NOTE: Game starts at 0 timeStamp
    let gameDuration = this.state.timeStamp - 0;
    // If game lasted less than 10 min then start next game in 15 sec instead of 30
    let delay = gameDuration < 60000 * 10 ? 15000 : 30000; // new game in 30 seconds

    this.state.physicsStats.gameStatus = {
      paused: true,
      showWinners: true,
      newGameTimeStamp: this.state.timeStamp + delay
    };
    setTimeout(this.restartGame.bind(this), delay);
  }

  restartGame() {
    // TODO: Check if we need to reset map.
    //this.state.resetMap(this.initState.mapId);
    for (let key in this.state.players) {
      this.state.players[key].initPerGameStats();
      this.state.players[key].initStats();
    }
    this.state.physicsStats.gameStatus = {
      paused: false,
      showWinners: false,
      newGameTimeStamp: 0
    };
  }

  updatePlayerLinkExternally(link) {
    this.updatePlayerLink(this.state.thisPlayer, link);
    if (!this.isHost()) this.serverStateFetcher.notifyHostOfNewLink(link);
  }

  updatePlayerLink(playerId, link) {
    if (this.state.players[playerId] == undefined) return;
    //console.log("Player " + playerId + " updated link to: " + link);
    this.state.players[playerId].playerLink = link;
  }

  interpolateHostState() {
    // This is only for host.
    if (!this.isClient || !this.isHost()) return;
    for (let key in this.state.playerKeys) {
      // For host we do not interpolate our own state.
      if (key == this.state.hostId) continue;
      let player = this.state.players[key];
      if (player == undefined) continue;
      if (player.wasDead) continue;
      let timeStamp = this.state.playerKeys[key].timeStamp;
      if (player.stats.forceClientGeometry.active) continue;
      if (this.temporalPhysics.states.length > 0) {
        this.interpolateRemotePlayerKeys(
          key /*playerId*/,
          false /*forceGeometry*/, // never force server geometry
          player /*remotePlayer*/,
          timeStamp /*this.state.timeStamp*/
        );
      }
    }
    // Reset all the other player's magic keys.
    for (let key in this.state.players) {
      if (key == this.state.hostId) continue;
      if (this.state.players[key].isDead) this.resetAllKeys(key);
      else this.resetMagicKeys(key);
    }
  }

  interpolateStateWithClient() {
    // This is only for server use!!!
    for (let key in this.state.playerKeys) {
      // For host we do not interpolate our own state.
      if (this.isClient) continue;
      let player = this.state.players[key];
      if (player == undefined) continue;
      if (player.wasDead) continue;
      let keys = this.state.playerKeys[key].keys;
      let timeStamp = this.state.playerKeys[key].timeStamp;

      // THIS IS NAIVE APPROACH AND WORKS BAD...
      // THATS WHY WE DESIGNED TEMPORAL INTERPOLATION
      /*
      player.setLeftX(keys.clientX);
      player.setBottomY(keys.clientY);
      player.stats.speedX = keys.clientSpeedX;
      player.stats.speedY = keys.clientSpeedY;
      continue;
      */

      // On server we apply player keys, and rarely sync the state if it is different
      this.temporalPhysics.applyTemporalKeys(key, timeStamp, keys);

      // Do not apply client geometry if the force mode is on
      //console.log(player.playerName, keys.clientX, keys.clientY);
      if (player.stats.forceClientGeometry.active) continue;

      // Compare the state after applying the keys with the client state,
      // and in 10% cases interpolate with the client
      let upperStats = this.temporalPhysics.getUpperBoundStats(
        timeStamp,
        player.id
      );
      let prob = this.updateCounter % 100;

      if (
        prob < 100 && // NOTE: this coeeficient was 10 in the beginning
        (this.isGeometryVeryDifferent(
          { x: upperStats.x, y: upperStats.y },
          { x: keys.clientX, y: keys.clientY }
        ) ||
          this.isSpeedVeryDifferent(upperStats, {
            speedX: keys.clientSpeedX,
            speedY: keys.clientSpeedY
          }))
      ) {
        this.temporalPhysics.applyTemporalStats(key, timeStamp, {
          x: keys.clientX,
          y: keys.clientY,
          speedX: keys.clientSpeedX,
          speedY: keys.clientSpeedY
        });
      }

      // TODO: After temporal physics is working we do not need to move players/boxes on the server side.
      // And need to move this part before actions instead.
      let latestStats = this.temporalPhysics.getTheNewestPlayerStats(key);
      if (latestStats != undefined) {
        /*console.log(
          "playerX: " +
            player.getLeftX() +
            " tempoX: " +
            latestStats.x +
            " clientX: " +
            keys.clientX
        );

        console.log(
          "playerY: " +
            player.getBottomY() +
            " tempoY: " +
            latestStats.y +
            " clientY: " +
            keys.clientY +
            " time: " +
            this.state.timeStamp +
            " jump: " +
            keys.upKey +
            " keyStamp: " +
            timeStamp
        );*/

        player.setLeftX(latestStats.x);
        player.setBottomY(latestStats.y);
        player.stats.speedX = latestStats.speedX;
        player.stats.speedY = latestStats.speedY;
        // TODO: Handle additional speed.

        // NOTE: If we have applied the keys and the new keys didnot arrive yet,
        // we need to propagate the keys to the next timeframe

        let upperStats = this.temporalPhysics.getUpperBoundStats(
          timeStamp,
          player.id
        );

        this.state.playerKeys[key].timeStamp = upperStats.timeStamp;
        this.state.playerKeys[key].keys.clientX = upperStats.x;
        this.state.playerKeys[key].keys.clientY = upperStats.y;
        this.state.playerKeys[key].keys.clientSpeedX = upperStats.speedX;
        this.state.playerKeys[key].keys.clientSpeedY = upperStats.speedY;
      }
      //console.log(this.temporalPhysics);
    }

    // On server we can directly reset magic keys for all the players.
    // Reset all the keys for currently dead players
    for (let key in this.state.players) {
      if (this.state.players[key].isDead) this.resetAllKeys(key);
      else this.resetMagicKeys(key);
    }
  }

  handleExtraBoxes() {
    for (let key in this.state.physicsStats.addExtraBoxes) {
      let boxStats = this.state.physicsStats.addExtraBoxes[key].stats;
      // Box already exists
      if (boxStats.id in this.state.boxes) continue;

      let geometry = new Geometry(boxStats.geometry);
      let box = new Box(boxStats.id, geometry, undefined, boxStats);
      this.state.boxes[boxStats.id] = box;
    }

    for (let key in this.state.physicsStats.removeExtraBoxes) {
      //console.log(key);
      if (!(key in this.state.boxes)) continue;
      delete this.state.boxes[key];
    }

    // This check is done just in case cause boxes are not getting deleted..
    let toDelete = [];
    for (let key in this.state.boxes) {
      let box = this.state.boxes[key];
      if (box.stats.deleteAfter == undefined || box.stats.deleteAfter == -1)
        continue;
      if (box.stats.deleteAfter < this.state.timeStamp) toDelete.push(key);
    }

    for (let id of toDelete) delete this.state.boxes[id];
  }

  evaluatePassiveSpell(magicId, player, elapsedTime) {
    let spell = GetSpellList()[magicId];
    if (spell.execute != undefined) {
      spell.execute(this, player, magicId, elapsedTime);
    }
  }

  evaluatePassiveSpells(elapsedTime) {
    for (let key in this.state.players) {
      if (key == "shadow" || this.state.players[key].stats.isDead) continue;
      this.evaluatePassiveSpell(
        this.state.players[key].stats.magicId[0],
        this.state.players[key],
        elapsedTime
      );
    }
  }

  updatePlayerDistanceMap() {
    // TODO: Think of something better than x^2.
    for (let key1 in this.state.players)
      for (let key2 in this.state.players) {
        let y1 = this.state.players[key1].getBottomY();
        let y2 = this.state.players[key2].getBottomY();
        let x1 = this.state.players[key1].getLeftX();
        let x2 = this.state.players[key2].getLeftX();
        let dist = Math.sqrt((y1 - y2) * (y1 - y2) + (x1 - x2) * (x1 - x2));
        this.playerDistanceMap[key1][key2] = dist;
        this.playerDistanceMap[key2][key1] = dist;
      }
  }

  getPlayerKeys(playerId) {
    let playerKeys = this.state.playerKeys[playerId];
    //  if (playerKeys == undefined) console.log("playerkey: ", playerKeys);
    if (playerKeys == undefined) return undefined;
    let keys = playerKeys.keys;
    let player = this.state.players[playerId];

    if (
      // Only overwrite keys if player is not dead
      !player.stats.isDead &&
      player.stats.overwritePlayerKeys.active &&
      player.stats.overwritePlayerKeys.id in this.state.playerKeys
    ) {
      let otherKeys = this.state.playerKeys[player.stats.overwritePlayerKeys.id]
        .keys;
      keys.rightKey = otherKeys.rightKey;
      keys.leftKey = otherKeys.leftKey;
      keys.downKey = otherKeys.downKey;
      keys.upKey = otherKeys.upKey;
      keys.leftClick = otherKeys.leftClick;
    }
    //console.log("get", playerId, keys);
    //if (playerKeys == undefined) console.log("playerkey: ", playerKeys);
    return keys;
  }

  computeNewState() {
    let now = GetTime();
    let newTimeStamp = now - this.initTime;
    this.myGameTime = now - this.realInitTime;
    let elapsedTime = newTimeStamp - this.state.timeStamp;

    if (!this.state.physicsStats.gameStatus.paused) {
      this.state.physicsStats.youtube.activeYoutubeTimer -= elapsedTime;

      if (this.state.physicsStats.youtube.activeYoutubeTimer <= 0) {
        // Issue timerDone sound
        if (this.isClient) {
          this.state.soundManager.addClientSound("clockdone", {
            x: 0,
            y: 0,
            initTime: this.state.timeStamp,
            id: RandomString(),
            targetPlayer: "", // play for everyone
            global: true
          });
        }
        // NOTE: We use the same youtube timer for youtube link and for random avatars
        // TODO: Should we only reevaluate on server?
        this.reevaluateYoutubeLink();
        // NOTE: Only reevaluating avatars on server
        if (!this.isClient || this.isHost()) this.reevaluateAvatars();
        this.state.physicsStats.youtube.activeYoutubeTimer = 60000; // should be in sync with gameState
      }

      // NOTE: This happens outside of the player loop
      // Move bullets first, before creating new bullets
      if (!this.state.physicsStats.bulletsStopped)
        this.moveBullets(newTimeStamp);

      // Spells that are performed only on server
      if (!this.isClient || this.isHost()) {
        this.updatePlayerDistanceMap();
        this.deadbeefUpdateState(elapsedTime);
        this.evaluatePassiveSpells(elapsedTime);
      }

      // NOTE: SO WE ONLY MOVE PLAYERS WHOSE KEYS WE RECEIVED.
      // TODO: Should we only do this on client?
      this.numMagics = 0;
      for (var k in this.state.players) {
        let key = this.getPlayerKeys(k);
        //  console.log(key);
        let player = this.state.players[k];
        if (k == "shadow") continue;
        // FIRST update players gun angle
        if (key != undefined) {
          player.stats.activeGun = key.activeGun;
          player.stats.mouseAngle = key.mouseAngle;
          player.stats.mouseWorldX = key.mouseX;
          player.stats.mouseWorldY = key.mouseY;
        }

        //console.log(player);
        //if (!this.isClient) console.log(player.id, player.getLeftX());

        // TODO: Maybe call updateState here to save some computation response time

        // Now move the player (handle jump also) and check for colisions
        // If player has pressed keys, then we try to perfrom the moveX
        // If there is no record then then we use the current speed to update
        if (!player.stats.isDead) {
          this.movePlayer(elapsedTime, player, key);

          // Now move the dynamic platforms, and move players that touch them
          // or on the way of the platform.
          this.moveBoxes(player, newTimeStamp);

          // Check if player has picked up any perks (only for server!!)
          this.checkPerks(player);
        }

        // Try player actions (fire, use skill, etc).
        // NOTE: If player is dead this will revive him
        // NOTE: We do not fire if we don't receive player key?!!??
        //  console.log(key);
        if (
          key != undefined &&
          (!this.isClient ||
            this.isHost() ||
            (player.id == this.state.thisPlayer && !this.watchOnly))
        ) {
          this.tryFire(player, newTimeStamp, key);
        }
        // NOTE: Actions have to be verified by the server, so we do not perform them on the client
        if (key != undefined)
          this.numMagics += this.tryAction(player, newTimeStamp, key);
      }
    }

    // Update the timeStamp Now
    this.state.timeStamp = newTimeStamp;

    // Record temporal information for both server and client
    this.temporalPhysics.addState(this.state);
    //console.log(this.temporalPhysics);
  }

  reevaluateAvatars() {
    if (this.isClient && !this.isHost()) return;
    if (!this.initState.gameOptions.randomPlayers) return;

    let heroes = GetHeroList();
    let shuffled = [];
    if (this.initState.gameOptions.uniquePlayers)
      shuffled = ShuffleArray(heroes.slice(0, heroes.length - 1));

    let i = 0;
    for (let key in this.state.players) {
      if (!this.initState.gameOptions.uniquePlayers) {
        // NOTE: Last avatar is "random" so we have to avoid it
        this.state.players[key].avatar = heroes[GetRand(heroes.length - 1)][0];
      } else {
        this.state.players[key].avatar = shuffled[i % shuffled.length][0];
        i++;
      }
      // Resetting magic times
      this.state.players[key].reevaluateSpells();
    }
  }

  checkPerks(player) {
    if (player.id == "shadow") return;
    if (this.isClient && !this.isHost()) return; // should never happen

    let toDelete = [];
    for (let k in this.perkManager.perks) {
      let perk = this.perkManager.perks[k];
      let perkLeftX = perk.stats.position[0];
      let perkBottomY = perk.stats.position[1];
      let perkRightX = perkLeftX + perk.stats.w;
      let perkTopY = perkBottomY + perk.stats.h;
      // Check that perk is inside the players position
      if (
        !(
          player.getLeftX() > perkRightX ||
          player.getRightX() < perkLeftX ||
          player.getBottomY() > perkTopY ||
          player.getTopY() < perkBottomY
        )
      ) {
        this.applyPerk(player, perk);

        // Sound of taking a perk (only on server)
        this.state.soundManager.addSound("perk", {
          x: player.getLeftX(),
          y: player.getBottomY(),
          targetPlayer: player.id,
          initTime: this.state.timeStamp,
          id: RandomString(),
          group: player.id + "_perk"
        });

        // Quad damage
        if (perk.stats.type == "quad") {
          this.state.soundManager.addSound("quad", {
            x: player.getLeftX(),
            y: player.getBottomY(),
            targetPlayer: "",
            initTime: this.state.timeStamp,
            id: RandomString(),
            group: player.id + "_quad",
            global: true
          });
          this.messageManager.createMessage(
            GetPerkMessage(player, perk),
            2000,
            1
          );
        } else if (perk.stats.type == "skull") {
          this.state.soundManager.addSound("skull", {
            x: player.getLeftX(),
            y: player.getBottomY(),
            targetPlayer: "",
            initTime: this.state.timeStamp,
            id: RandomString(),
            group: player.id + "_skull",
            global: true
          });
          this.messageManager.createMessage(
            GetPerkMessage(player, perk),
            2000,
            1
          );
        }

        // Delete perk as it has been picked up
        toDelete.push(k);
      }
    }
    for (let k of toDelete) this.perkManager.deletePerk(k);
  }

  applyPerk(player, perk) {
    //console.log("Player " + player.id + " picked up perk " + perk.type);
    // This is to reset timers
    if (perk.onCapture != undefined) perk.onCapture(this.state.timeStamp);
    if (perk.execute != undefined) {
      perk.execute(
        this,
        player,
        this.state.timeStamp,
        RandomString() /*perkHash*/,
        true /*activate*/
      );
    }
  }

  tryAction(player, newTimeStamp, key) {
    if (player.stats.isDead || player.id == "shadow") return 0;

    // NOTE: This is important to set player gun.
    //console.log(key.activeGun);
    player.stats.activeGun = key.activeGun;

    // NOTE: Some actions we perform on client,
    // But magic we do not.
    if (this.isClient && !this.isHost()) return 0;

    // Handle the magic keys.
    // NOTE: 0th magic is a passive magic so we skip it.
    if (this.state.physicsStats.stopSpells) return 0;

    let numMagics = 0;

    for (let i = 0; i < 4; i++) {
      if (i == 0) continue;
      let magicKey = i == 1 ? key.magic1 : i == 2 ? key.magic2 : key.magic3;
      if (
        magicKey &&
        newTimeStamp - player.stats.lastMagicTime[i] >=
          player.stats.magicReloadTime[i] *
            GetMagicReloadFactor(Object.keys(this.state.players).length)
      ) {
        player.stats.lastMagicTime[i] = newTimeStamp;
        this.doMagic(
          player,
          player.stats.magicId[i],
          true /* activate*/,
          key,
          RandomString()
        );
        numMagics += 1;
      }
    }
    return numMagics;
  }

  // activate/deactivate spell
  // NOTE: magicHash is used to map magic activation and deactivation together
  doMagic(player, magicId, activate, key, magicHash) {
    // NOTE: We do not check for isDead here. It has to be checked by the caller.
    // TODO: Need to know list of players affected by the spell.
    // Then can only display spells that affect each specific player.
    let spell = GetSpellList()[magicId];
    if (spell.type != "active") {
      return;
    }
    if (spell.globalBit) {
      if (activate) this.state.physicsStats.activeSpells[magicId] = true;
      else delete this.state.physicsStats.activeSpells[magicId];
    }

    // Adding magic casting sound
    if (activate) {
      //console.log(spell.soundSrc);
      if (spell.soundSrc != undefined && spell.soundSrc != "") {
        // Only for special global sounds we play sounds for all players
        this.state.soundManager.addSoundSrc(spell.soundSrc, {
          x: player.getLeftX(),
          y: player.getBottomY(),
          initTime: this.state.timeStamp,
          id: RandomString(),
          group: player.id + "_" + magicId + "_magic",
          targetPlayer: spell.globalBit ? "" : player.id,
          global: true, // played everywhere
          duration: 5000 // just in case
        });
      } else {
        // If there is no special sound we execute default magic sound
        this.state.soundManager.addSound("magic", {
          x: player.getLeftX(),
          y: player.getBottomY(),
          initTime: this.state.timeStamp,
          id: RandomString(),
          group: player.id + "_" + magicId + "_magic",
          global: true, // playerd everywhere
          targetPlayer: player.id
        });
      }
    }

    if (spell.execute != undefined)
      spell.execute(this, activate, player, key, magicHash);

    // TODO: Is this timeout reliable? Maybe add a spells queue instead.
    // TODO: Need to stop this timeout if game ends.
    // TODO: What if previous spell is in progress when trying to execute here?

    // Set deactivation timer.
    if (activate) {
      if (spell.globalBit) {
        this.messageManager.createMessage(
          GetSpellMessage(player, spell),
          2000,
          1
        );
      }
      let reverseTime = spell.activeTime; // activeTime is given in milliseconds
      setTimeout(
        this.doMagic.bind(
          this,
          player,
          magicId,
          false /* activate*/,
          key,
          magicHash
        ),
        reverseTime
      );
      // NOTE: Setting the last spell last here
      this.state.physicsStats.lastSpell = magicId;
    }
  }

  createMatrixRec(player) {
    if (!this.state.physicsStats.matrixActive) return;

    let keys = this.state.playerKeys[player.id];
    if (keys == undefined || keys.keys == undefined) return;

    CreateMatrixBullet(this, keys.keys.mouseX, keys.keys.mouseY, player);
    setTimeout(this.createMatrixRec.bind(this, player), 200);
  }

  // NOTE: Local sends us the text, while remote sends complete message
  onNewChatMessage(text, remote) {
    // TODO: Check that messages are not sent too often.
    if (!remote) {
      let chatMessage = {
        id: RandomString(),
        text: text,
        player: this.state.thisPlayer,
        clientTimeStamp: this.state.timeStamp
      };
      this.serverStateFetcher.sendChatMessage(chatMessage);
      this.state.chatManager.addNewMessages([chatMessage]);
    } else {
      this.state.chatManager.addNewMessages([text]);
    }
  }

  revivePlayer(player, timeStamp) {
    if (this.isClient && !this.isHost()) return; // player is revived on server
    if (!player.stats.isDead) return; // player has already been revived
    if (timeStamp - player.stats.deathTime < 1000) {
      // Wait for 1 second before letting player to revive
      setTimeout(this.revivePlayer.bind(this, player, timeStamp + 1000), 1000);
      return;
    }

    let lastMagicTime = player.stats.lastMagicTime;
    player.initStats();
    // Keeping the last magic time
    player.stats.lastMagicTime = lastMagicTime;
    player.stats.reviveTime = timeStamp;
    let id = GetRand(this.state.playerBirthPlaces.length);
    let birthPlace = this.state.playerBirthPlaces[id];

    player.setLeftX(birthPlace[0]);
    player.setBottomY(birthPlace[1]);

    this.state.playerKeys[player.id] = {
      // Keep last active gun
      keys: new Keys({
        activeGun: player.stats.activeGun,
        clientX: birthPlace[0],
        clientY: birthPlace[1]
      }),
      timeStamp: this.state.timeStamp
    };

    this.temporalPhysics.forceGeometryInAllStates(player);

    // console.log("revived: ", player.id, player.getLeftX());

    player.stats.forceClientGeometry = {
      active: true,
      time: this.state.timeStamp
    };

    player.stats.isDead = false;

    // Reviving sound
    this.state.soundManager.addSound("revive", {
      x: player.getLeftX(),
      y: player.getBottomY(),
      initTime: this.state.timeStamp,
      id: RandomString(),
      targetPlayer: player.id,
      global: true
    });
  }

  tryFire(player, newTimeStamp, keys) {
    // TODO: Should player be revived by server command?
    // What if there is a resurrection timeout?
    if (
      (!this.isClient || this.isHost()) &&
      keys.leftClick &&
      player.stats.isDead
    ) {
      this.revivePlayer(player, newTimeStamp);
      return;
    }

    if (
      !player.stats.canShoot ||
      player.stats.isDead ||
      newTimeStamp - player.stats.reviveTime < 300 || // don't let player fire too fast
      !keys.leftClick ||
      player.stats.ammo[player.stats.activeGun] < 1 ||
      newTimeStamp - player.stats.lastFireTime[player.stats.activeGun] <
        player.stats.bulletReloadTime[player.stats.activeGun]
    )
      return;

    /*
    console.log(
      newTimeStamp,
      player.stats.lastFireTime[player.stats.activeGun]
    );*/

    // Bullet is fired
    player.stats.ammo[player.stats.activeGun]--;
    player.stats.lastFireTime[player.stats.activeGun] = newTimeStamp;

    let rounds = 1;
    if (player.stats.shootDoubles) rounds = 2;

    for (let i = 0; i < rounds; i++) {
      let firetime = newTimeStamp - 30 * i; // to accomodate two bullets
      let bullet = new Bullet({ type: player.stats.activeGun });
      bullet.stats.strength *= 1 + player.stats.bulletsExtraStrength / 100;

      // Critical hit
      if (player.criticalHit()) bullet.stats.strength *= 2;

      // Quad damage
      if (player.stats.quadDamage) bullet.stats.strength *= 4;

      bullet.stats.id = RandomString();
      bullet.stats.firePlayer = player.id;
      bullet.stats.killer = player.stats.overwriteBulletFirePlayer.active
        ? player.stats.overwriteBulletFirePlayer.id
        : player.id;
      bullet.stats.fireTime = firetime;

      // For the bullet direction overwrite we check directly with the player stats,
      // before even receiving overwriten keys
      //console.log(player.playerName, player.stats.overwriteMouseAngle);
      if (
        player.stats.overwriteMouseAngle.active &&
        player.stats.overwriteMouseAngle.id in this.state.playerKeys
      ) {
        bullet.stats.curAngle = this.state.playerKeys[
          player.stats.overwriteMouseAngle.id
        ].keys.mouseAngle;
      } else {
        bullet.stats.curAngle = player.stats.mouseAngle;
      }

      bullet.stats.curX =
        player.getGunTipX(this.state) +
        (bullet.stats.curSizeX / 2) * Math.cos(bullet.stats.curAngle / 57.325);
      bullet.stats.curY =
        player.getGunTipY(this.state) +
        (bullet.stats.curSizeX / 2) * Math.sin(bullet.stats.curAngle / 57.325);

      /*  console.log(newTimeStamp, " bullet: ", bullet.curX, bullet.curY);
      console.log(
        newTimeStamp,
        " player tip: ",
        player.getGunTipX(this.state),
        player.getGunTipY(this.state)
      );*/

      bullet.stats.prevX = bullet.stats.curX;
      bullet.stats.prevY = bullet.stats.curY;

      // Bullets of our own player should be fired on client
      // TODO: Adjust this for watch only mode.
      if (
        !this.isClient ||
        this.isHost() ||
        player.id == this.state.thisPlayer
      ) {
        let fireType = bullet.stats.type == 1 ? "fire1" : "fire0";
        this.state.soundManager.addSound(fireType, {
          x: bullet.stats.curX,
          y: bullet.stats.curY,
          initTime: bullet.stats.fireTime,
          id: bullet.stats.id, // sound has the same id as the bullet that fired it,
          group: player.id + "_" + fireType, // same player can have different groups of sounds
          targetPlayer: player.id,
          stopGroup: true
        });
      }

      // TODO: We need to fire multiple bullets on one click proportional to timeElapsed.

      // Making sure that bullet is not hit immediately after the fire
      if (this.bulletHit(bullet, firetime).hit) return;

      this.addBullet(bullet);
    }
  }

  addBullet(bullet) {
    this.state.bullets[bullet.stats.id] = bullet;

    // These will be passed to the client instead of all of them
    if (!this.isClient || this.isHost())
      this.state.physicsStats.newBullets.push(bullet);
  }

  moveBullets(newTimeStamp) {
    let elapsedTime = newTimeStamp - this.state.timeStamp;
    // TODO: Need to emmit hit action, or exposion or smth
    let hitBullets = [];

    for (let key in this.state.bullets) {
      let bullet = this.state.bullets[key];

      if (bullet.stats.isStopped) continue;

      bullet.stats.prevX = bullet.stats.curX;
      bullet.stats.prevY = bullet.stats.curY;

      let angle = bullet.stats.curAngle;

      // TODO: This needs to be revised. What if bullet goes through a thin wall??
      bullet.stats.curX +=
        elapsedTime * bullet.stats.curSpeed * Math.cos(angle / 57.325);
      bullet.stats.curY +=
        elapsedTime * bullet.stats.curSpeed * Math.sin(angle / 57.325);
      let hit = this.bulletHit(bullet, newTimeStamp);
      if (hit.hit) {
        if (!(hit.object == "player" && bullet.stats.hitManyPlayers))
          hitBullets.push(bullet.stats.id);
        this.handleBulletExplosion(
          bullet,
          { object: hit.object, id: hit.id },
          newTimeStamp
        );
      } else {
        // Update bullet speed
        if (bullet.stats.weight == 0) continue;
        let speedX =
          bullet.stats.curSpeed * Math.cos(bullet.stats.curAngle / 57.325);
        let speedY =
          bullet.stats.curSpeed * Math.sin(bullet.stats.curAngle / 57.325);
        speedY -=
          elapsedTime * this.state.physicsStats.gravityG * bullet.stats.weight;

        // Sanitize if needed.
        /*if (Math.abs(speedX) <= 0.01) {
          bullet.stats.curSpeed = speedY;
          bullet.stats.curAngle = speedY > 0 ? -90 : 90;
          continue;
        }*/

        bullet.stats.curSpeed = Math.sqrt(speedX * speedX + speedY * speedY);
        bullet.stats.curAngle = GetAngle(speedX, 0, speedY, 0);
      }
    }

    for (let id of hitBullets) delete this.state.bullets[id];
  }

  instantKill(killer, target) {
    this.state.players[target].handleHit(
      10000,
      this.state.players[killer],
      this.state.timeStamp,
      "magic",
      this
    );
  }

  handleBulletExplosion(bullet, obj, timeStamp) {
    let killer = this.state.players[bullet.stats.killer];
    // Normal bullet (0) does not explode, it only hit players
    // Rockets (1) explode on colision, so we need to hit all the players in the radius
    if (bullet.stats.type == 0) {
      if (obj.object == "player")
        this.state.players[obj.id].handleHit(
          bullet.stats.strength,
          killer,
          timeStamp,
          "bullet",
          this
        );
      return;
    }

    // Rocket explosion
    let x = bullet.stats.curX;
    let y = bullet.stats.curY;

    // If we are on client send an explosion activity
    if (this.isClient) {
      this.onBulletExplosion({ type: 1, x: x, y: y });
      // TODO: This could be moved to gamePlay
      this.state.soundManager.addClientSound("explode1", {
        x: bullet.stats.curX,
        y: bullet.stats.curY,
        initTime: timeStamp,
        id: bullet.stats.id + "_explode1", // sound has the same id as the bullet that fired it
        group: "explosion_" + GetRand(5), //bullet.stats.id + "_explode1",
        targetPlayer: this.state.thisPlayer // this sound is for client player
      });
    }

    // We go through all the players and check how far are them from the explosion
    for (let key in this.state.players) {
      let player = this.state.players[key];
      if (player.stats.isDead || player.id == "shadow") continue;

      //(x, y, xLeft, xRight, yBottom, yTop)
      let distance = getDistFromBox(
        x,
        y,
        player.getLeftX(),
        player.getRightX(),
        player.getBottomY(),
        player.getTopY()
      );
      if (distance < bullet.stats.explosionRadius) {
        player.handleHit(
          bullet.stats.strength * (1 - distance / bullet.stats.explosionRadius),
          killer,
          timeStamp,
          "bullet",
          this
        );
      }
    }
  }

  onPlayerDead(player, killer, timeStamp) {
    if (this.isClient && !this.isHost()) return;
    this.state.soundManager.addSound("death", {
      x: player.getLeftX(),
      y: player.getBottomY(),
      initTime: timeStamp,
      id: RandomString(),
      group: player.id + "_death",
      global: true,
      targetPlayer: player.id
    });
    this.state.soundManager.addSound("kill", {
      x: player.getLeftX(),
      y: player.getBottomY(),
      initTime: timeStamp,
      id: RandomString(),
      group: killer.id + "_kill",
      global: true,
      targetPlayer: killer.id
    });

    // Some special sounds once in a while
    if (GetRand(3) == 0) {
      this.state.soundManager.addSound("humiliation", {
        x: player.getLeftX(),
        y: player.getBottomY(),
        initTime: timeStamp,
        id: RandomString(),
        group: player.id + "_humiliation",
        global: true,
        targetPlayer: player.id
      });
      let rnd = GetRand(3);
      let sound = rnd == 0 ? "impressive" : rnd == 1 ? "holyshit" : "excellent";
      this.state.soundManager.addSound(sound, {
        x: player.getLeftX(),
        y: player.getBottomY(),
        initTime: timeStamp,
        id: RandomString(),
        group: killer.id + "_impressive",
        global: true,
        targetPlayer: killer.id
      });
    }

    this.messageManager.createMessage(GetKillMessage(player, killer), 2000, 1);
  }

  onPlayerHit(player, killer, strength, timeStamp) {
    if (this.isClient && !this.isHost()) return;
    // Issue two sounds: one for the player who was shooting, and one for the victim
    this.state.soundManager.addSound("hit", {
      x: player.getLeftX(),
      y: player.getBottomY(),
      initTime: timeStamp,
      id: RandomString(),
      group: player.id + "_hit", // note: this has to be the victim's id as we will filter these sounds on client
      targetPlayer: killer.id,
      stopGroup: false // hits are too fast so we don't stop prev sound
    });
    // NOTE: We will not be playing the hit sound for the victim based on the group name.
    this.state.soundManager.addSound("gethit", {
      x: player.getLeftX(),
      y: player.getBottomY(),
      initTime: timeStamp,
      id: RandomString(),
      group: player.id + "_gethit", // all gethit from other players sounds will not be added on client
      targetPlayer: player.id,
      stopGroup: false // hits are too fast so we don't stop prev sound
    });
  }

  bulletHit(bullet, newTimeStamp) {
    // First check the timeToExplode
    if (newTimeStamp - bullet.stats.fireTime >= bullet.stats.timeToExplode)
      return { hit: true, object: "world" };

    // Check collisions with players except of the one that fired
    // TODO: Bounce from players
    for (let key in this.state.players) {
      if (key == "shadow") continue;
      if (this.state.players[key].stats.isDead) continue;

      // NOTE: Bullets don't hit players who fired them for the first second.
      if (
        key == bullet.stats.firePlayer &&
        newTimeStamp - bullet.stats.fireTime < 1000
      )
        continue;

      let player = this.state.players[key];
      // Probability to dodge
      if ((!this.isClient || this.isHost()) && player.dodgeBullet()) continue;
      // Intersect
      if (
        !player.stats.reflectsBullets &&
        bullet.stats.curX >= player.getLeftX() - bullet.stats.curSizeX / 2 &&
        bullet.stats.curX <= player.getRightX() + bullet.stats.curSizeX / 2 &&
        bullet.stats.curY >= player.getBottomY() - bullet.stats.curSizeY / 2 &&
        bullet.stats.curY <= player.getTopY() + bullet.stats.curSizeY / 2
      ) {
        return { hit: true, object: "player", id: player.id };
      } else if (player.stats.reflectsBullets) {
        let bounced = bullet.bounce(
          player.getLeftX() - bullet.stats.curSizeX / 2,
          player.getBottomY() - bullet.stats.curSizeY / 2,
          player.getRightX() + bullet.stats.curSizeX / 2,
          player.getTopY() + bullet.stats.curSizeY / 2
        );
        // TODO: Debug mario muchrooms too frequent bounce sound.
        if (bounced)
          this.state.soundManager.addClientSound("bounce", {
            x: bullet.stats.curX,
            y: bullet.stats.curY,
            initTime: newTimeStamp,
            id: RandomString(),
            group: bullet.stats.id + "_bounce",
            targetPlayer: bullet.stats.firePlayer,
            stopGroup: false // hits are too fast so we don't stop prev sound
          });
      }
    }

    // Check collisions with boxes
    // TODO: Think how to avoid bullet explosion from the side (sidebump?)
    // NOTE: even if bullets go through walls, they still explode on reaching end of map.
    // TODO: Bounce from walls.
    if (!bullet.stats.goThroughWalls) {
      for (let key in this.state.boxes) {
        let box = this.state.boxes[key];
        if (!box.stats.interactable) continue;
        // For plasma gun we let bullets through unless the box is the interfloor
        if (
          bullet.stats.type == 0 &&
          (box.stats.wall == undefined || !box.stats.wall)
        )
          continue;
        // TODO: Check if need bottom here for reversed gravity.
        if (
          !bullet.stats.bounceFromWalls &&
          // top
          (IntersectLines(
            bullet.stats.prevX,
            bullet.stats.prevY,
            bullet.stats.curX,
            bullet.stats.curY,
            box.getLeftX(newTimeStamp),
            box.getTopY(newTimeStamp) + bullet.stats.curSizeY / 2,
            box.getRightX(newTimeStamp),
            box.getTopY(newTimeStamp) + bullet.stats.curSizeY / 2
          ).intersect ||
            // bottom
            IntersectLines(
              bullet.stats.prevX,
              bullet.stats.prevY,
              bullet.stats.curX,
              bullet.stats.curY,
              box.getLeftX(newTimeStamp),
              box.getBottomY(newTimeStamp) - bullet.stats.curSizeY / 2,
              box.getRightX(newTimeStamp),
              box.getBottomY(newTimeStamp) - bullet.stats.curSizeY / 2
            ).intersect ||
            (box.stats.sideBump &&
              // left
              (IntersectLines(
                bullet.stats.prevX,
                bullet.stats.prevY,
                bullet.stats.curX,
                bullet.stats.curY,
                box.getLeftX(newTimeStamp) - bullet.stats.curSizeX / 2,
                box.getBottomY(newTimeStamp),
                box.getLeftX(newTimeStamp) - bullet.stats.curSizeX / 2,
                box.getTopY(newTimeStamp)
              ).intersect ||
                // right
                IntersectLines(
                  bullet.stats.prevX,
                  bullet.stats.prevY,
                  bullet.stats.curX,
                  bullet.stats.curY,
                  box.getRightX(newTimeStamp) + bullet.stats.curSizeX / 2,
                  box.getBottomY(newTimeStamp),
                  box.getRightX(newTimeStamp) + bullet.stats.curSizeX / 2,
                  box.getTopY(newTimeStamp)
                ).intersect)))
        ) {
          return { hit: true, object: "box", id: box.stats.id };
        }

        // bouncing
        if (
          bullet.stats.bounceFromWalls &&
          bullet.stats.curX >=
            box.getLeftX(newTimeStamp) - bullet.stats.curSizeX / 2 &&
          bullet.stats.curX <=
            box.getRightX(newTimeStamp) + bullet.stats.curSizeX / 2 &&
          bullet.stats.curY >=
            box.getBottomY(newTimeStamp) - bullet.stats.curSizeY / 2 &&
          bullet.stats.curY <=
            box.getTopY(newTimeStamp) + bullet.stats.curSizeY / 2
        ) {
          let bounced = bullet.bounce(
            box.getLeftX(newTimeStamp) - bullet.stats.curSizeX / 2,
            box.getBottomY(newTimeStamp) - bullet.stats.curSizeY / 2,
            box.getRightX(newTimeStamp) + bullet.stats.curSizeX / 2,
            box.getTopY(newTimeStamp) + bullet.stats.curSizeY / 2,
            {
              top: true,
              bottom: true,
              left: box.stats.sideBump,
              right: box.stats.sideBump
            }
          );
          if (bounced)
            this.state.soundManager.addClientSound("bounce", {
              x: bullet.stats.curX,
              y: bullet.stats.curY,
              initTime: newTimeStamp,
              id: RandomString(),
              group: bullet.stats.id + "_bounce",
              targetPlayer: bullet.stats.firePlayer,
              stopGroup: false // hits are too fast so we don't stop prev sound
            });
        }
      }
    }

    // Check collisions with the world
    if (
      bullet.stats.curX <= 0 + bullet.stats.curSizeX / 2 ||
      bullet.stats.curX >= this.state.worldWidth - bullet.stats.curSizeX / 2 ||
      bullet.stats.curY <= 0 + bullet.stats.curSizeY / 2 ||
      bullet.stats.curY >= this.state.worldHeight - bullet.stats.curSizeY / 2
    ) {
      if (!bullet.stats.bounceFromWalls) return { hit: true, object: "world" };
      else {
        let bounced = false;
        if (
          bullet.stats.curY >=
          this.state.worldHeight - bullet.stats.curSizeY / 2
        )
          // ceiling
          bounced |= bullet.bounce(
            0,
            this.state.worldHeight - bullet.stats.curSizeY / 2,
            this.state.worldWidth,
            this.state.worldHeight + 100
          );
        if (bullet.stats.curY <= 0 + bullet.stats.curSizeY / 2)
          // floor
          bounced |= bullet.bounce(
            0,
            -100,
            this.state.worldWidth,
            bullet.stats.curSizeY / 2
          );
        if (bullet.stats.curX <= 0 + bullet.stats.curSizeX / 2)
          // leftWall
          bounced |= bullet.bounce(
            -100,
            -10,
            0 + bullet.stats.curSizeX / 2,
            this.state.worldHeight
          );
        if (
          bullet.stats.curX >=
          this.state.worldWidth - bullet.stats.curSizeX / 2
        )
          // rightWall
          bounced |= bullet.bounce(
            this.state.worldWidth - bullet.stats.curSizeX / 2,
            -10,
            this.state.worldWidth + 100,
            this.state.worldHeight
          );
        if (bounced)
          this.state.soundManager.addClientSound("bounce", {
            x: bullet.stats.curX,
            y: bullet.stats.curY,
            initTime: newTimeStamp,
            id: RandomString(),
            group: bullet.stats.id + "_bounce",
            targetPlayer: bullet.stats.firePlayer,
            stopGroup: false // hits are too fast so we don't stop prev sound
          });
      }
    }

    return { hit: false };
  }

  moveBoxes(player, newTimeStamp) {
    for (var key in this.state.boxes) {
      let box = this.state.boxes[key];
      if (
        box.stats.linear == undefined ||
        (box.stats.linear.movey == 0 && box.stats.linear.movex == 0) ||
        box.stats.linear.movet == 0
      )
        continue;
      if (!box.stats.interactable) continue;

      this.skipBoxCheck = key;
      // First check for touching
      if (this.isPlayerTouchingBoxTop(player, box)) {
        player.stats.intendedMoveY =
          box.getTopY(newTimeStamp) - box.getTopY(this.state.timeStamp);
        player.stats.intendedMoveX =
          box.getLeftX(newTimeStamp) - box.getLeftX(this.state.timeStamp);
        this.tryMovePlayer(player);
      } else {
        // Now check if player was on the way of box move
        let newBoxLeftX = box.getLeftX(newTimeStamp);
        let curBoxLeftX = box.getLeftX(this.state.timeStamp);
        let newBoxRightX = box.getRightX(newTimeStamp);
        let curBoxRightX = box.getRightX(this.state.timeStamp);
        let curBoxTopY = box.getTopY(this.state.timeStamp);
        let newBoxTopY = box.getTopY(newTimeStamp);
        let curBoxBottomY = box.getBottomY(this.state.timeStamp);
        let newBoxBottomY = box.getBottomY(newTimeStamp);
        if (
          !(
            player.getLeftX() >= curBoxRightX ||
            player.getRightX() <= curBoxLeftX
          ) &&
          (curBoxTopY <= player.getBottomY() &&
            newBoxTopY >= player.getBottomY())
        ) {
          player.stats.intendedMoveY = newBoxTopY - player.getBottomY();
          this.tryMovePlayer(player);
        } else if (
          !(
            player.getTopY() <= curBoxBottomY ||
            player.getBottomY() >= curBoxTopY
          )
        ) {
          // box hits the player on the left
          if (
            curBoxRightX <= player.getLeftX() &&
            newBoxRightX >= player.getLeftX()
          ) {
            player.stats.intendedMoveX = newBoxRightX - player.getLeftX();
            this.tryMovePlayer(player);
          }
          // box hits the player on the right
          else if (
            curBoxLeftX >= player.getRightX() &&
            newBoxLeftX <= player.getRightX()
          ) {
            player.stats.intendedMoveX = newBoxLeftX - player.getRightX();
            this.tryMovePlayer(player);
          }
        }
      }
      this.skipBoxCheck = undefined;
    }
  }

  resetMagicKeys(playerId) {
    if (this.state.playerKeys[playerId] == undefined) return;
    // NOTE: We no longer reset player keys on the client.
    //this.state.playerKeys[playerId].keys.resetMagicKeys();
  }

  resetAllKeys(playerId) {
    if (this.state.playerKeys[playerId] == undefined) return;
    this.state.playerKeys[playerId].keys.resetAllKeys();
  }

  fetchServerState() {
    if (!this.isClient) return;
    // NOTE: This function no longer fetches, it only sends keys.
    // Set the clientX and clientY positions in the keys.
    let player = this.state.players[this.state.thisPlayer];
    let playerKeys = this.state.playerKeys[this.state.thisPlayer];

    if (
      player == undefined ||
      playerKeys == undefined ||
      this.serverStateFetcher == undefined
    ) {
      setTimeout(this.fetchServerState.bind(this), 50);
      return;
    }

    let keys = playerKeys.keys;
    if (keys == undefined) keys = new Keys();

    keys.clientX = Math.floor(player.getLeftX());
    keys.clientY = Math.floor(player.getBottomY());
    keys.clientSpeedX = player.stats.speedX;
    keys.clientSpeedY = player.stats.speedY;

    // NOTE: We don't care about keys timestamp on client,
    // and passing the current timestamp to server.
    this.serverStateFetcher.sendKeys(keys, this.state.timeStamp);

    // NOTE: We cannot reset keys in the update state for client, because need to make sure
    // that current set of keys has been also sent to the server.
    this.resetMagicKeys(this.state.thisPlayer);

    // Client syncs with server every 50ms
    setTimeout(this.fetchServerState.bind(this), 50);
  }

  interpolateStateWithServer() {
    if (this.serverState == undefined) return;
    // Use the latest serverState next to interpolate the current state.
    // TODO: Current player should be interpolated differently from others

    // Copy all the world properties.
    this.state.physicsStats = this.serverState.physicsStats;
    // NOTE: Immediately handle extra boxes to avoid overwrite.
    this.handleExtraBoxes();
    // NOTE: Be careful, serverTimeStamp is not set on host for serverless games.
    this.state.serverTimeStamp = this.serverState.timeStamp;

    // If the server time is in the future we set the client timeStamp to follow the server time.
    // NOTE: This will happen on the start up
    if (
      !this.timeStampIsSet ||
      this.state.serverTimeStamp > this.state.timeStamp
    ) {
      if (!this.timeStampIsSet) this.timeStampIsSet = true;
      // initTime is initialized so that newTimeStamp = GetTime - initTime indicates the server time.
      this.initTime = GetTime() - this.state.serverTimeStamp;
      this.state.timeStamp = this.state.serverTimeStamp;
    }
    /*
    console.log(
      "Server: " +
        this.state.serverTimeStamp +
        " Client: " +
        this.state.timeStamp
    );
    */
    // Checking for new players
    let serverPlayers = this.serverState.players;
    for (var key in serverPlayers) {
      let forceGeometry =
        serverPlayers[key].stats.forceClientGeometry.active ||
        this.myGameTime < 500; // force all the geometry for other players if we jsut joined the game
      //console.log(this.myGameTime);
      //console.log(this.state.serverTimeStamp + " " + key);
      // Case1: new player
      let isNewPlayer = false;
      if (!(key in this.state.players)) {
        this.addPlayerToState(
          key,
          {
            avatar: serverPlayers[key].avatar,
            playerName: serverPlayers[key].playerName,
            playerLink: serverPlayers[key].playerLink
          },
          serverPlayers[key].stats
        );
        this.state.players[key].geometry = new Geometry(
          serverPlayers[key].geometry
        );
        isNewPlayer = true;
      }
      // Case2: existing players
      else {
        // FIRST UPDATE PLAYERS AVATARS IF NEEDED (FOR RANDOM GAME MODE)
        if (this.state.players[key].avatar != serverPlayers[key].avatar) {
          /*console.log(
            "Updated avatar for " +
              key +
              ": " +
              this.state.players[key].avatar +
              " => " +
              serverPlayers[key].avatar
          );*/
          this.state.players[key].avatar = serverPlayers[key].avatar;
          // Update magic IDs of this player (no need to update others)
          if (key == this.state.thisPlayer) {
            this.state.players[key].stats.magicId = GetAvatarSpellSet(
              this.state.players[key].avatar
            );
          }
        }

        // Our player has been revived on the server, copy its position
        // UPDATE: Or if position is forced
        if (
          key == this.state.thisPlayer &&
          this.state.players[key].stats.isDead &&
          !serverPlayers[key].stats.isDead
        ) {
          //if (forceGeometry) console.log("forcing");
          this.state.players[key].geometry = new Geometry(
            serverPlayers[key].geometry
          );
          this.state.players[key].setStats(serverPlayers[key].stats, true);
        } else {
          // If not reviving || its an other player set the stats
          this.state.players[key].setStats(
            serverPlayers[key].stats,
            false /*do not set position*/
          );
          // TODO: Should we forcegeometry for the watchOnly?
          if (forceGeometry) {
            //if (forceGeometry) console.log("forcing");
            this.state.players[key].geometry = new Geometry(
              serverPlayers[key].geometry
            );
            this.temporalPhysics.forceGeometryInAllStates(
              this.state.players[key]
            );
          }
        }
        // Set aim for other players
        if (this.watchOnly || key != this.state.thisPlayer) {
          let playerKeys = this.getPlayerKeys(key);
          if (playerKeys != undefined) {
            if (playerKeys.mouseAngle != undefined)
              this.state.players[key].stats.mouseAngle = playerKeys.mouseAngle; // mouseAngle, activeGun
            if (playerKeys.activeGun != undefined)
              this.state.players[key].stats.activeGun = playerKeys.activeGun;
          }
        }
      }

      //console.log(forceGeometry, this.state.players[key]);
      /*  console.log(
        this.state.timeStamp,
        forceGeometry,
        JSON.stringify(this.state.players[key])
      );*/

      // Update geometry
      if (
        (this.watchOnly || key != this.state.thisPlayer) &&
        this.temporalPhysics.states.length > 0
      ) {
        let remotePlayer = new Player(
          "remoteplayer",
          {},
          serverPlayers[key].stats
        );
        remotePlayer.geometry = new Geometry(serverPlayers[key].geometry);
        this.interpolateRemotePlayerKeys(
          key /*playerId*/,
          forceGeometry || isNewPlayer /*forceGeometry*/, // also force geometry for new players
          remotePlayer,
          this.state.playerKeys[key].timeStamp
        );
      }
      /*console.log(
        this.state.timeStamp,
        forceGeometry,
        JSON.stringify(this.state.players[key])
      );*/
    }

    // Checking for players that left
    for (var key in this.state.players) {
      if (!(key in serverPlayers) && key != "shadow")
        this.removePlayerFromState(key);
    }

    // HANDLING BULLETS
    // We have to skip bullets that have been already added to the game
    // We have to skip THIS player's bullets
    // All the explosions are generated on client based on bulelt trajectory
    // We will eventually optimize the bullets out and do not constantly send them with the game state
    // TODO: Do we need to care about bullets that exploded on server?
    let bullets = this.serverState.physicsStats.newBullets;
    for (var bullet of bullets) {
      // NOTE: Since bullets can be bombs we should update them also
      if (
        !this.watchOnly &&
        bullet.stats.firePlayer == this.state.thisPlayer &&
        !bullet.stats.overwriteSelfBulletsByServer // fired bullets are already displayed by client
      )
        continue;
      //console.log(this.state.timeStamp, bullet.id);
      if (this.state.bullets[bullet.stats.id] != undefined) continue;
      let toAdd = new Bullet(bullet.stats);
      this.addBullet(toAdd);
    }

    // PERKS
    this.state.perks = this.serverState.perks;

    // Timers
    this.state.timers = this.serverState.timers;

    // Message
    if (this.serverState.gameMessage != undefined)
      this.state.gameMessage = this.serverState.gameMessage;
    // TODO: This is a hack to display bad WS message when web socket is lagging
    this.serverState.gameMessage = undefined;

    // Sounds
    // TODO: If player is dead should lower the volume
    for (let key in this.serverState.sounds) {
      // Sounds emited by the gun of the local player
      let newSound = this.serverState.sounds[key];
      if (
        (newSound.global &&
          newSound.targetPlayer != "" &&
          newSound.targetPlayer != this.state.thisPlayer) ||
        newSound.group == this.state.thisPlayer + "_fire0" ||
        newSound.group == this.state.thisPlayer + "_fire1" || // filtering gun fires as they are handled on client
        newSound.group == this.state.thisPlayer + "_hit" || // NOTE: filtering the hit sounds for this player
        (newSound.group.includes("_gethit") &&
          newSound.group != this.state.thisPlayer + "_gethit") || // NOTE: filtering the gethit from other players
        (newSound.group.includes("_hit") &&
          newSound.targetPlayer != this.state.thisPlayer) // NOTE: filtering the hit sounds between other players
      )
        continue;
      this.state.soundManager.copySound(newSound);
    }

    if (this.firstMapInterpolation) this.firstMapInterpolation = false;
  }

  interpolateRemotePlayerKeys(
    playerId,
    forceGeometry,
    remotePlayer, // note: remotePlayer here is of type Player!
    timeStamp
  ) {
    // Update geometry
    // NOTE: we use the following smoothing strategy:
    // with 10% probability directly assign the geometry to the player
    // with 90% probability interpolate 10%
    // If geometry has been forced we do not apply temporal physics
    // TODO: Should we force geometry inside temporal?

    let keys = this.getPlayerKeys(playerId);
    //if (playerId != this.state.thisPlayer) console.log(playerId, keys);
    if (keys == undefined) keys = new Keys();
    let geometry = new Geometry(remotePlayer.geometry);

    // NOTE: This is a hack
    if (forceGeometry) {
      keys.clientX = geometry.getLeftX();
      keys.clientY = geometry.getBottomY();
      // NOTE: We do not pass the speed any longer
      //keys.clientSpeedX = remotePlayer.stats.speedX;
      //keys.clientSpeedY = remotePlayer.stats.speedY;
    } else {
      remotePlayer.setLeftX(keys.clientX);
      remotePlayer.setBottomY(keys.clientY);
      geometry.setLeftX(keys.clientX);
      geometry.setBottomY(keys.clientY);
    }

    let prob = GetRand(100);
    let appliedStats = false;
    let upperStats = this.temporalPhysics.getUpperBoundStats(
      timeStamp,
      playerId
    );
    // UPDATE2: Only apply when both remote version and local versions are touching grounds!
    // Because otherwise jumps look funny.
    let touchLocal = this.isPlayerTouchingFloor(this.state.players[playerId]);
    let touchRemote = this.isPlayerTouchingFloor(remotePlayer, timeStamp);
    if (
      forceGeometry ||
      this.state.players[playerId].syncGeometryPending == true ||
      (prob < 2 ||
        (prob > 90 &&
          (this.isGeometryVeryDifferent(upperStats, {
            x: keys.clientX,
            y: keys.clientY
          }) ||
            this.isSpeedVeryDifferent(upperStats, {
              speedX: keys.clientSpeedX,
              speedY: keys.clientSpeedY
            }))))
    ) {
      // If player is touching floor, or geometry is forced we apply it, or in ranodm rare case
      if (
        prob == 0 ||
        forceGeometry ||
        (touchLocal.touch && touchRemote.touch)
      ) {
        //console.log(this.state.timeStamp + " touching " + touch.type);
        this.temporalPhysics.applyTemporalStats(playerId, timeStamp, {
          x: keys.clientX,
          y: keys.clientY,
          speedX: keys.clientSpeedX,
          speedY: keys.clientSpeedY
        });
        appliedStats = true;
        this.state.players[playerId].syncGeometryPending = false;
      } else {
        this.state.players[playerId].syncGeometryPending = true;
      }
    }

    if (!appliedStats && keys != undefined) {
      this.temporalPhysics.applyTemporalKeys(
        playerId,
        // NOTE: Applying the keys at the keys time stamp looks bad.
        // So we sacrifise a little precision in favor of UX.
        // We check once in a while that state is consistent.
        this.temporalPhysics.states[
          Math.max(0, this.temporalPhysics.states.length - 2)
        ].timeStamp, //otherKeys.timeStamp,
        keys
      );
    }

    let latestStats = this.temporalPhysics.getTheNewestPlayerStats(playerId);
    // NOTE: For host remote player is just a regular player so we copy stats here.
    // On client remotePlayer is serverPlayer, so all the sizes, etc will be adjusted here
    // NOTE: If we force geometry then it has been already applied.
    // All this interpolation is just to backfill all the temporal states.
    if (latestStats != undefined) {
      geometry.setLeftX(latestStats.x);
      geometry.setBottomY(latestStats.y);
      // TODO: Consider setting speed here as well.
    }
    this.state.players[playerId].geometry = geometry;
  }

  doesPlayerDodgeMagic(key) {
    let player = this.state.players[key];
    if (player == undefined) return true;
    return player.dodgeMagic();
  }

  startDeadBeef(casterId) {
    // For each player except of the player that casted the spell
    this.deadbeefState = {
      active: true,
      casterId: casterId,
      damageRate: 0.005,
      players: {}
    }; // rate is hp per ms

    for (let key in this.state.players) {
      if (
        key == casterId ||
        key == "shadow" ||
        this.state.players[key].stats.isCopy.active ||
        this.doesPlayerDodgeMagic(key)
      )
        continue;
      this.deadbeefState.players[key] = 0; // init state
    }
  }

  stopDeadBeef() {
    this.deadbeefState = { active: false, players: {} };
  }

  deadbeefUpdateState(elapsedTime) {
    if (this.deadbeefState == undefined || this.deadbeefState.active != true)
      return;
    for (let key in this.deadbeefState.players) {
      if (this.state.players[key] == undefined) continue;
      let playerState = this.deadbeefState.players[key];
      if (playerState == 4) continue;

      this.state.players[key].handleHit(
        elapsedTime * this.deadbeefState.damageRate,
        this.state.players[this.deadbeefState.casterId],
        this.state.timeStamp,
        "magic",
        this
      );
      if (playerState == 0 && this.state.playerKeys[key].keys.rightKey)
        this.deadbeefState.players[key] = 1;
      // D
      else if (playerState == 1 && this.state.playerKeys[key].keys.magic2)
        this.deadbeefState.players[key] = 2;
      // E
      else if (playerState == 2 && this.state.playerKeys[key].keys.leftKey)
        this.deadbeefState.players[key] = 3;
      // A
      else if (playerState == 3 && this.state.playerKeys[key].keys.rightKey)
        this.deadbeefState.players[key] = 4;
      // D
    }
  }

  isSpeedVeryDifferent(stats1, stats2) {
    return (
      Math.abs(stats1.speedX - stats2.speedX) > 0.5 ||
      Math.abs(stats1.speedY - stats2.speedY) > 0.5
    );
  }

  isGeometryVeryDifferent(geo1, geo2) {
    return Math.abs(geo1.x - geo2.x) > 100 || Math.abs(geo1.y - geo2.y) > 100;
  }

  onNewServerState(state, requestTimeStamp) {
    if (this.isHost()) return;
    //console.log(state);
    // With websockets requestTimeStamp is simply a server timeStamp
    if (requestTimeStamp == undefined) {
      requestTimeStamp = state.timeStamp;
    }
    // TODO: Assert this.isClient
    // TODO: Check for timestamp here.
    this.serverState = state;
    this.state.serverDelay = this.state.timeStamp - requestTimeStamp;

    if (!this.initComplete) {
      this.initComplete = true;
      // We start client update state machine once we get server state to interpolate with.
      this.updateState();
      this.onReady();
    }
  }

  getPlayersDistance(id1, id2) {
    if (
      !(id1 in this.playerDistanceMap) ||
      !(id2 in this.playerDistanceMap[id1])
    )
      return 0;
    return this.playerDistanceMap[id1][id2];
  }

  handlePlayerInputY(elapsedTime, player, keys, temporal) {
    if (
      keys != undefined &&
      keys.upKey &&
      (player.stats.canFly ||
        (this.isPlayerTouchingFloor(player).touch && player.stats.speedY == 0))
    ) {
      // Player is jumping
      player.stats.speedY =
        this.state.physicsStats.gravityG > 0
          ? player.stats.origSpeedY
          : -player.stats.origSpeedY;
      // emoji jump
      if (player.stats.emojiJump) player.setHp(player.stats.hp + 1);
      // NOTE: All the moving sounds are handled on the client side
      if (temporal != true && this.isClient) {
        this.state.soundManager.addClientSound("jump", {
          x: player.getLeftX(),
          y: player.getBottomY(),
          initTime: this.state.timeStamp,
          id: RandomString(),
          group: player.id + "_jump",
          targetPlayer: this.state.thisPlayer // this sound is targetted for the client
        });
      }
    }
    player.stats.speedY -= this.state.physicsStats.gravityG * elapsedTime;

    player.stats.intendedMoveY = player.stats.speedY * elapsedTime;
    //console.log("y: " + player.stats.intendedMoveY);
  }

  handlePlayerInputX(elapsedTime, player, keys, temporal) {
    if (keys != undefined) {
      if (keys.leftKey && !keys.rightKey)
        player.stats.speedX = -(
          player.stats.origSpeedX + player.stats.magicSpeedX
        );
      else if (keys.rightKey && !keys.leftKey)
        player.stats.speedX =
          player.stats.origSpeedX + player.stats.magicSpeedX;
      else player.stats.speedX = 0;
    }

    player.stats.intendedMoveX =
      (player.stats.speedX + player.stats.extraSpeedX) * elapsedTime;

    // Right Wing magic
    if (
      this.state.physicsStats.rightWing.active &&
      this.state.physicsStats.rightWing.killer != player.id &&
      !this.client &&
      keys != undefined &&
      keys.leftKey
    ) {
      // TODO: Add dodge magic here?
      // TODO: Should this be not per key press but per move direction?
      player.handleHit(
        elapsedTime * 0.02,
        this.state.players[this.state.physicsStats.rightWing.killer],
        this.state.timeStamp,
        "magic",
        this
      );
    }

    // If player is flying we return.
    if (player.stats.canFly) {
      player.clientStats.isWalking = false;
      return;
    }

    // Air friction
    // NOTE: We do not slow down player in the air.
    // Only slow player down if he is touching floor.
    let touch = this.isPlayerTouchingFloor(player);

    if (temporal != true && this.isClient) {
      // Player is walking sound
      player.clientStats.isWalking =
        touch.touch &&
        keys.leftKey ^ keys.rightKey &&
        Math.abs(player.stats.speedX) > 0.3;
    }

    if (
      player.stats.extraSpeedX != 0 &&
      touch.touch &&
      !player.stats.onSpring // original spring might slow down
    ) {
      //console.log(player.id + " touching + " + touch.id);
      let positive = player.stats.extraSpeedX > 0;
      player.stats.extraSpeedX -=
        (positive ? 1 : -1) * player.stats.extraSpeedXDecay * elapsedTime;
      if (positive == player.stats.extraSpeedX < 0)
        player.stats.extraSpeedX = 0;
    } else if (player.stats.onSpring) player.stats.onSpring = false;
    //console.log("x: " + player.stats.intendedMoveX);
    //console.log(player.id + " " + player.stats.extraSpeedX);
  }

  isPlayerTouchingBoxTop(player, box, overrideTime) {
    if (player.stats.canFly) return false;
    let time = overrideTime == undefined ? this.state.timeStamp : overrideTime;
    if (this.state.physicsStats.gravityG > 0)
      return (
        !(
          player.getLeftX() >= box.getRightX(time) ||
          player.getRightX() <= box.getLeftX(time)
        ) && box.getTopY(time) == player.getBottomY()
      );
    else {
      //  NOTE: When gravity is negative we skip everything except floors
      if (!box.stats.reverseGravityBump) return false;
      return (
        !(
          player.getLeftX() >= box.getRightX(time) ||
          player.getRightX() <= box.getLeftX(time)
        ) && box.getBottomY(time) == player.getTopY()
      );
    }
  }

  isPlayerTouchingFloor(player, overrideTime) {
    if (player.stats.canFly) return { touch: false };
    if (
      (this.state.physicsStats.gravityG > 0 &&
        player.getBottomY() == this.state.floorY) ||
      (this.state.physicsStats.gravityG <= 0 &&
        player.getTopY() == this.state.floorY + this.state.worldHeight)
    ) {
      return { touch: true, type: "floor" };
    }

    for (let key in this.state.boxes) {
      let box = this.state.boxes[key];
      if (this.isPlayerTouchingBoxTop(player, box, overrideTime)) {
        return { touch: true, type: "box", id: box.stats.id };
      }
    }
    return { touch: false };
  }

  playerCollideBoxY(player, box) {
    if (player.stats.canFly) return false;
    // NOTE: Only between floors walls are interacting when gravity is reversed
    if (this.state.physicsStats.gravityG <= 0 && !box.stats.reverseGravityBump)
      return false;
    var curY = player.getBottomY();
    var intY = curY + player.stats.intendedMoveY;
    var leftX = player.getLeftX();
    var rightX = player.getRightX();
    return (
      !(
        leftX >= box.getRightX(this.state.timeStamp) ||
        rightX <= box.getLeftX(this.state.timeStamp)
      ) &&
      ((this.state.physicsStats.gravityG > 0 &&
        curY >= box.getTopY(this.state.timeStamp) &&
        intY <= box.getTopY(this.state.timeStamp)) ||
        (this.state.physicsStats.gravityG <= 0 &&
          curY + player.getH() <= box.getBottomY(this.state.timeStamp) &&
          intY + player.getH() >= box.getBottomY(this.state.timeStamp)))
    );
  }

  playerCollideWorldY(player) {
    //console.log("collideY");
    var curY = player.getBottomY();
    var intY = curY + player.stats.intendedMoveY;
    var leftX = player.getLeftX();
    var rightX = player.getRightX();

    // Checking boxes first
    var ret = false;
    var maxY =
      this.state.physicsStats.gravityG > 0 ? 0 : this.state.worldHeight;

    // Spell 4D
    if (!this.state.physicsStats.breakWalls && !player.stats.canFly) {
      for (let key in this.state.boxes) {
        let box = this.state.boxes[key];
        if (key == this.skipBoxCheck) continue;
        if (!box.stats.interactable) continue;
        if (this.playerCollideBoxY(player, box)) {
          if (this.state.physicsStats.gravityG > 0)
            maxY = Math.max(maxY, box.getTopY(this.state.timeStamp));
          else
            maxY = Math.min(
              maxY,
              box.getBottomY(this.state.timeStamp) - player.getH()
            );
          ret = true;
        }
      }
    }

    // Mario spell jump and kill
    let finalVictim = undefined;
    if (player.stats.jumpAndKill) {
      for (let victimId in this.state.players) {
        let victim = this.state.players[victimId];
        if (victim.stats.isDead) continue;
        if (this.playerCollideBoxY(player, victim)) {
          if (this.state.physicsStats.gravityG > 0) {
            if (maxY <= victim.getTopY()) {
              finalVictim = victimId;
              maxY = victim.getTopY();
            }
          } else {
            if (maxY >= victim.getBottomY() - player.getH()) {
              finalVictim = victimId;
              maxY = victim.getBottomY() - player.getH();
            }
            ret = true;
          }
        }
      }
    }

    if (finalVictim != undefined) {
      // TODO: Add some sound or video effect here!!!!!
      //console.log(finalVictim);
      this.instantKill(player.id, finalVictim);
    }

    if (ret) {
      player.setBottomY(maxY);
      return true;
    }

    // Checking top of the world
    if (intY + player.getH() >= this.state.worldHeight) {
      player.setBottomY(this.state.worldHeight - player.getH());
      return true;
    }

    // Checking bottom of the world last
    if (intY <= 0) {
      player.setBottomY(0);
      return true;
    }

    player.setBottomY(intY);
    return false;
  }

  playerCollideWorldX(player) {
    //console.log("collideX");
    var curX = player.getLeftX();
    var intX = curX + player.stats.intendedMoveX;
    var bottomY = player.getBottomY();
    var topY = player.getTopY();

    // Moving to the right
    if (player.stats.intendedMoveX > 0) {
      // Box collision
      var minX = this.state.worldWidth;
      var ret = false;
      if (!player.stats.canFly)
        for (let key in this.state.boxes) {
          let box = this.state.boxes[key];
          if (key == this.skipBoxCheck) continue;
          if (!box.stats.interactable) continue;
          // NOTE: Most of the boxes are not side-bumpable
          if (!box.stats.sideBump) continue;
          if (
            !(
              bottomY >= box.getTopY(this.state.timeStamp) ||
              topY <= box.getBottomY(this.state.timeStamp)
            ) &&
            curX + player.getW() <= box.getLeftX(this.state.timeStamp) &&
            intX + player.getW() >= box.getLeftX(this.state.timeStamp)
          ) {
            minX = Math.min(minX, box.getLeftX(this.state.timeStamp));
            ret = true;
          }
        }
      if (ret) {
        player.setLeftX(minX - player.getW());
        return true;
      }
      // Checking world last
      if (intX + player.getW() >= this.state.worldWidth) {
        player.setLeftX(this.state.worldWidth - player.getW());
        return true;
      }
    } else {
      // Moving to the left
      // Box collision
      var maxX = 0;
      var ret = false;
      if (!player.stats.canFly)
        for (let key in this.state.boxes) {
          let box = this.state.boxes[key];
          if (key == this.skipBoxCheck) continue;
          if (!box.stats.interactable) continue;
          if (!box.stats.sideBump) continue;
          if (
            !(
              bottomY >= box.getTopY(this.state.timeStamp) ||
              topY <= box.getBottomY(this.state.timeStamp)
            ) &&
            curX >= box.getRightX(this.state.timeStamp) &&
            intX <= box.getRightX(this.state.timeStamp)
          ) {
            maxX = Math.max(maxX, box.getRightX(this.state.timeStamp));
            ret = true;
          }
        }
      if (ret) {
        player.setLeftX(maxX);
        return true;
      }
      // Check world
      if (intX <= 0) {
        player.setLeftX(0);
        return true;
      }
    }
    player.setLeftX(intX);
    return false;
  }

  tryMovePlayer(player, temporal) {
    if (player.stats.intendedMoveX != 0)
      if (this.playerCollideWorldX(player)) {
        player.stats.speedX = 0;
        player.stats.extraSpeedX = 0;
      }

    if (player.stats.intendedMoveY != 0)
      if (this.playerCollideWorldY(player)) {
        // Sound of hitting the floor if the hitting speed was large
        // NOTE: All the moving sounds are handled on the client side
        if (
          temporal != true &&
          this.isClient &&
          Math.abs(player.stats.speedY) > 1
        ) {
          this.state.soundManager.addClientSound("land", {
            x: player.getLeftX(),
            y: player.getBottomY(),
            initTime: this.state.timeStamp,
            id: RandomString(),
            group: player.id + "_land",
            targetPlayer: this.state.thisPlayer
          });
        }

        player.stats.speedY = 0;
      }

    player.stats.intendedMoveX = 0;
    player.stats.intendedMoveY = 0;
  }

  tryTeleport(player, keys, temporal) {
    // Maybe player has already been directed to teleport
    // TODO: We should somehow do it on server to avoid cheating
    //if (keys.downKey) console.log(player);
    if (!player.stats.teleportTo.active) {
      if (
        keys == undefined ||
        !keys.downKey ||
        this.state.timeStamp - player.stats.lastSitTime <
          player.stats.sitReloadTime
      )
        return;

      //console.log(player.stats.lastSitTime + " " + player.stats.sitReloadTime);
      for (let key in this.state.boxes) {
        let box = this.state.boxes[key];
        if (!box.stats.interactable) continue;
        if (box.stats.type != "teleport") continue;
        if (this.isPlayerTouchingBoxTop(player, box)) {
          // Player has touched teleport
          let dest = this.state.boxes[box.stats.extra["dest"]];
          let x = dest.getLeftX(this.state.timeStamp) + box.getW() / 2; // middle
          let y = dest.getTopY(this.state.timeStamp);
          player.stats.teleportTo = { active: true, x: x, y: y };
          player.stats.lastSitTime = this.state.timeStamp;
          //console.log(box.id + " " + this.state.timeStamp);

          // TODO: Do it on server only once this logic actually moves to server
          if (temporal != true && this.isClient) {
            this.state.soundManager.addClientSound("teleport", {
              x: x, // destination coordinates
              y: y,
              initTime: this.state.timeStamp,
              id: RandomString(),
              group: player.id + "_teleport",
              targetPlayer: this.state.thisPlayer,
              global: true
            });
          }

          break;
        }
      }
    }
    if (!player.stats.teleportTo.active) return;
    player.setBottomY(player.stats.teleportTo.y);
    player.setLeftX(player.stats.teleportTo.x);
    player.stats.teleportTo = { active: false, x: 0, y: 0 };
  }

  trySpring(player, temporal) {
    player.stats.onSpring = false;
    for (let key in this.state.boxes) {
      let box = this.state.boxes[key];
      if (!box.stats.interactable) continue;
      if (box.stats.type != "spring") continue;
      if (this.isPlayerTouchingBoxTop(player, box)) {
        //console.log("spring " + box.id);
        player.stats.extraSpeedX = box.stats.extra.speedX;
        player.stats.speedY = box.stats.extra.speedY;
        player.stats.onSpring = true;
        //console.log(box.stats.extra.speedX, box.stats.extra.speedY);

        // TODO: Move it to server only
        if (temporal != true && this.isClient) {
          this.state.soundManager.addClientSound("spring", {
            x: player.getLeftX(),
            y: player.getBottomY(),
            initTime: this.state.timeStamp,
            id: RandomString(),
            group: player.id + "_spring",
            targetPlayer: this.state.thisPlayer
          });
        }

        break;
      }
    }
  }

  rechargePlayer(player, elapsedTime) {
    if (this.isClient && !this.isHost()) return;
    player.rechargeAmmo(elapsedTime);
    player.heal(elapsedTime);
  }

  movePlayer(elapsedTime, player, keys, temporal) {
    //console.log(player.id, keys, temporal);
    if (keys == undefined) return; // Might happen at the very beginning
    this.handlePlayerInputY(elapsedTime, player, keys, temporal);
    this.handlePlayerInputX(elapsedTime, player, keys, temporal);
    this.tryMovePlayer(player, temporal);
    if (!player.stats.canFly) {
      this.tryTeleport(player, keys, temporal);
      this.trySpring(player, temporal);
    }
    this.rechargePlayer(player, elapsedTime);
  }

  // NOTE: This function is to pick avatar first, and then add player to the state.
  tryAddPlayerToState(playerId, playerInfo) {
    let desiredAvatar = playerInfo.avatar;
    let res = this.getFreeAvatar(desiredAvatar);
    //console.log(res);
    if (res.success != true || res.avatar == undefined)
      return { success: false };
    playerInfo.avatar = res.avatar;
    this.addPlayerToState(playerId, playerInfo);
    //console.log("Added player " + playerId + " with avatar " + res.avatar);
    return { success: true, avatar: res.avatar };
  }

  getFreeAvatar(desiredAvatar) {
    // check that the avatar is allowed to be added
    let allAvatars = GetHeroList();
    let randomPlayers = this.initState.gameOptions.randomPlayers;
    let uniquePlayers = this.initState.gameOptions.uniquePlayers;
    let maxPlayers = this.initState.gameOptions.maxPlayers;
    let avatars = {};
    let playerNum = 0;
    Object.keys(this.state.players).map(key => {
      // TODO: Remove shadow
      // TODO: Should we check for the copy property here as well?
      if (key != "shadow" && !this.state.players[key].stats.isCopy.active) {
        avatars[this.state.players[key].avatar] = true;
        playerNum++;
      }
    });
    let success = false;
    // All avatars have been taken
    if (
      playerNum >= maxPlayers ||
      (uniquePlayers && Object.keys(avatars).length + 1 >= allAvatars.length)
    )
      return { success: false };

    if (desiredAvatar == "random" || randomPlayers) {
      if (uniquePlayers) {
        let idx = GetRand(allAvatars.length - 1 - Object.keys(avatars).length);
        for (let i = 0; i < allAvatars.length - 1; i++) {
          if (avatars[allAvatars[i][0]]) continue;
          if (idx == 0) {
            success = true;
            desiredAvatar = allAvatars[i][0];
            break;
          }
          idx--;
        }
      } else {
        desiredAvatar = allAvatars[GetRand(allAvatars.length - 1)][0];
        success = true;
      }
    } else {
      if (!uniquePlayers || avatars[desiredAvatar] == undefined) success = true;
    }
    return { success: success, avatar: desiredAvatar };
  }
}

export default Physics;
