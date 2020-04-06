import Keys from "./keys";
import {
  GetTime,
  CustomDeserializeMessage,
  CustomSerializeMessage,
  DeserializeKeys,
  DeserializeState
} from "./utils";

const zlib = require("zlib");

// Either to use json or to use proto encoding.
const test_json = false;

class ServerStateFetcher {
  constructor(
    physics,
    gameBaseUrl,
    gameHash,
    gamePass,
    userId,
    userPass,
    watchOnly,
    wsUrl,
    onNewState,
    onNewKeys,
    onNewChatMessage,
    setHost
  ) {
    this.physics = physics;
    this.gameBaseUrl = gameBaseUrl;
    this.gameHash = gameHash;
    this.serverGamePass = gamePass;
    this.userId = userId;
    this.userPass = userPass;
    this.watchOnly = watchOnly;
    this.wsUrl = wsUrl;
    this.onNewState = onNewState;
    this.onNewKeys = onNewKeys;
    this.onNewChatMessage = onNewChatMessage;
    this.setHost = setHost;
    this.initWs();
    if (this.physics.isHost()) this.sendHostReady();
    this.lastMessageTime = GetTime();

    if (test_json) {
      this.start = GetTime();
      this.accumulate = 0;
      this.printStats();
    }
  }

  sendHostReady() {
    if (!this.wsOpened) {
      setTimeout(() => this.sendHostReady(), 50);
      return;
    }
    this.sendWsMessage("onHostReady", this.userId, "");
  }

  initWs() {
    this.wsOpened = false;
    let fullUrl =
      this.wsUrl + "?playerId=" + this.userId + "&playerPass=" + this.userPass;
    this.ws = new WebSocket(fullUrl); //, "protocol_string_used_as_auth"); //path: '/ws'
    this.ws.binaryType = "arraybuffer";
    this.ws.onopen = () => this.onWsOpen();
    this.ws.onclose = () => this.onWsClose();
    this.ws.onmessage = e => this.onWsMessage(e);
  }

  onWsOpen() {
    // TODO: Parse the errors here.
    this.wsOpened = true;
  }

  onWsClose() {
    this.physics.onWsDisconnected();
  }

  onWsLagging() {
    this.physics.onWsLagging();
  }

  notifyHostOfNewLink(link) {
    // TODO: Make sure link does not contain @ characters.
    this.sendWsMessage("onYoutubeLinkUpdate", this.userId, link);
  }

  onWsMessage(e) {
    this.lastMessageTime = GetTime();
    let pre;
    if (test_json) {
      pre = GetTime();
    }
    let message = CustomDeserializeMessage(e.data);
    if (test_json) {
      let after = GetTime();
      this.accumulate += after - pre;
    }

    if (
      message == undefined ||
      message.type == undefined ||
      message.playerId == undefined ||
      message.data == undefined
    ) {
      return;
    }
    if (message.type == "state") {
      // NOTE: Parsing state is expensive don't do it on host
      if (this.physics.isHost()) return;
      let pre;
      if (test_json) {
        pre = GetTime();
      }
      let state = DeserializeState(message.data);
      if (test_json) {
        let after = GetTime();
        this.accumulate += after - pre;
      }
      if (state != undefined) {
        this.onNewState(state);
      }
    } else if (message.type == "keys") {
      // NOTE: Do not even parse the keys of our own player
      if (
        message.playerId == this.physics.state.thisPlayer &&
        !this.physics.state.watchOnly
      )
        return;
      let pre;
      if (test_json) {
        pre = GetTime();
      }
      let keys = DeserializeKeys(message.data);
      if (test_json) {
        let after = GetTime();
        this.accumulate += after - pre;
      }
      if (keys != undefined) {
        this.onNewKeys(
          message.playerId,
          keys,
          keys.timeStamp,
          true /* remote */
        );
      }
    } else if (message.type == "chat") {
      if (
        message.playerId == this.physics.state.thisPlayer &&
        !this.physics.state.watchOnly
      )
        return;
      let chatMessage = undefined;
      try {
        chatMessage = JSON.parse(message.data);
      } catch (error) {}
      // Overwrite player just in case to avoid cheating
      if (chatMessage != undefined) {
        chatMessage.player = message.playerId;
        this.onNewChatMessage(chatMessage, true /*remote*/);
      }
    } else if (message.type == "setHost") {
      this.setHost(message.data);
    } else if (message.type == "ping") {
      let mess = undefined;
      try {
        mess = JSON.parse(message.data);
      } catch (error) {}
      if (mess != undefined) {
        let now = GetTime();
        // NOTE: playerLag is one way lag, need to double it, hostLag is roundtrip.
        this.physics.setLagInfo({
          hostLag: mess.hostLag,
          playerLag: 2 * (now - mess.time)
        });
        this.sendWsMessage(
          "pong",
          this.userId,
          JSON.stringify({ messageId: mess.messageId, time: now })
        );
      }
    } else if (message.type == "removePlayer")
      this.physics.removePlayerFromState(message.playerId);
    else if (message.type == "rejoinPlayer") {
      let res = this.physics.rejoinPlayerToState(message.playerId);
      this.sendWsMessage(
        "onPlayerRejoined",
        this.userId,
        JSON.stringify({ rejoinedPlayerId: message.playerId, ...res })
      );
    } else if (message.type == "tryAddPlayer") {
      let playerInfo = undefined;
      try {
        playerInfo = JSON.parse(message.data);
      } catch (error) {}
      let res = this.physics.tryAddPlayerToState(message.playerId, playerInfo);
      this.sendWsMessage(
        "onPlayerAdded",
        this.userId,
        JSON.stringify({
          addedPlayerId: message.playerId,
          ...res
        })
      );
    } else if (message.type == "updateYoutubeLink") {
      this.physics.updatePlayerLink(message.playerId, message.data);
    } else {
      //console.log("Malformed ws message of type " + message.type);
    }
  }

  // NOTE: Sending jsons is very innefficient...
  // We will send 3 strings, concatenated by an "@" character.
  // type @ playerId @ data (data could be json)
  // NOTE2: data is either string or Int8Array. If we are not using protos it is definitely a string.
  sendWsMessage(type, playerId, data) {
    let pre;
    if (test_json) {
      pre = GetTime();
    }

    let message = CustomSerializeMessage(type, playerId, data);
    if (test_json) {
      let after = GetTime();
      this.accumulate += after - pre;
    }
    this.ws.send(message);
    let now = GetTime();
    // Every time we send a message we also check how healthy is websocket
    if (now - this.lastMessageTime > 10000) {
      // Did not receive any messages in the past 10 seconds
      this.onWsClose();
    } else if (
      now - this.lastMessageTime > 500 &&
      Object.keys(this.physics.state.players).length > 1
    ) {
      // NOTE: If we only have one player it will only receive ping messages from the server every second
      // FIXME: If we have copies of the players, effectively they will result into more than one player
      this.onWsLagging();
    }
  }

  sendWsMessageOld(message) {
    this.ws.send(message);
    let now = GetTime();
    // Every time we send a message we also check how healthy is websocket
    if (now - this.lastMessageTime > 10000) {
      // Did not receive any messages in the past 10 seconds
      this.onWsClose();
    } else if (now - this.lastMessageTime > 500) {
      this.onWsLagging();
    }
  }

  sendKeys(keys, timeStamp) {
    if (!this.wsOpened || this.watchOnly) return;
    keys.timeStamp = timeStamp;
    let pre;
    if (test_json) {
      pre = GetTime();
    }

    if (test_json) {
      let after = GetTime();
      this.accumulate += after - pre;
    }
    this.sendWsMessage("keys", this.userId, keys);
  }

  preprocessState(state) {
    let ret = {
      timeStamp: state.timeStamp,
      physicsStats: state.physicsStats,
      gameMessage: state.gameMessage,
      players: {}, //state.players,
      perks: state.perks,
      timers: state.timers,
      sounds: state.soundManager.sounds
    };

    for (let key in state.players) {
      let player = state.players[key];
      let copy = {};
      copy.avatar = player.avatar;
      copy.playerName = player.playerName;
      copy.geometry = player.geometry;
      // NOTE: We do the selective sending directly in protobuf file.
      copy.stats = player.stats;
      ret.players[key] = copy;
    }
    return ret;
  }

  sendState(state) {
    if (!this.wsOpened || this.watchOnly) return;
    let pre;
    if (test_json) {
      pre = GetTime();
    }

    if (state == undefined) return;

    let dimState = this.preprocessState(state);

    if (test_json) {
      let after = GetTime();
      this.accumulate += after - pre;
    }
    this.sendWsMessage("state", this.userId, dimState);
  }

  sendChatMessage(message) {
    if (!this.wsOpened || this.watchOnly) return;
    this.sendWsMessage("chat", this.userId, JSON.stringify(message));
  }

  printStats() {
    console.log((100 * this.accumulate) / (GetTime() - this.start));
    setTimeout(() => this.printStats(), 1000);
  }
}

export default ServerStateFetcher;
