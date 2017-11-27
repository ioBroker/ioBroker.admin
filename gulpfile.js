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


gulp.task('sassMaterialize', function () {
    gulp.src(['./src/materialize-css/sass/**/*.scss'])
        .pipe(sass({
            paths: [ ]
        }))
        .pipe(concat('mater.css'))
//        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('./www/lib/css'));

});

gulp.task('lessApp', function () {
    gulp.src(['./src/css/*.less'])
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

gulp.task('compressApp', function () {
    return gulp.src(['./src/js/*.js', '!./src/js/adapter-settings.js'])
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
        './src/lib/js/selectID.js',
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
        '!./src/js/**/admin*.js'
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
gulp.task('copy', ['copySrc', 'copyAce']);

gulp.task('watch', function () {
    gulp.watch(['./www/css/*.less', './www/lib/css/iob/*.less'], ['lessIob', 'lessApp']);
});

gulp.task('default', ['lessIob', 'lessApp', 'compressApp', 'compressVendor', 'copy']);

