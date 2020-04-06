import React, { Component } from "react";
import { Button } from "react-bootstrap";
import { clickSound1, mouseOverSound1 } from "./soundManager";

const buttonStyle = {
  position: "absolute",
  bottom: 20,
  left: 150,
  width: 100,
  height: 30,
  backgroundColor: "rgb(155, 213, 250)",
  color: "#000000",
  borderRadius: 3,
  border: "solid 1px rgb(0, 0, 0)",
  fontFamily: "Arial",
  fontSize: "18px",
  textAlign: "center",
  paddingTop: 2
};

function GetTheErrorMessage(txt, id) {
  if (txt == "name") {
    return "Please enter a player name.";
  }

  if (txt == "avatar") {
    return "Please select an avatar.";
  }

  if (txt == "join") {
    return "Please select a game to join.";
  }

  if (txt != "error" && txt != undefined) return txt;

  if (id == 0) {
    let d = new Date();
    let n = d.getDay();
    let day = "";

    switch (n) {
      case 0:
        day = "Sunday";
        break;
      case 1:
        day = "Moday";
        break;
      case 2:
        day = "Tuesday";
        break;
      case 3:
        day = "Wednesday";
        break;
      case 4:
        day = "Thursday";
        break;
      case 5:
        day = "Friday";
        break;
      case 6:
        day = "Friday";
        break;
      default:
        day = "Badday";
        break;
    }

    return "Something always goes wrong on " + day + "s. Try again tomorrow.";
  } else {
    return (
      <div>
        <p>Five second rule:</p>
        <p style={{ marginTop: -15 }}>wait for 5 seconds, and try again.</p>
      </div>
    );
  }
}

class MenuError extends Component {
  constructor(props) {
    super(props);
  }

  onClick() {
    this.props.soundManager.playSound(clickSound1, true, true);
    this.props.onDone();
  }

  onMouseOver() {
    this.props.soundManager.playSound(mouseOverSound1, true, true);
  }

  render() {
    return this.props.errorState.active ? (
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 150,
          top: "50%",
          left: "50%",
          marginTop: -200,
          marginLeft: -200,
          backgroundColor: "rgb(254, 214, 155)",
          borderRadius: 3,
          border: "solid 1px rgb(152, 3, 34)",
          boxShadow: "0px 0px 3px 0px rgba(106, 106, 106, 0.7)"
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 100,
            top: 22,
            left: 20,
            fontFamily: "Arial",
            fontSize: "18px",
            textAlign: "center",
            color: "rgb(9, 1, 69)"
          }}
        >
          {GetTheErrorMessage(
            this.props.errorState.value,
            this.props.errorState.id
          )}
        </div>
        <button
          style={buttonStyle}
          onClick={this.onClick.bind(this)}
          onMouseEnter={this.onMouseOver.bind(this)}
        >
          OK
        </button>
      </div>
    ) : (
      <div />
    );
  }
}

export default MenuError;
