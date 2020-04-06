// This class is for temporal update of the state.
// it stores player positions and physicsStats for a given timeStamp.

import { LowerBoundIndex } from "./utils";
import Player from "./player";
import Keys from "./keys";

class TemporalState {
  constructor() {
    this.physicsStats = {};
    this.players = {};
  }

  setStats(physicsStats) {
    this.physicsStats = physicsStats;
  }

  setPlayers(players) {
    for (let key of Object.keys(players)) this.addPlayer(players[key]);
  }

  addPlayer(player) {
    this.players[player.id] = {
      ...player.stats,
      x: player.getLeftX(),
      y: player.getBottomY()
    };
  }
}

class TemporalPhysics {
  constructor(physics) {
    this.states = []; // sorted by timeStamp in increasing order
    this.physics = physics;
  }

  // FIXME: Right now we explicitely assume that timestamps are in
  addState(gameState) {
    let state = new TemporalState();
    let time = gameState.timeStamp;

    state.setStats(gameState.physicsStats);
    state.setPlayers(gameState.players);

    this.states.push({ timeStamp: time, state: state });
    // Gives us about 1 second of time
    if (this.states.length > 100) this.removeLatestFrame();
  }

  forceGeometryInAllStates(player) {
    for (let state of this.states) {
      state.state.addPlayer(player);
    }
  }

  removeLatestFrame() {
    this.states.shift();
  }

  getTheNewestPlayerStats(id) {
    if (this.states.length == 0) return undefined;
    return this.states[this.states.length - 1].state.players[id];
  }

  getUpperBoundStats(timeStamp, id) {
    if (this.states.length == 0) return undefined;
    let lowerBound = LowerBoundIndex(this.states, timeStamp, (a, b) => {
      return a.timeStamp >= b;
    });
    if (lowerBound + 1 != this.states.length) lowerBound++;
    return {
      ...this.states[lowerBound].state.players[id],
      timeStamp: this.states[lowerBound].timeStamp
    };
  }

  propagateStats(frame, player, keys) {
    // Keys are applied at a given timeframe but reflect action that was done in the previous time frame
    // if this is the very first time frame we declare elapsed time as 0
    let oldTimeStamp = frame == 0 ? 0 : this.states[frame - 1].timeStamp;
    let newTimeStamp = this.states[frame].timeStamp;
    let elapsedTime = newTimeStamp - oldTimeStamp;

    // We overwrite the stats that belong to the physicsStats
    // CAREFUL! NEED TO WRITE THEM BACK AFTER COMPLETION.
    let oldPhysicsStats = this.physics.state.physicsStats;
    let oldPhysicsTimeStamp = this.physics.state.timeStamp;

    this.physics.state.physicsStats = this.states[frame].state.physicsStats;
    this.physics.state.timeStamp = oldTimeStamp;

    // Move the player and the boxes;
    this.physics.movePlayer(elapsedTime, player, keys, true /*temporal*/);
    this.physics.moveBoxes(player, newTimeStamp);

    // Bring back the physics!
    this.physics.state.physicsStats = oldPhysicsStats;
    this.physics.state.timeStamp = oldPhysicsTimeStamp;
  }

  // TODO: If player quit is it possible that we still receive his keys?
  applyTemporalKeys(playerId, timeStamp, keys) {
    // If keys are too old we ignore them
    if (this.states.length == 0 || timeStamp < this.states[0].timeStamp) return;

    let lowerBound = LowerBoundIndex(this.states, timeStamp, (a, b) => {
      return a.timeStamp >= b;
    });

    let stats = this.states[lowerBound].state.players[playerId];
    if (stats == undefined) return;

    this.applyTemporal(playerId, lowerBound + 1, stats, keys);
  }

  applyTemporalStats(playerId, timeStamp, stats) {
    // If keys are too old we ignore them
    if (this.states.length == 0 || timeStamp < this.states[0].timeStamp) return;

    let lowerBound = LowerBoundIndex(this.states, timeStamp, (a, b) => {
      return a.timeStamp >= b;
    });

    this.applyTemporal(playerId, lowerBound, stats, new Keys());
  }

  // Stats include x,y,speedX,speedY
  applyTemporal(playerId, initFrame, stats, keys) {
    let player = new Player(playerId, {}, stats);
    player.setLeftX(stats.x);
    player.setBottomY(stats.y);
    // NOTE: We do not use player's speed anymore.
    //player.stats.speedX = stats.speedX;
    //player.stats.speedY = stats.speedY;

    for (let frame = initFrame; frame < this.states.length; frame++) {
      if (this.states[frame].state.players[playerId] == undefined) break; // player does not exist in this frame
      if (this.states[frame].state.players[playerId].isDead) break;

      // optimization: if player is on the same position we break;
      let stats = this.states[frame].state.players[playerId];

      this.propagateStats(
        frame,
        player,
        frame == initFrame ? keys : new Keys()
      );

      // FIXME: Need to take keys into the consideration.
      if (
        stats.x == player.getLeftX() &&
        stats.y == player.getBottomY() &&
        stats.speedX == player.stats.speedX &&
        stats.speedY == player.stats.speedY
      )
        break;

      // Assign new player stats to the next frame!
      stats.x = player.getLeftX();
      stats.y = player.getBottomY();
      stats.speedX = player.stats.speedX;
      stats.speedY = player.stats.speedY;
    }
  }
}

export default TemporalPhysics;
export { TemporalState };
