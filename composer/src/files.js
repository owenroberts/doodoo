import { saveAs } from 'file-saver';
import { getDate } from '../../../cool/cool.js';
import { UIPanel, UIModal, UIButton } from '../../../oi/src/oi.js';

/**
 * load and save files
 * move to doodoo/src?
 */
export class FilesPanel extends UIPanel {

	constructor(doodoo, ui) {
		super({ id: "files", ui });
		
		this.ui = ui;
		this.doodoo = doodoo;

		this.versions = [];
		this.savedOn = getDate();
		this.title = 'doodoo-' + getDate();

		this.addRef({ obj: this, ref: "title", ignoreSettings: true });

		this.addBreak();

		this.addButton({ 
			callback: () => {
				this.addVersion();
			}, 
			key: 'v', 
			text: 'Add Version' 
		});

		this.addButton({ 
			callback: () => {
				this.loadVersion();
			}, 
			key: 'v', 
			text: 'Load Version',
		});

		this.addButton({ 
			callback: () => {
				this.saveLocal();
			},
			key: 's',
			text: 'Save Local' 
		});

		this.addButton({ 
			callback: () => {
				this.saveFile();
			},
			key: 'alt-s', 
			text: 'Save File',
		});

		this.addButton({ 
			callback: () => {
				this.loadLocal();
			},
			key: 'l', 
			text: 'Load Local',
		});

		this.addButton({ 
			callback: () => {
				this.listLocal();
			},
			key: 'ctrl-l', 
			text: 'List Local',
		});

		this.addButton({ 
			callback: () => {
				this.clear();
			},
			text: 'Clear Local' 
		});

		this.addButton({ 
			type: 'UIFile',
			callback: () => { this.load(); },
			key: 'o', 
			text: 'Load File',
		});

		this.addButton({
			type: 'UIFile',
			callback: () => { this.loadMidi(); },
			text: 'Load Midi',
			fileType: 'audio/midi'
		});
	}

	clearVersions() {
		this.versions = [];
	}

	load(data) {

		console.log('load', data);
		
		this.doodoo.comp.parts = data.parts;
		this.doodoo.comp.sequence = data.sequence;
		this.doodoo.comp.modsets = data.modsets;
		this.doodoo.comp.startLoops = data.startLoops;

		this.ui.panels.composition.load();
		this.ui.panels.melody.load();
		this.ui.panels.modulators.load();
		this.ui.panels.modEditor.load();
		this.ui.panels.startLoops.load();


		if (data.versions) {
			this.clearVersions();
			for (let i = 0; i < data.versions.length; i++) {
				this.versions[i] = data.versions[i];
			}
		}

		if (data.savedOn) this.savedOn = data.savedOn;
	}

	clearLocal() {
		const title = this.ui.faces.title.value;
		if (!title) alert('No title');
		localStorage.removeItem('greg-' + title);
		localStorage.removeItem('greg-title');
		this.clearVersions()
	}

	saveLocal(needsTitleConfirm=true) { 

		const composition = structuredClone(this.doodoo.comp);

		if (composition.parts.length === 0) {
			let continueSave = confirm('No melody, continue save?');
			if (!continueSave) return;
		}

		let title = this.ui.faces.title.value;
		if (!title || needsTitleConfirm) {
			
			let confirmTitle = confirm(`Confirm title: ${title}`);
			if (!confirmTitle) title = prompt('New title', title);
		}
		if (title === 'title') {
			alert('No title title');
			title = prompt('New title');
		}
		
		this.ui.faces.title.update(title);
		
		const localSave = { 
			...composition,
			savedOn: this.savedOn,
			title: title,
		};

		if (this.versions.length > 0) {
			localSave.versions = this.versions;
		}

		try {
			localStorage.setItem('greg-' + title, JSON.stringify(localSave));
			localStorage.setItem('greg-title', title);
		} catch (error) {
			if (error.name === 'QuotaExceededError') {
				alert('Local storage full');
			} else {
				console.log(error);
				alert(error.name);
			}
		}

		console.log('save', localSave)
		return localSave;
	}

	loadLocal(titleFromList) {

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

		// is title part of files?
		this.children.title.update(title); // fuck off
		this.load(data);
	}

	listLocal() {
		const m = new UIModal({
			ui: this.ui,
			title: "local saves",
		});

		const localSaves = Object.keys(localStorage)
			.filter(k => k.includes('greg') && !k.includes('title'));

		localSaves.forEach(title => {
			m.add(new UIButton({
				text: title.replace('greg-', ''),
				callback: () => { 
					this.loadLocal(title.replace('greg-', ''));
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

	clear() {
		this.ui.panels.melody.clearAll();
		this.clearLocal();
	}

	saveFile() {
		if (this.ui.panels.playback.isRecording()) return;
		
		const json = this.saveLocal();
		const blob = new Blob([JSON.stringify(json)], { type: 'application/x-download;charset=utf-8' });
		const name = prompt("Name file", json.title);
		if (!name) return;
		saveAs(blob, name + '.json');
		this.ui.faces.title.update(name);
	}

	loadMidi(data, fileName, filePath) {
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
							// melody ??
							this.ui.panels.melody.addNote('rest', Tone.Time(delta).toNotation(), isLastNote);
						}
					}

					// melody?
					this.ui.panels.melody.addNote(note, Tone.Time(duration).toNotation(), isLastNote);
				}
			});
		});
	}

	addVersion() {
		const data = this.saveLocal();
		const tag = prompt("Tag current version?");
		const copy = {};
		if (tag !== undefined) copy.tag = tag;
		copy.versionedOn = getDate();
		for (const k in data) {
			if (k === 'versions') continue;
			if (k === 'title') continue;
			copy[k] = data[k];
		}
		this.versions.push(copy);
		this.saveLocal(false);
	}

	loadVersion(value) {
		if (value === 'current') return;
		const saveCurrent = confirm('save current to new version?');
		if (saveCurrent) this.addVersion();
	
		const m = new UIModal({
			ui: this.ui,
			title: 'versions',
		});

		for (let i = 0; i < this.versions.length; i++) {
			const v = this.versions[i];
			m.add(new UIButton({
				text: v.tag,
				callback: () => {
					this.load(v);
					m.clear();
				}
			}));
		}
	}
}