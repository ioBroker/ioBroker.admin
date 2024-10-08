const { exec } = require('node:child_process');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');

const COLORS = {
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m',
    RESET: '\x1b[0m',
};

function log(message, color, noReset) {
    if (color) {
        if (noReset) {
            console.log(`${color}${message}`);
        } else {
            console.log(`${color}${message}${COLORS.RESET}`);
        }
    } else {
        console.log(message);
    }
}

// run npm install in directory (async function)
function execAsync(
    cmd,
    cwd,
) {
    return new Promise((resolve, reject) => {
        // Install node modules
        const start = Date.now();

        // System call used for update of js-controller itself,
        // because during an installation the npm packet will be deleted too, but some files must be loaded even during the install process.
        console.log(`[${new Date().toISOString()}] executing: "${cmd}" in "${cwd}"`);
        const child = exec(cmd, { cwd });

        child?.stderr?.pipe(process.stderr);
        child?.stdout?.pipe(process.stdout);

        child.on('exit', (code /* , signal */) => {
            // code 1 is a strange error that cannot be explained. Everything is installed but error :(
            if (code && code !== 1) {
                reject(new Error(`Cannot install: ${code}`));
            } else {
                console.log(`[${new Date().toISOString()}] "${cmd}" in "${cwd}" finished in ${Date.now() - start}ms.`);
                // command succeeded
                resolve();
            }
        });
    });
}

async function build() {
    log('-------------- JSON-Config --------------', COLORS.YELLOW, true);
    await execAsync('npm run build', `${__dirname}/packages/jsonConfig`);
    if (!existsSync(`${__dirname}/packages/jsonConfig/build/JsonConfig.js`)) {
        throw new Error('JsonConfig.js not found');
    }
    log('');
    log('');
    log('-------------- DM-GUI-Component --------------', COLORS.MAGENTA, true);
    await execAsync('npm run build', `${__dirname}/packages/dm-gui-components`);
    if (!existsSync(`${__dirname}/packages/dm-gui-components/build/index.js`)) {
        throw new Error('dm-gui-components/build/index.js not found');
    }
    log('');
    log('');
    log('-------------- Admin --------------', COLORS.BLUE, true);
    await execAsync('npm run build', `${__dirname}/packages/admin`);
    if (!existsSync(`${__dirname}/packages/admin/adminWww/index.html`)) {
        throw new Error('admin/adminWww/index.html');
    }
    if (!existsSync(`${__dirname}/packages/admin/build-backend/main.js`)) {
        throw new Error('admin/build-backend/main.js');
    }
    if (!existsSync(`${__dirname}/packages/admin/build-backend/i18n/de.json`)) {
        throw new Error('admin/build-backend/i18n/de.json');
    }
    log('-------------- END --------------', COLORS.RED);
}
if (process.argv.includes('--build')) {
    build().catch(e => {
        console.error(e);
        process.exit(1);
    });
} else if (process.argv.includes('--bump-versions')) {
    // read the version in package/admin
    const packAdmin = JSON.parse(readFileSync(`${__dirname}/packages/admin/package.json`).toString());
    const version = packAdmin.version;
    // replace in JsonConfig the version
    const packJsonConfig = JSON.parse(readFileSync(`${__dirname}/packages/jsonConfig/package.json`).toString());
    packJsonConfig.version = version;
    log(`Set the version in jsonConfig/package.json to ${packJsonConfig.version}`, COLORS.CYAN);
    writeFileSync(`${__dirname}/packages/jsonConfig/package.json`, JSON.stringify(packJsonConfig, null, 4));

    // replace in JsonConfig the version
    const packDmComponents = JSON.parse(readFileSync(`${__dirname}/packages/dm-gui-components/package.json`).toString());
    packDmComponents.version = version;
    packDmComponents.dependencies['@iobroker/json-config'] = version;
    packAdmin.devDependencies['@iobroker/dm-gui-components'] = version;
    packAdmin.devDependencies['@iobroker/json-config'] = version;
    log(`Set the version in dm-gui-components/package.json to ${packDmComponents.version}`, COLORS.GREEN);
    writeFileSync(`${__dirname}/packages/dm-gui-components/package.json`, JSON.stringify(packDmComponents, null, 4));

    // const packAdminGuiComponents = JSON.parse(readFileSync(`${__dirname}/packages/admin/src-admin/package.json`).toString());
    // packAdminGuiComponents.version = version;
    // packAdminGuiComponents.dependencies['@iobroker/dm-gui-components'] = version;
    // packAdminGuiComponents.dependencies['@iobroker/json-config'] = version;
    // log(`Set the version in admin/src-admin/package.json to ${packAdminGuiComponents.version}`, COLORS.YELLOW);
    // writeFileSync(`${__dirname}/packages/admin/src-admin/package.json`, JSON.stringify(packAdminGuiComponents, null, 4));

    log(`Set the version in admin/package.json to ${packAdmin.version}`, COLORS.MAGENTA);
    writeFileSync(`${__dirname}/packages/admin/package.json`, JSON.stringify(packAdmin, null, 4));
}
