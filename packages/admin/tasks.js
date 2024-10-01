const fs = require('node:fs');
const less = require('less');
const path = require('node:path');
const { deleteFoldersRecursive, buildReact, patchHtmlFile, npmInstall, copyFiles } = require('@iobroker/build-tools');

const srcRx = 'src-admin/';
const src = `${__dirname}/${srcRx}`;
const rootFolder = path.join(__dirname, '..', '..');
const dest = 'adminWww/';

async function build() {
    fs.writeFileSync(
        `${src}public/lib/js/sparkline.js`,
        fs.readFileSync(`${rootFolder}/node_modules/@fnando/sparkline/dist/sparkline.js`),
    );
    fs.writeFileSync(
        `${src}public/lib/js/sparkline.js.map`,
        fs.readFileSync(`${rootFolder}/node_modules/@fnando/sparkline/dist/sparkline.js.map`),
    );

    const ace = `${rootFolder}/node_modules/ace-builds/src-min-noconflict/`;
    fs.writeFileSync(`${__dirname}/${srcRx}public/lib/js/ace/worker-json.js`, fs.readFileSync(`${ace}worker-json.js`));
    fs.writeFileSync(
        `${__dirname}/${srcRx}public/lib/js/ace/ext-searchbox.js`,
        fs.readFileSync(`${ace}ext-searchbox.js`),
    );

    await buildReact(src, { rootDir: __dirname, ramSize: 7000, craco: true });
    if (fs.existsSync(`${__dirname}/adminWww/index.html`)) {
        throw new Error('Front-end was not build to end!');
    }
}

function syncUtils() {
    const stat1 = fs.statSync(`${__dirname}/src-admin/src/helpers/utils.ts`);
    const stat2 = fs.statSync(`${__dirname}/src/lib/utils.ts`);
    const data1 = fs.readFileSync(`${__dirname}/src-admin/src/helpers/utils.ts`).toString();
    const data2 = fs.readFileSync(`${__dirname}/src/lib/utils.ts`).toString();
    if (data1 !== data2) {
        if (stat1.mtimeMs > stat2.mtimeMs) {
            fs.writeFileSync(`${__dirname}/src/lib/utils.ts`, data1);
        } else {
            fs.writeFileSync(`${__dirname}/src-admin/src/helpers/utils.ts`, data2);
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

    let readme = fs.readFileSync(`${__dirname}/../../README.md`).toString('utf8');
    readme = readme.replaceAll('packages/admin/', '');
    fs.writeFileSync(`${__dirname}/README.md`, readme);

    copyFiles([`${srcRx}build/*`, `!${srcRx}build/index.html`, `!${srcRx}build/static/js/*.js`], dest);

    // copy source files of jsonConfig
    copyFiles(`${__dirname}/../jsonConfig/src/*`, `${__dirname}/../jsonConfig/build/src`);

    // copy source files of dm-gui-components
    copyFiles(`${__dirname}/../dm-gui-components/src/*`, `${__dirname}/../dm-gui-components/build/src`);

    // copy custom plugin
    copyFiles(`${rootFolder}/node_modules/@iobroker/admin-component-easy-access/admin/*`, `admin/`);

    // copy crypto-js
    copyFiles(
        [
            `${rootFolder}/node_modules/crypto-js/*.*`,
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
    copyFiles(`${srcRx}build/static/js/*.js`, `${dest}static/js`, {
        replace: [{ find: 's.p+"static/media', text: '"./static/media' }],
    });
}

async function configCSS() {
    const selectID = await less.render(fs.readFileSync(`./${srcRx}less/selectID.less`).toString('utf8'), {
        filename: 'selectID.less',
        compress: true,
        paths: [`./${srcRx}less`],
    });
    const adapterLess = await less.render(fs.readFileSync(`./${srcRx}less/adapter.less`).toString('utf8'), {
        filename: 'adapter.less',
        compress: true,
        paths: [`./${srcRx}less`],
    });
    const materializeCorrect = await less.render(
        fs.readFileSync(`./${srcRx}less/materializeCorrect.less`).toString('utf8'),
        {
            filename: 'materializeCorrect.less',
            compress: true,
            paths: [`./${srcRx}less`],
        },
    );

    fs.writeFileSync(`./${srcRx}public/css/adapter.css`, selectID.css + adapterLess.css + materializeCorrect.css);
}

async function iobCSS() {
    const selectID = await less.render(fs.readFileSync(`./${srcRx}less/selectID.less`).toString('utf8'), {
        filename: 'selectID.less',
        compress: true,
        paths: [`./${srcRx}less`],
    });

    fs.writeFileSync(`./${srcRx}public/lib/css/iob/selectID.css`, selectID.css);
}

async function treeTableCSS() {
    const treeTable = await less.render(
        fs.readFileSync(`./${srcRx}less/jquery.treetable.theme.less`).toString('utf8'),
        {
            filename: 'selectID.less',
            compress: true,
            paths: [`./${srcRx}less`],
        },
    );
    fs.writeFileSync(`./${srcRx}public/lib/css/jquery.treetable.theme.css`, treeTable.css);
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
    if (!fs.existsSync(`${src}node_modules`)) {
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
            if (!fs.existsSync(`${src}node_modules`)) {
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
