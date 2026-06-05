import { saveAs } from 'file-saver';
import { UIPanel, UIModal, UIButton } from '@b/oi';

/**
 * panel for greg file manager
 */
export class FilesPanel extends UIPanel {

	constructor(fm, ui) {
		super({ id: "files", ui });
		
		this.fm = fm; // file manager
		this.ui = ui;

		this.addRef({ obj: this.fm.data, ref: "title", ignoreSettings: true });

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
				this.fm.saveFile();
			},
			key: 'alt-s', 
			text: 'save file',
		});

		this.addButton({ 
			callback: () => {
				this.loadLocal();
			},
			key: 'l', 
			text: 'load local',
		});

		this.addButton({ 
			callback: () => {
				this.listLocal();
			},
			key: 'ctrl-l', 
			text: 'list local',
		});

		this.addButton({ 
			callback: () => {
				this.clear();
			},
			text: 'clear local' 
		});

		this.addButton({
			isFile: true, 
			callback: data => { this.load(data); },
			key: 'o', 
			text: 'open file',
		});

		this.addButton({
			isFile: true,
			callback: () => { this.fm.loadMidi(); },
			text: 'load midi',
			fileType: 'audio/midi'
		});
	}

	load(data) {
		console.log('load', data);
		this.fm.load(data);
		
		this.ui.faces.title.update(this.fm.data.title);
		this.ui.faces.versionIndex.update(this.fm.data.versionIndex, true);
		this.ui.panels.versions.load();
		
		this.loadVersion();
	}

	// this is more like load everything ... 
	loadVersion() {
		this.ui.panels.composition.load();
		this.ui.panels.melody.load();
		this.ui.panels.modulators.load();
		this.ui.panels.modEditor.load();
		this.ui.panels.startLoops.load();
	}

	clearLocal() {
		if (!confirm("remove local save?")) return;

		localStorage.removeItem(`greg-${this.data.title}`);
		localStorage.removeItem('greg-title');
	}

	saveLocal(needsTitleConfirm=true) {

		const saveData = this.fm.save();
		this.ui.faces.title.update(this.fm.data.title);

		try {
			localStorage.setItem(`greg-${this.fm.data.title}`, JSON.stringify(saveData));
			localStorage.setItem('greg-title', this.fm.data.title);
		} catch (error) {
			if (error.name === 'QuotaExceededError') {
				alert('Local storage full');
			} else {
				console.log(error);
				alert(error.name);
			}
		}

		console.log('save', saveData);
		return saveData;
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
			.filter(k => k.includes('greg') && !k.includes('title') && !k.includes("settings"));

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
					const confirmDelete = confirm(`delete local save ${title}?`);
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
}