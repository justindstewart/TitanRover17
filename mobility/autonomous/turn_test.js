
var sys = require('util');
var spawn = require("child_process").spawn;
var process = spawn('python',["/home/pi/TitanRover/mobility/autonomous/python3/IMU_Acc_Mag_Gyro.py"]);
var rover = require('./runt_pyControl.js');
const NOW = require("performance-now");
var pwm_min = 1800;                 // Calculated to be 1000 us
var pwm_max = 4095;                 // Calculated to be 2000 us
var  target_heading = 65;
var current_heading = null;
var previous_heading_delta = null;
var heading_delta = null;                 // Global that is updated when data is received from magnetometer
var turning_right = null;
var turning_left = null;
var proportional_throttle = 1500;   // Throttle in proportion to error
const DELTA_THRESHOLD = 1;            // Acceptable heading error


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

// Getting Heading
process.stdout.on('data', function (data){
    current_heading = parseFloat(data);
    calc_heading_delta();
	//winston.info('Current heading: ' + data.toString());
});

// Cleanup procedures 
process.stdin.on('SIGINT',function(){
    clearInterval(turn_timer);
    clearInterval(speed_timer);
    turn_toward_target();
    rover.stop();
});

// Main Function
var turn_toward_target = function(){
    winston.info('Initiating turn');    
	calc_heading_delta();

    // Constantly adjusting throttle
    var speed_timer = setInterval(function(){
            winston.info('throttle:' + proportional_throttle);
            proportional_throttle = (pwm_max-pwm_min) * (Math.abs(heading_delta)/180) + pwm_min;
            if(proportional_throttle !== null){
                rover.set_speed(proportional_throttle);
            } 
    },300);

    // Calculates shortest turn 
    winston.info('current heading before turn: ' + current_heading);
    if(current_heading > target_heading){
        winston.info('heading delta: '+ Math.abs(heading_delta));
        if(Math.abs(heading_delta) > 180 && (turning_left || turning_right === null)){
            winston.info('turning right:'+ current_heading);
            turning_right = true;
            rover.turn_right(); 
        }else{
            winston.info('turning left'+ current_heading);
            turning_left = true;
            rover.turn_left();
        }
    }else{
        winston.info('heading delta: '+ Math.abs(heading_delta));
        if(Math.abs(heading_delta) > 180 && (turning_right || turning_left === null)){
            winston.info('turning left'+ current_heading);
            turning_left = true;
            rover.turn_left();    
        }	
        else{
            winston.info('turning right'+ current_heading);
            turning_right = true;
            rover.turn_right();
        }
    }
    
    // Constantly calculates error and checks if within threshold
    var turn_timer = setInterval(function(){
        console.log( 'Turning... Current heading: ' + current_heading + ' Target heading: ' + target_heading.toFixed(2));
        //calc_heading_delta();
        // If we are within x degrees of the desired heading stop, else check if we overshot
        //winston.info('Delta test: ' + heading_delta);
        //winston.info((previous_heading_delta + 15) + ' ' + (heading_delta));
        if(Math.abs(heading_delta) <= DELTA_THRESHOLD){
            clearInterval(turn_timer);
            clearInterval(speed_timer);
            rover.stop();
            winston.info('stopped heading: ' + current_heading);
            
            // Wait 1 second to do a final check if we are really within the threshold
            setTimeout(function(){
                if(Math.abs(current_heading-target_heading) > DELTA_THRESHOLD)
                {
                    turn_toward_target();
                }
                else{
                     winston.info('Final Heading:' + current_heading);
                }
            },200);    
        }   
        else if(previous_heading_delta !== null && (Math.abs(previous_heading_delta) + 20 < Math.abs(heading_delta)) ){
            winston.info('delta is increasing, prev:  ' +previous_heading_delta + 'current d : ' + heading_delta );
            clearInterval(turn_timer);
            clearInterval(speed_timer);
            turn_toward_target();
        }
        previous_heading_delta = heading_delta; 
        
   },15);
};

function calc_heading_delta(){
    // Calculating error (heading_delta)
    heading_delta = current_heading - target_heading;
    if(current_heading > target_heading){
        if(Math.abs(heading_delta) > 180){
            heading_delta = 360 - current_heading + target_heading;
        }else{
            heading_delta = current_heading - target_heading;
            }
    }else{
        if(Math.abs(heading_delta) > 180){ 
            heading_delta = 360 - target_heading + current_heading;
        }else{
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
    
