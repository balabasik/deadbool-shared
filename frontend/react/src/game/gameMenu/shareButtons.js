import React, { Component } from "react";
import { clickSound1, mouseOverSound1 } from "./soundManager";

import {
  FacebookShareButton,
  TwitterShareButton,
  RedditShareButton,
  FacebookIcon,
  TwitterIcon,
  RedditIcon,
  FacebookShareCount,
  TwitterShareCount,
  RedditShareCount
} from "react-share";

const buttonStyle = {
  position: "absolute",
  width: "auto",
  height: "auto",
  borderRadius: 3,
  border: "solid 1px rgb(0, 0, 0)",
  overflow: "hidden"
};

class ShareButtons extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    mouseOver: false
  };

  onClick() {
    this.props.soundManager.playSound(clickSound1, true, true);
  }

  onMouseOver() {
    this.props.soundManager.playSound(mouseOverSound1, true, true);
  }

  onMouseLeave() {}

  render() {
    return (
      <div
        style={{
          position: "absolute",
          left: 20,
          bottom: 30,
          width: 250,
          height: 110,
          borderRadius: 5,
          border: "solid 1px rgb(0, 0, 0)",
          backgroundColor: "rgb(197, 249, 113)"
        }}
      >
        <div
          style={{
            position: "relative",
            left: 0,
            top: 3,
            textAlign: "center",
            fontWeight: "bold",
            width: "100%"
          }}
        >
          SHARE
        </div>
        <div
          onClick={this.onClick.bind(this)}
          onMouseEnter={this.onMouseOver.bind(this)}
          onMouseLeave={this.onMouseLeave.bind(this)}
          style={{ ...buttonStyle, left: 10, bottom: 10 }}
        >
          <FacebookShareButton
            children={<FacebookIcon />}
            url="https://www.deadbool.com"
          />
        </div>
        <div
          onClick={this.onClick.bind(this)}
          onMouseEnter={this.onMouseOver.bind(this)}
          onMouseLeave={this.onMouseLeave.bind(this)}
          style={{ ...buttonStyle, left: 90, bottom: 10 }}
        >
          <TwitterShareButton
            children={<TwitterIcon />}
            url="https://www.deadbool.com"
          />
        </div>
        <div
          onClick={this.onClick.bind(this)}
          onMouseEnter={this.onMouseOver.bind(this)}
          onMouseLeave={this.onMouseLeave.bind(this)}
          style={{ ...buttonStyle, left: 170, bottom: 10 }}
        >
          <RedditShareButton
            children={<RedditIcon />}
            url="https://www.deadbool.com"
          />
        </div>
      </div>
    );
  }
}

export default ShareButtons;
