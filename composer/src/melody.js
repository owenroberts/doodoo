import { strLog } from '../../../cool/cool.js';
import { MIDI_NOTES } from '../../src/midi.js';
import { UIPanel, UILabel, UICollection, UIInputStep, UIButton, UIToggleGrid, UISelect } from '../../../oi/src/oi.js';

/**
 * for composing
 * really more like "score", or "composing" or "composer"
 */
export class MelodyPanel extends UIPanel {

	constructor(doodoo, ui) {
		super({ id: "melody", ui });

		this.doodoo = doodoo;

		this.partIndex = 0;
		this.partRows = [];
		this.noteWidth = 80;
		this.notesPerLine = 4;

		this.defaultBeat = '4n';
		this.beatList = ['32n', '16n', '8n', '4n', '2n', '1n']; // n.s are hard use rests for now

		this.addRef({
			value: 12,
			label: "scale",
			callback: value => {
				this.setStyle("--ui-scale", value);
				this.display();
			},
		});

		this.addRef({
			obj: this,
			ref: "notesPerLine",
			callback: () => { this.display(); },
		});
		
		this.addBreak();

		this.addRef({
			obj: this,
			ref: 'partIndex',
			ignoreSettings: true,
		});
		
		this.addButton({ 
			callback: () => { this.clearPart(); },
			text: 'clear',
			key: 'ctrl-x',
		});

		this.addButton({ 
			callback: () => { this.removePart(); },
			text: 'pop',
		});

		this.sequenceGrid = this.addRef({
			obj: this.doodoo.comp,
			ref: "sequence",
			type: "UIToggleGrid",
			ignoreSettings: true,
		});

		this.addRow({ id: 'melody', class: 'break' });

		this.add(new UILabel({ text: "pitch" }));
		this.pitchInput = this.add(new UIInputStep({
			value: "C4",
			class: "pitch-edit",
			options: [...MIDI_NOTES],
		}));

		this.add(new UILabel({ text: "beat" }));
		this.beatInput = this.add(new UIInputStep({
			value: '4n',
			options: [...this.beatList],
		}));

		this.addButton({
			callback: () => { this.addNote(); },
			text: "+",
			key: "+",
		});

		this.addButton({
			callback: () => { this.double(); },
			text: "double",
		});

		this.addBreak();

		this.partRows[0] = this.addRow({ id: "part-0", class: "part" });
		this.partRows[0].addClass("break-line-up");
	}

	midiFormat(pitch) {
		// console.log(pitch);
		if (pitch.length === 1 || pitch.length > 3) return false;
		let letter = pitch[0].toUpperCase();
		let number = pitch[pitch.length - 1];
		let sharp = pitch.includes('#') ? '#' : '';

		if (isNaN(+number) || !'ABCDEFG'.includes(letter)) {
			console.log(pitch, number, letter)
			return false;
		}

		return letter + sharp + number;
	}

	addNote(pitch, beat, partIndex, skipUpdate, insertBefore) {
		if (partIndex === undefined) partIndex = this.partIndex;

		if (partIndex >= this.partRows.length) {
			this.addPart();
		}
		
		const row = this.partRows[partIndex]; // row?
		pitch = pitch ?? this.pitchInput.value.toUpperCase();
		beat = beat ?? this.beatInput.value;

		let note = new UICollection({ class: "note-collection" });
		note.addClass('b' + beat.replace(/\./g, 'dot'));
		
		note.pitch = note.add(new UIInputStep({ 
			value: pitch, 
			class: 'pitch-edit', 
			options: ["rest", ...MIDI_NOTES],
			callback: () => {
				this.update();
				this.display();
			}
		}));
		
		note.beat = note.add(new UIInputStep({ 
			value: beat,
			class: 'beat-edit',
			callback: value => {
				if (!value.includes('n')) {
					if (['1','2','4','8','16','32'].includes(value)) {
						value += 'n';
					} else {
						value = beat;
					}
					note.beat.value = value;
				}
				note.el.className = 'note-collection b' + value.replace(/\./g, 'dot');
				this.update();
				this.display();
			},
			options: [...this.beatList],
		}));

		note.add(new UIButton({
			text: "+",
			class: 'double',
			callback: () => {
				this.addNote(note.pitch.value, note.beat.value, partIndex, false, note);
			}
		}));

		note.add(new UIButton({
			text: ">",
			class: 'end',
			callback: () => {
				this.addNote(note.pitch.value, note.beat.value, partIndex, false, false);
			}
		}));

		note.add(new UIButton({
			text: '𝄽',
			class: 'rest',
			callback: () => { note.pitch.value = 'rest'; },
		}));

		note.add(new UIButton({ 
			text: "x",
			class: 'remove',
			callback: () => {
				row.remove(note);
				this.update();
				this.display();
			}
		}));

		if (insertBefore) {
			row.insert(note, insertBefore);
		} else {
			row.append(note);
		}
		
		if (!skipUpdate) this.update();
		if (!skipUpdate) this.display();
	}

	addNotes(notes, partIndex) {
		const pi = partIndex ?? this.partIndex;
		notes.forEach(note => {
			
			// this is for old comps with no beats ... make assert for this
			const pitch = note[0];
			const beat = note[1];

			if (pitch === null || pitch === "rest") {
				this.addNote('rest', beat, pi, true);
			} else {
				this.addNote(pitch, beat, pi, true);
			}
		});
	}

	addPart() {
		
		// tree ?
		let row = this.addRow({ 
			id: 'part-' + this.partRows.length, 
			class: 'part',
		});
		row.addClass('break-line-up');
		this.partRows.push(row);
		this.updateSequence();
	}

	removePart() {
		const row = this.partRows.pop();

		if (this.partIndex > this.partRows.length - 1) {
			this.partIndex = this.partIndex - 1;
		}
		
		this.removeRow(row);
		// this.ui.faces.partIndex.update(this.partIndex, true);

		// this.doodoo.comp.sequence.pop();
		
		this.update();
		this.updateSequence();
	}

	updateSequence() {
		// add a part if there are new parts
		if (this.partRows.length > this.doodoo.comp.sequence.length) {
			for (let i = this.doodoo.comp.sequence.length; i < this.partRows.length; i++) {
				// fill fine bc its primitive
				this.doodoo.comp.sequence.push(Array(this.doodoo.comp.sequence[0].length).fill(true));
				this.sequenceGrid.update(this.doodoo.comp.sequence);
			}
		} else if (this.partRows.length < this.doodoo.comp.sequence.length) {
			for (let i = this.partRows.length; i >= this.doodoo.comp.sequence.length; i--) {
				this.doodoo.comp.sequence.pop();
				this.sequenceGrid.update(this.doodoo.comp.sequence);
			}
		}
	}

	double() {
		// double current melody
		const part = this.partRows[this.partIndex].childList;
		part.forEach(note => {
			this.addNote(note.pitch.value, note.beat.value, this.partIndex, true);
		});
		this.update();
		this.display();
	}

	update() {

		this.doodoo.comp.parts = [];

		const makePart = (children) => {
			let badFormatting = false;
			const part = [];
			for (let i = 0; i < children.length; i++) {
				const note = children[i];
				let pitch = note.pitch.value;
				let beat = note.beat.value;
				let pitchFormatted;
				if (['null', 'rest'].includes(pitch)) {
					pitchFormatted = "rest";
				} else {
					pitchFormatted = this.midiFormat(pitch);
					if (!pitchFormatted) badFormatting = true;
				}

				if (beat.length > 3) badFormatting = true;
				if (isNaN(+beat[0])) badFormatting = true;
				if (beat.length === 1) beat += 'n';

				part.push([pitchFormatted, beat]);
			}

			// this doesn't happen when only using composer
			if (badFormatting) {
				return alert('use notes in MIDI format like C4 or C#4, beats like 1n, 2n, 4n, 8n, etc.');
			}
			return part;
		}

		for (let i = 0; i < this.partRows.length; i++) {
			this.doodoo.comp.parts.push(makePart(this.partRows[i].childList));
		}
	}

	display() {

		const parts = this.doodoo.comp.parts;

		// get number of parts and width of comp area
		const n = parts.length;
		
		const width = this.el.getBoundingClientRect().width;

		// get smallest note
		const beats = parts.flatMap(p => { return p.map(n => n[1]) });
		let noteDivision = Math.max(...beats.map(d => parseInt(d)));
		if (beats.includes(noteDivision + 'n.')) noteDivision * 2;
		if (noteDivision < 0) noteDivision = '4n';

		this.setStyle('--column-width', Math.floor((width - 3 * this.notesPerLine ) / this.notesPerLine));
		this.setStyle('--notes-per-row', this.notesPerLine);
		this.setStyle('--default-beat', noteDivision);
	}

	clearPart() {
		this.partRows[this.partIndex].clear();
	}

	clearAll() {
		this.partRows.forEach(part => part.clear());
	}

	load() {
		this.clearAll();
		this.partRows = [];

		if (this.doodoo.comp.sequence) {
			strLog('mel load', this.doodoo.comp.sequence);
			this.sequenceGrid.update(this.doodoo.comp.sequence);
		}

		if (this.doodoo.comp.parts) {
			this.clearAll();

			for (let i = 0; i < this.doodoo.comp.parts.length; i++) {
				if (i > 0) this.addPart();
				this.addNotes(this.doodoo.comp.parts[i], i);
			}
		}

		this.update();
		this.display();
	}
}