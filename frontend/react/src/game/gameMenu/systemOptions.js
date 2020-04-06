import React, { Component } from "react";
import { clickSound1, mouseOverSound1 } from "./soundManager";
import { RandomUniqueString, menuBgComponentStyle } from "../gamePlay/utils";

const systemStyle = {
  position: "absolute",
  width: 350,
  height: 60,
  left: 450,
  top: 270,
  borderRadius: 3,
  textAlign: "center",
  overflow: "hidden",
  border: "1px solid black",
  boxShadow: "0px 0px 3px 0 rgba(0, 0, 0, 0.7)",
  ...menuBgComponentStyle
};

const optionStyle = {
  position: "absolute",
  width: 75,
  height: 40,
  borderRadius: 2,
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  top: 10,
  display: "flex",
  overflow: "hidden",
  boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.7)",
  border: "1px solid black"
};

const soundOptionBg = {
  0: "./options/sound_off_option_logo.png",
  1: "./options/sound_on_option_logo.png"
};
const dynamicOptionBg = {
  0: "./options/dynamic_off_option_logo.png",
  1: "./options/dynamic_on_option_logo.png"
};
const musicOptionBg = {
  0: "./options/music_off_option_logo.png",
  1: "./options/music_on_option_logo.png"
};
const invertColorsOptionBg = {
  0: "./options/invert_colors_option_logo.png",
  1: "./options/invert_colors_option_logo.png"
};

class Option extends Component {
  constructor(props) {
    super(props);
  }

  onMouseOver() {
    this.props.onMouseOver(this.props.name);
  }
  onMouseOut() {
    this.props.onMouseOut(this.props.name);
  }
  onClick() {
    this.props.onClick(this.props.name);
  }

  render() {
    return (
      <button
        style={{
          ...optionStyle,
          ...this.props.moreStyle
        }}
        onMouseEnter={this.onMouseOver.bind(this)}
        onMouseLeave={this.onMouseOut.bind(this)}
        onClick={this.onClick.bind(this)}
      >
        <img
          src={this.props.bg[this.props.position]}
          style={{
            position: "relative",
            margin: "0 auto",
            width: "100%",
            height: "auto"
          }}
        />
      </button>
    );
  }
}

class SystemOptions extends Component {
  constructor(props) {
    super(props);
  }

  onMouseOver(name) {
    this.props.soundManager.playSound(mouseOverSound1, true, true);
    let extra = "";
    if (name == "sound") {
      extra = "Toggle all the sounds on/off.";
    } else if (name == "music") {
      extra = "Toggle the game music on/off.";
    } else if (name == "dynamic") {
      extra = "Enable/disable dynamic UI elements (for slower browsers).";
    } else {
      //if (name == "invert") {
      extra = "Invert game colors.";
    }
    this.props.describeMe({
      info: <div>Control system properties using this pane. {extra}</div>
    });
  }

  onMouseOut(name) {
    this.props.describeMe();
  }

  onClick(name) {
    this.props.soundManager.playSound(clickSound1, true, true);
    if (name == "dynamic") {
      this.props.options.dynamicActive ^= 1;
      this.props.onOptionsChanged(this.props.options);
    } else if (name == "sound") {
      this.props.options.sound ^= 1;
      this.props.onOptionsChanged(this.props.options);
    } else if (name == "music") {
      this.props.options.music ^= 1;
      this.props.onOptionsChanged(this.props.options);
    } else if (name == "invert") {
      this.props.options.invertColors ^= 1;
      this.props.onOptionsChanged(this.props.options);
    }
  }

  render() {
    return (
      <div style={{ ...systemStyle, ...this.props.extraStyle }}>
        <Option
          name="sound"
          position={this.props.options.sound ? 1 : 0}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          moreStyle={{ left: 10, backgroundColor: "rgb(255, 154, 232)" }}
          bg={soundOptionBg}
        />
        <Option
          name="dynamic"
          position={this.props.options.dynamicActive ? 1 : 0}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          moreStyle={{ left: 95, backgroundColor: "rgb(255, 154, 232)" }}
          bg={dynamicOptionBg}
        />
        <Option
          name="music"
          position={this.props.options.music ? 1 : 0}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          moreStyle={{ left: 180, backgroundColor: "rgb(255, 154, 232)" }}
          bg={musicOptionBg}
        />
        <Option
          name="invert"
          position={this.props.options.invertColors ? 1 : 0}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          moreStyle={{ left: 265, backgroundColor: "rgb(255, 154, 232)" }}
          bg={invertColorsOptionBg}
        />
      </div>
    );
  }
}

export default SystemOptions;
export { Option };
