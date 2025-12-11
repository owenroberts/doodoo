import { saveAs } from 'file-saver';
import { getDate, assert } from '../../../cool/cool.js';
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

		// should this be part of index.js ... 
		// or src
		this.data = {
			title: `doodoo-${getDate()}`,
			createdOn: getDate(),
			lastSavedOn: getDate(),
			versionIndex: 0,
			versions: [{
				comp: {},
				tag: "initial",
				createdOn: getDate(),
				lastSavedOn: getDate(),
			}],
		};

		this.addRef({ obj: this.data, ref: "title", ignoreSettings: true });

		this.addBreak();

		this.addButton({ 
			callback: () => {
				this.saveLocal();
			},
			key: 's',
			text: 'save local' 
		});

		this.addButton({ 
			callback: () => {
				this.saveFile();
			},
			key: 'alt-s', 
			text: 'save file',
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

	load(data) {
		assert(data.hasOwnProperty("versionIndex"), "old version");

		console.log('load', data);

		// cant overwrite ref
		for (const k in data) {
			this.data[k] = data[k];
		}

		this.ui.faces.title.update(this.data.title);
		this.ui.faces.versionIndex.update(this.data.versionIndex);
		this.ui.panels.versions.load();
		this.loadVersion();
	}

	loadVersion() {
		this.doodoo.comp = structuredClone(this.data.versions[this.data.versionIndex].comp);
		this.ui.panels.composition.load();
		this.ui.panels.melody.load();
		this.ui.panels.modulators.load();
		this.ui.panels.modEditor.load();
		this.ui.panels.startLoops.load();
	}

	clearLocal() {
		const title = this.ui.faces.title.value;
		if (!title) alert('No title');
		localStorage.removeItem('greg-' + title);
		localStorage.removeItem('greg-title');
		this.clearVersions()
	}

	saveLocal(needsTitleConfirm=true) { 

		const comp = structuredClone(this.doodoo.comp);

		if (comp.parts.length === 0) {
			const continueSave = confirm('no melody, continue save?');
			if (!continueSave) return;
		}

		if (needsTitleConfirm) {
			const confirmTitle = confirm(`confirm title: ${this.data.title}`);
			if (!confirmTitle) {
				const newTitle = prompt('new title', this.data.title);
				if (!newTitle) return;
				this.data.title = newTitle;
			}
		}

		// title can't be "title", will mess up local storage of title for loading
		if (this.data.title === "title") {
			alert("no title title");
			return;
		}
		
		this.ui.faces.title.update(this.data.title);

		console.log(this.data.versionIndex);

		const localSave = {
			...this.data,
			lastSavedOn: getDate(),
		};

		localSave.versions[this.data.versionIndex].comp = comp;
		localSave.versions[this.data.versionIndex].lastSavedOn = getDate();

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
		if (this.doodoo.isRecording()) return;
		
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

	_clearVersions() {
		this.versions = [];
	}

	_addVersion() {
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

	_loadVersion(value) {
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