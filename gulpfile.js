'use strict';

var less = require('gulp-less');
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

gulp.task('watch', function () {
    gulp.watch([__dirname + '/www/css/*.less', __dirname + '/www/lib/css/iob/*.less'], ['lessIob', 'lessAdmin']);
});

gulp.task('default', ['lessIob', 'lessAdmin']);

