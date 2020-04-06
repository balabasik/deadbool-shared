import React, { Component } from "react";
import { GetAvatarSpellSet, GetSpellList } from "../gamePlay/spells";
import { GetHeroList } from "../gamePlay/utils";
import { perkTypes, GetPerkDescription } from "../gamePlay/perks";

const frameWidth = 1250;
const frameHeight = 800;

const sectionHeaderStyle = {
  position: "relative",
  fontWeight: "bold",
  fontFamily: "Bazar",
  fontSize: "20px"
};

const sectionStyle = {
  position: "relative",
  backgroundColor: "rgba(180, 210, 250, 0.8)",
  border: "solid 1px black",
  borderRadius: "5px",
  paddingLeft: 10,
  paddingTop: 5,
  marginBottom: 10
};

const heroImgStyle = {
  position: "absolute",
  left: 0,
  top: 40,
  width: 100,
  height: 100,
  border: "solid 1px black",
  backgroundColor: "rgb(252, 247, 197)",
  borderRadius: 3
};

const spellImgStyle = {
  position: "absolute",
  left: 15,
  top: 0,
  width: 70,
  height: 70,
  borderRadius: 3,
  border: "solid 1px blue"
};

const spellNameStyle = {
  position: "relative",
  width: "100%",
  height: 20,
  left: 0,
  textAlign: "left",
  color: "rgb(74, 0, 13)"
};

const spellDescriptionStyle = {
  position: "absolute",
  left: 100,
  top: -3,
  width: "90%",
  height: 70
};

const spell1Style = {
  position: "absolute",
  left: 0,
  width: "43%",
  height: 50,
  top: 0
};
const spell2Style = {
  position: "absolute",
  left: "53%",
  width: "43%",
  height: 50,
  top: 0
};
const spell3Style = {
  position: "absolute",
  left: 0,
  width: "43%",
  height: 50,
  top: 90
};
const spell4Style = {
  position: "absolute",
  left: "53%",
  width: "43%",
  height: 50,
  top: 90
};

const heroStyle = {
  position: "relative",
  height: 180,
  border: "solid 1px black",
  borderRadius: 3,
  width: "99%",
  marginBottom: 10,
  backgroundColor: "rgb(225, 240, 251)"
};

const innerHeroStyle = {
  position: "relative",
  height: "94%",
  width: "94%",
  top: "5%",
  left: "3%"
};

const spellsStyle = {
  position: "absolute",
  height: 70,
  width: "80%",
  top: 0,
  left: "15%"
};

const itemStyle = {
  position: "relative",
  height: 70,
  width: "100%"
};

const itemImgStyle = {
  position: "absolute",
  height: 50,
  width: 50,
  top: 10,
  border: "solid 1px black",
  borderRadius: 3,
  backgroundColor: "rgb(194, 244, 249)",
  overflow: "hidden"
};

const itemDescriptionStyle = {
  position: "absolute",
  height: 50,
  left: 0,
  width: "100%"
};

const buttonStyle = {
  position: "absolute",
  top: 340 + 1,
  left: "50%",
  marginLeft: -50,
  width: 100,
  height: 50,
  color: "#000000",
  borderRadius: 3,
  border: "solid 1px rgb(0, 0, 0)",
  fontFamily: "Arial",
  fontSize: "18px",
  textrAlign: "center",
  paddingTop: 5,
  boxShadow: "0px 0px 3px 0px rgba(106, 106, 106, 0.7)"
};

function GetSeconds(time) {
  return time == undefined ? "-" : Math.floor(time / 1000);
}

function GetHeroRules() {
  let heroes = GetHeroList();
  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>HEROES</div>
      <div style={{ position: "relative", width: "100%", top: 4 }}>
        {heroes.map(pair => {
          if (pair[0] == "random") return "";
          let spells = GetSpellList();
          let spellIds = GetAvatarSpellSet(pair[0]);
          let spell1 = spells[spellIds[0]];
          let spell2 = spells[spellIds[1]];
          let spell3 = spells[spellIds[2]];
          let spell4 = spells[spellIds[3]];
          return (
            <div key={pair[0]} style={heroStyle}>
              <div style={innerHeroStyle}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 10,
                    width: 100,
                    textAlign: "center",
                    fontWeight: "bold"
                  }}
                >
                  {pair[0].toUpperCase()}
                </div>
                <div style={heroImgStyle}>
                  <img
                    style={{
                      position: "absolute",
                      height: "96%",
                      width: "96%",
                      left: "2%",
                      top: "2%"
                    }}
                    src={"./avatars_and_guns/avatar_" + pair[0] + ".png"}
                  />
                </div>
                <div style={spellsStyle}>
                  <div style={spell1Style}>
                    <img style={spellImgStyle} src={spell1.src} />
                    <div style={spellDescriptionStyle}>
                      <div style={spellNameStyle}>
                        [{spell1.name}] {"A: " + GetSeconds(spell1.activeTime)}{" "}
                        {"R: " + GetSeconds(spell1.reloadTime)}
                      </div>
                      <div style={{ position: "relative", top: 5 }}>
                        {spell1.descriptionTech}{" "}
                      </div>
                    </div>
                  </div>
                  <div style={spell2Style}>
                    <img style={spellImgStyle} src={spell2.src} />
                    <div style={spellDescriptionStyle}>
                      <div style={spellNameStyle}>
                        [{spell2.name}] {"A: " + GetSeconds(spell2.activeTime)}{" "}
                        {"R: " + GetSeconds(spell2.reloadTime)}
                      </div>
                      <div style={{ position: "relative", top: 5 }}>
                        {spell2.descriptionTech}
                      </div>
                    </div>
                  </div>
                  <div style={spell3Style}>
                    <img style={spellImgStyle} src={spell3.src} />
                    <div style={spellDescriptionStyle}>
                      <div style={spellNameStyle}>
                        [{spell3.name}] {"A: " + GetSeconds(spell3.activeTime)}{" "}
                        {"R: " + GetSeconds(spell3.reloadTime)}
                      </div>
                      <div style={{ position: "relative", top: 5 }}>
                        {spell3.descriptionTech}
                      </div>
                    </div>
                  </div>
                  <div style={spell4Style}>
                    <img style={spellImgStyle} src={spell4.src} />
                    <div style={spellDescriptionStyle}>
                      <div style={spellNameStyle}>
                        [{spell4.name}] {"A: " + GetSeconds(spell4.activeTime)}{" "}
                        {"R: " + GetSeconds(spell4.reloadTime)}
                      </div>
                      <div style={{ position: "relative", top: 5 }}>
                        {spell4.descriptionTech}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "relative", height: 5 }} />
    </div>
  );
}

function GetItem(src, description, extra, size, srcRatio) {
  if (srcRatio == undefined) srcRatio = 1;
  let color = "rgb(73, 24, 128)";
  return (
    <div style={{ ...itemStyle, height: size + 20 }}>
      <div style={{ ...itemImgStyle, width: size, height: size }}>
        <img
          style={{
            ...extra,
            position: "absolute",
            width: "90%",
            top: "50%",
            marginTop: -45 * srcRatio + "%",
            height: 90 * srcRatio + "%",
            left: "5%",
            WebkitFilter: `drop-shadow(1px 0px 0px ${color}) drop-shadow(0px 1px 0px ${color}) drop-shadow(-1px 0px 0px ${color}) drop-shadow(0px -1px 0px ${color})`
          }}
          src={src}
        />
      </div>
      <div
        style={{
          ...itemDescriptionStyle,
          height: size,
          paddingLeft: size + 10,
          top: 8
        }}
      >
        <span style={{ color: "rgb(75, 0, 4)" }}>{description[0]}</span>
        {" " + description[1]}
      </div>
    </div>
  );
}

function GetMap1Rules() {
  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>MAP: HOME ALONE</div>
      <div style={{ position: "relative", width: "100%", height: 95 }}>
        <div style={{ position: "absolute", left: 0 }}>
          {GetItem(
            "./map1/map1_2d_furniture_toilet2_00.png",
            ["", ""],
            {},
            70,
            1
          )}
        </div>
        <div style={{ position: "absolute", left: 80, width: 300 }}>
          {GetItem(
            "./map1/map1_2d_furniture_toilet1_00.png",
            [
              "[TOILET TELEPORT PAIR]",
              "Teleport using the S key. You can teleport every 7 seconds."
            ],
            {},
            70,
            1
          )}
        </div>
        <div style={{ position: "absolute", left: 0 + 430 }}>
          {GetItem("./map1/map1_2d_furniture_vent.png", ["", ""], {}, 70, 1)}
        </div>
        <div style={{ position: "absolute", left: 80 + 430, width: 300 }}>
          {GetItem(
            "./map1/map1_2d_furniture_vent.png",
            [
              "[VENT TELEPORT PAIR]",
              "Teleport using the S key. You can teleport every 7 seconds."
            ],
            {},
            70,
            1
          )}
        </div>
      </div>
      <div style={{ position: "relative", width: "100%", height: 95 }}>
        <div style={{ position: "absolute", left: 0 }}>
          {GetItem(
            "./map1/map1_2d_furniture_toilet_sign.png",
            ["", ""],
            {},
            70,
            1
          )}
        </div>
        <div style={{ position: "absolute", left: 80 }}>
          {GetItem(
            "./map1/map1_2d_furniture_fan_full.png",
            ["", ""],
            {},
            70,
            1
          )}
        </div>
        <div style={{ position: "absolute", left: 160 }}>
          {GetItem("./map1/map1_2d_furniture_bed.png", ["", ""], {}, 70, 1)}
        </div>
        <div style={{ position: "absolute", left: 240 }}>
          {GetItem("./map1/map1_2d_furniture_pinball.png", ["", ""], {}, 70, 1)}
        </div>
        <div style={{ position: "absolute", left: 320 }}>
          {GetItem("./map1/map1_2d_furniture_banana.png", ["", ""], {}, 70, 1)}
        </div>
        <div style={{ position: "absolute", left: 400 }}>
          {GetItem("./map1/map1_2d_furniture_table2.png", ["", ""], {}, 70, 1)}
        </div>
        <div style={{ position: "absolute", left: 480, width: 300 }}>
          {GetItem(
            "./map1/map1_2d_furniture_swing.png",
            [
              "[JUMPERS]",
              "They will toss you up straight where you came from."
            ],
            {},
            70,
            1
          )}
        </div>
      </div>
    </div>
  );
}

function GetCommonRules() {
  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>COMMON RULES</div>
      <div style={{ position: "relative" }}>
        <span style={{ color: "rgb(87, 0, 81)", fontWeight: "bold" }}>
          [Damage]
        </span>{" "}
        Deadbool Arena is a 2d shooter. For every 1 point of inflicted damage
        you earn 1 experience point (exp). You earn 200 exp for every kill
        (frag). Every next level adds 1% to all your base stats including magic
        resist, healing rate, ammo reload, critical hit change, etc. Just like
        in the Bible, killing yourself will not add any experience points.
        Remember, Deadbool Arena is a family friendly game. Time to kill em all.
      </div>
      <div style={{ position: "relative", top: 5 }}>
        <span style={{ color: "rgb(87, 0, 81)", fontWeight: "bold" }}>
          [YouCrown]
        </span>{" "}
        The youtube link you provide in the player info alongside your nickname
        is used as a part of the Youtube challenge. Every 60 seconds the youtube
        video on TV will be reselected based on who is currently holding the
        YouCrown. The YouCrown is just like the elder wand, to earn it you have
        to kill its previous owner.
      </div>
      <div style={{ position: "relative", top: 10 }}>
        <span style={{ color: "rgb(87, 0, 81)", fontWeight: "bold" }}>
          [Spells]
        </span>{" "}
        Every player has 1 passive spell, and 3 active spells. When another
        player's spell is affecting you, you will see them on the lower side of
        the right bar. In Addition you will see an under influence sign on top
        of your player. Spells are divided into local and global (also called
        V-spells). Global spells affect everyone, and will be shown on the upper
        side of the right bar. More players playing the game, slower the spells
        regen.{" "}
        <span style={{ color: "rgb(0, 79, 6)", fontWeight: "bold" }}>
          A: spell active time. R: spell reload time.
        </span>
      </div>
      <div style={{ position: "relative", width: "95%", height: 105, top: 15 }}>
        <div style={{ position: "absolute", width: "50%", left: 0 }}>
          {GetItem(
            "./avatars_and_guns/gun_0_center.png",
            [
              "[Plasma Gun]",
              "It is fast. Inflicts 10 points of damage per hit. Full ammo contains 20 bullets. Recharges with a faster rate."
            ],
            {
              transform:
                "rotate(-45deg) scale(1.2) translateX(2px) translateY(-1px)"
            },
            70,
            0.5625
          )}
        </div>
        <div style={{ position: "absolute", width: "50%", left: "50%" }}>
          {GetItem(
            "./avatars_and_guns/gun_1_center.png",
            [
              "[Rocket Launcher]",
              "It is slow. Explodes over area. Inflicted damage is 50 points. Full ammo contains 10 bullets. Slower recharging."
            ],
            { transform: "rotate(-45deg) scale(1.2)" },
            70,
            0.5625
          )}
        </div>
      </div>
    </div>
  );
}

function GetPerkRules() {
  let id = -1;
  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>ITEMS</div>
      <div style={{ position: "relative", width: "100%", height: 85, top: -5 }}>
        {perkTypes.map(perk => {
          id++;
          return (
            <div
              key={perk}
              style={{
                position: "absolute",
                left: id * 25 + "%",
                width: "25%"
              }}
            >
              {GetItem(
                "./perks/perk_" + perk + ".png",
                GetPerkDescription(perk),
                {},
                70,
                1
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

class RulesButton extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <button
        style={{
          ...buttonStyle,
          backgroundColor: this.props.mouseOverRules
            ? "rgb(250, 187, 65)"
            : "rgb(197, 249, 113)"
        }}
        onClick={this.props.onRulesClick}
        onMouseEnter={this.props.onRulesMouseOver}
        onMouseLeave={this.props.onRulesMouseLeave}
      >
        RULES
      </button>
    );
  }
}

class Rules extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "5%",
          width: "50%",
          height: "90%",
          border: "solid 1px black",
          borderRadius: 10,
          marginLeft: "-25%",
          backgroundColor: "rgba(247, 244, 200, 0.9)",
          boxShadow: "0px 0px 3px 0 rgba(0, 0, 0, 0.7)",
          overflowY: "scroll"
        }}
      >
        <div
          style={{
            position: "relative",
            textAlign: "center",
            fontWeight: "bold",
            fontFamily: "Bazar",
            fontSize: "30px"
          }}
        >
          RULEBOOK
        </div>
        <div
          style={{ position: "relative", top: -3, left: "2%", width: "96%" }}
        >
          {GetCommonRules()}
          {GetPerkRules()}
          {GetHeroRules()}
          {GetMap1Rules()}
        </div>
      </div>
    );
  }
}

export default Rules;
export { RulesButton };
