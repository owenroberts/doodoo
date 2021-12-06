const { src, dest, watch, series, parallel, task } = require('gulp');

const webpack = require('webpack-stream');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const notify = require('gulp-notify');

function browserSyncTask() {
	browserSync.init({
		port: 8080,
		server: {
			baseDir: './',
		}
	});
}

function reload(done) {
	browserSync.reload();
	done();
}

function doodooTask(done) {
	src('./src/doodoo.js')
		.pipe(sourcemaps.init())
		.pipe(webpack({
			devtool: 'source-map',
			mode: 'production',
			output: {
				filename: 'doodoo.min.js',
				library: 'doodooLib',
				libraryTarget: 'window',
				libraryExport: 'default',
			},
			performance: {
				hints: false,
			},
			module: {
				rules: [
					{
						test: /\.js$/,
						exclude:  /node_modules/,
					}
				]
			}
		}))
		.on('error', function handleError() {
			this.emit('end'); // Recover from errors
		})
		.pipe(dest('./build'))
		.pipe(browserSync.stream());
	done();
}

function watchTask(){
	watch('src/**/*.js', series('doodoo'));
}

task('doodoo', doodooTask);
task('default', doodooTask);
task('watchJS', watchTask);
task('watch', parallel(browserSyncTask, watchTask));