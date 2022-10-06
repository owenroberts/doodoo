const { src, dest, watch, series, parallel, task } = require('gulp');

const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const terser = require('gulp-terser');

const webpack = require('webpack-stream');
const browserSync = require('browser-sync').create();
const gulpif = require('gulp-if');
const npmDist = require('gulp-npm-dist');

const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

const ui = require('./ui/gulpfile');

function browserSyncTask() {
	return browserSync.init({
		port: 8081,
		server: {
			baseDir: './',
		}
	});
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
			performance: { hints: false, },
			externals: { tone: 'tone', },
			watch: true,
		}))
		.on('error', function handleError(error) {
			console.log('webpack error', error);
			this.emit('end'); // Recover from errors
		})
		.pipe(dest(buildPath))
		.pipe(gulpif(useBrowserSync, browserSync.stream()));
}

function composerTask() {
	return src('./composer/**/*.js')
		.pipe(sourcemaps.init())
		.pipe(concat('composer.min.js'))
		.pipe(terser().on('error', function(err) {
			console.error('* gulp-terser error', err.message, err.filename, err.line, err.col, err.pos);
		}))
		.pipe(sourcemaps.write('./src_maps'))
		.pipe(dest('./build'))
		.pipe(browserSync.stream());
}

function libTask() {
	return src(npmDist(), { base: './node_modules' })
		.pipe(dest('./build/lib'));
}

function doodooTask() {
	return jsTask(null, './src/Doodoo.js', './build', true);
}

function sassTask(sourcePath, buildPath) {
	return src(sourcePath)
		.pipe(sourcemaps.init()) 
		.pipe(sass()) 
		.pipe(postcss([autoprefixer(), cssnano()])) 
		.pipe(sourcemaps.write('./src_maps'))
		.pipe(dest(buildPath))
}

function exportTask() {
	return jsTask(null, './doodoo/src/Doodoo.js', './doodoo/build', false);
}

function watchTask(){
	watch(['index.js', 'src/**/*.js'], series('doodoo'));
	watch('composer/**/*.js', series('composer'));
	if (ui) {
		watch('ui/src/**/*.js', series('ui'));
		watch(['ui/css/*.scss', 'composer/css/*.scss'], series('sass'));
	}
}

function uiCopy() {
	if (!ui) return;
	return src('./ui/build/**/*')
		.pipe(dest('./build'))
		.pipe(browserSync.stream());
}

task('doodoo', doodooTask);
task('lib', libTask);
task('default', doodooTask);
task('watchJS', watchTask);
task('watch', parallel(browserSyncTask, watchTask));
task('composer', composerTask);
task('sass', () => { return sassTask('./composer/css/composer.scss', './composer/css'); });
task('css', series('sass'));
if (ui) task('ui', series(function exporter() { return ui.exportTask(true) }, uiCopy));

module.exports = {
	exportTask: exportTask,
	files: [ './doodoo/src/**/*.js' ]
};