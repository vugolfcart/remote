import React, { Component } from 'react';

export default class VideoStream extends Component {
  render() {
    return (
      <div id="camera-stream-container" className="stream-container">
        <img
          className="stream-image"
          src="http://localhost:8080/stream?topic=zed/rgb/image_rect_color"
          alt="Camera View"
        />
      </div>
    );
  }
}

// Topic: zed/rgb/image_rect_color
