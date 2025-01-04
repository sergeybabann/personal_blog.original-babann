import { src, dest, series, parallel, watch as gulpWatch } from 'gulp'
import autoprefixer from 'gulp-autoprefixer'
import cssbeautify from 'gulp-cssbeautify'
import removeComments from 'gulp-strip-css-comments'
import rename from 'gulp-rename'
import cssnano from 'gulp-cssnano'
import uglify from 'gulp-uglify'
import plumber from 'gulp-plumber'
import panini from 'panini'
import { deleteAsync } from 'del'
import notify from 'gulp-notify'
import webpack from 'webpack'
import webpackStream from 'webpack-stream'
import browserSyncModule from 'browser-sync'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const sass = require('gulp-sass')(require('sass'))
const browserSync = browserSyncModule.create()

/* Paths */
const srcPath = 'src/'
const distPath = 'dist/'

const path = {
  build: {
    html: distPath,
    js: distPath + 'assets/js/',
    css: distPath + 'assets/css/',
    images: distPath + 'assets/images/',
    fonts: distPath + 'assets/fonts/',
  },
  src: {
    html: srcPath + '*.html',
    js: srcPath + 'assets/js/*.js',
    css: srcPath + 'assets/scss/*.scss',
    images:
      srcPath +
      'assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
    fonts: srcPath + 'assets/fonts/**/*.{eot,woff,woff2,ttf,svg}',
  },
  watch: {
    html: srcPath + '**/*.html',
    js: srcPath + 'assets/js/**/*.js',
    css: srcPath + 'assets/scss/**/*.scss',
    images:
      srcPath +
      'assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
    fonts: srcPath + 'assets/fonts/**/*.{eot,woff,woff2,ttf,svg}',
  },
  clean: './' + distPath,
}

/* Tasks */
function serve() {
  browserSync.init({
    server: {
      baseDir: './' + distPath,
    },
  })
}

function html(cb) {
  panini.refresh()
  return src(path.src.html, { base: srcPath })
    .pipe(plumber())
    .pipe(
      panini({
        root: srcPath,
        layouts: srcPath + 'layouts/',
        partials: srcPath + 'partials/',
        helpers: srcPath + 'helpers/',
        data: srcPath + 'data/',
      })
    )
    .pipe(dest(path.build.html))
    .pipe(browserSync.reload({ stream: true }))

  cb()
}

function css(cb) {
  return src(path.src.css, { base: srcPath + 'assets/scss/' })
    .pipe(
      plumber({
        errorHandler: function (err) {
          notify.onError({
            title: 'SCSS Error',
            message: 'Error: <%= error.message %>',
          })(err)
          this.emit('end')
        },
      })
    )
    .pipe(
      sass({
        includePaths: './node_modules/',
      })
    )
    .pipe(
      autoprefixer({
        cascade: true,
      })
    )
    .pipe(cssbeautify())
    .pipe(dest(path.build.css))
    .pipe(
      cssnano({
        zindex: false,
        discardComments: {
          removeAll: true,
        },
      })
    )
    .pipe(removeComments())
    .pipe(
      rename({
        suffix: '.min',
        extname: '.css',
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browserSync.reload({ stream: true }))

  cb()
}

function js(cb) {
  return src(path.src.js, { base: srcPath + 'assets/js/' })
    .pipe(
      plumber({
        errorHandler: function (err) {
          notify.onError({
            title: 'JS Error',
            message: 'Error: <%= error.message %>',
          })(err)
          this.emit('end')
        },
      })
    )
    .pipe(
      webpackStream({
        mode: 'production',
        output: {
          filename: 'app.js',
        },
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browserSync.reload({ stream: true }))

  cb()
}

function clean(cb) {
  return deleteAsync(path.clean) // Используем deleteAsync вместо del
  cb()
}

/* Watch */
function watchFiles() {
  gulpWatch([path.watch.html], html)
  gulpWatch([path.watch.css], css)
  gulpWatch([path.watch.js], js)
}

const build = series(clean, parallel(html, css, js))
const watch = parallel(build, watchFiles, serve)

/* Exports */
export { html, css, js, clean, build, watch }
export default watch
