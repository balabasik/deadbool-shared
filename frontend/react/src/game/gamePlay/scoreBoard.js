import React, { Component } from "react";

const scoreBoardStyle = {
  position: "absolute",
  width: 950,
  height: 500,
  left: "50%",
  top: "50%",
  marginLeft: -950 / 2,
  marginTop: -500 / 2 - 30, // a little above middle
  backgroundColor: "rgba(124, 167, 242, 0.83)",
  border: "1px solid black"
};

const recordHeaderStyle = {
  position: "absolute",
  width: 910,
  height: 30,
  left: 20,
  top: 20,
  backgroundColor: "rgb(145, 240, 160)",
  fontFamily: "Arial Black",
  fontSize: "20px",
  textAlign: "center",
  paddingLeft: "10px"
};

const recordHolderStyle = {
  position: "absolute",
  width: 910,
  height: 420,
  left: 20,
  top: 60,
  overflowY: "auto"
};

const recordStyle = {
  position: "relative",
  left: 0,
  top: 0,
  width: "100%",
  height: 35,
  fontFamily: "Arial",
  fontSize: "25px",
  marginBottom: "5px"
};

const headerPartStyle = {
  position: "absolute",
  top: 0,
  height: "100%",
  textAlign: "center",
  overflow: "hidden"
};

const partStyle = {
  position: "absolute",
  top: 0,
  height: "100%",
  textAlign: "center",
  overflow: "hidden",
  backgroundColor: "rgb(247, 203, 129)"
};

function GetSortedScores(players) {
  let scores = [];
  let scoresToPlayerMap = {};
  let scoresIndex = {};
  Object.keys(players).map(key => {
    if (key == "shadow") return;
    let player = players[key];
    if (player.stats.isCopy.active) return;
    if (scoresToPlayerMap[player.stats.frags] == undefined) {
      scoresToPlayerMap[player.stats.frags] = [];
      scoresIndex[player.stats.frags] = 0;
    }
    scoresToPlayerMap[player.stats.frags].push(key);
    scores.push(player.stats.frags);
  });

  // TODO: Sort by number of deaths for equal frags

  // Sorts from max to min
  scores.sort((a, b) => {
    return b - a;
  });

  return { scores, scoresToPlayerMap, scoresIndex };
}

class ScoreBoard extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let { scores, scoresToPlayerMap, scoresIndex } = GetSortedScores(
      this.props.gameState.players
    );
    return (
      <div style={scoreBoardStyle}>
        <div style={recordHeaderStyle}>
          <div style={{ ...headerPartStyle, left: 70, width: 600 }}>Player</div>
          <div style={{ ...headerPartStyle, left: 690, width: 100 }}>Kills</div>
          <div style={{ ...headerPartStyle, left: 810, width: 100 }}>
            Deaths
          </div>
        </div>
        <div style={recordHolderStyle}>
          {scores.map((score, index) => {
            let player = this.props.gameState.players[
              scoresToPlayerMap[score][scoresIndex[score]]
            ];
            scoresIndex[score]++;
            return (
              <div key={player.id} style={recordStyle}>
                <div style={{ ...partStyle, left: 0, width: 50 }}>
                  {index + 1}
                </div>
                <div style={{ ...partStyle, left: 70, width: 600 }}>
                  {player.playerName}
                </div>
                <div style={{ ...partStyle, left: 690, width: 100 }}>
                  {player.stats.frags}
                </div>
                <div style={{ ...partStyle, left: 810, width: 100 }}>
                  {player.stats.deaths}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default ScoreBoard;
export { GetSortedScores };
