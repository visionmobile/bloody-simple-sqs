import path from 'path';
import gulp from 'gulp';
import babel from 'gulp-babel';
import rimraf from 'gulp-rimraf';
import plumber from 'gulp-plumber';
import manifest from './package.json';

const src = path.resolve(__dirname, 'src');
const dest = path.resolve(__dirname, path.dirname(manifest.main));

gulp.task('clean', function () {
  return gulp.src(dest, {read: false})
    .pipe(plumber())
    .pipe(rimraf());
});

gulp.task('build', function () {
  return gulp.src(path.join(src, './**/*.js'))
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest(dest));
});
