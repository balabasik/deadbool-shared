const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const { fork } = require("child_process");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
const read = fs.readFileSync;
const https = require("https");
const http = require("http");

// Environment variable to enable/disable ssl
const USE_SSL = (process.env.USE_SSL || 0) == 1;
console.log("USE_SSL", USE_SSL);

// All the communication with backend (except ws) is done on port 5000.
// TODO: If we want to use both HTTP and HTTPS in the future we'll need to specify 2 different ports
const PORT = 5000;
// NOTE: this should be a real, unique IP address, not a domain name
const IP = process.env.IP || "localhost";
// Operator ip address. Backend registers itself as an active backend with operator,
// and updates all the active games on it.
const OPERATOR_IP = process.env.OPERATOR_IP || "localhost";

// Env constants identifying the backend. Required when registering with operator.
const INSTANCE_ZONE = process.env.INSTANCE_ZONE || "west2-a";
const INSTANCE_NAME = process.env.INSTANCE_NAME || "backend1-dev";

// Game constrains.
const MAX_GAMES_PER_BACKEND = process.env.MAX_GAMES_PER_BACKEND || 7; // 7 games by default
const MAX_PLAYERS_PER_GAME = process.env.MAX_PLAYERS_PER_GAME || 8; // 8 players per game by default
const MAX_WATCHERS_PER_GAME = process.env.MAX_WATCHERS_PER_GAME || 100; // 100 watchers per game by default

// Password for communication with operator.
const SUPER_SECRET_PASSWORD =
  process.env.SUPER_SECRET_PASSWORD || "SUPER_SECRET_PASSWORD";

// We support both server game hosting and client hosting.
// NOTE: Defaulting to TRUE.
const HOST_GAME_ON_SERVER = (process.env.HOST_GAME_ON_SERVER || 1) == 1;
console.log("HOST_GAME_ON_SERVER", HOST_GAME_ON_SERVER);

// wss is an ssl encrypted ws.
const WS_BASE_URL = (USE_SSL ? "wss://" : "ws://") + IP;

// Url identifying the backend. Operator will use this URL for start/stop game requests.
// baseurl is used as a unique id in the operator storage.
const BASE_URL = (USE_SSL ? "https://" : "http://") + IP + ":" + PORT;
const GAME_BASE_URL = BASE_URL + "/game/";

// Global variable storing all the games, including worker handles.
var games = {};

// Global variable holding the cached game list in the format acceptable for operator.
// Will be crafted of the "games" variable.
var gameList = {};

// Global var to find free ws ports in range 9000-10000.
// Required because when game ends we cannot guarantee that ws port is freed immediately.
var takenWsPorts = {};

// Global variable storing worker heartbeat information.
var heartbeat = {};

// ====================== UTILITY FUNCTIONS ======================
function randomString() {
  return Math.random()
    .toString(36)
    .substring(7);
}

function ShrinkString(s, n) {
  return s.length > n ? s.substr(0, n - 1) : s;
}

function GetTime() {
  let d = new Date();
  return d.getTime();
}

// ports 9000 - 10000 are specifically reserved for WebSocket connections
// some ports are blocked on the browser! like 6000
// we do not expect having more than 1000 games hosted...
function GetFreeWsPort() {
  for (let port = 9000; port < 10000; port++) {
    if (takenWsPorts[port] == undefined) {
      takenWsPorts[port] = true;
      return port;
    }
  }
}

function ReleaseWsPort(port) {
  delete takenWsPorts[port];
}
// ====================== UTILITY FUNCTIONS ======================

// Basic app setup to handle post/get requests.
app.use("/", express.static("."));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true
  })
);
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.use(cors());

// All the communication with operator happens via "game" endpoint.
app.post("/game", (req, res) => handleGame(req, res));

// ====================== HTTPS SETUP ======================
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
    console.log("Key is not found.");
  };
}

try {
  certificate = read(CERT_LOCATION, "utf8");
} catch {
  err => {
    console.log("Cert is not found.");
  };
}

try {
  chainLines = read(CHAIN_LOCATION, "utf8").split("\n");
} catch {
  err => {
    console.log("Cert chain is not found.");
  };
}
var cert = [];
var ca = [];
// Parsing pem files.
chainLines.forEach(function(line) {
  cert.push(line);
  if (line.match(/-END CERTIFICATE-/)) {
    ca.push(cert.join("\n"));
    cert = [];
  }
});
// https uses this credentials format.
var credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

// TODO: Figure out if we want to use both at some point.
if (USE_SSL) {
  https.createServer(credentials, app).listen(PORT, function() {
    console.log(new Date(), `HTTPS port ${PORT}`);
  });
} else {
  http.createServer(credentials, app).listen(PORT, function() {
    console.log(new Date(), `HTTP port ${PORT}`);
  });
}
// ====================== HTTPS SETUP ======================

// When backend starts it reads its own git hash to report to operator.
var gitHeadHash = "0000000";
const GIT_HEAD_HASH_FILE = "git_head_hash.pem";

try {
  gitHeadHash = read(GIT_HEAD_HASH_FILE, "utf8");
  gitHeadHash = gitHeadHash.trim(); // to remove the end of line
  console.log("Git head hash: " + gitHeadHash);
} catch {
  err => {
    console.log("Git head hash file not found.");
  };
}

// Generally each backend is advertising itself with an operator, so that operator
// can decide which backend to assign a new game to.

// Variable needed to check if backend isntance is preparing for reboot.
// UPDATE: We don't use it anymore. Operator is going to decide whether to accept ads or not.
// NOTE: Keeping the code for future potential use.
var STOP_FILE_LOCATION = process.env.STOP_FILE_LOCATION || "stop_file";
var stopAdvertising = false;
function checkRebootFile() {
  let content = undefined;
  try {
    content = read(STOP_FILE_LOCATION, "utf8");
  } catch {
    err => {
      console.log("Stop file is not found.");
    };
  }
  if (content == "stop") {
    stopAdvertising = true;
    console.log("STOPPING THE ADVERTISING!");
  } else setTimeout(() => checkRebootFile(), 60 * 60 * 1000); // check the file every hour
}

// Games are stored in the operators RAM, but perhaps we want to maintain a database,
// so that backends can write directly into it.
// Essentially operator acts as a poor-man's database.

// NOTE: This call is also used both as an update, and adding a new server into operator's list
// if it is a first registration call.
function sendGameListToOperator() {
  // Do not respond if backend was instructed to stop advertising (e.g., if reboot is required).
  if (stopAdvertising) return;
  // Operator is using port 8000 to listen for backend updates.
  let url =
    (USE_SSL ? "https://" : "http://") + OPERATOR_IP + ":8000/post_gamelist";
  //console.log("sending gamelist to url:", url);

  let gamesJson = JSON.stringify({ games: gameList });
  fetch(url, {
    method: "POST",
    //mode: "cors", // NOTE: since url is a subdomain we don't have to use cors.
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `id=${BASE_URL}&pass=${SUPER_SECRET_PASSWORD}&games=${gamesJson}&gitHash=${gitHeadHash}&zone=${INSTANCE_ZONE}&name=${INSTANCE_NAME}`
  })
    .then(response => response.json())
    //  .then(data => console.log(data))
    .catch(err => {
      console.log(new Date(), err);
    }); // NOTE: doesn't matter what is the error

  setTimeout(() => sendGameListToOperator(), 2000); // send updates every 2 seconds
}

// Start periodic game update.
sendGameListToOperator();

// Function to cache active games.
function updateCachedGameList() {
  // TODO: We need to somehow track players that just cut the connection!
  gameList = {};
  for (var gameKey in games) {
    let game = games[gameKey];
    let state = game.state;

    // Get active player avatars
    let avatars = [];
    if (state != undefined)
      for (let key in state.players) avatars.push(state.players[key].avatar);
    gameList[gameKey] = {
      mapId: game.mapId,
      gameName: game.gameName,
      noPassword: game.gamePass == undefined || game.gamePass == "",
      canWatch: game.options.canWatch,
      randomPlayers: game.options.randomPlayers,
      uniquePlayers: game.options.uniquePlayers,
      maxFrags: game.options.maxFrags,
      maxPlayers: game.options.maxPlayers,
      gameBaseUrl: GAME_BASE_URL, // Convenient variable to tell operator where to send players.
      activePlayers: Object.keys(game.players).length,
      activeAvatars: avatars,
      timeStarted: game.timeStarted,
      hostInfo: game.hostInfo
    };
  }

  // Update the cached gamelist every second.
  setTimeout(updateCachedGameList, 1000);
}

// Start reccurent cache udpate.
updateCachedGameList();

// Function returning gameList to the operator.
function getGamelist(req, res) {
  res.send({ games: gameList });
}

// Function to add new player to the game request.
// Note that this function is called after the request has been sanitized and
// checked for proper credentials.
function handleNewPlayer(gameHash, playerInfo, res) {
  //console.log("handlenewplayer");
  if (!(gameHash in games)) {
    console.log("Game " + gameHash + " does not exist.");
    res.send({ success: false });
    return;
  }

  // Generate internal player id and password.
  var playerId = randomString();
  var playerPass = randomString();

  // NOTE: We rightfully add player to players list first, and then send the
  // message to the worker.
  // If the request to the worker fails, we will remove the player.
  games[gameHash].players[playerId] = {};
  let newPlayer = games[gameHash].players[playerId];
  newPlayer["playerId"] = playerId;
  newPlayer["playerPass"] = playerPass;
  newPlayer["playerName"] = ShrinkString(playerInfo.playerName, 20);
  newPlayer["playerLink"] = ShrinkString(playerInfo.playerLink, 100);
  newPlayer["avatar"] = playerInfo.avatar;
  newPlayer["res"] = res;

  // NOTE: try/catch is not working here since messages are async.
  // We handle them with an error event handler.
  // Notify worker.
  games[gameHash].worker.send({
    gameHash: gameHash,
    type: "addPlayer",
    message: {
      ...playerInfo,
      playerId: playerId,
      playerPass: playerPass,
      isWatcher: false
    }
  });
}

// Players can rejoin the game if they got disconnected.
function handleExistingPlayer(gameHash, playerId, res) {
  if (!(gameHash in games)) {
    console.log("Game " + gameHash + " does not exist.");
    res.send({ success: false });
    return;
  }

  let player = games[gameHash].players[playerId];
  if (player == undefined) {
    console.log("Game " + gameHash + " does not have player " + playerId);
    res.send({ success: false });
    return;
  }

  // Storing res to send success once player is added inside worker.
  player["res"] = res;

  // Notify worker.
  games[gameHash].worker.send({
    gameHash: gameHash,
    type: "rejoinPlayer",
    message: {
      playerId: playerId,
      playerPass: player.playerPass,
      isWatcher: false
    }
  });
}

// Callback once player has been processed by the worker.
function handleOnPlayerAddedMessage(gameHash, message) {
  if (message.success == undefined || message.playerId == undefined) {
    console.log("Bad OnPlayerAdded request. Some fields are missing.");
    return;
  }
  if (games[gameHash] == undefined) {
    console.log(
      "Bad OnPlayerAdded request. Game " + gameHash + " does not exist."
    );
    return;
  }
  let player = games[gameHash].players[message.playerId];
  if (player == undefined) {
    console.log(
      "Game " + gameHash + " does not have player " + message.playerId
    );
    return;
  }

  // Restoring res to send result back to the client.
  let res = player.res;
  // Client is required to know the host id, because some of the gameplay
  // logic depends whether player is a host or not.
  let hostId = HOST_GAME_ON_SERVER ? "serverHostId" : message.hostId;
  if (
    !message.success ||
    message.playerInfo == undefined ||
    message.playerInfo.avatar == undefined ||
    hostId == undefined
  ) {
    // TODO: If adding the first player failed we should stop the game immediately.
    console.log("Adding player failed.");
    res.send({ success: false });
    return;
  }
  // Update cached avatar (in case of random choice, game selected avatar for the player on its own).
  player.avatar = message.playerInfo.avatar;

  // TODO: check here for res.headerSent maybe to avoid double sending?
  res.send({
    success: true,
    mapId: games[gameHash].mapId,
    hostId: hostId,
    gameOptions: message.gameOptions,
    playerInfo: message.playerInfo,
    gameHash: gameHash, // for join game this is not required, but send anyway.
    serverGamePass: games[gameHash].serverGamePass,
    playerId: player.playerId,
    playerPass: player.playerPass,
    wsUrl: games[gameHash].wsUrl,
    gameBaseUrl: games[gameHash].gameBaseUrl
  });
}

// Callback once a new watcher has been added.
function handleOnWatcherAddedMessage(gameHash, message) {
  if (message.success == undefined || message.playerId == undefined) {
    console.log("Bad OnWatcherAdded request. Some fields are missing.");
    return;
  }
  if (games[gameHash] == undefined) {
    console.log(
      "Bad OnPlayerAdded request. Game " + gameHash + " does not exist."
    );
    return;
  }
  let watcher = games[gameHash].watchers[message.playerId];
  if (watcher == undefined) {
    console.log(
      "Game " + gameHash + " does not have watcher " + message.playerId
    );
    return;
  }

  // Recovering the res to send back the result back to the client.
  let res = watcher.res;

  // Failure
  if (!message.success) {
    console.log("adding watcher failed.");
    res.send({ success: false });
    return;
  }
  // Success
  res.send({
    success: true,
    mapId: games[gameHash].mapId,
    hostId: message.hostId,
    gameOptions: message.gameOptions,
    playerInfo: {},
    gameHash: gameHash, // for join game this is not required, but send anyway,
    serverGamePass: games[gameHash].serverGamePass,
    playerId: message.playerId,
    playerPass: watcher.playerPass,
    wsUrl: games[gameHash].wsUrl,
    gameBaseUrl: games[gameHash].gameBaseUrl
  });
}

// Fucntion to add a new watcher to the game.
// Note that each watcher is still considered as a "fake" player.
function handleNewWatcher(gameHash, res) {
  if (!(gameHash in games)) {
    console.log("Game " + gameHash + " does not exist.");
    return;
  }

  var playerId = randomString();
  var playerPass = randomString();

  games[gameHash].worker.send({
    gameHash: gameHash,
    type: "addPlayer",
    message: {
      playerId: playerId,
      playerPass: playerPass,
      isWatcher: true
    }
  });

  // Watchers data is way simpler than real players.
  games[gameHash].watchers[playerId] = { res, playerPass };
}

// Function to handle external player quit request (i.e., if player quits properly from the UI).
function handlePlayerQuitExternal(gameHash, playerId) {
  if (!(gameHash in games)) {
    console.log("Game " + gameHash + " does not exist.");
    return;
  }
  if (!(playerId in games[gameHash].players)) {
    console.log("Game " + gameHash + " does not have player " + playerId);
    return;
  }

  games[gameHash].worker.send({
    gameHash: gameHash,
    type: "removePlayer",
    message: { playerId: playerId }
  });

  handlePlayerQuitInternal(gameHash, playerId);
}

// Internal function that is called by the worker if it found that user's
// websocket is non-responding.
function handlePlayerQuitInternal(gameHash, playerId) {
  if (!(gameHash in games)) {
    console.log("Game " + gameHash + " does not exist.");
    return;
  }
  if (!(playerId in games[gameHash].players)) {
    console.log("Game " + gameHash + " does not have player " + playerId);
    return;
  }
  // Player is deleted from the game.
  delete games[gameHash].players[playerId];

  // Stop the game if noone is playing.
  if (Object.keys(games[gameHash].players).length == 0) {
    stopGame(gameHash);
  }
}

// Function called by the worker every ~50ms when game state is updated.
// TODO: We actually only use player list from the state.
// Perhaps we don't need to update it that often.
function updateGameState(gameHash, state) {
  if (!(gameHash in games)) {
    console.log("Game " + gameHash + " doesn't exit.");
    return;
  }
  games[gameHash].state = state;
}

// All the worker messages come through this function.
// NOTE: playerInfo and res are only used for the newGame messages.
function handleWorkerMessage(gameHash, type, message, playerInfo, res) {
  if (!(gameHash in games)) {
    console.log("Game " + gameHash + " doesn't exit.");
    return;
  }

  if (type == undefined) return;

  if (type == "newGame") {
    if (playerInfo == undefined || res == undefined) {
      console.log("Bad worker message.");
      return;
    }
    // Game has been created. Add the first player to it.
    handleNewPlayer(gameHash, playerInfo, res);
  } else if (type == "onPlayerAdded") {
    // Callback when player is added to the game.
    handleOnPlayerAddedMessage(gameHash, message);
  } else if (type == "onWatcherAdded") {
    // Callback when watcher is added to the game.
    handleOnWatcherAddedMessage(gameHash, message);
  } else if (type == "newState") {
    // Called by the worker periodically to update player info that needs to be sent to the operator.
    if (message.state == undefined) return;
    updateGameState(gameHash, message.state);
  } else if (type == "playerDisconnected") {
    // Called by the worker when player drops ws connection.
    handlePlayerQuitInternal(gameHash, message.playerId);
  } else if (type == "heartbeat") {
    // Heartbeat message from the worker.
    handleHeartbeat(gameHash);
  } else if (type == "newHostInfo") {
    // Called by the worker if host info changed.
    updateGameHostInfo(gameHash, message.hostInfo);
  } else if (type == "stopGame") {
    // Called by the worker if there are no active players left.
    stopGame(gameHash);
  }
}

// Update host info, which is sent to the operator.
function updateGameHostInfo(gameHash, hostInfo) {
  if (!(gameHash in games)) {
    console.log("Game " + gameHash + " doesn't exit.");
    return;
  }
  games[gameHash].hostInfo = hostInfo;
}

// Periodic function that checks worker health.
// If worker did not report heartbeat for more than 15 seconds,
// We stop the worker forcefully.
function checkWorkers() {
  let toStop = [];
  let maxTime = GetTime() - 15000;
  for (let gameHash in heartbeat) {
    if (heartbeat[gameHash] < maxTime) toStop.push(gameHash);
  }

  for (let gameHash of toStop) {
    console.log("No heartbeat from worker ", gameHash);
    stopGame(gameHash);
  }
  // Check every 7 seconds.
  setTimeout(() => checkWorkers(), 7000);
}

// Start periodic worker health check.
checkWorkers();

// Record worker's heartbeat.
function handleHeartbeat(gameHash) {
  if (!(gameHash in games)) {
    console.log("Game " + gameHash + " doesn't exit.");
    return;
  }
  heartbeat[gameHash] = GetTime();
}

// handleGame is the main function, which is getting called when endpoint gets a POST request.
// It is used for starting/stopping the game, as well as all other game actions.
function handleGame(req, res) {
  var type = req.body.type;

  //console.log(req.body);

  if (type == undefined) {
    res.send("Message type is not specified.");
    return;
  }

  // Create a new game function.
  // ===========================================================================
  if (type == "start") {
    let gameInfoJson = req.body.gameInfo;
    if (gameInfoJson == undefined) {
      res.send("No gameInfo in the start game request.");
      return;
    }

    // NOTE: All the start new game requests should go through the operator.
    // As opposed to join game requests, which will come directly from the client.
    // So we are checking operator's super secret password here.
    if (req.body.superSecretPassword != SUPER_SECRET_PASSWORD) {
      res.send("Error parsing request. Super secret password is wrong.");
      return;
    }

    // NOTE: At the moment we limit number of games to avoid spikes in CPU usage.
    if (Object.keys(games).length >= MAX_GAMES_PER_BACKEND) {
      res.send({
        success: false,
        msg:
          "Reached maximum number of games (" +
          MAX_GAMES_PER_BACKEND +
          ") allowed on this server."
      });
      return;
    }

    let gameInfo = undefined;
    try {
      gameInfo = JSON.parse(gameInfoJson);
    } catch {
      error => {
        gameInfo = undefined;
        console.log(error);
      };
    }

    if (gameInfo == undefined) {
      res.send({ success: false, msg: "Error parsing request." });
      return;
    }

    // NOTE: Sanitizing max players per game just in case.
    gameInfo.options.maxPlayers = Math.max(
      2,
      Math.min(gameInfo.options.maxPlayers, MAX_PLAYERS_PER_GAME)
    );

    // Starting a worker process that will handle the game.
    const worker = fork("./startWorker"); //{detached: true}

    // Generate a new game hash. If it miraculously already exists, generate until unique.
    let newGameHash = randomString();
    while (games[newGameHash] != undefined) {
      newGameHash = randomString();
    }

    // Create a server game password.
    let serverGamePass = randomString();
    // Find anunoccupied ws port between 9000 and 10000.
    let wsPort = GetFreeWsPort();
    // Record game started time for metrics.
    let timeStarted = GetTime();

    // Keep the game record.
    games[newGameHash] = {
      worker: worker,
      gameBaseUrl: GAME_BASE_URL,
      wsUrl: WS_BASE_URL + ":" + wsPort,
      wsPort: wsPort,
      mapId: gameInfo.mapId,
      gameName: gameInfo.gameName,
      gamePass: gameInfo.gamePass,
      options: gameInfo.options,
      serverGamePass: serverGamePass,
      players: {},
      watchers: {},
      timeStarted: timeStarted
    };

    // Reset the worker heartbeat.
    heartbeat[newGameHash] = GetTime();

    // Most of the internal errors are handled by the messages.
    // If there is an unhandled error (i.e., crash) we stop the game.
    worker.on("error", err => handleWorkerError(newGameHash, err));

    // Note all the messages are handled by the handleWorkerMessage.
    worker.on(
      "message",
      ({ gameHash: gameHash, type: type, message: message }) => {
        if (type == undefined) {
          console.log("Unknown message from worker: " + type);
          return;
        }
        if (games[gameHash] == undefined) {
          console.log("Game does not exist.");
          return;
        }

        var playerInfo =
          type == "newGame"
            ? {
                playerName: gameInfo.playerName,
                playerLink: gameInfo.playerLink,
                avatar: gameInfo.avatar
              }
            : undefined;

        handleWorkerMessage(gameHash, type, message, playerInfo, res);
      }
    );

    // NOTE: Each worker handles ONLY ONE game,
    // so it will not accept any further "newGame" messages
    // After game is done worker will be destroyed.
    // NOTE: After worker is done with initializing the game, it will send
    // a "newGame" message back.
    worker.send({
      gameHash: newGameHash,
      type: "newGame",
      message: {
        mapId: gameInfo.mapId,
        wsPort: wsPort,
        gameOptions: gameInfo.options
      }
    });
  }
  // ===========================================================================
  else if (type == "join") {
    // Join game request coming directly from the client.
    let gameHash = req.body.gameId;
    if (gameHash == undefined || games[gameHash] == undefined) {
      console.log("Game does not exist on this server.");
      res.send({
        success: false,
        msg: "Error. Game does not exist on this server"
      });
      return;
    }

    // NOTE: We sanitize the join game request here, but additional checks
    // are done at the worker (e.g., max players per game, avatar, etc).

    let gameInfoJson = req.body.gameInfo;
    if (gameInfoJson == undefined) {
      res.send({
        success: false,
        msg: "No gameInfo in the start game request."
      });
      return;
    }

    let gameInfo = undefined;
    try {
      gameInfo = JSON.parse(gameInfoJson);
    } catch {
      error => {
        gameInfo = undefined;
        console.log(error);
      };
    }

    if (gameInfo == undefined) {
      res.send({ success: false, msg: "Error parsing request." });
      return;
    }

    // Client gets game pass from operator. If password is wrong we ignore request.
    let gamePass = gameInfo.gamePass;
    if (
      games[gameHash].gamePass != "" &&
      games[gameHash].gamePass != gamePass
    ) {
      console.log("Wrong game password.");
      res.send({
        success: false,
        msg: "Error. Game is protected by a password."
      });
      return;
    }

    var playerInfo = {
      playerName: gameInfo.playerName,
      playerLink: gameInfo.playerLink,
      avatar: gameInfo.avatar
    };

    handleNewPlayer(gameHash, playerInfo, res);
  }
  // ===========================================================================
  else if (type == "watch") {
    // Adding a watcher to the game.
    let gameHash = req.body.gameId;
    if (gameHash == undefined || games[gameHash] == undefined) {
      console.log("Game does not exist on this server.");
      res.send({
        success: false,
        msg: "Error. Game does not exist on this server."
      });
      return;
    }

    if (
      games[gameHash].options.canWatch == undefined ||
      !games[gameHash].options.canWatch
    ) {
      console.log("Game is not allowed to watch.");
      res.send({
        success: false,
        msg: "Error. Game does not allow watching."
      });
      return;
    }

    // Check number of players/watchers by number of WS connections.
    // Currently only let up to 100 people total.
    if (games[gameHash].state.numWs > MAX_WATCHERS_PER_GAME) {
      res.send({
        success: false,
        msg: "Error. Reached maximum number of watchers in this game."
      });
      return;
    }

    let gameInfoJson = req.body.gameInfo;
    if (gameInfoJson == undefined) {
      res.send({
        success: false,
        msg: "No gameInfo in the start game request."
      });
      return;
    }

    let gameInfo = undefined;
    try {
      gameInfo = JSON.parse(gameInfoJson);
    } catch {
      error => {
        gameInfo = undefined;
        console.log(error);
      };
    }

    if (gameInfo == undefined) {
      res.send({ success: false, msg: "Error parsing request." });
      return;
    }

    // If game has password we assume that watchers also should know the password.
    let gamePass = gameInfo.gamePass;
    if (
      games[gameHash].gamePass != "" &&
      games[gameHash].gamePass != gamePass
    ) {
      console.log("Wrong game password.");
      res.send({
        success: false,
        msg: "Error. Game watching is protected by a password."
      });
      return;
    }
    // Request has been sanitized, send it to the worker.
    handleNewWatcher(gameHash, res);
  }
  // ===========================================================================
  else if (type == "stop") {
    // Function if player quits the game.
    // NOTE: This is not stopping the game itself. Simply stops the player.
    let gameHash = req.body.gameId;
    if (gameHash == undefined || games[gameHash] == undefined) {
      console.log("Game does not exist on this server.");
      res.send({
        success: false,
        msg: "Error. Game does not exist on this server."
      });
      return;
    }

    let gameInfoJson = req.body.gameInfo;
    if (gameInfoJson == undefined) {
      res.send({
        success: false,
        msg: "No gameInfo in the start game request."
      });
      return;
    }

    let gameInfo = undefined;
    try {
      gameInfo = JSON.parse(gameInfoJson);
    } catch {
      error => {
        gameInfo = undefined;
        console.log(error);
      };
    }

    if (gameInfo == undefined) {
      res.send({ success: false, msg: "Error parsing request." });
      return;
    }

    // To quit the game player has to provide accurate playerId and playerPass.
    let serverGamePass = gameInfo.serverGamePass;
    let playerId = gameInfo.userId;
    let playerPass = gameInfo.userPass;

    if (
      games[gameHash] == undefined ||
      games[gameHash].serverGamePass != serverGamePass
    ) {
      console.log("Wrong server game password.");
      res.send({ success: false, msg: "Wrong server game password." });
      return;
    }

    if (playerId == undefined || !(playerId in games[gameHash].players)) {
      console.log("Player does not exist.");
      res.send({ success: false, msg: "Player does not exist." });
      return;
    }

    if (games[gameHash].players[playerId].playerPass != playerPass) {
      console.log("User id/pass missmatch.");
      res.send({ success: false, msg: "User id/pass missmatch." });
      return;
    }

    // "External" function is called if request comes externally fro mthe client,
    // as opposed to client disconnecting without stopping, in which case
    // internal request will be called directly by the worker.
    handlePlayerQuitExternal(gameHash, playerId);
    console.log("Player " + playerId + " has quit game " + gameHash);
    res.send({ success: true, playerId: playerId, gameHash: gameHash });
    return;
  }
  // ===========================================================================
  else if (type == "rejoincheck") {
    // This message is a check sent by the frontend to find out if
    // player can join a game they were involunterily disconnected from.
    // NOTE: This check is required for the "rejoin previous game" button
    // to appear in the UI for the player to be able to click.
    let gameHash = req.body.gameId;
    if (gameHash == undefined || games[gameHash] == undefined) {
      console.log("Game does not exist on this server.");
      res.send({
        success: false,
        msg: "Error. Game does not exist on this server."
      });
      return;
    }

    let gameInfoJson = req.body.gameInfo;
    if (gameInfoJson == undefined) {
      res.send({
        success: false,
        msg: "No gameInfo in the start game request."
      });
      return;
    }

    let gameInfo = undefined;
    try {
      gameInfo = JSON.parse(gameInfoJson);
    } catch {
      error => {
        gameInfo = undefined;
        console.log(error);
      };
    }

    if (gameInfo == undefined) {
      console.log("error parsing request");
      res.send({ success: false, msg: "Error parsing request." });
      return;
    }

    let gamePass = gameInfo.gamePass;
    if (
      games[gameHash].gamePass != "" &&
      games[gameHash].gamePass != gamePass
    ) {
      console.log("Wrong game password.");
      res.send({
        success: false,
        msg: "Error. Game is protected by a password."
      });
      return;
    }

    let playerId = gameInfo.playerId;
    let playerPass = gameInfo.playerPass;
    if (
      games[gameHash].players[playerId] == undefined ||
      games[gameHash].players[playerId].playerPass != playerPass
    ) {
      console.log("Wrong player password.");
      res.send({
        success: false,
        msg: "Error. Game is protected by a password."
      });
      return;
    }
    res.send({ success: true });
  }
  // ===========================================================================
  else if (type == "rejoin") {
    // This message is an actual rejoin request.
    let gameHash = req.body.gameId;
    if (gameHash == undefined || games[gameHash] == undefined) {
      console.log("Game does not exist on this server.");
      res.send({
        success: false,
        msg: "Error. Game does not exist on this server."
      });
      return;
    }

    let gameInfoJson = req.body.gameInfo;
    if (gameInfoJson == undefined) {
      res.send({
        success: false,
        msg: "No gameInfo in the start game request."
      });
      return;
    }

    let gameInfo = undefined;
    try {
      gameInfo = JSON.parse(gameInfoJson);
    } catch {
      error => {
        gameInfo = undefined;
        console.log(error);
      };
    }

    if (gameInfo == undefined) {
      res.send({ success: false, msg: "Error parsing request." });
      return;
    }

    let gamePass = gameInfo.gamePass;
    if (
      games[gameHash].gamePass != "" &&
      games[gameHash].gamePass != gamePass
    ) {
      console.log("Wrong game password.");
      res.send({
        success: false,
        msg: "Error. Game is protected by a password."
      });
      return;
    }

    let playerId = gameInfo.playerId;
    let playerPass = gameInfo.playerPass;
    if (
      games[gameHash].players[playerId] == undefined ||
      games[gameHash].players[playerId].playerPass != playerPass
    ) {
      console.log("Wrong player password.");
      res.send({
        success: false,
        msg: "Error. Game is protected by a password."
      });
      return;
    }

    // Send a rejoin request to the worker.
    handleExistingPlayer(gameHash, playerId, res);
  }
}

// In case of unhandled errors (i.e., worker crashes) we stop the game, and remove from the list.
function handleWorkerError(gameHash, error) {
  console.log("Got unhandled error from worker", gameHash);
  if (!(gameHash in games)) return;
  stopGame(gameHash);
}

// Stop the game, kill the worker, release the ws port, and remove from games.
function stopGame(gameHash) {
  if (!(gameHash in games)) return;
  console.log(new Date(), "Stopping game ", gameHash);

  games[gameHash].worker.kill();
  ReleaseWsPort(games[gameHash].wsPort);
  delete games[gameHash];
  delete heartbeat[gameHash];
}
