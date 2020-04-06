import React, { Component } from "react";
import { Button } from "react-bootstrap";
import { clickSound1, mouseOverSound1 } from "./soundManager";

const buttonStyle = {
  position: "absolute",
  width: 350,
  height: 40,
  left: 450,
  top: 120,
  color: "#000000",
  borderRadius: 3,
  border: "solid 1px rgb(0, 0, 0)",
  fontFamily: "Arial",
  fontSize: "18px",
  textrAlign: "center",
  paddingTop: 4,
  boxShadow: "0px 0px 3px 0px rgba(106, 106, 106, 0.7)"
};

class RejoinButton extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    mouseOver: false
  };

  onClick() {
    this.props.soundManager.playSound(clickSound1, true, true);
    this.props.handleRejoin();
  }

  onMouseOver() {
    this.setState({ mouseOver: true });
    this.props.soundManager.playSound(mouseOverSound1, true, true);
  }

  onMouseLeave() {
    this.setState({ mouseOver: false });
  }

  render() {
    let bg = this.state.mouseOver ? "rgb(250, 187, 65)" : "rgb(113, 232, 249)";
    return this.props.canRejoin ? (
      <button
        style={{ ...buttonStyle, backgroundColor: bg }}
        onClick={this.onClick.bind(this)}
        onMouseEnter={this.onMouseOver.bind(this)}
        onMouseLeave={this.onMouseLeave.bind(this)}
      >
        JOIN LAST GAME
      </button>
    ) : (
      <div />
    );
  }
}

export default RejoinButton;
