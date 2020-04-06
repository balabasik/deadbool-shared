import React, { Component } from "react";

const loadingStyle = {
  width: "100%",
  height: "100%",
  position: "absolute",
  left: 0,
  top: 0,
  backgroundColor: "black"
};

const loadingInnerStyle = {
  position: "absolute",
  width: 100,
  height: 50,
  top: "50%",
  left: "50%",
  marginLeft: "-50px",
  marginTop: "-25px",
  textAlign: "center",
  color: "white"
};

class Loading extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div style={loadingStyle}>
        <div style={loadingInnerStyle}>LOADING</div>
      </div>
    );
  }
}

export default Loading;
