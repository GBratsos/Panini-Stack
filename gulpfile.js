var gulp = require('gulp'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    fs = require('fs'),
    webpackStream = require('webpack-stream'),
    webpack2 = require('webpack');
    yaml = require('js-yaml'),
    named = require('vinyl-named'),
    inlinesource = require('gulp-inline-source'),
    browserSync = require('browser-sync').create(),
    panini = require('panini');

// Load settings from settings.yml
// Load configuration for PATHS etc
const { COMPATIBILITY, PORT, PATHS } = loadConfig();

function loadConfig() {
  let ymlFile = fs.readFileSync('config.yml', 'utf8');
  return yaml.load(ymlFile);
}

let webpackConfig = {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ "@babel/preset-env" ],
            compact: false
          }
        }
      }
    ]
  }
}

/**
 * ---------------------------------
 * TASKS FOR DEVELOPMENT ENVIRONMENT
 * ---------------------------------
 */

// Static Server
gulp.task('serve', ['panini_compile'], function () {
    browserSync.init({
        server: PATHS.dist,
        port: PORT
    });
});

// Gulp Task COMPILE SASS
gulp.task('compile_styles', function () {
  gulp.
  src('src/assets/scss/app.scss')
  .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: PATHS.sass
    })
    .on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: COMPATIBILITY
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(PATHS.dist + '/assets/css'))
    .pipe(browserSync.reload({stream:true}));
});

// Gulp Task COMPILE Inline Components
// Check Config.yml to add/remove components
gulp.task('compile_inline-components', function () {
  gulp.
  src('src/assets/scss/inline-components.scss')
    .pipe(sass({
      includePaths: PATHS.inline_components
    })
    .on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: COMPATIBILITY
    }))
    .pipe(gulp.dest(PATHS.dist + '/assets/css/components/'))
    .pipe(browserSync.reload({stream:true}));
});


// Gulp Task COMPILE JAVASCRIPT
gulp.task('compile_js', function(){
  gulp.
  src(PATHS.entries)
    .pipe(named())
    .pipe(webpackStream(webpackConfig, webpack2))
    .pipe(gulp.dest(PATHS.dist + '/assets/js'))
    .pipe(browserSync.reload({stream:true}));
});

// Gulp Task COMPILE TEMPLATES
gulp.task('panini_compile', function() {
  panini.refresh();
  gulp.src('./src/pages/**/*.html')
    .pipe(panini({
      root: './src/pages/',
      layouts: './src/layouts/',
      partials: './src/partials/',
      helpers: './src/helpers/',
      data: './src/data/'
    }))
    // Inline CSS or Javascript inside templates
    .pipe(inlinesource({compress: true}))
    .pipe(gulp.dest(PATHS.dist))
    .pipe(browserSync.reload({stream:true}));
});

// Gulp Task Copy assets
gulp.task('copy_assets', function() {
  gulp.
  src(PATHS.assets)
    .pipe(gulp.dest(PATHS.dist + '/assets/img'))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('watch', ['serve'], function() {
  gulp.watch(['./src/assets/scss/**/*'], ['compile_styles']);
  gulp.watch(['./src/assets/js/**/*.js'], ['compile_js']);
  gulp.watch(['./src/assets/scss/**/*'], ['compile_inline-components']);
  gulp.watch(['./src/{layouts,pages,partials,helpers,data}/**/*'], ['panini_compile']);
  gulp.watch(['./src/assets/img/**/*'], ['copy_assets']);
  gulp.watch(['./src/**/*']).on('change', browserSync.reload);
});
