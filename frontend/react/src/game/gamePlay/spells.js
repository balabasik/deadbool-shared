import { GetRand, RandomString, CapitalizeFirstLetter } from "./utils";
import Bullet from "./bullet";
import Box from "./box";
import Geometry from "./geometry";

function GetSpellMessage(player, spell) {
  return (
    player.playerName +
    "[" +
    CapitalizeFirstLetter(player.avatar) +
    "] casted " +
    spell.name +
    ". Run and hide."
  );
}

function createSpell(
  type,
  name,
  src,
  soundSrc,
  activeTime,
  reloadTime,
  globalBit,
  description,
  descriptionTech,
  execute
) {
  return {
    type,
    name,
    src,
    soundSrc,
    activeTime: activeTime * 1000, // need this in milliseconds
    reloadTime: reloadTime * 1000, // need this in milliseconds
    globalBit,
    description,
    descriptionTech,
    execute
  };
}

// DONE
function Execute4D(physics, activate, player, key) {
  physics.state.physicsStats.breakWalls = activate;
}

// DONE
function ExecuteWheelOfFortune(physics, activate, player, key) {
  if (!activate) return;
  let rnd = GetRand(2);
  if (rnd == 1) player.setHp(player.stats.maxhp);
  else player.setHp(1);
}

// DONE
function ExecuteDeadBeef(physics, activate, player, key) {
  if (activate) physics.startDeadBeef(player.id);
  else physics.stopDeadBeef();
}

function CreateMatrixBullet(physics, x, y, player) {
  let stats = {};
  stats.type = 1; // id 1 is required for bullets to explode
  stats.id = RandomString();
  stats.firePlayer = player.id;
  stats.killer = player.id;
  stats.fireTime = physics.state.timeStamp;

  stats.curAngle = GetRand(180) + 180;
  stats.curX = x;
  stats.curY = y;
  stats.prevX = stats.curX;
  stats.prevY = stats.curY;

  stats.curSpeed = 0.3;
  stats.weight = 1;
  stats.timeToExplode = 10000;
  stats.explosionRadius = 100;
  stats.strength = 30;

  stats.curSizeX = 30;
  stats.curSizeY = 30;
  stats.flexColor = false;

  stats.src = "";
  stats.content = String.fromCharCode(GetRand(256));
  stats.extraStyle = { color: "rgb(4, 180, 85)" };
  stats.verticalBounceDampFactor = 0.3;

  stats.overwriteSelfBulletsByServer = true;
  let bullet = new Bullet(stats);
  physics.addBullet(bullet);
}

// DONE
function ExecuteMatrixHasYou(physics, activate, player, key) {
  physics.state.physicsStats.matrixActive = activate;
  if (activate) physics.createMatrixRec(player);
}

// DONE
function ExecuteDodgeThis(physics, activate, player, key) {
  player.stats.shootDoubles = activate;
}

// DONE
function ExecuteTheOne(physics, activate, player, key) {
  physics.state.physicsStats.bulletsStopped = activate;
}

function CreatePokeBomb(physics, x, y, player) {
  let stats = {};
  stats.type = 1; // id 1 is required for bullets to explode
  stats.id = RandomString();
  stats.firePlayer = player.id;
  stats.killer = player.id;
  stats.fireTime = physics.state.timeStamp;

  stats.curAngle = 0;
  stats.curX = x;
  stats.curY = y;
  stats.prevX = stats.curX;
  stats.prevY = stats.curY;

  stats.curSpeed = 0;
  stats.weight = 0;
  stats.timeToExplode = 10000;
  stats.explosionRadius = 100;
  stats.strength = 100;

  stats.curSizeX = 50;
  stats.curSizeY = 50;

  stats.src = "avatars_and_guns/items_pokeball.png";
  stats.overwriteSelfBulletsByServer = true;

  let bullet = new Bullet(stats);
  physics.addBullet(bullet);
}

// DONE
function ExecutePokebombs(physics, activate, player, key) {
  if (!activate) return;
  // Adding 10 pokebombs around the map in random places for 15 seconds
  for (let i = 0; i < 10; i++) {
    let x = GetRand(physics.state.worldWidth);
    let y = GetRand(physics.state.worldHeight);
    CreatePokeBomb(physics, x, y, player);
  }
}

// DONE
function ExecuteSlowbro(physics, activate, player, key) {
  player.stats.magicSpeedX = activate ? player.stats.origSpeedX * 0.5 : 0;
}

// DONE
function ExecuteLightning(physics, activate, player, keys) {
  physics.state.physicsStats.lightningActive = activate;
  if (!activate) return;
  let nPlayers = Object.keys(physics.state.players).length;
  for (let key in physics.state.players) {
    if (
      key == player.id ||
      key == "shadow" ||
      physics.state.players[key].stats.isDead ||
      physics.doesPlayerDodgeMagic(key)
    )
      continue;
    physics.state.players[key].handleHit(
      nPlayers < 3 ? 30 : nPlayers < 7 ? 25 : 15,
      player,
      physics.state.timeStamp,
      "magic",
      physics
    );
  }
}

function CreateMushroom(physics, x, y, curAngle, player) {
  let stats = {};
  stats.type = 1; // id 1 is required for bullets to explode
  stats.id = RandomString();
  stats.firePlayer = player.id;
  stats.killer = player.id;
  stats.fireTime = physics.state.timeStamp;

  stats.curAngle = curAngle;
  stats.curX = x;
  stats.curY = y;
  stats.prevX = stats.curX;
  stats.prevY = stats.curY;

  stats.curSpeed = 0.35;
  stats.weight = 1;
  stats.timeToExplode = 15000;
  stats.explosionRadius = 100;
  stats.strength = 100;

  stats.bounceFromWalls = true;
  stats.horizontalBounceDampFactor = 1;
  stats.verticalBounceDampFactor = 0.3;
  stats.rotatable = false;

  stats.curSizeX = 75;
  stats.curSizeY = (75 / 200) * 115; // size of the image

  stats.src = "avatars_and_guns/items_mushroom.png";
  stats.overwriteSelfBulletsByServer = true;

  let bullet = new Bullet(stats);
  physics.addBullet(bullet);
}

// DONE
function ExecuteMushroom(physics, activate, player, key) {
  if (!activate) return;
  // mushroom from the left
  CreateMushroom(
    physics,
    player.getLeftX() - 10,
    player.getBottomY() + player.getH() / 2,
    180,
    player
  );
  // mushroom from the right
  CreateMushroom(
    physics,
    player.getRightX() + 10,
    player.getBottomY() + player.getH() / 2,
    0,
    player
  );
}

// DONE
function ExecuteJumpAndKill(physics, activate, player, key) {
  player.stats.jumpAndKill = activate;
}

// DONE
function ExecuteBig(physics, activate, player, keys) {
  let nPlayers = Object.keys(physics.state.players).length;
  for (let key in physics.state.players) {
    // Only checking magicDodge in ACTIVE mode
    if (
      activate &&
      (key == player.id ||
        key == "shadow" ||
        physics.state.players[key].stats.isDead ||
        physics.doesPlayerDodgeMagic(key))
    )
      continue;
    physics.state.players[key].geometry.transform.scaleX = activate ? 2 : 1;
    physics.state.players[key].geometry.transform.scaleY = activate ? 2 : 1;
    // for both activate and deactivate
    physics.state.players[key].stats.forceClientGeometry = {
      active: true,
      time: physics.state.timeStamp
    };
  }
}

// DONE
function ExecuteSleepTight(physics, activate, player, key) {
  physics.state.physicsStats.dark = { active: activate, caster: player.id };
}

function CreateSailorStars(physics, x, y, curAngle, player) {
  let stats = {}; // id=0 means it does not explode
  stats.type = 0;
  stats.id = RandomString();
  stats.firePlayer = player.id;
  stats.killer = player.id;
  stats.fireTime = physics.state.timeStamp;

  stats.curAngle = curAngle;
  stats.curX = x;
  stats.curY = y;
  stats.prevX = stats.curX;
  stats.prevY = stats.curY;

  stats.curSpeed = 0.5;
  stats.weight = 0;
  stats.timeToExplode = 10000;
  stats.strength = 100;

  stats.bounceFromWalls = false;
  stats.goThroughWalls = true;
  stats.rotatable = true;

  stats.curSizeX = 75;
  stats.curSizeY = 75;

  stats.src = "avatars_and_guns/items_star.png";
  stats.overwriteSelfBulletsByServer = true;

  let bullet = new Bullet(stats);
  physics.addBullet(bullet);
}

// DONE
function ExecuteTwinkle(physics, activate, player, key) {
  if (!activate) return;
  for (let i = 0; i < 8; i++) {
    let curAngle = 45 * i;
    let x = player.getLeftX() + player.getW() / 2;
    let y = player.getBottomY() + player.getH() / 2;
    CreateSailorStars(physics, x, y, curAngle, player);
  }
}

// DONE
function ExecuteAnimagnet(physics, activate, player, keys) {
  if (!activate) return;
  for (let key in physics.state.players) {
    if (
      key == player.id ||
      key == "shadow" ||
      physics.state.players[key].stats.isDead ||
      physics.doesPlayerDodgeMagic(key)
    )
      continue;

    // TODO: Add some random distance from the position, by adding tryMove.
    // TODO: Set speed to 0 here too? Need to force speed then.
    physics.state.players[key].setLeftX(player.getLeftX());
    physics.state.players[key].setBottomY(player.getBottomY());
    physics.temporalPhysics.forceGeometryInAllStates(
      physics.state.players[key]
    );
    physics.state.players[key].stats.forceClientGeometry = {
      active: true,
      time: physics.state.timeStamp
    };
  }
}

// DONE
function ExecuteFlashback(physics, activate, player, key) {
  if (!activate) return;
  let lastSpell = physics.state.physicsStats.lastSpell;
  // NOTE: need to update this if id==22 ever changes!!!
  // Do not repeat the same magic
  if (lastSpell == undefined || lastSpell < 0 || lastSpell == 22) return;
  physics.doMagic(player, lastSpell, activate, key, RandomString());
}

// DONE
function ExecuteTransform(physics, activate, player, key) {
  // NOTE: While in the truck mode player can't shoot, but can execute magic.
  // Player also becomes immune to magic (but not to bullets!).
  player.stats.truckMode = activate;
  player.stats.canShoot = !activate;
  player.stats.dodgeMagic = activate ? 100 : player.stats.origDodgeMagic;
  player.setW(activate ? 200 : 100);
  player.setH(activate ? 100 : 100);
  // TODO: Need to enforce geometry on per person basis
  player.stats.forceClientGeometry = {
    active: true,
    time: physics.state.timeStamp
  };
}

// DONE
function ExecuteAutobots(physics, activate, player, keys) {
  if (activate) {
    for (let key in physics.state.players) {
      if (key == "shadow" || physics.doesPlayerDodgeMagic(key)) continue; // note: even dead
      physics.state.players[key].stats.overwriteBulletFirePlayer = {
        active: true,
        id: player.id
      };
    }
  } else {
    for (let key in physics.state.players) {
      physics.state.players[key].stats.overwriteBulletFirePlayer =
        physics.state.players[key].stats.isCopy;
    }
  }
}

// DONE
function ExecuteRandomToy(physics, activate, player, key) {
  if (!activate) return;
  // TODO: Need a more deterministic way for this
  let list = GetSpellList();
  let magicId = 0;
  while (true) {
    magicId = GetRand(Object.keys(list).length);
    // NOTE: 22 is flashback, we also exclude it
    if (
      magicId != 26 &&
      magicId != 22 &&
      magicId != 0 &&
      list[magicId].type == "active"
    )
      break;
  }
  // Execute through physics so that it switches things off.
  physics.doMagic(player, magicId, activate, key, RandomString());
}

// DONE
function ExecuteToInfinity(physics, activate, player, key) {
  // In the flying mode you can also go through walls.
  // TODO: Investigate if static stats assigned to a player rather than into physicsStats impacts temporalPysics.
  player.stats.canFly = activate;
  player.stats.magicSpeedX = activate ? 0.5 * player.stats.origSpeedX : 0;
  player.stats.magicSpeedY = activate ? 0.5 * player.stats.origSpeedY : 0;
}

// DONE
function ExecuteBuzzy(physics, activate, player, key) {
  physics.state.physicsStats.stopSpells = activate;
}

// DONE
function ExecuteUshanka(physics, activate, player, key) {
  if (activate) player.stats.dodgeBullets += 30;
  else player.stats.dodgeBullets = player.stats.origDodgeBullets;
}

// DONE
function ExecuteRussianRoulette(physics, activate, player, key) {
  if (!activate) return;
  // TODO:  Remove for production.
  let victim = "shadow";
  while (victim == "shadow" || physics.state.players[victim].stats.isDead) {
    victim = Object.keys(physics.state.players)[
      GetRand(Object.keys(physics.state.players).length)
    ];
  }
  physics.instantKill(player.id, victim);
}

// DONE
function ExecuteRedButton(physics, activate, player, keys) {
  if (!activate) return;
  for (let key in physics.state.players) {
    if (
      key == "shadow" ||
      physics.state.players[key].stats.isDead ||
      physics.doesPlayerDodgeMagic(key)
    )
      continue;
    physics.state.players[key].setHp(1);
  }
}

function CreateHolyGrenade(physics, x, y, player) {
  let stats = {};
  stats.type = 1; // id=1 means explode
  stats.id = RandomString();
  stats.firePlayer = player.id;
  stats.killer = player.id;
  stats.fireTime = physics.state.timeStamp;

  stats.curAngle = 270; // downward
  stats.curX = x;
  stats.curY = y;
  stats.prevX = stats.curX;
  stats.prevY = stats.curY;

  stats.curSpeed = 0;
  stats.weight = 1;
  stats.timeToExplode = 10000;
  stats.strength = 100;

  stats.bounceFromWalls = false;
  stats.goThroughWalls = false;
  stats.rotatable = true;

  stats.curSizeX = 100;
  stats.curSizeY = 100;

  stats.src = "avatars_and_guns/items_holy_grenade.png";
  stats.overwriteSelfBulletsByServer = true;

  let bullet = new Bullet(stats);
  physics.addBullet(bullet);
}

// DONE
function ExecuteHolyGrenade(physics, activate, player, key) {
  if (!activate) return;
  CreateHolyGrenade(physics, key.mouseX, key.mouseY, player);
}

// DONE
function ExecuteRebirth(physics, activate, player, key) {
  // TODO: Need some effect to indicate it worked
  player.stats.rebirthActive = activate;
}

// DONE
function ExecuteLove(physics, activate, player, keys) {
  if (activate) {
    for (let key in physics.state.players) {
      if (key == "shadow" || physics.doesPlayerDodgeMagic(key)) continue; // NOTE: even dead
      // this player can still shoot
      if (key != player.id) physics.state.players[key].stats.canShoot = false;
      physics.state.players[key].setHp(50);
    }
  } else {
    for (let key in physics.state.players)
      physics.state.players[key].stats.canShoot = true;
  }
}

// DONE
function ExecuteReverseGravity(physics, activate, player, key) {
  // NOTE: If it was changed before by different person we keep it
  if (activate == physics.state.physicsStats.gravityG < 0) return;
  physics.state.physicsStats.gravityG = -physics.state.physicsStats.gravityG;
}

// DONE
function ExecutePowerStone(physics, activate, player, key) {
  if (activate) {
    player.setHp(player.stats.maxhp * 1.3);
    player.stats.bulletsExtraStrength = 30;
  } else {
    player.stats.bulletsExtraStrength = 0;
  }
}

// DONE
function ExecuteSnap(physics, activate, player, keys) {
  if (!activate) return;
  for (let key in physics.state.players) {
    // 50% chance to snap the player
    if (
      GetRand(2) == 1 ||
      key == player.id ||
      key == "shadow" ||
      physics.state.players[key].stats.isDead ||
      physics.doesPlayerDodgeMagic(key)
    )
      continue;
    physics.state.players[key].stats.isDead = true;
    physics.revivePlayer(physics.state.players[key], physics.state.timeStamp);
  }
}

// DONE
function ExecuteCriticalDamage(physics, activate, player, key) {
  if (activate) player.stats.criticalHitProb = 50;
  else player.stats.criticalHitProb = 0;
}

// DONE
function ExecuteTheWall(physics, activate, player, key, magicHash) {
  if (activate) {
    // TODO: Based on player's active weapon either make it vertical or horizontal
    let direction = key.activeGun == 0 ? "horizontal" : "vertical";
    let geometry = new Geometry();
    let box = new Box(RandomString(), geometry, undefined);

    let h = direction == "horizontal" ? 100 : 400;
    let w = direction == "horizontal" ? 400 : 100;

    box.setLeftX(key.mouseX - w / 2);
    box.setBottomY(key.mouseY - h / 2);
    box.setH(h);
    box.setW(w);
    box.stats.extra.wall = true;

    if (direction == "vertical") {
      box.stats.style = {
        backgroundImage: `url(avatars_and_guns/items_vertical_wall.png)`,
        backgroundSize: "100% 100%",
        backgroundPosition: "0px 0px",
        overflow: "hidden"
      };
    } else {
      box.stats.style = {
        backgroundImage: `url(avatars_and_guns/items_horizontal_wall.png)`,
        backgroundSize: "100% 100%",
        backgroundPosition: "0px 0px",
        overflow: "hidden"
      };
    }

    box.stats.interactable = true;
    box.stats.deleteAfter = physics.state.timeStamp + 35 * 1000; // In seconds, set this just in case cause walls don't get delete sometimes
    if (direction == "vertical") box.stats.sideBump = true;
    physics.state.boxes[box.stats.id] = box;
    physics.state.physicsStats.addExtraBoxes[magicHash] = box;
  } else {
    // delete box
    let toRemove = physics.state.physicsStats.addExtraBoxes[magicHash];
    if (toRemove == undefined || toRemove.stats.id == undefined) return;
    physics.state.physicsStats.removeExtraBoxes[toRemove.stats.id] = true;
    delete physics.state.physicsStats.addExtraBoxes[magicHash];
    delete physics.state.boxes[toRemove.stats.id];
  }
}

// DONE
function ExecuteRightWing(physics, activate, player, key) {
  // TODO: Check if this needs to be per player and dodge magic.
  physics.state.physicsStats.rightWing = {
    active: activate,
    killer: player.id
  };
}

function AddCopy(physics, player, magicHash) {
  let playerId = RandomString();
  physics.addPlayerToState(
    playerId,
    {
      avatar: player.avatar,
      playerName: player.playerName,
      playerLink: player.playerLink
    },
    {
      ...player.stats,
      isCopy: { active: true, id: player.id },
      overwritePlayerKeys: { active: true, id: player.id },
      overwriteBulletFirePlayer: { active: true, id: player.id },
      overwriteMouseAngle: { active: true, id: player.id }
    }
  );

  physics.state.players[playerId].stats.isDead = true;
  physics.revivePlayer(
    physics.state.players[playerId],
    physics.state.timeStamp
  );
  if (!(magicHash in physics.state.copyPlayers))
    physics.state.copyPlayers[magicHash] = [];
  physics.state.copyPlayers[magicHash].push(playerId);
}

// DONE
function ExecuteCopy(physics, activate, player, key, magicHash) {
  // Creating 3 copies in random birth locations on the map.
  if (activate) {
    AddCopy(physics, player, magicHash);
    AddCopy(physics, player, magicHash);
    AddCopy(physics, player, magicHash);
  } else {
    for (let id of physics.state.copyPlayers[magicHash]) {
      physics.removePlayerFromState(id);
    }
    delete physics.state.copyPlayers[magicHash];
  }
}

// DONE
function ExecutePortalGun(physics, activate, player, key) {
  if (!activate) return;
  player.setLeftX(key.mouseX);
  player.setBottomY(key.mouseY);

  player.stats.forceClientGeometry = {
    active: true,
    time: physics.state.timeStamp
  };
}

// DONE
function ExecutePickleRick(physics, activate, player, key) {
  physics.state.physicsStats.pickleRick = activate ? player.id : "";
}

// DONE
function ExecuteLightsaber(physics, activate, player, key) {
  player.stats.reflectsBullets = activate;
}

function CreateDeathStar(physics, x, y, dir, player) {
  let stats = {};
  stats.type = 0;
  stats.id = RandomString();
  stats.firePlayer = player.id;
  stats.killer = player.id;
  stats.fireTime = physics.state.timeStamp;

  stats.curSizeX = 500;
  stats.curSizeY = 10;

  stats.curAngle = dir;
  // NOTE: curXY is the center of the bullet, while x,y are the tip of the gun
  stats.curX = x + (stats.curSizeX / 2) * Math.cos(stats.curAngle / 57.325);
  stats.curY = y + (stats.curSizeX / 2) * Math.sin(stats.curAngle / 57.325);
  stats.prevX = stats.curX;
  stats.prevY = stats.curY;

  stats.curSpeed = 1.5;
  stats.weight = 0;
  stats.timeToExplode = 10000;
  stats.strength = 100;

  stats.bounceFromWalls = false;
  stats.goThroughWalls = true;
  stats.hitManyPlayers = true;
  stats.rotatable = true;

  stats.src = "";
  stats.extraStyle = {
    backgroundColor: "rgb(0, 0, 0)",
    borderRadius: "5px",
    boxShadow: "0px 0px 10px 5px rgb(239, 254, 188)"
  };

  stats.overwriteSelfBulletsByServer = true;
  let bullet = new Bullet(stats);
  physics.addBullet(bullet);
}

// DONE
function ExecuteDeathStar(physics, activate, player, key) {
  if (!activate) return;
  CreateDeathStar(
    physics,
    player.getGunTipX(physics.state),
    player.getGunTipY(physics.state),
    key.mouseAngle,
    player
  );
}

// DONE
function ExecuteDarkSide(physics, activate, player, keys) {
  if (activate) {
    for (let key in physics.state.players) {
      // 50% chance to snap the player
      if (
        // Even for dead people after they revive
        key == player.id ||
        key == "shadow" ||
        physics.doesPlayerDodgeMagic(key)
      )
        continue; // note: even dead
      physics.state.players[key].stats.overwritePlayerKeys = {
        active: true,
        id: player.id
      };
    }
  } else {
    for (let key in physics.state.players)
      physics.state.players[key].stats.overwritePlayerKeys =
        physics.state.players[key].stats.isCopy;
  }
}

// DONE
function ExecuteBatcave(physics, activate, player, key) {
  if (!activate) return;
  let hp = player.stats.hp;
  let ammo =
    (player.stats.ammo[0] / player.stats.maxammo[0]) * player.stats.maxhp;
  player.setHp(ammo);
  player.stats.ammo[0] = (hp / player.stats.maxhp) * player.stats.maxammo[0];
}

// DONE
function ExecuteSmokeGrenade(physics, activate, player, key) {
  // TODO: Add visual effect here.
  player.stats.invisible = activate;
}

// DONE
function ExecuteDC(physics, activate, player, keys) {
  // Everyone shoots at the same angle as you
  if (activate) {
    for (let key in physics.state.players) {
      // 50% chance to snap the player
      if (
        // even for dead people
        key == player.id ||
        key == "shadow" ||
        physics.doesPlayerDodgeMagic(key)
      )
        continue; // note: even dead
      physics.state.players[key].stats.overwriteMouseAngle = {
        active: true,
        id: player.id
      };
    }
  } else {
    for (let key in physics.state.players)
      physics.state.players[key].stats.overwriteMouseAngle =
        physics.state.players[key].stats.isCopy;
  }
}

// DONE
function ExecuteVendetta(physics, activate, player, keys) {
  // TODO: Make sure this magic never gets called from itself!!!
  if (!activate) return;
  for (let key in physics.state.players) {
    // 50% chance to cast V spell
    if (
      GetRand(2) == 1 ||
      physics.state.players[key].stats.isDead ||
      key == player.id ||
      key == "shadow" ||
      physics.doesPlayerDodgeMagic(key)
    )
      continue;
    let magicId = physics.state.players[key].stats.magicId[3]; // V spell
    physics.doMagic(
      physics.state.players[key],
      magicId,
      true /*activate*/,
      physics.state.playerKeys[key].keys,
      RandomString()
    );
  }
}

// DONE
function ExecuteFakeEye(physics, activate, player, key) {
  player.stats.fakeEye = {
    active: activate,
    x: 100 * (GetRand(2) == 0 ? 1 : -1),
    y: 100 * (GetRand(2) == 0 ? 1 : -1)
  };
}

function Shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

function GetRandomKeyMap() {
  let keys = [
    "leftKey",
    "rightKey",
    "upKey",
    "downKey",
    "rightClick",
    "leftClick",
    "magic1",
    "magic2",
    "magic3"
  ];
  let shuffle = [...keys];
  Shuffle(shuffle);
  let ret = {};
  for (let i = 0; i < keys.length; i++) ret[keys[i]] = shuffle[i];
  return ret;
}

// DONE
function ExecuteVeryFunny(physics, activate, player, key) {
  physics.state.physicsStats.scrambleKeys = activate
    ? { active: true, killer: player.id, mapping: GetRandomKeyMap() }
    : { active: false };
}

// DONE
function PassiveExecuteFrenzy(physics, player, magicId, elapsedTime) {
  for (let key in physics.state.players) {
    if (
      key == player.id ||
      key == "shadow" ||
      physics.state.players[key].stats.isDead
    )
      continue;
    let dist = physics.getPlayersDistance(key, player.id);
    let active = dist < 300;
    let strength = elapsedTime / 50;
    if (active) {
      physics.state.players[key].handleHit(
        strength,
        player,
        physics.state.timeStamp,
        "magic",
        physics
      );
      physics.state.players[key].stats.affectingSpells[magicId] = true;
    } else {
      delete physics.state.players[key].stats.affectingSpells[magicId];
    }
  }
}

// DONE
function PassiveExecuteWick(physics, player, magicId, elapsedTime) {
  player.stats.bulletsExtraStrength = player.stats.hp < 20 ? 100 : 0;
}

// DONE
function PassiveExecuteEmojiJump(physics, player, magicId, elapsedTime) {
  // TODO: Maybe just move it to player constructor, and make it a noop?
  player.stats.emojiJump = true;
}

// DONE
function PassiveExecutePlumbing(physics, player, magicId, elapsedTime) {
  for (let key in physics.state.players) {
    if (
      key == player.id ||
      key == "shadow" ||
      physics.state.players[key].stats.isDead
    )
      continue;
    let dist = physics.getPlayersDistance(key, player.id);
    let active = dist < 300;
    physics.state.players[key].stats.canReloadAmmo = !active;

    if (active) {
      physics.state.players[key].stats.affectingSpells[magicId] = true;
    } else {
      delete physics.state.players[key].stats.affectingSpells[magicId];
    }
  }
}

// DONE
function PassiveExecuteMagicBeans(physics, player, magicId, elapsedTime) {
  player.setHp(
    player.stats.hp +
      (physics.numMagics * 30) / Object.keys(physics.state.players).length
  );
}

// DONE
function PassiveExecutePrime(physics, player, magicId, elapsedTime) {
  // TODO: Maybe just move it to player constructor, and make it a noop?
  player.stats.prime = true;
}

// DONE
function PassiveExecutePixar(physics, player, magicId, elapsedTime) {
  let totalH = physics.state.worldHeight;
  let playerH = player.getBottomY();
  player.stats.bulletsExtraStrength = (playerH * 100) / totalH - 10; // decrease a bit if player is in the very bottom
}

// DONE
function PassiveExecuteMoscowMule(physics, player, magicId, elapsedTime) {
  player.stats.vampiric = 30; // percent of damage
}

// DONE
function PassiveExecuteLeftCheek(physics, player, magicId, elapsedTime) {
  // TODO: Should this be done for magic damage too?
  player.stats.returnDamage = 30;
}

// DONE
function PassiveExecuteAimForTheHead(physics, player, magicId, elapsedTime) {
  // TODO: Should this be in constructor??
  player.stats.origDodgeBullets = 30;
  player.stats.dodgeBullets = Math.max(
    player.stats.origDodgeBullets,
    player.stats.dodgeBullets
  );
}

// DONE
function PassiveExecuteOdd(physics, player, magicId, elapsedTime) {
  let enable = Math.floor(physics.state.timeStamp / 1000 / 60) % 2 == 1;
  player.stats.bulletsExtraStrength = enable ? 60 : -30;
  player.stats.healRate = enable ? 0.001 * 3 : 0.001 / 2;
}

// DONE
function PassiveExecuteJoker(physics, player, magicId, elapsedTime) {
  player.stats.origSpeedY = player.stats.hp < 30 ? 1.4 * 1.5 : 1.4;
}

// DONE
function PassiveExecuteChewbacca(physics, player, magicId, elapsedTime) {
  // TODO: Move to player constructor?
  player.stats.shotToMagic = 10; // every 10 HP reduces all magic reload time by 1 seconds.
}

// DONE
function PassiveExecuteGetHigh(physics, player, magicId, elapsedTime) {
  let totalH = physics.state.worldHeight;
  let playerH = player.getBottomY();
  player.stats.healRate = 0.001 * (0.8 + (2 * playerH) / totalH); // decrease a bit if player is in the very bottom
}

function PassiveExecutePresidentialImmunity(
  physics,
  player,
  magicId,
  elapsedTime
) {
  // TODO: Move to player constructor?
  player.stats.origDodgeMagic = 30;
  player.stats.dodgeMagic = Math.max(
    player.stats.dodgeMagic,
    player.stats.origDodgeMagic
  );
}

const spell0 = createSpell(
  "active",
  "Unknown",
  "spells/spell_00_unknown.png",
  undefined,
  0,
  0,
  false,
  "Spell is unknown.",
  "Spell is unknown.",
  undefined
);
const spell1 = createSpell(
  "passive",
  "Frenzy",
  "spells/spell_01_deadbool_frenzy.png",
  undefined,
  0,
  0,
  false,
  "Players next to you receive damage just for looking at your avocado face.",
  "Players close to you receive 20 dps.",
  PassiveExecuteFrenzy
);
const spell2 = createSpell(
  "active",
  "4D",
  "spells/spell_02_deadbool_4d.png",
  "/sounds/DonorCardCollect.wav.mp3",
  7,
  30,
  true,
  "Breaking the 4th wall is now a legit thing in games too.",
  "Players drop on the bottom floor.",
  Execute4D
);
const spell3 = createSpell(
  "active",
  "Wheel of fortune",
  "spells/spell_03_deadbool_wheel_of_fortune.png",
  "/sounds/DonorCardAppears.wav.mp3",
  0,
  20,
  false,
  "Spin the wheel. You either get it all or loose it all.",
  "Either restore full health, or drop to 1.",
  ExecuteWheelOfFortune
);
const spell4 = createSpell(
  "active",
  "Dead beef",
  "spells/spell_04_deadbool_dead_beef.png",
  "/sounds/CowMoo.wav.mp3",
  7,
  30,
  true,
  "Enemies will have to spell DEAD, or they will be dead.",
  "Enemies receive 5 dps until they spell DEAD.",
  ExecuteDeadBeef
);
const spell5 = createSpell(
  "passive",
  "Wick",
  "spells/spell_05_neo_wick.png",
  undefined,
  0,
  0,
  false,
  "Anyone noticed that John Wick gets infinitely stronger when almost dead?",
  "Bullets get 2x stronger when you have below 20 hp.",
  PassiveExecuteWick
);
const spell6 = createSpell(
  "active",
  "Matrix has you",
  "spells/spell_06_neo_matrix_has_you.png",
  "/sounds/WOBBLE.WAV.mp3",
  5,
  20,
  false,
  "Green characters are fatal. Just say where you want them to appear.",
  "Green characters drop from cursor. Each does 30 damage.",
  ExecuteMatrixHasYou
);
const spell7 = createSpell(
  "active",
  "Dodge this",
  "spells/spell_07_neo_dodge_this.png",
  undefined,
  5,
  30,
  false,
  "Shooting 2 bullets at once. Dodge this, Smith.",
  "Emit 2 bullets per single shot.",
  ExecuteDodgeThis
);
const spell8 = createSpell(
  "active",
  "The One",
  "spells/spell_08_neo_power_of_the_one.png",
  "/sounds/FIRE.WAV.mp3",
  5,
  30,
  true,
  "Stopping bullets is like being in love. It only lasts 5 seconds.",
  "Stop all the bullets for 5 seconds.",
  ExecuteTheOne
);
const spell9 = createSpell(
  "passive",
  "Emoji jump",
  "spells/spell_09_pika_emoji_jump.png",
  undefined,
  0,
  0,
  false,
  "Jumps are hard. It only makes sense to reward them with 1 hp.",
  "Gain +1 hp for each jump.",
  PassiveExecuteEmojiJump
);
const spell10 = createSpell(
  "active",
  "Pokebombs",
  "spells/spell_10_pika_pokebombs.png",
  "/sounds/Communicator.wav.mp3",
  0,
  30,
  false,
  "Pokeballs everywhere. Careful, or they will catch you.",
  "Creates 10 pokebombs randomly on the map. Touching kills.",
  ExecutePokebombs
);
const spell11 = createSpell(
  "active",
  "Slowbro",
  "spells/spell_11_pika_slowbro.png",
  "/sounds/OOPS.WAV.mp3",
  5,
  20,
  false,
  "Bro before ho, even if he's slo.",
  "Grants you 50% speedup.",
  ExecuteSlowbro
);
const spell12 = createSpell(
  "active",
  "Lightning",
  "spells/spell_12_pika_angry_lightning.png",
  "/sounds/NinjaRopeImpact.wav.mp3",
  1,
  20,
  true,
  "Remember Zeus from Dota? Guess what. He was a pokemon.",
  "Lightning does 30 damage to all players.",
  ExecuteLightning
);
const spell13 = createSpell(
  "passive",
  "Plumbing",
  "spells/spell_13_mario_plumbing.png",
  undefined,
  0,
  0,
  false,
  "His outfit smells. Enemies do not reload in your presence.",
  "Enemies do not reload bullets when in your proximity.",
  PassiveExecutePlumbing
);
const spell14 = createSpell(
  "active",
  "Mushroom",
  "spells/spell_14_mario_mushroom.png",
  "/sounds/Fire Ball.mp3",
  0,
  25,
  false,
  "They are fast, they are deadly. They are so not for eating.",
  "Emits 2 mushrooms. Touching them results into instant death.",
  ExecuteMushroom
);
const spell15 = createSpell(
  "active",
  "Jump and kill",
  "spells/spell_15_mario_mario_jump.png",
  "/sounds/Powerup.mp3",
  5,
  20,
  false,
  "Off their heads.",
  "Jumping on top of other players kills them.",
  ExecuteJumpAndKill
);
const spell16 = createSpell(
  "active",
  "Big",
  "spells/spell_16_mario_big.png",
  "/sounds/Vine.mp3",
  5,
  20,
  true,
  "Size does matter. Bigger targets are better targets.",
  "All the other players grow 2x.",
  ExecuteBig
);
const spell17 = createSpell(
  "passive",
  "Magic beans",
  "spells/spell_17_moon_magic_beans.png",
  undefined,
  0,
  0,
  false,
  "She gets happier everytime anyone casts a spell.",
  "Get 5 hp every time someone casts a spell.",
  PassiveExecuteMagicBeans
);
const spell18 = createSpell(
  "active",
  "Sleep tight",
  "spells/spell_18_moon_sleep_tight.png",
  "/sounds/butn2.wav.mp3",
  5,
  30,
  true,
  "You are not afraid of the dark. But they are.",
  "Turn off the light for everyone except of you.",
  ExecuteSleepTight
);
const spell19 = createSpell(
  "active",
  "Twinkle",
  "spells/spell_19_moon_twinkle.png",
  undefined,
  0,
  30,
  false,
  "Some stars are cute. Others are deadly.",
  "Emit stars in all directions. Instant kill on touch.",
  ExecuteTwinkle
);
const spell20 = createSpell(
  "active",
  "Animagnet",
  "spells/spell_20_moon_animagnet.png",
  "/sounds/CrowdPart2.wav.mp3",
  0,
  20,
  true,
  "You attract a lot of people. Party at your place.",
  "Teleport all the players to your position.",
  ExecuteAnimagnet
);
const spell21 = createSpell(
  "passive",
  "Prime",
  "spells/spell_21_optimus_prime.png",
  undefined,
  0,
  0,
  false,
  "Remember math? Primes double your numbers.",
  "Grants 2 frags if enemy is killed on a prime second.",
  PassiveExecutePrime
);
const spell22 = createSpell(
  "active",
  "Flashback",
  "spells/spell_22_optimus_flashback.png",
  undefined,
  0,
  20,
  false,
  "Did you see that!? Lets repeat the last spell.",
  "Execute the last spell casted in the game.",
  ExecuteFlashback
);
const spell23 = createSpell(
  "active",
  "Transform",
  "spells/spell_23_optimus_transform.png",
  "/sounds/transform_sound.mp3",
  10,
  30,
  false,
  "Truckers are very durable. So are trucks.",
  "Transform into a truck. Restore full hp. Full magic resistance.",
  ExecuteTransform
);
const spell24 = createSpell(
  "active",
  "Autobots",
  "spells/spell_24_optimus_autobots.png",
  "/sounds/robotic_voice.mp3",
  5,
  30,
  true,
  "They can shoot as much as they want. You get all the kills.",
  "When executed, all the gun kills/exp go into your pocket.",
  ExecuteAutobots
);
const spell25 = createSpell(
  "passive",
  "Pixar",
  "spells/spell_25_buzz_pixar.png",
  undefined,
  0,
  0,
  false,
  "Cartoons give you extra powers. Especially if you are high.",
  "Get up to 2x bullet strength when you are higher on the map.",
  PassiveExecutePixar
);
const spell26 = createSpell(
  "active",
  "Random toy",
  "spells/spell_26_buzz_try_me.png",
  undefined,
  0,
  20,
  false,
  "You got a new shiny present. But what's inside the box?",
  "Execute a random spell.",
  ExecuteRandomToy
);
const spell27 = createSpell(
  "active",
  "To infinity",
  "spells/spell_27_buzz_fly.png",
  "/sounds/l_health.wav.mp3",
  10,
  30,
  false,
  "And beyond.",
  "You can fly by pressing the jump button.",
  ExecuteToInfinity
);
const spell28 = createSpell(
  "active",
  "Buzzy",
  "spells/spell_28_buzz_buzzy.png",
  "/sounds/party.mp3",
  5,
  25,
  true,
  "Did you know that drunk spellcasting is illegal? Not for you tho.",
  "Blocks other players from casting spells.",
  ExecuteBuzzy
);
const spell29 = createSpell(
  "passive",
  "Moscow mule",
  "spells/spell_29_kgb_moscow_mule.png",
  undefined,
  0,
  0,
  false,
  "Bullets don't kill people. People kill people. Get hp for every good shot.",
  "30% of inflicted damage goes back into your hp.",
  PassiveExecuteMoscowMule
);
const spell30 = createSpell(
  "active",
  "Ushanka",
  "spells/spell_30_kgb_ushanka.png",
  undefined,
  10,
  30,
  false,
  "Americans are shooting at you? Not a problem. They'll miss sometimes.",
  "Dodge bullets with 30% chance.",
  ExecuteUshanka
);
const spell31 = createSpell(
  "active",
  "Russian roulette",
  "spells/spell_31_kgb_russian_roulette.png",
  undefined,
  0,
  25,
  true,
  "Let's play. But remember, everyone can get that bullet.",
  "Intantly kills a random player (might be you).",
  ExecuteRussianRoulette
);
const spell32 = createSpell(
  "active",
  "Red button",
  "spells/spell_32_kgb_kremlin.png",
  "/sounds/kremlin.mp3",
  0,
  30,
  true,
  "Armageddon. Everyone drops to 1 hp.",
  "All players including you drop to 1 hp.",
  ExecuteRedButton
);
const spell33 = createSpell(
  "passive",
  "Left cheek",
  "spells/spell_33_jesus_left_cheek.png",
  undefined,
  0,
  0,
  false,
  "Let them taste their own medicine. Enemies receive damage back.",
  "Return 30% of gun damage back to enemies.",
  PassiveExecuteLeftCheek
);
const spell34 = createSpell(
  "active",
  "Holy grenade",
  "spells/spell_34_jesus_holy_grenade.png",
  "/sounds/HOLYGRENADE.WAV.mp3",
  0,
  20,
  false,
  "Hallelujah!",
  "Drops a holy grenade at cursor. Instant death on explosion.",
  ExecuteHolyGrenade
);
const spell35 = createSpell(
  "active",
  "Rebirth",
  "spells/spell_35_jesus_rebirth.png",
  "/sounds/rebirth.mp3",
  10,
  30,
  false,
  "It's always Christmas when you have enough mana.",
  "Reborn after death. Enemies don't get kill points.",
  ExecuteRebirth
);
const spell36 = createSpell(
  "active",
  "Love",
  "spells/spell_36_jesus_love.png",
  "/sounds/ScalesOfJustice.wav.mp3",
  5,
  30,
  true,
  "Make love, not war. Everyone gets equal hp. Guns stop working for 5s.",
  "Everyone drops to 50% hp. Guns stop for 5 seconds.",
  ExecuteLove
);
const spell37 = createSpell(
  "passive",
  "Aim for the head",
  "spells/spell_37_thanos_aim_for_the_head.png",
  undefined,
  0,
  0,
  false,
  "Avengers missed the first time, didn't they?",
  "Dodge bullets with 30% chance.",
  PassiveExecuteAimForTheHead
);
const spell38 = createSpell(
  "active",
  "Reverse gravity",
  "spells/spell_38_thanos_reverse_gravity.png",
  "/sounds/reverse.mp3",
  10,
  30,
  true,
  "Why would you ever want to use it? Because you can.",
  "Reverse gravity.",
  ExecuteReverseGravity
);
const spell39 = createSpell(
  "active",
  "Power stone",
  "spells/spell_39_thanos_power_stone.png",
  "/sounds/powerup_thanos.mp3",
  10,
  30,
  false,
  "You can easily defeat anyone. They should have never left it on Xandar.",
  "Get extra 30% max hp, and extra 30% to bullet strength.",
  ExecutePowerStone
);
const spell40 = createSpell(
  "active",
  "Snap",
  "spells/spell_40_thanos_snap.png",
  "/sounds/Snap Lounge.wav.mp3",
  0,
  30,
  true,
  "You are inevitable. 50% of players dissapear and start over.",
  "Half of players reborn. No kills/exp is granted.",
  ExecuteSnap
);
const spell41 = createSpell(
  "passive",
  "Presidential immunity",
  "spells/spell_41_trump_presidential_immunity.png",
  undefined,
  0,
  0,
  false,
  "You are the boss. Some spells miss.",
  "30% chance to dodge any spell.",
  PassiveExecutePresidentialImmunity
);
const spell42 = createSpell(
  "active",
  "Critical damage",
  "spells/spell_42_trump_critical_damage.png",
  "/sounds/DonorCardCollect.wav.mp3",
  10,
  25,
  false,
  "You are doing immense damage 50% of the time.",
  "50% chance to deliver 2x damage.",
  ExecuteCriticalDamage
);
const spell43 = createSpell(
  "active",
  "The wall",
  "spells/spell_43_trump_the_wall.png",
  "/sounds/GIRDERIMPACT.WAV.mp3",
  10,
  30,
  false,
  "You shall not pass!",
  "Places a wall at cursor. Active gun desides the direction of the wall.",
  ExecuteTheWall
);
const spell44 = createSpell(
  "active",
  "Right wing",
  "spells/spell_44_trump_right_wing.png",
  "/sounds/HOLYDONKEYIMPACT.WAV.mp3",
  8,
  30,
  true,
  "Moving left will be punished.",
  "Enemies get 1 damage for each left move.",
  ExecuteRightWing
);
const spell45 = createSpell(
  "passive",
  "Get high",
  "spells/spell_45_rick_get_high.png",
  undefined,
  0,
  0,
  false,
  "You regen faster when you are high.",
  "Get up to 3x faster hp regen when higher on the map.",
  PassiveExecuteGetHigh
);
const spell46 = createSpell(
  "active",
  "The Citadel",
  "spells/spell_46_rick_copy.png",
  "/sounds/cratepop.wav.mp3",
  10,
  30,
  false,
  "Ricks of all the universes unite!",
  "Creates 3 copies of yourself. Copies mimic all your moves.",
  ExecuteCopy
);
const spell47 = createSpell(
  "active",
  "Portal gun",
  "spells/spell_47_rick_portal_gun.png",
  "/sounds/DonorCardAppears.wav.mp3",
  0,
  10,
  false,
  "Great Scott!",
  "Teleport at the cursor location.",
  ExecutePortalGun
);
const spell48 = createSpell(
  "active",
  "Pickle Rick",
  "spells/spell_48_rick_pickle_rick.png",
  "/sounds/DonorCardCollect.wav.mp3",
  7,
  30,
  true,
  "Who doesn't love pickles? Thats right.",
  "Everyone becomes Pickle Rick. Enemies won't know who is who.",
  ExecutePickleRick
);
const spell49 = createSpell(
  "passive",
  "Chewbacca",
  "spells/spell_49_vader_chewbacca.png",
  undefined,
  0,
  0,
  false,
  "It does not make any sense, but good shots reduce spell reload time.",
  "Every 10 inflicted damage reduce the spell reload time by 1 second.",
  PassiveExecuteChewbacca
);
const spell50 = createSpell(
  "active",
  "Lightsaber",
  "spells/spell_50_vader_lightsaber.png",
  undefined,
  5,
  30,
  false,
  "Neo is an amateur. Send bullets back where they came from.",
  "You reflect bullets.",
  ExecuteLightsaber
);
const spell51 = createSpell(
  "active",
  "Death star",
  "spells/spell_51_vader_death_star.png",
  "/sounds/railgf1a.wav.mp3",
  0,
  25,
  false,
  "It ain't a starkiller, but it gets the job done.",
  "Send a deadly beam in direction of cursor.",
  ExecuteDeathStar
);
const spell52 = createSpell(
  "active",
  "Dark side",
  "spells/spell_52_vader_dark_side.png",
  "/sounds/doubler.wav.mp3",
  5,
  30,
  true,
  "Mind control your enemies. They will follow any your command.",
  "All players will repeat all your actions (fire,move,spell).",
  ExecuteDarkSide
);
const spell53 = createSpell(
  "passive",
  "Joker",
  "spells/spell_53_batman_joker.png",
  undefined,
  0,
  0,
  false,
  "Jump higher when low on hp. Joke's on them.",
  "Jump 50% higher when under 30 hp.",
  PassiveExecuteJoker
);
const spell54 = createSpell(
  "active",
  "Batcave",
  "spells/spell_54_batman_batcave.png",
  "/sounds/w_pkup.wav.mp3",
  0,
  15,
  false,
  "Can gun ammo reload hp? Let's find out.",
  "Swap gun ammo and hp.",
  ExecuteBatcave
);
const spell55 = createSpell(
  "active",
  "Smoke grenade",
  "spells/spell_55_batman_smoke_grenade.png",
  "/sounds/VASESMASH.WAV.mp3",
  5,
  25,
  false,
  "Noone can see you. But don't worry, you still reflect in the mirror.",
  "You become invisible.",
  ExecuteSmokeGrenade
);
const spell56 = createSpell(
  "active",
  "DC",
  "spells/spell_56_batman_dc.png",
  "/sounds/scout.wav.mp3",
  5,
  30,
  true,
  "DC = Direction Change. This is one thing Marvel could never get.",
  "Every player points their gun in the same direction as your gun.",
  ExecuteDC
);
const spell57 = createSpell(
  "passive",
  "Odd",
  "spells/spell_57_fool_odd.png",
  undefined,
  0,
  0,
  false,
  "Being odd in odd minutes is much better than getting even on even.",
  "Get extra 60% / lose 30% gun strength on odd / even minutes.",
  PassiveExecuteOdd
);
const spell58 = createSpell(
  "active",
  "Vendetta",
  "spells/spell_58_fool_vendetta.png",
  "/sounds/protect3.wav.mp3",
  0,
  30,
  true,
  "You know what V is for. 50% of players are forced to cast V spells.",
  "50% of the players involuntarily cast their global (V) spells.",
  ExecuteVendetta
);
const spell59 = createSpell(
  "active",
  "Mad eye",
  "spells/spell_59_fool_eyeball.png",
  undefined,
  10,
  20,
  false,
  "Where are they shooting at? Are they mad?",
  "You appear to be not where you actually are for other players.",
  ExecuteFakeEye
);
const spell60 = createSpell(
  "active",
  "Very funny",
  "spells/spell_60_fool_funny.png",
  "/sounds/SHEEPBAA.WAV.mp3",
  5,
  30,
  true,
  "Their keys got scrambled. Isn't it funny!?",
  "Keys get randomly scrambled for other players.",
  ExecuteVeryFunny
);

function GetSpellList() {
  return {
    0: spell0,
    1: spell1,
    2: spell2,
    3: spell3,
    4: spell4,
    5: spell5,
    6: spell6,
    7: spell7,
    8: spell8,
    9: spell9,
    10: spell10,
    11: spell11,
    12: spell12,
    13: spell13,
    14: spell14,
    15: spell15,
    16: spell16,
    17: spell17,
    18: spell18,
    19: spell19,
    20: spell20,
    21: spell21,
    22: spell22,
    23: spell23,
    24: spell24,
    25: spell25,
    26: spell26,
    27: spell27,
    28: spell28,
    29: spell29,
    30: spell30,
    31: spell31,
    32: spell32,
    33: spell33,
    34: spell34,
    35: spell35,
    36: spell36,
    37: spell37,
    38: spell38,
    39: spell39,
    40: spell40,
    41: spell41,
    42: spell42,
    43: spell43,
    44: spell44,
    45: spell45,
    46: spell46,
    47: spell47,
    48: spell48,
    49: spell49,
    50: spell50,
    51: spell51,
    52: spell52,
    53: spell53,
    54: spell54,
    55: spell55,
    56: spell56,
    57: spell57,
    58: spell58,
    59: spell59,
    60: spell60
  };
}

// NOTE: The actual physics will be handled in Physics.doMagic(player, magicId).
// Order of spells: PQEV
function GetAvatarSpellSet(id) {
  switch (id) {
    case "deadbool": // deadbool
      return [1, 2, 3, 4];
    case "kgb": // kgb
      return [29, 30, 31, 32];
    case "moon": // moon
      return [17, 18, 19, 20];
    case "neo": // neo
      return [5, 6, 7, 8];
    case "batman": // batman
      return [53, 54, 55, 56];
    case "mario": // mario
      return [13, 14, 15, 16];
    case "rick": // rick
      return [45, 46, 47, 48];
    case "buzz": // buzz
      return [25, 26, 27, 28];
    case "trump": // trump
      return [41, 42, 43, 44];
    case "vader": // vader
      return [49, 50, 51, 52];
    case "fool": // fool
      return [57, 58, 59, 60];
    case "pika": // pika
      return [9, 10, 11, 12];
    case "optimus": // optimus
      return [21, 22, 23, 24];
    case "thanos": // thanos
      return [37, 38, 39, 40];
    case "jesus": // jesus
      return [33, 34, 35, 36];
    default:
      return [0, 0, 0, 0]; // 0 means unknown
  }
}

export default GetAvatarSpellSet;
export { GetAvatarSpellSet, GetSpellList, CreateMatrixBullet, GetSpellMessage };
