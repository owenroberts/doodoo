/*
	files io for doodoo
*/

function FilesIO(app) {

	this.load = function(data) {
		app.composition.load(data);
	};

	this.saveLocal = function(composition) {
		localStorage.setItem('comp', JSON.stringify(composition));
	};

	this.clear = function() {
		app.composition.clear();
		localStorage.setItem('comp', '');
	};

	this.saveFile = function() {
		app.composition.update(); // updates local storage
		const json = localStorage.getItem('comp');
		const blob = new Blob([json], { type: 'application/x-download;charset=utf-8' });
		saveAs(blob, prompt("Name composition", composition.title) + '.json');
	}
}