const { src, dest, watch, series, parallel, task } = require('gulp');

const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const iife = require("gulp-iife");
const merge = require('merge-stream');

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
		port: 8080,
		server: { baseDir: './', }
	});
}

function logError(err) {
	console.error('* gulp-terser error', err.message, err.filename, err.line, err.col, err.pos);
}

function jsTask(done, sourcePath, buildPath, useBrowserSync) {
	return src(sourcePath)
		.pipe(sourcemaps.init())
		.pipe(concat('doodoo.min.js'))
		.pipe(iife({}))
		.pipe(terser().on('error', logError))
		.pipe(sourcemaps.write('./src_maps'))
		.pipe(dest(buildPath))
		.pipe(gulpif(useBrowserSync, browserSync.stream()));
}

function doodooTest() {
	return src('./src/**/*.js')
		.pipe(sourcemaps.init())
		.pipe(iife({}))
		.pipe(terser().on('error', logError))
		.pipe(sourcemaps.write('./src_maps'))
		.pipe(dest('./buildTest'))
}

function composerTask(sourcePath='./composer/src/*.js', buildPath='./build') {
	return src(sourcePath)
		.pipe(sourcemaps.init())
		.pipe(concat('composer.min.js'))
		.pipe(iife({}))
		.pipe(terser().on('error', logError))
		.pipe(sourcemaps.write('./src_maps'))
		.pipe(dest(buildPath))
		.pipe(browserSync.stream());
}

function composerTest() {
	return src('./composer/src/*.js')
		.pipe(sourcemaps.init())
		.pipe(iife({}))
		.pipe(terser().on('error', logError))
		.pipe(sourcemaps.write('./src_maps'))
		.pipe(dest('./buildTest'))
}

function libTask() {
	return src(npmDist(), { base: './node_modules' })
		.pipe(dest('./build/lib'));
}

function doodooTask() {
	return jsTask(null, ['./src/SamplePaths.js', './src/**/*.js',], './build', true);
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
	// update composer too ... 
	const tasks = [
		composerTask('./doodoo/composer/src/*.js', './doodoo/build'),
		jsTask(null, ['./doodoo/src/SamplePaths.js', './doodoo/src/**/*.js',], './doodoo/build', false)
	];
	return merge(...tasks);
}

function watchTask(){
	watch(['index.js', 'src/**/*.js'], series('doodoo'));
	watch('composer/src/*.js', series('composer'));
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
task('watchJS', watchTask);
task('watch', parallel(browserSyncTask, watchTask));
task('default', series('watch'));
task('composer', composerTask);
task('sass', () => { return sassTask('./composer/css/composer.scss', './composer/css'); });
task('css', series('sass'));
task('test', doodooTest);
task('testComp', composerTest);

if (ui) {
	task('ui', series(function exporter() { 
		return ui.exportTask(true);
	}, uiCopy));
}

module.exports = {
	exportTask: exportTask,
	files: [ './doodoo/src/**/*.js' ]
};