/*
	files io for doodoo
*/

function FilesIO(app) {

	this.load = function(data) {
		// console.log(data);
		app.composition.load(data);
		app.params.load(data.params);
	};

	this.saveLocal = function(composition, params) {
		if (!composition) composition = app.composition.get();
		if (!params) params = app.params.get();
		// console.log(params);
		localStorage.setItem('comp', JSON.stringify({ ...composition, params: params }));
	};

	this.clear = function() {
		app.composition.clear();
		localStorage.setItem('comp', '');
	};

	this.saveFile = function() {
		app.composition.update(); // updates local storage
		const json = localStorage.getItem('comp');
		const blob = new Blob([json], { type: 'application/x-download;charset=utf-8' });
		saveAs(blob, prompt("Name composition", app.composition.title) + '.json');
	}

	this.loadMidi = function(data, fileName, filePath) {
		console.log(fileName, filePath);
		// const midi = new Midi();
		const midiPromise = new Midi.fromUrl(filePath);
		midiPromise.then(midiData => {
			midiData.tracks.forEach(track => {
				const notes = track.notes;
				notes.forEach(note => {
					console.log(note.name, note.duration, note.time);
					console.log(Tone.Time(note.duration).toNotation());
					const m1 = Tone.Time('1m').toSeconds();
					console.log('1m = ', m1)
					console.log(Math.floor(note.time / m1), Tone.Time(note.time % m1).toNotation());

					// okay getting somewhere ...
				});
			});
		});
	};
}