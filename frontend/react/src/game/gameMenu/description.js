import React, { Component } from "react";
import { menuBgComponentStyle } from "../gamePlay/utils";

const innerRadius = 3;

const deStyle = {
  position: "absolute",
  borderRadius: innerRadius,
  height: 700,
  width: 350,
  top: 50,
  right: 50,
  boxShadow: "0px 0px 3px 0 rgba(0, 0, 0, 0.7)",
  border: "1px solid black",
  overflow: "hidden",
  ...menuBgComponentStyle
};

const textboxStyle = {
  borderRadius: "2px",
  position: "relative",
  fontFamily: "Arial",
  fontSize: "14px",
  margin: "0 auto",
  width: "90%",
  backgroundColor: "rgb(190, 247, 212)",
  paddingLeft: "10px",
  paddingRight: "10px",
  paddingTop: "8px",
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
};

const descriptionHeader = (
  <div style={{ position: "relative", top: 10 }}>
    <div
      style={{
        position: "relative",
        top: "10px",
        fontFamily: "Arial Black",
        fontSize: "30px",
        textAlign: "center",
        color: "rgb(249, 162, 99)",
        textShadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black",
        fontWeight: "normal"
      }}
    >
      INFORMATION
    </div>
  </div>
);

function BuildInfoDescription(text) {
  return (
    <div>
      {descriptionHeader}
      <div style={{ ...textboxStyle, top: 35, height: 602 }}>{text}</div>
    </div>
  );
}

function defaultDescription(parent) {
  return (
    <div style={{ position: "relative", top: 10 }}>
      <div
        style={{
          position: "relative",
          top: "4px",
          fontFamily: "Arial Black",
          fontSize: "20px",
          textAlign: "center",
          color: "rgb(81, 149, 252)",
          textShadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black",
          fontWeight: "normal"
        }}
      >
        WELCOME TO
      </div>
      <div
        style={{
          position: "relative",
          fontFamily: "Arial Black",
          fontSize: "30px",
          top: "1px",
          textAlign: "center",
          color: "rgb(255, 77, 77)",
          textShadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black"
        }}
      >
        DEADBOOL ARENA
      </div>
      <div
        style={{
          position: "relative",
          fontFamily: "Arial Black",
          fontSize: "15px",
          top: "3px",
          textAlign: "center",
          color: "rgb(238, 245, 113)",
          textShadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black"
        }}
      >
        100% FUN 100% FREE
      </div>
      <div style={{ ...textboxStyle, top: 20, height: 120 }}>
        Deadbool Arena is undeniably a better version of any game you have ever
        played. More dimensions than Fortnite. More champions than League of
        Legends. Advanced graphics as close to the real life as it could
        possibly be.
      </div>
      <div style={{ ...textboxStyle, top: 35, height: 120 }}>
        Read the rules. Or don't. Win trying or lose dying. Deadbool world is
        that simple. Stop meaningless existential search and conquer the magic
        world of tiny people with massive guns and powerful spells! Dead. Bool.
        Repeat.
      </div>
      <div
        style={{
          ...textboxStyle,
          backgroundColor: "rgb(197, 249, 113)",
          top: 50,
          height: 285
        }}
      >
        <img
          src="./menu/controls_full.png"
          style={{
            position: "relative",
            top: -5,
            width: "100%",
            height: "100%"
          }}
        />
      </div>
    </div>
  );
}

class Description extends Component {
  render() {
    return (
      <div id="description" style={deStyle}>
        {this.props.content}
      </div>
    );
  }
}

export default Description;
export { defaultDescription, descriptionHeader, BuildInfoDescription };
