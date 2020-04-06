import Geometry from "./geometry";
import { GetAvatarSpellSet, GetSpellList } from "./spells";
import { GetTime, IsPrimeTime, GetRand, CapitalizeFirstLetter } from "./utils";

const gunWidth = 135;
const gunHeight = 70;

function GetPlayerLvlExp(lvl) {
  return (lvl - 1) * 500;
}

class Player {
  constructor(playerId, playerInfo, stats) {
    if (playerInfo == undefined) playerInfo = {};

    // This info needs to be passed as part of the gameState
    // ---------------
    this.avatar = playerInfo.avatar;
    this.playerName = playerInfo.playerName;
    this.playerLink = playerInfo.playerLink;
    this.id = playerId;
    this.geometry = new Geometry();
    this.geometry.pivotY -= 10; // gun will be a little lower
    this.stats = {};
    // ---------------

    // No need to send this to server
    this.wasDead = false;
    this.clientStats = { isWalking: false };

    this.initStats();
    this.initPerGameStats();

    // Additional stats received from the server overwrite old values
    this.setStats(stats);
  }

  setStats(stats, setMutable) {
    if (stats == undefined) return;
    for (var key in stats) {
      if (
        setMutable != undefined &&
        !setMutable &&
        (key == "speedX" ||
          key == "onSpring" ||
          key == "extraSpeedX" ||
          key == "teleportTo" ||
          key == "speedY" ||
          key == "mouseAngle" ||
          key == "mouseWorldX" ||
          key == "mouseWorldY" ||
          key == "posX" ||
          key == "posY" ||
          key == "activeGun" ||
          key == "lastSitTime" ||
          key == "lastFireTime")
      ) {
        continue;
      }
      this.stats[key] = stats[key]; //max hp, current hp, heal speed, max ammo, max speed, etc.
    }
  }

  initStats() {
    this.initPerAvatarStats();
    this.initCommonStats();
  }

  initPerAvatarStats() {
    this.initDeadbool();
  }

  initDeadbool() {
    this.stats.maxammo = { 0: 20, 1: 10 };
    this.stats.maxhp = 100;
    this.stats.healRate = 0.001;
    this.stats.bulletReloadTime = { 0: 100, 1: 350 }; // ms delay between consequent fires
    this.stats.bulletReloadRate = { 0: 0.003, 1: 0.001 }; // bullets reload at this rate (bullet per millisecond)
    this.stats.sitReloadTime = 7000; // time to reload use of teleport etc
    this.stats.origSpeedX = 0.55;
    this.stats.origSpeedY = 1.5;
    this.stats.isWalking = false;
    this.reevaluateSpells();
  }

  reevaluateSpells() {
    let spells = GetAvatarSpellSet(this.avatar); // length = 4; 0= passive
    this.stats.magicId = {
      0: spells[0],
      1: spells[1],
      2: spells[2],
      3: spells[3]
    };
    let spellList = GetSpellList();
    this.stats.magicReloadTime = {
      0: spellList[spells[0]].reloadTime,
      1: spellList[spells[1]].reloadTime,
      2: spellList[spells[2]].reloadTime,
      3: spellList[spells[3]].reloadTime
    }; // ms
    this.stats.lastMagicTime = {
      0: -this.stats.magicReloadTime[0],
      1: -this.stats.magicReloadTime[1],
      2: -this.stats.magicReloadTime[2],
      3: -this.stats.magicReloadTime[3]
    };
  }

  initPerGameStats() {
    this.stats.frags = 0;
    this.stats.deaths = 0;
    this.stats.lvl = 1;
    this.stats.exp = 0;

    this.stats.forceClientGeometry = { active: false }; // time: 0 }; // NOTE: to force set to true!!
    this.stats.overwritePlayerKeys = { active: false }; //, id: "" };
    this.stats.overwriteBulletFirePlayer = { active: false }; //, id: "" };
    this.stats.overwriteMouseAngle = { active: false }; //, id: "" };

    // Copy magic need to be initialized per game
    this.stats.isCopy = { active: false };
  }

  initCommonStats() {
    // Common stats to all the avatars
    this.stats.isDead = true; // on creation player is dead
    this.stats.deathTime = -2000; // new player can revive immediately
    this.stats.reviveTime = 0;

    this.stats.activeGun = 0;
    this.stats.hp = this.stats.maxhp;
    this.stats.ammo = { 0: this.stats.maxammo[0], 1: this.stats.maxammo[1] };
    this.stats.lastFireTime = {
      0: -this.stats.bulletReloadTime[0],
      1: -this.stats.bulletReloadTime[1]
    };

    this.stats.lastSitTime = -this.stats.sitReloadTime;

    this.stats.mouseAngle = 0;
    this.stats.mouseWorldX = 0;
    this.stats.mouseWorldY = 0;
    this.stats.speedX = 0;
    this.stats.speedY = 0;
    this.stats.extraSpeedX = 0;
    this.stats.extraSpeedXDecay = 0.025; // ground friction

    this.stats.intendedMoveX = 0;
    this.stats.intendedMoveY = 0;

    // Stats associated with magic
    this.stats.affectingSpells = {}; // id -> boolean
    this.stats.reflectsBullets = false;
    this.stats.hitByBullets = true;
    this.stats.invisible = false;
    // TODO: Redesign stats to avoid orig/modified stats.
    this.stats.origDodgeBullets = 0;
    this.stats.dodgeBullets = 0; // probability from 0 to 100
    this.stats.origDodgeMagic = 0;
    this.stats.dodgeMagic = 0; // probability from 0 to 100
    this.stats.criticalHitProb = 0;
    this.stats.magicSpeedY = 0;
    this.stats.magicSpeedX = 0;
    this.stats.shootDoubles = false;
    this.stats.rebirthActive = false;
    this.stats.canShoot = true;
    this.stats.bulletsExtraStrength = 0; // percents
    this.stats.jumpAndKill = false;
    this.stats.truckMode = false;
    this.stats.fakeEye = { active: false };
    this.stats.canFly = false;
    this.stats.frenzy = 0; // 0-100%
    this.stats.emojiJump = false;
    this.stats.canReloadAmmo = true;
    this.stats.prime = false;
    this.stats.vampiric = 0; // percent
    this.stats.returnDamage = 0; // percent
    this.stats.shotToMagic = 0; // percent
    this.stats.unbreakable = false; // skull magic
    this.stats.quadDamage = false;

    // These values come from geometry, but we use them to pass value from server
    this.stats.posX = 0;
    this.stats.posY = 0;

    // Is used to teleport the player
    this.stats.teleportTo = { active: false }; //, x: 0, y: 0 };
    this.stats.onSpring = false;
  }

  addExp(exp) {
    this.stats.exp += exp;
    while (
      GetPlayerLvlExp(this.stats.lvl + 1) <= this.stats.exp &&
      this.stats.lvl <= 20 // max level 20
    )
      this.stats.lvl += 1;
  }

  getLvlMultiplier() {
    return 1 + (this.stats.lvl - 1) / 100;
  }

  // Killer is the player who caused damage
  handleHit(strength, killer, timeStamp, source, physics, allowReturn) {
    if (this.stats.isDead || this.stats.unbreakable) return; // to avoid bullets killing multiple times
    let prev = this.stats.hp;
    this.stats.hp = Math.max(0, this.stats.hp - strength);
    strength = prev - this.stats.hp;
    killer.setHp(killer.stats.hp + (killer.stats.vampiric / 100) * strength);

    physics.onPlayerHit(this, killer, strength, timeStamp);

    // Update exp
    if (killer.id != this.id) {
      killer.addExp(strength);
    }

    // To avoid circular dependency we have allowReturn
    if (
      source == "bullet" &&
      allowReturn == true &&
      this.stats.returnDamage > 0
    ) {
      killer.handleHit(
        (this.stats.returnDamage / 100) * strength,
        this,
        timeStamp,
        "bullet",
        physics,
        false
      );
    }

    if (source == "bullet" && killer.stats.shotToMagic > 0) {
      let reduce = (strength * killer.stats.shotToMagic) / 100;
      for (let i = 0; i < 4; i++)
        killer.stats.lastMagicTime[i] -= Math.round(reduce * 1000); // milliseconds
    }

    if (this.stats.hp <= 0) {
      // Player has rebirth active
      if (this.stats.rebirthActive) {
        // NOTE: We do not set geometry, players ressurect wherever they died.
        this.initStats();
        this.stats.isDead = false;
        return;
      }
      physics.onPlayerDead(this, killer, timeStamp);
      this.stats.isDead = true;
      this.stats.deathTime = timeStamp;
      this.stats.deaths++;

      // You do not get frags for killing copies
      let toAdd = this.stats.isCopy.active
        ? 0
        : killer.stats.prime && IsPrimeTime(timeStamp)
        ? 2
        : 1;

      killer.stats.frags += killer.id == this.id ? -toAdd : toAdd; // self kill or real kill

      if (killer.id != this.id) killer.addExp(toAdd * 200); // each kill adds 200 exp
      // Handle youtube link
      if (physics.state.physicsStats.youtube.activeYoutubePlayer == this.id)
        physics.state.physicsStats.youtube.activeYoutubePlayer = killer.id;
    }
  }

  setHp(hp) {
    if (this.stats.isDead) return;
    this.stats.hp = hp;
  }

  dodgeMagic() {
    if (this.stats.isDead) return true;
    return GetRand(100) < this.stats.dodgeMagic * this.getLvlMultiplier();
  }

  dodgeBullet() {
    return GetRand(100) < this.stats.dodgeBullets * this.getLvlMultiplier();
  }

  criticalHit() {
    return GetRand(100) < this.stats.criticalHitProb * this.getLvlMultiplier();
  }

  // TODO: What else should we apply LVL multiplier to?
  rechargeAmmo(elapsedTime) {
    if (this.stats.isDead) return;
    if (!this.stats.canReloadAmmo) return;
    for (let key in this.stats.ammo) {
      this.stats.ammo[key] +=
        elapsedTime *
        this.stats.bulletReloadRate[key] *
        this.getLvlMultiplier();
      this.stats.ammo[key] = Math.min(
        this.stats.ammo[key],
        this.stats.maxammo[key]
      );
    }
  }

  heal(elapsedTime) {
    if (this.stats.isDead) return;
    this.stats.hp +=
      elapsedTime * this.stats.healRate * this.getLvlMultiplier();
    this.stats.hp = Math.min(this.stats.hp, this.stats.maxhp);
  }

  getGunTipX(state) {
    let angle =
      this.stats.overwriteMouseAngle.active &&
      this.stats.overwriteMouseAngle.id in state.playerKeys
        ? state.playerKeys[this.stats.overwriteMouseAngle.id].keys.mouseAngle
        : this.stats.mouseAngle;

    return (
      this.getLeftX() +
      this.getPivotX() +
      ((gunWidth * this.geometry.transform.scaleX) / 2) *
        Math.cos(angle / 57.325)
    );
  }

  getGunTipY(state) {
    let angle =
      this.stats.overwriteMouseAngle.active &&
      this.stats.overwriteMouseAngle.id in state.playerKeys
        ? state.playerKeys[this.stats.overwriteMouseAngle.id].keys.mouseAngle
        : this.stats.mouseAngle;
    return (
      this.getBottomY() +
      this.getPivotY() +
      ((gunWidth * this.geometry.transform.scaleX) / 2) *
        Math.sin(angle / 57.325)
    );
  }

  getLeftX() {
    return this.geometry.getLeftX();
  }

  getBottomY() {
    return this.geometry.getBottomY();
  }

  getRightX() {
    return this.geometry.getRightX();
  }

  getTopY() {
    return this.geometry.getTopY();
  }

  getPivotX() {
    return this.geometry.getPivotX();
  }

  getPivotY() {
    return this.geometry.getPivotY();
  }

  getW() {
    return this.geometry.getW();
  }

  getH() {
    return this.geometry.getH();
  }

  setLeftX(x) {
    this.geometry.setLeftX(x);
  }

  setBottomY(y) {
    this.geometry.setBottomY(y);
  }

  setW(w) {
    this.geometry.setW(w);
  }

  setH(h) {
    this.geometry.setH(h);
  }
}

function GetNewPlayerMessage(player) {
  return (
    player.playerName +
    "[" +
    CapitalizeFirstLetter(player.avatar) +
    "]" +
    " joined the game."
  );
}

function GetRemovePlayerMessage(player) {
  return (
    player.playerName +
    "[" +
    CapitalizeFirstLetter(player.avatar) +
    "]" +
    " left the game."
  );
}

function GetKillMessage(victim, killer) {
  if (victim.id == killer.id) return killer.playerName + " has killed himself.";
  return killer.playerName + " killed " + victim.playerName + ".";
}

export default Player;
export {
  gunWidth,
  gunHeight,
  GetPlayerLvlExp,
  GetNewPlayerMessage,
  GetRemovePlayerMessage,
  GetKillMessage
};
