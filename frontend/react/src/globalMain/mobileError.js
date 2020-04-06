import React, { Component } from "react";

class MobileError extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgb(19, 5, 23)"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: "100%",
            height: "100%",
            textAlign: "center",
            marginTop: "-25px",
            paddingLeft: "20px",
            paddingRight: "20px"
          }}
        >
          <div
            style={{
              color: "rgb(255, 224, 143)",
              fontSize: "20px",
              fontFamily: "Arial Black"
            }}
          >
            DEADBOOL ARENA
          </div>
          <div
            style={{
              color: "rgb(148, 229, 255)",
              fontSize: "20px",
              fontWeight: "bold"
            }}
          >
            Desktop only. Coming to mobile in 2020.
          </div>
        </div>
      </div>
    );
  }
}

export default MobileError;
