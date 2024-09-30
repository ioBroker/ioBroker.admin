const fs = require('node:fs');
const path = require('node:path');
const setup = require('@iobroker/legacy-testing');

let rootDir = path.join(__dirname, '../');
let objects = null;
let states = null;
let onStateChanged = null;

function deleteFoldersRecursive(path) {
    if (path.endsWith('/')) {
        path = path.substring(0, path.length - 1);
    }
    if (fs.existsSync(path)) {
        const files = fs.readdirSync(path);
        for (const file of files) {
            const curPath = `${path}/${file}`;
            const stat = fs.statSync(curPath);
            if (stat.isDirectory()) {
                deleteFoldersRecursive(curPath);
                fs.rmdirSync(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        }
    }
}

function startIoBroker(options) {
    options = options || {};
    if (options.rootDir) {
        rootDir = options.rootDir;
    }

    return new Promise(async resolve => {
        // delete the old project
        deleteFoldersRecursive(`${rootDir}tmp/screenshots`);

        setup.setOptions({ rootDir });
        setup.initialize();

        await setup.setOfflineState('system.adapter.admin.0.alive', { val: false });

        setup.setupController(
            null,
            async systemConfig => {
                // disable statistics and set license accepted
                systemConfig.common.licenseConfirmed = true;
                systemConfig.common.diag = 'none';
                await setup.setObject('system.config', systemConfig);

                // lets the web adapter start on port 18081
                const config = await setup.getAdapterConfig(0, 'admin');
                if (config?.common) {
                    config.native.port = 18081;
                    config.common.enabled = true;
                    await setup.setAdapterConfig(config.common, config.native, 0, 'admin');
                }

                setup.startController(
                    false, // do not start widgets
                    (id, obj) => {},
                    (id, state) => onStateChanged && onStateChanged(id, state),
                    async (_objects, _states) => {
                        objects = _objects;
                        states = _states;
                        setup.startCustomAdapter('admin', 0);
                        await checkIsAdminStartedAsync(states);
                        resolve({ objects, states });
                    }
                );
            },
            options
        );
    });
}

async function stopIoBroker() {
    await setup.stopCustomAdapter('admin', 0);

    await new Promise(resolve =>
        setup.stopController(normalTerminated => {
            console.log(`Adapter normal terminated: ${normalTerminated}`);
            resolve();
        })
    );
}

function checkIsAdminStarted(states, cb, counter) {
    counter = counter === undefined ? 20 : counter;
    if (counter === 0) {
        return cb && cb(`Cannot check value of State system.adapter.admin.0.alive`);
    }

    states.getState('system.adapter.admin.0.alive', (err, state) => {
        console.log(`[${counter}]Check if admin is started "system.adapter.admin.0.alive" = ${JSON.stringify(state)}`);
        err && console.error(err);
        if (state?.val) {
            cb && cb();
        } else {
            setTimeout(() => checkIsAdminStarted(states, cb, counter - 1), 500);
        }
    });
}

function checkIsAdminStartedAsync(states, counter) {
    return new Promise(resolve => checkIsAdminStarted(states, resolve, counter));
}

module.exports = {
    startIoBroker,
    stopIoBroker,
    setOnStateChanged: cb => (onStateChanged = cb),
};
