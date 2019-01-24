import React, { Component } from 'react';

export default class VideoStream extends Component {
  render() {
    return (
      <div id="camera-stream-container" className="stream-container">
        <img
          className="stream-image"
          src="http://placehold.jp/1000x1000.png?text=Camera%20View"
          alt="Camera View"
        />
      </div>
    );
  }
}
