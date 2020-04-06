import React, { Component } from "react";
import { clickSound1, mouseOverSound1 } from "./soundManager";
import {
  operatorIp,
  use_ssl,
  ShrinkString,
  menuBgComponentStyle
} from "./../gamePlay/utils";

const playerStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 350,
  height: 130,
  top: 50,
  left: 50,
  overflow: "hidden",
  border: "1px solid black",
  boxShadow: "0px 0px 3px 0 rgba(0, 0, 0, 0.7)",
  ...menuBgComponentStyle
};

const nameFormStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 200,
  height: 50,
  top: 10,
  left: 10,
  backgroundColor: "rgb(190, 247, 212)",
  opacity: 0.9,
  border: "0px solid",
  paddingLeft: "7px",
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
};

const linkStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 330,
  height: 50,
  top: 10 + 50 + 10,
  left: 10,
  backgroundColor: "rgb(190, 247, 212)",
  opacity: 0.9,
  border: "0px solid",
  paddingLeft: "7px",
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
};

const autoNicknameStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 100,
  height: 50,
  top: 10,
  left: 230,
  border: "1px solid black",
  boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.7)"
};

function SanitizeWord(word) {
  return word.replace(/[.,:;()<>?]/g, "");
}

function CapitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function SanitizeRandomName(name) {
  let words = name.split(" ");
  let maxSize = Math.min(3, words.length);
  let ret = "";
  for (let i = 0; i < maxSize; i++)
    ret += CapitalizeFirstLetter(SanitizeWord(words[i]).toLowerCase());

  return ret;
}

function getRandomName(cb) {
  fetch(
    "https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*",
    { mode: "cors" }
  )
    .then(response => response.json())
    .then(data => {
      // TODO: May need to take care of unmounted case
      //if (!this.mounted) return;
      let name = SanitizeRandomName(data.query.random[0].title);
      cb(name);
    })
    .catch(error => {
      cb("random");
    });
}

function getRandomLink(cb, propsOperatorIp) {
  // TODO: Remove the port and cors. Let express wrapper to pipe the requests where they have to go.
  fetch(
    (use_ssl ? "https://" : "http://") +
      propsOperatorIp +
      ":8000/random_youtube_link",
    { mode: "cors" }
  )
    .then(response => response.json())
    .then(data => {
      //TODO: May need to take care of unmounted case
      //if (!this.mounted) return;
      if (data == undefined || data.link == undefined || data.link == "")
        cb("random");
      else cb(data.link);
    })
    .catch(error => {
      cb("random");
    });
}

class NickName extends Component {
  constructor(props) {
    super(props);
  }
  handleChange(event) {
    this.props.onNewName(event.target.value);
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit.bind(this)}>
          <input
            style={nameFormStyle}
            type="text"
            name="fakeusername"
            placeholder="Nickname"
            onChange={this.handleChange.bind(this)}
            value={this.props.name}
          />
        </form>
      </div>
    );
  }
}

class YoutubeLink extends Component {
  constructor(props) {
    super(props);
  }
  handleChange(event) {
    this.props.onNewLink(event.target.value);
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.props.onNewLinkSubmitted != undefined)
      this.props.onNewLinkSubmitted(event.target.value);
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit.bind(this)}>
          <input
            style={linkStyle}
            type="text"
            name="fakelink"
            placeholder="Favorite Youtube Link (OPTIONAL)"
            onChange={this.handleChange.bind(this)}
            value={this.props.link}
          />
        </form>
      </div>
    );
  }
}

class PlayerInfo extends Component {
  constructor(props) {
    super(props);
    this.active = true;
  }
  state = {
    id: 0,
    playerInfo: { playerName: "", playerLink: "" },
    focusOnAuto: false
  };
  componentWillUnmount() {
    this.active = false;
  }

  onNameUpdate(name) {
    name = ShrinkString(name, 20);
    var newInfo = this.state.playerInfo;
    newInfo["playerName"] = name;
    this.setState({ playerInfo: newInfo });
    if (this.active) this.props.onUpdate(this.state.playerInfo);
  }

  onLinkUpdate(name) {
    name = ShrinkString(name, 100);
    var newInfo = this.state.playerInfo;
    newInfo["playerLink"] = name;
    this.setState({ playerInfo: newInfo });
    if (this.active) this.props.onUpdate(this.state.playerInfo);
  }

  autoGenerate() {
    this.props.soundManager.playSound(clickSound1, true, true);
    getRandomName(this.onNameUpdate.bind(this));
    getRandomLink(this.onLinkUpdate.bind(this), this.props.operatorIp);
  }

  onMouseOverRandom() {
    this.props.soundManager.playSound(mouseOverSound1, true, true);
    this.setState({ focusOnAuto: true });
    if (this.active)
      this.props.describeMe({
        info: (
          <div>
            Want a unique and original name? Press this button. Struggling which
            youtube link to choose? Let chance decide. Your call. No regrets.
          </div>
        )
      });
  }

  onMouseOutRandom() {
    this.setState({ focusOnAuto: false });
    if (this.active) this.props.describeMe();
  }

  render() {
    return (
      <div style={playerStyle}>
        <NickName
          name={this.state.playerInfo.playerName}
          onNewName={this.onNameUpdate.bind(this)}
        />
        <YoutubeLink
          link={this.state.playerInfo.playerLink}
          onNewLink={this.onLinkUpdate.bind(this)}
        />
        <button
          style={{
            ...autoNicknameStyle,
            backgroundColor: `${
              this.state.focusOnAuto ? "rgb(249, 90, 142)" : "rgb(207, 90, 249)"
            }`
          }}
          onMouseLeave={this.onMouseOutRandom.bind(this)}
          onClick={this.autoGenerate.bind(this)}
          onMouseEnter={this.onMouseOverRandom.bind(this)}
        >
          RANDOM
        </button>
      </div>
    );
  }
}

export default PlayerInfo;
