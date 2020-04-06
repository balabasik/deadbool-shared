import React, { Component } from "react";
import { GetSpellList } from "./spells";
import { GetHashFromString, GetMagicReloadFactor } from "./utils";

const lowBarStyle = {
  height: 80,
  width: "100%",
  position: "absolute",
  bottom: 0,
  left: 0
};

const gun0Style = {
  position: "absolute",
  left: 5,
  top: 5,
  width: 145,
  height: 70,
  borderWidth: 1,
  borderStyle: "solid"
};

const gun1Style = {
  position: "absolute",
  left: 155,
  top: 5,
  width: 145,
  height: 70,
  borderWidth: 1,
  borderStyle: "solid"
};

const sitReloadStyle = {
  position: "absolute",
  left: 305,
  top: 5,
  width: 70,
  height: 70,
  borderWidth: 1,
  borderStyle: "solid"
};

const magicWrapperStyle = {
  position: "absolute",
  top: -5,
  right: 5,
  width: 305,
  height: 80,
  borderRadius: "3px",
  border: "solid 1px black",
  backgroundColor: "rgba(245, 220, 155, 0.7)"
};

const magicExpandedStyle = {
  position: "absolute",
  bottom: 90,
  right: 5,
  width: 305,
  height: 80,
  borderRadius: "7px",
  border: "solid 1px black",
  backgroundColor: "rgba(205, 247, 249, 0.9)"
};

const magicBoxStyle = {
  position: "absolute",
  top: 5,
  width: 70,
  height: 70,
  border: "solid 2px black",
  borderRadius: "5px"
};

const commonStyle = {
  position: "absolute",
  left: 0,
  bottom: 0,
  width: "100%"
};

function getColorFromRatio(ratio, strict) {
  strict = strict == true; // to handle undefined;
  return (strict && ratio > 99) || (!strict && ratio > 70)
    ? "rgb(152, 237, 120)"
    : (strict && ratio > 50) || (!strict && ratio > 30)
    ? "rgb(255, 253, 134)"
    : "rgb(250, 72, 72)";
}

class LowBar extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    expandSpell: { active: false, spell: {} }
  };

  onMouseOverSpell(spell) {
    this.setState({ expandSpell: { active: true, spell } });
  }

  onMouseOutSpell(spell) {
    if (
      this.state.expandSpell.active &&
      this.state.expandSpell.spell.src == spell.src
    )
      this.setState({ expandSpell: { active: false, spell: {} } });
  }

  render() {
    let player = this.props.gameState.players[this.props.gameState.thisPlayer];
    if (player == undefined) return "";
    let time = this.props.gameState.timeStamp;
    let ammoRatio = [0, 1].map(
      i => (100 * player.stats.ammo[i]) / player.stats.maxammo[i]
    );
    // TODO: Put magicReloadTime into a function
    let magicRatio = [1, 2, 3].map(i => {
      let reload =
        player.stats.magicReloadTime[i] *
        GetMagicReloadFactor(Object.keys(this.props.gameState.players).length);
      return (
        (Math.min(time - player.stats.lastMagicTime[i], reload) / reload) * 100
      );
    });
    // TODO: Change to server time if needed!
    let sitRatio = Math.min(
      (Math.max(this.props.gameState.timeStamp - player.stats.lastSitTime, 0) *
        100) /
        player.stats.sitReloadTime,
      100
    );

    let spells = GetSpellList();
    // Hue is based on the player's id
    let hue = (GetHashFromString(player.id) % 360) - 180;
    let filter = "hue-rotate(" + hue + "deg)";

    let spellExpanded = this.state.expandSpell.active ? (
      <div style={magicExpandedStyle}>
        <div
          style={{
            paddingTop: 5,
            position: "relative",
            textAlign: "center",
            fontWeight: "bold"
          }}
        >
          {this.state.expandSpell.spell.name}
        </div>
        <div
          style={{
            paddingTop: 2,
            position: "relative",
            textAlign: "center",
            lineHeight: 1.2
          }}
        >
          {this.state.expandSpell.spell.description}
        </div>
      </div>
    ) : (
      <div />
    );

    return (
      <div style={lowBarStyle}>
        <div style={gun0Style}>
          <div
            style={{
              ...commonStyle,
              width: ammoRatio[0] + "%",
              height: "100%",
              backgroundColor: getColorFromRatio(ammoRatio[0]),
              opacity: 0.7
            }}
          />
          <img
            src={"./avatars_and_guns/bullet_0.png"}
            style={{
              position: "absolute",
              height: "60%",
              width: "30%",
              top: "20%",
              left: "35%",
              filter: filter
            }}
          />
        </div>
        <div style={gun1Style}>
          <div
            style={{
              ...commonStyle,
              width: ammoRatio[1] + "%",
              height: "100%",
              backgroundColor: getColorFromRatio(ammoRatio[1]),
              opacity: 0.7
            }}
          />
          <img
            src={"./avatars_and_guns/bullet_1.png"}
            style={{
              position: "absolute",
              height: "60%",
              width: "60%",
              top: "20%",
              left: "20%",
              filter: filter
            }}
          />
        </div>
        <div style={sitReloadStyle}>
          <div
            style={{
              ...commonStyle,
              width: "100%",
              height: sitRatio + "%",
              backgroundColor: getColorFromRatio(sitRatio, true /* strict*/),
              opacity: 0.7
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "100%",
              bottom: 10,
              fontFamily: "Arial",
              fontSize: "30px",
              textAlign: "center"
            }}
          >
            S
          </div>
        </div>
        {spellExpanded}
        <div style={magicWrapperStyle}>
          <div
            style={{ ...magicBoxStyle, left: 5 }}
            onMouseEnter={this.onMouseOverSpell.bind(
              this,
              spells[player.stats.magicId[1]]
            )}
            onMouseLeave={this.onMouseOutSpell.bind(
              this,
              spells[player.stats.magicId[1]]
            )}
          >
            <img
              src={spells[player.stats.magicId[1]].src}
              style={{
                height: "100%",
                width: "auto",
                filter: magicRatio[0] > 98 ? "" : "brightness(60%)"
              }}
            />
            <div
              style={{
                ...commonStyle,
                opacity: magicRatio[0] > 98 ? 0 : 0.4,
                height: magicRatio[0] + "%",
                backgroundColor: getColorFromRatio(magicRatio[0])
              }}
            />
          </div>
          <div
            style={{ ...magicBoxStyle, left: 80 }}
            onMouseEnter={this.onMouseOverSpell.bind(
              this,
              spells[player.stats.magicId[2]]
            )}
            onMouseLeave={this.onMouseOutSpell.bind(
              this,
              spells[player.stats.magicId[2]]
            )}
          >
            <img
              src={spells[player.stats.magicId[2]].src}
              style={{
                height: "100%",
                width: "auto",
                filter: magicRatio[1] > 98 ? "" : "brightness(60%)"
              }}
            />
            <div
              style={{
                ...commonStyle,
                opacity: magicRatio[1] > 98 ? 0 : 0.4,
                height: magicRatio[1] + "%",
                backgroundColor: getColorFromRatio(magicRatio[1])
              }}
            />
          </div>
          <div
            style={{ ...magicBoxStyle, left: 155 }}
            onMouseEnter={this.onMouseOverSpell.bind(
              this,
              spells[player.stats.magicId[3]]
            )}
            onMouseLeave={this.onMouseOutSpell.bind(
              this,
              spells[player.stats.magicId[3]]
            )}
          >
            <img
              src={spells[player.stats.magicId[3]].src}
              style={{
                height: "100%",
                width: "auto",
                filter: magicRatio[2] > 98 ? "" : "brightness(60%)"
              }}
            />
            <div
              style={{
                ...commonStyle,
                opacity: magicRatio[2] > 98 ? 0 : 0.4,
                height: magicRatio[2] + "%",
                backgroundColor: getColorFromRatio(magicRatio[2])
              }}
            />
          </div>
          <div
            style={{ ...magicBoxStyle, left: 230 }}
            onMouseEnter={this.onMouseOverSpell.bind(
              this,
              spells[player.stats.magicId[0]]
            )}
            onMouseLeave={this.onMouseOutSpell.bind(
              this,
              spells[player.stats.magicId[0]]
            )}
          >
            <img
              src={spells[player.stats.magicId[0]].src}
              style={{
                position: "absolute",
                height: "100%",
                width: "auto"
              }}
            />
            <div
              style={{
                position: "absolute",
                height: "100%",
                width: "100%",
                boxShadow:
                  "inset 3px 3px 6px 0 rgb(77, 42, 1), inset -3px -3px 6px 0 rgb(77, 42, 1)"
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default LowBar;
