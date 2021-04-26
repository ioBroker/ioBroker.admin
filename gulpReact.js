const fs      = require('fs');
const del     = require('del');
const replace = require('gulp-replace');
const cp      = require('child_process');

const srcRx = 'src-rx/';
const src = __dirname + '/' + srcRx;
const dir = src + '/src/i18n/';
const dest = 'www-react/';

function npmInstall() {
    return new Promise((resolve, reject) => {
        // Install node modules
        const cwd = src.replace(/\\/g, '/');

        const cmd = `npm install`;
        console.log(`"${cmd} in ${cwd}`);

        // System call used for update of js-controller itself,
        // because during installation npm packet will be deleted too, but some files must be loaded even during the install process.
        const exec = require('child_process').exec;
        const child = exec(cmd, {cwd});

        child.stderr.pipe(process.stderr);
        child.stdout.pipe(process.stdout);

        child.on('exit', (code /* , signal */) => {
            // code 1 is strange error that cannot be explained. Everything is installed but error :(
            if (code && code !== 1) {
                reject('Cannot install: ' + code);
            } else {
                console.log(`"${cmd} in ${cwd} finished.`);
                // command succeeded
                resolve();
            }
        });
    });
}

function build() {
    fs.writeFileSync(src + 'public/lib/js/sparkline.js',     fs.readFileSync(src + 'node_modules/@fnando/sparkline/dist/sparkline.js'));
    fs.writeFileSync(src + 'public/lib/js/sparkline.js.map', fs.readFileSync(src + 'node_modules/@fnando/sparkline/dist/sparkline.js.map'));

    const version = JSON.parse(fs.readFileSync(__dirname + '/package.json').toString('utf8')).version;
    const data    = JSON.parse(fs.readFileSync(src + 'package.json').toString('utf8'));

    data.version = version;

    fs.writeFileSync(src + 'package.json', JSON.stringify(data, null, 4));

    return new Promise((resolve, reject) => {
        const options = {
            stdio: 'pipe',
            cwd:   src
        };

        console.log(options.cwd);

        let script = src + 'node_modules/react-scripts/scripts/build.js';
        if (!fs.existsSync(script)) {
            script = __dirname + '/node_modules/react-scripts/scripts/build.js';
        }
        if (!fs.existsSync(script)) {
            console.error('Cannot find execution file: ' + script);
            reject('Cannot find execution file: ' + script);
        } else {
            const child = cp.fork(script, [], options);
            child.stdout.on('data', data => console.log(data.toString()));
            child.stderr.on('data', data => console.log(data.toString()));
            child.on('close', code => {
                console.log(`child process exited with code ${code}`);
                code ? reject('Exit code: ' + code) : resolve();
            });
        }
    });
}

function copyFiles(gulp) {
    return del([
        dest + '**/*'
    ]).then(() => {
        return Promise.all([
            gulp.src([
                srcRx + 'build/**/*',
                `!${srcRx}build/index.html`,
                `!${srcRx}build/static/js/main.*.chunk.js`,
                `!${srcRx}build/i18n/**/*`,
                `!${srcRx}build/i18n`
            ])
                .pipe(gulp.dest(dest)),

            gulp.src([
                `${srcRx}build/index.html`,
            ])
                .pipe(replace('href="/', 'href="'))
                .pipe(replace('src="/', 'src="'))
                .pipe(gulp.dest(dest)),
            gulp.src([
                `${srcRx}build/static/js/main.*.chunk.js`,
            ])
                .pipe(replace('s.p+"static/media/copy-content', '"./static/media/copy-content'))
                .pipe(gulp.dest(dest + 'static/js/')),
        ])
    });
}

function patchIndex() {
    return new Promise(resolve => {
        if (fs.existsSync(dest + '/index.html')) {
            let code = fs.readFileSync(dest + '/index.html').toString('utf8');
            // replace code
            code = code.replace(/<script>const script=document[^<]+<\/script>/, `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="./lib/js/socket.io.js"></script>`);
            code = code.replace(/<script>var script=document[^<]+<\/script>/, `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="./lib/js/socket.io.js"></script>`);
            fs.writeFileSync(dest + '/index.html', code);
            resolve();
        } else {
            // wait till finished
            setTimeout(() => {
                if (fs.existsSync(dest + '/index.html')) {
                    let code = fs.readFileSync(dest + '/index.html').toString('utf8');
                    // replace code
                    code = code.replace(/<script>const script=document[^<]+<\/script>/, `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="./lib/js/socket.io.js"></script>`);
                    code = code.replace(/<script>var script=document[^<]+<\/script>/, `<script type="text/javascript" onerror="setTimeout(function(){window.location.reload()}, 5000)" src="./lib/js/socket.io.js"></script>`);
                    fs.writeFileSync(dest + '/index.html', code);
                }
                resolve();
            }, 2000);
        }
    });
}

function i18n2flat() {
    const files = fs.readdirSync(dir).filter(name => name.match(/\.json$/));
    const index = {};
    const langs = [];
    files.forEach(file => {
        const lang = file.replace(/\.json$/, '');
        langs.push(lang);
        const text = require(dir + file);

        for (const id in text) {
            if (text.hasOwnProperty(id)) {
                index[id] = index[id] || {};
                index[id][lang] = text[id] === undefined ? id : text[id];
            }
        }
    });

    const keys = Object.keys(index);
    keys.sort();

    if (!fs.existsSync(dir + '/flat/')) {
        fs.mkdirSync(dir + '/flat/');
    }

    langs.forEach(lang => {
        const words = [];
        keys.forEach(key => {
            words.push(index[key][lang]);
        });
        fs.writeFileSync(dir + '/flat/' + lang + '.txt', words.join('\n'));
    });
    fs.writeFileSync(dir + '/flat/index.txt', keys.join('\n'));
}

function flat2i18n() {
    if (!fs.existsSync(dir + '/flat/')) {
        console.error(dir + '/flat/ directory not found');
        return done();
    }
    const keys = fs.readFileSync(dir + '/flat/index.txt').toString().split(/[\r\n]/);
    while (!keys[keys.length - 1]) keys.splice(keys.length - 1, 1);

    const files = fs.readdirSync(dir + '/flat/').filter(name => name.match(/\.txt$/) && name !== 'index.txt');
    const index = {};
    const langs = [];
    files.forEach(file => {
        const lang = file.replace(/\.txt$/, '');
        langs.push(lang);
        const lines = fs.readFileSync(dir + '/flat/' + file).toString().split(/[\r\n]/);
        lines.forEach((word, i) => {
            index[keys[i]] = index[keys[i]] || {};
            index[keys[i]][lang] = word;
        });
    });
    langs.forEach(lang => {
        const words = {};
        keys.forEach((key, line) => {
            if (!index[key]) {
                console.log('No word ' + key + ', ' + lang + ', line: ' + line);
            }
            words[key] = index[key][lang];
        });
        fs.writeFileSync(dir + '/' + lang + '.json', JSON.stringify(words, null, 4));
    });
}

function init(gulp) {
    gulp.task('react-i18n=>react-flat', done => {
        i18n2flat();
        done();
    });

    gulp.task('react-flat=>react-i18n', done => {
        flat2i18n();
        done();
    });

    gulp.task('react-clean', () => {
        return del([
            // 'src/node_modules/**/*',
            dest + '/**/*',
            dest + '*',
            'src/build/**/*'
        ]).then(del([
            // 'src/node_modules',
            'src/build',
            dest
        ]));
    });

    gulp.task('react-2-npm', () => {
        if (fs.existsSync(src + 'node_modules')) {
            return Promise.resolve();
        } else {
            return npmInstall();
        }
    });

    gulp.task('react-2-npm-dep', gulp.series('react-clean', 'react-2-npm'));

    gulp.task('react-3-build', () => build(gulp));

    gulp.task('react-3-build-dep', gulp.series('react-2-npm-dep', 'react-3-build'));

    gulp.task('react-5-copy', () => copyFiles(gulp));

    gulp.task('react-5-copy-dep', gulp.series('react-3-build-dep', 'react-5-copy'));

    gulp.task('react-6-patch', () => patchIndex(gulp));

    gulp.task('react-6-patch-dep', gulp.series('react-5-copy-dep', 'react-6-patch'));

    gulp.task('react-build', gulp.series('react-6-patch-dep'));
}

module.exports = init;