import React, { Component } from "react";
import {
  GetTime,
  GetRand,
  RandomString,
  GetHashFromString
} from "../game/gamePlay/utils";

class Star {
  constructor(id, bgStyle, liveTime, speed, x, y, onExpired) {
    this.id = id;
    this.creationTime = GetTime();
    this.lastTime = this.creationTime;
    this.x = x; // bottom left in %
    this.y = y; // in %
    this.speed = speed; // is in %
    this.bgStyle = bgStyle;
    this.liveTime = liveTime;
    this.onExpired = onExpired;
  }

  update() {
    if (this.expired) return;
    let newTime = GetTime();
    if (
      this.liveTime != 0 &&
      newTime - this.creationTime >= this.liveTime * 1000
    ) {
      this.expired = true;
      this.onExpired(this.id);
      return;
    }
    this.move(newTime - this.lastTime);
    this.lastTime = newTime;
  }

  move(elapsedTime) {
    this.x += (elapsedTime * this.speed) / 1000;
  }

  render() {
    let glowRadius = 10;
    // static stars are glowing
    if (this.speed == 0) {
      let phase = GetHashFromString(this.id) % 360;
      glowRadius = Math.floor(
        3 +
          Math.abs(
            7 * Math.sin(((phase + ((GetTime() / 100) % 360)) / 57.325) * 10)
          )
      );
    }
    return (
      <div
        key={this.id}
        style={{
          position: "absolute",
          width: 100,
          height: 100,
          backgroundColor: "white",
          ...this.bgStyle,
          left: Math.floor(this.x) + "%",
          top: Math.floor(this.y) + "%",
          borderRadius: "2px",
          boxShadow:
            "0 0 " + glowRadius + "px 3px " + this.bgStyle.backgroundColor
        }}
      />
    );
  }
}

class Stars extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.addStars();
    this.update();
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  update() {
    for (let key in this.state.stars) {
      this.state.stars[key].update();
    }
    this.setState({ stars: this.state.stars });
    this.timeout = setTimeout(this.update.bind(this), 100);
  }

  addStars() {
    for (let i = 0; i < 30; i++) this.addStar(true);
    for (let i = 0; i < 50; i++) this.addStar(true, true);
  }

  colors = [
    "rgb(246, 131, 102)",
    "rgb(93, 111, 254)",
    "rgb(182, 143, 254)",
    "rgb(158, 251, 139)",
    "rgb(241, 255, 152)",
    "rgb(254, 180, 143)",
    "rgb(170, 240, 255)",
    "rgb(255, 168, 223)"
  ];

  addStar(init, nomove) {
    let id = RandomString();
    let x = nomove ? GetRand(100) : init == true ? GetRand(70) : GetRand(5);
    let y = GetRand(100);
    let w = nomove ? GetRand(5) + 1 : GetRand(13) + 10;
    let h = nomove ? w : GetRand(7) + 1;
    let color = nomove ? "white" : this.colors[GetRand(this.colors.length)];

    let liveTime = nomove ? 0 : 5 + GetRand(31); // seconds
    let speed = nomove == true ? 0 : GetRand(9) + 2; // percent per second
    this.state.stars[id] = new Star(
      id,
      { width: w, height: h, backgroundColor: color },
      liveTime,
      speed,
      x,
      y,
      this.onExpired.bind(this)
    );
    this.setState({ stars: this.state.stars });
  }

  onExpired(id) {
    delete this.state.stars[id];
    this.addStar();
    this.setState({ stars: this.state.stars });
  }

  state = {
    stars: {}
  };

  renderStar(key) {
    return this.state.stars[key].render();
  }

  render() {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%"
        }}
      >
        {Object.keys(this.state.stars).map(key => this.renderStar(key))}
      </div>
    );
  }
}

export default Stars;
