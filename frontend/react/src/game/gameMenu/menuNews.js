import React, { Component } from "react";
import {
  testing,
  RandomString,
  ShrinkString,
  menuBgComponentStyle,
  use_ssl
} from "./../gamePlay/utils";
import { clickSound1, mouseOverSound1 } from "./soundManager";

const newsHeight = 600;

const newsStyle = {
  position: "absolute",
  width: 300,
  height: newsHeight,
  left: 0,
  top: "50%",
  marginTop: -newsHeight / 2 - 10,
  border: "solid 1px black",
  borderRadius: 3,
  boxShadow: "0px 0px 3px 0 rgba(0, 0, 0, 0.7)",
  ...menuBgComponentStyle
};

const entriesStyle = {
  position: "absolute",
  width: 290 - 2,
  left: 5,
  top: 5,
  height: newsHeight - 12,
  backgroundColor: "rgb(190, 247, 212)",
  border: "solid 0px black",
  borderRadius: 3,
  overflowX: "hidden",
  overflowY: "auto", // allow scroll bar,
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
};

const entryStyle = {
  position: "relative",
  width: "94%",
  left: "3%",
  marginBottom: "8px",
  textAlign: "left",
  backgroundColor: "rgb(239, 255, 176)",
  fontSize: "20px",
  border: "solid 1px black",
  borderRadius: 3,
  paddingLeft: 5,
  paddingRight: 5
};

const bgColors = [
  "rgb(239, 255, 176)",
  "rgb(255, 219, 176)",
  "rgb(255, 176, 242)",
  "rgb(176, 253, 255)",
  "rgb(208, 176, 255)",
  "rgb(176, 255, 184)"
];

class NewsKnob extends Component {
  constructor(props) {
    super(props);
  }

  onClick() {
    this.props.soundManager.playSound(clickSound1, true, true);
    this.props.onClick();
  }

  onMouseOver() {
    this.props.soundManager.playSound(mouseOverSound1, true, true);
  }

  render() {
    return (
      <div
        onClick={this.onClick.bind(this)}
        onMouseEnter={this.onMouseOver.bind(this)}
        style={{
          position: "absolute",
          width: 35,
          height: 200,
          left: this.props.left - 5,
          top: "50%",
          marginTop: -200 / 2,
          backgroundColor: "white",
          border: "2px solid black",
          borderRadius: 5
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "auto",
            height: "auto",
            left: -20,
            fontSize: 25,
            top: 84,
            transform: "rotate(-90deg)"
          }}
        >
          NEWS
        </div>
      </div>
    );
  }
}

class MenuNews extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.fetchNews();
  }

  fetchNews() {
    // TODO: Remove the port and cors. Let express wrapper to pipe the requests where they have to go.
    fetch(
      (use_ssl ? "https://" : "http://") +
        this.props.operatorIp +
        ":8000/newslist",
      {
        mode: "cors"
      }
    )
      .then(response => response.json())
      .then(data => {
        if (data.news == undefined) {
          data.news = [];
        }
        this.setState({ news: data.news });
      })
      .catch(err => {
        const mute = err;
      });
  }

  state = {
    news: []
  };

  componentWillUnmount() {}

  render() {
    if (!this.props.newsVisible) {
      return (
        <NewsKnob
          left={0}
          soundManager={this.props.soundManager}
          onClick={this.props.onNewsKnobClick}
        />
      );
    }

    return (
      <div style={newsStyle}>
        <NewsKnob
          left={300}
          soundManager={this.props.soundManager}
          onClick={this.props.onNewsKnobClick}
        />
        <div style={entriesStyle}>
          {this.state.news.map((message, index) => {
            let you = this.clientHash == message.clientHash;
            let style = entryStyle;

            if (index == 0) {
              style = { ...style, marginTop: "10px" };
            }

            return (
              <div
                key={index}
                style={{
                  ...style,
                  backgroundColor: bgColors[index % bgColors.length]
                }}
              >
                <div
                  style={{
                    marginTop: "1px",
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: 20
                  }}
                >
                  {message.date}
                </div>
                <div
                  style={{
                    marginTop: "-3px",
                    width: "100%",
                    wordWrap: "break-word",
                    textAlign: "center",
                    lineHeight: 1.15,
                    marginBottom: 6,
                    wordBreak: "normal"
                  }}
                >
                  {message.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default MenuNews;
