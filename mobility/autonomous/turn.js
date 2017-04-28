
var sys = require('util');
var spawn = require("child_process").spawn;
var python_proc = spawn('python',["/home/pi/TitanRover/mobility/autonomous/python3/IMU_Acc_Mag_Gyro.py"]);
var rover = require('./runt_pyControl.js');
const NOW = require("performance-now");
var pwm_min = 1500;                 // Calculated to be 1000 us
var pwm_max = 4095;                 // Calculated to be 2000 us
var  target_heading = 65;
var current_heading = null;
var previous_heading_delta = null;
var heading_delta = null;                 // Global that is updated when data is received from magnetometer
var turning_right = null;
var turning_left = null;
var proportional_throttle = 1500;   // Throttle in proportion to error
const DELTA_THRESHOLD = 5;            // Acceptable heading err

const Winston = require('winston');
const winston = new (Winston.Logger)({
    transports: [
      new (Winston.transports.Console)({
          'colorize': true
          
     }),
      new (Winston.transports.File)({ 
          filename: './autonomous.log',
          options:{flags: 'w'},         // Overwrites logfile. Remove if you want to append 
          timestamp: function () {
          return NOW();},
     })
    ]
  });

// Get heading,calculate heading and turn immediately.
python_proc.stdout.on('data', function (data){
    current_heading = parseFloat(data);
	winston.info('Current heading: ' + data.toString());
    calc_heading_delta();
});

// Cleanup procedures 
process.on('SIGINT',function(){
    rover.stop();
    winston.info('shutting rover down.')
    process.exit();
});

// Main Function
var turn_toward_target = function(){
    winston.info('Initiating turn');    
    // Constantly adjusting throttle
    var speed_timer = setInterval(function(){
            winston.info('throttle:' + proportional_throttle);
            proportional_throttle = (pwm_max-pwm_min) * (Math.abs(heading_delta)/180) + pwm_min;
            if(proportional_throttle !== null){
                rover.set_speed(proportional_throttle,proportional_throttle);
            } 
    },20);


    // Constantly calculates error and checks if within threshold
    var stop_turn_timer = setInterval(function(){
        console.log( 'Turning... Current heading: ' + current_heading + ' Target heading: ' + target_heading.toFixed(2));
        // If we are within x degrees of the desired heading stop, else check if we overshot
        //winston.info('Delta test: ' + heading_delta);
        //winston.info((previous_heading_delta + 15) + ' ' + (heading_delta));
        if(Math.abs(heading_delta) <= DELTA_THRESHOLD){
            clearInterval(stop_turn_timer);
            clearInterval(speed_timer);
            rover.stop();
            winston.info('stopped heading: ' + current_heading);
            
            // Wait 1 second to do a final check if we are really within the threshold
            setTimeout(function(){
                if(Math.abs(current_heading-target_heading) <= DELTA_THRESHOLD){
                     python_proc.kill();
                     clearInterval(stop_turn_timer);
                     clearInterval(speed_timer);
                     rover.stop();
                     winston.info('Final Heading:' + current_heading);
                }
                else{
                    turn_toward_target();
                }
                
            },1000);    
        }   
        else if(previous_heading_delta !== null && (Math.abs(previous_heading_delta) + 2 < Math.abs(heading_delta)) ){
            winston.info('delta is increasing, prev:  ' +previous_heading_delta + 'current d : ' + heading_delta );
        }
        previous_heading_delta = heading_delta; 
        
   },15);
};

function calc_heading_delta(){
    
    temp_delta = current_heading - target_heading;

// Is turning left or right the shorter turn?
    if(current_heading > target_heading){
        if(Math.abs(temp_delta) > 180){
            // If we were turning left previously or have never turned right before
            if(turning_left || turning_right === null){
                winston.info('turning right: '+ current_heading);
                turning_right = true;
                turning_left = false;
                rover.turn_right(); 
            }
            heading_delta = 360 - current_heading + target_heading;
        }else{
              // If we were turning right previously or have never turned left before
             if(turning_right || turning_left === null){
                winston.info('turning left: '+ current_heading);
                turning_left = true;
                turning_right = false;
                rover.turn_left();  
            }
            heading_delta = current_heading - target_heading;
            }
    }else{
        if(Math.abs(temp_delta) > 180){ 
             if(turning_right || turning_left === null){
                winston.info('turning left: '+ current_heading);
                turning_left = true;
                turning_right = false;
                rover.turn_left();  
            }
            heading_delta = 360 - target_heading + current_heading;
        }else{
            if(turning_left || turning_right === null){
                winston.info('turning right: '+ current_heading);
                turning_right = true;
                turning_left = false;
                rover.turn_right(); 
            }
            heading_delta = target_heading - current_heading;
        }
    }
} 

var main = setInterval(function(){
    if(current_heading != null){
        clearInterval(main);
        turn_toward_target()
        //setTimeout(function(){;},1000);
    }
    
},500);
    