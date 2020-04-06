import { RandomString } from "../gamePlay/utils";

const clickSound2 = "/sounds/Hihat IzoVinyl Closed.wav.mp3";
const mouseOverSound2 = "/sounds/Hihat Dishes Closed.wav.mp3";
const clickSound1 = "/sounds/Wood MS.wav.mp3";
const mouseOverSound1 = "/sounds/Hihat Grassy Closed.wav.mp3";

class SoundManager {
  constructor(systemOptions) {
    this.sounds = {};
    this.enableSounds = true;
    this.enableMusic = true;
    if (systemOptions != undefined) {
      this.enableSounds = systemOptions.sound;
      this.enableMusic = systemOptions.music;
    }
  }

  onNewSystemOptions(options) {
    this.enableSounds = options.sound;
    this.enableMusic = options.music;
    this.refreshSoundOptions();
  }

  refreshSoundOptions() {
    for (let key in this.sounds) {
      let sound = this.sounds[key];
      if (sound.type == "sound") sound.audio.muted = !this.enableSounds;
      else if (sound.type == "music") sound.audio.muted = !this.enableMusic;
    }
  }

  playSound(src, useSrcAsHash, stopEarly, type, cyclic, hash, volume) {
    if (type == undefined) type = "sound"; // sound or music
    if (volume == undefined) volume = 1;
    if (cyclic == undefined) cyclic = false;
    if (
      (type == "sound" && !this.enableSounds) ||
      (type == "music" && !this.enableMusic)
    )
      return;

    let id =
      useSrcAsHash == true ? src : hash == undefined ? RandomString() : hash;
    if (this.sounds[id] == undefined) {
      this.sounds[id] = {
        audio: new Audio(src),
        src: src,
        type: type,
        persistHash: useSrcAsHash,
        playPromise: undefined,
        cyclic: cyclic
      };
      let audio = this.sounds[id].audio;
      audio.volume = volume;
      audio.addEventListener("ended", () => this.soundEnded(id));
      audio.onloadeddata = this.onSoundLoaded.bind(this, id);
      audio.load();
    } else if (stopEarly) {
      let sound = this.sounds[id];
      // NOTE: If audio fails for some reason need to run pause from playPromise.then
      //this.sounds[id].playPromise
      sound.audio.volume = volume;
      sound.audio.pause();
      sound.audio.currentTime = 0;

      if (sound.src == src && sound.type == type && sound.cyclic == cyclic) {
        sound.playPromise = sound.audio.play();
        sound.playPromise.then().catch(error => {});
      } else {
        this.sounds[id] = {
          audio: new Audio(src),
          src: src,
          type: type,
          persistHash: useSrcAsHash,
          playPromise: undefined,
          cyclic: cyclic
        };
        let audio = this.sounds[id].audio;
        audio.volume = volume;
        audio.addEventListener("ended", () => this.soundEnded(id));
        audio.onloadeddata = this.onSoundLoaded.bind(this, id);
        audio.load();
      }
    }
    // TODO: Debug DOMException here.
  }

  onSoundLoaded(id) {
    if (!(id in this.sounds)) return;
    this.sounds[id].playPromise = this.sounds[id].audio.play();
    this.sounds[id].playPromise.then().catch(error => {});
  }

  forceStopAll() {
    for (let key in this.sounds) {
      //this.sounds[key].playPromise.then(this.sounds[key].audio.pause());
      this.sounds[key].audio.pause();
      this.sounds[key].audio.currentTime = 0;
    }
  }

  soundEnded(id) {
    if (this.sounds[id] == undefined) return;
    let sound = this.sounds[id];
    if (!sound.cyclic && sound.useSrcAsHash != true) {
      sound.audio.pause();
      delete this.sounds[id];
    } else if (sound.cyclic) {
      sound.audio.pause();
      sound.audio.currentTime = 0;
      sound.playPromise = sound.audio.play();
      sound.playPromise.then().catch(error => {});
    }
  }

  removeSound(id) {
    if (this.sounds[id] != undefined && !this.sounds[id].cyclic) {
      this.sounds[id].audio.pause();
      delete this.sounds[id];
    }
  }

  forceRemoveSound(id) {
    if (this.sounds[id] != undefined) {
      this.sounds[id].audio.pause();
      delete this.sounds[id];
    }
  }
}

export default SoundManager;
export { clickSound1, mouseOverSound1, clickSound2, mouseOverSound2 };
