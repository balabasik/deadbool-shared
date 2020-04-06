import React, { Component } from "react";
import { Button } from "react-bootstrap";
import { clickSound1, mouseOverSound1 } from "./soundManager";
import { use_ssl } from "./../gamePlay/utils";

const regionStyle = {
  position: "absolute",
  top: 20,
  right: 20,
  width: 200,
  height: 40,
  color: "#000000",
  borderRadius: 3,
  border: "solid 1px rgb(0, 0, 0)",
  fontFamily: "Arial",
  fontSize: "18px",
  textAlign: "center",
  paddingTop: 7,
  paddingLeft: 10,
  paddingRight: 10,
  boxShadow: "0px 0px 3px 0px rgba(106, 106, 106, 0.7)"
};

const lagStyle = {
  position: "absolute",
  top: 65,
  right: 20,
  width: 130,
  height: 30,
  color: "#000000",
  borderRadius: 3,
  border: "solid 1px rgb(0, 0, 0)",
  boxShadow: "0px 0px 3px 0px rgba(106, 106, 106, 0.7)",
  backgroundColor: "white"
};

const totalStyle = {
  position: "absolute",
  top: 100,
  right: 20,
  width: 130,
  height: 60,
  color: "#000000",
  borderRadius: 3,
  border: "solid 1px rgb(0, 0, 0)",
  boxShadow: "0px 0px 3px 0px rgba(106, 106, 106, 0.7)",
  backgroundColor: "white",
  fontFamily: "Arial",
  fontSize: "14px",
  paddingTop: 7,
  paddingLeft: 5
};

const lagTextStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  borderRadius: 3,
  fontFamily: "Arial",
  fontSize: "14px",
  paddingTop: 4,
  paddingLeft: 7,
  overflow: "hidden"
};

function RegionFromIp(ip) {
  var res = ip.split(".");
  if (res != undefined && res.length > 1) return res[1].toUpperCase(); // operator.dev.arena.deadbool.com
  return ip;
}

function getLagBar(lag) {
  let color =
    lag < 100
      ? "rgb(111, 249, 133)"
      : lag < 200
      ? "rgb(252, 255, 140)"
      : "rgb(254, 133, 133)";
  let ratio =
    lag == undefined
      ? 100
      : lag < 50
      ? 20
      : lag > 300
      ? 100
      : Math.floor(20 + (80 * (lag - 50)) / (300 - 50));
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: ratio + "%",
        backgroundColor: color,
        height: "100%",
        color: "#000000",
        borderRadius: 3
      }}
    />
  );
}

const recordStyle = {
  position: "relative",
  width: "100%",
  height: 30,
  textAlign: "center",
  paddingTop: "3px"
};

class ServerEntry extends Component {
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

  state = {};

  getBgColor() {
    return this.props.selectedId == this.props.id
      ? "rgb(251, 238, 118)"
      : this.props.focusId == this.props.id
      ? "rgb(150, 130, 247)"
      : "rgb(175, 233, 255)";
  }

  render() {
    return (
      <div
        onMouseEnter={this.onMouseOver.bind(this)}
        onMouseLeave={this.onMouseOut.bind(this)}
        onClick={this.onClick.bind(this)}
        style={{ ...recordStyle, backgroundColor: this.getBgColor() }}
      >
        {RegionFromIp(this.props.id)}
      </div>
    );
  }
}

class Expand extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    focusId: 0,
    selectedId: 0
  };

  onMouseOverEntry(id) {
    this.setState({ focusId: id });
  }

  onMouseLeaveEntry(id) {}

  onClickEntry(id) {
    this.setState({ selectedId: id });

    // Set the operatorIp address upstream
    this.props.updateOperatorIp(id);
  }

  render() {
    if (this.props.servers == undefined || this.props.servers.length == 0)
      return "";
    return (
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 225,
          width: 130,
          height: "auto",
          backgroundColor: "white",
          border: "1px solid black",
          borderRadius: 3,
          boxShadow: "0px 0px 3px 0px rgba(106, 106, 106, 0.7)"
        }}
        onMouseOver={this.props.onMouseOver}
        onMouseLeave={this.props.onMouseOut}
      >
        {this.props.servers.map(server => (
          <ServerEntry
            key={server}
            id={server}
            focusId={this.state.focusId}
            selectedId={this.state.selectedId}
            onClick={this.onClickEntry.bind(this)}
            onMouseOver={this.onMouseOverEntry.bind(this)}
            onMouseOut={this.onMouseLeaveEntry.bind(this)}
          />
        ))}
      </div>
    );
  }
}

class ServerRegion extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.fetchAvailableServers();
  }

  fetchAvailableServers() {
    // TODO: Remove the port and cors. Let express wrapper to pipe the requests where they have to go.
    fetch(
      (use_ssl ? "https://" : "http://") +
        this.props.operatorIp +
        ":8000/serverlist",
      {
        mode: "cors"
      }
    )
      .then(response => response.json())
      .then(data => {
        if (data.servers == undefined) {
          data.servers = [];
        }
        this.setState({ servers: data.servers });
      })
      .catch(err => {
        const mute = err;
      });
  }

  state = {
    mouseOver: false,
    mouseOverExpand: false,
    servers: ["operator.dev.arena.deadbool.com"],
    expand: false,
    focus: undefined
  };

  onClick() {
    // Uncomment if want to play sound here too.
    //this.props.soundManager.playSound(clickSound1, true, true);
  }

  onMouseOver() {
    this.setState({ mouseOver: true, expand: true });
    this.props.soundManager.playSound(mouseOverSound1, true, true);
  }

  onMouseOverExpand() {
    this.setState({ mouseOverExpand: true });
    this.props.soundManager.playSound(mouseOverSound1, true, true);
  }

  onMouseLeaveExpand() {
    this.setState({ mouseOverExpand: false });
    setTimeout(() => this.examine(), 200);
  }

  onMouseLeave() {
    this.setState({ mouseOver: false });
    setTimeout(() => this.examine(), 200);
  }

  examine() {
    this.setState({
      expand: this.state.mouseOver || this.state.mouseOverExpand
    });
  }

  render() {
    let bg = this.state.mouseOver ? "rgb(250, 187, 65)" : "rgb(197, 249, 113)";
    let expandComp = this.state.expand ? (
      <Expand
        servers={this.state.servers}
        onMouseOver={this.onMouseOverExpand.bind(this)}
        onMouseOut={this.onMouseLeaveExpand.bind(this)}
        updateOperatorIp={this.props.updateOperatorIp}
      />
    ) : (
      <div />
    );
    return (
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 400,
          height: 200
        }}
      >
        <div style={lagStyle}>
          {getLagBar(this.props.operatorLag)}
          <div style={lagTextStyle}>
            <table
              style={{
                position: "relative",
                top: 0,
                width: "100%"
              }}
            >
              <tbody>
                <tr>
                  <th>PING:</th>
                  <th>
                    {this.props.operatorLag == undefined
                      ? 999
                      : Math.min(999, this.props.operatorLag)}
                  </th>
                </tr>
                <tr>
                  <th>PLAYERS: </th>
                  <th>{this.props.totalPlayers} </th>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style={totalStyle}>
          <table
            style={{
              position: "relative",
              top: 0,
              width: "100%"
            }}
          >
            <tbody>
              <tr>
                <th>GAMES:</th>
                <th>{this.props.totalGames}</th>
              </tr>
              <tr>
                <th>PLAYERS: </th>
                <th>{this.props.totalPlayers} </th>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          style={{ ...regionStyle, backgroundColor: bg }}
          onMouseEnter={this.onMouseOver.bind(this)}
          onMouseLeave={this.onMouseLeave.bind(this)}
        >
          SERVER: {RegionFromIp(this.props.operatorIp)}
        </div>
        {expandComp}
      </div>
    );
  }
}

export default ServerRegion;
