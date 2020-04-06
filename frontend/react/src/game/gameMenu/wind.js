import React, { Component } from "react";
import { GetTime, GetRand, RandomString } from "../gamePlay/utils";

const leafStyle = {
  position: "absolute"
};

const dummyStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  width: "100%",
  height: "100%"
};

const defaultScale = 0.3;
const extraScale = 1.3;

const frameWidth = 1400 * extraScale;
const frameHeight = 720 * extraScale;

const colorPaletteLeafs = [
  "./menu/leafs/leaf1_200.png",
  "./menu/leafs/leaf2_200.png",
  "./menu/leafs/leaf3_200.png",
  "./menu/leafs/leaf4_200.png",
  "./menu/leafs/leaf5_200.png",
  "./menu/leafs/leaf6_200.png",
  "./menu/leafs/leaf7_200.png",
  "./menu/leafs/leaf8_200.png",
  "./menu/leafs/leaf9_200.png",
  "./menu/leafs/leaf10_200.png"
];

const colorPalettePerks = [
  "./perks/perk_bitcoin.png",
  "./perks/perk_clubs.png",
  "./perks/perk_diamond.png",
  "./perks/perk_diamond1.png",
  "./perks/perk_heart.png",
  "./perks/perk_mac.png",
  "./perks/perk_medic.png",
  "./perks/perk_nutella.png",
  "./perks/perk_skull.png",
  "./perks/perk_smiley.png",
  "./perks/perk_spades.png",
  "./perks/perk_tp.png"
];

const bgColor = ["rgb(252, 240, 188)"];

const cardBg = "./perks/card_bg.png";

class Leaf {
  constructor(id, stats, bgStyle, liveTime, windPhysics) {
    this.id = id;
    this.creationTime = GetTime();
    this.lastTime = this.creationTime;
    this.weight = stats.weight;
    this.x = stats.x; // bottom left
    this.y = stats.y;
    this.z = stats.z; // 0: far, 1: close
    this.angle = stats.angle;
    this.speedX = stats.speedX; // positive is right
    this.speedY = stats.speedY; // positive is up
    this.rotSpeed = stats.rotSpeed;
    this.windPhysics = windPhysics;
    this.bgStyle = bgStyle;
    this.liveTime = liveTime;
    this.expired = false;
    this.fading = 0;
    this.src = stats.src;
    this.front = stats.front;
  }

  update() {
    if (this.expired) return;
    let newTime = GetTime();
    if (newTime - this.creationTime >= this.liveTime) {
      this.expired = true;
      return;
    } else if (newTime - this.creationTime >= this.liveTime - 500) {
      this.fading =
        Math.max(0, this.liveTime - newTime + this.creationTime) / 500;
    } else if (newTime - this.creationTime <= 500) {
      this.fading = Math.max(0, newTime - this.creationTime) / 500;
    } else {
      this.fading = 0.95;
    }

    this.windPhysics.process(this, newTime - this.lastTime);
    this.lastTime = newTime;
  }
}

class WindPhysics {
  constructor() {
    this.gravity = 0.0003;
    this.airFriction = 0.02;
    this.startTime = GetTime();
  }

  windSpeed(x, y, newTime, z) {
    let speedX = 0.1;
    let speedY = 0;
    return { speedX, speedY };

    let t = this.getPeriodicFrac(newTime);
    let tt = this.getFasterClock(newTime, z < 0.8 ? 1.5 : 2.5);
    let width = window.innerWidth;
    let height = window.innerHeight;

    // x = 0.4 y= a ; x = 0.6 y= b
    // y = a + (x-0.4) * (0.6 - 0.4)b
    let addx =
      tt < 0.4
        ? 0.05 + 0.2 * t
        : tt > 0.6
        ? -0.1
        : 0.05 + 0.2 * t + ((tt - 0.4) / 0.2) * -0.1;
    let zfactor = z < 0.9 ? -1 : 1;

    if (x < 0) speedX = -0.1;
    else if (x > width) speedX = 0.1;
    else {
      speedX = (((x - width / 2) / width / 3) * t + addx) * zfactor;
    }

    let rnd = Math.random();
    if (t < 0.2 && z < 0.8) speedX *= -50;

    if (y < 0) speedY = 1 * t;
    else if (y > height) speedY = -0.1 * t;
    else {
      speedY = ((height - y) / height / 3) * t;
    }
    return { speedX, speedY };
  }

  getPeriodicFrac(newTime) {
    let diff = newTime - this.startTime;
    let q = Math.floor(diff / 20000);
    let r = diff - 20000 * q;
    return r / 20000; // period of 20s
  }

  // original clock is 20 seconds
  getFasterClock(newTime, speedUp) {
    let t = this.getPeriodicFrac(newTime);
    return t * speedUp - Math.floor(t * speedUp);
  }

  getTurbulence(x, y, newTime, z) {
    let t = this.getFasterClock(newTime, z < 0.8 ? 3.5 : 4.3);
    let tt = this.getPeriodicFrac(newTime);
    return (
      (0.01 + 0.1 * tt) *
      (t < 0.4 ? 1 : t > 0.6 ? -1 : (0.5 - t) * 10) *
      (z < 0.5 ? 1 : -1) *
      (x < y ? 1 : -1)
    );
  }

  process(leaf, elapsedTime) {
    let newTime = leaf.lastTime + elapsedTime;

    let windSpeed = this.windSpeed(leaf.x, leaf.y, newTime, leaf.z);

    let turbulence = this.getTurbulence(leaf.x, leaf.y, newTime, leaf.z);
    leaf.x += elapsedTime * leaf.speedX * leaf.z; // further is slower
    leaf.y += elapsedTime * leaf.speedY * leaf.z;
    leaf.angle += elapsedTime * leaf.rotSpeed * leaf.z;
  }
}

class Wind extends Component {
  constructor(props) {
    super(props);
    this.windPhysics = new WindPhysics();
    this.lastUpdate = GetTime();
    this.initLeafs();
  }

  initLeafs() {
    for (let i = 0; i < colorPalettePerks.length; i++) {
      let leaf = this.createLeaf(true, "back", undefined, colorPalettePerks[i]);
      this.state.backLeafs[leaf.id] = leaf;
    }

    for (let i = 0; i < 3; i++) {
      let leaf = this.createLeaf(true, "back", undefined, cardBg);
      this.state.backLeafs[leaf.id] = leaf;
    }
  }

  componentDidMount() {
    this.update();
  }

  createLeaf(init, front, id, src) {
    // NOTE: Scaling will be taken care of by the parent
    let windowWidth = frameWidth;
    let windowHeight = frameHeight;

    if (id == undefined) id = RandomString();
    let x = 0;
    let y = 0;

    let speedX = 0;
    let speedY = 0;

    let width = 140;
    let height = width * 1.5;
    let weight = 0;
    let angle = (Math.random() - 0.5) * 45;
    let rotSpeed = (Math.random() - 0.5) / 5;

    if (
      src == "./perks/perk_mac.png" ||
      (src == cardBg && Math.random() < 0.5)
    ) {
      angle += 90;
    } else if (src == "./perks/perk_skull.png") {
      angle -= 90;
    }

    let frac = 0.1;
    x = 0.01 * windowWidth;
    if (init) {
      x += Math.random() * windowWidth * frac;
      if (Math.random() < 0.5) x = windowWidth - x - width;
      y = Math.random() * windowHeight;
    } else {
      x += Math.random() * windowWidth * frac;
      if (Math.random() < 0.5) x = windowWidth - x - width;
      y = -Math.random() * 0.3 * windowHeight + windowHeight; //Math.random() * windowHeight * 0.6;
    }

    let z = 0.8;
    speedX = 0;
    speedY = -0.1;

    let liveTime = Math.random() * 10000; // 3s
    if (src == undefined)
      src = colorPalettePerks[GetRand(colorPalettePerks.length)];

    return new Leaf(
      id,
      {
        x,
        y,
        z,
        weight,
        angle,
        speedX,
        speedY,
        rotSpeed,
        src: src,
        front: front
      },
      {
        ...leafStyle,
        width: width,
        height: height,
        backgroundColor: bgColor[Math.floor(Math.random() * bgColor.length)]
      },
      liveTime,
      this.windPhysics
    );
  }

  update() {
    this.updateInt("front");
    this.updateInt("middle");
    this.updateInt("back");
    let newUpdate = GetTime();
    this.timeout = setTimeout(
      this.update.bind(this),
      Math.min(40, 40 - (newUpdate - this.lastUpdate - 40))
    );
    this.lastUpdate = newUpdate;
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  updateInt(front) {
    let copy =
      front == "front"
        ? this.state.frontLeafs
        : front == "middle"
        ? this.state.middleLeafs
        : this.state.backLeafs;
    let toDelete = [];
    for (let key in copy) {
      copy[key].update();
      if (copy[key].expired) {
        copy[key] = this.createLeaf(
          false,
          copy[key].front,
          copy[key].id,
          copy[key].src
        );
      }
    }

    let toCreate = toDelete.length;
    for (let key of toDelete) delete copy[key];

    for (let i = 0; i < toCreate; i++) {
      let leaf = this.createLeaf(false, front);
      copy[leaf.id] = leaf;
    }

    if (front == "front") this.setState({ frontLeafs: copy });
    else if (front == "middle") this.setState({ middleLeafs: copy });
    else this.setState({ backLeafs: copy });
  }

  state = {
    frontLeafs: {},
    middleLeafs: {},
    backLeafs: {}
  };

  renderLeafs(leafs) {
    return (
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          overflow: "hidden"
        }}
      >
        {Object.keys(leafs).map(key => {
          let leaf = leafs[key];
          let transform = "rotate(" + Math.floor(leaf.angle) + "deg)";
          transform += " scale(" + leaf.z + ")";
          let blur = 2;

          let imgWidth = 90;
          let imgHeight = 60;
          let imgRot = 0;
          let dots = true;

          if (leaf.src == "./perks/perk_skull.png") {
            // skull img is shorter so we rotate it
            imgRot = 90;
            imgWidth = 90;
            imgHeight = 30;
          } else if (leaf.src == "./perks/perk_medic.png") {
            imgWidth = 80;
            imgHeight = 60;
          } else if (
            leaf.src == "./perks/perk_bitcoin.png" ||
            leaf.src == "./perks/perk_diamond.png"
          ) {
            imgWidth = 75;
            imgHeight = 50;
          } else if (leaf.src == cardBg) {
            // background card
            imgWidth = 100;
            imgHeight = 100;
            dots = false;
          }

          let imgTop = (100 - imgHeight) / 2;
          let imgLeft = (100 - imgWidth) / 2;

          return (
            <div
              style={{
                ...leaf.bgStyle,
                left: Math.floor(leaf.x),
                bottom: Math.floor(leaf.y),
                transform: transform,
                opacity: leaf.fading,
                filter: "blur(" + blur + "px)",
                borderRadius: "10px",
                border: "3px solid black",
                overflow: "hidden"
              }}
            >
              <img
                key={key}
                src={leaf.src}
                style={{
                  position: "absolute",
                  width: imgWidth + "%",
                  left: imgLeft + "%",
                  height: imgHeight + "%",
                  top: imgTop + "%",
                  transform: "rotate(" + imgRot + "deg)"
                }}
              />
              {dots ? (
                <div
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    backgroundColor: "rgb(50, 37, 82)",
                    top: "10px",
                    left: "10px"
                  }}
                />
              ) : (
                <div />
              )}
              {dots ? (
                <div
                  style={{
                    position: "absolute",
                    width: "20px",
                    height: "20px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    backgroundColor: "rgb(50, 37, 82)",
                    bottom: "10px",
                    right: "10px"
                  }}
                />
              ) : (
                <div />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  render() {
    return (
      <div style={dummyStyle}>
        <div style={dummyStyle}>{this.renderLeafs(this.state.backLeafs)}</div>
        <div style={dummyStyle}>{this.renderLeafs(this.state.middleLeafs)}</div>
        <div style={dummyStyle}>{this.renderLeafs(this.state.frontLeafs)}</div>
      </div>
    );
  }
}

export default Wind;
