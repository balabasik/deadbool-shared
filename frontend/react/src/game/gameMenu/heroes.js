import React, { Component } from "react";
import { Motion, spring } from "react-motion";
import { GetAvatarSpellSet, GetSpellList } from "../gamePlay/spells";
import {
  clickSound2,
  mouseOverSound2,
  clickSound1,
  mouseOverSound1
} from "./soundManager";
import { GetHeroList, menuBgComponentStyle } from "../gamePlay/utils";

const innerRadius = 3;
const outerRadius = innerRadius;
const margin = 3;

const cellStyle = {
  width: 80,
  height: 80,
  borderRadius: innerRadius,
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  float: "left",
  top: 40,
  margin: margin,
  display: "flex",
  overflow: "hidden"
};

const boardStyle = {
  position: "absolute",
  left: 450,
  bottom: 50,
  width: margin * 10 + 80 * 4 + 2,
  height: margin * 10 + 80 * 4 + 2,
  borderRadius: outerRadius,
  boxShadow: "0px 0px 3px 0 rgba(0, 0, 0, 0.7)",
  border: "1px solid black",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(rgba(78, 78, 78, 0.9) 40%, rgba(65, 65, 65, 0.9) 80% )"
};

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

const powerStyle = {
  position: "relative",
  width: 285,
  height: 59,
  left: 5,
  borderRadius: 3,
  border: "1px solid black",
  backgroundColor: "rgb(255, 253, 193)"
};

const randomDescription =
  "Let computer pick a random character for you. \
If you are unhappy with computer's choice you can always quit. \
You picky quitter.";

const deadboolDescription =
  "Deadbool is an unstoppable force. X-Force. \
He is fast, strong, and has his heart at the right place. \
His special power is making fun, even if sometimes he is the only one who gets it.";

const kgbDescription =
  "Moonlight, vodka, and a pinch of potatoes. \
Hammer and sickle are carefully wrapped in the red flag, resting. \
KGB knows everything about you. \
Kremlin has never been closer.";

const moonDescription =
  "Usagi Tsukino is no ordinary girl. \
She was cool way before Diana Prince, and her boyfriend Tuxedo Mask \
would easily beat the pretzels out of Bruce Wayne. And look at those legs..";

const neoDescription =
  "Do not try and bend the spoon, that's impossible. \
Instead, only try to realize the truth.. you'll suck if you do not pick him. \
Oracle foresaw his return. And she is a psychic..";

const batmanDescription =
  "During the Marvel crossover his \
vocabulistics got limited to “I” and “am” and “Groot”, exclusively in that order. \
It doesn't matter, but he is also crazy rich. Oh wait. It does matter.";

const marioDescription =
  "He loves pizza and mushrooms. \
He hates pipes and turtles. He is italiano signore, and he no speak americano. \
Cougar Town clogs sinks to make his acquaintance. So should you.";

const rickDescription =
  "He looks like Doc Brown. He speaks like Eminem in 8th mile. \
Don't be such a Morty and join him for an adventure. \
Oh, and don't forget Pencilvester and Mr. Poopybutthole!";

const buzzDescription =
  "Let's be honest, he is here just to attract 8-10 y.o. \
demographic population layer. And maybe make a quick buck selling some pixar merch. \
But hey, if you win with him, you get a discount!";

const trumpDescription =
  "He is a HUGE pain in the ass. But he obeys powerful people like you. Make him your beach. \
Make him pay for every precious hour of your life wasted playing this stupid game.";

const vaderDescription =
  "Phantom menace cloned a new hope. Empire striked back and awakened the last jedi. \
  But more importantly, remember. Use the force Luke. Oh wait, that's not it. I'M YOUR FATHER.";

const foolDescription = (
  <div>
    <div>A nimble Fool fell off the stool, </div>
    <div>In fate's grim sight a clumsy tool. </div>
    <div>His motley hat has fooled the king, </div>
    <div>On ruler's grave he'll dance and sing.</div>
  </div>
);

const pikaDescription =
  "Meet fat Pikachu. Great opportunities lied in front of him. \
He could have been an astronaut. A detective. Gynecologist to the stars.. \
Instead he is stuck here with you. Don't let him down.";

const optimusDescription =
  "A long time ago, in a galaxy far far away, \
there was a wizard boy, who saved the princess, and disarmed a nuclear bomb. \
There is a 50% chance that boy is you. If not, you need Prime.";

const thanosDescription =
  "Thanos is easily the strongest being in the universe. Except Jesus, duhh. \
  He'll crash your enemies. He'll win your trophies. He'll live your life \
  like you can only imagine. Watch and learn.";

const jesusDescription =
  "Your faith is strong with Him. Your will is divine. \
Every minute spent in the game equals reading a prayer. \
Every win will atone one sin. At least so we've been told. By his father. Amen.";

function getSpellDescription(id) {
  let spell = GetSpellList()[id];
  return { name: spell.name, src: spell.src, description: spell.description };
}

function getAvatarDescription(id) {
  if (id == "deadbool") {
    return deadboolDescription;
  }
  if (id == "kgb") {
    return kgbDescription;
  }
  if (id == "moon") {
    return moonDescription;
  }
  if (id == "neo") {
    return neoDescription;
  }
  if (id == "batman") {
    return batmanDescription;
  }
  if (id == "mario") {
    return marioDescription;
  }
  if (id == "rick") {
    return rickDescription;
  }
  if (id == "buzz") {
    return buzzDescription;
  }
  if (id == "trump") {
    return trumpDescription;
  }
  if (id == "vader") {
    return vaderDescription;
  }
  if (id == "fool") {
    return foolDescription;
  }
  if (id == "pika") {
    return pikaDescription;
  }
  if (id == "optimus") {
    return optimusDescription;
  }
  if (id == "thanos") {
    return thanosDescription;
  }
  if (id == "jesus") {
    return jesusDescription;
  }
  if (id == "random") return randomDescription;
}

const borderRowStyle = {
  height: margin
};

var cells = [];
for (var i = 0; i < 4; i++) {
  cells[i] = [];
  for (var j = 0; j < 4; j++) cells[i][j] = 4 * i + j;
}

class Cell extends Component {
  constructor(props) {
    super(props);
  }

  onMouseOver() {
    this.props.onMouseOver(this.props.id);
  }
  onMouseOut() {
    this.props.onMouseOut(this.props.id);
  }
  onClick() {
    this.props.onClick(this.props.id);
  }

  render() {
    let imgExtraStyle =
      this.props.cellLogos[this.props.id] == undefined
        ? {}
        : this.props.cellLogos[this.props.id].extraStyle;
    let imgSrc =
      this.props.cellLogos[this.props.id] == undefined
        ? ""
        : this.props.cellLogos[this.props.id].src;
    let text =
      this.props.cellLogos[this.props.id] == undefined
        ? ""
        : this.props.cellLogos[this.props.id].text;
    if (text == undefined) text = "";
    let image =
      imgSrc == "" ? (
        <div />
      ) : (
        <img
          style={{
            width: "100%",
            height: "100%",
            ...imgExtraStyle
          }}
          src={imgSrc}
        />
      );
    // NOTE: Using MouseEnter and MouseLeave instead of MouseOver and MouseOut
    return (
      <Motion
        defaultStyle={{ scale: 1 }}
        style={{
          scale: spring(this.props.focus == this.props.id ? 1.1 : 1, {
            stiffness: 200,
            damping: 20
          })
        }}
      >
        {style => (
          <div
            style={{
              ...cellStyle,
              transform: `scale( ${style.scale} )`,
              backgroundColor:
                this.props.selected == this.props.id
                  ? "rgb(197, 249, 113)"
                  : this.props.focus == this.props.id
                  ? "rgb(246, 184, 111)"
                  : "rgb(252, 217, 148)",
              borderStyle:
                this.props.selected == this.props.id ? "solid" : "none",
              marginLeft: this.props.left ? 2 * margin : margin,
              opacity: this.props.activeSet[this.props.id] ? 1 : 0.6,
              overflow: "hidden"
            }}
            onMouseEnter={this.onMouseOver.bind(this)}
            onMouseLeave={this.onMouseOut.bind(this)}
            onClick={this.onClick.bind(this)}
          >
            {image}
            <div
              style={{
                position: "absolute",
                fontFamily: "Arial Black",
                fontSize:
                  text.length == 2
                    ? "20px"
                    : text.length == 3
                    ? "17px"
                    : "14px",
                top: text.length == 2 ? -1 : text.length == 3 ? 1 : 3,
                textAlign: "center"
              }}
            >
              {text}
            </div>
          </div>
        )}
      </Motion>
    );
  }
}

class Power extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let s = getSpellDescription(this.props.power);
    return (
      <div style={this.props.style}>
        <img
          style={{
            height: "90%",
            top: "5%",
            left: "3px",
            position: "absolute",
            border: "1px solid black",
            borderRadius: "5px"
          }}
          src={s.src}
        />
        <div
          style={{
            height: "10px",
            top: "2px",
            left: 60,
            position: "absolute",
            fontFamily: "Arial",
            fontSize: "15px",
            fontWeight: "bold"
          }}
        >
          {(this.props.index == 1
            ? "[q] "
            : this.props.index == 2
            ? "[e] "
            : this.props.index == 3
            ? "[v] "
            : "[p] ") + s.name}{" "}
        </div>
        <div
          style={{
            height: "10px",
            top: 26,
            left: 60,
            position: "absolute",
            fontFamily: "Arial",
            fontSize: "13px",
            fontWeight: "normal",
            lineHeight: "14px"
          }}
        >
          {s.description}
        </div>
      </div>
    );
  }
}

class Heroes extends Component {
  constructor(props) {
    super(props);
    this.cellLogos = {};
    let heroList = GetHeroList();
    for (let name of heroList) {
      this.cellLogos[name[0]] = {
        src: "./avatars_and_guns/avatar_" + name[0] + ".png",
        extraStyle: {
          position: "absolute",
          top: name[0] == "random" ? 0 : "35%",
          width: "100%",
          height: "auto"
        },
        text: name[1]
      };
    }
    this.selected = 0;
    this.focus = 0;
  }
  state = {
    focus: 0,
    selected: 0
  };

  buildAvatarDescription(id) {
    let powers = GetAvatarSpellSet(id);
    return (
      <div>
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 15,
            width: 210,
            height: 210,
            borderRadius: 3,
            background: "rgb(198, 198, 198)",
            boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 5,
              top: 5,
              width: 200,
              height: 200,
              borderRadius: 7,
              border: "1px solid black",
              background:
                "linear-gradient(to bottom, #99dbf4 0%,#d0e6f4 85%,#050e21 89%,#207cca 100%,#b9c9e8 100%)"
            }}
          >
            <img
              style={{
                position: "absolute",
                width: 160,
                height: 170,
                left: 19,
                top: 15
              }}
              src={"./avatars_and_guns/avatar_" + id + ".png"}
            />
          </div>
        </div>
        <p
          style={{
            position: "relative",
            height: 30,
            margin: "0 auto",
            top: 227,
            textAlign: "center",
            fontFamily: "Arial Black",
            fontSize: "30px",
            fontWeight: "normal"
          }}
        >
          {id.toUpperCase()}
        </p>
        <div style={{ ...textboxStyle, top: 245, height: 100 }}>
          {getAvatarDescription(id)}
        </div>
        <div style={{ ...textboxStyle, top: 259, height: 293 }}>
          <Power
            index={0}
            power={powers[0]}
            style={{ ...powerStyle, top: 5 }}
          />
          <Power
            index={1}
            power={powers[1]}
            style={{ ...powerStyle, top: 15 }}
          />
          <Power
            index={2}
            power={powers[2]}
            style={{ ...powerStyle, top: 25 }}
          />
          <Power
            index={3}
            power={powers[3]}
            style={{ ...powerStyle, top: 35 }}
          />
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.setState({ selected: this.props.randomPlayers ? "random" : 0 });
  }

  componentWillReceiveProps(props) {
    if (props.availableList[this.selected]) return;
    let id = props.randomPlayers ? "random" : 0;

    if (this.state.selected != id) {
      this.setState({ selected: id });
      this.selected = id;
      this.props.onPlayerSelected(id);
    }
  }

  onMouseOver(id) {
    if (this.props.availableList[id] && this.focus != id) {
      this.props.soundManager.playSound(mouseOverSound2, true, true);
      this.setState({ focus: id });
      this.focus = id;
      this.props.describeMe({ content: this.buildAvatarDescription(id) });
    }
  }

  onMouseOut(id) {
    if (this.props.availableList[id]) {
      this.setState({ focus: 0 });
      this.focus = 0;
      this.props.describeMe();
    }
  }

  onClick(id) {
    // REACT DOESNOT MUTATE STATE IMMEDIATELY!
    if (this.props.availableList[id] && this.selected != id) {
      // TODO: Change so that sounds don't need to reload again and again
      this.props.soundManager.playSound(clickSound1, true, true);
      //console.log("/sounds/avatars/" + id + "_0.mp3");
      //src, useSrcAsHash, stopEarly, type, cyclic, hash, volume
      if (id != "random") {
        this.props.soundManager.playSound(
          "/sounds/avatars/" + id + "_0.mp3", // NOTE: 0s sound is always the menu sound
          false,
          true,
          "sound",
          false,
          "avatar_sound",
          0.7 // volume
        );
      }
      this.setState({ selected: id });
      this.selected = id;
      this.props.onPlayerSelected(id);
    }
  }

  render() {
    return (
      <div style={boardStyle}>
        <div style={borderRowStyle} />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"deadbool"}
          left={true}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"kgb"}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"moon"}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"batman"}
        />
        <div style={borderRowStyle} />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"buzz"}
          left={true}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"fool"}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"jesus"}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"mario"}
        />
        <div style={borderRowStyle} />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"neo"}
          left={true}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"optimus"}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"pika"}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"rick"}
        />
        <div style={borderRowStyle} />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"thanos"}
          left={true}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"trump"}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"vader"}
        />
        <Cell
          focus={this.state.focus}
          selected={this.state.selected}
          activeSet={this.props.availableList}
          onMouseOver={this.onMouseOver.bind(this)}
          onMouseOut={this.onMouseOut.bind(this)}
          onClick={this.onClick.bind(this)}
          cellLogos={this.cellLogos}
          id={"random"}
        />
      </div>
    );
  }
}

export default Heroes;
export { Cell };
