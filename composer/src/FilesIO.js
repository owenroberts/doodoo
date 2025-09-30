/*
	files io for doodoo
*/

import { saveAs } from 'file-saver';
import { getDate } from '../../../cool/cool.js';
import { Elements } from '../../../ui/src/UI.js';
const { UIModal, UIButton } = Elements;

export function FilesIO(app) {

	let versions = [];
	let savedOn = getDate();

	function clearVersions() {
		versions = [];
	}

	function load(data) {

		app.composition.load(data);
		app.melody.load(data);
		app.modulators.load(data);
		app.startLoops.load(data);

		// load versions
		if (data.versions) {
			clearVersions();
			for (let i = 0; i < data.versions.length; i++) {
				versions[i] = data.versions[i];
			}
		}

		if (data.savedOn) savedOn = data.savedOn;
	}

	function clearLocal() {
		const title = app.ui.faces.title.value;
		if (!title) alert('No title');
		localStorage.removeItem('greg-' + title);
		localStorage.removeItem('greg-title');
		clearVersions()
	}

	function saveLocal(needsTitleConfirm=true) { 
		const composition = app.composition.get();
		// console.log('save local seq', [...composition.sequence]);
		if (composition.parts.length === 0) {
			let continueSave = confirm('No melody, continue save?');
			if (!continueSave) return;
		}

		let title = app.ui.faces.title.value;
		if (!title || needsTitleConfirm) {
			
			let confirmTitle = confirm(`Confirm title: ${title}`);
			if (!confirmTitle) title = prompt('New title', title);
		}
		if (title === 'title') {
			alert('No title title');
			title = prompt('New title');
		}
		
		app.ui.faces.title.update(title);
		
		const localSave = { 
			...composition,
			savedOn,
			title: title,
			mods: app.modulators.getMods(),
			partMods: app.modulators.getPartMods(),
			startLoops: app.startLoops.get(),
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
			m.add(new UIButton({
				text: "X",
				callback: () => {
					const confirmDelete = confirm(`Delete local save ${title}?`);
					if (confirmDelete) {
						localStorage.removeItem(title);
						m.clear();
					}
				}
			}));
			m.addBreak();
		});
	}

	function clear() {
		app.melody.clearAll();
		// localStorage.setItem('comp', '');
		clearLocal();
	}

	function saveFile() {
		if (app.playback.isRecording()) return;
		// should save local first??
		// app.composition.update(); // updates local storage
		// const json = localStorage.getItem('greg-' + app.ui.faces.title.value);
		const json = saveLocal();
		const blob = new Blob([json], { type: 'application/x-download;charset=utf-8' });
		const name = prompt("Name file", json.title);
		if (!name) return;
		saveAs(blob, name + '.json');
		app.ui.faces.title.update(name);
		// saveLocal();
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
		const tag = prompt("Tag current version?");
		const copy = {};
		if (tag !== undefined) copy.tag = tag;
		copy.versionedOn = getDate();
		for (const k in data) {
			if (k === 'versions') continue;
			if (k === 'title') continue;
			copy[k] = data[k];
		}
		versions.push(copy);
		saveLocal(false);
	}

	function loadVersion(value) {
		if (value === 'current') return;
		const saveCurrent = confirm('Save current to new version?');
		if (saveCurrent) addVersion();
	
		const m = new UIModal({
			app: app,
			title: 'Versions',
			position: { x: 200, y: 120 },
		});

		for (let i = 0; i < versions.length; i++) {
			const v = versions[i];
			m.add(new UIButton({
				text: v.tag,
				callback: () => {
					load(v);
					m.clear();
				}
			}));
		}
	}

	function connect() {

		const panel = app.ui.getPanel('fio', { label: 'Files IO' });

		app.ui.addCallbacks([
			{ callback: addVersion, key: 'v', text: 'Add Version' },
			{ callback: loadVersion, key: 'v', text: 'Load Version' },
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
	}

	return { connect, saveLocal };
}