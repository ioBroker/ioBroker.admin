const fs = require('node:fs');
const cp = require('node:child_process');
const gulp = require('gulp');
const replace = require('gulp-replace');
const sourcemaps = require('gulp-sourcemaps');
const less = require('gulp-less');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const path = require('node:path');

const srcRx = 'src/';
const src = `${__dirname}/${srcRx}`;
const rootFolder = path.join(__dirname, '..', '..');
const dest = 'adminWww/';

function deleteFoldersRecursive(path, exceptions) {
    if (fs.existsSync(path)) {
        const files = fs.readdirSync(path);
        for (const file of files) {
            const curPath = `${path}/${file}`;
            const stat = fs.statSync(curPath);
            if (exceptions && exceptions.find(p => curPath.endsWith(p))) {
                continue;
            }

            if (stat.isDirectory()) {
                deleteFoldersRecursive(curPath);
                fs.rmdirSync(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        }
    }
}

function npmInstall() {
    return new Promise((resolve, reject) => {
        // Install node modules
        const cwd = src.replace(/\\/g, '/');

        const cmd = `npm install -f`;
        console.log(`"${cmd} in ${cwd}`);

        // System call used for update of js-controller itself,
        // because during the installation the npm packet will be deleted too, but some files must be loaded even during the installation process.
        const child = cp.exec(cmd, { cwd });

        child.stderr.pipe(process.stderr);
        child.stdout.pipe(process.stdout);

        child.on('exit', (code /* , signal */) => {
            // code 1 is a strange error that cannot be explained. Everything is installed but error :(
            if (code && code !== 1) {
                reject(`Cannot install: ${code}`);
            } else {
                console.log(`"${cmd} in ${cwd} finished.`);
                // command succeeded
                resolve();
            }
        });
    });
}

function build() {
    fs.writeFileSync(
        `${src}public/lib/js/sparkline.js`,
        fs.readFileSync(`${rootFolder}/node_modules/@fnando/sparkline/dist/sparkline.js`)
    );
    fs.writeFileSync(
        `${src}public/lib/js/sparkline.js.map`,
        fs.readFileSync(`${rootFolder}/node_modules/@fnando/sparkline/dist/sparkline.js.map`)
    );

    const ace = `${rootFolder}/node_modules/ace-builds/src-min-noconflict/`;
    fs.writeFileSync(`${__dirname}/${srcRx}public/lib/js/ace/worker-json.js`, fs.readFileSync(`${ace}worker-json.js`));
    fs.writeFileSync(
        `${__dirname}/${srcRx}public/lib/js/ace/ext-searchbox.js`,
        fs.readFileSync(`${ace}ext-searchbox.js`)
    );

    const version = JSON.parse(fs.readFileSync(`${__dirname}/package.json`).toString('utf8')).version;
    const data = JSON.parse(fs.readFileSync(`${src}src/version.json`).toString('utf8'));

    data.version = version;

    fs.writeFileSync(`${src}src/version.json`, JSON.stringify(data, null, 4));

    return new Promise((resolve, reject) => {
        const options = {
            stdio: 'pipe',
            cwd: src,
        };

        console.log(options.cwd);

        let script = `${rootFolder}/node_modules/@craco/craco/dist/bin/craco.js`;
        if (!fs.existsSync(script)) {
            script = `${rootFolder}/node_modules/@craco/craco/dist/bin/craco.js`;
        }

        if (!fs.existsSync(script)) {
            console.error(`Cannot find execution file: ${script}`);
            reject(`Cannot find execution file: ${script}`);
        } else {
            const cmd = `node ${script} --max-old-space-size=7000 build`;
            const child = cp.exec(cmd, { cwd: src });

            child.stderr.pipe(process.stderr);
            child.stdout.pipe(process.stdout);

            child.on('exit', (code /* , signal */) => {
                // code 1 is a strange error that cannot be explained. Everything is installed but error :(
                if (code && code !== 1) {
                    reject(`Cannot install: ${code}`);
                } else {
                    console.log(`"${cmd} in ${src} finished.`);
                    // command succeeded
                    resolve();
                }
            });
            // const child = cp.fork(script, ['--max-old-space-size=8192', 'build'], options);
            /*
            child.stdout.on('data', data => console.log(data.toString()));
            child.stderr.on('data', data => console.log(data.toString()));
            child.on('close', code => {
                console.log(`child process exited with code ${code}`);
                code ? reject('Exit code: ' + code) : resolve();
            });
            */
        }
    });
}

function copyFiles() {
    deleteFoldersRecursive(`${__dirname}/dest`);
    deleteFoldersRecursive(`${__dirname}/admin/custom`);
    deleteFoldersRecursive(`${__dirname}/${srcRx}public/lib/js/crypto-js`);

    return Promise.all([
        gulp
            .src([
                `${srcRx}build/**/*`,
                `!${srcRx}build/index.html`,
                `!${srcRx}build/static/js/*.js`,
                `!${srcRx}build/i18n/**/*`,
                `!${srcRx}build/i18n`,
            ])
            .pipe(gulp.dest(dest)),

        gulp
            .src([`${srcRx}build/index.html`])
            .pipe(replace('href="/', 'href="'))
            .pipe(replace('src="/', 'src="'))
            .pipe(gulp.dest(dest)),

        // copy custom plugin
        gulp
            .src([`${rootFolder}/node_modules/@iobroker/admin-component-easy-access/admin/**/*`])
            .pipe(gulp.dest('admin/')),

        // copy crypto-js
        gulp
            .src([
                `${rootFolder}/node_modules/crypto-js/*.*`,
                `!${rootFolder}/node_modules/crypto-js/CONTRIBUTING.md`,
                `!${rootFolder}/node_modules/crypto-js/README.md`,
            ])
            .pipe(gulp.dest(dest + 'lib/js/crypto-js')),

        gulp
            .src([`${srcRx}build/static/js/*.js`])
            .pipe(replace('s.p+"static/media', '"./static/media'))
            .pipe(gulp.dest(`${dest}static/js/`)),
    ]);
}

function patchIndex() {
    return new Promise(resolve => {
        if (fs.existsSync(`${dest}/index.html`)) {
            let code = fs.readFileSync(`${dest}/index.html`).toString('utf8');
            // replace code
            code = code.replace(
                /<script>const script=document[^<]+<\/script>/,
                `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="./lib/js/socket.io.js"></script>`
            );
            code = code.replace(
                /<script>var script=document[^<]+<\/script>/,
                `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="./lib/js/socket.io.js"></script>`
            );
            fs.writeFileSync(`${dest}/index.html`, code);
            resolve();
        } else {
            // wait till finished
            setTimeout(() => {
                if (fs.existsSync(`${dest}/index.html`)) {
                    let code = fs.readFileSync(`${dest}/index.html`).toString('utf8');
                    // replace code
                    code = code.replace(
                        /<script>const script=document[^<]+<\/script>/,
                        `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="./lib/js/socket.io.js"></script>`
                    );
                    code = code.replace(
                        /<script>var script=document[^<]+<\/script>/,
                        `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="./lib/js/socket.io.js"></script>`
                    );
                    fs.writeFileSync(`${dest}/index.html`, code);
                }
                resolve();
            }, 2000);
        }
    });
}

gulp.task('react-0-configCSS', () => {
    return gulp
        .src([`./${srcRx}less/selectID.less`, `./${srcRx}less/adapter.less`, `./${srcRx}less/materializeCorrect.less`])
        .pipe(sourcemaps.init())
        .pipe(
            less({
                paths: [],
            })
        )
        .pipe(concat('adapter.css'))
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(`./${srcRx}public/css`));
});

gulp.task('react-0-iobCSS', () => {
    return gulp
        .src([`./${srcRx}less/selectID.less`])
        .pipe(sourcemaps.init())
        .pipe(
            less({
                paths: [],
            })
        )
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(`./${srcRx}public/lib/css/iob`));
});

gulp.task('react-0-treeTableCSS', () => {
    return gulp
        .src([`./${srcRx}less/jquery.treetable.theme.less`])
        .pipe(sourcemaps.init())
        .pipe(
            less({
                paths: [],
            })
        )
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(`./${srcRx}public/lib/css`));
});

gulp.task('react-1-clean', done => {
    deleteFoldersRecursive(`${__dirname}/${dest}`, ['404.html', 'oauthError.html', 'oauthSuccess.html']);
    deleteFoldersRecursive(`${__dirname}/${srcRx}/build`);
    deleteFoldersRecursive(`${__dirname}/src/build`);
    done();
});

gulp.task('react-2-npm', () => {
    if (fs.existsSync(`${src}node_modules`)) {
        return Promise.resolve();
    } else {
        return npmInstall();
    }
});

gulp.task(
    'react-2-npm-dep',
    gulp.series('react-1-clean', 'react-2-npm', 'react-0-configCSS', 'react-0-iobCSS', 'react-0-treeTableCSS')
);

gulp.task('react-3-build', () => build());

gulp.task('react-3-build-dep', gulp.series('react-2-npm-dep', 'react-3-build'));

gulp.task('react-5-copy', () => copyFiles());

gulp.task('react-5-copy-dep', gulp.series('react-3-build-dep', 'react-5-copy'));

gulp.task('react-6-patch', () => patchIndex());

gulp.task('react-6-patch-dep', gulp.series('react-5-copy-dep', 'react-6-patch'));

gulp.task('react-build', gulp.series('react-6-patch-dep'));

gulp.task('default', gulp.series('react-build'));
