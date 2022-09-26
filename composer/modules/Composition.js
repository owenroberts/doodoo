/*
	keep track of composition data to feed to doodoo
*/

function Composition(app, defaults) {
	const self = this;
	let { MIDI_NOTES } = app;

	let doodoo;
	let scaleRow, noteInput, durationInput, voiceRow;

	this.tonic = defaults.tonic;
	this.transform = defaults.transform || defaults.tonic;
	this.bpm = defaults.bpm;
	this.voices = [];
	this.scale = defaults.scale;
	this.title = defaults.title;
	this.duration = defaults.duration;
	this.parts = [];
	this.simultaneous = defaults.simultaneous;
	this.useMetro = false;

	this.currentPart = 0;
	this.partRows = [];
	
	this.noteWidth = 60;
	this.uiScale = 12;
	this.setUIScale = function(value) {
		self.uiScale = value;
		if (app.ui.panels.melody) app.ui.panels.melody.setProp('--ui-scale', self.uiScale);
	};

	this.setNoteWidth = function(value) {
		self.noteWidth = value;
		if (self.partRows[0]) self.updateDisplay();
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
		voiceRow = self.panel.voiceRow;
		self.partRows[0] = app.ui.panels.melody.addRow('part-0', 'break-line-up');
		self.partRows[0].addClass('part');
		// melodyRow = app.ui.panels.melody.melody;
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
			controls: app.controls.get(),
		});
		doodoo.play();
		app.fio.saveLocal(comp);
	};

	this.isRecording = function() {
		if (!doodoo) return false;
		return doodoo.isRecording();
	};

	this.stop = function() {
		if (doodoo) doodoo.stop();
	};

	this.mutate = function() {
		if (doodoo) doodoo.mutate();
	};

	this.update = function() {
		self.parts = [];
		
		function makePart(children) {
			let badFormatting = false;
			const part = Array.from(children).map(p => {
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

			if (badFormatting) {
				return alert('use notes in MIDI format like C4 or C#4, durations like 1n, 2n, 4n, 8n, etc.');
			}
			return part;
		}

		if (self.partRows.length > 1) {
			for (let i = 0; i < self.partRows.length; i++) {
				self.parts.push(makePart(self.partRows[i].children));
			}
		} else {
			self.parts = makePart(self.partRows[0].children);
		}
	};

	this.addNote = function(n, d, skipUpdate) {

		let note = n || noteInput.value.toUpperCase();
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
						value = self.duration;
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
			text: "x",
			class: 'remove-btn',
			callback: () => {
				// melodyRow.remove(part);
				self.partRows[self.currentPart].remove(part);
				self.update();
				self.updateDisplay();
			}
		});
		
		part.append(noteEdit, 'note');
		part.append(durEdit, 'duration');
		part.append(removeBtn);
		// melodyRow.append(part);
		self.partRows[self.currentPart].append(part);

		if (!skipUpdate) self.update();
		if (!skipUpdate) self.updateDisplay();
	};

	this.addPart = function() {
		console.log('add part');
		let row = app.ui.panels.melody.addRow('part-' + self.partRows.length, 'break-line-up');
		row.addClass('part');
		self.partRows.push(row);
		self.currentPart = self.partRows.length - 1;
		app.ui.faces.currentPart.addOption(self.currentPart, true, 'Part ' + self.currentPart);
	};

	this.addVoice = function(voice) {
		if (!Array.isArray(self.voices)) self.voices = [self.voices]; // fix for old data
		if (self.voices.includes(voice)) return;
		self.voices.push(voice);
		const voiceCollection = new UICollection({ class: 'voice-collection' });
		voiceCollection.append(new UILabel({ "text": voice }));
		voiceCollection.append(new UIButton({
			"text": "X",
			callback: () => {
				self.voices.splice(self.voices.indexOf(voice), 1);
				voiceRow.remove(voiceCollection);
			}
		}));
		voiceRow.append(voiceCollection);
	};

	this.updateDisplay = function() {
		const n = self.parts.length;
		const w = app.ui.panels.melody.el.getBoundingClientRect().width;

		const durations = self.partRows.length > 1 ?
			self.parts.flatMap(p => { return p.map(n => n[1]) }) : 
			self.parts.flatMap(p => p[1]);
		let noteDivision = Math.max(...durations.map(d => parseInt(d)));
		if (durations.includes(noteDivision + 'n.')) noteDivision * 2;
		if (noteDivision < 0) noteDivision = '4n';

		let npl = 4;
		while (w / npl > self.noteWidth) {
			npl += 4;
		}

		app.ui.panels.melody.setProp('--column-width', Math.floor(w / npl));
		app.ui.panels.melody.setProp('--notes-per-row', npl);
		app.ui.panels.melody.setProp('--default-duration', noteDivision);
	};

	this.clear = function() {
		// melodyRow.clear();
		// self.partRows[self.currentPart].clear();
		self.partRows.forEach(part => part.clear());
	};

	this.get = function() {
		self.update();
		return {
			parts: self.parts,
			tonic: self.tonic,
			transform: self.transform,
			bpm: self.bpm,
			voices: self.voices,
			title: this.title,
			duration: this.duration,
			scale: this.scale,
			simultaneous: this.simultaneous,
		};
	};

	this.load = function(data) {
		if (data.title) {
			app.ui.faces.title.update(data.title);
		}

		if (data.voices) {
			let voices = Array.isArray(data.voices) ? [...data.voices] : [data.voices];
			voices.forEach(voice => {
				self.addVoice(voice);
			});
		} else {
			defaults.voices.forEach(voice => {
				self.addVoice(voice);
			});
		}

		if (data.bpm) {
			app.ui.faces.bpm.update(data.bpm);
		}
		
		if (data.tonic) {
			app.ui.faces.tonic.update(typeof data.tonic === 'string' ? 
				data.tonic :
				getMIDINote(data.tonic)
			);
		}

		if (data.duration) {
			app.ui.faces.duration.update(data.duration);
		}

		if (data.scale) {
			self.scale = data.scale.map(i => +i);
		}
		self.updateScale();

		if (data.parts) {

			self.clear();
			self.parts = [];

			if (Array.isArray(data.parts[0])) {
				if (Array.isArray(data.parts[0][0])) {
					for (let i = 0; i < data.parts.length; i++) {
						self.currentPart = i;
						if (i > 0) {
							let row = app.ui.panels.melody.addRow('part-' + i, 'break-line-up');
							row.addClass('part');
							self.partRows.push(row);
						}
						addParts(data.parts[i]);
					}
				} else {
					addParts(data.parts);
				}
			}
			self.currentPart = 0;
		}
		self.update();
		self.updateDisplay();
	};

	function addParts(parts) {
		parts.forEach(part => {
			if (part === null) return self.addNote('rest', data.duration, true);
			const note = typeof part === 'string' ? part : part[0];
			const duration = typeof part === 'string' ? data.duration : part[1];
			if (note === null) self.addNote('rest', duration, true);
			else self.addNote(note, duration, true);
		});
	}
}