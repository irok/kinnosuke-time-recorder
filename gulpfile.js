var gulp = require('gulp');

gulp.task('copy', function() {
	gulp.src('manifest.json')
		.pipe(gulp.dest('dist'));

	gulp.src('images/**')
		.pipe(gulp.dest('dist/images'));

	gulp.src('src/html/**')
		.pipe(gulp.dest('dist/html'));

	gulp.src('src/js/**')
		.pipe(gulp.dest('dist/js'));
});

gulp.task('default', ['copy']);
