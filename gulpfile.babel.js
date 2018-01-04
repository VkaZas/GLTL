const gulp        = require('gulp');

const browserify  = require('browserify');
const babelify    = require('babelify');
const source      = require('vinyl-source-stream');
const buffer      = require('vinyl-buffer');
const uglify      = require('gulp-uglify');
const sourcemaps  = require('gulp-sourcemaps');
const livereload  = require('gulp-livereload');
const sass        = require('gulp-sass');

gulp.task('build', () => {
    // app.js is your main JS file with all your module inclusions
    return browserify({entries: './src/trainApp.js', debug: true})
        .transform("babelify", { presets: ["es2015"] })
        .bundle()
        .pipe(source('trainApp.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./dist/'))
        .pipe(livereload());
});

gulp.task('build2', () => {
    // app.js is your main JS file with all your module inclusions
    return browserify({entries: './src/behaveApp.js', debug: true})
        .transform("babelify", { presets: ["es2015"] })
        .bundle()
        .pipe(source('behaveApp.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./dist/'))
        .pipe(livereload());
});

gulp.task('build3', () => {
    // app.js is your main JS file with all your module inclusions
    return browserify({entries: './src/guessApp.js', debug: true})
        .transform("babelify", { presets: ["es2015"] })
        .bundle()
        .pipe(source('guessApp.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./dist/'))
        .pipe(livereload());
});

gulp.task('sass', () => {
    return gulp.src('src/scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('dist/css/'))
});

gulp.task('watch', ['build', 'build2', 'build3'], () => {
    livereload.listen();
    gulp.watch('./src/*.js', ['build', 'build2', 'build3']);
    gulp.watch('./src/js/*.js', ['build', 'build2', 'build3']);
    gulp.watch('./src/scss/*.scss', ['sass']);
});

gulp.task('default', ['watch', 'sass']);