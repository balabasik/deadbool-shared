import Box from "./box";
import Geometry from "./geometry";
import React from "react";

function RenderDigitalClock(box, timeStamp) {
  if (box.stats.type != "digital_clock") return <div />;
  let secs = Math.round(timeStamp / 1000) % 60;
  let mins = ((Math.round(timeStamp / 1000) - secs) / 60) % 60;

  if (secs < 10) secs = "0" + secs;
  if (mins < 10) mins = "0" + mins;
  return (
    <div
      key={box.stats.id}
      style={{
        position: "absolute",
        left: box.getLeftX(),
        bottom: box.getBottomY(),
        width: box.getW(),
        height: box.getH()
      }}
    >
      <img
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: "100%"
        }}
        src={box.stats.extra.src}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          marginTop: Math.round((-box.stats.extra.clockFont * 3) / 4) + "px",
          width: "50%",
          height: "100%",
          fontFamily: "Arial Black",
          fontSize: box.stats.extra.clockFont + "px",
          textAlign: "center",
          overflow: "hidden",
          verticalAlign: "middle",
          color: "rgb(3, 47, 38)"
        }}
      >
        {mins}
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          marginTop: Math.round((-box.stats.extra.clockFont * 3) / 4) + "px",
          width: "50%",
          height: "100%",
          fontFamily: "Arial Black",
          fontSize: box.stats.extra.clockFont + "px",
          textAlign: "center",
          overflow: "hidden",
          verticalAlign: "middle",
          color: "rgb(3, 47, 38)"
        }}
      >
        {secs}
      </div>
    </div>
  );
}

function RenderAnalogClock(box, timeStamp, reverse) {
  if (box.stats.type != "analog_clock") return "";
  let secs = Math.round(timeStamp / 1000) % 60;
  let mins = ((Math.round(timeStamp / 1000) - secs) / 60) % 60;

  let secsAngle = secs * 6 + "deg";
  let minsAngle = mins * 6 + "deg";
  // For timers we reverse colors as well.
  let filter = reverse ? "invert(0.9) brightness(1.5) hue-rotate(-90deg)" : "";
  return (
    <div
      key={box.stats.id}
      style={{
        position: "absolute",
        left: box.getLeftX(),
        bottom: box.getBottomY(),
        width: box.getW(),
        height: box.getH(),
        transform:
          "scaleX(" + (reverse != undefined && reverse == true ? "-1)" : "1)"),
        filter: filter
      }}
    >
      <img
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: "100%"
        }}
        src={box.stats.extra.src[0]}
      />
      <img
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          transform: "rotate(" + minsAngle + ")"
        }}
        src={box.stats.extra.src[1]}
      />
      <img
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          transform: "rotate(" + secsAngle + ")"
        }}
        src={box.stats.extra.src[2]}
      />
    </div>
  );
}
export default RenderDigitalClock;
export { RenderAnalogClock };
