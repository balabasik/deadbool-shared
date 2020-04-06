import { RandomString } from "./utils";

class Light {
  constructor(radius, x, y, pattern, initTimeStamp) {
    this.id = RandomString();
    this.radius = radius;
    this.centerX = x;
    this.centerY = y;
    this.pattern = pattern;
    this.initTimeStamp = initTimeStamp;
    this.period = 0;
    this.pattern.map(entry => (this.period += entry.time));
  }

  getStyle(timeStamp) {
    let elapsed = Math.max(0, timeStamp - this.initTimeStamp) % this.period;
    // TODO: We can fill up the array with partial sums, and do binary search here.
    let color = undefined;
    for (let i = 0; i < this.pattern.length; i++) {
      elapsed -= this.pattern[i].time;
      if (elapsed < 0) {
        color = this.pattern[i].color;
        break;
      }
    }
    if (color == undefined) color = this.pattern[0].color;
    return {
      position: "absolute",
      bottom: this.centerY - this.radius,
      left: this.centerX - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
      borderRadius: this.radius,
      backgroundColor: color,
      border: "2px solid rgb(34, 34, 45)"
      // NOTE: This looks pretty, but webkit slows down everything
      //WebkitFilter: `drop-shadow(0px 0px ${this.radius}px ${color})`
    };
  }
}

class Fan {
  constructor(radius, x, y, freq, perspAngle, initTimeStamp, src) {
    this.radius = radius;
    this.centerX = x;
    this.centerY = y;
    this.freq = freq;
    this.initTimeStamp = initTimeStamp;
    this.perspAngle = perspAngle;
    this.src = src;
  }

  getStyle(timeStamp) {
    let elapsed = Math.max(0, timeStamp - this.initTimeStamp);
    let rotate = ((elapsed / 1000) * this.freq * 360) % 360;

    return {
      position: "absolute",
      bottom: this.centerY - this.radius,
      left: this.centerX - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
      transform:
        "rotateY(" + this.perspAngle + "deg) rotateZ(" + rotate + "deg)",
      backgroundImage: `url(${this.src})`,
      backgroundSize: "contain"
    };
  }
}

export default Light;
export { Fan };
