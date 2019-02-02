import './App.css';
import Map from './Map';
import React, { Component } from 'react';
import ROSLIB from 'roslib';
import steeringWheel from './assets/steering-wheel.png';
import VideoStream from './VideoStream';

class App extends Component {
  constructor(props) {
    super(props);
    this.ros = new ROSLIB.Ros({ url: 'ws://10.67.248.128:9090' });
    this.ros.on('connection', () => console.log('[ros]: connected to websocket server.'));
    this.ros.on('error', error => console.error(`[ros]: error connecting to websocket server: ${error}`));
    this.ros.on('close', () => console.log('Connection to websocket server closed.'));
    this.controlDriveParameters = new ROSLIB.Topic({
      ros: this.ros,
      name: '/vugc1_control_drive_parameters',
      messageType: 'vugc1_control/drive_param'
    });

    this.maxSpeed = 100;
    this.maxWheelAngle = 4 * Math.PI;// radians

    this.wheelElement = React.createRef();

    this.state = {
      brake: false,
      gas: false,
      speed: 0,
      direction: 1, // 1 = forward, -1 = reverse
      wheelTurn: {
        startAngle: 0, // radians
        active: false,
        rotation: 0, // radians
      },
      currentAngle: 0, // radians
      totalRotation: 0, // radians
      powersteering: true, // wheel turns back to 0 when let go
      autoTurning: false, // wheel is currently turning by itself
    };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        this.gas();
        break;
      case 'ArrowDown':
      case 's':
        this.brake();
        break;
      case 'e':
         if (this.state.speed === 0)
            this.setState({ direction: -this.state.direction })
        break;
      case 'q':
        this.setState({ speed: 0 });
        break;
      case 'p':
         this.setState({ powersteering: !this.state.powersteering });;
         break;
      default:
        break;
    }
  }

  handleKeyUp = (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        this.stopGas();
        break;
      case 'ArrowDown':
      case 's':
        this.stopBrake();
        break;
      default:
        break;
    }
  }

  gas = (e) => {
    if (e) e.preventDefault();

    // TODO: remove this later -- but useful for driving the RC car
    // Increases speed when gas is pressed
    //==============================================================================================
    if (Math.abs(this.state.speed) <= this.maxSpeed) {
      let newSpeed = this.state.speed / Math.abs(this.state.speed) + this.state.speed;
      if (this.state.speed === 0)
         newSpeed = this.state.direction;
      this.setState({ speed: newSpeed });
    }
    //==============================================================================================

    if (this.state.brake) { // turn off brake if gas is pressed while brake is pressed
      this.stopBrake();
      this.setState({ brake: false });
    }
    if (!this.state.gas) {
      this.setState({ gas: true }); // turn on gas
    }
  }

  stopGas = (e) => {
    if (e) e.preventDefault();

    if (this.state.gas) {
      this.setState({ gas: false });
    }
  }

  brake = (e) => {
    if (e) e.preventDefault();

    // TODO: remove this later -- but useful for driving the RC car
    // Decreases speed when brake is pressed
    //==============================================================================================
    if (this.state.speed !== 0)
      this.setState({ speed: (0 - this.state.speed) / Math.abs(this.state.speed) + this.state.speed });
    //==============================================================================================


    if (this.state.gas) { // turn off gas if brake is pressed
      this.stopGas();
      this.setState({ gas: false });
    }
    if (!this.state.brake) {
      this.setState({ brake: true });
    }
  }

  stopBrake = (e) => {
    if (e) e.preventDefault();

    if (this.state.brake) {
      this.setState({ brake: false });
    }
  }

  rotateWheel = (e) => {
    const { active, startAngle } = this.state.wheelTurn;
    const { currentAngle, totalRotation } = this.state;
    e.preventDefault();

    if (active) {
      const _ref = this.wheelElement.current.getBoundingClientRect();
      const center = {
        x: _ref.left + (_ref.width / 2),
        y: _ref.top + (_ref.height / 2)
      };

      const x = e.clientX - center.x;
      const y = e.clientY - center.y;
      const rotation = Math.atan2(y, x) - startAngle;

      // The below is to get the amount rotated since totalRotation
      // it then adds to the totalRotation to get the new totalRotation
      const positiveCurrentAngle = (currentAngle + rotation) < 0 ? 2 * Math.PI + (currentAngle + rotation) : (currentAngle + rotation);
      const positiveTotalRotation = totalRotation - (2 * Math.PI * Math.floor(totalRotation / (2 * Math.PI)));

      // between [-PI, PI]
      const ca = positiveCurrentAngle > Math.PI ? -2 * Math.PI + positiveCurrentAngle : positiveCurrentAngle;
      const tr = positiveTotalRotation > Math.PI ? -2 * Math.PI + positiveTotalRotation : positiveTotalRotation;

      // angle between these two (positive if clockwise & negative if counterclockwise)
      let a = ca - tr;
      a += a > Math.PI ? -2 * Math.PI : (a < -Math.PI ? 2 * Math.PI : 0);

      const globalRotation = totalRotation + a;

      if (Math.abs(globalRotation) <= this.maxWheelAngle) {
         this.setState({ wheelTurn: { active: active, startAngle: startAngle, rotation: rotation }, currentAngle: currentAngle, totalRotation: globalRotation })

         this.wheelElement.current.style.transform = "rotate(" + 180 / Math.PI * (currentAngle + rotation) + "deg)";
         this.wheelElement.current.style.webkitTransform = "rotate(" + 180 / Math.PI * (currentAngle + rotation) + "deg)";
      }
    }
  }

  startRotateWheel = (e) => {
    e.preventDefault();
    this.setState({ autoTurning: false });

    const _ref = this.wheelElement.current.getBoundingClientRect();
    const center = {
      x: _ref.left + (_ref.width / 2),
      y: _ref.top + (_ref.height / 2)
    };
    const x = e.clientX - center.x;
    const y = e.clientY - center.y;

    this.setState({ wheelTurn: { startAngle: Math.atan2(y, x), active: true, rotation: 0 } });
  }

  endRotateWheel = () => {
    const { active, startAngle, rotation } = this.state.wheelTurn;
    const { currentAngle } = this.state;

    if (active) {
      let angle = currentAngle + rotation;

      this.setState({ wheelTurn: { startAngle: startAngle, active: false, rotation: 0 }, currentAngle: angle });

      if (this.state.powersteering) {
        this.setState({ autoTurning: true });
        const interval = setInterval(() => {
          let tr = this.state.totalRotation;
          if (!this.state.autoTurning || Math.abs(tr) < 0.01) {
            clearInterval(interval);
            return;
          }

          if (tr < 0)
            tr += 0.01;
          else
            tr -= 0.01;

          this.setState({ totalRotation: tr, currentAngle: tr });

          this.wheelElement.current.style.transform = "rotate(" + 180 / Math.PI * (tr) + "deg)";
          this.wheelElement.current.style.webkitTransform = "rotate(" + 180 / Math.PI * (tr) + "deg)";

        }, 10);
      }
    }
  }

  render() {
    const angleDegrees = Math.round(180 / Math.PI * this.state.totalRotation);
    const angleClamped = Math.min(Math.max(-100, angleDegrees), 100)
    const driveParameters = new ROSLIB.Message({
      angle: angleClamped,
      velocity: this.state.speed,
    });
    this.controlDriveParameters.publish(driveParameters);

    return (
      <div className="Autonomous-GC-controller" onMouseMove={(e) => {
        if (this.state.wheelTurn.active)
          this.rotateWheel(e);
      }} onMouseUp={() => {
        if (this.state.brake) this.stopBrake();
        if (this.state.gas) this.stopGas();
        if (this.state.wheelTurn.active) {
          this.endRotateWheel();
        }
      }}>
        <header className="App-header" >
           <h2 className="App-title">VU Golf Cart Controller</h2>
        </header>

        <div className="content">
          <div id="view-row" className="flex-row">
            <VideoStream />
            <Map />
          </div>
          <div id="control-row" className="flex-row">

            <div className="row-fill"></div>
            <div id="brake-pedal" className={`pedal ${this.state.brake ? 'rotate-pedal' : ''}`} onMouseDown={this.brake} onMouseUp={this.stopBrake}>BRAKE</div>
            <div className="row-fill"></div>

            <div className="row-item">
              <div className="control-data-box">
                <h4 className="control-data-header">Speed</h4>
                <p className="control-data" id="speed-data">{this.state.speed}</p>
                <br />
                <br />
                <h4 className="control-data-header">Wheel Angle</h4>
                <p className="control-data" id="wheel-angle-data">{Math.round(180 / Math.PI * this.state.totalRotation)}</p>
                <br />
                <h4 className="control-data-header">Power Steering</h4>
                <p className="control-data" id="powersteering-data">{this.state.powersteering ? 'ON' : 'OFF'}</p>
              </div>
            </div>

            <img src={steeringWheel} id="steering-wheel-image" alt="steering wheel" draggable="false" onMouseDown={this.startRotateWheel} onMouseUp={this.endRotateWheel} onDoubleClick={this.startRotateWheel} ref={this.wheelElement} />

            <div className="row-item">
              <div className="control-data-box">
                <h4 className="control-data-header">Direction</h4>
                <div className="control-data">
                  <p className="direction-icon" id="up-direction-icon" style={{ color: this.state.direction > 0 ? '#0F0' : '#606060' }}>&#10147;</p>
                  <p className="direction-icon" id="down-direction-icon" style={{ color: this.state.direction < 0 ? '#F00' : '#606060' }}>&#10146;</p>
                </div>
                <p className="control-data">{this.state.direction > 0 ? 'Forward' : 'Reverse'}</p>
              </div>
            </div>

            <div className="row-fill"></div>
            <div id="gas-pedal" className={`pedal ${this.state.gas ? 'rotate-pedal' : ''}`} onMouseDown={this.gas} onMouseUp={this.stopGas}>GAS</div>
            <div className="row-fill"></div>

          </div>
        </div>
      </div>
    );
  }
}

export default App;
