var gulp = require('gulp');

var libs = [
    'node_modules/crypto-js/crypto-js.js',
    'node_modules/jquery/dist/jquery.js',
    'node_modules/moment/moment.js'
];

gulp.task('default', () => {
    console.log('run `gulp --tasks`');
});

gulp.task('build', cb => {
    var runSequence = require('run-sequence');
    runSequence('zip', 'clean', cb);
});

gulp.task('clean', () => {
    var del = require('del');
    return del(['tmp/', 'KinnosukeTimeRecorder/']);
});

gulp.task('prepare', () => {
    var merge = require('event-stream').merge;
    return merge(
        gulp.src('manifest.json').pipe(gulp.dest('tmp/')),
        gulp.src('html/*').pipe(gulp.dest('tmp/html/')),
        gulp.src('images/*').pipe(gulp.dest('tmp/images/')),
        gulp.src('js/*').pipe(gulp.dest('tmp/js/')),
        gulp.src(libs).pipe(gulp.dest('tmp/vendor/'))
    );
});

gulp.task('zip', gulp.series('prepare'), () => {
    var zip = require('gulp-zip');
    return gulp.src('tmp/**')
        .pipe(zip('KinnosukeTimeRecorder.zip'))
        .pipe(gulp.dest('./'));
});

gulp.task('vendor', () => {
    return gulp.src(libs).pipe(gulp.dest('vendor/'));
});

