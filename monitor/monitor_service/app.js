const path = require("path");
const bodyParser = require("body-parser");
const { exec, execSync } = require("child_process");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
const write = fs.writeFileSync;
const read = fs.readFileSync;
const https = require("https");
const http = require("http");

const GIT_TOKEN = process.env.GIT_TOKEN || "fake_token";
const AREA_CODE = process.env.AREA_CODE || "dev";
const BRANCH = AREA_CODE == "dev" ? "master" : "release";

// TODO: replace rundir with process.env.RUNDIR!!!
const RUNDIR = process.env.RUNDIR || "/home/rundir";

// NOTE: Relative folder to monitor/monitor_service
const OPERATOR_FOLDER = "../../operator";
const BLACKLIST_LOCATION =
  OPERATOR_FOLDER + "/" + (process.env.BLACKLIST_LOCATION || "blacklist.pem");

// NOTE: Git hash update frequency is okay to be slow (10min)
const UPDATE_GIT_HASH_FREQ = 600; // sec

function GetTime() {
  let d = new Date();
  return d.getTime();
}

var remoteGitHash = {};
// Helper function to get git hashes to backend/frontend/operator folders from github.
function getRemoteGitHash(folder) {
  let url = `https://api.github.com/repos/balabasik/deadbool/commits?path=${folder}&page=1&per_page=1&branch=${BRANCH}`;
  fetch(url, {
    method: "GET",
    mode: "cors",
    headers: {
      //"Content-Type": "application/x-www-form-urlencoded",
      Authorization: `token ${GIT_TOKEN}`
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.length != 1 || data[0].sha == undefined) {
        console.log("Bad data format.");
        return;
      }
      // TODO: get first 7 letters of the sha, as this is what git log does.
      let newHash = data[0].sha.substring(0, 7);
      console.log(
        Date(),
        folder,
        "New remote hash: " + newHash + " old hash: " + remoteGitHash[folder]
      );
      if (newHash != remoteGitHash[folder]) {
        // NOTE: Update has to be triggered after we set the new remote hash!!!
        remoteGitHash[folder] = newHash;
        triggerFolderUpdate(folder);
      }
    })
    .catch(err => {
      console.log(err);
    });
}

// We deliberately potentially read older hash to update pm2 if needed.
function getLocalGitHash(folder) {
  let stdout = undefined;
  try {
    stdout = execSync(`cat ../../${folder}/git_head_hash.pem`)
      .toString()
      .trim();
  } catch {
    error => console.log(error);
  }
  if (stdout == undefined) return;
  console.log(Date(), "Local hash for " + folder + " is " + stdout);
  return stdout;
}

function fetchStartScript(newRelativeDir) {
  // NOTE: START_SCRIPT is fetched into the monitor directory.
  try {
    let stdout = execSync(
      `sudo ./../../FETCH_START_SCRIPT.sh ; mv START_SCRIPT.sh ../../${newRelativeDir}/`
    ).toString();
  } catch {
    err => console.log(err);
  }
  // TODO: Check if the fetch was successfull.
}

function isLocalBehindRemote(folder) {
  let remoteHash = remoteGitHash[folder];
  let localHash = getLocalGitHash(folder);

  if (remoteHash == localHash) {
    console.log(Date(), folder + " is up to date! Hash: " + remoteHash);
    return false;
  }
  console.log(Date(), folder + " is behind the remote.");
  return true;
}

// Returns "retrySoon"
var localUpdatePending = {};
function updateLocalIfNeeded(folder) {
  if (localUpdatePending[folder]) return true;
  if (remoteGitHash[folder] == undefined) return true; // retry soon;
  if (!isLocalBehindRemote(folder)) return false; // retry later
  localUpdatePending[folder] = true;
  fetchStartScript(folder);
  let override = folder == "operator" ? "operator_only" : folder;
  // NOTE: Need to execute as sudo since the START script is executed as reboot
  // when instances start on google cloud to avoid permission issues.
  let stdout = execSync(
    `OVERRIDE_MODE=${override} sudo -E ./../../${folder}/START_SCRIPT.sh`
  ).toString();
  if (isLocalBehindRemote(folder))
    console.log(Date(), folder + " update failed.");
  else console.log(Date(), folder + " update successfull!");
  localUpdatePending[folder] = false;
  return true;
}

function periodicLocalUpdate(folder) {
  let soon = updateLocalIfNeeded(folder);
  setTimeout(() => periodicLocalUpdate(folder), (soon ? 180 : 600) * 1000); // checking local updates every 1-10 min
}

var backendUpdatePending = undefined;
var toBlacklist = undefined;
function updateBackendIfNeeded() {
  let remoteHash = remoteGitHash["backend"];
  if (remoteHash == undefined) return true; // retry soon;
  let backendFiles = readOperatorFiles();
  console.log(
    Date(),
    "Found " + Object.keys(backendFiles).length + " backend files."
  );

  // NOTE: Operator does not erase old backend files. We have to check for timestamp here.
  // NOTE: Backend sends updates to operator every 2 seconds, but operator writes files every 60 seconds.
  // So we will check for updates every 3 minutes.
  // Consider backends that are idle for more than 10 seconds inactive.
  let toDelete = [];
  let now = GetTime();
  for (let key in backendFiles) {
    if (backendFiles[key].lastUpdated < now - 180 * 1000) {
      console.log(
        now,
        "Warning: " +
          backendFiles[key].instanceName +
          " still inactive!! Last updated: " +
          backendFiles[key].lastUpdated
      );
      toDelete.push(key);
    }
  }
  for (let key of toDelete) delete backendFiles[key];

  // We go through the backendUpdatePending and check their presense in the operatorFiles.
  // If the server is missing from the operator files we issue warning, and remove it from
  // update pending list to unblock other updates (this can happen if server is removed during update, or is broken).
  if (backendUpdatePending != undefined) {
    let backend = backendFiles[backendUpdatePending];
    if (backend == undefined) {
      console.log(
        Date(),
        "Warning! Backend " +
          backendUpdatePending +
          " is not anymore in the operator list!"
      );
      backendUpdatePending = undefined;
      toBlacklist = undefined;
    } else {
      let localHash = backend.gitHash;
      if (localHash == remoteHash) {
        console.log(
          Date(),
          "Backend " +
            backendUpdatePending +
            " was successfully updated to hash " +
            localHash
        );
        backendUpdatePending = undefined;
        toBlacklist = undefined;
      } else {
        // TODO: Add limit on number of retries here.
        console.log(
          Date(),
          " Backend " +
            backendUpdatePending +
            " did not update to hash " +
            remoteHash +
            " retrying."
        );
      }
    }
  }

  // If there is no update pending pick the next server from the operator list.
  // NOTE: First check servers with 0 ongoing games.
  if (
    backendUpdatePending == undefined &&
    Object.keys(backendFiles).length > 1
  ) {
    for (let key in backendFiles) {
      let backend = backendFiles[key];
      let localHash = backend.gitHash;
      if (localHash == remoteHash) {
        console.log(
          Date(),
          key + " is up to date with remote. Hash: " + localHash
        );
        continue;
      } else if (backend.nGames == 0) {
        backendUpdatePending = key;
        toBlacklist = key;
        console.log(
          Date(),
          key + " is behind the remote. Scheduling for update."
        );
        // NOTE: It makes sense to update backends one by one, not all at once!
        // Therefore we break here.
        break;
      }
    }
  }

  // NOTE: Pick a server with non-zero games and blacklist it (unless we already blacklisted something).
  if (
    backendUpdatePending == undefined &&
    toBlacklist == undefined &&
    Object.keys(backendFiles).length > 1
  ) {
    for (let key in backendFiles) {
      let backend = backendFiles[key];
      let localHash = backend.gitHash;
      if (localHash == remoteHash) {
        console.log(
          Date(),
          key + " is up to date with remote. Hash: " + localHash
        );
        continue;
      } else {
        toBlacklist = key;
        console.log(
          Date(),
          key +
            " is behind the remote. Blacklisting to stop games advertising. Currently running games: " +
            backend.nGames
        );
        // NOTE: It makes sense to update backends one by one, not all at once!
        // Therefore we break here.
        break;
      }
    }
  }

  let toBlacklistJson = {};
  if (toBlacklist != undefined) toBlacklistJson[toBlacklist] = true;

  // Recording into blacklist (even if empty).
  try {
    write(BLACKLIST_LOCATION, JSON.stringify(toBlacklistJson));
  } catch {
    err => {
      console.log("Writing failed.");
    };
  }

  if (backendUpdatePending != undefined) {
    let backend = backendFiles[backendUpdatePending];
    if (backend.nGames != 0)
      console.log("ERROR!!!! TRYING TO STOP SERVER WITH ONGOING GAMES!!");
    else updateBackend(backend);
  }
  return backendUpdatePending != undefined || toBlacklist != undefined; // retrySoon;
}

function periodicBackendUpdate() {
  let soon = updateBackendIfNeeded();
  setTimeout(() => periodicBackendUpdate(), (soon ? 180 : 600) * 1000); // checking frontend updates every 1-10 min
}

function readOperatorFiles() {
  // Find all files "backend1.dev.arena.deadbool.com.pem" in "../../operator/backend_info" directory
  let files = [];
  try {
    files = fs.readdirSync("./../../operator/backend_info");
  } catch {
    err => {
      console.log(err);
    };
  }
  let backendInfo = {};
  //console.log(files);
  for (let file of files) {
    let backendJson = undefined;
    try {
      let backend = read("./../../operator/backend_info/" + file, "utf8");
      backendJson = JSON.parse(backend);
    } catch {
      err => {
        console.log("backend file is not found");
      };
    }
    if (backendJson == undefined || backendJson.id == undefined) continue;
    backendInfo[backendJson.id] = backendJson;
  }
  return backendInfo;
}

var authToken = { access_token: "", expires_in: 0 };
function refreshAuthToken() {
  let stdout = execSync(
    `curl "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" -H "Metadata-Flavor: Google"`
  ).toString();
  try {
    authToken = JSON.parse(stdout);
  } catch {
    err => {
      console.log(err);
      authToken = { access_token: "", expires_in: 300 };
    };
  }
  console.log(Date(), "Auth token expires in " + authToken.expires_in);
  setTimeout(() => refreshAuthToken(), (authToken.expires_in / 2) * 1000); // milliseconds
}

function updateBackend(backend) {
  /*
  let record = {
    id: id,
    lastUpdated: now,
    instanceName: instanceName,
    instanceZone: intanceZone,
    gitHash: gitHash,
    nGames: Object.keys(games.games).length
  };
  // To restart the backend instance
  curl -X POST -H "Authorization: Bearer TOKEN" https://www.googleapis.com/compute/v1/projects/deadbool/zones/us-west2-a/instances/backend1-dev/start
  */

  // NOTE: Zone is given in the format: projects/[NUMERIC_PROJECT_ID]/zones/[ZONE]
  console.log(backend.instanceZone);
  var zone = backend.instanceZone.split("/").slice(-1)[0]; // last element
  console.log(zone, backend.instanceName);
  // NOTE: NOT SYNC!
  // NOTE2: We ssh as root, and rundir is set to /home/rundir
  let stdout = execSync(
    `gcloud compute ssh ${
      backend.instanceName
    } --zone ${zone} --command "${RUNDIR}/deadbool/FETCH_AND_RUN_START_SCRIPT.sh"`,
    (stdout, err) => {
      console.log(stdout, err);
    }
  ).toString();
  console.log(stdout);
}

function periodicRemoteHashUpdate() {
  getRemoteGitHash("frontend");
  getRemoteGitHash("backend");
  getRemoteGitHash("operator");
  setTimeout(() => periodicRemoteHashUpdate(), UPDATE_GIT_HASH_FREQ * 1000); // milliseconds
}

function triggerFolderUpdate(folder) {
  if (folder == "backend") updateBackendIfNeeded();
  else updateLocalIfNeeded(folder);
}

refreshAuthToken();
periodicRemoteHashUpdate();
periodicLocalUpdate("frontend");
periodicLocalUpdate("operator");
periodicBackendUpdate();
