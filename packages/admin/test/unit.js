const path = require('path');
const { tests } = require('@iobroker/testing');

const jscToolsMock = {
    // No update checks in unit tests
    getInstalledInfo() {
        return {};
    },
};

const jscLEMock = {
    // No https/letsencrypt in unit tests
    createServer(app) {
        return require('http').createServer(app);
    },
};

// Run unit tests - See https://github.com/ioBroker/testing for a detailed explanation and further options
tests.unit(path.join(__dirname, '..'), {
    additionalMockedModules: {
        '{CONTROLLER_DIR}/lib/tools.js': jscToolsMock,
        '{CONTROLLER_DIR}/lib/tools': jscToolsMock,
        '{CONTROLLER_DIR}/lib/letsencrypt.js': jscLEMock,
        '{CONTROLLER_DIR}/lib/letsencrypt': jscLEMock,
    },
});
