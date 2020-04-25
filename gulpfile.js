'use strict';

const less        = require('gulp-less');
const sass        = require('gulp-sass');
const gulp        = require('gulp');
const colors      = require('ansi-colors');
const log         = require('fancy-log');
const uglify      = require('gulp-terser');
const htmlmin     = require('gulp-htmlmin');
const concat      = require('gulp-concat');
const sourcemaps  = require('gulp-sourcemaps');
const materialize = require.resolve('materialize-css');
const cleanCSS    = require('gulp-clean-css');
const pkg         = require('./package.json');
const iopackage   = require('./io-package.json');
const babel       = require('gulp-babel');
const fs          = require('fs');

const fileName = 'words.js';
const noSort   = false;

/* How to work with language scripts
--------------------------------------------------------
    you can use for edit this tool https://github.com/ldittmar81/ioBroker-i18n-editor
    to do that you can convert words from words.js into 6 json files, that i18n editor can understand. Use "www (words.js => json).

    To combine from json files the words.js again, just call www (json => words.js)

    wwwWords2languages - converts src/js/words.js into 6 different json files in src/i18n/xxx/translations.json
    wwwLanguages2words - converts 6 different json files from src/i18n/xxx/translations.json into src/js/words.js
--------------------------------------------------------
    You can export just a flat texts and translate them with e.g. google translator.
    to do that you can convert words from words.js into 7 txt files. www (words.js => flat)

    To combine from json files the words.js again, just call www (flat => words.js)

    wwwWords2languagesFlat - converts src/js/words.js into 6 different txt files in src/i18n/xxx/flat.txt. Additionally it creates extra files with keys in src/i18n/flat.txt
    wwwLanguagesFlat2words - converts src/i18n/xxx/flat.txt into src/js/words.js

    adminWordsXXx is just the same, but for /admin/words.js
 */

function lang2data(lang, isFlat) {
    let str = isFlat ? '' : '{\r\n';
    let count = 0;
    for (const w in lang) {
        if (lang.hasOwnProperty(w)) {
            count++;
            if (isFlat) {
                str += (lang[w] === '' ? (isFlat[w] || w) : lang[w]) + '\r\n';
            } else {
                const key = '  "' + w.replace(/"/g, '\\"') + '": ';
                str += /*padRight(*/key/*, 42)*/ +  '"' + lang[w].replace(/"/g, '\\"') + '",\r\n';
            }
        }
    }
    if (!count) return isFlat ? '' : '{\r\n}';
    if (isFlat) {
        return str;
    } else {
        return str.substring(0, str.length - 3) + '\r\n}\r\n';
    }
}

function readWordJs(src) {
    try {
        let words;
        if (fs.existsSync(src + 'js/' + fileName)) {
            words = fs.readFileSync(src + 'js/' + fileName).toString();
        } else {
            words = fs.readFileSync(src + fileName).toString();
        }

        const lines = words.split(/\r\n|\r|\n/g);
        let i = 0;
        while (!lines[i].match(/^systemDictionary = {/)) {
            i++;
        }
        lines.splice(0, i);

        // remove last empty lines
        i = lines.length - 1;
        while (!lines[i]) {
            i--;
        }
        if (i < lines.length - 1) {
            lines.splice(i + 1);
        }

        lines[0] = lines[0].replace('systemDictionary = ', '');
        lines[lines.length - 1] = lines[lines.length - 1].trim().replace(/};$/, '}');
        words = lines.join('\n');
        const resultFunc = new Function('return ' + words + ';');

        return resultFunc();
    } catch (e) {
        return null;
    }
}
function padRight(text, totalLength) {
    return text + (text.length < totalLength ? new Array(totalLength - text.length).join(' ') : '');
}
function writeWordJs(data, src) {
    let text = '// DO NOT EDIT THIS FILE!!! IT WILL BE AUTOMATICALLY GENERATED FROM src/i18n\n';
    text += '/*global systemDictionary:true */\n';
    text += '\'use strict\';\n\n';
    text += 'systemDictionary = {\n';
    for (const word in data) {
        if (data.hasOwnProperty(word)) {
            text += '    ' + padRight('"' + word.replace(/"/g, '\\"') + '": {', 50);
            let line = '';
            for (const lang in data[word]) {
                if (data[word].hasOwnProperty(lang)) {
                    line += '"' + lang + '": "' + padRight(data[word][lang].replace(/"/g, '\\"') + '",', 50) + ' ';
                }
            }
            if (line) {
                line = line.trim();
                line = line.substring(0, line.length - 1);
            }
            text += line + '},\n';
        }
    }
    text += '};\n';
    if (src.indexOf('admin') === -1) {
        fs.writeFileSync(src + 'js/' + fileName, text);
    } else {
        fs.writeFileSync(src + fileName, text);
    }
}

const EMPTY = '';

function words2languages(src) {
    const langs =  {
        'en': {},
        'de': {},
        'ru': {},
        'pt': {},
        'nl': {},
        'fr': {},
        'it': {},
        'es': {},
        'pl': {},
        'zh-cn': {}
    };
    const data = readWordJs(src);
    if (data) {
        for (const word in data) {
            if (data.hasOwnProperty(word)) {
                for (const lang in data[word]) {
                    if (data[word].hasOwnProperty(lang)) {
                        langs[lang][word] = data[word][lang];
                        //  pre-fill all other languages
                        for (const j in langs) {
                            if (langs.hasOwnProperty(j)) {
                                langs[j][word] = langs[j][word] || EMPTY;
                            }
                        }
                    }
                }
            }
        }
        if (!fs.existsSync(src + 'i18n/')) {
            fs.mkdirSync(src + 'i18n/');
        }
        for (const l in langs) {
            const keys = Object.keys(langs[l]);
            if (!noSort) keys.sort();
            const obj = {};
            for (let k = 0; k < keys.length; k++) {
                obj[keys[k]] = langs[l][keys[k]];
            }
            if (!fs.existsSync(src + 'i18n/' + l)) {
                fs.mkdirSync(src + 'i18n/' + l);
            }

            fs.writeFileSync(src + 'i18n/' + l + '/translations.json', lang2data(obj));
        }
    } else {
        console.error('Cannot read or parse ' + fileName);
    }
}

function words2languagesFlat(src) {
    const langs =  {
        'en': {},
        'de': {},
        'ru': {},
        'pt': {},
        'nl': {},
        'fr': {},
        'it': {},
        'es': {},
        'pl': {},
        'zh-cn': {}
    };
    const data = readWordJs(src);
    if (data) {
        for (const word in data) {
            if (data.hasOwnProperty(word)) {
                for (const lang in data[word]) {
                    if (data[word].hasOwnProperty(lang)) {
                        langs[lang][word] = data[word][lang];
                        //  pre-fill all other languages
                        for (const j in langs) {
                            if (langs.hasOwnProperty(j)) {
                                langs[j][word] = langs[j][word] || EMPTY;
                            }
                        }
                    }
                }
            }
        }
        const keys = Object.keys(langs.en);
        if (!noSort) keys.sort();
        for (const l in langs) {
            const obj = {};
            for (let k = 0; k < keys.length; k++) {
                obj[keys[k]] = langs[l][keys[k]];
            }
            langs[l] = obj;
        }
        if (!fs.existsSync(src + 'i18n/')) {
            fs.mkdirSync(src + 'i18n/');
        }
        for (const ll in langs) {
            if (!fs.existsSync(src + 'i18n/' + ll)) {
                fs.mkdirSync(src + 'i18n/' + ll);
            }

            fs.writeFileSync(src + 'i18n/' + ll + '/flat.txt', lang2data(langs[ll], langs.en));
        }
        fs.writeFileSync(src + 'i18n/flat.txt', keys.join('\n'));
    } else {
        console.error('Cannot read or parse ' + fileName);
    }
}
function languagesFlat2words(src) {
    const dirs = fs.readdirSync(src + 'i18n/');
    const langs = {};
    const bigOne = {};
    const order = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'zh-cn'];
    dirs.sort(function (a, b) {
        const posA = order.indexOf(a);
        const posB = order.indexOf(b);
        if (posA === -1 && posB === -1) {
            if (a > b) return 1;
            if (a < b) return -1;
            return 0;
        } else if (posA === -1) {
            return -1;
        } else if (posB === -1) {
            return 1;
        } else {
            if (posA > posB) return 1;
            if (posA < posB) return -1;
            return 0;
        }
    });

    const keys = fs.readFileSync(src + 'i18n/flat.txt').toString().split(/\r\n|\n|\r/);

    for (let l = 0; l < dirs.length; l++) {
        if (dirs[l] === 'flat.txt') continue;
        const lang = dirs[l];
        const values = fs.readFileSync(src + 'i18n/' + lang + '/flat.txt').toString().split(/\r\n|\n|\r/);
        langs[lang] = {};
        keys.forEach(function (word, i) {
             langs[lang][word] = values[i];
        });

        const words = langs[lang];
        for (const word in words) {
            if (words.hasOwnProperty(word)) {
                bigOne[word] = bigOne[word] || {};
                if (words[word] !== EMPTY) {
                    bigOne[word][lang] = words[word];
                }
            }
        }
    }
    // read actual words.js
    const aWords = readWordJs();

    const temporaryIgnore = ['flat.txt'];
    if (aWords) {
        // Merge words together
        for (const w in aWords) {
            if (aWords.hasOwnProperty(w)) {
                if (!bigOne[w]) {
                    console.warn('Take from actual ' + fileName + ': ' + w);
                    bigOne[w] = aWords[w];
                }
                dirs.forEach(function (lang) {
                    if (temporaryIgnore.indexOf(lang) !== -1) return;
                    if (!bigOne[w][lang]) {
                        console.warn('Missing "' + lang + '": ' + w);
                    }
                });
            }
        }

    }

    writeWordJs(bigOne, src);
}
function languages2words(src) {
    const dirs = fs.readdirSync(src + 'i18n/');
    const langs = {};
    const bigOne = {};
    const order = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'zh-cn'];
    dirs.sort(function (a, b) {
        const posA = order.indexOf(a);
        const posB = order.indexOf(b);
        if (posA === -1 && posB === -1) {
            if (a > b) return 1;
            if (a < b) return -1;
            return 0;
        } else if (posA === -1) {
            return -1;
        } else if (posB === -1) {
            return 1;
        } else {
            if (posA > posB) return 1;
            if (posA < posB) return -1;
            return 0;
        }
    });

    for (let l = 0; l < dirs.length; l++) {
        if (dirs[l] === 'flat.txt' || dirs[l] === '.i18n-editor-metadata') continue;
        const lang = dirs[l];
        langs[lang] = fs.readFileSync(src + 'i18n/' + lang + '/translations.json').toString();
        langs[lang] = JSON.parse(langs[lang]);
        const words = langs[lang];
        for (const word in words) {
            if (words.hasOwnProperty(word)) {
                bigOne[word] = bigOne[word] || {};
                if (words[word] !== EMPTY) {
                    bigOne[word][lang] = words[word].replace(/<\/ i>/g, '</i>').replace(/<\/ b>/g, '</b>').replace(/<\/ span>/g, '</span>').replace(/% s/g, ' %s');
                }
            }
        }
    }
    // read actual words.js
    const aWords = readWordJs();

    const temporaryIgnore = [];
    if (aWords) {
        // Merge words together
        for (const w in aWords) {
            if (aWords.hasOwnProperty(w)) {
                if (!bigOne[w]) {
                    console.warn('Take from actual ' + fileName + ': ' + w);
                    bigOne[w] = aWords[w];
                }
                dirs.forEach(function (lang) {
                    if (temporaryIgnore.indexOf(lang) !== -1) return;
                    if (!bigOne[w][lang]) {
                        console.warn('Missing "' + lang + '": ' + w);
                    }
                });
            }
        }

    }

    writeWordJs(bigOne, src);
}

gulp.task('www (words.js => json)', done => {
    words2languages('./src/');
    done();
});

gulp.task('www (words.js => flat)', done => {
    words2languagesFlat('./src/');
    done();
});

gulp.task('www (flat => words.js)', done => {
    languagesFlat2words('./src/');
    done();
});

gulp.task('www (json => words.js)', done => {
    languages2words('./src/');
    done();
});

gulp.task('admin (words.js => json)', done => {
    words2languages('./admin/');
    done();
});

gulp.task('admin (words.js => flat)', done => {
    words2languagesFlat('./admin/');
    done();
});

gulp.task('admin (flat => words.js)', done => {
    languagesFlat2words('./admin/');
    done();
});

gulp.task('admin (json => words.js)', done => {
    languages2words('./admin/');
    done();
});

gulp.task('updatePackages', done => {
    iopackage.common.version = pkg.version;
    iopackage.common.news = iopackage.common.news || {};
    if (!iopackage.common.news[pkg.version]) {
        const news = iopackage.common.news;
        const newNews = {};

        newNews[pkg.version] = {
            en: 'news',
            de: 'neues',
            ru: 'новое',
            pt: 'novidades',
            nl: 'nieuws',
            fr: 'nouvelles',
            it: 'notizie',
            es: 'noticias',
            pl: 'aktualności',
            'zh-cn': '消息'
        };
        iopackage.common.news = Object.assign(newNews, news);
    }
    fs.writeFileSync('io-package.json', JSON.stringify(iopackage, null, 4));
    done();
});

gulp.task('updateReadme', done => {
    const readme = fs.readFileSync('README.md').toString();
    const pos = readme.indexOf('## Changelog\n');
    if (pos !== -1) {
        const readmeStart = readme.substring(0, pos + '## Changelog\n'.length);
        const readmeEnd   = readme.substring(pos + '## Changelog\n'.length);

        if (readme.indexOf(version) === -1) {
            const timestamp = new Date();
            const date = timestamp.getFullYear() + '-' +
                ('0' + (timestamp.getMonth() + 1).toString(10)).slice(-2) + '-' +
                ('0' + (timestamp.getDate()).toString(10)).slice(-2);

            let news = '';
            if (iopackage.common.news && iopackage.common.news[pkg.version]) {
                news += '* ' + iopackage.common.news[pkg.version].en;
            }

            fs.writeFileSync('README.md', readmeStart + '### ' + version + ' (' + date + ')\n' + (news ? news + '\n\n' : '\n') + readmeEnd);
        }
    }
    done();
});

gulp.task('materializeCSS', () => {
    return gulp.src(['./src/materialize-css/sass/**/*.scss'])
        .pipe(sass({
            paths: [ ]
        }))
        .pipe(concat('materialize.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('./www/lib/css'));

});

gulp.task('materializeJS', () => {
    return gulp.src([
        './src/materialize-css/js/global.js',
        './src/materialize-css/js/component.js',
        './src/materialize-css/js/anime.min.js',
        './src/materialize-css/js/cash.js',
        './src/materialize-css/js/cards.js',
        './src/materialize-css/js/tabs.js',
        './src/materialize-css/js/dropdown.js',
        './src/materialize-css/js/toasts.js',
        './src/materialize-css/js/modal.js',
        './src/materialize-css/js/select.js',
        './src/materialize-css/js/forms.js',
        './src/materialize-css/js/range.js',
        './src/materialize-css/js/collapsible.js',
        './src/materialize-css/js/chips.js',
        './src/materialize-css/js/datepicker.js',
        './src/materialize-css/js/autocomplete.js',
        './src/materialize-css/js/timepicker.js',
        './src/materialize-css/js/tooltip.js',
        './src/materialize-css/js/autocomplete.js',
        './src/colorpicker/js/materialize-colorpicker.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('materialize.js'))
    .pipe(babel({
        plugins: [
            '@babel/plugin-transform-arrow-functions',
            '@babel/plugin-transform-block-scoping',
            '@babel/plugin-transform-classes',
            '@babel/plugin-transform-template-literals'
        ]
    }))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./www/lib/js'));
});

gulp.task('configCSS', () => {
    return gulp.src([
        './src/lib/css/iob/selectID.less',
        './src/less/adapter.less',
        './src/less/materializeCorrect.less'
    ])
        .pipe(sourcemaps.init())
        .pipe(less({
            paths: [ ]
        }))
        .pipe(concat('adapter.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/css'));
});

gulp.task('iobCSS', () => {
    return gulp.src(['./src/lib/css/iob/*.less'])
        .pipe(sourcemaps.init())
        .pipe(less({
            paths: [ ]
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/lib/css/iob'));
});

// for older selectID
gulp.task('adminCSS', () => {
    return gulp.src(['./src/less/admin.less'])
        .pipe(sourcemaps.init())
        .pipe(less({
            paths: [ ]
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/css/'));
});

gulp.task('treeTableCSS', () => {
    return gulp.src(['./src/lib/css/jquery.treetable.theme.less'])
        .pipe(sourcemaps.init())
        .pipe(less({
            paths: [ ]
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/lib/css'));
});

gulp.task('fancyTreeJS', () => {
    return gulp.src([
        './src/lib/js/jquery.fancytree-all.js'
    ])
        .pipe(sourcemaps.init())
        .pipe(concat('jquery.fancytree-all.min.js'))
        .pipe(uglify())
        .on('error', function (err) {
            log.error(colors.red('[Error] ') + err.toString());
        })
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/lib/js'));
});

gulp.task('appJS', () => {
    return gulp.src([
        './src/js/*.js',
        '!./src/js/adapter-settings.js'
    ])
        .pipe(sourcemaps.init())
        .pipe(concat('app.js'))
        .pipe(uglify())
        .on('error', err => log.error(colors.red('[Error] ') + err.toString()))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/js'));
});

gulp.task('appHTML', () => {
    return gulp.src([
        './src/indexStart.html',
        './src/admin*.html',
        './src/indexEnd.html'
    ])
        .pipe(sourcemaps.init())
        .pipe(concat('index.html'))
        .pipe(htmlmin({collapseWhitespace: true, removeComments: true}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/'));
});

gulp.task('appCSS', () => {
    return gulp.src([
        './src/less/*.less',
        './src/colorpicker/less/*.less',
        '!./src/less/adapter.less'
    ])
        .pipe(sourcemaps.init())
        .pipe(less({
            paths: [ ]
        }))
        .pipe(concat('app.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/css'));
});

gulp.task('vendorJS', () => {
    return gulp.src([
        './src/lib/js/jquery-3.2.1.min.js',
        './src/lib/js/jquery-migrate-3.0.1.js',
        './src/lib/js/jquery-ui.min.js',
        './src/lib/js/colResizable-1.6.js',
        './src/lib/js/jquery.multiselect-1.13.min.js',
        './src/lib/js/semver.min.js',
        './src/lib/js/ace-1.2.0/ace.js',
        './src/lib/js/loStorage.js',
        './src/lib/js/translate.js',
        './src/lib/js/jquery.fancytree-all.js',
        './src/lib/js/jquery.treetable.js',
        './src/lib/js/jquery.ui.touch-punch.min.js',
        './src/lib/js/selectID.js',
        './src/lib/js/cron/jquery.cron.locale.js',
        './src/lib/js/cron/jquery.cron.words.js',
        './src/lib/js/cron/jquery.cron.js',
        './src/lib/js/cron/cron2text.js',
        './src/lib/js/showdown.min.js'
    ])
        .pipe(sourcemaps.init())
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .on('error', function (err) {
            log.error(colors.red('[Error] ') + err.toString());
        })
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/lib/js'));
});

gulp.task('colorpick.min', () => {
    return gulp.src([
        './src/lib/js/colResizable-1.6.js'
    ])
        .pipe(sourcemaps.init())
        .pipe(concat('colResizable-1.6.min.js'))
        .pipe(uglify())
        .on('error', function (err) {
            log.error(colors.red('[Error] ') + err.toString());
        })
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/lib/js'));
});

gulp.task('appCopy', gulp.series('colorpick.min', () => 
    gulp.src([
        './src/**/*.*',
        '!./src/i18n/**/*',
        '!./src/*.html',
        '!./src/lib/js/jquery.migrate-3.0.1.js',
        '!./src/lib/js/jquery.fancytree-all.js',
        '!./src/lib/js/colResizable-1.6.js',
        '!./src/**/*.less',
        '!./src/js/**/admin*.js',
        '!./src/js/**/words.js',
        '!./src/materialize-css/**/*',
        '!./src/colorpicker/**/*',
        './src/configs.html'
    ])
    .pipe(gulp.dest('./www'))));

gulp.task('colorpickerCopy', () => {
    return gulp.src([
        './src/colorpicker/**/*.png'
    ])
        .pipe(gulp.dest('./www'));
});
gulp.task('aceCopy', () => {
    return gulp.src([
        './src/lib/js/ace-1.2.0/mode-json.js',
        './src/lib/js/ace-1.2.0/worker-json.js'
    ],  {base: './src/lib/js/ace-1.2.0/'})
    .pipe(gulp.dest('./www'));
});
gulp.task('copy', gulp.parallel('appCopy', 'aceCopy', 'colorpickerCopy'));

gulp.task('watch', () => {
    gulp.watch('./src/css/*.less', ['lessApp']);
    gulp.watch('./src/lib/css/iob/*.less', ['lessApp']);
    gulp.watch(['./src/materialize-css/sass/**/*.scss'], ['sassMaterialize']);
    gulp.watch(['./src/js/*.js'], ['compressApp']);
});

gulp.task('1_words',  gulp.parallel('www (json => words.js)', 'admin (json => words.js)'));
gulp.task('2_css',    gulp.parallel('iobCSS', 'adminCSS', 'appCSS', 'treeTableCSS', 'configCSS', 'materializeCSS'));
gulp.task('3_js',     gulp.parallel('vendorJS', 'materializeJS', 'appJS', 'fancyTreeJS')); //compressApp is last, to give the time for 1_words to be finshed. Because words.js is used in app.js
gulp.task('4_static', gulp.parallel('appHTML', 'aceCopy', 'colorpickerCopy', 'appCopy'));

gulp.task('default', gulp.series(
    '1_words',
    '2_css',
    '3_js',
    '4_static'));

// add react tasks
require('./gulpReact')(gulp);
