import React, { Component } from "react";
import { GetSpellList } from "./spells";

const rightBarStyle = {
  width: 77,
  height: 850,
  position: "absolute",
  right: 5,
  top: 50
};

const magicBoxStyle = {
  position: "absolute",
  width: 70,
  height: 70,
  left: 2,
  border: "solid 1px black"
};

class RightBar extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let spells = GetSpellList();
    let player = this.props.gameState.players[this.props.gameState.thisPlayer];

    if (player == undefined) return "";

    return (
      <div style={rightBarStyle}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 500,
            border: "solid 1px black",
            overflow: "hidden",
            backgroundColor: "rgba(250, 209, 170, 0.43)"
          }}
        >
          {Object.keys(this.props.gameState.physicsStats.activeSpells).map(
            (key, index) => {
              return (
                <div
                  key={index}
                  style={{
                    ...magicBoxStyle,
                    top: 2 + index * (70 + 2)
                  }}
                >
                  <img
                    src={spells[key].src}
                    style={{
                      height: "auto",
                      width: "100%"
                    }}
                  />
                </div>
              );
            }
          )}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 270,
            border: "solid 1px black",
            overflow: "hidden",
            backgroundColor: "rgba(250, 209, 170, 0.43)"
          }}
        >
          {Object.keys(player.stats.affectingSpells).map((key, index) => {
            if (!player.stats.affectingSpells[key]) return;
            return (
              <div
                key={key}
                style={{
                  ...magicBoxStyle,
                  boxShadow:
                    "inset 3px 3px 6px 0 rgb(77, 42, 1), inset -3px -3px 6px 0 rgb(77, 42, 1)",
                  top: 2 + index * (70 + 2)
                }}
              >
                <img
                  src={spells[key].src}
                  style={{
                    height: "auto",
                    width: "100%"
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default RightBar;
