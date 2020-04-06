import { TextEncoder, TextDecoder } from "util";

const testing = process.env.NODE_ENV == "development";
// NOTE: This will be grep/sed to the actual value in an automatic manner.
const use_ssl_env = "REACT_APP_USE_SSL_PLACEHOLDER";
const use_ssl = !testing && parseInt(use_ssl_env, 10);
const envOperatorIp = "REACT_APP_OPERATOR_IP_PLACEHOLDER";
const operatorIp = testing == 1 ? "localhost" : envOperatorIp;

const zlib = require("zlib");
const protobuf = require("protobufjs");

const menuBgComponentStyle = {
  backgroundImage:
    "radial-gradient(rgba(159, 159, 159, 0.9) 50%, rgba(65, 65, 65, 0.9) 80% )"
};

const use_proto = true;
var protoState = undefined;
var protoMessage = undefined;
var protoKeys = undefined;
if (use_proto) {
  protobuf.load("gameState.proto", function(err, root) {
    if (err) {
      return;
    }
    // Obtain a message type
    protoState = root.lookupType("deadbool.GameState");
    protoKeys = root.lookupType("deadbool.PlayerKeys");
    protoMessage = root.lookupType("deadbool.Message");
  });
}

function StringToArray(str) {
  return Buffer.from(str);
}

function ArrayToString(arr) {
  return Buffer.from(arr).toString();
}

function SerializeMessageToProto(type, playerId, data) {
  if (protoMessage == undefined) return [];
  if (type == "keys") data = SerializeKeys(data);
  else if (type == "state") data = SerializeState(data);
  else data = StringToArray(data);
  let message = protoMessage.create({
    type: type,
    playerId: playerId,
    data: data
  });
  let u8 = protoMessage.encode(message).finish();
  // NOTE: We do not use zlib here because server should not do any extra work do decompress.
  return u8;
}

function DeserializeMessageFromProto(bytes) {
  if (protoMessage == undefined) return {};

  let message = {};
  try {
    message = protoMessage.decode(Buffer.from(bytes));
  } catch (e) {
    return message;
  }

  // State and keys will be serialzied from strings, while state and keys are separate
  // NOTE: Do not directly deserialize data for case of keys and state.
  if (
    message.type != "state" &&
    message.type != "keys" &&
    message.data != undefined
  )
    message.data = ArrayToString(message.data);
  return message;
}

function SerializeState(state) {
  if (!use_proto) return JSON.stringify(state);

  if (protoState == undefined) return new Array();
  // Verify the payload if necessary (i.e. when possibly incomplete or invalid)
  let errMsg = protoState.verify(state);
  if (errMsg) {
    // NOTE: We leave it on for debug purposes
    console.log(errMsg);
    return new Array();
  }

  let message = protoState.create(state);
  let u8 = protoState.encode(message).finish();
  return zlib.gzipSync(Buffer.from(u8));
}

/*
// By default all the values are floats, although they could be interpreted as ints later
const keysKeys = [
  ["mouseX", 32],
  ["mouseY", 32],
  ["mouseAngle", 32],
  ["activeGun", 32],
  ["clientX", 32],
  ["clientY", 32],
  ["clientSpeedX", 32],
  ["clientSpeedY", 32],
  ["timeStamp", 32],
  // TODO: right now can only handle less than 32 bools
  ["leftKey", 1],
  ["rightKey", 1],
  ["upKey", 1],
  ["downKey", 1],
  ["rightClick", 1],
  ["leftClick", 1],
  ["magic1", 1],
  ["magic2", 1],
  ["magic3", 1]
];

bool left_key = 1; // [default = false];
bool right_key = 2; // [default = false];
bool up_key = 3; // [default = false];
bool down_key = 4; // [default = false];
bool right_click = 5; // [default = false];
bool left_click = 6; // [default = false];
bool magic1 = 7; // [default = false];
bool magic2 = 8; // [default = false];
bool magic3 = 9; // [default = false];
*/

const keyNames = [
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

function PackKeys(keys) {
  let packed = 0;
  keyNames.map((name, index) => {
    packed |= (keys[name] == true ? 1 : 0) << index;
  });
  keys.packedKeys = packed;
}

function UnpackKeys(keys) {
  let packed = keys.packedKeys;
  keyNames.map(name => {
    keys[name] = packed & (1 == 1);
    packed = packed >> 1;
  });
}

function SerializeKeys(keys) {
  if (!use_proto) return JSON.stringify(keys);
  if (protoKeys == undefined) return new Array();

  // int32 packing all the bools
  PackKeys(keys);

  let errMsg = protoKeys.verify(keys);
  if (errMsg) {
    console.log(errMsg);
    return new Array();
  }

  let message = protoKeys.create(keys);
  let u8 = protoKeys.encode(message).finish();
  return u8;
}

function DeserializeState(data) {
  if (!use_proto) {
    let state1 = undefined;
    try {
      state1 = JSON.parse(data);
    } catch (error) {
      //console.log(error);
    }
    return state1;
  }

  if (protoState == undefined) return {};
  if (data.length == 0) {
    console.log("ERROR: State is empty!");
    return {};
  }
  let state = {};
  try {
    data = zlib.gunzipSync(Buffer.from(data));
    state = protoState.decode(data);
  } catch (e) {
    console.log(e);
  }
  return state;
}

function DeserializeKeys(data) {
  if (!use_proto) {
    let state1 = undefined;
    try {
      state1 = JSON.parse(data);
    } catch (error) {
      //console.log(error);
    }
    return state1;
  }

  if (protoKeys == undefined) return {};
  if (data.length == 0) {
    console.log("ERROR: Keys are empty!");
    return {};
  }

  let keys = {};
  try {
    keys = protoKeys.decode(data);
    UnpackKeys(keys);
  } catch (e) {
    console.log(e);
  }
  return keys;
}

// For state and keys we use gzip compression
function doZip(type) {
  return type == "state" || type == "keys";
}

// NOTE: Inside we gzip data and encode into base64
function CustomSerializeMessage(type, playerId, data) {
  // NOTE: The data is big here
  if (use_proto) {
    return SerializeMessageToProto(type, playerId, data);
  } else {
    let zip = doZip(type);
    if (type == "state") data = SerializeState(data);
    else if (type == "keys") data = SerializeKeys(data);
    return (
      type +
      "@" +
      playerId +
      "@" +
      (zip ? zlib.gzipSync(data).toString("base64") : data)
    );
  }
}

// NOTE: Inside we gunzip data and decode from base64
function CustomDeserializeMessage(message, forceNoUnzip) {
  if (use_proto) {
    return DeserializeMessageFromProto(message);
  } else {
    // NOTE: We will not use split() here as it might be dangerous, what if separator character is present in the data..
    let first = -1;
    let res = { type: "", playerId: "", data: "" };
    let data = "";
    for (let i = 0; i < message.length; i++) {
      if (message[i] != "@") continue;
      if (first == -1) {
        first = i;
        res.type = message.substring(0, i);
      } else {
        res.playerId = message.substring(first + 1, i);
        data = message.substring(i + 1);
        break;
      }
    }
    let zip = doZip(res.type) && forceNoUnzip != true;
    // gunzip
    res.data = zip
      ? zlib.gunzipSync(new Buffer.from(data, "base64")).toString()
      : data;
    return res;
  }
}

function CapitalizeFirstLetter(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function GetRand(modulus) {
  return Math.floor(Math.random() * modulus);
}

function GetHashFromString(word) {
  var hash = 0,
    i,
    chr;
  if (word.length === 0) return hash;
  for (i = 0; i < word.length; i++) {
    chr = word.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// Get angle from x2 y2 to x1 y1
function GetAngle(x1, x2, y1, y2) {
  var deltaX = x1 - x2;
  var deltaY = y1 - y2;
  var mouseAngle = 0;
  if (Math.abs(deltaX) < 0.0001) mouseAngle = deltaY > 0 ? 90 : -90;
  else {
    mouseAngle = (Math.atan(deltaY / deltaX) * 180) / Math.PI; // [-Pi/2;Pi/2]
    if (deltaX < 0) mouseAngle += 180;
  }
  // Angle has to be between 0 and 360
  mouseAngle += 360;
  mouseAngle %= 360;
  return mouseAngle;
}

function GetTime() {
  var d = new Date();
  return d.getTime();
}

// NOTE: This is not exactly lower bound as we are returning the last element if
// the key is too big
function lowerBoundIndexBeginEnd(array, begin, end, key, greaterOrEqThan) {
  let length = array.length;
  if (begin >= length) return length;
  if (greaterOrEqThan(array[begin], key)) return begin;
  if (begin > end) return end;
  if (begin == end) return begin + 1;

  let mid = Math.floor((begin + end + 1) / 2);

  if (greaterOrEqThan(array[mid], key))
    return lowerBoundIndexBeginEnd(array, begin, mid - 1, key, greaterOrEqThan);
  return lowerBoundIndexBeginEnd(array, mid, end, key, greaterOrEqThan);
}

function LowerBoundIndex(array, key, greaterOrEqThan) {
  let length = array.length;
  if (greaterOrEqThan == undefined) {
    greaterOrEqThan = (a, b) => {
      return a >= b;
    };
  }
  let ret = lowerBoundIndexBeginEnd(array, 0, length - 1, key, greaterOrEqThan);
  return ret == length ? ret - 1 : ret;
}

function GetLastItemInMap(map) {
  return Array.from(map)[map.size - 1];
}

function GetLastKeyInMap(map) {
  return Array.from(map)[map.size - 1][0];
}
function GetLastValueInMap(map) {
  return Array.from(map)[map.size - 1][1];
}

function MapItemFromIndex(map, index) {
  return map[Object.keys(map)[index]];
}

function RandomString() {
  return Math.random()
    .toString(36)
    .substring(7);
}

function ShrinkString(s, n) {
  return s.length > n ? s.slice(0, n - 1) : s.slice(0);
}

function RandomUniqueString(dict) {
  while (true) {
    let key = RandomString();
    if (!(key in dict)) return key;
  }
}

function WeightedSumm(a, b, factor) {
  return (1 - factor) * a + factor * b;
}

function GetMagicReloadFactor(nPlayers) {
  switch (nPlayers) {
    case 1:
      return 0.1;
    case 2:
      return 0.2;
    case 3:
      return 0.3;
    case 4:
      return 0.4;
    case 5:
      return 0.5;
    case 6:
      return 0.6;
    case 7:
      return 0.7;
    case 8:
      return 0.75;
    case 9:
      return 0.8;
    case 10:
      return 0.85;
    case 11:
      return 0.9;
    case 12:
      return 0.95;
    case 13:
      return 1;
    case 14:
      return 1;
    case 15:
      return 1;
    default:
      return 1;
  }
}

function VectorProduct(rx, ry, sx, sy) {
  return rx * sy - sx * ry;
}

function IntersectLines(px1, py1, px2, py2, qx1, qy1, qx2, qy2) {
  // p
  let rx = px2 - px1;
  let ry = py2 - py1;

  // q
  let sx = qx2 - qx1;
  let sy = qy2 - qy1;

  let vp = VectorProduct(rx, ry, sx, sy);

  // parallel
  if (vp == 0) return { intersect: false };

  // t = (q − p) × s / (r × s)
  let t = VectorProduct(qx1 - px1, qy1 - py1, sx, sy) / vp;

  // u = (q − p) × r / (r × s)
  let u = VectorProduct(qx1 - px1, qy1 - py1, rx, ry) / vp;

  // do not intersect
  if (t < 0 || t > 1 || u < 0 || u > 1) return { intersect: false };

  //console.log("t: " + t + " x: " + (px1 + t * rx) + " y: " + (py1 + t * ry));
  //console.log("u: " + u + " x: " + (qx1 + u * sx) + " y: " + (qy1 + u * sy));

  // intersect
  return { intersect: true, x: px1 + t * rx, y: py1 + t * ry };
}

function IsPrimeTime(timeStamp) {
  let seconds = (timeStamp / 1000) % 60;
  let primeSet = [
    2,
    3,
    5,
    7,
    11,
    13,
    17,
    19,
    23,
    29,
    31,
    37,
    41,
    43,
    47,
    53,
    59
  ];
  return primeSet.includes(seconds);
}

function DoBoxesOverlap(
  leftX1,
  bottomY1,
  rightX1,
  topY1,
  leftX2,
  bottomY2,
  rightX2,
  topY2
) {
  return !(
    leftX2 > rightX1 ||
    rightX2 < leftX1 ||
    bottomY2 > topY1 ||
    topY2 < bottomY1
  );
}

function GetAvatarSoundIndexes(id) {
  if (id == "deadbool") {
    return [0, 1, 2, 3, 4, 5, 6, 7];
  }
  if (id == "kgb") {
    return [1, 2, 3];
  }
  if (id == "moon") {
    return [0, 1, 2, 3];
  }
  if (id == "neo") {
    return [1, 2, 3, 4];
  }
  if (id == "batman") {
    return [0, 1, 2, 3];
  }
  if (id == "mario") {
    return [0, 1, 2];
  }
  if (id == "rick") {
    return [0, 1, 2, 3];
  }
  if (id == "buzz") {
    return [1, 2, 3];
  }
  if (id == "trump") {
    return [0, 1, 2, 3, 4];
  }
  if (id == "vader") {
    return [1, 2, 3, 4, 5];
  }
  if (id == "fool") {
    return [0, 1, 2, 3];
  }
  if (id == "pika") {
    return [1, 2, 3];
  }
  if (id == "optimus") {
    return [1, 2, 3, 4, 5];
  }
  if (id == "thanos") {
    return [1, 2, 3, 4];
  }
  if (id == "jesus") {
    return [1, 2, 3, 4];
  }
  if (id == "random") return [];
}

const heroList = [
  ["deadbool", "DB"],
  ["kgb", "KG"],
  ["moon", "SM"],
  ["neo", "NE"],
  ["batman", "BT"],
  ["mario", "SM"],
  ["rick", "RK"],
  ["buzz", "BZ"],
  ["trump", "BS"],
  ["vader", "DV"],
  ["fool", "FL"],
  ["pika", "PK"],
  ["optimus", "OP"],
  ["thanos", "TH"],
  ["jesus", "JC"],
  ["random", ""]
];

function GetHeroList() {
  return heroList;
}

function ShuffleArray(a) {
  let b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function GetNaturalArrayWZero(n) {
  let x = [];
  for (let i = 0; i < n; i++) x.push(i);
  return x;
}

export {
  GetAngle,
  GetTime,
  LowerBoundIndex,
  GetLastValueInMap,
  GetLastKeyInMap,
  MapItemFromIndex,
  RandomString,
  RandomUniqueString,
  WeightedSumm,
  GetHashFromString,
  GetRand,
  GetMagicReloadFactor,
  IntersectLines,
  IsPrimeTime,
  DoBoxesOverlap,
  GetHeroList,
  GetAvatarSoundIndexes,
  CapitalizeFirstLetter,
  ShuffleArray,
  GetNaturalArrayWZero,
  ShrinkString,
  use_ssl,
  operatorIp,
  menuBgComponentStyle,
  CustomDeserializeMessage,
  CustomSerializeMessage,
  SerializeKeys,
  DeserializeKeys,
  SerializeState,
  DeserializeState
};
