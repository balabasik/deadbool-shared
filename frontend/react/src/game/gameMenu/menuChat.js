import React, { Component } from "react";
import {
  use_ssl,
  RandomString,
  ShrinkString,
  operatorIp,
  menuBgComponentStyle
} from "./../gamePlay/utils";
import { clickSound1, mouseOverSound1 } from "./soundManager";

const chatHeight = 800;

const chatStyle = {
  position: "absolute",
  width: 300,
  height: chatHeight,
  right: 0,
  top: "50%",
  marginTop: -chatHeight / 2,
  border: "solid 1px black",
  borderRadius: 3,
  boxShadow: "0px 0px 3px 0 rgba(0, 0, 0, 0.7)"
};

const chatInputStyle = {
  position: "absolute",
  borderRadius: 3,
  width: 290 - 2,
  height: 50,
  bottom: 5,
  left: 5,
  backgroundColor: "rgb(190, 247, 212)",
  opacity: 0.9,
  border: "0px solid",
  paddingLeft: "7px",
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
};

const entriesStyle = {
  position: "absolute",
  width: 290 - 2,
  left: 5,
  height: 500,
  backgroundColor: "rgb(190, 247, 212)",
  border: "solid 0px black",
  borderRadius: 3,
  overflowX: "hidden",
  overflowY: "auto", // allow scroll bar,
  boxShadow: "inset 1px 1px 2px 0 black, inset -1px -1px 2px 0 black"
};

const meMessageStyle = {
  position: "relative",
  width: 200,
  left: 80,
  marginBottom: "5px",
  textAlign: "center",
  backgroundColor: "rgb(254, 189, 129)",
  fontSize: "20px",
  border: "solid 1px black",
  borderRadius: 10
};

const otherMessageStyle = {
  position: "relative",
  width: 200,
  left: 5,
  marginBottom: "5px",
  backgroundColor: "rgb(142, 232, 251)",
  textAlign: "center",
  fontSize: "20px",
  border: "solid 1px black",
  borderRadius: 10
};

const messageHistoryLimit = 100;

/*
message: {playerName, text, hash}
*/

class ChatKnob extends Component {
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
          right: this.props.right - 5,
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
            left: -18,
            fontSize: 25,
            top: 84,
            transform: "rotate(-90deg)"
          }}
        >
          CHAT
        </div>
      </div>
    );
  }
}

class MenuChat extends Component {
  constructor(props) {
    super(props);
    this.scrolled = true;

    // Last hash is the hash of the last received message.
    // To avoid traffic we query only the new messages after this hash.
    this.lastMessage = undefined;
    this.clientHash = RandomString();
  }

  componentDidMount() {
    this.getMessages();
    this.updateMessages = setInterval(this.getMessages.bind(this), 2000); // update every 2 seconds
  }

  componentWillUnmount() {
    if (this.updateMessages != undefined) clearInterval(this.updateMessages);
  }

  getMessages(submitMessage) {
    // TODO: Remove the port and cors. Let express wrapper to pipe the requests where they have to go.
    let submit =
      submitMessage == undefined
        ? ""
        : "&submit=" + JSON.stringify(submitMessage);
    fetch(
      (use_ssl ? "https://" : "http://") + this.props.operatorIp + ":8000/chat",
      {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `lastMessage=${this.lastMessage}${submit}`
      }
    )
      .then(response => response.json())
      .then(data => {
        this.addNewMessages(data.messages);
      })
      .catch(err => {
        const mute = err;
      });
  }

  addNewMessages(newChatMessages) {
    // TODO: Enforce order
    if (newChatMessages == undefined) return;
    for (let message of newChatMessages) {
      if (message != undefined && message.hash != undefined) {
        this.state.messages.push(message);
        this.lastMessage = message.hash;
      }
    }

    if (this.state.messages.length > messageHistoryLimit)
      this.state.messages.splice(
        0,
        this.state.messages.length - messageHistoryLimit
      );
    // REACT DOESNOT MUTATE STATE IMMEDIATELY.
    this.setState({ messages: this.state.messages });

    this.updateScroll();
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    let msg = this.state.value;
    msg = ShrinkString(msg, 200);
    let name = this.props.thisPlayerName;
    name = name == undefined ? "" : ShrinkString(name, 100);
    this.getMessages({
      text: msg,
      playerName: name,
      clientHash: this.clientHash
    });
    this.setState({ value: "" });
    event.preventDefault();
    this.props.soundManager.playSound(clickSound1, true, true);
  }

  state = {
    value: "",
    messages: []
  };

  onScroll() {
    this.scrolled =
      this.divRef.scrollHeight - this.divRef.clientHeight <=
      this.divRef.scrollTop + 1;
    this.updateScroll();
  }

  componentWillReceiveProps(props) {
    this.updateScroll();
  }

  updateScroll() {
    if (!this.scrolled || this.divRef == undefined) return;
    this.divRef.scrollTop = this.divRef.scrollHeight;
  }

  render() {
    if (!this.props.chatVisible) {
      return (
        <ChatKnob
          right={0}
          soundManager={this.props.soundManager}
          onClick={this.props.onChatKnobClick}
        />
      );
    }
    let input = (
      <form onSubmit={this.handleSubmit.bind(this)} autoComplete="new-password">
        <input
          style={chatInputStyle}
          type="text"
          placeholder="Reply"
          value={this.state.value}
          onChange={this.handleChange.bind(this)}
          name="fakechatinput"
        />
      </form>
    );
    let entriesExtraStyle = { height: chatHeight - 10 - 50 - 5 - 4, top: 5 };

    return (
      <div
        style={{
          ...chatStyle,
          ...menuBgComponentStyle
        }}
      >
        <ChatKnob
          right={300}
          soundManager={this.props.soundManager}
          onClick={this.props.onChatKnobClick}
        />
        <div
          ref={c => (this.divRef = c)}
          style={{ ...entriesStyle, ...entriesExtraStyle }}
          onScroll={this.onScroll.bind(this)}
        >
          {this.state.messages.map((message, index) => {
            let you = this.clientHash == message.clientHash;
            let style = you ? meMessageStyle : otherMessageStyle;

            if (index == 0) {
              style = { ...style, marginTop: "5px" };
            }

            return (
              <div key={index} style={style}>
                <div
                  style={{
                    marginTop: "1px",
                    fontWeight: "bold",
                    textAlign: "center"
                  }}
                >
                  {you ? "You" : message.playerName}
                </div>
                <div
                  style={{
                    marginTop: "-4px",
                    width: "95%",
                    wordWrap: "break-word",
                    paddingLeft: "5%",
                    textAlign: "left"
                  }}
                >
                  {message.text}
                </div>
              </div>
            );
          })}
        </div>
        {input}
      </div>
    );
  }
}

export default MenuChat;
