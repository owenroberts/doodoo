/*
	keep track of composition data to feed to doodoo
*/

function Composition(app, defaults) {
	const self = this;
	let { MIDI_NOTES } = app;
	let addProp = Object.defineProperty;

	let doodoo;
	let melodyRow, scaleRow, noteInput, durationInput;

	this.tonic = defaults.tonic;
	this.bpm = defaults.bpm;
	this.samples = defaults.samples;
	this.scale = defaults.scale;
	this.title = defaults.title;
	this.startDuration = defaults.startDuration;
	this.parts = [];
	this.useMetro = false;
	
	this.noteWidth = 60;
	this.uiScale = 12;
	this.setUIScale = function(value) {
		self.uiScale = value;
		if (app.ui.panels.melody) app.ui.panels.melody.setProp('--ui-scale', self.uiScale);
	};

	this.setNoteWidth = function(value) {
		self.noteWidth = value;
		if (melodyRow) self.updateDisplay();
	};

	function midiFormat(note) {
		if (note.length === 1 || note.length > 3) return false;
		let letter = note[0].toUpperCase();
		let number = note[note.length - 1];
		let sharp = note.includes('#') ? '#' : '';

		if (isNaN(+number) || !'ABCDEFG'.includes(letter)) {
			return false;
		}

		return letter + sharp + number;
	}

	function getMIDINote(noteIndex) {
		return MIDI_NOTES[noteIndex];
	}

	this.init = function() {
		scaleRow = self.panel.scaleRow;
		melodyRow = app.ui.panels.melody.melody;
		noteInput = app.ui.panels.melody.melodyInput.noteInput;
		durationInput = app.ui.panels.melody.melodyInput.durationInput;

		self.setUIScale(self.uiScale);
	};

	this.updateScale = function() {
		scaleRow.clear();
		for (let i = 0; i < this.scale.length; i++) {
			let interval = new UINumberStep({
				value: self.scale[i],
				min: -11,
				max: 11,
				callback: value => {
					self.scale[i] = +value;
				}
			});
			scaleRow.append(interval, i);
		}
	};

	this.play = function(withRecording) {
		if (self.parts.length === 0) return alert('Add notes to the melody.');

		self.update();
		if (doodoo) {
			doodoo.stop();
			Tone.Transport.cancel();
		}
		const comp = self.get();
		doodoo = new Doodoo({ 
			...comp, 
			withRecording: withRecording,
			onMutate: count => {
				app.ui.faces.mutationCount.text = 'Mutation: ' + count;
			},
			useMetro: self.useMetro,
			params: app.params.get()
		});
		doodoo.play();
		app.fio.saveLocal(comp);
	};

	this.stop = function() {
		if (doodoo) doodoo.stop();
	};

	this.mutate = function() {
		if (doodoo) doodoo.mutate();
	};

	this.update = function() {
		self.parts = [];
		let badFormatting = false;
		const children = melodyRow.children;
		const parts = Array.from(children).map(p => {
			let note = p.note.value;
			let duration = p.duration.value;
			let noteFormatted;
			if (['null', 'rest'].includes(note)) {
				noteFormatted = null;
			} else {
				noteFormatted = midiFormat(note);
				if (!noteFormatted) badFormatting = true;
			}

			if (duration.length > 3) badFormatting = true;
			if (isNaN(+duration[0])) badFormatting = true;
			if (duration.length === 1) duration += 'n';
			return [noteFormatted, duration];
		});

		if (badFormatting) return alert('use notes in MIDI format like C4 or C#4, durations like 1n, 2n, 4n, 8n, etc.');
		self.parts = parts;
		// console.log(parts);
	};

	this.addNote = function(n, d, skipUpdate) {

		let note = n || noteInput.value;
		let duration = d || durationInput.value;

		let part = new UICollection({ class: "note-collection" });
		part.addClass('d' + duration.replace(/\./g, 'dot'));
		
		let noteEdit = new UIListStep({ 
			value: note, 
			class: 'note-edit', 
			list: [...MIDI_NOTES, 'null', 'rest']
		});
		
		let durEdit = new UIListStep({ 
			value: duration,
			class: 'duration-edit',
			callback: value => {
				if (!value.includes('n')) {
					if (['1','2','4','8','16','32'].includes(value)) {
						value += 'n';
					} else {
						value = self.startDuration;
					}
					durEdit.value = value;
				}
				part.el.className = 'note-collection d' + value.replace(/\./g, 'dot');
				self.update();
				self.updateDisplay();
			},
			list: ['32n', '16n', '8n', '8n.', '4n', '4n.', '2n', '2n.', '1n', '1n.',]
		});
		
		let removeBtn = new UIButton({ 
			text: "X",
			class: 'remove-btn',
			callback: () => {
				melodyRow.remove(part);
				self.update();
				self.updateDisplay();
			}
		});
		
		part.append(noteEdit, 'note');
		part.append(durEdit, 'duration');
		part.append(removeBtn);
		melodyRow.append(part);

		if (!skipUpdate) self.update();
		if (!skipUpdate) self.updateDisplay();
	};

	this.updateDisplay = function() {
		const n = self.parts.length;
		const w = melodyRow.el.getBoundingClientRect().width;
		// console.log(n, w);

		const durations = self.parts.map(p => p[1]);
		const noteDivision = Math.max(...durations.map(d => parseInt(d)));
		if (durations.includes(noteDivision + 'n.')) noteDivision * 2;
		// console.log(noteDivision, self.startDuration);

		// let nw = 60; // note width
		let npl = 4;
		while (w / npl > self.noteWidth) {
			npl += 4;
		}

		// console.log(npl, w / npl);
		melodyRow.setProp('--column-width', Math.floor(w / npl));
		melodyRow.setProp('--notes-per-row', npl);
		melodyRow.setProp('--default-duration', noteDivision);
	};

	this.clear = function() {
		melodyRow.clear();
	};

	this.get = function() {
		self.update();
		return {
			parts: self.parts,
			tonic: self.tonic,
			bpm: self.bpm,
			samples: self.samples,
			title: this.title,
			startDuration: this.startDuration,
			scale: this.scale,
		};
	};

	this.load = function(data) {
		if (data.title) {
			app.ui.faces.title.update(data.title);
		}

		// ignore samples for now

		if (data.bpm) {
			app.ui.faces.bpm.update(data.bpm);
		}
		
		if (data.tonic) {
			app.ui.faces.tonic.update(typeof data.tonic === 'string' ? 
				data.tonic :
				getMIDINote(data.tonic)
			);
		}

		if (data.startDuration) {
			app.ui.faces.startDuration.update(data.startDuration);
		}

		if (data.scale) {
			self.scale = data.scale.map(i => +i);
		}
		self.updateScale();

		if (data.parts) {

			self.clear();
			self.parts = [];

			data.parts.forEach(part => {
				if (part === null) return self.addNote('rest', data.startDuration, true);
				const note = typeof part === 'string' ? part : part[0];
				const duration = typeof part === 'string' ? data.startDuration : part[1];
				if (note === null) self.addNote('rest', duration, true);
				else self.addNote(note, duration, true);
			});
		}

		self.update();
		self.updateDisplay();
	};
}