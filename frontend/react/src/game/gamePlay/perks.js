import { RandomString, CapitalizeFirstLetter, GetTime } from "./utils";

const perkTypes = ["medic", "gift", "diamond", "bitcoin"];
const perkSkull = "skull";
const perkQuad = "quad";

const medicDescription = ["[MEDIC]", "Restore full health."];
const giftDescription = ["[GIFT]", "Execute a random spell."];
const diamondDescription = ["[DIAMOND]", "50% speedup for 10 seconds."];
const bitcoinDescription = ["[BITCOIN]", "Reset all the spell timeouts."];
const quadDescription = [
  "[QUAD DAMAGE]",
  "Gun damage 4x multiplier for 10 seconds"
];
const skullDescription = ["[SKULL]", "Full involnurability for 10 seconds."];

function GetPerkDescription(type) {
  if (type == "medic") return medicDescription;
  if (type == "gift") return giftDescription;
  if (type == "diamond") return diamondDescription;
  if (type == "bitcoin") return bitcoinDescription;
  if (type == "skull") return skullDescription;
  if (type == "quad") return quadDescription;
  return "";
}

function GetPerkMessage(player, perk) {
  if (perk.stats.type == perkQuad)
    return (
      player.playerName +
      "[" +
      CapitalizeFirstLetter(player.avatar) +
      "]" +
      " got Quad Damage."
    );
  else if (perk.stats.type == perkSkull)
    return (
      player.playerName +
      "[" +
      CapitalizeFirstLetter(player.avatar) +
      "]" +
      " is invulnerable."
    );
  return (
    player.playerName +
    "[" +
    CapitalizeFirstLetter(player.avatar) +
    "]" +
    " got " +
    perk.stats.type +
    " perk."
  );
}

function ExecuteGift(physics, player, timeStamp, perkHash, activate) {
  if (!activate) return;
  // execute random spell
  physics.doMagic(
    player,
    26 /*random toy magicId*/,
    true /* activate*/,
    physics.getPlayerKeys(player.id),
    perkHash
  );
}

function ExecuteQuad(physics, player, timeStamp, perkHash, activate) {
  player.stats.quadDamage = activate;
  if (!activate) return;
  setTimeout(
    ExecuteQuad.bind(this, physics, player, timeStamp, perkHash, false),
    10000
  );
}

function ExecuteSkull(physics, player, timeStamp, perkHash, activate) {
  player.stats.unbreakable = activate;
  if (!activate) return;
  setTimeout(
    ExecuteSkull.bind(this, physics, player, timeStamp, perkHash, false),
    10000
  );
}

function ExecuteBitcoin(physics, player, timeStamp, perkHash, activate) {
  if (!activate) return;
  // all the magic is reloaded
  player.stats.lastMagicTime = {
    0: -player.stats.magicReloadTime[0],
    1: -player.stats.magicReloadTime[1],
    2: -player.stats.magicReloadTime[2],
    3: -player.stats.magicReloadTime[3]
  };
}

function ExecuteMedic(physics, player, timeStamp, perkHash, activate) {
  if (!activate) return;
  player.setHp(player.stats.maxhp);
}

function ExecuteDiamond(physics, player, timeStamp, perkHash, activate) {
  // TODO: Add probability of perks exploding.
  // adds extra speed and jump
  player.stats.magicSpeedX = activate ? 0.5 * player.stats.origSpeedX : 0;
  player.stats.magicSpeedY = activate ? 0.5 * player.stats.origSpeedY : 0;
  setTimeout(
    ExecuteDiamond.bind(this, physics, player, timeStamp, perkHash, false),
    10000
  );
}

function GetExecutePerk(type) {
  if (type == "medic") return ExecuteMedic;
  if (type == "gift") return ExecuteGift;
  if (type == "diamond") return ExecuteDiamond;
  if (type == "quad") return ExecuteQuad;
  if (type == "skull") return ExecuteSkull;
  if (type == "bitcoin") return ExecuteBitcoin;
  return undefined;
}

function GetPerkWh(type) {
  if (type == "medic") return [100, 100];
  if (type == "gift") return [100, 100];
  if (type == "diamond") return [80, 80];
  if (type == "quad") return [100, 100];
  if (type == "skull") return [150, 75];
  if (type == "bitcoin") return [80, 80];
  return [undefined, undefined];
}

class Perk {
  constructor(id, type) {
    this.stats = {
      id: id,
      type: type,
      place: 0,
      position: [0, 0], // leftBottom x,y
      w: 0,
      h: 0
    };
    [this.stats.w, this.stats.h] = GetPerkWh(type);
    this.onCapture = undefined;
    this.execute = GetExecutePerk(type);
  }
}

class PerkManager {
  constructor(mapId, onNewPerks, physics) {
    // TODO: make it per map
    this.perks = {};
    this.mapId = mapId;
    this.onNewPerks = onNewPerks;
    this.physics = physics;

    // perks are managed by the server
    // TODO: Creation places should be on per map basis
    this.creationPlaces = [
      [4835, 450], // basement near car
      [2114, 480], // basement bricks
      [1650, 1100], // 1st floor above aquarium
      [4180, 1350], // 1st floor fire
      [2430, 1700], // 1st floor tv
      [1600, 2350], // 1st floor lamp 1
      [3200, 2350], // 1st floor lamp 2
      [10, 3100], // attic toilet
      [2550, 3100] // attic checkout
    ];
    this.freePlaces = {};
    for (let i = 0; i < this.creationPlaces.length; i++)
      this.freePlaces[i] = true;
    // Initially 20% of places have perks in them
    // afterwards perks are created every 20 seconds

    let initPerks = Math.floor(this.creationPlaces.length / 5);
    for (let i = 0; i < initPerks; i++) this.createPerk();

    // NOTE: If more players are playing we create perks faster
    this.timeout = setTimeout(this.delayedPerk.bind(this), 7000);
  }

  stop() {
    clearTimeout(this.timeout);
  }

  getDelay() {
    if (this.physics.state == undefined) return 10;
    let nPlayers = Object.keys(this.physics.state.players).length;
    return nPlayers < 3 ? 15 : nPlayers < 5 ? 11 : 6;
  }

  delayedPerk() {
    this.createPerk();
    this.timeout = setTimeout(
      this.delayedPerk.bind(this),
      this.getDelay() * 1000
    );
  }

  getFreePlace() {
    if (Object.keys(this.freePlaces).length == 0) return -1;
    let id = Math.floor(Math.random() * Object.keys(this.freePlaces).length);
    return parseInt(Object.keys(this.freePlaces)[id]);
  }

  deletePerk(id) {
    if (
      this.perks[id].stats.place != -1 &&
      this.perks[id].stats.place != undefined
    )
      this.freePlaces[this.perks[id].stats.place] = true;
    delete this.perks[id];
    this.onNewPerks(this.perks);
  }

  externalAddPerk(perkStats) {
    let perk = new Perk(perkStats.id, perkStats.type);
    perk.stats.place = perkStats.place;
    perk.stats.position = perkStats.position;
    this.perks[perk.stats.id] = perk;
  }

  createPerk() {
    let id = RandomString();
    let type = perkTypes[Math.floor(Math.random() * perkTypes.length)];
    let place = this.getFreePlace();
    if (place == undefined || place == -1) return; // if all the places are occupied don't create anything
    let perk = new Perk(id, type);
    perk.stats.place = place;
    delete this.freePlaces[place]; // make it occupied
    perk.stats.position = this.creationPlaces[place];
    this.perks[id] = perk;
    this.onNewPerks(this.perks);
  }

  // perk that supports countdown
  createTimerPerk(type, x, y, onCapture) {
    let id = RandomString();
    let place = -1;
    let perk = new Perk(id, type);
    perk.stats.place = -1;
    perk.stats.position = [x, y];
    perk.onCapture = onCapture;
    this.perks[id] = perk;
    this.onNewPerks(this.perks);
  }
}

export default PerkManager;
export { GetPerkMessage, GetPerkDescription, perkTypes };
