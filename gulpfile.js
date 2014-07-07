var gulp = require('gulp');

gulp.task('copy', function() {
	gulp.src('src/html/**')
		.pipe(gulp.dest('dist/html/'));

	gulp.src('src/images/**')
		.pipe(gulp.dest('dist/images/'));

	gulp.src('src/js/**')
		.pipe(gulp.dest('dist/js/'));

	gulp.src('src/manifest.json')
		.pipe(gulp.dest('dist/'));
});

gulp.task('default', ['copy']);
