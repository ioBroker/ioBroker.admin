/**
 * Copyright 2018-2024 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 */
const { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } = require('node:fs');
const { copyFiles, deleteFoldersRecursive } = require('@iobroker/build-tools');
const { dirname } = require('node:path');

function patchFiles() {
    const pack = require('./package.json');
    let readme = readFileSync(`${__dirname}/README.md`).toString('utf8');
    readme = readme.replace(
        /"@iobroker\/adapter-react-v5": "\^\d\.\d\.\d",/g,
        `"@iobroker/adapter-react-v5": "^${pack.version}",`,
    );
    writeFileSync(`${__dirname}/README.md`, readme);
}

function createIconSets(folder, destFile) {
    const files = readdirSync(folder).filter(file => file.endsWith('.svg'));
    const result = {};
    for (let f = 0; f < files.length; f++) {
        let data = readFileSync(`${folder}/${files[f]}`).toString('utf8');
        result[files[f].replace('.svg', '')] = Buffer.from(data).toString('base64');
    }
    existsSync(dirname(destFile)) || mkdirSync(dirname(destFile), { recursive: true });
    writeFileSync(destFile, JSON.stringify(result));
}

function copyAllFiles() {
    try {
        !existsSync('build') && mkdirSync('build');
        copyFiles(['src/*.d.ts'], 'build');
        copyFiles(
            ['src/assets/lamp_ceiling.svg', 'src/assets/lamp_table.svg', 'src/assets/no_icon.svg'],
            'build/assets',
        );
        // copyFiles(['README.md', 'LICENSE'], 'build');
        // copyFileSync('tasksExample.js', 'build/tasks.js');
        copyFiles(['src/*.css'], 'build');
        // copyFiles(['craco-module-federation.js'], 'build');
        // copyFiles(['modulefederation.admin.config.js'], 'build');
        // copyFiles(['src/*/*.tsx', 'src/*/*.css', '!src/assets/devices/parseNames.js'], 'build/src');
        // copyFiles(['src/*.tsx', 'src/*.css'], 'build/src');
        // copyFiles(['src/i18n/*.json'], 'build/i18n');
    } catch (e) {
        console.error(`Cannot copy files: ${e}`);
        process.exit(1);
    }
}
if (process.argv.find(arg => arg === '--0-clean')) {
    deleteFoldersRecursive('build');
} else if (process.argv.find(arg => arg === '--2-copy')) {
    createIconSets('src/assets/devices', 'src/assets/devices.json');
    createIconSets('src/assets/rooms', 'src/assets/rooms.json');
    copyAllFiles();
} else if (process.argv.find(arg => arg === '--3-patchReadme')) {
    patchFiles();
} else {
    deleteFoldersRecursive('build');
    createIconSets('src/assets/devices', 'build/assets/devices.json');
    createIconSets('src/assets/rooms', 'build/assets/rooms.json');
    copyAllFiles();
    patchFiles();
}
