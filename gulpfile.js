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
gulp.task('build-local', ['build-html', 'build-js', 'build-copy']);

gulp.task('build-html', function() {
    return gulp.src('html/*.html')
        .pipe($.changed('build/html/'))
        .pipe($.htmlmin({
            collapseWhitespace: true,
            minifyCSS: true
        }))
        .pipe(gulp.dest('build/html/'));
});

gulp.task('build-js', function() {
    return gulp.src('js/*.js')
        .pipe($.changed('build/js/'))
        .pipe($.uglify({sourceMap: true}))
        .pipe(gulp.dest('build/js/'));
});

gulp.task('build-copy', function() {
    return merge(
        gulp.src('images/**')
            .pipe($.changed('build/images/'))
            .pipe(gulp.dest('build/images/')),
        gulp.src('js/vendor/**')
            .pipe($.changed('build/js/vendor/'))
            .pipe(gulp.dest('build/js/vendor/')),
        gulp.src('manifest.json')
            .pipe($.changed('build/'))
            .pipe(gulp.dest('build/'))
    );
});

/**
 * ZIPファイル生成
 */
gulp.task('zip', ['build-local'], function() {
    gulp.src('build/**')
        .pipe($.zip('KinnosukeTimeRecorder.zip'))
        .pipe(gulp.dest('./'));
});

/**
 * クリーンナップ
 */
gulp.task('cleanup', function() {
    gulp.src('build/', {read: false})
        .pipe($.rimraf());
});
