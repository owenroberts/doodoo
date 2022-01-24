const { src, dest, watch, series, parallel, task } = require('gulp');

const webpack = require('webpack-stream');
const browserSync = require('browser-sync').create();
const gulpif = require('gulp-if');
const npmDist = require('gulp-npm-dist');

function browserSyncTask() {
	return browserSync.init({
		port: 8080,
		server: {
			baseDir: './',
		}
	});
}

function reload() {
	return browserSync.reload();
}

function jsTask(done, sourcePath, buildPath, useBrowserSync) {
	return src(sourcePath)
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
			externals: {
				tone: 'tone',
			},
			module: {
				rules: [
					{
						test: /\.js$/,
						exclude:  /node_modules/,
					}
				],
			}
		}))
		.pipe(dest(buildPath))
		.pipe(gulpif(useBrowserSync, browserSync.stream()));
}

function libTask() {
	return src(npmDist(), { base: './node_modules' })
		.pipe(dest('./build/lib'));
}

function doodooTask() {
	return jsTask(null, './src/doodoo.js', './build', true);
}

function exportTask() {
	return jsTask(null, './doodoo/src/doodoo.js', './doodoo/build', false);
}

function watchTask(){
	watch('src/**/*.js', series('doodoo'));
}

task('doodoo', doodooTask);
task('lib', libTask);
task('default', doodooTask);
task('watchJS', watchTask);
task('watch', parallel(browserSyncTask, watchTask));

module.exports = {
	exportTask: exportTask,
	files: [ './doodoo/src/**/*.js' ]
};