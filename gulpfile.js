var path = require('path');
var gulp = require('gulp');
var del = require('del');
var mkdirp = require('mkdirp');
var $ = require('gulp-load-plugins')();

var manifest = require('./package.json');
var mainFile = manifest.main;
var destinationFolder = path.dirname(mainFile);

// Remove the built files
gulp.task('clean', function (cb) {
  del([destinationFolder], cb);
});

// Build two versions of the library
gulp.task('build', ['clean'], function () {
  mkdirp.sync(destinationFolder);
  return gulp.src('src/**/*.js')
    .pipe($.plumber())
    .pipe($.babel({ blacklist: ['useStrict'] }))
    .pipe(gulp.dest(destinationFolder));
});
