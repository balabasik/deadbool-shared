import React, { Component } from "react";
import { clickSound1, mouseOverSound1 } from "./soundManager";

class Patreon extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    focus: false
  };

  onClick() {
    this.props.soundManager.playSound(clickSound1, true, true);
    window.location.href = "https://www.patreon.com/deadbool";
  }

  onMouseOver() {
    this.setState({ focus: true });
    this.props.soundManager.playSound(mouseOverSound1, true, true);
  }

  onMouseLeave() {
    this.setState({ focus: false });
  }

  render() {
    return (
      <div
        style={{
          position: "absolute",
          right: 20,
          bottom: 30,
          width: 250,
          height: 110,
          borderRadius: 5,
          border: "solid 1px rgb(0, 0, 0)",
          backgroundColor: "rgb(197, 249, 113)"
        }}
      >
        <div
          style={{
            position: "relative",
            left: 0,
            top: 13,
            textAlign: "center",
            fontWeight: "bold",
            width: "100%"
          }}
        >
          SUPPORT ON PATREON
        </div>
        <button
          style={{
            position: "absolute",
            width: 224,
            height: 50,
            borderRadius: 3,
            overflow: "hidden",
            left: 13,
            bottom: 10,
            border: "solid 1px rgb(0, 0, 0)",
            backgroundColor: this.state.focus
              ? "rgb(245, 255, 230)"
              : "rgb(255, 219, 126)"
          }}
          onClick={this.onClick.bind(this)}
          onMouseEnter={this.onMouseOver.bind(this)}
          onMouseLeave={this.onMouseLeave.bind(this)}
        >
          patreon.com/deadbool
        </button>
      </div>
    );
  }
}

export default Patreon;
