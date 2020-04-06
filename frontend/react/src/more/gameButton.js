import React, { Component } from "react";
import { Button } from "react-bootstrap";
import { clickSound1, mouseOverSound1 } from "../game/gameMenu/soundManager";
const buttonStyle = {
  position: "absolute",
  top: 20,
  left: 20,
  width: 100,
  height: 50,
  color: "#000000",
  borderRadius: 3,
  border: "solid 1px rgb(0, 0, 0)",
  fontFamily: "Arial",
  fontSize: "18px",
  textrAlign: "center",
  paddingTop: 5,
  boxShadow: "0px 0px 3px 0px rgba(106, 106, 106, 0.7)"
};

class GameButton extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    mouseOver: false
  };

  onClick() {
    this.props.soundManager.playSound(clickSound1, true, true);
    this.props.gotoGame();
  }

  onMouseOver() {
    this.setState({ mouseOver: true });
    this.props.soundManager.playSound(mouseOverSound1, true, true);
  }

  onMouseLeave() {
    this.setState({ mouseOver: false });
  }

  render() {
    let bg = this.state.mouseOver ? "rgb(250, 187, 65)" : "rgb(197, 249, 113)";
    return (
      <button
        style={{ ...buttonStyle, backgroundColor: bg }}
        onClick={this.onClick.bind(this)}
        onMouseEnter={this.onMouseOver.bind(this)}
        onMouseLeave={this.onMouseLeave.bind(this)}
      >
        GAME
      </button>
    );
  }
}

export default GameButton;
