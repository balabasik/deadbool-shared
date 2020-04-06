import React, { Component } from "react";
import { Button } from "react-bootstrap";

const buttonStyle = {
  position: "absolute",
  width: 200,
  height: 50,
  backgroundColor: "#CCCCAA",
  color: "#CCAA00",
  borderRadius: 3
};

class WindowButtons extends Component {
  render() {
    return (
      <button
        style={{ ...buttonStyle, left: this.props.left, top: this.props.top }}
      >
        Window Buttons!
      </button>
    );
  }
}

export default WindowButtons;
