import React, { Component } from "react";
import { RandomString, GetTime, GetNaturalArrayWZero } from "./utils";

class VideoProps {
  constructor() {
    this.id = "";
    this.type = "alpha"; // alpha, png, video
    this.x = 0;
    this.y = 0;
    this.w = 100;
    this.h = 100;
    this.src = "";
    this.duration = 1000; // ms
    this.frame = 0;
    this.maxFrame = 0;
    this.fps = 25;
    this.active = false;
    this.removeAfterFinished = true;
  }
}

class VideoManager {
  constructor(onStateUpdate) {
    this.videos = {};
    this.onStateUpdate = onStateUpdate;
    this.nextFrameTimeout = {};
  }

  addVideo(videoProps) {
    if (videoProps.id == undefined) videoProps.id = RandomString();
    // If video is currently being used then we do not start it.
    // TODO: Add a retry for short videos.
    if (videoProps.id in this.videos && this.videos[videoProps.id].active)
      return;

    this.videos[videoProps.id] = videoProps;

    if (videoProps.type == "png") {
      this.videos[videoProps.id].active = true;
      this.videos[videoProps.id].frame = -1;
      this.frameUpdate(videoProps.id);
    } else {
      this.onStateUpdate();
    }
    // Just in case also adding remove video timeout here
    setTimeout(this.stopVideo.bind(this, videoProps.id), videoProps.duration);
  }

  frameUpdate(id) {
    let video = this.videos[id];
    if (video == undefined) return;
    if (!video.active) return;
    if (video.frame >= video.maxFrame) {
      this.stopVideo(id);
      return;
    }
    video.frame++;
    this.onStateUpdate();
    this.nextFrameTimeout[id] = setTimeout(
      () => this.frameUpdate(id),
      Math.max(0, 1000 / video.fps)
    ); // ms
  }

  clearTimeouts(id) {
    if (this.nextFrameTimeout[id] != undefined) {
      clearTimeout(this.nextFrameTimeout[id]);
      this.nextFrameTimeout[id] = undefined;
    }
  }

  stopVideo(id) {
    if (this.videos[id] == undefined) return;
    if (this.videos[id].removeAfterFinished) delete this.videos[id];
    else if (!this.videos[id].active) return;
    else {
      this.videos[id].frame = -1;
      this.videos[id].active = false;
      this.clearTimeouts(id);
    }
    this.onStateUpdate();
  }
}

class Video extends Component {
  constructor(props) {
    super(props);
    this.frames = [];
    if (this.props.options.type == "png")
      this.frames = GetNaturalArrayWZero(this.props.options.maxFrame + 1);
  }

  componentDidMount() {}

  componentWillReceiveProps(props) {
    if (this.props.options.maxFrame != props.options.maxFrame)
      this.frames = GetNaturalArrayWZero(props.options.maxFrame + 1);
  }

  componentWillUnmount() {}

  render() {
    if (!this.props.options.active) return <div key={this.props.options.id} />;
    if (this.props.type == "video") {
      return (
        <div key={this.props.options.id}>
          <video
            ref={c => (this.videoRef = c)}
            style={{
              position: "absolute",
              left: this.props.options.x,
              bottom: this.props.options.y,
              width: this.props.options.w,
              height: this.props.options.h
            }}
            src={this.props.options.src}
            autoPlay
          />
        </div>
      );
    } else {
      //if (this.props.type == "png") {

      // NOTE: We had to do it this way because images take time to load and
      // for fast changing image sequence it is working very badly.
      // In production try1 works better, but only for small number of images.

      // TODO: This only works for small number of frames in a video.
      let try1 = (
        <div key={this.props.options.id}>
          {this.frames.map(i => {
            return this.props.options.frame != i ? (
              ""
            ) : (
              <img
                key={"bullet_" + i}
                ref={c => (this.videoRef = c)}
                style={{
                  position: "absolute",
                  left: this.props.options.x,
                  bottom: this.props.options.y,
                  width: this.props.options.w,
                  height: this.props.options.h
                }}
                src={this.props.options.src + "_" + i + ".png"}
              />
            );
          })}
        </div>
      );

      let try2 = (
        <div key={this.props.options.id}>
          <img
            ref={c => (this.videoRef = c)}
            style={{
              position: "absolute",
              left: this.props.options.x,
              bottom: this.props.options.y,
              width: this.props.options.w,
              height: this.props.options.h
            }}
            src={
              this.props.options.src + "_" + this.props.options.frame + ".png"
            }
          />
        </div>
      );

      return this.props.options.maxFrame < 10 ? try1 : try2;
    }
  }
}

export default VideoManager;
export { VideoProps, Video };
