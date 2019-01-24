import React, { Component } from 'react';
import steeringWheel from './assets/steering-wheel.png';
import ROSLIB from 'roslib';
import './App.css';
import VideoStream from './VideoStream';
import Map from './Map';

class App extends Component {
  constructor(props) {
    super(props);
    this.ros = new ROSLIB.Ros({ url: 'ws://localhost:9090' });
    this.ros.on('connection', () => console.log('[ros]: connected to websocket server.'));
    this.ros.on('error', error => console.log(`[ros]: error connecting to websocket server: ${error}`));
    this.ros.on('close', () => console.log('Connection to websocket server closed.'));
    this.controlDriveParameters = new ROSLIB.Topic({
      ros: this.ros,
      name: '/control_drive_parameters',
      messageType: 'control/drive_param'
    });

    this.wheelElement = React.createRef();

    this.state = {
      brake: false,
      gas: false,
      speed: 0,
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
      case 'ArrowLeft':
      case 'a':
        this.setState({ speed: this.state.speed - 1 });
        break;
      case 'ArrowRight':
      case 'd':
        this.setState({ speed: this.state.speed + 1 });
        break;
      case 'e':
        this.setState({ speed: -this.state.speed });
        break;
      case 'q':
        this.setState({ speed: 0 });
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

      this.setState({ wheelTurn: { active: active, startAngle: startAngle, rotation: rotation }, currentAngle: currentAngle, totalRotation: globalRotation })

      this.wheelElement.current.style.transform = "rotate(" + 180 / Math.PI * (currentAngle + rotation) + "deg)";
      this.wheelElement.current.style.webkitTransform = "rotate(" + 180 / Math.PI * (currentAngle + rotation) + "deg)";
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
    const driveParameters = new ROSLIB.Message({
      angle: Math.round(180 / Math.PI * this.state.totalRotation),
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
          <table className="header-table">
            <tbody>
              <tr>
                <td className="table-fill"></td>
                <td><h2 className="App-title">VU Golf Cart Controller</h2></td>
                <td className="table-fill">
                  <div className='settings-button-container'>
                    <a id='settings-button'><span>Settings</span></a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div id="settings-dropdown">
            <a>Powersteering: ON</a>
          </div>
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
              </div>
            </div>

            <img src={steeringWheel} id="steering-wheel-image" alt="steering wheel" draggable="false" onMouseDown={this.startRotateWheel} onMouseUp={this.endRotateWheel} ref={this.wheelElement} />

            <div className="row-item">
              <div className="control-data-box">
                <h4 className="control-data-header">Direction</h4>
                <div className="control-data">
                  <p className="direction-icon" id="up-direction-icon" style={{ color: this.state.speed > 0 ? '#0F0' : '#606060' }}>&#10147;</p>
                  <p className="direction-icon" id="down-direction-icon" style={{ color: this.state.speed < 0 ? '#F00' : '#606060' }}>&#10146;</p>
                </div>
                <p className="control-data">{this.state.speed > 0 ? 'Forward' : 'Reverse'}</p>
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
