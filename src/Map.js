import React, { Component } from 'react';

export default class Map extends Component {
  render() {
    return (
      <div id="map-stream-container" className="stream-container">
        <img
          className="stream-image"
          src="http://placehold.jp/1000x1000.png?text=Map%20View"
          alt="Map"
        />
      </div>
    );
  }
}
