import { getDate, assert, defineSafeProperty, log, strLog } from '../../cool/cool.js';

/**
 * handle loading and saving greg files
 */
export class DoodooFiles {

	constructor(doodoo) {

		this.doodoo = doodoo;

		const data = {
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

		defineSafeProperty(this, "data", data);
	}

	load(data) {
		assert(data.hasOwnProperty("versionIndex"), "old version");

		for (const k in data) {
			this.data[k] = data[k];
		}

		this.loadVersion();
	}

	loadVersion() {
		const version = this.data.versions[this.data.versionIndex];
		for (const k in this.doodoo.comp) {
			if (!version.comp.hasOwnProperty(k)) continue;
			this.doodoo.comp[k] = version.comp[k];
		}

		// doodoo gets live mode on play ... 
		this.doodoo.setupLive();
		console.log('doodoo loop controls', this.doodoo.loopControls);
	}

	addVersion(tag) {
		this.data.versions.push({
			tag,
			comp: structuredClone(this.doodoo.comp),
			createdOn: getDate(),
			lastSavedOn: getDate(),
		});
		this.data.versionIndex = this.data.versions.length - 1;
	}

	save(needsTitleConfirm=true) { 

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
		
		const saveData = {
			...this.data,
			lastSavedOn: getDate(),
		};

		saveData.versions[this.data.versionIndex].comp = comp;
		saveData.versions[this.data.versionIndex].lastSavedOn = getDate();

		return saveData;
	}

	saveFile() {
		if (this.doodoo.isRecording()) return;
		const json = this.save(false);
		const blob = new Blob([JSON.stringify(json)], { type: 'application/x-download;charset=utf-8' });
		const name = prompt("Name file", json.title);
		if (!name) return;
		saveAs(blob, name + '.json');
	}

	// fix later if needed
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