import React, { Component } from "react";
import { GetRand } from "./../gamePlay/utils";

const allTips = [
  "Try the random game mode! New hero is selected every minute at random! Super fun!",
  "For the best experience play with full sounds on. Neighbors gonna love it!",
  "If game lags, use Chrome. If game lags while using Chrome, prey to the gods.",
  "Study the spells. This knowledge will very likely help you in daily life!",
  "Honestly, embedded Youtube takes up to 30% CPU. Turn it off with 'music off' button.",
  "If (when) game crashes, please file censored feedback at deadbool.arena@gmail.com!",
  "If game is slow, you can always refresh the page, and rejoin the last game from where you left!",
  "Pay attention to the active spells on the right. Weird stuff happening in the game may be WAI.",
  "Be strong and healthy. Go to the gym, eat vegetables. Brush teeth after every deadbool game!",
  "Share the game with the closest family members! After all the F word stands for Family. (c)Deadpool"
];

class Tips extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.setTip();
  }

  setTip() {
    this.setState({ tipId: GetRand(allTips.length) });
    this.timeout = setTimeout(this.setTip.bind(this), 180 * 1000);
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  state = {
    tipId: 0
  };

  render() {
    return (
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          width: "100%",
          height: 40
        }}
      >
        <div
          style={{
            position: "relative",
            top: 0,
            left: 0,
            width: "auto",
            height: "100%",
            borderRadius: 5,
            display: "table",
            margin: "0 auto",
            border: "solid 1px rgb(28, 0, 0)",
            backgroundColor: "rgb(254, 234, 150)",
            overflow: "hidden",
            boxShadow: "0px 0px 3px 0 rgba(0, 0, 0, 0.7)"
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 5,
              width: 90,
              left: 0,
              top: -3,
              paddingTop: 9,
              height: "110%",
              textAlign: "center",
              fontWeight: "bold",
              backgroundColor: "rgb(13, 0, 33)",
              color: "rgb(254, 234, 150)",
              border: "solid 1px rgb(13, 0, 33)"
            }}
          >
            PRO TIP
          </div>
          <div
            style={{
              position: "relative",
              top: 7,
              paddingLeft: 110,
              paddingRight: 20,
              textAlign: "center",
              fontWeight: "bold",
              width: "auto"
            }}
          >
            {allTips[this.state.tipId].toUpperCase()}
          </div>
        </div>
      </div>
    );
  }
}

export default Tips;
