import React, { Component } from "react";

// chatManager
// chatState = "hidden", "visible", "active"

const chatHeight = 1000 / 2;

const chatStyle = {
  position: "absolute",
  width: 300,
  height: chatHeight,
  left: 0,
  top: "50%",
  marginTop: -chatHeight / 2,
  backgroundColor: "rgb(157, 149, 249)",
  border: "solid 1px black",
  borderRadius: 3
};

const chatClosedStyle = {
  position: "absolute",
  width: 50,
  height: 100,
  left: -10,
  top: "50%",
  marginTop: -100 / 2,
  backgroundColor: "blue",
  border: "solid 1px black",
  borderRadius: 10,
  paddingLeft: 6,
  paddingTop: 35
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
  paddingLeft: "7px"
};

const entriesStyle = {
  position: "absolute",
  width: 290 - 2,
  left: 5,
  backgroundColor: "rgb(190, 247, 212)",
  border: "solid 1px black",
  borderRadius: 3,
  overflowY: "auto" // allow scroll bar
};

const meMessageStyle = {
  position: "relative",
  width: 200,
  left: 80,
  marginTop: "5px",
  textAlign: "center",
  backgroundColor: "rgb(254, 189, 129)",
  fontSize: "20px",
  border: "solid 1px black",
  borderRadius: 10,
  overflowX: "hidden"
};

const otherMessageStyle = {
  position: "relative",
  width: 200,
  left: 5,
  marginTop: "5px",
  backgroundColor: "rgb(142, 232, 251)",
  textAlign: "center",
  fontSize: "20px",
  border: "solid 1px black",
  borderRadius: 10,
  overflowX: "hidden"
};

function GetNumUnreadMessages(chatManager, lastSeenKey, thisPlayer) {
  let num = chatManager.messages.length;
  if (num == 0 || chatManager.messages[num - 1].player == thisPlayer) return 0;
  for (let i = num - 1; i >= 0; i--) {
    if (chatManager.messages[i].id == lastSeenKey) return num - i - 1;
  }
  return num;
}

class GameChat extends Component {
  constructor(props) {
    super(props);
    this.firstSubmit = true; // when input is spawned it immediately receives submit command
    this.scrolled = true;
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    this.props.onInputSubmitted({
      text: this.state.value,
      forceClose: !this.firstSubmit
    });
    this.setState({ value: "" });
    event.preventDefault();
    this.firstSubmit = !this.firstSubmit;
  }

  state = {
    value: ""
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
    if (!this.props.chatVisible && !this.props.chatActive) {
      return (
        <div
          style={{
            ...chatClosedStyle,
            overflow: "hidden",
            textAlign: "center",
            fontFamily: "Arial Black",
            fontSize: "20px",
            color: "rgb(247, 188, 126)",
            backgroundColor: "rgb(190, 247, 212)",
            border: "solid 1px black",
            textShadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black"
          }}
        >
          {this.props.gameState == undefined
            ? 0
            : GetNumUnreadMessages(
                this.props.gameState.chatManager,
                this.props.lastSeenHash,
                this.props.gameState.thisPlayer
              )}
        </div>
      );
    }
    let input = this.props.chatActive ? (
      <form onSubmit={this.handleSubmit.bind(this)}>
        <input
          style={chatInputStyle}
          type="text"
          name="chat"
          placeholder="Reply"
          value={this.state.value}
          onChange={this.handleChange.bind(this)}
          autoFocus
        />
      </form>
    ) : (
      <div />
    );
    let entriesExtraStyle = this.props.chatActive
      ? { height: chatHeight - 10 - 50 - 5 - 4, top: 5 }
      : { height: chatHeight - 10 - 2, top: 5 };

    return (
      <div
        style={{
          ...chatStyle
        }}
      >
        <div
          ref={c => (this.divRef = c)}
          style={{ ...entriesStyle, ...entriesExtraStyle }}
          onScroll={this.onScroll.bind(this)}
        >
          {this.props.gameState.chatManager.messages.map((message, index) => {
            let you = this.props.gameState.thisPlayer == message.player;
            let style = you ? meMessageStyle : otherMessageStyle;
            return (
              <div
                key={index}
                style={{
                  ...style,
                  marginBottom: "5px"
                }}
              >
                <div
                  style={{
                    marginTop: "3px",
                    fontWeight: "bold",
                    textAlign: "center",
                    paddingLeft: "4px",
                    paddingRight: "4px"
                  }}
                >
                  {you
                    ? "You"
                    : this.props.gameState.players[message.player].playerName}
                </div>
                <div
                  style={{
                    marginTop: "-5px",
                    marginBottom: "5px",
                    width: "95%",
                    wordWrap: "break-word",
                    paddingLeft: "5%",
                    textAlign: "left",
                    lineHeight: 1.15
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

export default GameChat;
