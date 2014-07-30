/*global require */

var gulp  = require('gulp');
var $     = require('gulp-load-plugins')();
var merge = require('event-stream').merge;
var del   = require('del');
var bower = require('bower');

var subtask = function(name, fn_task, cb) {
    $.util.log('run "' + name + '"');
    var cb_ = function(err) {
        $.util.log('end "' + name + '"');
        if (typeof cb === 'function') {
            return cb(err);
        }
    };
    var stream = fn_task(cb_);
    if (stream) {
        return stream.on('end', cb_);
    }
};

/**
 * Dafault
 */
gulp.task('default', ['watch']);

/**
 * Watch
 */
gulp.task('watch', function() {
    gulp.watch('html/*', ['htmlhint']);
    gulp.watch('js/*', ['jshint']);
});

/**
 * Lint
 */
function htmlhint() {
    return gulp.src('html/*')
        .pipe($.htmlhint())
        .pipe($.htmlhint.reporter());
}

function jshint() {
    return gulp.src('js/*')
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'));
}

gulp.task('htmlhint', htmlhint);
gulp.task('jshint',   jshint);
gulp.task('lint', function() {
    return merge(
        subtask('htmlhint', htmlhint),
        subtask('jshint',   jshint)
    );
});

/**
 * Build
 */
function prepare() {
    return merge(
        gulp.src('manifest.json')
            .pipe(gulp.dest('tmp/')),
        gulp.src('html/*')
            .pipe(gulp.dest('tmp/html/')),
        gulp.src('images/*')
            .pipe(gulp.dest('tmp/images/')),
        gulp.src('js/*')
            .pipe(gulp.dest('tmp/js/')),
        gulp.src('vendor/*')
            .pipe(gulp.dest('tmp/vendor/'))
    );
}

function zip() {
    return gulp.src('tmp/**')
        .pipe($.zip('KinnosukeTimeRecorder.zip'))
        .pipe(gulp.dest('./'));
}

function clean(cb) {
    del(['tmp/', 'KinnosukeTimeRecorder/'], cb);
}

gulp.task('prepare', prepare);
gulp.task('zip', ['prepare'], zip);
gulp.task('zip_', zip);
gulp.task('clean', clean);
gulp.task('build', ['lint'], function(done) {
    subtask('prepare', prepare, function() {
        subtask('zip', zip, function() {
            subtask('clean', clean, done);
        });
    });
});

/**
 * Init
 */
gulp.task('init', function(done) {
    bower.commands.install().on('end', function() {
        del(['vendor/'], function() {
            gulp.src([
                'bower_components/crypto-js-evanvosberg/build/rollups/aes.js',
                'bower_components/jquery/dist/jquery.min.js'
            ])
                .pipe(gulp.dest('vendor/'))
                .on('end', done);
        });
    });
});
