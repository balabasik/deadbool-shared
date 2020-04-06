import { RandomString, GetTime } from "./utils";

const soundPropsFire0 = {
  src: "/sounds/fire0.wav.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsFire1 = {
  src: "/sounds/fire1.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsExplode1 = {
  src: "/sounds/Explosion3.WAV.mp3",
  duration: 1000,
  playTime: 0,
  r: 400,
  playFrom: 0
};

const soundPropsSwap1 = {
  src: "/sounds/change.wav.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsJump1 = {
  src: "/sounds/TWANG3.WAV.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsBounce1 = {
  src: "/sounds/CrateImpact.wav.mp3",
  duration: 1000,
  playTime: 0,
  r: 300,
  playFrom: 0
};

const soundPropsLand1 = {
  src: "/sounds/WormLanding.wav.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsWalk1 = {
  src: "/sounds/walking11.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsSpring1 = {
  src: "/sounds/TWANG1.WAV.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsTeleport1 = {
  src: "/sounds/teleport_combined2.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsMagic1 = {
  src: "/sounds/magic1.mp3",
  duration: 1000,
  playTime: 0,
  r: 200,
  playFrom: 0
};

const soundPropsPerk1 = {
  src: "/sounds/ar2_pkup.wav.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsRevive1 = {
  src: "/sounds/use_medkit.wav.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsDeath1 = {
  src: "/sounds/death1.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsKill1 = {
  src: "/sounds/BRILLIANT.WAV.mp3",
  duration: 1000,
  playTime: 0,
  r: 300,
  playFrom: 0
};

const soundPropsKill2 = {
  src: "/sounds/holyshit.wav.mp3",
  duration: 1000,
  playTime: 0,
  r: 300,
  playFrom: 0
};

const soundPropsHit1 = {
  src: "/sounds/hit.wav.mp3",
  duration: 1000,
  playTime: 0,
  r: 500,
  playFrom: 0
};

const soundPropsGetHit1 = {
  src: "/sounds/ow1.wav.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsQuad1 = {
  src: "/sounds/quaddamage.wav.mp3",
  duration: 3000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsSkull1 = {
  src: "/sounds/protect.wav.mp3",
  duration: 2000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsExcellent1 = {
  src: "/sounds/menu_excellent.wav.mp3",
  duration: 1000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsHolyShit1 = {
  src: "/sounds/holyshit.wav.mp3",
  duration: 2000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsImpressive1 = {
  src: "/sounds/impressive.wav.mp3",
  duration: 2000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsHumiliation1 = {
  src: "/sounds/humiliation.wav.mp3",
  duration: 2000,
  playTime: 0,
  r: 100,
  playFrom: 0
};

const soundPropsClockTick1 = {
  src: "/sounds/Cabasa 60s Vinyl.wav.mp3",
  duration: 1000,
  playTime: 0,
  r: 50,
  playFrom: 0,
  volume: 0.5
};

const soundPropsClockDone1 = {
  src: "/sounds/telein.wav.mp3",
  duration: 2000,
  playTime: 0,
  r: 100,
  playFrom: 0,
  volume: 0.8
};

const soundPropsMover1 = {
  src: "/sounds/drone6.wav.mp3",
  duration: 2000,
  playTime: 0,
  r: 200,
  playFrom: 0
};

const soundPropsFan1 = {
  src: "/sounds/drone.wav.mp3",
  duration: 2000,
  playTime: 0,
  r: 200,
  playFrom: 0
};

const soundPropsWater1 = {
  src: "/sounds/water1.mp3",
  duration: 2000,
  playTime: 0,
  r: 200,
  playFrom: 0
};

const soundPropsArcanoid1 = {
  src: "/sounds/klaxon2.wav.mp3",
  duration: 4000,
  playTime: 0,
  r: 50,
  playFrom: 0,
  volume: 0.7
};

function GetSoundProps(type) {
  if (type == "fire0") return soundPropsFire0;
  if (type == "fire1") return soundPropsFire1;
  if (type == "swap") return soundPropsSwap1;
  if (type == "explode1") return soundPropsExplode1;
  if (type == "bounce") return soundPropsBounce1;
  if (type == "walk") return soundPropsWalk1;
  if (type == "jump") return soundPropsJump1;
  if (type == "land") return soundPropsLand1;
  if (type == "spring") return soundPropsSpring1;
  if (type == "teleport") return soundPropsTeleport1;
  if (type == "magic") return soundPropsMagic1;
  if (type == "perk") return soundPropsPerk1;
  if (type == "revive") return soundPropsRevive1;
  if (type == "death") return soundPropsDeath1;
  if (type == "kill") return soundPropsKill2;
  if (type == "hit") return soundPropsHit1;
  if (type == "gethit") return soundPropsGetHit1;
  if (type == "quad") return soundPropsQuad1;
  if (type == "skull") return soundPropsSkull1;
  if (type == "excellent") return soundPropsExcellent1;
  if (type == "holyshit") return soundPropsHolyShit1;
  if (type == "impressive") return soundPropsImpressive1;
  if (type == "humiliation") return soundPropsHumiliation1;
  if (type == "clocktick") return soundPropsClockTick1;
  if (type == "clockdone") return soundPropsClockDone1;
  if (type == "mover") return soundPropsMover1;
  if (type == "fan") return soundPropsFan1;
  if (type == "water") return soundPropsWater1;
  if (type == "arcanoid") return soundPropsArcanoid1;
}

class SoundProps {
  constructor() {
    this.id = "";
    this.type = "mp3"; // type is not really used anywhere besides constructor
    this.group = ""; // code name of the sound
    this.x = 0; // this is needed to adjust volume based on location later
    this.y = 0;
    this.r = 100; // this is needed to see how sound propagates with distance
    this.src = ""; // src of the sound
    this.duration = 1000; // ms
    this.initTime = 0; // time when sound should start playing
    this.playFrom = 0; // play from the middle
    this.speedUp = 1;
    this.global = false;
    this.targetPlayer = "";
    this.cyclic = false;
    this.deleteAfterFinished = false;
    this.volume = 1;
    this.stopGroup = true; // when this sound is played, previous sound is stopped first
  }
}

class SoundManager {
  constructor() {
    this.sounds = {};
    this.clientSounds = {};
  }

  addSoundSrc(src, soundProps) {
    if (soundProps.id == undefined) soundProps.id = RandomString();
    soundProps.type = src;
    let newProps = new SoundProps();
    let extraProps = {
      src: src,
      duration: 2000,
      playTime: 0,
      r: 200,
      playFrom: 0
    };

    for (let key in extraProps) newProps[key] = extraProps[key];
    for (let key in soundProps) newProps[key] = soundProps[key];

    this.sounds[soundProps.id] = newProps;
  }

  addSound(type, soundProps, client) {
    if (client == undefined) client = false;
    if (soundProps.id == undefined) soundProps.id = RandomString();
    soundProps.type = type;
    let newProps = new SoundProps();
    let extraProps = GetSoundProps(type);

    for (let key in extraProps) newProps[key] = extraProps[key];
    for (let key in soundProps) newProps[key] = soundProps[key];

    if (client) {
      this.clientSounds[soundProps.id] = newProps;
    } else {
      this.sounds[soundProps.id] = newProps;
    }
  }

  addClientSound(type, soundProps) {
    this.addSound(type, soundProps, true);
  }

  copySound(soundProps) {
    this.addSound(soundProps.type, soundProps);
  }

  clearAll() {
    this.sounds = {};
    this.clientSounds = {};
  }
}

export default SoundManager;
export { SoundProps, GetSoundProps };
