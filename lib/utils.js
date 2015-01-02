var controllerDir;

// Get js-controller directory to load libs
function getControllerDir() {
    var fs = require('fs');
    // Find the js-controller location
    var controllerDir = __dirname.replace(/\\/g, '/');
    controllerDir = controllerDir.split('/');
    if (controllerDir[controllerDir.length - 3] == 'adapter') {
        controllerDir.splice(controllerDir.length - 2, 2);
        controllerDir = controllerDir.join('/');
    } else if (controllerDir[controllerDir.length - 3] == 'node_modules') {
        controllerDir.splice(controllerDir.length - 3, 3);
        controllerDir = controllerDir.join('/');
        if (fs.existsSync(controllerDir + '/iobroker.js-controller')) {
            controllerDir += '/iobroker.js-controller';
        } else if (!fs.existsSync(controllerDir + '/controller.js')) {
            console.log('Cannot find js-controller');
            process.exit(10);
        } 
    } else {
        console.log('Cannot find js-controller');
        process.exit(10);
    }
    return controllerDir;
}

// Read controller configuration file
function getConfig() {
    return JSON.parse(fs.readFileSync(controllerDir + '/conf/iobroker.json'));
}
controllerDir = getControllerDir();

exports.controllerDir = controllerDir;
exports.getConfig =     getConfig;
