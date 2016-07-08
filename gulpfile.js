var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass'); 
var browserSync = require('browser-sync').create();
var babel = require('gulp-babel');

var reload = browserSync.reload;

function errorLog(error) {
    console.error(error);
    this.emit("end");
}

// uglifyJS Task
// gulp.task('uglifyJS', function() {
//     return gulp.src('js/**/*.js') // 指定檔案
//               .pipe(uglify()) // min所有指定檔案
//               .on('error', errorLog)
//               .pipe(gulp.dest('modules'));  // 儲存路徑
// });


// sass Task 
// plumber 語法錯誤時 不會中斷執行 而是顯示錯誤
gulp.task('sass', function() {
     return gulp.src('scss/**/*.scss')
                .pipe(sass({outputStyle: 'compressed'}))
                .on('error', errorLog)
                .pipe(gulp.dest('css'));
});

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./", 
            index: "index.html" 
        },
        port: 8081, 
        ui: false,
        open: false
    });
});

gulp.task('babel', () => {
	return gulp.src('js/**/*.js')
		       .pipe(babel({
		            presets: ['es2015', 'stage-2'], 
		            plugins: ['babel-plugin-transform-decorators-legacy']
		        }))
		      // .pipe(uglify())
		       .on('error', errorLog)
		       .pipe(gulp.dest('modules'));
});

// Watch Task
// Watchs JS
gulp.task('watch', function() {
    gulp.watch('scss/**/*.scss', ['sass']);
    gulp.watch('js/**/*.js', ['babel']);
    
    gulp.watch(['./**/*.html', './css/**/*.css', './modules/**/*.js', './modules/**/*.html', './templates/**/*.html']).on("change", reload);
});    

gulp.task('default', ['sass', 'babel', 'browser-sync', 'watch']);