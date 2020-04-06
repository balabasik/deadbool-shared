import React, { Component } from "react";
import { GetSortedScores } from "./scoreBoard";
import { GetPlayerLvlExp } from "./player";

const highBarStyle = {
  height: 80,
  width: "100%",
  position: "absolute",
  top: 0,
  left: 0
};

const serverDelayStyle = {
  position: "absolute",
  right: 50,
  top: 5,
  width: 50,
  height: 50,
  borderWidth: 1,
  borderStyle: "solid"
};

const hpStyle = {
  position: "absolute",
  left: 200,
  top: 5,
  width: 500,
  height: 30,
  borderWidth: 1,
  borderStyle: "solid",
  backgroundColor: "rgb(207, 207, 207)"
};

const ggStyle = {
  position: "absolute",
  right: 200,
  top: 5,
  width: 500,
  height: 30,
  borderWidth: 1,
  borderStyle: "solid",
  backgroundColor: "rgb(144, 208, 250)"
};

function getColorFromRatio(ratio) {
  return ratio > 70
    ? "rgb(152, 237, 120)"
    : ratio > 30
    ? "rgb(255, 253, 134)"
    : "rgb(250, 72, 72)";
}

function getColorFromRatioGg(ratio) {
  return "rgb(85, 149, 246)";
}

class HighBar extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.updateServerDelay();
  }

  componentWillUnmount() {
    clearTimeout(this.serverDelayTimeout);
  }

  updateServerDelay() {
    this.setState({
      serverDelay:
        this.props.gameState.hostLag == undefined
          ? 0
          : Math.floor(Math.min(999, this.props.gameState.hostLag)),
      playerDelay:
        this.props.gameState.playerLag == undefined
          ? 0
          : Math.floor(Math.min(999, this.props.gameState.playerLag))
    });
    this.serverDelayTimeout = setTimeout(() => this.updateServerDelay(), 500); // update delay every 500ms
  }

  state = {
    serverDelay: 0,
    playerDelay: 0
  };

  render() {
    // TODO: Do not put this logic in render.
    let player = this.props.gameState.players[this.props.gameState.thisPlayer];
    if (player == undefined) return "";
    let rank = 1;
    Object.keys(this.props.gameState.players).map(key => {
      if (key == player.id || key == "shadow") return;
      let other = this.props.gameState.players[key];
      if (
        other.stats.frags > player.stats.frags ||
        (other.stats.frags == player.stats.frags &&
          other.stats.deaths <= player.stats.deaths)
      )
        rank++;
    });

    if (player == undefined) return <div />;
    let serverDelayRatio =
      Math.max(0, Math.min(this.state.serverDelay, 200) / 200) * 100;
    let playerDelayRatio =
      Math.max(0, Math.min(this.state.playerDelay, 200) / 200) * 100;

    let hpRatio =
      Math.max(
        0,
        Math.min(player.stats.hp, player.stats.maxhp) / player.stats.maxhp
      ) * 100;

    let ggRatio =
      (100 * (player.stats.exp - GetPlayerLvlExp(player.stats.lvl))) /
      (GetPlayerLvlExp(player.stats.lvl + 1) -
        GetPlayerLvlExp(player.stats.lvl));

    let timer =
      this.props.gameState == undefined
        ? 0
        : Math.floor(
            this.props.gameState.physicsStats.youtube.activeYoutubeTimer / 1000
          );

    return (
      <div style={highBarStyle}>
        <div style={hpStyle}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: hpRatio + "%",
              backgroundColor: getColorFromRatio(hpRatio)
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "100%",
              fontFamily: "Arial",
              fontSize: "15px",
              marginTop: "4px",
              textAlign: "center"
            }}
          >
            HP: {Math.floor(player.stats.hp)}
          </div>
        </div>
        <div style={{ ...ggStyle, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: ggRatio + "%",
              backgroundColor: getColorFromRatioGg(ggRatio)
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "100%",
              fontFamily: "Arial",
              fontSize: "15px",
              marginTop: "3px",
              textAlign: "center"
            }}
          >
            LVL: {player.stats.lvl} EXP: {Math.floor(player.stats.exp)}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 5,
            left: 5,
            height: 30,
            width: 160,
            overflow: "hidden",
            textAlign: "center",
            fontFamily: "Arial Black",
            fontSize: "20px",
            color: "rgb(251, 222, 133)",
            backgroundColor: "rgba(242, 125, 124, 0.84)",
            border: "solid 1px black",
            textShadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black"
          }}
        >
          <div
            style={{
              marginTop: "-2px"
            }}
          >
            #{rank}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            height: 30,
            width: 160,
            overflow: "hidden",
            textAlign: "center",
            fontFamily: "Arial Black",
            fontSize: "20px",
            color: "rgb(251, 222, 133)",
            backgroundColor: "rgba(242, 125, 124, 0.84)",
            border: "solid 1px black",
            textShadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black"
          }}
        >
          <div
            style={{
              marginTop: "-2px"
            }}
          >
            {player == undefined ? 0 : player.stats.frags} /{" "}
            {this.props.gameState == undefined
              ? 0
              : this.props.gameState.gameOptions.maxFrags}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 5,
            left: "50%",
            height: 30,
            width: 140,
            marginLeft: "90px",
            overflow: "hidden",
            textAlign: "left",
            fontFamily: "Arial",
            fontSize: "14px",
            color: "black",
            backgroundColor: "rgb(255, 184, 156)",
            border: "solid 1px black"
          }}
        >
          <div
            style={{
              marginTop: "4px",
              paddingLeft: 20
            }}
          >
            {"HOST LAGS: " + this.state.serverDelay}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 5,
            left: "50%",
            height: 30,
            width: 140,
            marginLeft: "-230px",
            overflow: "hidden",
            textAlign: "left",
            fontFamily: "Arial",
            fontSize: "14px",
            color: "black",
            backgroundColor: "rgb(255, 184, 156)",
            border: "solid 1px black"
          }}
        >
          <div
            style={{
              marginTop: "4px",
              paddingLeft: 20
            }}
          >
            {"YOU LAG: " + this.state.playerDelay}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 5,
            left: "50%",
            height: 30,
            width: 160,
            marginLeft: "-80px",
            overflow: "hidden",
            textAlign: "center",
            fontFamily: "Arial Black",
            fontSize: "20px",
            color: "rgb(217, 179, 255)",
            backgroundColor: "rgba(129, 71, 71)",
            border: "solid 1px black",
            borderRadius: 30,
            textShadow: "-2px 0 black, 0 2px black, 2px 0 black, 0 -2px black"
          }}
        >
          <div
            style={{
              marginTop: "-2px",
              WebkitFilter: "drop-shadow(0px 0px 18px rgb(251, 250, 139))"
            }}
          >
            {timer}
          </div>
        </div>
      </div>
    );
  }
}

export default HighBar;
