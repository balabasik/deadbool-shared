import React, { Component } from "react";
import YouTube from "react-youtube";
import { Video } from "./videoManager";
import { GetTime, GetHashFromString, GetRand, DoBoxesOverlap } from "./utils";
import RenderDigitalClock, { RenderAnalogClock } from "./clock";
import { gunWidth, gunHeight } from "./player";

const worldBgStyle = {
  position: "absolute",
  left: 0,
  bottom: 0,
  width: "100%",
  height: "100%",
  backgroundSize: "cover"
};

const renderShadow = false;

const glowPallette = [
  "rgb(255, 104, 94)",
  "rgb(255, 220, 94)",
  "rgb(252, 255, 94)",
  "rgb(94, 255, 96)",
  "rgb(255, 94, 229)",
  "rgb(94, 255, 255)"
];

const fullBoxStyle = {
  position: "absolute",
  left: 0,
  right: 0,
  width: "100%",
  height: "100%"
};

const avaTopStyle1 = {
  position: "absolute",
  left: 0,
  bottom: 5,
  width: 30,
  height: 30
};

const avaTopStyle2 = {
  position: "absolute",
  right: 0,
  bottom: 5,
  width: 30,
  height: 30
};

const avaTopStyleYou = {
  position: "absolute",
  left: "28%",
  bottom: 0,
  width: 50,
  height: 40
};

function getDarkeningFilter(time) {
  let period = 4;
  let frac =
    Math.abs(((time / 1000 / 60) % period) - period / 2) / (period / 2);
  let hue = 180 * frac;
  let bright = 100 - 20 * frac;
  // Uncomment to also use hue.
  // hue-rotate(" + hue + "deg)
  return "brightness(" + bright + "%)";
}

function GetHueFilterFromHash(hash) {
  let hue = (GetHashFromString(hash) % 360) - 180;
  return "hue-rotate(" + hue + "deg)";
}

function getColorFromRatio(ratio) {
  return ratio > 70
    ? "rgb(152, 237, 120)"
    : ratio > 30
    ? "rgb(255, 253, 134)"
    : "rgb(250, 72, 72)";
}

class GameWorld extends Component {
  constructor(props) {
    super(props);
    this.perkBumpTime = {};
  }

  renderPlayer(key) {
    // TODO: Put our player on top.
    if (key == "shadow" && !renderShadow) return "";
    let player = this.props.gameState.players[key];

    if (player.stats.isDead) return <div key={player.id} />;
    if (player.stats.invisible && player.id != this.props.gameState.thisPlayer)
      return <div key={player.id} />;

    // Make player a bit transparent to indicate invisibility is working.
    let opacity = player.stats.invisible || player.id == "shadow" ? 0.5 : 1;

    let playerX = player.getLeftX();
    let playerY = player.getBottomY();

    if (
      player.stats.fakeEye.active &&
      player.id != this.props.gameState.thisPlayer
    ) {
      playerX += player.stats.fakeEye.x;
      playerY += player.stats.fakeEye.y;
    }

    let playerW = player.getW();
    let playerH = player.getH();

    // TODO: Should we exclude our player from the optimization just in case?
    if (this.noOverlap(playerX, playerY, playerW, playerH))
      return <div key={player.id} />;

    let avatarSrc = "./avatars_and_guns/avatar_" + player.avatar + ".png";
    let gunSrc =
      "./avatars_and_guns/gun_" + player.stats.activeGun + "_center.png";

    let gunW = gunWidth * player.geometry.transform.scaleX;
    let gunH = gunHeight * player.geometry.transform.scaleX; // NOTE: This is not a typo, scale is decided by X

    let gunX = player.getPivotX() - gunW / 2; // these are gun's h and w
    let gunY = player.getPivotY() - gunH / 2;

    let aim = player.stats.mouseAngle;
    if (
      player.stats.overwriteMouseAngle.active &&
      player.stats.overwriteMouseAngle.id in this.props.gameState.players
    )
      aim = this.props.gameState.players[player.stats.overwriteMouseAngle.id]
        .stats.mouseAngle;
    let gunTransform = "rotate(" + Math.floor(-aim) + "deg)";
    let mirrorPlayerX = 1;
    let mirrorPlayerY = 1;
    if (aim > 90 && aim <= 270) {
      gunTransform += " scaleY(-1)";
      mirrorPlayerX = -1;
    }
    if (this.props.gameState.physicsStats.gravityG <= 0) mirrorPlayerY = -1;
    // NOTE: Scale is taken care of by size of the image.
    let playerTransform =
      "scaleX(" + mirrorPlayerX + ")" + " scaleY(" + mirrorPlayerY + ")";
    let hpRatio =
      Math.max(
        0,
        Math.min(player.stats.hp, player.stats.maxhp) / player.stats.maxhp
      ) * 100;
    let upperBar = (
      <div
        style={{
          position: "absolute",
          left: -playerW * 0.1,
          bottom:
            this.props.gameState.physicsStats.gravityG > 0 ? playerH + 5 : -25,
          width: playerW * 1.2,
          height: 20,
          fontFamily: "Arial Black",
          fontSize: "15px",
          textAlign: "center",
          overflow: "hidden",
          border: "solid 1px black",
          backgroundColor: "white"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            backgroundColor: getColorFromRatio(hpRatio),
            height: "100%",
            width: hpRatio + "%"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: player.playerName.length * 10 <= playerW * 1.2 ? "50%" : 0,
            transform:
              player.playerName.length * 10 <= playerW * 1.2
                ? "translateX(-50%)"
                : "",
            marginTop: "-2px"
          }}
        >
          {player.playerName}
        </div>
      </div>
    );

    let lightningDiv = this.props.gameState.physicsStats.lightningActive ? (
      <div
        style={{
          ...avaTopStyle2,
          backgroundSize: "100% 100%",
          backgroundImage: "url(perks/ava_top_lightning.png)"
        }}
      />
    ) : (
      ""
    );

    let youtubeDiv =
      this.props.gameState.physicsStats.youtube.activeYoutubePlayer ==
      player.id ? (
        <div
          style={{
            ...avaTopStyleYou,
            backgroundSize: "100% 100%",
            backgroundImage: "url(perks/ava_top_youtube1.png)"
          }}
        />
      ) : (
        ""
      );

    let affectingDiv =
      Object.keys(player.stats.affectingSpells).length == 0 ? (
        ""
      ) : (
        <div
          style={{
            ...avaTopStyle1,
            backgroundSize: "100% 100%",
            backgroundImage: "url(perks/ava_top_under_influence.png)"
          }}
        />
      );

    let magicBar = (
      <div
        style={{
          position: "absolute",
          left: -playerW * 0.1,
          bottom:
            this.props.gameState.physicsStats.gravityG > 0
              ? playerH + 25
              : -25 - 25,
          width: playerW * 1.2,
          height: 50,
          overflow: "hidden"
        }}
      >
        {youtubeDiv}
        {affectingDiv}
        {lightningDiv}
      </div>
    );

    let shadowColor = "rgb(87, 240, 89)";
    // Hiding for everyone except Rick
    let hideBars =
      this.props.gameState.physicsStats.pickleRick != "" &&
      this.props.gameState.physicsStats.pickleRick !=
        this.props.gameState.thisPlayer;

    if (hideBars) {
      magicBar = "";
      upperBar = "";
    }

    let gun = (
      <img
        src={gunSrc}
        style={{
          position: "absolute",
          left: gunX,
          bottom: gunY,
          width: gunW,
          height: gunH,
          transform: gunTransform
        }}
      />
    );
    // TODO: Truck has different size from pickle.
    if (player.stats.truckMode) {
      avatarSrc = "./avatars_and_guns/avatar_optimus_truck.png";
      gun = "";
    } else if (this.props.gameState.physicsStats.pickleRick != "") {
      if (
        key == this.props.gameState.thisPlayer ||
        this.props.gameState.physicsStats.pickleRick !=
          this.props.gameState.thisPlayer
      )
        // NOTE: Other see everyone as pickles, but player who executed it only sees himself as pickle.
        avatarSrc = "./avatars_and_guns/avatar_rick_pickle.png";
    }

    let mask = "";
    if (player.stats.quadDamage || player.stats.unbreakable) {
      let color = player.stats.quadDamage
        ? "rgb(84, 215, 250)"
        : "rgb(255, 0, 0)";
      mask = (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: playerW,
            height: playerH,
            backgroundColor: color,
            filter: "opacity(0.6)",
            WebkitMaskImage: `url(${avatarSrc})`,
            WebkitMaskMode: "alpha",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskSize: `${playerW}px ${playerH}px`,
            WebkitMaskPosition: "0 0",
            transform: playerTransform
          }}
        />
      );
    }

    return (
      <div
        key={player.id}
        style={{
          position: "absolute",
          left: Math.floor(playerX),
          bottom: Math.floor(playerY),
          opacity: opacity
        }}
      >
        {upperBar}
        {magicBar}
        <img
          src={avatarSrc}
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: playerW,
            height: playerH,
            transform: playerTransform
          }}
        />
        {mask}
        {gun}
      </div>
    );
  }

  getGlowColorFromHash(hash) {
    let id = GetHashFromString(hash) % glowPallette.length;
    if (id < 0) id += glowPallette.length;
    return glowPallette[id];
  }

  renderPerks(key) {
    let perk = this.props.gameState.perks[key].stats;

    if (this.noOverlap(perk.position[0], perk.position[1], perk.w, perk.h))
      return "";

    let perkSrc = "./perks/perk_" + perk.type + ".png";
    let time = GetTime();
    if (this.perkBumpTime[key] == undefined) this.perkBumpTime[key] = time;
    let timeSinceBump = time - this.perkBumpTime[key];
    let left = Math.floor(perk.position[0]);
    let speedY = 0.04;
    let period = 700; // ms
    let shiftY =
      speedY * timeSinceBump -
      (speedY / period) * timeSinceBump * timeSinceBump;
    shiftY = Math.max(0, shiftY);
    if (shiftY == 0) this.perkBumpTime[key] = time;
    let bottom = Math.floor(perk.position[1]) + shiftY;
    let scale = 1;
    let width = perk.w * scale;
    let height = perk.h / scale;
    let glow = this.props.systemOptions.dynamicActive
      ? "drop-shadow(0px 0px 20px " + this.getGlowColorFromHash(perk.id) + ")"
      : "";
    return (
      <div
        key={perk.id}
        style={{
          position: "absolute",
          left,
          bottom,
          width,
          height
        }}
      >
        <img
          src={perkSrc}
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            WebkitFilter: glow
          }}
        />
      </div>
    );
  }

  renderBullet(key) {
    let bullet = this.props.gameState.bullets[key].stats;

    if (
      this.noOverlap(
        Math.floor(bullet.curX - bullet.curSizeX / 2),
        Math.floor(bullet.curY - bullet.curSizeY / 2),
        bullet.curSizeX,
        bullet.curSizeY
      )
    )
      return "";

    let bulletTransform = bullet.rotatable
      ? "rotate(" + -bullet.curAngle + "deg)"
      : "";
    // Hue is based on the player's id
    let filter = bullet.flexColor
      ? GetHueFilterFromHash(bullet.firePlayer)
      : "";

    let content =
      bullet.src == "" ? (
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            left: 0,
            top: 0
          }}
        >
          {bullet.content}
        </div>
      ) : (
        <img
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            left: 0,
            top: 0,
            filter: filter
          }}
          src={bullet.src}
        />
      );
    return (
      <div
        key={bullet.id}
        style={{
          ...bullet.extraStyle,
          position: "absolute",
          left: Math.floor(bullet.curX - bullet.curSizeX / 2),
          bottom: Math.floor(bullet.curY - bullet.curSizeY / 2),
          width: bullet.curSizeX,
          height: bullet.curSizeY,
          transform: bulletTransform,
          fontFamily: "Arial Black",
          fontSize: bullet.curSizeX,
          textAlign: "center"
        }}
      >
        {content}
      </div>
    );
  }

  renderLight(light) {
    if (light == undefined) return "";
    let style = light.getStyle(this.props.gameState.timeStamp);
    if (this.noOverlap(style.left, style.bottom, style.width, style.height))
      return "";
    return <div key={light.id} style={style} />;
  }

  renderFan(fan) {
    if (fan == undefined) return "";
    let style = fan.getStyle(this.props.gameState.timeStamp);
    if (this.noOverlap(style.left, style.bottom, style.width, style.height))
      return "";
    return <div style={style} />;
  }

  noOverlapBox(box) {
    return this.noOverlap(
      Math.floor(box.getLeftX(this.props.gameState.timeStamp)),
      Math.floor(box.getBottomY(this.props.gameState.timeStamp)),
      Math.floor(box.getW()),
      Math.floor(box.getH())
    );
  }

  renderBox(key) {
    let box = this.props.gameState.boxes[key];
    // NOTE: Boxes are mostly static and there is no reason to release the resources.
    //if (this.noOverlapBox(box)) return "";
    if (box.stats.type == "digital_clock") {
      if (box.stats.extra.timerId == undefined)
        return RenderDigitalClock(box, this.props.gameState.timeStamp);
      else
        return RenderDigitalClock(
          box,
          this.props.gameState.timers[box.stats.extra.timerId] == undefined
            ? 0
            : this.props.gameState.timers[box.stats.extra.timerId].stats.cur
        );
    } else if (box.stats.type == "analog_clock") {
      if (box.stats.extra.timerId == undefined)
        return RenderAnalogClock(box, this.props.gameState.timeStamp);
      else
        return RenderAnalogClock(
          box,
          this.props.gameState.timers[box.stats.extra.timerId] == undefined
            ? 0
            : this.props.gameState.timers[box.stats.extra.timerId].stats.cur,
          true /* reverse*/
        );
    }
    let mirror =
      !box.isMovingForward(this.props.gameState.timeStamp) &&
      box.stats.extra != undefined &&
      box.stats.extra.mirrorOnWayBack == true;
    let transform = mirror ? "scaleX(-1)" : "";
    return (
      <div
        key={box.stats.id}
        style={{
          transform,
          ...box.stats.style,
          position: "absolute",
          left: Math.floor(box.getLeftX(this.props.gameState.timeStamp)),
          bottom: Math.floor(box.getBottomY(this.props.gameState.timeStamp)),
          width: Math.floor(box.getW()),
          height: Math.floor(box.getH())
        }}
      />
    );
  }

  noOverlap(leftX, bottomY, w, h) {
    return !DoBoxesOverlap(
      -this.props.worldLeftX,
      -this.props.worldBottomY,
      -this.props.worldLeftX + this.props.gameState.frameWidth,
      -this.props.worldBottomY + this.props.gameState.frameHeight,
      leftX,
      bottomY,
      leftX + w,
      bottomY + h
    );
  }

  renderVideo(key) {
    let video = this.props.videoManager.videos[key];
    if (this.noOverlap(video.x, video.y, video.w, video.h)) return "";
    return (
      <Video
        key={key}
        options={video}
        onVideoStopped={id => this.props.videoManager.removeVideo(id)}
        nextFrame={id => this.props.videoManager.nextFrame(id)}
      />
    );
  }

  setIframeMute(newValue) {
    if (this.iframeMute == undefined || this.iframeMute != newValue) {
      this.iframeMute = newValue;
    }
  }

  renderIframe() {
    // NOTE: Iframe takes about 15-20% CPU when enabled.
    if (!this.props.systemOptions.music) return "";
    if (
      this.props.gameState.physicsStats.youtube.activeLink == "" ||
      this.props.gameState.physicsStats.youtube.activeLink == undefined
    )
      return "";

    // NOTE: Iframe is not optimized, as if we stop rendering it will restart youtube video.
    let box = this.props.gameState.iframeBox;
    let innerYoutubeStyle = {
      position: "absolute",
      left: 0,
      top: 0,
      marginLeft: 0,
      marginTop: 0,
      width: "100%",
      height: "100%",
      transform: "scale(1.05)"
    };
    return (
      <div
        style={{
          position: "absolute",
          left: box.getLeftX(),
          bottom: box.getBottomY(),
          width: box.getW(),
          height: box.getH(),
          overflow: "hidden"
        }}
      >
        <iframe
          style={innerYoutubeStyle}
          key="youtube1"
          ref={c => {
            this.iframeRef = c;
          }}
          src={
            // TODO: Right now we only support looped videos/playlists.
            // TODO: Take ads into account.
            // NOTE: Youtube will start video from start if "start" is over video length.
            this.props.gameState.physicsStats.youtube.activeLink +
            "?autoplay=1&rel=0&modestbranding=1&autohide=1&showinfo=0&controls=0&cc_load_policy=3&loop=1&" +
            "start=" +
            this.props.gameState.physicsStats.youtube.initTime +
            "&mute=" +
            (this.props.systemOptions.music ? "0" : "1")
          }
          frameBorder="0"
          allowFullScreen={true}
          allow="autoplay"
          volume={this.props.systemOptions.music ? "1" : "0"}
        />
        <div style={innerYoutubeStyle} />
      </div>
    );
  }

  getShadow() {
    let xShadow =
      30 + (150 * this.props.worldLeftX) / this.props.gameState.worldWidth;
    let yShadow =
      -20 - (120 * this.props.worldBottomY) / this.props.gameState.worldHeight;
    return this.props.systemOptions.dynamicActive
      ? {
          WebkitFilter: `drop-shadow(${xShadow}px ${yShadow}px 2px rgba(0,0,0,0.4))`
        }
      : {};
  }

  render() {
    let filter = this.props.gameState.physicsStats.dark.active
      ? this.props.gameState.physicsStats.dark.caster !=
        this.props.gameState.thisPlayer
        ? "brightness(10%)"
        : "brightness(50%)"
      : "";

    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          filter: filter
        }}
      >
        <img
          src={this.props.gameState.mapStyle.front}
          style={{
            ...worldBgStyle,
            position: "absolute",
            backgroundSize: "cover",
            width: this.props.gameState.worldWidth * 0.95,
            height: this.props.gameState.worldHeight,
            left:
              this.props.worldLeftX * 0.88 +
              (this.props.gameState.zoomOut - 1.5) * 120,
            bottom: this.props.worldBottomY,
            transform:
              "scaleX(" +
              ((this.props.gameState.zoomOut - 1.5) * 0.048 + 1) +
              ")"
          }}
        />
        <div
          style={{
            position: "absolute",
            width: this.props.gameState.worldWidth,
            height: this.props.gameState.worldHeight,
            left: this.props.worldLeftX,
            bottom: this.props.worldBottomY
          }}
        >
          <div
            style={{
              ...fullBoxStyle,
              ...this.getShadow()
            }}
          >
            {this.props.gameState.backlights.map(light =>
              this.renderLight(light)
            )}
            {Object.keys(this.props.gameState.boxes).map(key =>
              this.renderBox(key)
            )}
            {this.renderIframe()}
            {this.props.gameState.lights.map(light => this.renderLight(light))}
            {this.renderFan(this.props.gameState.fan)}
            {Object.keys(this.props.gameState.players).map(key =>
              this.renderPlayer(key)
            )}
            {Object.keys(this.props.gameState.perks).map(key =>
              this.renderPerks(key)
            )}
            {Object.keys(this.props.gameState.bullets).map(key =>
              this.renderBullet(key)
            )}
            {Object.keys(this.props.videoManager.videos).map(key =>
              this.renderVideo(key)
            )}
          </div>
        </div>
      </div>
    );
  }
}

class GameFrame extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <img
          src={this.props.gameState.mapStyle.back}
          style={{
            position: "absolute",
            left: 0,
            bottom: 30,
            width: "100%",
            height: "95%",
            backgroundSize: "cover",
            filter: "saturate(60%)"
          }}
        />
        <GameWorld
          gameState={this.props.gameState}
          videoManager={this.props.videoManager}
          worldLeftX={this.props.worldLeftX}
          worldBottomY={this.props.worldBottomY}
          systemOptions={this.props.systemOptions}
        />
      </div>
    );
  }
}

export default GameFrame;
