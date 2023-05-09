const fs = require('fs');
const setup = require('@iobroker/legacy-testing');

let rootDir = `${__dirname}/../../../`;
let objects = null;
let states  = null;
let onStateChanged = null;
let gOptions;

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

    gOptions = options;

    return new Promise(async resolve => {
        // delete the old project
        deleteFoldersRecursive(`${rootDir}tmp/screenshots`);

        await setup.setOfflineState('system.adapter.admin.0.alive', { val: false });

        setup.setupController(null, async () => {
            // lets the web adapter start on port 18082
            let config = await setup.getAdapterConfig(0, 'admin');
            if (config && config.common) {
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
                    setup.startCustomAdapter(options.widgetsSetName, 0);
                    await checkIsAdminStartedAsync();
                    resolve({ objects, states });
                });
        });
    });
}

async function stopIoBroker() {
    for (let a = 0; a < gOptions.additionalAdapters.length; a++) {
        await setup.stopCustomAdapter(gOptions.additionalAdapters[a].split('@')[0].replace('iobroker.', ''), 0);
    }

    if (gOptions.startOwnAdapter) {
        await setup.stopCustomAdapter(gOptions.widgetsSetName, 0);
    }

    // wait till adapters are stopped
    await new Promise(resolve => setTimeout(resolve, 1000));

    await new Promise(resolve =>
        setup.stopController(normalTerminated => {
            console.log(`Adapter normal terminated: ${normalTerminated}`);
            resolve();
        }));
}

function checkIsAdminStarted(states, cb, counter) {
    counter = counter === undefined ? 20 : counter;
    if (counter === 0) {
        return cb && cb(`Cannot check value Of State system.adapter.admin.0.alive`);
    }

    states.getState(gOptions.visUploadedId, (err, state) => {
        console.log(`[${counter}]Check if vis is uploaded "system.adapter.admin.0.alive" = ${JSON.stringify(state)}`);
        err && console.error(err);
        if (state && state.val) {
            cb && cb();
        } else {
            setTimeout(() =>
                checkIsAdminStarted(states, cb, counter - 1), 500);
        }
    });
}

function checkIsAdminStartedAsync(states, counter) {
    return new Promise(resolve => checkIsAdminStarted(states, resolve, counter));
}

module.exports = {
    startIoBroker,
    stopIoBroker,
    setOnStateChanged: cb => onStateChanged = cb,
}