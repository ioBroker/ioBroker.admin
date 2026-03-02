import { statSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import less from 'less';
import buildTools from '@iobroker/build-tools';
import axios from 'axios';

const { deleteFoldersRecursive, buildReact, patchHtmlFile, npmInstall, copyFiles } = buildTools;

const srcRx = 'src-admin/';
const dirName = dirname(fileURLToPath(import.meta.url));
const src = `${dirName}/${srcRx}`;
const rootFolder = dirName;
const dest = 'adminWww/';

async function build(): Promise<void> {
    const socketNew = readFileSync(`${dirName}/node_modules/@iobroker/ws/dist/esm/socket.io.min.js`).toString();
    const socketOld = readFileSync(`${dirName}/src-admin/public/lib/js/socket.io.js`).toString();
    if (socketNew !== socketOld) {
        writeFileSync(`${dirName}/src-admin/public/lib/js/socket.io.js`, socketNew);
        writeFileSync(
            `${dirName}/src-admin/public/lib/js/socket.io.js.map`,
            readFileSync(`${dirName}/node_modules/@iobroker/ws/dist/esm/socket.io.min.js.map`),
        );
    }

    writeFileSync(
        `${src}public/lib/js/sparkline.js`,
        readFileSync(`${rootFolder}/src-admin/node_modules/@fnando/sparkline/dist/sparkline.js`),
    );
    writeFileSync(
        `${src}public/lib/js/sparkline.js.map`,
        readFileSync(`${rootFolder}/src-admin/node_modules/@fnando/sparkline/dist/sparkline.js.map`),
    );

    const ace = `${rootFolder}/src-admin/node_modules/ace-builds/src-min-noconflict/`;
    writeFileSync(`${dirName}/${srcRx}public/lib/js/ace/worker-json.js`, readFileSync(`${ace}worker-json.js`));
    writeFileSync(`${dirName}/${srcRx}public/lib/js/ace/ext-searchbox.js`, readFileSync(`${ace}ext-searchbox.js`));

    await buildReact(src, { rootDir: dirName, vite: true, tsc: true, exec: true, ramSize: 7000 });
    if (existsSync(`${dirName}/adminWww/index.html`)) {
        throw new Error('Front-end was not build to end!');
    }
}

async function syncUtils(): Promise<void> {
    const stat1 = statSync(`${dirName}/src-admin/src/helpers/utils.ts`);
    const stat2 = statSync(`${dirName}/src/lib/utils.ts`);
    const data1 = readFileSync(`${dirName}/src-admin/src/helpers/utils.ts`).toString();
    const data2 = readFileSync(`${dirName}/src/lib/utils.ts`).toString();
    if (data1 !== data2) {
        if (stat1.mtimeMs > stat2.mtimeMs) {
            writeFileSync(`${dirName}/src/lib/utils.ts`, data1);
        } else {
            writeFileSync(`${dirName}/src-admin/src/helpers/utils.ts`, data2);
        }
    }

    try {
        // Copy JSON config description and schema from 'https://github.com/ioBroker/json-config' to packages
        let response = await axios(
            'https://raw.githubusercontent.com/ioBroker/json-config/main/schemas/jsonConfig.json',
        );
        writeFileSync(`${dirName}/packages/jsonConfig/schemas/jsonConfig.json`, JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error('Cannot update jsonConfig.json. Not critical!', e);
    }
    try {
        let response = await axios('https://raw.githubusercontent.com/ioBroker/json-config/main/README.md');
        writeFileSync(`${dirName}/packages/jsonConfig/README.md`, response.data);
    } catch (e) {
        console.error('Cannot update README.md. Not critical!', e);
    }
}

async function copyAllFiles(): Promise<void> {
    deleteFoldersRecursive(`${dirName}/build`);
    deleteFoldersRecursive(`${dirName}/admin/custom`);
    deleteFoldersRecursive(`${dirName}/${srcRx}public/lib/js/crypto-js`);
    deleteFoldersRecursive(`${dirName}/../dm-gui-components/build/src`);
    deleteFoldersRecursive(`${dirName}/../jsonConfig/build/src`);
    await syncUtils();

    copyFiles([`${srcRx}build/**/*`, `!${srcRx}build/index.html`, `!${srcRx}build/static/js/*.js`], dest);

    // copy custom plugin
    if (existsSync(`${rootFolder}/node_modules/@iobroker/admin-component-easy-access`)) {
        copyFiles(
            [
                `${rootFolder}/node_modules/@iobroker/admin-component-easy-access/admin/**/*`,
                `${rootFolder}/node_modules/@iobroker/admin-component-easy-access/admin/*`,
            ],
            `admin/`,
        );
    } else if (existsSync(`${dirName}/node_modules/@iobroker/admin-component-easy-access`)) {
        copyFiles(`${dirName}/node_modules/@iobroker/admin-component-easy-access/admin/**/*`, `admin/`);
    } else if (existsSync(`${dirName}/node_modules/src-admin/@iobroker/admin-component-easy-access`)) {
        copyFiles(`${dirName}/src-admin/node_modules/@iobroker/admin-component-easy-access/admin/**/*`, `admin/`);
    } else {
        console.error('Cannot find admin-component-easy-access');
        process.exit(1);
    }
    // copy crypto-js
    copyFiles(
        [
            `${srcRx}node_modules/crypto-js/**/*.*`,
            `!${srcRx}node_modules/crypto-js/CONTRIBUTING.md`,
            `!${srcRx}node_modules/crypto-js/README.md`,
        ],
        `${dest}lib/js/crypto-js`,
    );
    copyFiles(`${srcRx}build/index.html`, dest, {
        replace: [
            { find: 'href="/', text: 'href="' },
            { find: 'src="/', text: 'src="' },
        ],
    });
    copyFiles(`${srcRx}build/static/js/**/*.js`, `${dest}static/js`, {
        replace: [{ find: 's.p+"static/media', text: '"./static/media' }],
    });
    copyFiles(
        [
            `${srcRx}node_modules/ace-builds/src-min-noconflict/worker-json.js`,
            `${srcRx}node_modules/ace-builds/src-min-noconflict/worker-html.js`,
            `${srcRx}node_modules/ace-builds/src-min-noconflict/worker-xml.js`,
            `${srcRx}node_modules/ace-builds/src-min-noconflict/worker-yaml.js`,
            `${srcRx}node_modules/ace-builds/src-min-noconflict/worker-javascript.js`,
            `${srcRx}node_modules/ace-builds/src-min-noconflict/worker-css.js`,
            `${srcRx}node_modules/ace-builds/src-min-noconflict/snippets/html.js`,
            `${srcRx}node_modules/ace-builds/src-min-noconflict/snippets/css.js`,
            `${srcRx}node_modules/ace-builds/src-min-noconflict/snippets/javascript.js`,
        ],
        `${dest}static/js`,
    );
}

async function configCSS(): Promise<void> {
    const selectID = await less.render(readFileSync(`./${srcRx}less/selectID.less`).toString('utf8'), {
        filename: 'selectID.less',
        compress: true,
        paths: [`./${srcRx}less`],
    });
    const adapterLess = await less.render(readFileSync(`./${srcRx}less/adapter.less`).toString('utf8'), {
        filename: 'adapter.less',
        compress: true,
        paths: [`./${srcRx}less`],
    });
    const materializeCorrect = await less.render(
        readFileSync(`./${srcRx}less/materializeCorrect.less`).toString('utf8'),
        {
            filename: 'materializeCorrect.less',
            compress: true,
            paths: [`./${srcRx}less`],
        },
    );

    writeFileSync(`./${srcRx}public/css/adapter.css`, selectID.css + adapterLess.css + materializeCorrect.css);
}

async function iobCSS(): Promise<void> {
    const selectID = await less.render(readFileSync(`./${srcRx}less/selectID.less`).toString('utf8'), {
        filename: 'selectID.less',
        compress: true,
        paths: [`./${srcRx}less`],
    });

    writeFileSync(`./${srcRx}public/lib/css/iob/selectID.css`, selectID.css);
}

async function treeTableCSS(): Promise<void> {
    const treeTable = await less.render(readFileSync(`./${srcRx}less/jquery.treetable.theme.less`).toString('utf8'), {
        filename: 'selectID.less',
        compress: true,
        paths: [`./${srcRx}less`],
    });
    writeFileSync(`./${srcRx}public/lib/css/jquery.treetable.theme.css`, treeTable.css);
}

function clean(): void {
    deleteFoldersRecursive(`${dirName}/${dest}`, ['404.html', 'oauthError.html', 'oauthSuccess.html']);
    deleteFoldersRecursive(`${dirName}/${srcRx}/build`);
}

if (process.argv.includes('--backend-i18n')) {
    copyFiles(['src/i18n/*'], 'build/i18n');
    syncUtils().catch((e: unknown) => {
        console.error(e);
        process.exit(1);
    });
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-0-configCSS')) {
    syncUtils()
        .then(() => configCSS())
        .catch((e: unknown) => {
            console.error(e);
            process.exit(1);
        });
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-0-iobCSS')) {
    iobCSS().catch((e: unknown) => {
        console.error(e);
        process.exit(1);
    });
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-0-treeTableCSS')) {
    treeTableCSS().catch((e: unknown) => {
        console.error(e);
        process.exit(1);
    });
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-1-clean')) {
    syncUtils()
        .then(() => clean())
        .catch((e: unknown) => {
            console.error(e);
            process.exit(1);
        });
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-2-npm')) {
    if (!existsSync(`${src}node_modules`)) {
        npmInstall(src).catch((e: unknown) => {
            console.error(e);
            process.exit(1);
        });
    }
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-3-build')) {
    build().catch((e: unknown) => {
        console.error(e);
        process.exit(1);
    });
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-5-copy')) {
    copyAllFiles().catch((e: unknown) => {
        console.error(e);
        process.exit(1);
    });
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-6-patch')) {
    patchHtmlFile(`${dest}/index.html`).catch((e: unknown) => {
        console.error(e);
        process.exit(1);
    });
} else {
    configCSS()
        .then(async () => {
            clean();
            if (!existsSync(`${src}node_modules`)) {
                await npmInstall(src);
            }
            await configCSS();
            await iobCSS();
            await treeTableCSS();
            await build();
            await copyAllFiles();
            await patchHtmlFile(`${dest}/index.html`);
        })
        .catch((e: unknown) => {
            console.error(e);
            process.exit(1);
        });
}
