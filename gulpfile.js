'use strict';

var less = require('gulp-less');
var watchLess = require('gulp-watch-less');
var path = require('path');
var gulp = require('gulp');

gulp.task('lessAdmin', function () {
    return gulp.src([__dirname + '/www/css/*.less'])
        .pipe(less({
            paths: [ ]
        }))
        .pipe(gulp.dest(__dirname + '/www/css'));
});
gulp.task('lessIob', function () {
    return gulp.src([__dirname + '/www/lib/css/iob/*.less'])
        .pipe(less({
            paths: [ ]
        }))
        .pipe(gulp.dest(__dirname + '/www/lib/css/iob'));
});

gulp.task('default', ['lessIob', 'lessAdmin']);

/*gulp.task('default', function () {
    return gulp.src('less/file.less')
        .pipe(watchLess('less/file.less'))
        .pipe(less())
        .pipe(gulp.dest('dist'));
});*/