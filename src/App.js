import React, { Component } from 'react';
import steeringWheel from './assets/steering-wheel.png';
import './App.css';

class App extends Component {
   constructor(props) {
      super(props);

      this.gasPedalElement = React.createRef();
      this.brakePedalElement = React.createRef();
      this.wheelElement = React.createRef();


      this.gas = this.gas.bind(this);
      this.stopGas = this.stopGas.bind(this);
      this.brake = this.brake.bind(this);
      this.stopBrake = this.stopBrake.bind(this);

      this.rotatePedal = this.rotatePedal.bind(this);
      this.unrotatePedal = this.unrotatePedal.bind(this);
      this.rotateWheel = this.rotateWheel.bind(this);
      this.startRotateWheel = this.startRotateWheel.bind(this);
      this.endRotateWheel = this.endRotateWheel.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleKeyUp = this.handleKeyUp.bind(this);

      this.adjustSpeed = this.adjustSpeed.bind(this);
      this.changeDirection = this.changeDirection.bind(this);

      this.state = {
         brake: false,
         gas: false,
         speed: 10,
         wheelTurn: {
            startAngle: 0, // radians
            currentAngle: 0, // radians
            active: false,
            rotation: 0, // radians
         },
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

   handleKeyDown(e) {
      switch(e.key) {
         case 'ArrowUp':
            this.gas();
            break;
         case 'ArrowDown':
            this.brake();
            break;
         case 'ArrowLeft':
            this.adjustSpeed(-1);
            console.log('speeddown');
            break;
         case 'ArrowRight':
            this.adjustSpeed(1);
            console.log('speedup');
            break;
         case 'w':
            this.gas();
            break;
         case 's':
            this.brake();
            break;
         case 'a':
            this.adjustSpeed(-1);
            break;
         case 'd':
            this.adjustSpeed(1);
            break;
         case 'e':
            this.changeDirection();
            break;
         default:
            break;
      }
   }

   handleKeyUp(e) {
      switch(e.key) {
         case 'ArrowUp':
            this.stopGas();
            break;
         case 'ArrowDown':
            this.stopBrake();
            break;
         case 'w':
            this.stopGas();
            break;
         case 's':
            this.stopBrake();
            break;
         default:
            break;
      }
   }

   // adjust the speed
   adjustSpeed(n) {
      const { speed } = this.state;

      let newSpeed;
      if (speed > 0) {
         newSpeed = speed + n;
         if (newSpeed <= 0) newSpeed = 1;
      } else {
         newSpeed = speed - n;
         if (newSpeed >= 0) newSpeed = -1;
      }

      this.setState({speed: newSpeed});
   }

   // change direction either forward or reverse (as of now this is done with the 'e' key)
   changeDirection() {
      const { speed } = this.state;
      // if speed < 0 reverse, if speed > 0 forward
      let newSpeed = -speed;
      this.setState({speed: newSpeed});
   }

   // hit the gas
   gas(e) {
      if (e) e.preventDefault();

      if (this.state.brake) { // turn off brake if gas is pressed while brake is pressed
         this.stopBrake();
         this.setState({brake: false});
      }
      if (!this.state.gas) {
         this.setState({gas: true}); // turn on gas
         this.rotatePedal(this.gasPedalElement.current); // ui
      }
   }

   // let go of gas
   stopGas(e) {
      if (e) e.preventDefault();

      if (this.state.gas) {
         this.setState({gas: false});
         this.unrotatePedal(this.gasPedalElement.current);
      }
   }

   // hit the break
   brake(e) {
      if (e) e.preventDefault();

      if (this.state.gas) { // turn off gas if brake is pressed
         this.stopGas();
         this.setState({gas: false});
      }
      if (!this.state.brake) {
         this.setState({brake: true});
         this.rotatePedal(this.brakePedalElement.current);
      }
   }

   // let go of break
   stopBrake(e) {
      if (e) e.preventDefault();

      if (this.state.brake) {
         this.setState({brake: false});
         this.unrotatePedal(this.brakePedalElement.current);
      }
   }

   rotatePedal(el) {
      // rotate element in z direction
      el.style.transform = 'rotate3d(1, 0, 0, 20deg)';
      el.style.webkitTransform = 'rotate3d(1, 0, 0, 20deg)';
   }

   unrotatePedal(el) {
      // unrotate element in z direction
      el.style.transform = '';
      el.style.webkitTransform = '';
   }

   rotateWheel(e) {
      const { active, currentAngle, startAngle } = this.state.wheelTurn;
      e.preventDefault();

      if (active) {


         const _ref = this.wheelElement.current.getBoundingClientRect();
         const center = {
            x: _ref.left + (_ref.width / 2),
            y: _ref.top + (_ref.height / 2)
         };

         const x = e.clientX - center.x;
         const y = e.clientY - center.y;
         const rotation =  Math.atan2(y, x) - startAngle;


         this.setState({wheelTurn: {active: active, currentAngle: currentAngle, startAngle: startAngle, rotation: rotation}})

         this.wheelElement.current.style.transform = "rotate(" + 180 / Math.PI * (currentAngle + rotation) + "deg)";
         this.wheelElement.current.style.webkitTransform = "rotate(" + 180 / Math.PI * (currentAngle + rotation) + "deg)";
      }
   }

   startRotateWheel(e) {
      e.preventDefault();
      const _ref = this.wheelElement.current.getBoundingClientRect();
      const center = {
         x: _ref.left + (_ref.width / 2),
         y: _ref.top + (_ref.height / 2)
      };
      const x = e.clientX - center.x;
      const y = e.clientY - center.y;

      this.setState({wheelTurn: {startAngle: Math.atan2(y, x), active: true, currentAngle: this.state.wheelTurn.currentAngle, rotation: 0}});

   }

   endRotateWheel() {
      const { active, currentAngle, startAngle, rotation } = this.state.wheelTurn;

      if (active) {
         let angle = currentAngle + rotation;

         this.setState({wheelTurn: {startAngle: startAngle, currentAngle: angle, active: false, rotation: 0}});
      }

      // TODO: impliment power steering-like effects, i.e. wheel turns back after you have turned it
      // TODO: limit turn
   }

   render() {
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
            <header className = "App-header" >
               <h1 className = "App-title" > VU Golf Cart Controller </h1>
            </header>
            <div className="content">
               <div id="view-row" className="flex-row">
                  <VideoStream />
                  <MapStream />
               </div>
               <div id="control-row" className="flex-row">
                  <div className="row-fill"></div>
                  <div id="brake-pedal" className="pedal" onMouseDown={this.brake} onMouseUp={this.stopBrake} ref={this.brakePedalElement}>BRAKE</div>
                  <div className="row-fill">
                     <div className="control-data-box">
                        <h4 className="control-data-header">Speed</h4>
                        <p className="control-data">{Math.abs(this.state.speed)}</p>
                     </div>
                  </div>
                  <img src={steeringWheel} id="steering-wheel-image" alt="steering wheel" draggable="false" onMouseDown={this.startRotateWheel} onMouseUp={this.endRotateWheel}  ref={this.wheelElement}/>
                  <div className="row-fill">
                     <div className="control-data-box">
                        <h4 className="control-data-header">Direction</h4>
                        <p className="control-data">{this.state.speed > 0 ? 'Forward' : 'Reverse'}</p>
                     </div>
                  </div>
                  <div id="gas-pedal" className="pedal" onMouseDown={this.gas} onMouseUp={this.stopGas} ref={this.gasPedalElement}>GAS</div>
                  <div className="row-fill"></div>
               </div>
            </div>
         </div>
      );
   }
}

class VideoStream extends Component {
   render() {
      return (
         <div id="camera-stream-container" className="stream-container">
            <img className="stream-image" src="http://placehold.jp/1000x1000.png?text=Cameria%20View"/>
         </div>
      );
   }
}

class MapStream extends Component {
   render() {
      return (
         <div id="map-stream-container" className="stream-container">
            <img className="stream-image" src="http://placehold.jp/1000x1000.png?text=Map%20View"/>
         </div>
      );
   }
}

export default App;
