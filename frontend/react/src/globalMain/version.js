import React, { Component } from "react";

const wrapperStyle = {
  position: "absolute",
  bottom: 5,
  left: "50%"
};

const versionStyle = {
  display: "inline-block",
  marginLeft: "-50%",
  textAlign: "center",
  fontSize: "12px",
  backgroundColor: "white",
  border: "solid 1px black",
  borderRadius: "3px",
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingTop: "3px",
  paddingBottom: "3px"
};

class Version extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div style={wrapperStyle}>
        <div style={versionStyle}>
          Version: "Overproduction quality". Tiny People Inc., All rights
          reversed.
        </div>
      </div>
    );
  }
}

export default Version;
