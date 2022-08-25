/*
	files io for doodoo
*/

function FilesIO(app) {

	this.load = function(data) {
		app.composition.load(data);
		app.controls.load(data.controls);
	};

	this.saveLocal = function(composition, controls) {
		if (!composition) composition = app.composition.get();
		if (!controls) controls = app.controls.get();
		localStorage.setItem('comp', JSON.stringify({ ...composition, controls: controls }));
	};

	this.clear = function() {
		app.composition.clear();
		localStorage.setItem('comp', '');
	};

	this.saveFile = function() {
		if (app.composition.isRecording()) return;
		app.composition.update(); // updates local storage
		const json = localStorage.getItem('comp');
		const blob = new Blob([json], { type: 'application/x-download;charset=utf-8' });
		const name = prompt("Name composition", app.composition.title);
		if (!name) return;
		saveAs(blob, name + '.json');
		app.ui.faces.title.update(name);
	}

	this.loadMidi = function(data, fileName, filePath) {
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