// require pkjs
var {src, dest, watch, series, parallel} = require('gulp'),
  sass = require('gulp-sass'),
  postcss = require("gulp-postcss"),
  autoprefixer = require("autoprefixer"),
  cssnano = require("cssnano"),
  concat = require("gulp-concat"),
  uglify = require("gulp-uglify"),
  sourcemaps = require("gulp-sourcemaps"),
  replace = require('gulp-replace'),
  imagemin = require('gulp-imagemin'),
  babel = require('gulp-babel');
  plumber = require('gulp-plumber');
  browserSync = require("browser-sync").create();

// files paths
var paths = {
    styles: {
        // By using styles/**/*.sass we're telling gulp to check all folders for any sass file
        src: "app/scss/*",
        // Compiled files will end up in whichever folder it's found in (partials are not compiled)
        dest: "app/css"
    },
    scripts:{
      src:"app/js/*",
      dest: "dist/js"
    },
    imgs:{
      src:"app/img/**/*"
    },
    font:{
      src:"app/font/*"
    }
};


//SCSS to CSS

function scssTask(){
    return src(paths.styles.src)
        .pipe(sourcemaps.init()) // initialize sourcemaps first
        .pipe(sass()) // compile SCSS to CSS
        .pipe(postcss([ autoprefixer(), cssnano() ])) // PostCSS plugins
        .pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
        .pipe(concat('index.css'))
        .pipe(dest('dist/css')
    ); // put final CSS in dist folder
}



// JS task: concatenates and uglifies JS files to script.js
function jsTask(){
    return src([
        paths.scripts.src
        ])
        .pipe(concat('index.js'))
        .pipe(plumber())
        .pipe(babel({
            presets: [
              ['@babel/env', {
                modules: false
              }]
            ]
          }))
        .pipe(uglify())
        .pipe(dest('dist/js')
    );
}

// Cachebust
function cacheBustTask(){
    var cbString = new Date().getTime();
    return src(['app/index.html'])
        .pipe(replace(/cb=\d+/g, 'cb=' + cbString))
        .pipe(dest('dist'));
}

function imageOpt(){
  return src(paths.imgs.src)
      .pipe(imagemin())
      .pipe(dest('dist/img'));
}

function font(){
  return src(paths.font.src)
      .pipe(dest('dist/font'));
}

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask(){
  browserSync.init({
       server: {
          baseDir: "dist/",
          index: "index.html"
       }
   });
    watch([paths.styles.src, paths.scripts.src],
        {interval: 1000, usePolling: true}, //Makes docker work
        series(
            parallel(scssTask, jsTask),
            cacheBustTask
        )
    ).on('change', browserSync.reload);
}

// to run use 'gulp img'

exports.img = imageOpt;

// to run use 'gulp'

exports.default = series(
    imageOpt,
    font,
    parallel(scssTask, jsTask),
    cacheBustTask,
    watchTask
);
