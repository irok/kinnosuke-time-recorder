var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var merge = require('event-stream').merge;

gulp.task('default', ['watch']);


// 監視
gulp.task('watch', function() {
    gulp.watch(['html/**'], ['htmlhint']);
    gulp.watch(['js/**', '!js/vendor/**'], ['jshint']);
});


// Lint
gulp.task('lint', ['htmlhint', 'jshint']);

gulp.task('htmlhint', function() {
    return gulp.src(['html/**'])
        .pipe($.htmlhint())
        .pipe($.htmlhint.reporter());
});

gulp.task('jshint', function() {
    return gulp.src(['js/**', '!js/vendor/**'])
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'));
});


// ビルド
gulp.task('build', ['build-local'], function() {
    gulp.src('build/**')
        .pipe($.zip('KinnosukeTimeRecorder.zip'))
        .pipe(gulp.dest('./'));
});

gulp.task('build-local', ['build-html', 'build-js', 'build-others']);

gulp.task('build-html', function() {
    gulp.src('html/*.html')
        .pipe($.changed('build/html/'))
        .pipe($.htmlmin({
            collapseWhitespace: true,
            minifyCSS: true
        }))
        .pipe(gulp.dest('build/html/'));
});

gulp.task('build-js', function(){
    gulp.src('js/*.js')
        .pipe($.changed('build/js/'))
        .pipe($.uglify())
        .pipe(gulp.dest('build/js/'));
});

gulp.task('build-others', function(){
    merge(
        gulp.src('images/**')
            .pipe(gulp.dest('build/images/')),
        gulp.src('js/vendor/**')
            .pipe(gulp.dest('build/js/vendor/')),
        gulp.src('manifest.json')
            .pipe(gulp.dest('build/'))
    );
});

// クリーンナップ
gulp.task('cleanup', function() {
    gulp.src('build/', {read: false})
        .pipe($.rimraf());
});
