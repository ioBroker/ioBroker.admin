const { exec } = require('node:child_process');
const { existsSync } = require('node:fs');

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
build().catch(e => {
    console.error(e);
    process.exit(1);
});
