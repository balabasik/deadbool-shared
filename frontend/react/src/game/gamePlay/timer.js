class Timer {
  constructor(dur, initTimeStamp, onZero) {
    this.stats = {
      initTimeStamp: initTimeStamp,
      dur: dur,
      cur: dur
    };
    this.onZero = onZero;
  }
  reset(timeStamp) {
    this.stats.initTimeStamp = timeStamp;
    this.stats.cur = this.stats.dur;
  }
  update(timeStamp) {
    if (this.stats.cur == 0) return;
    this.stats.cur = this.stats.dur - (timeStamp - this.stats.initTimeStamp);
    if (this.stats.cur < 0) this.stats.cur = 0;
    if (this.stats.cur == 0) this.onZero();
  }
}
export default Timer;
