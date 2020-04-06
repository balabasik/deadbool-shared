import React, { Component } from "react";

const supportStyle = {
  position: "absolute",
  borderRadius: 3,
  height: 150,
  width: 550,
  top: 600,
  left: 50,
  border: "1px solid black",
  backgroundColor: "rgba(20, 22, 42, 0.58)",
  overflow: "hidden",
  boxShadow:
    "inset 1px 1px 2px 0 white, inset -1px -1px 2px 0 white,0px 0px 0px 35px rgb(111, 111, 111)"
};

class Support extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div style={supportStyle}>
        <div
          style={{
            position: "relative",
            top: 15,
            paddingTop: 7,
            width: "90%",
            left: "5%",
            textAlign: "center",
            fontFamily: "Arial",
            fontSize: "18px",
            color: "rgb(129, 183, 246)"
          }}
        >
          <p>
            Developer? Artist? Like-minded? Any form of support is appreciated!
          </p>
          <p
            style={{
              fontWeight: "bold",
              fontSize: "20px",
              color: "rgb(252, 181, 43)"
            }}
          >
            deadbool.arena@gmail.com
          </p>
        </div>
      </div>
    );
  }
}

export default Support;
