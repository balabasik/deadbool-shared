import Geometry from "./geometry";
import { IntersectLines, GetAngle, RandomString } from "./utils";

class Bullet {
  constructor(stats) {
    if (stats.type != 1) stats.type = 0; // default is 0
    let type = stats.type;
    this.stats = {
      id: RandomString(),
      type: type, // bullet type
      src: "avatars_and_guns/bullet_" + type + ".png", // TODO: maybe optimize strings here
      content: "",
      strength: type == 0 ? 10 : 80, // 10/80 hp per hit
      explosionRadius: type == 0 ? 0 : 100,
      weight: type == 0 ? 0 : 0.2, // heavier the bullet more it is affected by gravity
      firePlayer: "",
      fireTime: 0,
      killer: "", // this could be different from the firePlayer sometimes
      timeToExplode: 10000, //miliseconds to live, default 10s
      overwriteSelfBulletsByServer: false, // client does not overwrite this players bullets
      hitManyPlayers: false, // after hitting one player bullet keeps moving

      goThroughWalls: false,
      flexColor: true,
      extraStyle: {
        color: "",
        backgroundColor: "",
        borderRadius: "",
        boxShadow: ""
      },

      // coordinates of the center of a bullet for simplicity
      curX: 0,
      curY: 0,

      prevX: 0,
      prevY: 0,

      isStopped: false,

      curSpeed: type == 0 ? 0.9 : 1,
      // in degrees from 0 to 360
      curAngle: 0,

      curSizeX: type == 0 ? 20 : 50,
      curSizeY: type == 0 ? 20 : 30,

      // if to rotate the image
      rotatable: true,

      horizontalBounceDampFactor: 1,
      verticalBounceDampFactor: type == 0 ? 1 : 0.8,
      bounceFromWalls: false
    };

    if (stats != undefined) {
      for (let k in stats) {
        this.stats[k] = stats[k];
      }
    }
  }

  bounce(xLeft, yBottom, xRight, yTop, bouncable) {
    if (bouncable == undefined) {
      bouncable = { left: true, right: true, top: true, bottom: true };
    }

    let retValue = false;

    // intersect with 4 walls
    if (
      bouncable.bottom &&
      this.stats.curAngle > 0 &&
      this.stats.curAngle < 180
    ) {
      let bottom = IntersectLines(
        this.stats.prevX,
        this.stats.prevY,
        this.stats.curX,
        this.stats.curY,
        xLeft,
        yBottom,
        xRight,
        yBottom
      );
      if (bottom.intersect) {
        this.stats.prevX = bottom.x;
        this.stats.prevY = bottom.y;
        this.stats.curY =
          bottom.y -
          (this.stats.curY - bottom.y) * this.stats.verticalBounceDampFactor;
        this.stats.curX = bottom.x + (this.stats.curX - bottom.x) * 1;
        let speedX =
          this.stats.curSpeed * Math.cos(this.stats.curAngle / 57.325);
        let speedY =
          -this.stats.curSpeed *
          Math.sin(this.stats.curAngle / 57.325) *
          this.stats.verticalBounceDampFactor;
        this.stats.curSpeed = Math.sqrt(speedX * speedX + speedY * speedY);
        this.stats.curAngle = GetAngle(speedX, 0, speedY, 0);
        retValue = true;
      }
    }

    if (bouncable.top && this.stats.curAngle > 180) {
      let top = IntersectLines(
        this.stats.prevX,
        this.stats.prevY,
        this.stats.curX,
        this.stats.curY,
        xLeft,
        yTop,
        xRight,
        yTop
      );
      if (top.intersect) {
        this.stats.prevX = top.x;
        this.stats.prevY = top.y;
        this.stats.curY =
          top.y +
          (top.y - this.stats.curY) * this.stats.verticalBounceDampFactor;
        this.stats.curX = top.x + (this.stats.curX - top.x) * 1;
        let speedX =
          this.stats.curSpeed * Math.cos(this.stats.curAngle / 57.325);
        let speedY =
          -this.stats.curSpeed *
          Math.sin(this.stats.curAngle / 57.325) *
          this.stats.verticalBounceDampFactor;
        this.stats.curSpeed = Math.sqrt(speedX * speedX + speedY * speedY);
        this.stats.curAngle = GetAngle(speedX, 0, speedY, 0);
        retValue = true;
      }
    }

    if (
      bouncable.left &&
      !(this.stats.curAngle >= 90 && this.stats.curAngle <= 270)
    ) {
      let left = IntersectLines(
        this.stats.prevX,
        this.stats.prevY,
        this.stats.curX,
        this.stats.curY,
        xLeft,
        yBottom,
        xLeft,
        yTop
      );
      if (left.intersect) {
        this.stats.prevX = left.x;
        this.stats.prevY = left.y;
        this.stats.curX =
          left.x -
          (this.stats.curX - left.x) * this.stats.horizontalBounceDampFactor;
        this.stats.curY = left.y + (this.stats.curY - left.y) * 1;
        let speedX =
          -this.stats.curSpeed *
          Math.cos(this.stats.curAngle / 57.325) *
          this.stats.horizontalBounceDampFactor;
        let speedY =
          this.stats.curSpeed * Math.sin(this.stats.curAngle / 57.325);
        this.stats.curSpeed = Math.sqrt(speedX * speedX + speedY * speedY);
        this.stats.curAngle = GetAngle(speedX, 0, speedY, 0);
        retValue = true;
      }
    }

    if (
      bouncable.right &&
      this.stats.curAngle > 90 &&
      this.stats.curAngle < 270
    ) {
      let right = IntersectLines(
        this.stats.prevX,
        this.stats.prevY,
        this.stats.curX,
        this.stats.curY,
        xRight,
        yBottom,
        xRight,
        yTop
      );
      if (right.intersect) {
        this.stats.prevX = right.x;
        this.stats.prevY = right.y;
        this.stats.curX =
          right.x +
          (right.x - this.stats.curX) * this.stats.horizontalBounceDampFactor;
        this.stats.curY = right.y + (this.stats.curY - right.y) * 1;
        let speedX =
          -this.stats.curSpeed *
          Math.cos(this.stats.curAngle / 57.325) *
          this.stats.horizontalBounceDampFactor;
        let speedY =
          this.stats.curSpeed * Math.sin(this.stats.curAngle / 57.325);
        this.stats.curSpeed = Math.sqrt(speedX * speedX + speedY * speedY);
        this.stats.curAngle = GetAngle(speedX, 0, speedY, 0);
        retValue = true;
      }
    }
    return retValue;
  }
}

export default Bullet;
