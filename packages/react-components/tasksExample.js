/**
 * Copyright 2024 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 */
'use strict';

const fs = require('node:fs');
const { deleteFoldersRecursive, npmInstall, buildReact, copyFiles } = require('@iobroker/build-tools');

const SRC = 'src';

function copyAllFiles() {
    deleteFoldersRecursive('admin', ['.png', '.json', 'i18n']);

    copyFiles(
        [
            `${SRC}/build/*`,
            `!${SRC}/build/index.html`,
            `!${SRC}/build/static/js/main.*.chunk.js`,
            `!${SRC}/build/static/media/*.svg`,
            `!${SRC}/build/static/media/*.txt`,
            `!${SRC}/build/i18n/*`,
            `!${SRC}/build/i18n`,
        ],
        'admin',
    );

    copyFiles(`${SRC}/build/index.html`, 'admin');

    copyFiles(`${SRC}/build/static/js/main.*.chunk.js`, 'admin/static/js');
}

function clean() {
    deleteFoldersRecursive('admin', ['.png', '.json', 'i18n']);
    deleteFoldersRecursive(`${SRC}/build`);
}

function installNpmLocal() {
    if (fs.existsSync(`${SRC}/node_modules`)) {
        return Promise.resolve();
    }
    return npmInstall(`${__dirname.replace(/\\/g, '/')}/${SRC}/`);
}

function patchFiles() {
    if (fs.existsSync(`${__dirname}/admin/index.html`)) {
        let code = fs.readFileSync(`${__dirname}/admin/index.html`).toString('utf8');
        code = code.replace(
            /<script>var script=document\.createElement\("script"\).+?<\/script>/,
            `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`,
        );

        fs.writeFileSync(`${__dirname}/admin/index.html`, code);
    }
    if (fs.existsSync(`${__dirname}/${SRC}/build/index.html`)) {
        let code = fs.readFileSync(`${__dirname}/${SRC}/build/index.html`).toString('utf8');
        code = code.replace(
            /<script>var script=document\.createElement\("script"\).+?<\/script>/,
            `<script type="text/javascript" src="./../../lib/js/socket.io.js"></script>`,
        );

        fs.writeFileSync(`${SRC}/build/index.html`, code);
    }
}

if (process.argv.find(arg => arg === '--0-clean')) {
    clean();
} else if (process.argv.find(arg => arg === '--1-npm')) {
    npmInstall(`${__dirname.replace(/\\/g, '/')}/${SRC}/`).catch(e => {
        console.error(`Cannot install: ${e}`);
        process.exit(1);
    });
} else if (process.argv.find(arg => arg === '--2-build')) {
    buildReact(SRC, { rootDir: __dirname }).catch(e => {
        console.error(`Cannot build: ${e}`);
        process.exit(1);
    });
} else if (process.argv.find(arg => arg === '--3-copy')) {
    copyAllFiles();
} else if (process.argv.find(arg => arg === '--4-patch')) {
    patchFiles();
} else {
    clean();

    installNpmLocal()
        .then(() => buildReact(SRC, { rootDir: __dirname }))
        .then(() => copyAllFiles())
        .then(() => patchFiles());
}
