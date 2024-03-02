/*
	files io for doodoo
*/

function FilesIO(app) {

	let versionSelect, versions = [];

	function load(data) {
		app.composition.load(data);
		app.melody.load(data);
		app.modulators.load(data);
		app.startLoops.load(data);

		// load versions
		if (data.versions) {
			versions = [];
			for (let i = 0; i < data.versions.length; i++) {
				console.log(i, data.versions[i])
				versions[i] = data.versions[i];
				const tag = JSON.parse(data.versions[i]).tag;
				versionSelect.addOption(i, `v${ i }${ tag !== undefined ? `: ${tag}` : ''}`);
			}
		}
	}

	function clearLocal() {
		const title = app.ui.faces.title.value;
		if (!title) alert('No title');
		localStorage.removeItem('greg-' + title);
		localStorage.removeItem('greg-title');
	}

	function saveLocal(composition, needsTitleConfirm=true) { 
		if (!composition) composition = app.composition.get();
		// console.log('save local seq', [...composition.sequence]);
		if (composition.parts.length === 0) {
			let continueSave = confirm('No melody, continue save?');
			if (!continueSave) return;
		}

		let title = app.ui.faces.title.value;
		if (needsTitleConfirm) {
			let confirmTitle = confirm(`Confirm title: ${title}`);
			if (!confirmTitle) title = prompt('New title', title);
		}
		if (title === 'title') {
			alert('No title title');
			title = prompt('New title');
		}
		
		app.ui.faces.title.value = title;
		
		const localSave = { 
			...composition,
			// title: title,
			mods: app.modulators.get(),
			startLoops: app.startLoops.get(),
			savedOn: new Date().toDateString().replace(/ /g, '-'),
		};
		if (versions.length > 0) localSave.versions = versions;

		try {
			localStorage.setItem('greg-' + title, JSON.stringify(localSave));
			localStorage.setItem('greg-title', title);
		} catch (error) {
			if (error.name === 'QuotaExceededError') alert('Local storage full');
			else {
				console.log(error);
				alert(error.name);
			}
		}

		return localSave;
	}

	function loadLocal(titleFromList) {

		let title = titleFromList;
		if (!title) title = localStorage.getItem('greg-title');
		if (!title) prompt('Search title');
		if (!title) return alert('No title.');

		const localData = localStorage.getItem('greg-' + title);
		if (!localData) {
			const localSaves = Object.keys(localStorage).filter(k => k.includes('greg'));
			return alert('No data, Locals saves: ' + localSaves);
		}

		const data = JSON.parse(localData);
		app.ui.faces.title.update(title); // fuck off
		console.log('load local', data);
		load(data);
	}

	function listLocal() {
		const m = new UIModal({
			app: app,
			title: 'Local Saves',
			position: { x: 200, y: 120 },
		});

		const localSaves = Object.keys(localStorage)
			.filter(k => k.includes('greg') && !k.includes('title'));
		localSaves.forEach(title => {
			m.add(new UIButton({
				text: title.replace('greg-', ''),
				callback: () => { 
					loadLocal(title.replace('greg-', ''));
					m.clear();
				}
			}));
		});
	}

	function clear() {
		app.melody.clear();
		// localStorage.setItem('comp', '');
		clearLocal();
	}

	function saveFile() {
		if (app.playback.isRecording()) return;
		// app.composition.update(); // updates local storage
		const json = localStorage.getItem('greg-' + app.ui.faces.title.value);
		const blob = new Blob([json], { type: 'application/x-download;charset=utf-8' });
		const name = prompt("Name composition", app.composition.get().title);
		if (!name) return;
		saveAs(blob, name + '.json');
		app.ui.faces.title.update(name);
		saveLocal();
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

	function addVersion() {
		const data = saveLocal();
		const tag = prompt("Tag version?");
		const copy = {};
		if (tag !== undefined) copy.tag = tag;
		for (const k in data) {
			if (k === 'versions') continue;
			copy[k] = data[k];
		}
		console.log('copy', copy);
		versions.push(JSON.stringify(copy));
		const index = versions.length - 1;
		versionSelect.addOption(index, `v${ index }${ tag !== undefined ? `: ${tag}` : ''}`);
		saveLocal(undefined, false);
	}

	function setVersion(value) {
		if (value === 'current') return;
		const saveCurrent = confirm('Save current to new version?');
		if (saveCurrent) addVersion();
		const data = saveLocal(undefined, false); // need to change this at all??
		console.log('set data', data);
		console.log(value, data.versions[value]);
		const version = JSON.parse(data.versions[value]);
		console.log('version', version);
		load(version);
	}

	function connect() {

		const panel = app.ui.getPanel('fio', { label: 'Files IO' });

		app.ui.addCallbacks([
			{ callback: saveLocal, key: 's', text: 'Save Local' },
			{ callback: saveFile, key: 'alt-s', text: 'Save File' },
			{ callback: loadLocal, key: 'l', text: 'Load Local' },
			{ callback: listLocal, key: 'ctrl-l', text: 'List Local' },
			{ callback: clear, text: 'Clear Local' },
			{ 
				type: 'UIFile',
				callback: load, 
				key: 'o', 
				text: 'Load File',
				promptDefault: 'compositions',
			},
			{
				type: 'UIFile',
				callback: loadMidi,
				text: 'Load Midi',
				promptDefault: 'compositions',
				fileType: 'audio/midi'
			},
		]);

		versionSelect = app.ui.addUI({
			type: "UISelect",
			label: "Version",
			options: ["current"],
			callback: setVersion,
		});

		app.ui.addCallback({ callback: addVersion, key: 'v', text: 'Add Version' });
	}

	return { connect, saveLocal };
}