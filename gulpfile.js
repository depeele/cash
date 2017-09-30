'use strict';

const gulp   = require('gulp');
const pkg    = require('./package.json');
const $      = require('gulp-load-plugins')();
const uglify = require('gulp-uglify-es').default;

gulp.task('build', function () {
  return gulp.src('./src/_wrapper.js')
    .pipe($.preprocess({
      context: {
        header: '/*! ' + pkg.name + ' '+pkg.version +', '+pkg.homepage +' @license '+ pkg.license +' */'
      }
    }))
    .pipe($.rename('cash.js'))
    .pipe($.size())
    .pipe($.size({ gzip: true }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('minify', ['build'], function() {
  return gulp.src(['./dist/cash.js'])
    .pipe(uglify({output:{comments: 'saveLicense'}}))
    .on('error', (err) => {
      $.util.log($.util.colors.red('[Error]'), err.toString());
    })
    .pipe($.size())
    .pipe($.size({ gzip: true }))
    .pipe($.rename('cash.min.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('lint', function() {
  return gulp.src(['src/*.js', '!src/_*.js'])
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
});

gulp.task('test', function() {
  return gulp.src('./test/qunit/index.html')
    .pipe($.qunit());
});

gulp.task('default', ['build', 'minify', 'lint']);

gulp.task('watch', function() {
  gulp.watch(['src/*.js', 'test/src/*.js'], ['default']);
});
