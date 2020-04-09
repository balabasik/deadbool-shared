import React, { Component } from "react";
import GamePlay from "./gamePlay/gamePlay";
import Menu from "./gameMenu/menu";

const pageStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
  backgroundColor: "#e1f6bb"
};

class GameMain extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    isGameStarted: false,
    gameBaseUrl: "fake",
    playerId: "fake",
    hostId: "fake",
    gameOptions: {},
    playerPass: "",
    mapId: 1,
    gameHash: "fake",
    gamePass: "",
    avatar: 0,
    watchOnly: false,
    wsUrl: "ws://fake",
    playerInfo: { playerName: "fake", avatar: "deadbool" },
    systemOptions: {
      sound: true,
      dynamicActive: true,
      music: true,
      invertColors: false
    }
  };

  onStart(
    gameBaseUrl,
    playerId,
    playerPass,
    mapId,
    hostId,
    playerInfo,
    gameOptions,
    gameHash,
    gamePass,
    avatar,
    watchOnly,
    wsUrl
  ) {
    this.setState({
      gameBaseUrl: gameBaseUrl,
      playerId: playerId,
      playerPass: playerPass,
      mapId: mapId,
      hostId: hostId,
      playerInfo: playerInfo,
      gameOptions: gameOptions,
      gameHash: gameHash,
      serverGamePass: gamePass,
      avatar: avatar,
      watchOnly: watchOnly,
      wsUrl: wsUrl
    });
    this.setState({ isGameStarted: true });
  }

  onStop() {
    this.setState({ isGameStarted: false });
  }

  onOptionsChanged(newOptions) {
    this.setState({ systemOptions: newOptions });
  }

  render() {
    let show = this.state.isGameStarted ? (
      <GamePlay
        initState={this.state}
        onStop={this.onStop.bind(this)}
        systemOptions={this.state.systemOptions}
        onOptionsChanged={this.onOptionsChanged.bind(this)}
      />
    ) : (
      <Menu
        isActive={!this.state.isGameStarted}
        onStart={this.onStart.bind(this)}
        onOptionsChanged={this.onOptionsChanged.bind(this)}
        systemOptions={this.state.systemOptions}
        gotoMore={this.props.gotoMore}
        firstClick={this.props.firstClick}
        onFirstClick={this.props.onFirstClick}
      />
    );
    return show;
  }
}

export default GameMain;
