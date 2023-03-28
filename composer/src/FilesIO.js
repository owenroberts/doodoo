/*
	files io for doodoo
*/

function FilesIO(app) {

	function load(data) {
		app.composition.load(data);
		app.melody.load(data);
		if (data.controls) app.controls.load(data.controls);
	}

	function saveLocal(composition, controls) { 
		if (!composition) composition = app.composition.get();
		if (composition.parts.length === 0) {
			let continueSave = confirm('No melody, continue save?');
			if (!continueSave) return;
		}
		if (!controls) controls = app.controls.get();
		//  later
		// localStorage.setItem('comp-' + composition.title, JSON.stringify({ ...composition, controls }));

		localStorage.setItem('comp', JSON.stringify({ ...composition, controls }));
	}

	function loadLocal() {
		const compData = localStorage.getItem('comp');
		if (compData && compData !== 'undefined') {
			const data = JSON.parse(compData);
			app.composition.load(data);
			app.melody.load(data);
			app.controls.load(data.controls);
		}
	}

	function clear() {
		app.composition.clear();
		localStorage.setItem('comp', '');
	}

	function saveFile() {
		if (app.composition.isRecording()) return;
		app.composition.update(); // updates local storage
		const json = localStorage.getItem('comp');
		const blob = new Blob([json], { type: 'application/x-download;charset=utf-8' });
		const name = prompt("Name composition", app.composition.get().title);
		if (!name) return;
		saveAs(blob, name + '.json');
		app.ui.faces.title.update(name);
	}

	function loadMidi(data, fileName, filePath) {
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
	}

	function connect() {

		const panel = app.ui.getPanel('fio', { label: 'Files IO' });

		app.ui.addCallbacks([
			{ callback: saveLocal, key: 's', text: 'Save Local' },
			{ callback: saveFile, key: 'alt-s', text: 'Save File' },
			{ callback: loadLocal, key: 'l', text: 'Load Local' },
			{ 
				type: 'UIFile',
				callback: load, 
				key: 'o', 
				text: 'Load File',
				promptDefault: 'compositions',
			},
			{ callback: clear, text: 'Clear Local' },
			{
				type: 'UIFile',
				callback: loadMidi,
				text: 'Load Midi',
				promptDefault: 'compositions',
				fileType: 'audio/midi'
			}
		]);
	}

	return { connect, saveLocal };
}