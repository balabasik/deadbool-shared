// This class evolved, and is used as a container for the player information
// that is sent to the server on each update, not jsut player keys.
class Keys {
  constructor(stats) {
    this.resetAllKeys(stats);
  }

  // VERY IMPORTANT NOTE: ORDER OF INITIALIZATION MATTERS.
  // WE SERIALZIE THE KEYS INTO BITS SO IT IS IMPORTANT TO KEEP IT THIS WAY.
  // NOTE: WHEN ADDING NEW VALUES HERE DON'T FORGET TO ADD IN UTILS for serialization.
  resetAllKeys(stats) {
    this.mouseX = 0; // in the world coordinates, not in frame coordinates.
    this.mouseY = 0;
    this.mouseAngle = 0;
    this.activeGun = stats == undefined ? 0 : stats.activeGun == 1 ? 1 : 0;
    this.leftKey = false;
    this.rightKey = false;
    this.upKey = false;
    this.downKey = false;
    this.rightClick = false;
    this.leftClick = false;

    this.magic1 = false;
    this.magic2 = false;
    this.magic3 = false;

    // Coordinates are sacred. Server should know what is the final position on the client
    this.clientX = 0;
    this.clientY = 0;

    // Speed of the player
    this.clientSpeedX = 0;
    this.clientSpeedY = 0;

    // NOTE: timestamp is needed here for serialization/deserialization
    this.timeStamp = 0; // NOTE: timestamp will be updated by physics engine.

    // NOTE: all the data below is encapsulated into the CLIENT_META that will NOT be sent to the server.
    // When escKey is pressed the options menu is shown, and keys are not sent to the server
    this.CLIENT_META = {
      escActive: false,
      escUp: true,
      // Tab key brings the scores but doesn't do anything for the game
      tabKey: false,

      // There are two chat keys that control in game chat
      chatVisibleUp: true,
      chatActiveUp: true,
      chatVisible: false,
      chatActive: false
    };

    if (stats != undefined) {
      for (let key in stats) this[key] = stats[key];
    }
  }

  areNew() {
    let copy = new Keys();
    for (let key in copy) {
      if (copy.key != this.key) return false;
    }
    return true;
  }

  onEscDown() {
    if (!this.CLIENT_META.escUp) return;
    this.CLIENT_META.escActive = !this.CLIENT_META.escActive;
    this.CLIENT_META.escUp = false;
  }

  onEscUp() {
    this.CLIENT_META.escUp = true;
  }

  onChatVisibleDown() {
    if (!this.CLIENT_META.chatVisibleUp) return;
    this.CLIENT_META.chatVisible = !this.CLIENT_META.chatVisible;
    this.CLIENT_META.chatVisibleUp = false;
  }

  onChatVisibleUp() {
    this.CLIENT_META.chatVisibleUp = true;
  }

  onChatActiveDown() {
    if (!this.CLIENT_META.chatActiveUp) return;
    this.CLIENT_META.chatActive = !this.CLIENT_META.chatActive;
    this.CLIENT_META.chatActiveUp = false;
  }

  onChatActiveUp() {
    this.CLIENT_META.chatActiveUp = true;
  }

  onTabDown() {
    this.CLIENT_META.tabKey = true;
  }

  onTabUp() {
    this.CLIENT_META.tabKey = false;
  }

  resetMagicKeys() {
    this.magic1 = false;
    this.magic2 = false;
    this.magic3 = false;
  }

  onMagicDown(key) {
    switch (key) {
      case 81: // q
        this.magic1 = true;
        break;
      case 69: // e
        this.magic2 = true;
        break;
      case 86: // v
        this.magic3 = true;
        break;
    }
  }

  onMagicUp(key) {
    switch (key) {
      case 81: // q
        this.magic1 = false;
        break;
      case 69: // e
        this.magic2 = false;
        break;
      case 86: // v
        this.magic3 = false;
        break;
    }
  }

  onMouseDown() {
    // NOTE: Browser thinks that right click is the same as left click
    if (this.rightClick) return;
    this.leftClick = true;
  }

  onMouseUp() {
    this.leftClick = false;
    // Browser doesn't issue right click up for mouse for some reason
    this.rightClick = false;
  }

  // NOTE: Player controls its active gun, it is not server dependent
  onRightClickDown() {
    this.rightClick = true;
    this.activeGun = 1 - this.activeGun;
    // NOTE: Browser thinks that right click is the same as left click
    this.leftClick = false;
  }

  onRightClickUp() {
    this.rightClick = false;
  }

  // TODO: Angle has to be updated when player moves as well.
  setMouse(mouseX, mouseY, mouseAngle) {
    this.mouseX = Math.floor(mouseX);
    this.mouseY = Math.floor(mouseY);
    this.mouseAngle = Math.floor(mouseAngle);
  }

  onKeyDown(evt) {
    switch (evt.keyCode) {
      case 65:
        this.leftKey = true;
        break;
      case 68:
        this.rightKey = true;
        break;
      case 83:
        this.downKey = true;
        break;
      case 32:
        this.CLIENT_META.zoomKey = true;
        break;
      case 87:
        this.upKey = true;
        break;
      case 81: // q
      case 69: // e
      case 86: // v
        this.onMagicDown(evt.keyCode);
        break;
      case 27:
        this.onEscDown();
        break;
      case 9:
        this.onTabDown();
        break;
      case 13: // enter
        this.onChatActiveDown();
        break;
    }
  }

  onKeyUp(evt) {
    switch (evt.keyCode) {
      case 65:
        this.leftKey = false;
        break;
      case 68:
        this.rightKey = false;
        break;
      case 83:
        this.downKey = false;
        break;
      case 87:
        this.upKey = false;
        break;
      case 32:
        this.CLIENT_META.zoomKey = false;
        break;
      case 81: // q
      case 69: // e
      case 86: // v
        this.onMagicUp(evt.keyCode);
        break;
      case 27:
        this.onEscUp();
        break;
      case 9:
        this.onTabUp();
        break;
      case 13: // enter
        this.onChatActiveUp();
        break;
    }
  }
}

export default Keys;
