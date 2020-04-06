import Player from "./player";
import Box from "./box";
import Geometry from "./geometry";
import { Linear } from "./box";
import Bullet from "./bullet";
import Physics from "./physics";
import Light, { Fan } from "./miscObjects";
import LoadMap1 from "./map1";
import Timer from "./timer";

const defaultBoxStyle = { backgroundColor: "blue" };
const teleportStyle = { backgroundColor: "yellow" };
const springStyle = { backgroundColor: "red" };

class GameState {
  // Timestamp is needed to compute positions of dynamic elements
  constructor(mapId, physics) {
    this.mapId = mapId;
    this.physics = physics;
    // NOTE: Timestamp is not in physics stats as it is treated separately in physics.
    this.timeStamp = 0; // represents the game absolute time (based on server)
    this.serverTimeStamp = 0;
    this.serverDelay = 0;
    this.thisPlayer = "";
    this.players = {};
    this.playerKeys = {};
    this.bullets = {};
    this.boxes = {};
    this.chatManager = undefined;
    this.soundManager = undefined;
    this.newChatMessages = [];
    this.copyPlayers = {};

    // Physics stats that interact with the players and spells
    // NOTE: It evolved to include everything that needs to be passed to the clients
    this.resetPhysicsStats();
    // ---------------------------------------------

    this.perks = {};
    this.timers = []; // actual timers holder
    this.initTimerStats = []; // used to init timer stats
    this.gameMessage = "";
    this.playerBirthPlaces = [[0, 0]];
    this.perksCreationPlaces = [[0, 0]];
    this.lights = [];
    this.backlights = [];
    this.fan = undefined;
    this.iframeBox = undefined;
    if (mapId == "1") {
      LoadMap1(this, this.physics.isServer());
    } else {
      //console.log("ERROR!!! MAP " + mapId + " is not supported!");
    }
    // NOTE: Timers can only be created by server
    if (this.physics.isServer()) this.initTimers();
  }

  initTimers() {
    // NOTE: Timers can only be created by server. Checking here because this function can be called externally
    if (!this.physics.isServer()) return;
    this.timers = [];

    for (let timerStat of this.initTimerStats) {
      let timer = new Timer(
        timerStat["timeout"],
        this.timeStamp,
        this.onTimerZero.bind(
          this,
          timerStat["id"],
          timerStat["perk"],
          timerStat["x"],
          timerStat["y"]
        )
      );
      this.timers.push(timer);
    }
  }

  onTimerZero(timerId, type, x, y) {
    if (this.timers[timerId].reset == undefined) return;
    this.physics.perkManager.createTimerPerk(
      type,
      x,
      y,
      this.timers[timerId].reset.bind(this.timers[timerId])
    );
  }

  resetPhysicsStats() {
    // NOTE: IT IS IMPORTANT THAT ALL THE FIELDS ARE DEFINED, AND FULLY FILLED!
    // Because we build/parse the protos from/into the object.
    this.physicsStats = {
      youtube: {
        activeLink: "",
        initTime: 0,
        activeYoutubePlayer: "",
        activeYoutubeTimer: 60000 // 60 seconds
      },
      lastSpell: -1,
      bulletsStopped: false,
      gravityG: 0.0044,
      activeSpells: {}, // id -> boolean
      breakWalls: false,
      dark: { active: false }, //, caster: "" },
      stopSpells: false,
      rightWing: { active: false }, //killer: "" },
      pickleRick: "",
      lightningActive: false,
      matrixActive: false,
      newBullets: [], // [Bullet]
      addExtraBoxes: {}, // key -> Box
      removeExtraBoxes: {}, // id -> boolean
      scrambleKeys: {
        active: false
        /*killer: "",
          mapping: {
          // TODO: change mapping to use shuffled array [0..n]
          leftKey: "",
          rightKey: "",
          upKey: "",
          downKey: "",
          rightClick: "",
          leftClick: "",
          magic1: "",
          magic2: "",
          magic3: ""
        }*/
      },
      // gameStatus is used to determine if the game is over or not
      gameStatus: { paused: false } //, showWinners: false, newGameTimeStamp: 0 }
    };
  }

  addPlayer(playerId, player) {
    this.players[playerId] = player;
  }
  removePlayer(playerId) {
    delete this.players[playerId];
  }

  // TODO: Create more generic loader.
  // Comment lines start with "//"
  // end of line is indicated by ";"
  // id box {static/dynamic} width height transform around center of the box(movex, movey, rotate clockwise, scalex, scaley)
  // {image/color} {blue/image_path}
  // playerBirth has {x,y} pairs of places where player may born
  /*
  width 1000
  height 200
  background image ./bg_1.png
  1 box static 100 50 0 0 0 1 1 color rgb(252,144,172) ;
  2 box static 100 50 200 200 0 1 1 color blue ;
  3 iframe static 200 200 ;
  4 playerBirth 0 0 30 30 60 60 100 0 ;
  5 spring 30 30 ;
  6 teleportInOut 20 20 100 100 ;
  7 spikes 20 20 ;
  8 objectBirth 10 10 ;
  */

  // NOT INTERACTABLE
  createBgBox(x, y, w, h, bgStyle, more) {
    let geometry = new Geometry();
    let id = Object.keys(this.boxes).length;
    let box = new Box(id, geometry, undefined, more);
    box.setLeftX(x);
    box.setBottomY(y);
    box.setH(h);
    box.setW(w);
    box.stats.style = bgStyle == undefined ? defaultBoxStyle : bgStyle;
    box.stats.interactable = false;
    this.boxes[id] = box;
  }

  createStaticBox(x, y, w, h, bgStyle, more) {
    let geometry = new Geometry();
    let id = Object.keys(this.boxes).length;
    let box = new Box(id, geometry, undefined, more);
    box.setLeftX(x);
    box.setBottomY(y);
    box.setH(h);
    box.setW(w);
    box.stats.style = bgStyle == undefined ? defaultBoxStyle : bgStyle;
    box.stats.interactable = true;
    this.boxes[id] = box;
  }

  // box1 is source, box2 is destination
  convertBoxToTeleport(box1, box2) {
    box1.stats.type = "teleport";
    box1.stats.extra["dest"] = box2.stats.id;

    // making both boxes as teleports
    box2.stats.type = "teleport";
    box2.stats.extra["dest"] = box1.stats.id;
  }

  convertLastBoxToSpring(speedX, speedY) {
    this.convertBoxToSpring(
      this.boxes[Object.keys(this.boxes).length - 1],
      speedX,
      speedY
    );
  }

  convertBoxToSpring(box, speedX, speedY) {
    box.stats.type = "spring";
    box.stats.extra["speedX"] = speedX;
    box.stats.extra["speedY"] = speedY;
  }

  // dynamic boxes
  createDynamicBox(x, y, w, h, movex, movey, movet, bgStyle, more) {
    var geometry = new Geometry();
    var linear = new Linear();
    let id = Object.keys(this.boxes).length;
    linear.movex = movex;
    linear.movey = movey;
    linear.movet = movet;
    let box = new Box(id, geometry, linear, more);
    box.setLeftX(x);
    box.setBottomY(y);
    box.setH(h);
    box.setW(w);
    box.stats.style = bgStyle == undefined ? defaultBoxStyle : bgStyle;
    this.boxes[id] = box;
  }

  // if timerId is undefined it is just a clock, not a timer
  createDigitalClock(id, x, y, w, h, src, timerId) {
    let geometry = new Geometry();
    let box = new Box(id, geometry);
    box.setLeftX(x);
    box.setBottomY(y);
    box.setH(h);
    box.setW(w);
    //  box.style = { backgroundImage: "url(" + src + ")" };
    box.stats.extra.clockFont = h / 2;
    box.stats.extra.src = src;
    box.stats.extra.timerId = timerId;
    box.stats.interactable = false;
    box.stats.type = "digital_clock";
    return box;
  }

  createAnalogClock(id, x, y, r, src, timerId) {
    let geometry = new Geometry();
    let box = new Box(id, geometry);
    box.setLeftX(x);
    box.setBottomY(y);
    box.setH(r);
    box.setW(r);
    //  box.style = { backgroundImage: "url(" + src + ")" };
    box.stats.extra.src = src;
    box.stats.extra.timerId = timerId;
    box.stats.interactable = false;
    box.stats.type = "analog_clock";
    return box;
  }
}
export default GameState;
