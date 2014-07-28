var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var merge = require('event-stream').merge;

gulp.task('default', ['watch']);

/**
 * 監視
 */
gulp.task('watch', function() {
    gulp.watch('html/*', ['htmlhint']);
    gulp.watch('js/*', ['jshint']);
});

/**
 * Lint
 */
gulp.task('lint', ['htmlhint', 'jshint']);

gulp.task('htmlhint', function() {
    return gulp.src('html/*')
        .pipe($.htmlhint())
        .pipe($.htmlhint.reporter());
});

gulp.task('jshint', function() {
    return gulp.src('js/*')
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'));
});

/**
 * ビルド
 */
gulp.task('build', function(done) {
    $.util.log('Copy to tmp dir');
    merge(
        gulp.src('manifest.json')
            .pipe(gulp.dest('tmp/')),
        gulp.src('html/**')
            .pipe(gulp.dest('tmp/html/')),
        gulp.src('images/**')
            .pipe(gulp.dest('tmp/images/')),
        gulp.src('js/**')
            .pipe(gulp.dest('tmp/js/'))
    )
    .on('end', function() {
        $.util.log('Create zip file');
        gulp.src('tmp/**')
            .pipe($.zip('KinnosukeTimeRecorder.zip'))
            .pipe(gulp.dest('./'))
        .on('end', function() {
            $.util.log('Remove tmp dir');
            gulp.src('tmp/', {read: false})
                .pipe($.rimraf());
            done();
        });
    });
});
