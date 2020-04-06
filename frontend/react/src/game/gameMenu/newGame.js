import React, { Component } from "react";
import { GamePassword } from "./joinGame";
import { Cell } from "./heroes";
import { Option } from "./systemOptions";
import { clickSound1, mouseOverSound1 } from "./soundManager";
import { ShrinkString, menuBgComponentStyle } from "./../gamePlay/utils";
import { BuildInfoDescription } from "./description";

const newGameStyle = {
  position: "absolute",
  top: 40,
  left: 0,
  width: "100%",
  height: "100%",
  borderRadius: 3,
  overflow: "hidden",
  boxShadow: "0px 0px 3px 0 rgba(0, 0, 0, 0.7)",
  border: "1px solid black",
  ...menuBgComponentStyle
};

const startGameButtonStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 120,
  height: 65,
  top: 10,
  left: 220,
  boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.7)",
  border: "1px solid black"
};

const gameNameStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 200,
  height: 30,
  top: 10,
  left: 10,
  backgroundColor: "rgb(190, 247, 212)",
  paddingLeft: "7px",
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black",
  border: "0px solid"
};

const mapListStyle = {
  position: "absolute",
  top: 145,
  left: 10,
  backgroundColor: "rgb(190, 247, 212)",
  width: 330,
  height: 328,
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
};

const maxPlayersOptionBg = {
  2: "./options/maxplayers_option_logo_2.png",
  4: "./options/maxplayers_option_logo_4.png",
  8: "./options/maxplayers_option_logo_8.png"
};

const canWatchOptionBg = {
  0: "./options/can_watch_option_logo_0.png",
  1: "./options/can_watch_option_logo_1.png"
};
const randomPlayersOptionBg = {
  0: "./options/random_players_option_logo_0.png",
  1: "./options/random_players_option_logo_1.png"
};
const uniquePlayersOptionBg = {
  0: "./options/unique_players_option_logo_0.png",
  1: "./options/unique_players_option_logo_1.png"
};

const maxFragsOptionBg = {
  0: "./options/maxfrags_option_logo_0.png",
  20: "./options/maxfrags_option_logo_20.png",
  50: "./options/maxfrags_option_logo_50.png",
  100: "./options/maxfrags_option_logo_100.png"
};

const mapNames = {
  1: "HOME ALONE"
};

function mapOneDescription() {
  return (
    <div>
      You are home alone. Except that you are not. Everyone around wants to kill
      you. Your move Kevin. Standard free-for-all rules apply. Oh, and one more
      thing.. Toilet teleportation is totally a way of the future. Just don't
      get wet.
    </div>
  );
}

function mapTBDDescription() {
  return <div>NEW MAP IS COMING SOON.</div>;
}

const textboxStyle = {
  borderRadius: "2px",
  position: "relative",
  fontFamily: "Arial",
  fontSize: "14px",
  margin: "0 auto",
  width: "90%",
  backgroundColor: "rgb(190, 247, 212)",
  paddingLeft: "10px",
  paddingRight: "10px",
  paddingTop: "8px",
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
};

function getMapDescription(id) {
  if (id == "1") return mapOneDescription();
  return mapTBDDescription();
}

function buildMapDescription(id) {
  if (id != "1") return BuildInfoDescription(mapTBDDescription());
  return (
    <div>
      <div
        style={{
          position: "absolute",
          left: 75,
          top: 20,
          width: 200,
          height: 200,
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid black",
          boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
        }}
      >
        <img
          style={{
            position: "absolute",
            width: "100%",
            height: "auto"
          }}
          src={"./menu/map_" + id + "_logo.png"}
        />
      </div>
      <p
        style={{
          position: "relative",
          height: 30,
          margin: "0 auto",
          top: 225,
          textAlign: "center",
          fontFamily: "Arial Black",
          fontSize: "30px",
          fontWeight: "normal"
        }}
      >
        {mapNames[id]}
      </p>
      <div style={{ ...textboxStyle, top: 245, height: 407 }}>
        {getMapDescription(id)}
      </div>
    </div>
  );
}

class GameOptions extends Component {
  constructor(props) {
    super(props);
  }

  onMouseOver(name) {
    this.props.soundManager.playSound(mouseOverSound1, true, true);
    let extra = "";
    if (name == "maxPlayers") {
      extra = "Select maximum number of players per game.";
    } else if (name == "uniquePlayers") {
      extra =
        "Toggle selecting unique characters (no two players can share the same character).";
    } else if (name == "maxFrags") {
      extra = "Set the maximum number of frags to determine the winner.";
    } else if (name == "randomPlayers") {
      extra =
        "Toggle RANDOM GAME MODE. Characters are changed randomly every 60 seconds. Try it out, it is very fun.";
    } else {
      // if (name == "canWatch")
      extra = "Toggle if spectators are allowed for this game.";
    }
    this.props.describeMe({
      info: <div> Choose game options using this pane. {extra}</div>
    });
  }

  onMouseOut(name) {
    this.props.describeMe();
  }

  onClick(name) {
    this.props.soundManager.playSound(clickSound1, true, true);
    let copy = this.props.options;
    if (name == "maxPlayers") {
      let mx = copy.maxPlayers;
      if (mx == 8) mx = 2;
      else mx *= 2;
      copy.maxPlayers = mx;
    } else if (name == "canWatch") {
      copy.canWatch = !copy.canWatch;
    } else if (name == "randomPlayers") {
      copy.randomPlayers = !copy.randomPlayers;
    } else if (name == "uniquePlayers") {
      copy.uniquePlayers = !copy.uniquePlayers;
    } else if (name == "maxFrags") {
      let mx = copy.maxFrags;
      if (mx == 100) mx = 0;
      else if (mx == 0) mx = 20;
      else if (mx == 20) mx = 50;
      else if (mx == 50) mx = 100;
      copy.maxFrags = mx;
    }
    this.props.onNewGameOptions(copy);
  }

  render() {
    return (
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 85,
          width: 330,
          height: 50,
          backgroundColor: "rgb(251, 178, 92)",
          boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.7)",
          border: "1px solid black"
        }}
      >
        <Option
          name="maxPlayers"
          position={this.props.options.maxPlayers}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          moreStyle={{
            left: 15,
            backgroundColor: "rgb(255, 154, 232)",
            width: 60,
            height: 30
          }}
          bg={maxPlayersOptionBg}
        />
        <Option
          name="canWatch"
          position={this.props.options.canWatch ? 0 : 1}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          moreStyle={{
            left: 95,
            backgroundColor: "rgb(255, 154, 232)",
            width: 60,
            height: 30
          }}
          bg={canWatchOptionBg}
        />
        <Option
          name="randomPlayers"
          position={this.props.options.randomPlayers ? 1 : 0}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          moreStyle={{
            left: 175,
            backgroundColor: "rgb(255, 154, 232)",
            width: 60,
            height: 30
          }}
          bg={randomPlayersOptionBg}
        />
        <Option
          name="maxFrags"
          position={this.props.options.maxFrags}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          moreStyle={{
            left: 255,
            backgroundColor: "rgb(255, 154, 232)",
            width: 60,
            height: 30
          }}
          bg={maxFragsOptionBg}
        />
      </div>
    );
  }
}

class GameName extends Component {
  constructor(props) {
    super(props);
  }
  handleChange(event) {
    this.props.onNewGameName(event.target.value);
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit.bind(this)}>
          <input
            style={{ ...gameNameStyle }}
            type="text"
            name="gamename"
            placeholder="Game Name"
            onChange={this.handleChange.bind(this)}
            value={this.props.gameName}
          />
        </form>
      </div>
    );
  }
}

class NewGame extends Component {
  constructor(props) {
    super(props);
    this.activeSet = {};
    this.activeSet["1"] = true;

    this.cellLogos = {};
    this.cellLogos["1"] = { src: "./menu/map_1_logo.png" };
    this.cellLogos["2"] = { text: "" };
    this.cellLogos["3"] = { text: "" };
    this.cellLogos["4"] = { text: "" };
  }
  state = {
    id: 0,
    focus: false,
    password: "",
    gameName: "",
    focusCell: 0,
    selectedCell: 0
  };

  handleStart() {
    this.props.soundManager.playSound(clickSound1, true, true);
    this.props.onStart();
  }

  handleNewGameName(name) {
    name = ShrinkString(name, 100);
    this.setState({ gameName: name });
    this.props.onNewGameName(name);
  }

  handleNewPassword(password) {
    password = ShrinkString(password, 100);
    this.setState({ password: password });
    this.props.onNewPassword(password);
  }

  onMouseOverStartButton() {
    this.setState({ focus: true });
    this.props.soundManager.playSound(mouseOverSound1, true, true);
    this.props.describeMe({
      info: (
        <div> Start your own game. Pick a name and a hero first though. </div>
      )
    });
  }
  onMouseOutStartButton() {
    this.setState({ focus: false });
    this.props.describeMe();
  }

  onMouseOverCell(id) {
    if (this.activeSet[id]) this.setState({ focusCell: id });
    this.props.soundManager.playSound(mouseOverSound1, true, true);
    this.props.describeMe({ content: buildMapDescription(id) });
  }
  onMouseOutCell(id) {
    if (this.activeSet[id]) this.setState({ focusCell: 0 });
    this.props.describeMe();
  }
  onClickCell(id) {
    if (this.activeSet[id]) this.setState({ selectedCell: id });
    this.props.soundManager.playSound(clickSound1, true, true);
    this.props.selectMap(id);
  }

  render() {
    return (
      <div style={newGameStyle}>
        <GameName
          gameName={this.state.gameName}
          onNewGameName={this.handleNewGameName.bind(this)}
        />
        <GamePassword
          height={30}
          top={45}
          width={200}
          password={this.state.password}
          onNewPassword={this.handleNewPassword.bind(this)}
        />
        <button
          style={{
            ...startGameButtonStyle,
            backgroundColor: `${
              this.state.focus ? "rgb(251, 206, 119)" : "rgb(197, 249, 113)"
            }`
          }}
          onMouseEnter={this.onMouseOverStartButton.bind(this)}
          onMouseLeave={this.onMouseOutStartButton.bind(this)}
          onClick={this.handleStart.bind(this)}
        >
          START
        </button>
        <GameOptions
          options={this.props.gameOptions}
          onNewGameOptions={this.props.onNewGameOptions}
          describeMe={this.props.describeMe}
          soundManager={this.props.soundManager}
        />
        <div style={mapListStyle}>
          <div style={{ position: "absolute", left: 10, top: 10 }}>
            <Cell
              focus={this.state.focusCell}
              selected={this.state.selectedCell}
              activeSet={this.activeSet}
              onMouseOver={this.onMouseOverCell.bind(this)}
              onMouseOut={this.onMouseOutCell.bind(this)}
              onClick={this.onClickCell.bind(this)}
              cellLogos={this.cellLogos}
              id={"1"}
            />
          </div>
          <div style={{ position: "absolute", left: 100, top: 10 }}>
            <Cell
              focus={this.state.focusCell}
              selected={this.state.selectedCell}
              activeSet={this.activeSet}
              onMouseOver={this.onMouseOverCell.bind(this)}
              onMouseOut={this.onMouseOutCell.bind(this)}
              onClick={this.onClickCell.bind(this)}
              cellLogos={this.cellLogos}
              id={"2"}
            />
          </div>
          <div style={{ position: "absolute", left: 10, top: 100 }}>
            <Cell
              focus={this.state.focusCell}
              selected={this.state.selectedCell}
              activeSet={this.activeSet}
              onMouseOver={this.onMouseOverCell.bind(this)}
              onMouseOut={this.onMouseOutCell.bind(this)}
              onClick={this.onClickCell.bind(this)}
              cellLogos={this.cellLogos}
              id={"3"}
            />
          </div>
          <div style={{ position: "absolute", left: 100, top: 100 }}>
            <Cell
              focus={this.state.focusCell}
              selected={this.state.selectedCell}
              activeSet={this.activeSet}
              onMouseOver={this.onMouseOverCell.bind(this)}
              onMouseOut={this.onMouseOutCell.bind(this)}
              onClick={this.onClickCell.bind(this)}
              cellLogos={this.cellLogos}
              id={"4"}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default NewGame;
export { mapNames };
