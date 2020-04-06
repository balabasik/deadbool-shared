import React, { Component } from "react";
import { defaultAvailableHeroesList } from "./menu";
import { mapNames } from "./newGame";
import { clickSound1, mouseOverSound1 } from "./soundManager";
import {
  use_ssl,
  ShrinkString,
  operatorIp,
  menuBgComponentStyle,
  GetTime
} from "./../gamePlay/utils";

const joinGameStyle = {
  position: "absolute",
  top: 40,
  left: 0,
  width: "100%",
  height: "100%",
  borderRadius: 3,
  overflow: "hidden",
  border: "1px solid black",
  boxShadow: "0px 0px 3px 0 rgba(0, 0, 0, 0.7)",
  ...menuBgComponentStyle
};

const joinGameButtonStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 72,
  height: 40,
  top: 10,
  left: 200,
  backgroundColor: "rgb(197, 249, 113)",
  boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.7)",
  border: "1px solid black"
};

const watchGameButtonStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 60,
  height: 40,
  top: 10,
  left: 280,
  backgroundColor: "rgb(197, 249, 113)",
  boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.7)",
  border: "1px solid black"
};

const refreshButtonStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 100,
  height: 30,
  top: 10,
  left: 220,
  border: "1px solid black"
};

const filterStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 200,
  height: 30,
  top: 10,
  left: 10,
  paddingLeft: "7px",
  border: "0px solid",
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
};

const recordStyle = {
  position: "relative",
  width: 310,
  height: 40,
  left: 10,
  marginTop: "5px"
};

const passwordStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 200,
  height: 50,
  top: 10,
  left: 10,
  paddingLeft: "7px",
  border: "0px solid",
  backgroundColor: "rgb(190, 247, 212)",
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
};

const gameListStyle = {
  position: "absolute",
  width: 330,
  height: 308,
  top: 70,
  left: 0,
  overflowY: "auto" // allow scroll bar
};

const gameListContainerStyle = {
  position: "absolute",
  width: 330,
  height: 413,
  top: 60,
  left: 10,
  backgroundColor: "rgb(190, 247, 212)",
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
};

const newJoinSwitchStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 350,
  height: 30,
  top: 0,
  left: 0,
  backgroundColor: "rgb(151, 35, 193)",
  border: "1px solid black",
  boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.7)"
};

const RecordHeader = (
  <div
    style={{
      position: "relative",
      left: 10,
      top: 48,
      height: 20,
      width: 310,
      backgroundColor: "rgb(141, 193, 246)",
      border: "1px solid black"
    }}
  >
    <div
      style={{
        position: "absolute",
        width: 15,
        left: 5,
        textAlign: "center",
        fontSize: "12px"
      }}
    >
      H
    </div>
    <div
      style={{
        position: "absolute",
        width: 130,
        left: 5 + 15,
        overflow: "hidden",
        textAlign: "center",
        fontSize: "12px"
      }}
    >
      Game name
    </div>
    <div
      style={{
        position: "absolute",
        width: 60,
        left: 138 + 15,
        overflow: "hidden",
        textAlign: "center",
        fontSize: "12px"
      }}
    >
      Players
    </div>
    <div
      style={{
        position: "absolute",
        width: 60 - 15,
        left: 205 + 15,
        height: "80%",
        overflow: "hidden",
        textAlign: "center",
        fontSize: "12px"
      }}
    >
      Watch
    </div>
    <div
      style={{
        position: "absolute",
        width: 35,
        left: 268,
        overflow: "hidden",
        textAlign: "center",
        fontSize: "12px"
      }}
    >
      Pass
    </div>
  </div>
);

class RecordFooter extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div
        style={{
          position: "relative",
          left: 10,
          top: 365,
          height: 20,
          width: 310,
          backgroundColor: "rgb(141, 193, 246)",
          border: "1px solid black"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 40,
            overflow: "hidden",
            fontSize: "12px"
          }}
        >
          Total games: {this.props.totalGames}
        </div>
        <div
          style={{
            position: "absolute",
            left: 168,
            overflow: "hidden",
            fontSize: "12px"
          }}
        >
          Total players: {this.props.totalPlayers}
        </div>
      </div>
    );
  }
}

function GetLagDiv(hostInfo) {
  let lag = hostInfo == undefined ? undefined : hostInfo.hostLag;
  let color =
    lag == undefined || lag < 70
      ? "rgb(36, 218, 0)"
      : lag < 120
      ? "rgb(254, 229, 65)"
      : "rgb(255, 20, 20)";
  let ratio =
    lag == undefined || lag < 50
      ? 20
      : lag > 150
      ? 100
      : Math.floor(20 + (lag - 50) / 1.25);
  let inverseRatio = 120 - ratio;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100%",
        height: inverseRatio + "%",
        backgroundColor: color
      }}
    />
  );
}

class GameRecord extends Component {
  constructor(props) {
    super(props);
  }

  onMouseOver() {
    this.props.onMouseOver(this.props.gameHash);
  }
  onMouseOut() {
    this.props.onMouseOut(this.props.gameHash);
  }
  onClick() {
    this.props.onClick(this.props.gameHash);
  }

  state = {};

  getBgColor() {
    return this.props.selectedHash == this.props.gameHash
      ? "rgb(251, 238, 118)"
      : this.props.focusHash == this.props.gameHash
      ? "rgb(150, 130, 247)"
      : "rgb(185, 198, 240)";
  }

  /*
  mapId: game.mapId,
  gameName: game.gameName,
  noPassword:
  canWatch: game.watchPermission,
  randomPlayers: game.randomPlayers,
  uniquePlayers: game.uniquePlayers,
  maxPlayers: game.maxPlayers,
  gameBaseUrl:
  activePlayers:
  activeAvatars: avatars
  */

  buildRecord() {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: "100%"
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 10,
            left: 5,
            top: "10%",
            height: "80%",
            overflow: "hidden",
            border: "1px solid black",
            backgroundColor: "white"
          }}
        >
          {GetLagDiv(this.props.gameInfo.hostInfo)}
        </div>
        <div
          style={{
            backgroundColor: "rgb(237, 132, 109)",
            position: "absolute",
            width: 130,
            left: 5 + 15,
            top: "10%",
            height: "80%",
            overflow: "hidden",
            paddingTop: "4px",
            textAlign: "center"
          }}
        >
          {this.props.gameInfo.gameName == ""
            ? " --- "
            : this.props.gameInfo.gameName}
        </div>
        <div
          style={{
            backgroundColor: "rgb(237, 132, 109)",
            position: "absolute",
            width: 60,
            left: 140 + 15,
            top: "10%",
            height: "80%",
            overflow: "hidden",
            paddingTop: "4px",
            textAlign: "center"
          }}
        >
          {this.props.gameInfo.activePlayers +
            "/" +
            this.props.gameInfo.maxPlayers}
        </div>
        <div
          style={{
            backgroundColor: "rgb(237, 132, 109)",
            position: "absolute",
            width: 60 - 15,
            left: 205 + 15,
            top: "10%",
            height: "80%",
            overflow: "hidden",
            paddingTop: "4px",
            textAlign: "center"
          }}
        >
          {this.props.gameInfo.canWatch ? 1 : 0}
        </div>
        <div
          style={{
            backgroundColor: "rgb(237, 132, 109)",
            position: "absolute",
            width: 35,
            left: 270,
            top: "10%",
            height: "80%",
            overflow: "hidden",
            paddingTop: "4px",
            textAlign: "center"
          }}
        >
          {this.props.gameInfo.noPassword ? 0 : 1}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div
        onMouseEnter={this.onMouseOver.bind(this)}
        onMouseLeave={this.onMouseOut.bind(this)}
        onClick={this.onClick.bind(this)}
        style={{ ...recordStyle, backgroundColor: this.getBgColor() }}
      >
        {this.buildRecord()}
      </div>
    );
  }
}

class GamePassword extends Component {
  constructor(props) {
    super(props);
  }
  handleChange(event) {
    this.props.onNewPassword(event.target.value);
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit.bind(this)}>
          <input
            style={{
              ...passwordStyle,
              height: this.props.height,
              top: this.props.top,
              width: this.props.width
            }}
            type="text"
            name="password"
            placeholder="Password (if any)"
            onChange={this.handleChange.bind(this)}
            value={this.props.password}
          />
        </form>
      </div>
    );
  }
}

class SearchFilter extends Component {
  constructor(props) {
    super(props);
  }
  handleChange(event) {
    this.props.onNewFilter(event.target.value);
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit.bind(this)}>
          <input
            style={filterStyle}
            type="text"
            name="filter"
            placeholder="  Filter Games"
            onChange={this.handleChange.bind(this)}
            value={this.props.filter}
          />
        </form>
      </div>
    );
  }
}

class JoinGame extends Component {
  constructor(props) {
    super(props);
    this.updateGames = 0;
    this.games = {};
  }

  componentDidMount() {
    this.getGames();
    this.updateGames = setInterval(this.getGames.bind(this), 4000); // update every 4 seconds
  }

  componentWillUnmount() {
    clearInterval(this.updateGames);
  }

  state = {
    id: 0,
    games: {},
    gamesShow: {},
    focusHash: "",
    selectedHash: "",
    searchFilter: "",
    password: "",
    totalPlayers: 0,
    totalGames: 0
  };

  getGames() {
    let requestTime = GetTime();
    // TODO: Remove the port and cors. Let express wrapper to pipe the requests where they have to go.
    fetch(
      (use_ssl ? "https://" : "http://") +
        this.props.operatorIp +
        ":8000/gamelist",
      {
        mode: "cors"
      }
    )
      .then(response => response.json())
      .then(data => {
        this.props.onOperatorLag(GetTime() - requestTime);
        if (data.games == undefined) {
          data.games = {};
        }
        this.games = data.games;
        let totalGames = Object.keys(data.games).length;
        let totalPlayers = 0;
        Object.keys(data.games).map(
          id => (totalPlayers += data.games[id].activePlayers)
        );
        this.setState({ totalGames, totalPlayers });
        this.props.onTotalGamesUpdated({ totalGames, totalPlayers });
        this.updateShowList();
      })
      .catch(err => {
        const mute = err;
        this.props.onOperatorLag(999);
        this.games = {};
        this.setState({ totalGames: 0, totalPlayers: 0 });
        this.props.onTotalGamesUpdated({ totalGames: 0, totalPlayers: 0 });
        this.updateShowList();
      });
  }

  handleJoin() {
    this.props.soundManager.playSound(clickSound1, true, true);
    if (this.games[this.state.selectedHash] == undefined) {
      this.props.onJoinError("select a game");
      return;
    }
    this.props.onJoin(
      this.state.selectedHash,
      this.games[this.state.selectedHash].gameBaseUrl
    );
  }

  handleWatch() {
    this.props.soundManager.playSound(clickSound1, true, true);
    if (this.games[this.state.selectedHash] == undefined) {
      this.props.onJoinError("select a game");
      return;
    }
    this.props.onWatch(
      this.state.selectedHash,
      this.games[this.state.selectedHash].gameBaseUrl
    );
  }

  handleMouseOutRecord(hash) {
    this.setState({ focusHash: "" });
    this.props.describeMe();
  }

  /*
  <p>Hash: {hash} </p>
  <p>Map: {game.mapId} </p>
  <p>NoPassword: {game.noPassword ? 1 : 0} </p>
  <p>CanWatch: {game.canWatch ? 1 : 0} </p>
  <p>MaxPlayers: {game.maxPlayers} </p>
  <p>NumPlayers: {game.activePlayers} </p>
  <p>RandomPlayers: {game.randomPlayers ? 1 : 0} </p>
  <p>UniquePlayers: {game.uniquePlayers ? 1 : 0} </p>
  */

  handleMouseOverRecord(hash) {
    this.setState({ focusHash: hash });
    let game = this.games[hash];
    this.props.describeMe({
      info: (
        <div>
          <div
            style={{
              position: "relative",
              top: 0,
              textAlign: "center",
              fontSize: 20,
              fontFamily: "Arial"
            }}
          >
            MAP INFO
          </div>
          <table
            style={{
              position: "relative",
              top: 5,
              width: "100%",
              border: "solid 1px black"
            }}
          >
            <tbody>
              <tr>
                <th>MAP:</th>
                <th>{mapNames[game.mapId]}</th>
              </tr>
              <tr>
                <th>NAME: </th>
                <th>{game.gameName == "" ? "---" : game.gameName} </th>
              </tr>

              <tr>
                <th>Players: </th>
                <th>
                  {game.activePlayers} / {game.maxPlayers}
                </th>
              </tr>
              <tr>
                <th>Watching allowed:</th>
                <th>{game.canWatch ? "YES" : "NO"} </th>
              </tr>
              <tr>
                <th>Random players:</th>
                <th>{game.randomPlayers ? "YES" : "NO"} </th>
              </tr>
              <tr>
                <th>Max frags:</th>
                <th>{game.maxFrags}</th>
              </tr>
              <tr>
                <th>Host delay:</th>
                <th>
                  {game.hostInfo == undefined ? "---" : game.hostInfo.hostLag}
                </th>
              </tr>
            </tbody>
          </table>
        </div>
      )
    });
  }

  handleClickRecord(hash) {
    this.setState({ selectedHash: hash });
    this.props.soundManager.playSound(clickSound1, true, true);
    this.refreshHeroes();
  }

  handleNewPassword(password) {
    password = ShrinkString(password, 100);
    this.setState({ password: password });
    this.props.onNewPassword(password);
  }

  onMouseOverJoin() {
    this.setState({ focusJoinButton: true });
    this.props.soundManager.playSound(mouseOverSound1, true, true);
    this.props.describeMe({
      info: <div> Pick a game, a name, and a character. And then fight!</div>
    });
  }
  onMouseOutJoin() {
    this.setState({ focusJoinButton: false });
    this.props.describeMe();
  }

  onMouseOverWatch() {
    this.setState({ focusWatchButton: true });
    this.props.soundManager.playSound(mouseOverSound1, true, true);
    this.props.describeMe({
      info: (
        <div>
          Scared to play? You can just watch others humiliate themselves
          instead! Right click to switch between players.
        </div>
      )
    });
  }
  onMouseOutWatch() {
    this.setState({ focusWatchButton: false });
    this.props.describeMe();
  }

  handleRefresh(hash) {
    this.props.soundManager.playSound(clickSound1, true, true);
    this.getGames();
  }

  onMouseOverRefresh() {
    this.setState({ focusRefreshButton: true });
    this.props.soundManager.playSound(mouseOverSound1, true, true);
    this.props.describeMe({ info: <div> REFRESH AVAILABLE GAMES </div> });
  }
  onMouseOutRefresh() {
    this.setState({ focusRefreshButton: false });
    this.props.describeMe();
  }

  handleNewFilter(filter) {
    this.setState({ searchFilter: filter });
    this.updateShowList();
  }

  refreshHeroes() {
    let newList = defaultAvailableHeroesList;
    if (this.games[this.state.selectedHash] == undefined) {
      this.props.setAvailableHeroesList(newList);
      return;
    }
    let game = this.games[this.state.selectedHash];
    if (game.randomPlayers) {
      newList = {};
      newList["?"] = true;
    } else if (game.uniquePlayers) {
      for (let avatar of game.activeAvatars) {
        newList[avatar] = false;
      }
    }
    this.props.setAvailableHeroesList(newList);
  }

  updateShowList() {
    var newGames = {};
    for (var key in this.games) {
      if (
        this.state.searchFilter != "" &&
        !key.includes(this.state.searchFilter)
      ) {
        continue;
      }
      newGames[key] = this.games[key];
    }
    this.setState({ gamesShow: newGames });
    this.refreshHeroes();
  }

  render() {
    return (
      <div style={joinGameStyle}>
        <GamePassword
          height={40}
          top={10}
          width={180}
          password={this.state.password}
          onNewPassword={this.handleNewPassword.bind(this)}
        />
        <button
          style={{
            ...joinGameButtonStyle,
            backgroundColor: `${
              this.state.focusJoinButton
                ? "rgb(251, 206, 119)"
                : "rgb(197, 249, 113)"
            }`
          }}
          onMouseEnter={this.onMouseOverJoin.bind(this)}
          onMouseLeave={this.onMouseOutJoin.bind(this)}
          onClick={this.handleJoin.bind(this)}
        >
          JOIN
        </button>
        <button
          style={{
            ...watchGameButtonStyle,
            backgroundColor: `${
              this.state.focusWatchButton
                ? "rgb(251, 206, 119)"
                : "rgb(197, 249, 113)"
            }`
          }}
          onMouseEnter={this.onMouseOverWatch.bind(this)}
          onMouseLeave={this.onMouseOutWatch.bind(this)}
          onClick={this.handleWatch.bind(this)}
        >
          <small>WATCH</small>
        </button>
        <div style={gameListContainerStyle}>
          <button
            style={{
              ...refreshButtonStyle,
              backgroundColor: `${
                this.state.focusRefreshButton
                  ? "rgb(249, 90, 142)"
                  : "rgb(207, 90, 249)"
              }`
            }}
            onMouseEnter={this.onMouseOverRefresh.bind(this)}
            onMouseLeave={this.onMouseOutRefresh.bind(this)}
            onClick={this.handleRefresh.bind(this)}
          >
            REFRESH
          </button>
          <SearchFilter
            filter={this.state.searchFilter}
            onNewFilter={this.handleNewFilter.bind(this)}
          />
          {RecordHeader}
          <div style={gameListStyle}>
            {Object.entries(this.state.gamesShow).map(([key, value]) => (
              <GameRecord
                key={key}
                gameHash={key}
                gameInfo={value}
                focusHash={this.state.focusHash}
                selectedHash={this.state.selectedHash}
                onMouseOver={this.handleMouseOverRecord.bind(this)}
                onMouseOut={this.handleMouseOutRecord.bind(this)}
                onClick={this.handleClickRecord.bind(this)}
              />
            ))}
          </div>
          <RecordFooter
            totalPlayers={this.state.totalPlayers}
            totalGames={this.state.totalGames}
          />
        </div>
      </div>
    );
  }
}

class NewJoinSwitch extends Component {
  constructor(props) {
    super(props);
  }

  onMouseOver() {
    this.props.soundManager.playSound(mouseOverSound1, true, true);
  }

  render() {
    return (
      <button
        style={{
          ...newJoinSwitchStyle,
          backgroundColor: this.props.joinActive
            ? "rgb(250, 162, 99)"
            : "rgb(246, 100, 183)"
        }}
        onClick={this.props.onClick}
        onMouseEnter={this.onMouseOver.bind(this)}
      >
        {this.props.joinActive
          ? "PRESS HERE TO START A NEW GAME"
          : "PRESS HERE TO JOIN AN EXISTING GAME"}
      </button>
    );
  }
}

export default JoinGame;
export { GamePassword, NewJoinSwitch };
