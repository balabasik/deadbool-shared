import Physics from "../frontend/react/src/game/gamePlay/physics";
import Keys from "../frontend/react/src/game/gamePlay/keys";
import {
  GetHeroList,
  GetRand,
  GetTime,
  ShrinkString,
  RandomString,
  CustomSerializeMessage,
  CustomDeserializeMessage,
  SerializeState,
  DeserializeState,
  SerializeKeys,
  DeserializeKeys
} from "../frontend/react/src/game/gamePlay/utils";

const WebSocket = require("ws");
const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const read = fs.readFileSync;

// Decides if we host the game on the server, or host on client side.
// NOTE: Defaulting to true.
// NOTE: Should be in sync with the value in app.js.
const HOST_GAME_ON_SERVER =
  (process.env.HOST_GAME_ON_SERVER || 1) == 1 ? true : false;
// In worker ssl is used for websockets.
// NOTE: The same as in the parent.
const USE_SSL = (process.env.USE_SSL || 0) == 1;

// Constant used to avoid too frequent keys messages from the players.
const MIN_KEYS_BROADCAST_DELAY = 30; // ms

// gameHash is the main id of the game.
var gameHash = undefined;
// Holds the backend Physics component.
var physics = undefined;
// Will be set to ready when physics loads.
// Note that for serverless game we will receive this signal from the host player.
var physicsReady = false;
// Holds players information, including socket info to send gameState to.
var players = {}; // {playerId, playerPass, isWatcher, socket}
// Explicitely storing avatars here to report to the parent process.
var playerAvatars = {};
// Id of the host. Preset for serverful game.
var hostId = HOST_GAME_ON_SERVER ? "serverHostId" : undefined;
// Options for the game set on the time of creation.
var gameOptions = {};
// Used to ping the clients to determine lag.
var pings = {};

// TODO: extract this into a separate function
// ------------------------- HTTPS SETUP -----------------------------
var server;
if (USE_SSL) {
  var KEY_LOCATION = process.env.KEY_LOCATION || "key.pem";
  var CERT_LOCATION = process.env.CERT_LOCATION || "cert.pem";
  var CHAIN_LOCATION = process.env.CHAIN_LOCATION || "ca.pem";

  var privateKey;
  var certificate;
  var chainLines = [];

  try {
    privateKey = read(KEY_LOCATION, "utf8");
  } catch {
    err => {
      console.log("key is not found");
    };
  }

  try {
    certificate = read(CERT_LOCATION, "utf8");
  } catch {
    err => {
      console.log("cert is not found");
    };
  }

  try {
    chainLines = read(CHAIN_LOCATION, "utf8").split("\n");
  } catch {
    err => {
      console.log("chain is not found");
    };
  }
  var cert = [];
  var ca = [];
  chainLines.forEach(function(line) {
    cert.push(line);
    if (line.match(/-END CERTIFICATE-/)) {
      ca.push(cert.join("\n"));
      cert = [];
    }
  });
  var credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
  };
  server = https.createServer(credentials);
} else {
  server = http.createServer();
}
// --------------------------------------------------------------------

// Starting websocket server.
const wss = new WebSocket.Server({
  server: server,
  // Function used to verify playerId/playerPass when new websocket client connects.
  verifyClient: ({ req }, done) => {
    let query = url.parse(req.url, true).query;
    //console.log(query);
    req.playerId = query.playerId;
    req.playerPass = query.playerPass;
    if (
      req.playerId == undefined ||
      req.playerPass == undefined ||
      players[req.playerId] == undefined ||
      players[req.playerId].playerPass != req.playerPass
    ) {
      //console.log("failed to connect websocket.");
      done(false, 401, "Wrong player id/pass.");
      return;
    }
    // NOTE: This check is needed to avoid player rejoining several times to the same game (like from different tabs).
    if (players[req.playerId].isActive == true) {
      done(false, 401, "Player is active, cannot connect again!");
      return;
    }
    //console.log("client connected to websocket.");
    done(true);
  }
});

// Set websocket callbacks.
wss.on("connection", (ws, req) => {
  // NOTE: Looks like there is no need to explicitely specify ws.binaryType = "arraybuffer";
  // TODO: Return bad response.
  if (req.playerId == undefined) return;
  players[req.playerId].socket = ws;
  ws.on("message", message => {
    handlePlayerMessage(req.playerId, message);
  });
  ws.on("close", message => {
    handlePlayerQuit(ws);
  });
  // NOTE: Immediately notifying the connected client of the hostId.
  players[req.playerId].isActive = true;
  ws.send(CustomSerializeMessage("setHost", hostId, hostId));
});

// TODO: It is important to cleanup watchers in order not to  broadcast to zombies and waste data.
wss.broadcast = function broadcast(data, senderId) {
  let senderSocket =
    senderId == undefined || players[senderId] == undefined
      ? undefined
      : players[senderId].socket;
  wss.clients.forEach(function each(client) {
    // If message is broadcast by a client we don't need to send it to the same client.
    if (client == senderSocket) {
      //console.log("not sending data, since sender is the same:", senderId);
    }
    // Only send data to active clients.
    //console.log(client.readyState);
    else if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// If socket disconnects we deactivate the player, and fully remove it after some time.
function handlePlayerQuit(ws) {
  // TODO: Optimize linear lookup (because we might have lots of watchers).
  for (let playerId in players) {
    if (players[playerId].socket == ws) {
      // NOTE: Active players are handled separately (since they might want to reconnect).
      if (players[playerId].isWatcher) {
        //console.log("removing watcher", playerId);
        // For watchers we simply delete the player
        delete players[playerId];
      } else {
        // NOTE: We do not remove player from state here. Player has a minute to reconnect.
        deactivatePlayer(playerId);
      }
      // NOTE: Looks like we don't need to update clients of wss as it is done automatically
      return;
    }
  }
}

// Worker sends heartbeat to the parent every 3 seconds.
// If worker is idle for 15 seconds parent will kill the worker.
function sendHeartbeatToParent() {
  process.send({
    type: "heartbeat",
    gameHash: gameHash
  });
  setTimeout(() => sendHeartbeatToParent(), 3000);
}
sendHeartbeatToParent();

// Send ping messages to the players, to find their lag.
function broadcastPingMessage() {
  let messageId = RandomString();
  let now = GetTime();
  if (Object.keys(pings) > 20) pings = {};
  pings[messageId] = now;
  let hostLag = players[hostId] == undefined ? -1 : players[hostId].lag;
  wss.broadcast(
    CustomSerializeMessage(
      "ping",
      hostId,
      JSON.stringify({
        messageId: messageId,
        time: now,
        hostLag: hostLag
      })
    )
  );
  setTimeout(() => broadcastPingMessage(), 1000); // every 1 second
}
// TODO: We don't need to broadcast to watchers!!
broadcastPingMessage();

// Handle pong message from clients to get their lag.
function onPongMessage(playerId, data) {
  let message = undefined;
  try {
    message = JSON.parse(data);
  } catch (error) {
    console.log(error);
  }
  let messageId = message.messageId;
  //console.log(messageId, playerId);
  if (
    messageId == undefined ||
    playerId == undefined ||
    players[playerId] == undefined ||
    pings[messageId] == undefined
  )
    return;
  let now = GetTime();
  players[playerId].lag = now - pings[messageId];
}

// We want to know if player is active (to host the game), so check player activity every 200ms.
function checkPlayersDisconnected() {
  let toRemove = [];
  playerAvatars = {};
  let now = GetTime();
  let maxTime = now - 30000; // we give a minute for players to reconnect and then remove them from state permanently
  let maxInactiveTime = now - 200; // if no messages from player for 200 ms we declare them inactive
  for (let key in players) {
    if (players[key].isWatcher || players[key].keysLastUpdated == undefined)
      continue;
    if (players[key].keysLastUpdated < maxTime) toRemove.push(key);
    else if (players[key].keysLastUpdated < maxInactiveTime)
      deactivatePlayer(key);
    else playerAvatars[key] = { avatar: players[key].avatar };
  }

  for (let playerId of toRemove) {
    console.log(
      "Player " + playerId + " is idle for more than 60 seconds. Removing."
    );
    onPlayerDisconnected(playerId);
  }
  setTimeout(() => checkPlayersDisconnected(), 200);
}
checkPlayersDisconnected();

// Deactivation is a first step towards removal.
// Inactive players cannot host the game.
function deactivatePlayer(playerId) {
  if (
    players[playerId] == undefined ||
    players[playerId].isWatcher ||
    !players[playerId].isActive
  )
    return;
  players[playerId].isActive = false;
  // NOTE: For serverless games, if host looses his connection we have to reevaluate host.
  if (hostId == playerId) assignNewHost();
}

// Handle messages from the parent to the worker.
process.on("message", ({ gameHash: hash, type: type, message: message }) => {
  //console.log(type, message);
  if (type == "newGame") {
    // Start a new game.
    if (gameHash != undefined) {
      // Do not accept any new game messages if game has started
      process.send({
        type: "error",
        gameHash: gameHash,
        message: "Game already started."
      });
      return;
    }
    gameHash = hash;
    handleNewGameMessage(process, message);
  } else if (type == "addPlayer") {
    // Add a player only to the existing game.
    if (gameHash == undefined || hash != gameHash || !physicsReady) {
      process.send({
        type: "error",
        gameHash: gameHash,
        message: "Game " + hash + " does not exist"
      });
      return;
    }
    handleAddPlayerMessage(message);
  } else if (type == "rejoinPlayer") {
    // Rejoin player after player has dropped.
    // It might happen that game ended by the rejoin time.
    //console.log("rejoin", physicsReady);
    if (gameHash == undefined || hash != gameHash || !physicsReady) {
      process.send({
        type: "error",
        gameHash: gameHash,
        message: "Game " + hash + " does not exist"
      });
      return;
    }
    handleRejoinPlayerMessage(message);
  } else if (type == "removePlayer") {
    // Parent will call this function only if player disconnects "properly".
    if (gameHash == undefined || hash != gameHash || !physicsReady) {
      process.send({
        type: "error",
        gameHash: gameHash,
        message: "Game " + hash + " does not exist"
      });
      return;
    }
    handleRemovePlayerMessage(message);
  }
});

// Handle websocket message from the player.
function handlePlayerMessage(playerId, messageBlob) {
  // Check if player is watchOnly, and abandon keys if so.
  if (players[playerId] == undefined || players[playerId].isWatcher) return;

  // TODO: We want to sanitize the messages to avoid malicious messages.
  // 1000 characters is too small for the game state. So need to find a better way.
  // messageBlob = ShrinkString(messageBlob, 1000);

  // NOTE: If game is NOT hosted on server then we transparently pass all the game state info to the clients.
  // Else we unzip gameState and keys for local processing.
  // Look for details into the "CustomDeserializeMessage" function.
  let forceNoUnzip = !HOST_GAME_ON_SERVER;
  let message = CustomDeserializeMessage(messageBlob, forceNoUnzip);
  //if (message.type != "state" && message.type != "keys")
  //  console.log(message.type);
  if (
    message == undefined ||
    message.type == undefined ||
    message.playerId == undefined ||
    message.data == undefined
  ) {
    console.log(
      "Malformed message from " + playerId + " of type " + message.type
    );
    return;
  }

  if (message.playerId != playerId) {
    console.log(
      "Message playerId missmatch: " + message.playerId + " " + playerId
    );
    return;
  }

  //console.log(message.type, message.playerId);
  // NOTE: Receiving message from a player indicates player is active.
  players[playerId].isActive = true;

  if (message.type == "keys") {
    // Keys from the client.
    // NOTE: To avoid extra serialization we pass BLOB directly
    handleUpdatePlayerKeysMessage(playerId, message.data, messageBlob);
  } else if (message.type == "state" && playerId == hostId) {
    // A callback from host with the new game state.
    handleStateMessage(messageBlob, playerId);
  } else if (message.type == "onPlayerRejoined" && playerId == hostId) {
    // A callback from the host that player was rejoined to state.
    onPlayerRejoined(message.data);
  } else if (message.type == "onPlayerAdded" && playerId == hostId) {
    // A callback from host that player has been added.
    onPlayerAddedToStateMessage(message.data);
  } else if (message.type == "onHostReady" && playerId == hostId) {
    // A callback from host that it is ready to host the game.
    onReady();
  } else if (message.type == "pong") {
    // Pong message response for ping.
    onPongMessage(playerId, message.data);
  } else if (message.type == "chat") {
    // Handle chat messages.
    wss.broadcast(messageBlob, playerId);
  } else if (message.type == "onYoutubeLinkUpdate") {
    // Youtube link udpate message.
    onUpdateYoutubeLinkMessage(playerId, message.data);
  }
}

function onUpdateYoutubeLinkMessage(playerId, link) {
  link = SanitizeYoutubeLink(link);
  //console.log("link: " + link);
  if (HOST_GAME_ON_SERVER) {
    physics.updatePlayerLink(playerId, link);
  } else {
    sendToHost(CustomSerializeMessage("updateYoutubeLink", playerId, link));
  }
}

function handleStateMessage(messageBlob, senderId) {
  wss.broadcast(messageBlob, senderId);
  // NOTE: To optimize we do not send the full state to the parent.
  process.send({
    gameHash: gameHash,
    type: "newState",
    message: { state: { numWs: wss.clients.length, players: playerAvatars } }
  });
}

function handleBroadcastKeysMessage(playerId, messageJson) {
  if (players[playerId] == undefined) return;
  let now = GetTime();
  players[playerId].keysLastUpdated = now;
  if (players[playerId].keys == undefined) players[playerId].keys = {};
  players[playerId].keys.messageJson = messageJson;
  if (players[playerId].keys.pendingBroadcast == true) return;
  players[playerId].keys.pendingBroadcast = true;
  if (players[playerId].keys.lastBroadcastTime == undefined)
    players[playerId].keys.lastBroadcastTime = now;
  // Sanitization to avoid extra key spamming
  setTimeout(
    () => broadcastKeys(playerId),
    Math.max(
      0,
      MIN_KEYS_BROADCAST_DELAY -
        (now - players[playerId].keys.lastBroadcastTime)
    )
  );
}

function broadcastKeys(playerId) {
  if (players[playerId] == undefined) return;
  players[playerId].keys.pendingBroadcast = false;
  players[playerId].keys.lastBroadcastTime = GetTime();
  // NOTE: this is messageblob, not really json
  wss.broadcast(players[playerId].keys.messageJson, playerId);
}

function handleUpdatePlayerKeysMessage(playerId, messageKeys, messageJson) {
  handleBroadcastKeysMessage(playerId, messageJson);
  if (HOST_GAME_ON_SERVER) {
    let keys = DeserializeKeys(messageKeys);
    if (keys == undefined) {
      process.send({
        type: "error",
        gameHash: gameHash,
        message: "Format error"
      });
      return;
    }
    if (!physics.setKeys(playerId, keys, keys.timeStamp, true /*remote*/)) {
      console.log(
        "warning: tried to update keys of nonexisting player " + playerId
      );
      onPlayerDisconnected(playerId);
    }
  }
}

const defaultYoutubeLink = "https://www.youtube.com/embed/LCmJ5mIF3GM"; // Tiny people mv
const defaultEmptyYoutubeLink = "https://www.youtube.com/embed/1S66ChE3Eok"; // Gaming music

function SanitizeAvatar(avatar, allAvatars) {
  for (let a of allAvatars) {
    if (avatar == a[0]) return avatar;
  }
  // IF avatar was malformed we set it to random value
  return "random";
}

function SanitizeYoutubeLink(url) {
  if (url == undefined || url == "") return defaultEmptyYoutubeLink;
  var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
  var match = url.match(regExp);
  if (match && match[1].length == 11)
    return "https://www.youtube.com/embed/" + match[1];
  return defaultYoutubeLink;
}

function handleAddPlayerMessage(message) {
  let playerId = message.playerId;
  let playerPass = message.playerPass;
  let avatar = message.avatar;
  let playerName = message.playerName;
  let playerLink = SanitizeYoutubeLink(message.playerLink);
  let isWatcher = message.isWatcher;

  // Handling watcher is simple
  if (isWatcher) {
    // Cannot watch a empty game.
    if (Object.keys(players).length == 0) {
      process.send({
        gameHash: gameHash,
        type: "onWatcherAdded",
        message: {
          success: false
        }
      });
      return;
    }
    // FIXME: The only reason we are adding watchers to players list
    // to be able to rejoin them to last game if they exit.
    // But with many watchers it could have bad performance as we have linear checks.
    players[playerId] = {
      playerPass: playerPass,
      socket: undefined,
      isWatcher: isWatcher,
      isActive: false
    };
    process.send({
      gameHash: gameHash,
      type: "onWatcherAdded",
      message: {
        playerId,
        success: true,
        avatar: "",
        hostId: hostId,
        gameOptions: gameOptions
      }
    });
    return;
  }

  let allAvatars = GetHeroList();
  let desiredAvatar = SanitizeAvatar(avatar, allAvatars);
  let playerInfo = {
    avatar: desiredAvatar,
    playerName: playerName,
    playerLink: playerLink,
    activeGun: 0
  };

  if (HOST_GAME_ON_SERVER) {
    // If game is hosted on the server then physics is the source of truth of the players state.
    let res = physics.tryAddPlayerToState(playerId, playerInfo);
    if (res.success != true || res.avatar == undefined) {
      process.send({
        gameHash: gameHash,
        type: "onPlayerAdded",
        message: { playerId, success: false }
      });
      return;
    }
    playerInfo.avatar = res.avatar;
    players[playerId] = {
      playerPass: playerPass,
      socket: undefined,
      isWatcher: isWatcher,
      playerInfo: playerInfo,
      isActive: false
    };
    onPlayerAddedToState(playerId);
  } else {
    // SERVERLESS CASE
    // It is the first player in the game. He should be the host.
    if (hostId == undefined) {
      hostId = playerId;
      // NOTE: At this point host player has not yet received the game command!
      // On client we check if player is the host, and add himself to the state.
      // If desired avatar is random we pick a random avatar for the host ourselves without physics.
      if (desiredAvatar == "random") {
        let allAvatars = GetHeroList();
        desiredAvatar = allAvatars[GetRand(allAvatars.length - 1)][0]; // excluding last random here
      }
      playerInfo.avatar = desiredAvatar;
      players[playerId] = {
        playerPass: playerPass,
        socket: undefined,
        isWatcher: isWatcher,
        playerInfo: playerInfo,
        isActive: false
      };
      onPlayerAddedToState(playerId);
      return;
    }

    // If there was an error connecting to the host socket we return failure.
    players[playerId] = {
      playerPass: playerPass,
      socket: undefined,
      isWatcher: isWatcher,
      playerInfo: playerInfo,
      isActive: false
    };
    if (
      !sendToHost(
        CustomSerializeMessage(
          "tryAddPlayer",
          playerId,
          JSON.stringify(playerInfo)
        )
      )
    ) {
      process.send({
        gameHash: gameHash,
        type: "onPlayerAdded",
        message: { playerId, success: false }
      });
      return;
    }
  }
}

function onPlayerAddedToStateMessage(data) {
  let message = undefined;
  try {
    message = JSON.parse(data);
  } catch (error) {
    console.log(error);
  }

  if (message == undefined) {
    console.log("Failed to deserialize the message.");
    return;
  }

  let playerId = message.addedPlayerId;
  if (players[playerId] == undefined) {
    console.log("Player " + playerId + " doesnot exist in game " + gameHash);
    process.send({
      gameHash: gameHash,
      type: "onPlayerAdded",
      message: { playerId, success: false }
    });
    return;
  }
  if (message.success != true || message.avatar == undefined) {
    delete players[playerId];
    process.send({
      gameHash: gameHash,
      type: "onPlayerAdded",
      message: { playerId, success: false }
    });
    return;
  }
  players[playerId].playerInfo.avatar = message.avatar;
  onPlayerAddedToState(playerId);
}

function onPlayerAddedToState(playerId) {
  if (players[playerId] == undefined) {
    console.log("Error: player does not exist on server.");
    return;
  }
  players[playerId].keys = {
    messageJson: undefined,
    pendingBroadcast: false,
    lastBroadcastTime: undefined
  };
  players[playerId].keysLastUpdated = GetTime();
  process.send({
    gameHash: gameHash,
    type: "onPlayerAdded",
    message: {
      playerId,
      success: true,
      playerInfo: players[playerId].playerInfo,
      hostId: hostId,
      gameOptions: gameOptions // needed to initialize host game (but we also pass to all other players on start)
    }
  });
}

// We reassign a new host in serverless game if current host lags.
var hostRetries = 0;
function assignNewHost() {
  // Do not assign host on server!!!
  if (HOST_GAME_ON_SERVER) return;
  // TODO: make sure that everyone gets the new host message.
  // NOTE: Watchers cannot be hosts.
  if (players[hostId] != undefined && players[hostId].isActive) {
    console.log("current host " + hostId + " is active. No change required");
    return;
  }
  let newHostId = undefined;
  let newHostLag = undefined;
  // Assign host based on player lag
  for (let key in players) {
    if (players[key].isWatcher || !players[key].isActive) continue;
    if (
      newHostId == undefined ||
      newHostLag == undefined ||
      (players[key].lag != undefined && newHostLag > players[key].lag)
    ) {
      newHostId = key;
      newHostLag = players[key].lag;
    }
  }
  /*
  console.log(
    "Old host: " +
      hostId +
      " new host: " +
      newHostId +
      " new lag: " +
      newHostLag
  );
  */

  if (newHostId == undefined) {
    hostRetries++;
    // Retry reassign host 10 times, and if failed abort the game.
    if (hostRetries > 10) {
      process.send({
        gameHash: gameHash,
        type: "stopGame"
      });
      return;
    }
    //console.log("Error: failed to pick host. Scheduling retry.");
    setTimeout(() => {
      assignNewHost();
    }, 200);
    return;
  } else {
    hostId = newHostId;
    hostRetries = 0;
  }
  wss.broadcast(CustomSerializeMessage("setHost", hostId, hostId));
}

function handleRejoinPlayerMessage(message) {
  let playerId = message.playerId;
  let playerPass = message.playerPass;
  let isWatcher = message.isWatcher;

  // If its a watcher we directly add him.
  if (isWatcher) {
    players[playerId] = {
      playerPass: playerPass,
      socket: undefined,
      isWatcher: isWatcher
    };
    notifyParent({
      gameHash: gameHash,
      type: "onPlayerAdded",
      message: {
        playerId,
        success: true,
        playerInfo: { avatar: "" },
        hostId: hostId,
        gameOptions: gameOptions
      }
    });
    return;
  }
  rejoinPlayerToState(playerId, playerPass);
}

function rejoinPlayerToState(playerId, playerPass) {
  if (players[playerId] == undefined || players[playerId].isActive) {
    // NOTE: Player is already active do not let them rejoin second time.
    process.send({
      gameHash: gameHash,
      type: "onPlayerAdded",
      message: { playerId, success: false }
    });
    return;
  }
  if (HOST_GAME_ON_SERVER) {
    if (players[playerId].playerInfo == undefined) {
      process.send({
        gameHash: gameHash,
        type: "onPlayerAdded",
        message: { playerId, success: false }
      });
      return;
    }

    let res = physics.rejoinPlayerToState(playerId);
    if (
      !res.success ||
      res.avatar == undefined ||
      players[playerId].playerInfo == undefined
    ) {
      // Could reach here for example if game reached max players while player was away.
      process.send({
        gameHash: gameHash,
        type: "onPlayerAdded",
        message: { playerId, success: false }
      });
      return;
    }
    players[playerId].playerInfo.avatar = res.avatar;
    notifyParent({
      gameHash: gameHash,
      type: "onPlayerAdded",
      message: {
        playerId,
        success: true,
        playerInfo: players[playerId].playerInfo,
        hostId: hostId,
        gameOptions: gameOptions
      }
    });
  } else {
    // Serverless game, we send the rejoin request to host.
    if (!sendToHost(CustomSerializeMessage("rejoinPlayer", playerId, ""))) {
      process.send({
        gameHash: gameHash,
        type: "onPlayerAdded",
        message: { playerId, success: false }
      });
      return;
    }
  }
}

// Helper message to send message to host in serverless games.
function sendToHost(message) {
  if (players[hostId] == undefined || players[hostId].socket == undefined)
    return false;
  let hostWs = players[hostId].socket;
  hostWs.send(message);
  return true;
}

// Callback function executed by physics (server) or by the host client (serverless).
function onPlayerRejoined(data) {
  let message = undefined;
  try {
    message = JSON.parse(data);
  } catch (error) {
    console.log(error);
  }

  let playerId = message.rejoinedPlayerId;
  let success = message.success;
  let avatar = message.avatar;

  if (
    success != true ||
    avatar == undefined ||
    players[playerId].playerInfo == undefined
  ) {
    process.send({
      gameHash: gameHash,
      type: "onPlayerAdded",
      message: { playerId, success: false }
    });
    return;
  }
  players[playerId].playerInfo.avatar = avatar;
  notifyParent({
    gameHash: gameHash,
    type: "onPlayerAdded",
    message: {
      playerId,
      success: true,
      playerInfo: players[playerId].playerInfo,
      hostId: hostId,
      gameOptions: gameOptions
    }
  });
}

// Helper function to notify parent.
function notifyParent(message) {
  process.send(message);
}

function handleRemovePlayerMessage(message) {
  // NOTE: This is the message coming from parent.
  let playerId = message.playerId;
  if (players[playerId] == undefined) return;
  delete players[playerId];
  removePlayerFromState(playerId);
}

// Called by the physics when game is initialized so that new player can be added.
function onReady() {
  if (physicsReady) return;
  //console.log("Physics ready.");
  physicsReady = true;
  process.send({
    gameHash: gameHash,
    type: "newGame",
    message: "Game started"
  });
}

function onPlayerDisconnected(playerId) {
  if (players[playerId] == undefined) return;
  // NOTE: This notifies parent that player has disconnected
  delete players[playerId];
  removePlayerFromState(playerId);
  process.send({
    gameHash: gameHash,
    type: "playerDisconnected",
    message: { playerId }
  });
}

function removePlayerFromState(playerId) {
  if (HOST_GAME_ON_SERVER) physics.removePlayerFromState(playerId);
  else {
    // If host has quit we need to assign a new one.
    if (playerId == hostId) assignNewHost();
    // All clients need to know that player has quit.
    wss.broadcast(CustomSerializeMessage("removePlayer", playerId, ""));
  }
}

// Game state is very heavy, so we need to only select necessary parts of it to broadcast.
function preprocessState(state) {
  let ret = {
    timeStamp: state.timeStamp,
    physicsStats: state.physicsStats,
    gameMessage: state.gameMessage,
    players: {}, // selective player info is filled below.
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
    //console.log(copy.stats);
    /*
    copy.stats = {};
    for (let st in player.stats) {
      if (!st in SendablePlayerStats) continue;
      copy.stats[st] = player.stats[st];
    }*/
    ret.players[key] = copy;
  }
  return ret;
}

// Function called by the physics every time the game state is updated.
// NOTE: This function is never called for serveless games.
function updateState(state) {
  if (!HOST_GAME_ON_SERVER) {
    console.log("This function should never be called in serverless scenario!");
    return;
  }
  // TODO: Add frequency verification.

  // NOTE: If anything else is needed add it here.
  // physicsStats, timeStamp, players, playerKeys, perks, timers, gameMessage, soundManager, newChatMessages.
  let dimState = preprocessState(state);
  // Broadcasting state to all the connected players
  wss.broadcast(
    CustomSerializeMessage("state", "backend", dimState),
    "backend"
  );

  // Parent process needs to know some info about the game too.
  process.send({
    gameHash: gameHash,
    type: "newState",
    message: { state: { numWs: wss.clients.length, players: playerAvatars } }
  });
}

// Periodic function to notify parent about the host (for serverless game).
function sendHostInfoToParent() {
  let hostLag = players[hostId] == undefined ? undefined : players[hostId].lag;
  process.send({
    gameHash: gameHash,
    type: "newHostInfo",
    message: { hostInfo: { hostId: hostId, hostLag: hostLag } }
  });
  //console.log(hostLag);
  setTimeout(() => {
    sendHostInfoToParent();
  }, 1000);
}
sendHostInfoToParent();

// New game request.
function handleNewGameMessage(process, message) {
  initiateWSS(message.wsPort);
  gameOptions = message.gameOptions;
  //console.log("Initialized websocket server");
  if (HOST_GAME_ON_SERVER) {
    let initState = {
      mapId: message.mapId,
      watchOnly: false,
      gameOptions: gameOptions
    };
    // Create physics.
    physics = new Physics(
      initState,
      undefined /*requestKeys*/,
      false /*isClient*/,
      updateState,
      undefined /*onNewPlayer*/,
      undefined /*onRemovePlayer*/,
      onReady,
      undefined /*onBulletExplosion*/
    );
    //console.log("Physics initialized");
  } else {
    // NOTE: Need to immediately tell parent that game has been created to let parent add first player.
    onReady();
  }
}

function initiateWSS(wsPort) {
  // Start websocket server.
  server.listen(wsPort, () => {
    console.log(new Date(), "Server started on port " + wsPort);
  });
}
