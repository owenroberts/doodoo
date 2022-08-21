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
		const midiPromise = new Midi.fromUrl(filePath);
		midiPromise.then(midiData => {
			midiData.tracks.forEach(track => {
				const notes = track.notes;
				for (let i = 0; i < notes.length; i++) {
					const { name, duration, time } = notes[i];
					let note = name;
					let isLastNote = i === notes.length - 1;
					if (i > 0) {
						const prev = notes[i - 1];
						let delta = time - (prev.time + prev.duration);
						if (delta > 0) {
							app.composition.addNote('rest', Tone.Time(delta).toNotation(), isLastNote);
						}
					}

					app.composition.addNote(note, Tone.Time(duration).toNotation(), isLastNote);
				}
			});
		});
	};
}