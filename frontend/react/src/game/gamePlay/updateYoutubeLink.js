import React, { Component } from "react";
import { clickSound1, mouseOverSound1 } from "./../gameMenu/soundManager";

const linkStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 260,
  height: 40,
  top: 90,
  left: 20,
  backgroundColor: "rgb(247, 231, 190)",
  opacity: 0.9,
  border: "1px solid",
  paddingLeft: "7px",
  boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.7)"
};

const submitStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 80,
  height: 40,
  top: 90,
  right: 23,
  border: "1px solid black",
  boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.7)"
};

class UpdateYoutubeLink extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    focusOnSubmit: false,
    linkUpdatedSuccessfully: false
  };

  handleChange(event) {
    this.props.onNewLink(event.target.value);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onNewLinkSubmitted(event.target.value);
    this.setState({ linkUpdatedSuccessfully: true });
  }

  onClickSubmit() {
    this.props.soundManager.playSound(clickSound1, true, true);
    this.props.onNewLinkSubmitted(this.props.link);
    this.setState({ linkUpdatedSuccessfully: true });
  }

  onMouseOverSubmit(name) {
    this.props.soundManager.playSound(mouseOverSound1, true, true);
    this.setState({ focusOnSubmit: true });
  }

  onMouseOutSubmit(name) {
    this.props.soundManager.playSound(mouseOverSound1, true, true);
    this.setState({ focusOnSubmit: false });
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit.bind(this)}>
          <input
            style={linkStyle}
            type="text"
            name="fakelink"
            placeholder={
              this.state.linkUpdatedSuccessfully
                ? "Link Updated!"
                : "Update Youtube Link Here"
            }
            onChange={this.handleChange.bind(this)}
            value={this.props.link}
            autoFocus
          />
        </form>
        <button
          style={{
            ...submitStyle,
            backgroundColor: `${
              this.state.focusOnSubmit
                ? "rgb(156, 183, 255)"
                : "rgb(249, 166, 90)"
            }`
          }}
          onMouseLeave={this.onMouseOutSubmit.bind(this)}
          onClick={this.onClickSubmit.bind(this)}
          onMouseEnter={this.onMouseOverSubmit.bind(this)}
        >
          SUBMIT
        </button>
      </div>
    );
  }
}

export default UpdateYoutubeLink;
