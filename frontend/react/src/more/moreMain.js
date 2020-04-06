import React, { Component } from "react";
import GameButton from "./gameButton";
import Version from "./../globalMain/version";
import About from "./about";
import Support from "./support";
import Contact from "./contact";
import Stars from "./stars";
import SoundManager, {
  clickSound1,
  mouseOverSound1
} from "../game/gameMenu/soundManager";

const pageStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
  backgroundColor: "black"
};

const innerStyle = {
  position: "relative",
  width: "1250px",
  height: "800px",
  top: 70,
  margin: "0 auto",
  border: "solid 1px black",
  borderRadius: 3,
  overflow: "hidden",
  boxShadow: "0 0 2px 1px white, inset 0px 0px 0px 35px rgb(111, 111, 111)"
};

const defaultScale = 0.3;
const extraScale = 1.3;

const frameWidth = 1400 * extraScale;
const frameHeight = 720 * extraScale;

function getScale(winW, winH) {
  return Math.max(
    defaultScale,
    Math.min(winW / frameWidth, winH / frameHeight)
  );
}

function getLeft(winW, winH) {
  // When you scale window still thinks of the div as of original size, so we need to compensate for that.
  return (
    (winW - frameWidth * getScale(winW, winH)) / 2 -
    (frameWidth * (1 - getScale(winW, winH))) / 2
  );
}

function getBottom(winW, winH) {
  return (
    (winH - frameHeight * getScale(winW, winH)) / 2 -
    (frameHeight * (1 - getScale(winW, winH))) / 2
  );
}

class MoreMain extends Component {
  constructor(props) {
    super(props);

    let w = window.innerWidth;
    let h = window.innerHeight;
    this.state.windowScale = getScale(w, h);
    this.state.windowLeft = getLeft(w, h);
    this.state.windowBottom = getBottom(w, h);

    this.soundManager = new SoundManager();
  }

  state = { windowScale: 1, windowLeft: 0, windowBottom: 0 };

  updateDimensions(event) {
    let w = window.innerWidth;
    let h = window.innerHeight;
    this.setState({
      windowScale: getScale(w, h),
      windowLeft: getLeft(w, h),
      windowBottom: getBottom(w, h)
    });
  }

  componentDidMount() {
    window.addEventListener("resize", event => {
      this.updateDimensions();
    });
    this.soundManager.playSound(
      "/sounds/planet_sakaar.mp3",
      true,
      true,
      "music",
      true
    );
  }

  componentWillUnmount() {
    window.removeEventListener("resize", event => {
      this.updateDimensions();
    });
    this.soundManager.forceStopAll();
  }

  gotoGame() {
    this.soundManager.forceStopAll();
    this.props.gotoGame();
  }

  render() {
    return (
      <div style={pageStyle}>
        <div
          style={{
            position: "absolute",
            backgroundColor: "rgb(27, 28, 27)",
            width: frameWidth,
            height: frameHeight,
            transform: "scale(" + this.state.windowScale + ")",
            left: this.state.windowLeft,
            bottom: this.state.windowBottom,
            overflow: "hidden"
          }}
        >
          <Stars />
          <div style={innerStyle}>
            <About />
            <Support />
            <Contact />
            <div
              style={{
                position: "absolute",
                top: "2px",
                width: "100%",
                height: 80,
                color: "rgb(251, 242, 118)",
                fontSize: "30px",
                fontWeight: "bold",
                fontFamily: "Bazar",
                letterSpacing: "10px",
                textAlign: "center",
                overflow: "hidden",
                textShadow: "0px 0px 2px black, 0px 0px 3px rgb(252, 244, 170)"
              }}
            >
              ★★★ ABOUT ★★★
            </div>
            <div
              style={{
                position: "absolute",
                width: 550,
                top: 560,
                left: 650,
                textAlign: "center",
                fontFamily: "Bazar",
                fontSize: "23px",
                color: "rgb(251, 242, 118)",
                fontWeight: "bold",
                textShadow: "0px 0px 2px black, 0px 0px 3px rgb(252, 244, 170)"
              }}
            >
              CONTACT
            </div>
            <div
              style={{
                position: "absolute",
                width: 550,
                top: 560,
                left: 50,
                textAlign: "center",
                fontFamily: "Bazar",
                fontSize: "23px",
                color: "rgb(251, 242, 118)",
                fontWeight: "bold",
                textShadow: "0px 0px 2px black, 0px 0px 3px rgb(252, 244, 170)"
              }}
            >
              SUPPORT
            </div>
          </div>
          <GameButton
            gotoGame={this.gotoGame.bind(this)}
            soundManager={this.soundManager}
          />
          <Version />
        </div>
      </div>
    );
  }
}

export default MoreMain;
