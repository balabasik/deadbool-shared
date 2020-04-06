class Sound {
  constructor(id, soundProps, onFinished) {
    this.id = id;
    this.options = soundProps;
    this.onFinished = onFinished;
    this.resetAudio();
  }

  resetAudio() {
    this.isStarted = false;
    this.audio = new Audio(this.options.src);
    this.audio.volume = this.options.volume;
    this.audio.load();

    // NOTE: Do not remove reusable audio
    this.audio.addEventListener("ended", () => this.stopNatural());
  }

  setOptions(options) {
    this.options = options;
    this.audio.volume = options.volume;
  }

  start() {
    if (this.isStarted) return;
    this.isStarted = true;
    this.promise = this.audio.play();
    this.promise.then().catch(error => {});
    this.timeout = setTimeout(
      () => this.stopInternal(),
      Math.min(this.options.duration) // ms
    );
  }

  reload() {
    if (this.options.cyclic && this.isStarted) return;
    this.stopExternal();
  }

  stopExternal(force) {
    if (!this.isStarted) return;
    if (this.options.cyclic && !force) return;
    this.isStarted = false;
    this.audio.pause();
    this.audio.currentTime = 0;
    clearTimeout(this.timeout);
  }

  stopInternal() {
    if (!this.isStarted) return;
    this.isStarted = false;
    this.audio.pause();
    this.audio.currentTime = 0;
    if (this.options.cyclic) this.start();
    else this.onFinished(this.options.id);
  }

  stopNatural() {
    if (!this.isStarted) return;
    this.isStarted = false;
    clearTimeout(this.timeout);
    if (this.options.cyclic) {
      this.audio.currentTime = 0;
      this.start();
    } else {
      this.onFinished(this.options.id);
    }
  }
}

class ClientSoundManager {
  constructor(systemOptions, thisPlayer) {
    this.sounds = {};
    this.groupToId = {};
    this.activeSounds = {};
    this.timeStamp = 0;
    this.thisPlayer = "";

    this.enableSounds = systemOptions.sound;
    this.enableMusic = systemOptions.music;

    this.playerX = 0;
    this.playerY = 0;
  }

  updateThisPlayer(id) {
    if (this.thisPlayer != id) this.thisPlayer = id;
  }

  onNewSystemOptions(options) {
    this.enableSounds = options.sound;
    this.enableMusic = options.music;
  }

  update(timeStamp, soundManager, playerX, playerY) {
    this.playerX = playerX;
    this.playerY = playerY;
    if (!this.enableSounds) {
      this.deleteAll();
      return;
    }
    this.timeStamp = timeStamp;
    for (let key in soundManager.sounds) {
      this.addSound(soundManager.sounds[key]);
    }
    for (let key in soundManager.clientSounds) {
      this.addSound(soundManager.clientSounds[key]);
    }
  }

  addSound(newSound) {
    // TODO: There could be a problem here if same sound comes again after
    // it has been removed by a sound from the same group.
    let key = newSound.id;
    if (key in this.sounds) return;
    if (!this.checkTimeStamp(newSound)) return;

    let volume =
      (newSound.volume != undefined ? newSound.volume : 1) *
      (newSound.global &&
      (newSound.targetPlayer == this.thisPlayer ||
        newSound.targetPlayer == "" ||
        newSound.targetPlayer == undefined)
        ? 1
        : this.getDistanceVolumeFactor(
            this.playerX,
            this.playerY,
            newSound.x,
            newSound.y,
            newSound.r
          ));
    newSound.volume = volume;
    if (newSound.group in this.groupToId) {
      // Sound group exists in the database. We reuse loaded sound.
      // It is also used to update sound location.
      let oldKey = this.groupToId[newSound.group];
      let oldSrc = this.sounds[oldKey].options.src;

      this.sounds[key] = this.sounds[oldKey];
      this.sounds[key].setOptions(newSound);
      this.sounds[key].id = key;

      if (newSound.src == oldSrc) {
        if (newSound.stopGroup)
          this.stopSound(key, false /*do not force cyclic sounds*/);
      } else if (!this.sounds[key].isStarted) {
        // Handle change of src of the sound in the same group
        // But only when sound is stopped
        this.sounds[key].resetAudio();
      }
      this.sounds[oldKey] = {};
      delete this.sounds[oldKey];
    } else {
      this.sounds[key] = new Sound(
        key,
        newSound,
        this.onSoundFinished.bind(this),
        volume
      );
    }
    this.groupToId[newSound.group] = key;
    this.sounds[key].start();
  }

  // NOTE: we simply skip sounds that are either too far in the past, or in the future.
  // TODO: Store sounds from the future and play them when time comes.
  checkTimeStamp(options) {
    return (
      options.initTime >= this.timeStamp - 200 &&
      options.initTime < this.timeStamp + 200
    );
  }

  getDistanceVolumeFactor(x1, y1, x2, y2, soundRadius) {
    if (soundRadius == undefined) soundRadius = 300;
    let dist = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    // NOTE: Distance within screen range is ~ 1000
    if (dist <= soundRadius) return 1;
    if (dist >= soundRadius * 8) return 0.1;
    if (dist >= soundRadius * 4) return 0.1;

    // Formula for soundRadius < r < 4*soundRadius
    return 1 - (0.9 * (dist - soundRadius)) / (4 * soundRadius - soundRadius);
  }

  deleteAllSoundsForPlayer(id) {
    let keys = Object.keys(this.sounds);
    for (let key in keys) {
      if (this.sounds[key] == undefined) continue;
      if (this.sounds[key].targetPlayer == id) this.deleteSound(key);
    }
  }

  onSoundFinished(key) {
    if (!(key in this.sounds)) return;
    if (this.sounds[key].options.deleteAfterFinished) this.deleteSound(key);
  }

  forceStopGroup(group) {
    if (group in this.groupToId) {
      this.stopSound(this.groupToId[group], true);
    }
  }

  stopSound(key, force) {
    if (key in this.sounds) {
      this.sounds[key].stopExternal(force);
      if (this.sounds[key].options.deleteAfterFinished) delete this.sounds[key];
    }
    if (key in this.activeSounds) delete this.activeSounds[key];
  }

  deleteAll() {
    let keys = Object.keys(this.sounds);
    for (let key in keys) this.deleteSound(key);
  }

  deleteSound(key) {
    if (key in this.sounds) {
      if (this.sounds[key].isStarted) this.sounds[key].stopExternal(true);
      delete this.groupToId[this.sounds[key].group];
      delete this.sounds[key];
    }
    if (key in this.activeSounds) delete this.activeSounds[key];
  }
}

export default ClientSoundManager;
