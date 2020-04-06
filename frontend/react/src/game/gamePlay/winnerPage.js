import React, { Component } from "react";
import { GetSortedScores } from "./scoreBoard";
import { GetRand, GetTime } from "./utils";

const pageWidth = 1400 * 1.4 - 50;
const pageHeight = 720 * 1.4 - 50;

const winnerPageStyle = {
  position: "absolute",
  width: pageWidth,
  height: pageHeight,
  left: "50%",
  top: "50%",
  marginLeft: -pageWidth / 2,
  marginTop: -pageHeight / 2,
  backgroundColor: "rgba(39, 35, 121, 1)",
  border: "10px solid brown",
  overflow: "hidden"
};

// Thank you futurama!
const catchPhrases = [
  "Weiner weiner, chicken dinner",
  "Soon to be a major religion",
  "Not a substitute for human interaction",
  "When you see the robot, drink!",
  "Tell your parents it's educational",
  "Featuring gratuitous alien nudity"
];

const soundPath = "sounds/planet_sakaar.mp3";

function RenderBeam(beam, index) {
  let h = 1500;
  return (
    <div
      key={index}
      style={{
        opacity: "0.8",
        position: "absolute",
        left:
          pageWidth / 2 - beam.w / 2 + (h / 2) * Math.sin(beam.rotate / 57.325),
        bottom: 0 - (h / 2 - (h / 2) * Math.cos(beam.rotate / 57.325)),
        width: beam.w,
        height: h,
        transform: "rotate(" + beam.rotate + "deg)",
        backgroundColor: beam.color,
        boxShadow: beam.shadow
      }}
    />
  );
}

function CreateBeam(width, deg, color) {
  return {
    w: width,
    rotate: deg,
    color: color,
    shadow: `0 0 ${Math.max(10, Math.floor(width / 4))}px ${Math.max(
      10,
      Math.floor(width / 4)
    )}px white, inset 0 0 ${Math.max(10, Math.floor(width / 4))}px ${Math.max(
      10,
      Math.floor(width / 4)
    )}px white`
  };
}

function ModifyWidth(w) {
  return Math.min(
    200,
    Math.max(10, w + (GetRand(2) == 0 ? 1 : -1) * GetRand(50))
  );
}

class WinnerPage extends Component {
  constructor(props) {
    super(props);
    this.dynamicActive = true;
    this.phrase = catchPhrases[GetRand(catchPhrases.length)];
  }

  state = {
    beams: []
  };

  componentDidMount() {
    // playSound(src, useSrcAsHash, stopEarly, type, cyclic, hash, volume)
    this.props.soundManager.playSound(soundPath, true, true);
    this.dynamicActive = this.props.systemOptions.dynamicActive;
    this.initBeams();
    this.updateBeams();
  }

  componentWillUnmount() {
    this.props.soundManager.removeSound(soundPath);
    if (this.timeout != undefined) clearTimeout(this.timeout);
  }

  initBeams() {
    let n = 61;
    let deg = 360 / (n - 1);
    for (let i = 0; i < n; i++) {
      let width = 10 + GetRand(100);
      let beam = CreateBeam(width, (-n + 1 + i) * deg, "rgb(126, 209, 255)");
      this.state.beams.push(beam);
    }
    this.setState({ beams: this.state.beams });
  }

  componentWillReceiveProps(props) {
    if (this.dynamicActive != this.props.systemOptions.dynamicActive) {
      this.dynamicActive = this.props.systemOptions.dynamicActive;
      if (this.dynamicActive) this.updateBeams();
      else {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }
    }
  }

  updateBeams() {
    if (!this.dynamicActive) return;
    let angle = 2;
    let newBeams = [];
    for (let i = 0; i < this.state.beams.length; i++) {
      newBeams.push(
        CreateBeam(
          ModifyWidth(this.state.beams[i].w),
          this.state.beams[i].rotate + angle,
          this.state.beams[i].color
        )
      );
    }

    this.setState({ beams: newBeams });
    this.timeout = setTimeout(this.updateBeams.bind(this), 150);
  }

  render() {
    let { scores, scoresToPlayerMap, scoresIndex } = GetSortedScores(
      this.props.gameState.players
    );
    let winner1 = undefined;
    let winner2 = undefined;
    let winner3 = undefined;
    let you = this.props.gameState.players[this.props.gameState.thisPlayer];
    let yourPlace = undefined;
    scores.map((score, index) => {
      let player = this.props.gameState.players[
        scoresToPlayerMap[score][scoresIndex[score]]
      ];
      scoresIndex[score]++;
      if (index == 0) winner1 = player;
      else if (index == 1) winner2 = player;
      else if (index == 2) winner3 = player;
      if (you.id == player.id) yourPlace = index;
    });

    if (you.id == winner1.id || you.id == winner2.id || you.id == winner3.id)
      yourPlace = undefined;

    let yourName =
      yourPlace == undefined ? (
        <div />
      ) : (
        <div
          style={{
            position: "absolute",
            right: 20,
            bottom: pageHeight - 100,
            width: "auto",
            height: 60,
            fontSize: 25,
            paddingTop: 9,
            paddingLeft: 20,
            paddingRight: 20,
            color: "black",
            overflow: "hidden",
            backgroundColor: "rgb(238, 172, 255)",
            border: "2px solid black",
            textAlign: "center"
          }}
        >
          {"Your place: " + (yourPlace + 1)}
        </div>
      );

    let timeLeft = Math.max(
      0,
      Math.floor(
        (this.props.gameState.physicsStats.gameStatus.newGameTimeStamp -
          this.props.gameState.timeStamp) /
          1000
      )
    );

    let podium = (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%"
        }}
      >
        <img
          style={{
            position: "absolute",
            left: 410,
            bottom: 210,
            width: 360,
            height: 480
          }}
          src="./map1/map1_2d_furniture_toilet1_00.png"
        />
        <img
          style={{
            position: "absolute",
            left: 1555,
            bottom: 180,
            width: 150,
            height: "auto"
          }}
          src="./map1/map1_2d_furniture_mac.png"
        />
        <img
          style={{
            position: "absolute",
            left: 1575,
            bottom: 10,
            width: 250,
            height: 255
          }}
          src="./map1/map1_2d_furniture_toilet2_00.png"
        />
        <img
          style={{
            position: "absolute",
            left: pageWidth / 2 - 350 / 2,
            bottom: 200,
            width: 350,
            height: "auto"
          }}
          src="./map1/map1_2d_furniture_tnt_full.png"
        />
        <img
          style={{
            position: "absolute",
            left: 1125,
            bottom: 100,
            width: 380,
            height: 480
          }}
          src="./map1/map1_2d_furniture_pumpkin.png"
        />
        <img
          style={{
            position: "absolute",
            left: 120,
            bottom: 10,
            width: 215,
            height: 280
          }}
          src="./map1/map1_2d_furniture_trash.png"
        />
        <img
          style={{
            position: "absolute",
            left: pageWidth / 2 - 1200 / 2,
            bottom: 10,
            width: 1200,
            height: "auto"
          }}
          src="./map1/map1_2d_furniture_radiator.png"
        />
      </div>
    );

    let srcHero1 =
      winner1 == undefined
        ? ""
        : "avatars_and_guns/avatar_" + winner1.avatar + ".png";
    let srcHero2 =
      winner2 == undefined
        ? ""
        : "avatars_and_guns/avatar_" + winner2.avatar + ".png";
    let srcHero3 =
      winner3 == undefined
        ? ""
        : "avatars_and_guns/avatar_" + winner3.avatar + ".png";

    let hero1 = (
      <img
        style={{
          position: "absolute",
          left: pageWidth / 2 - 260 / 2 - 5,
          bottom: 530,
          width: 260,
          height: "auto"
        }}
        src={srcHero1}
      />
    );

    let hero2 = (
      <img
        style={{
          position: "absolute",
          left: 1200,
          bottom: 442,
          width: 260,
          height: "auto"
        }}
        src={srcHero2}
      />
    );

    let hero3 = (
      <img
        style={{
          position: "absolute",
          left: 400,
          bottom: 380,
          width: 260,
          height: "auto"
        }}
        src={srcHero3}
      />
    );

    let name1 =
      winner1 == undefined ? (
        <div />
      ) : (
        <div
          style={{
            position: "absolute",
            left: pageWidth / 2 - 500 / 2,
            bottom: pageHeight - 100,
            width: 500,
            height: 60,
            fontSize: 25,
            paddingTop: 9,
            color: "black",
            overflow: "hidden",
            backgroundColor: "rgb(255, 244, 172)",
            border: "2px solid black",
            textAlign: "center"
          }}
        >
          {winner1.playerName + " [" + winner1.stats.frags + "]"}
        </div>
      );

    let name2 =
      winner2 == undefined ? (
        <div />
      ) : (
        <div
          style={{
            position: "absolute",
            left: 1080,
            bottom: pageHeight - 220,
            width: 500,
            height: 60,
            fontSize: 25,
            paddingTop: 9,
            color: "black",
            overflow: "hidden",
            backgroundColor: "rgb(228, 227, 227)",
            border: "2px solid black",
            textAlign: "center"
          }}
        >
          {winner2.playerName + " [" + winner2.stats.frags + "]"}
        </div>
      );

    let name3 =
      winner3 == undefined ? (
        <div />
      ) : (
        <div
          style={{
            position: "absolute",
            left: 280,
            bottom: pageHeight - 270,
            width: 500,
            height: 60,
            fontSize: 25,
            paddingTop: 9,
            color: "black",
            overflow: "hidden",
            backgroundColor: "rgb(255, 172, 185)",
            border: "2px solid black",
            textAlign: "center"
          }}
        >
          {winner3.playerName + " [" + winner3.stats.frags + "]"}
        </div>
      );

    let timer = (
      <div
        style={{
          position: "absolute",
          left: pageWidth / 2 - 400 / 2,
          bottom: 50,
          width: 400,
          height: 100,
          fontSize: 30,
          paddingTop: 25,
          color: "black",
          overflow: "hidden",
          backgroundColor: "rgb(255, 255, 255)",
          border: "2px solid black",
          textAlign: "center"
        }}
      >
        NEXT GAME IN: {timeLeft}
      </div>
    );

    let catchPhrase = (
      <div
        style={{
          position: "absolute",
          left: pageWidth / 2 - 600 / 2,
          bottom: 212,
          width: 600,
          height: 50,
          paddingTop: -3,
          border: "2px solid black",
          borderRadius: 5,
          backgroundColor: "rgb(255, 213, 131)",
          fontSize: 30,
          fontFamily: "Comic Sans MS",
          textAlign: "center"
        }}
      >
        {this.phrase}
      </div>
    );

    return (
      <div style={winnerPageStyle}>
        {this.state.beams.map((beam, index) => RenderBeam(beam, index))}
        {podium}
        {hero1}
        {hero2}
        {hero3}
        {name1}
        {name2}
        {name3}
        {yourName}
        {timer}
        {catchPhrase}
      </div>
    );
  }
}

export default WinnerPage;
export { GetSortedScores };
