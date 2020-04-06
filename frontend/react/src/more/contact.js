import React, { Component } from "react";

const contactStyle = {
  position: "absolute",
  borderRadius: 3,
  height: 150,
  width: 550,
  top: 600,
  left: 650,
  border: "1px solid black",
  backgroundColor: "rgba(20, 22, 42, 0.58)",
  overflow: "hidden",
  boxShadow:
    "inset 1px 1px 2px 0 white, inset -1px -1px 2px 0 white,0px 0px 0px 30px rgb(111, 111, 111)"
};

class Contact extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div style={contactStyle}>
        <div
          style={{
            top: 30,
            position: "relative",
            width: "90%",
            left: "5%",
            textAlign: "center",
            fontFamily: "Arial",
            fontSize: "18px",
            color: "rgb(246, 213, 129)"
          }}
        >
          <p>Questions? Any better, suggestions? Don't hesitate to share!</p>
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

export default Contact;
