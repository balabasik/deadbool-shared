const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
const request = require("request");
const intoStream = require("into-stream");
const fs = require("fs");
const https = require("https");
const http = require("http");
require("log-timestamp");
const read = fs.readFileSync;
const write = fs.writeFileSync;
const nodemailer = require("nodemailer");

const agent = new https.Agent({
  rejectUnauthorized: false
});

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "fake_key";

// "pem" for convenience to avoid git overwriting file, as we anyway exclude all pem files in gitignore.
const BLACKLIST_LOCATION = process.env.BLACKLIST_LOCATION || "blacklist.pem";

// Environment variable to enable/disable ssl.
// NOTE: Has to be the same across backend/operator/frontend.
const USE_SSL = (process.env.USE_SSL || 0) == 1;
console.log("USE_SSL", USE_SSL);

// Operator listens on port 8000. Backends and frontend will access this port.
const PORT = 8000;

// Self ip is required to send emails with statistics about the games.
const IP = process.env.IP || "localhost";

// Password used to communicate between backends and operator.
var SUPER_SECRET_PASSWORD =
  process.env.SUPER_SECRET_PASSWORD || "SUPER_SECRET_PASSWORD";

// Holder for chat messages.
var chatMessages = [];
const MESSAGE_HISTORY_LIMIT = 100;

// =============== UTILITY FUNCTIONS ==============
function RandomString() {
  return Math.random()
    .toString(36)
    .substring(7);
}
function RandomShortString() {
  return Math.random()
    .toString(36)
    .substring(0, 3);
}
function ShrinkString(s, n) {
  return s.length > n ? s.substr(0, n - 1) : s;
}
function GetTime() {
  let d = new Date();
  return d.getTime();
}
// =============== UTILITY FUNCTIONS ==============

// Server setup.
app.use("/", express.static("."));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true // to support URL-encoded bodies
  })
);
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.use(cors());

// Supported endpoints.
app.get("/gamelist", (req, res) => getGamelist(req, res));
app.get("/serverlist", (req, res) => getServerlist(req, res));
app.get("/newslist", (req, res) => getNewslist(req, res));
app.post("/chat", (req, res) => handleChat(req, res));
app.post("/post_gamelist", (req, res) => postGameList(req, res));
app.post("/start", (req, res) => startGame(req, res));
app.get("/random_youtube_link", (req, res) => getRandomYoutubeLink(req, res));

// ------------------------- HTTPS SETUP -----------------------------
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

// TODO: Figure out if we want to use both at some point.
if (USE_SSL) {
  https.createServer(credentials, app).listen(PORT, function() {
    console.log(`HTTPS port ${PORT}`);
  });
} else {
  http.createServer(credentials, app).listen(PORT, function() {
    console.log(`HTTP port ${PORT}`);
  });
}
// --------------------------------------------------------------------

// We use "pem" extension for convenience to avoid git overriding files when syncing.
// Client reads the supported servers and displays in the menu UI.
var SERVERS_LOCATION = process.env.SERVERSLOCATION || "servers.pem";
var serversRaw = undefined;
try {
  serversRaw = read(SERVERS_LOCATION, "utf8").split(",");
} catch {
  err => {
    console.log("servers file is not found");
  };
}
/*
"uswest.operator.arena.deadbool.com",
"dev.operator.arena.deadbool.com",
"taiwan.operator.arena.deadbool.com"
*/
var servers = [];
if (serversRaw != undefined) {
  serversRaw.forEach(function(line) {
    servers.push(line.trim());
  });
}

console.log("Found available servers: ", servers);

// Some statistics for reference
// Counted every time a new game starts
var totalGamesPerDayCounter = 0;
// Counted every time player joins the game
var totalPlayersPerDayCounter = 0;
// Accumulated based on length of each game
var totalGameHoursPlayedPerDayCounter = 0;

const STATS_SENDER_GMAIL_ADDRESS = process.env.STATS_SENDER_GMAIL_ADDRESS;
const STATS_SENDER_GMAIL_PASSWORD = process.env.STATS_SENDER_GMAIL_PASSWORD;
const STATS_RECEIVER_GMAIL_ADDRESS = process.env.STATS_RECEIVER_GMAIL_ADDRESS;
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: STATS_SENDER_GMAIL_ADDRESS,
    pass: STATS_SENDER_GMAIL_PASSWORD
  }
});
// Email statistics about the games in past 12 hours.
function emailCounters() {
  const message = {
    from: STATS_SENDER_GMAIL_ADDRESS, // Sender address
    to: STATS_RECEIVER_GMAIL_ADDRESS, // List of recipients
    subject:
      "[" +
      IP +
      "] Games: " +
      totalGamesPerDayCounter +
      " Players: " +
      totalPlayersPerDayCounter +
      " Hours: " +
      Math.round(totalGameHoursPlayedPerDayCounter * 100) / 100
  };
  transporter.sendMail(message, function(err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
}

var firstBoot = true;
function sendAndResetDayCounters() {
  // NOTE: Do not send stats on the very first boot.
  if (!firstBoot) emailCounters();
  else firstBoot = false;
  console.log(
    "Counters: ",
    totalGamesPerDayCounter,
    totalPlayersPerDayCounter,
    totalGameHoursPlayedPerDayCounter
  );
  totalGamesPerDayCounter = 0;
  totalPlayersPerDayCounter = 0;
  totalGameHoursPlayedPerDayCounter = 0;
  setTimeout(() => sendAndResetDayCounters(), 12 * 3600 * 1000); // checking every 1/2 day
}
sendAndResetDayCounters();

// List of games on all the backend servers.
var gameList = {};
// Variable holding the available backend servers.
var activeServers = {};
// Servers that need to update git and restart.
var blacklistedServers = {};

// Monitor backends and cleanup if inactive for more than 60 seconds.
function periodicServerCleanup() {
  let toDelete = [];
  let maxTime = GetTime() - 60000;
  for (let key in activeServers) {
    if (activeServers[key].lastUpdated < maxTime) toDelete.push(key);
  }
  for (let key of toDelete) {
    delete activeServers[key];
  }

  if (toDelete.length > 0) updateCachedGameList();
  setTimeout(() => periodicServerCleanup(), 60000); // checking every 60 seconds
}

// Blacklist is set by the monitor service once it decides that some backend is out of date and needs updating.
// Watching blacklist file stamp every 30 seconds.
fs.watchFile(BLACKLIST_LOCATION, { interval: 5000 }, (curr, prev) => {
  checkBlacklist();
});

function checkBlacklist() {
  let blacklist = undefined;
  let blacklistJson = undefined;
  try {
    blacklist = read(BLACKLIST_LOCATION, "utf8");
    blacklistJson = JSON.parse(blacklist);
  } catch {
    err => {
      console.log("blacklist is not found");
    };
  }

  if (blacklistJson == undefined) return;
  // NOTE: It is anticipated that blacklist size is 1
  console.log("Blacklisted:", blacklistJson);

  blacklistedServers = blacklistJson;
  updateCachedGameList();
}

// Log game stats for debugging and metrics.
function periodicGameStatsLogging() {
  console.log(
    "[BEGIN_SERVER_STATS]",
    GetTime(),
    gameList,
    "[END_SERVER_STATS]"
  );
  setTimeout(() => periodicGameStatsLogging(), 30000); // logging every 30 seconds
}

periodicServerCleanup();
periodicGameStatsLogging();

// Helper function to get random youtube link.
// Start by getting a 3-character random string, and then query the youtube API.
function getRandomYoutubeLink(req, res) {
  let key = YOUTUBE_API_KEY;
  let q = RandomShortString();
  fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&key=${key}&type=video&maxResults=11`,
    {
      mode: "cors"
    }
  )
    .then(response => response.json())
    .then(data => {
      //console.log(data);
      if (data.items == undefined || data.items.length == 0) {
        res.send({ link: "" });
        return;
      }
      let x = Math.floor(Math.random() * data.items.length);
      let link = "https://www.youtube.com/embed/" + data.items[x].id.videoId;
      res.send({ link });
    })
    .catch(error => {
      console.log(error);
      res.send({ link: "" });
    });
}

// Client queries this API to get the active operator servers (i.e., international).
function getServerlist(req, res) {
  // TODO: Add some simple authentication with a static password.
  res.send({ servers });
}

// TODO: Put it into database, to simplify updates.
const news = [
  {
    date: "04/01/2020",
    text:
      "Don't be a Fool, play Deadbool! Both get 10 frags headstart.. For real.."
  },
  {
    date: "03/13/2020",
    text:
      "In support of social distancing against COVID-19, Deadbool will not leave his homepage. #stayhome #noredirect"
  },
  {
    date: "02/17/2020",
    text: "Trump's walls just got 2x bigger! Happy president's day."
  },
  {
    date: "01/15/2020",
    text: "Finally sober."
  },
  {
    date: "01/01/2020",
    text: "2020 is here everybody! Sober up and fight."
  },
  {
    date: "25/12/2019",
    text: "Merry XL-MAS! On this special day Jesus gets +100% to all stats!"
  },
  {
    date: "31/10/2019",
    text: "Deadbool is alive! Happy Halloween everybody!"
  },
  {
    date: "15/10/2019",
    text: "Copyrights suck. Considering to rename the game to Deadpoop Arena."
  },
  { date: "25/09/2019", text: "Trump is getting impeached. Well done Batman!" },
  {
    date: "15/09/2019",
    text: "We were live for five minutes! Declaring success."
  }
];

// Client queries and populates the news list.
function getNewslist(req, res) {
  // TODO: Add some simple authentication with a static password.
  res.send({ news });
}

// Client queries this API to get the existing game list.
function getGamelist(req, res) {
  // TODO: Add some simple authentication with a static password.
  res.send({ games: gameList });
}

// Simple load balancer algo to pick a backend server for the new game.
function pickServer() {
  // NOTE: Just getting the server that hosts minimum number of games.
  // TODO: Maybe use min heap?
  if (Object.keys(activeServers).length == 0) return undefined;
  let minId = undefined;
  let minGames = -1;
  for (let id in activeServers) {
    // NOTE: Checking the blacklist and do not schedule games on a blacklisted server.
    if (id in blacklistedServers) {
      console.log("Server " + id + " is blacklisted. Skipping.");
      continue;
    }
    if (
      minId == undefined ||
      Object.keys(activeServers[id].games).length < minGames
    ) {
      minId = id;
      minGames = Object.keys(activeServers[id].games).length;
    }
  }
  return minId;
}

// Helper to create url encoding.
function urlEncodeObject(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

// API to start a new game.
function startGame(req, res) {
  // TODO: Add some simple authentication with a static password.
  // NOTE: loadbalancer decides which server to forward the message to.
  let serverUrl = pickServer();
  if (serverUrl == undefined) {
    res.send({ success: false });
    console.log("failed to pick server");
    return; // TODO: Send error to the client
  }
  serverUrl += "/game";
  console.log("Redirecting new game request to " + serverUrl);
  // TODO: we want to add password to the request, and handle errors somehow
  //req.pipe(request.post(serverUrl)).pipe(res);

  // TODO: Consider sanitizing the request body.
  let newBody = urlEncodeObject({
    ...req.body,
    superSecretPassword: SUPER_SECRET_PASSWORD
  });

  //console.log(newBody);
  // Forwarding request to the selected backend server.
  fetch(serverUrl, {
    method: "POST",
    //mode: "cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: newBody
    //agent: USE_SSL ? agent : "" // NOTE: this is needed to reject unauthorized
  })
    .then(response => response.json())
    .then(data => res.send(data))
    .catch(error => {
      console.log(error);
      res.send({ success: false });
    });
}

// Cache games which then will be sent to the client.
function updateCachedGameList() {
  let temp = {};
  // NOTE: We do not show games from the blacklisted servers so that server can reboot.
  for (let key in activeServers) {
    if (key in blacklistedServers) continue;
    let server = activeServers[key];

    for (let gameKey in server.games) {
      //console.log(server.games[gameKey].hostInfo);
      temp[gameKey] = server.games[gameKey];
      // Increment counter if this is the first time we see the game.
      // NOTE: This is not very precise, but don't really care that much..
      if (gameList[gameKey] == undefined) {
        totalGamesPerDayCounter++;
        totalPlayersPerDayCounter += server.games[gameKey].activePlayers;
      } else if (
        gameList[gameKey].activePlayers < server.games[gameKey].activePlayers
      ) {
        totalPlayersPerDayCounter +=
          server.games[gameKey].activePlayers - gameList[gameKey].activePlayers;
      }
    }
  }

  // Check games that ended, and update the total time played.
  for (let key in gameList) {
    if (temp[key] == undefined) {
      let now = GetTime();
      totalGameHoursPlayedPerDayCounter +=
        (now - gameList[key].timeStarted) / 1000 / 3600; // hours
    }
  }

  gameList = temp;
}

// Menu chat messages handler.
function handleNewChatMessage(submit) {
  if (submit == undefined || submit.text == undefined || submit.text == "")
    return;

  submit.playerName = ShrinkString(submit.playerName, 20);
  submit.text = ShrinkString(submit.text, 200);
  //console.log(submit);
  submit.hash = RandomString();
  if (submit.playerName == "" || submit.playerName == undefined)
    submit.playerName = "Anonymous";
  chatMessages.push(submit);

  if (chatMessages.length > 2 * MESSAGE_HISTORY_LIMIT)
    chatMessages.splice(0, chatMessages.length - MESSAGE_HISTORY_LIMIT);
}

// Clients query this API to get al lthe chat messages.
function handleChat(req, res) {
  let lastMessage = req.body.lastMessage;
  let submitJson = req.body.submit;

  if (submitJson != undefined) {
    let submit = {};
    try {
      submit = JSON.parse(submitJson);
      handleNewChatMessage(submit);
    } catch {
      error => {
        console.log(error);
      };
    }
  }

  if (lastMessage != undefined) {
    // TODO: Need to make it O(1).. but we sometimes reduce the array,so not sure how..
    let foundHash = false;
    let newMessages = [];
    let index = 0;
    for (let message of chatMessages) {
      if (message.hash == lastMessage) {
        foundHash = true;
        newMessages = chatMessages.slice(index + 1);
        break;
      }
      index++;
    }
    if (foundHash) {
      res.send({ messages: newMessages });
    } else {
      res.send({ messages: chatMessages });
    }
  }
}

// Backend files are used by monitor to check if backends need update.
function writeBackendFiles() {
  console.log("Number of active servers: " + Object.keys(activeServers).length);
  for (let id in activeServers) {
    let record = activeServers[id].record;
    // NOTE: id = https://backend1.dev.arena.deadbool.com:5000
    // We use the instanceName as the filename
    try {
      // NOTE: It is important that file name is in sync with server ID.
      // NOTE2: pem extension to keep it away from git.
      write(
        "backend_info/" + record.instanceName + ".pem",
        JSON.stringify(record)
      );
      console.log("wrote " + record.instanceName);
    } catch {
      err => {
        console.log("Writing failed.");
      };
    }
  }
}

// Helper to periodically write backend stats.
function periodicWriteBackendFiles() {
  writeBackendFiles();
  setTimeout(() => periodicWriteBackendFiles(), 60 * 1000); // every 1 minute
}
periodicWriteBackendFiles();

// API called by backend servers with the current statistics about the games being played.
function postGameList(req, res) {
  let id = req.body.id;
  let pass = req.body.pass;
  //console.log("postGamelist");

  // Super secret password is used to validate authenticity of the backend.
  if (pass != SUPER_SECRET_PASSWORD) {
    console.log("Wrong password.");
    res.send({ success: false });
    return;
  }

  let gitHash = req.body.gitHash;
  if (gitHash == undefined) {
    console.log("Wrong format, no githash.");
    res.send({ success: false });
    return;
  }

  let instanceName = req.body.name;
  if (instanceName == undefined) {
    console.log("Wrong format, no instance name.");
    res.send({ success: false });
    return;
  }

  let instanceZone = req.body.zone;
  if (instanceZone == undefined) {
    console.log("Wrong format, no instance zone.");
    res.send({ success: false });
    return;
  }

  let gamesJson = req.body.games;
  if (gamesJson == undefined) {
    console.log("Wrong format.");
    res.send({ success: false });
    return;
  }

  let games = {};
  try {
    games = JSON.parse(gamesJson);
  } catch {
    error => {
      console.log(error);
      res.send({ success: false });
    };
  }

  if (games == undefined || games.games == undefined) {
    console.log("No games in the request.");
    res.send({ success: false });
    return;
  }

  console.log("Got " + Object.keys(games.games).length + " games from " + id);
  res.send({ status: "ok" });

  let now = GetTime();
  let record = {
    id: id,
    lastUpdated: now,
    instanceName: instanceName,
    instanceZone: instanceZone,
    gitHash: gitHash,
    nGames: Object.keys(games.games).length
  };

  activeServers[id] = {
    games: games.games,
    lastUpdated: now,
    gitHash: gitHash,
    record: record
  };
  updateCachedGameList();
}
