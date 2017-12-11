'use strict';

var less        = require('gulp-less');
var sass        = require('gulp-sass');
var gulp        = require('gulp');
var uglify      = require('gulp-uglify');
var concat      = require('gulp-concat');
var sourcemaps  = require('gulp-sourcemaps');
var materialize = require.resolve('materialize-css');
var addsrc      = require('gulp-add-src');
var cleanCSS    = require('gulp-clean-css');
var pkg         = require('./package.json');
var iopackage   = require('./io-package.json');

gulp.task('updatePackages', function (done) {
    iopackage.common.version = pkg.version;
    iopackage.common.news = iopackage.common.news || {};
    if (!iopackage.common.news[pkg.version]) {
        var news = iopackage.common.news;
        var newNews = {};

        newNews[pkg.version] = {
            en: 'news',
            de: 'neues',
            ru: 'новое'
        };
        iopackage.common.news = Object.assign(newNews, news);
    }
    fs.writeFileSync('io-package.json', JSON.stringify(iopackage, null, 4));
    done();
});

gulp.task('updateReadme', function (done) {
    var readme = fs.readFileSync('README.md').toString();
    var pos = readme.indexOf('## Changelog\n');
    if (pos !== -1) {
        var readmeStart = readme.substring(0, pos + '## Changelog\n'.length);
        var readmeEnd   = readme.substring(pos + '## Changelog\n'.length);

        if (readme.indexOf(version) === -1) {
            var timestamp = new Date();
            var date = timestamp.getFullYear() + '-' +
                ('0' + (timestamp.getMonth() + 1).toString(10)).slice(-2) + '-' +
                ('0' + (timestamp.getDate()).toString(10)).slice(-2);

            var news = '';
            if (iopackage.common.news && iopackage.common.news[pkg.version]) {
                news += '* ' + iopackage.common.news[pkg.version].en;
            }

            fs.writeFileSync('README.md', readmeStart + '### ' + version + ' (' + date + ')\n' + (news ? news + '\n\n' : '\n') + readmeEnd);
        }
    }
    done();
});

gulp.task('sassMaterialize', function () {
    gulp.src(['./src/materialize-css/sass/**/*.scss'])
        .pipe(sass({
            paths: [ ]
        }))
        .pipe(concat('materialize.css'))
//        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('./www/lib/css'));

});
gulp.task('compressMaterialize', function () {
    return gulp.src([
        './src/materialize-css/js/velocity.min.js',
        './src/materialize-css/js/global.js',
        './src/materialize-css/js/tabs.js',
        './src/materialize-css/js/dropdown.js',
        './src/materialize-css/js/toasts.js',
        './src/materialize-css/js/modal.js',
        './src/materialize-css/js/forms.js',
        './src/materialize-css/js/forms.js',
        './src/colorpicker/js/materialize-colorpicker.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('materialize.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./www/lib/js'));
});

gulp.task('lessApp', function () {
    gulp.src(['./src/css/*.less', './src/colorpicker/less/*.less'])
        .pipe(sourcemaps.init())
        .pipe(less({
            paths: [ ]
        }))
        .pipe(concat('app.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/css'));
});

gulp.task('lessIob', function () {
    return gulp.src(['./src/lib/css/iob/*.less'])
        .pipe(sourcemaps.init())
        .pipe(less({
            paths: [ ]
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/lib/css/iob'));
});
gulp.task('lessTreeTable', function () {
    return gulp.src(['./src/lib/css/jquery.treetable.theme.less'])
        .pipe(sourcemaps.init())
        .pipe(less({
            paths: [ ]
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/lib/css'));
});
gulp.task('compressApp', function () {
    return gulp.src([
        './src/js/*.js',
        '!./src/js/adapter-settings.js',
        '!./src/js/adminStates.js',
        '!./src/js/adminGroups.js'
    ])
        .pipe(sourcemaps.init())
        .pipe(concat('app.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/js'));
});

gulp.task('compressVendor', function () {
    return gulp.src([
        './src/lib/js/jquery-1.11.2.min.js',
        './src/lib/js/jquery-ui.min.js',
        './src/lib/js/jqGrid/jquery.jqGrid-4.5.4.min.js',
        './src/lib/js/jqGrid/grid.locale-all.js',
        './src/lib/js/colResizable-1.6.min.js',
        './src/lib/js/jquery.multiselect-1.13.min.js',
        './src/lib/js/semver.min.js',
        './src/lib/js/ace-1.2.0/ace.js',
        './src/lib/js/loStorage.js',
        './src/lib/js/translate.js',
        './src/lib/js/jquery.fancytree-all.min.js',
//        './src/lib/js/jquery.treetable.js',
//        './src/lib/js/selectID.js',
        './src/lib/js/cron/jquery.cron.js',
        './src/lib/js/cron/cron2text.js'
    ])
        .pipe(sourcemaps.init())
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./www/lib/js'));
});

gulp.task('copySrc', function () {
    return gulp.src([
        './src/**/*.*',
        '!./src/**/*.less',
        '!./src/js/**/admin*.js',
        '!./src/materialize-css/**/*',
        '!./src/colorpicker/**/*'
    ])
    .pipe(gulp.dest('./www'));
});
gulp.task('copyColorpicker', function () {
    return gulp.src([
        './src/colorpicker/**/*.png'
    ])
        .pipe(gulp.dest('./www'));
});
gulp.task('copyAce', function () {
    return gulp.src([
        './src/lib/js/ace-1.2.0/mode-json.js',
        './src/lib/js/ace-1.2.0/worker-json.js'
    ],  {base: './src/lib/js/ace-1.2.0/'})
        .pipe(gulp.dest('./www'));
});
gulp.task('copy', ['copySrc', 'copyAce', 'copyColorpicker']);

gulp.task('watch', function () {
    gulp.watch('./src/css/*.less', ['lessApp']);
    gulp.watch('./src/lib/css/iob/*.less', ['lessApp']);
    gulp.watch(['./src/materialize-css/sass/**/*.scss'], ['sassMaterialize']);
    gulp.watch(['./src/js/*.js'], ['compressApp']);
});

gulp.task('default', ['lessIob', 'lessApp', 'lessTreeTable', 'sassMaterialize', 'compressApp', 'compressVendor', 'compressMaterialize', 'copy']);

