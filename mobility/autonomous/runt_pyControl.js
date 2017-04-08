var PythonShell = require('python-shell');
var options = {
        mode: 'text',
        pythonPath: '/usr/bin/python',
        pythonOptions: ['-u'],
        scriptPath: '/home/pi/TitanRover/mobility/autonomous/python3/',
        args: []
    };

module.exports = {
    drive_forward: function(throttle){
        options.args[0] = 'f';
        options.args[1] = throttle;
        PythonShell.run('pyShell_handler.py', options, function (err, results) {
            if (err) throw err;
            // results is an array consisting of messages collected during execution
            console.log('results: %j', results);
        });
    },
    stop: function(){
        options.args[0] = 's';
        PythonShell.run('pyShell_handler.py', options, function (err, results) {
            if (err) throw err;
            // results is an array consisting of messages collected during execution
            console.log('results: %j', results);
        }); 
    },
    turn_left: function(throttle){
        options.args[0] = 'r';
        options.args[1] = throttle;
        PythonShell.run('pyShell_handler.py', options, function (err, results) {
            if (err) throw err;
            // results is an array consisting of messages collected during execution
            console.log('results: %j', results);
        });
    },
    turn_right: function(throttle){
        options.args[0] = 'l';
        options.args[1] = throttle;
        PythonShell.run('pyShell_handler.py', options, function (err, results) {
                if (err) throw err;
                // results is an array consisting of messages collected during execution
                console.log('results: %j', results);
        });
    },
    set_speed: function(throttle){
        options.args[0] = 'x';
        options.args[1] = throttle;
        PythonShell.run('pyShell_handler.py', options, function (err, results) {
                if (err) throw err;
                // results is an array consisting of messages collected during execution
                console.log('results: %j', results);
        });
    },
   
};