// eslint-disable-next-line @typescript-eslint/no-require-imports
const { statSync, existsSync, writeFileSync, readFileSync } = require('node:fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const less = require('less');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { join } = require('node:path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
    deleteFoldersRecursive,
    buildReact,
    patchHtmlFile,
    npmInstall,
    copyFiles,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('@iobroker/build-tools');

const srcRx = 'src-admin/';
const src = `${__dirname}/${srcRx}`;
const rootFolder = join(__dirname, '..', '..');
const dest = 'adminWww/';

async function build() {
    const socketNew = readFileSync(`${__dirname}/../../node_modules/@iobroker/ws/dist/esm/socket.io.min.js`).toString();
    const socketOld = readFileSync(`${__dirname}/src-admin/public/lib/js/socket.io.js`).toString();
    if (socketNew !== socketOld) {
        writeFileSync(`${__dirname}/src-admin/public/lib/js/socket.io.js`, socketNew);
        writeFileSync(
            `${__dirname}/src-admin/public/lib/js/socket.io.js.map`,
            readFileSync(`${__dirname}/../../node_modules/@iobroker/ws/dist/esm/socket.io.min.js.map`),
        );
    }

    writeFileSync(
        `${src}public/lib/js/sparkline.js`,
        readFileSync(`${rootFolder}/node_modules/@fnando/sparkline/dist/sparkline.js`),
    );
    writeFileSync(
        `${src}public/lib/js/sparkline.js.map`,
        readFileSync(`${rootFolder}/node_modules/@fnando/sparkline/dist/sparkline.js.map`),
    );

    const ace = `${rootFolder}/node_modules/ace-builds/src-min-noconflict/`;
    writeFileSync(`${__dirname}/${srcRx}public/lib/js/ace/worker-json.js`, readFileSync(`${ace}worker-json.js`));
    writeFileSync(`${__dirname}/${srcRx}public/lib/js/ace/ext-searchbox.js`, readFileSync(`${ace}ext-searchbox.js`));

    await buildReact(src, { rootDir: __dirname, vite: true, tsc: true, exec: true, ramSize: 7000 });
    if (existsSync(`${__dirname}/adminWww/index.html`)) {
        throw new Error('Front-end was not build to end!');
    }
}

function syncUtils() {
    const stat1 = statSync(`${__dirname}/src-admin/src/helpers/utils.ts`);
    const stat2 = statSync(`${__dirname}/src/lib/utils.ts`);
    const data1 = readFileSync(`${__dirname}/src-admin/src/helpers/utils.ts`).toString();
    const data2 = readFileSync(`${__dirname}/src/lib/utils.ts`).toString();
    if (data1 !== data2) {
        if (stat1.mtimeMs > stat2.mtimeMs) {
            writeFileSync(`${__dirname}/src/lib/utils.ts`, data1);
        } else {
            writeFileSync(`${__dirname}/src-admin/src/helpers/utils.ts`, data2);
        }
    }
}

function copyAllFiles() {
    deleteFoldersRecursive(`${__dirname}/build`);
    deleteFoldersRecursive(`${__dirname}/admin/custom`);
    deleteFoldersRecursive(`${__dirname}/${srcRx}public/lib/js/crypto-js`);
    deleteFoldersRecursive(`${__dirname}/../dm-gui-components/build/src`);
    deleteFoldersRecursive(`${__dirname}/../jsonConfig/build/src`);
    syncUtils();

    let readme = readFileSync(`${__dirname}/../../README.md`).toString('utf8');
    readme = readme.replaceAll('packages/admin/', '');
    writeFileSync(`${__dirname}/README.md`, readme);

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
    } else if (existsSync(`${__dirname}/node_modules/@iobroker/admin-component-easy-access`)) {
        copyFiles(`${__dirname}/node_modules/@iobroker/admin-component-easy-access/admin/**/*`, `admin/`);
    } else if (existsSync(`${__dirname}/node_modules/src-admin/@iobroker/admin-component-easy-access`)) {
        copyFiles(`${__dirname}/src-admin/node_modules/@iobroker/admin-component-easy-access/admin/**/*`, `admin/`);
    } else {
        console.error('Cannot find admin-component-easy-access');
        process.exit(1);
    }
    // copy crypto-js
    copyFiles(
        [
            `${rootFolder}/node_modules/crypto-js/**/*.*`,
            `!${rootFolder}/node_modules/crypto-js/CONTRIBUTING.md`,
            `!${rootFolder}/node_modules/crypto-js/README.md`,
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

async function configCSS() {
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

async function iobCSS() {
    const selectID = await less.render(readFileSync(`./${srcRx}less/selectID.less`).toString('utf8'), {
        filename: 'selectID.less',
        compress: true,
        paths: [`./${srcRx}less`],
    });

    writeFileSync(`./${srcRx}public/lib/css/iob/selectID.css`, selectID.css);
}

async function treeTableCSS() {
    const treeTable = await less.render(readFileSync(`./${srcRx}less/jquery.treetable.theme.less`).toString('utf8'), {
        filename: 'selectID.less',
        compress: true,
        paths: [`./${srcRx}less`],
    });
    writeFileSync(`./${srcRx}public/lib/css/jquery.treetable.theme.css`, treeTable.css);
}

function clean() {
    deleteFoldersRecursive(`${__dirname}/${dest}`, ['404.html', 'oauthError.html', 'oauthSuccess.html']);
    deleteFoldersRecursive(`${__dirname}/${srcRx}/build`);
}

if (process.argv.includes('--backend-i18n')) {
    copyFiles(['src/i18n/*'], 'build-backend/i18n');
    syncUtils();
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-0-configCSS')) {
    syncUtils();
    configCSS().catch(e => {
        console.error(e);
        process.exit(1);
    });
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-0-iobCSS')) {
    iobCSS().catch(e => {
        console.error(e);
        process.exit(1);
    });
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-0-treeTableCSS')) {
    treeTableCSS().catch(e => {
        console.error(e);
        process.exit(1);
    });
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-1-clean')) {
    syncUtils();
    clean();
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-2-npm')) {
    if (!existsSync(`${src}node_modules`)) {
        npmInstall(src).catch(e => {
            console.error(e);
            process.exit(1);
        });
    }
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-3-build')) {
    build().catch(e => {
        console.error(e);
        process.exit(1);
    });
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-5-copy')) {
    copyAllFiles();
} else if (process.argv.find(e => e.replace(/^-*/, '') === 'react-6-patch')) {
    patchHtmlFile(`${dest}/index.html`).catch(e => {
        console.error(e);
        process.exit(1);
    });
} else {
    syncUtils();
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
            copyAllFiles();
            await patchHtmlFile(`${dest}/index.html`);
        })
        .catch(e => {
            console.error(e);
            process.exit(1);
        });
}
