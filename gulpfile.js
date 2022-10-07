const { src, dest, watch, series, parallel, task } = require('gulp');

const sourcemaps = require('gulp-sourcemaps');
const terser = require('gulp-terser');
const rollup = require('gulp-better-rollup');
const browserSync = require('browser-sync').create();
const gulpif = require('gulp-if');
const npmDist = require('gulp-npm-dist');

const cache = require('gulp-cache');   

const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

const ui = require('./ui/gulpfile');

function browserSyncTask() {
	return browserSync.init({
		port: 8080,
		server: {
			baseDir: './',
		}
	});
}

function logError(err) {
	console.error('* gulp-terser error', err.message, err.filename, err.line, err.col, err.pos);
}

function jsTask(done, sourcePath, buildPath, useBrowserSync) {
	return src(sourcePath)
		.pipe(sourcemaps.init())
		.pipe(rollup({ external: ['node_modules/'] }, { file: 'doodoo.min.js' }, 'umd'))
		.pipe(terser().on('error', logError))
		.pipe(sourcemaps.write('./src_maps'))
		.pipe(dest(buildPath))
		.pipe(gulpif(useBrowserSync, browserSync.stream()));
}

function composerTask() {
	return src('./composer/composer.js')
		.pipe(sourcemaps.init())
		// .pipe(concat('composer.min.js'))
		.pipe(rollup({ external: ['../build/doodoo.min.js', '../../src/**/*.js'] }, { file: 'composer.min.js', exports: "named", preserveModules: true,}, 'umd'))
		.pipe(terser().on('error', logError))
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
	watch(['index.js', 'src/**/*.js'], series('clearCache', 'doodoo', 'composer'));
	watch('composer/**/*.js', series('clearCache', 'doodoo', 'composer'));
	if (ui) {
		watch('ui/src/**/*.js', series('clearCache', 'ui'));
		watch(['ui/css/*.scss', 'composer/css/*.scss'], series('clearCache', 'sass'));
	}
}

function uiCopy() {
	if (!ui) return;
	return src('./ui/build/**/*')
		.pipe(dest('./build'))
		.pipe(browserSync.stream());
}

function clearCache() {
	//return src(['./src/**/*.js', './composer/**/*.js'])
	//	.pipe(cache.clear());
	return cache.clearAll();
}

task('doodoo', doodooTask);
task('lib', libTask);
task('default', doodooTask);
task('watchJS', watchTask);
task('clearCache', clearCache);
task('watch', parallel(browserSyncTask, watchTask));
task('composer', composerTask);
task('sass', () => { return sassTask('./composer/css/composer.scss', './composer/css'); });
task('css', series('sass'));
if (ui) task('ui', series(function exporter() { return ui.exportTask(true) }, uiCopy));

module.exports = {
	exportTask: exportTask,
	files: [ './doodoo/src/**/*.js' ]
};