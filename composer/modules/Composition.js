/*
	keep track of composition data to feed to doodoo
*/

function Composition(app, defaults) {
	const self = this;
	let { MIDI_NOTES } = app;

	let doodoo;

	this.tonic = defaults.tonic;
	this.bpm = defaults.bpm;
	this.samples = defaults.samples;
	this.scale = defaults.scale;
	this.title = defaults.title;
	this.startDuration = defaults.startDuration;
	this.parts = [];

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
		for (let i = 0; i < this.scale.length; i++) {
			let interval = new UINumberStep({
				value: self.scale[i],
				min: -11,
				max: 11,
				callback: value => {
					self.scale[i] = value;
				}
			});
			self.panel.scaleRow.append(interval, i);
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
		doodoo = new Doodoo({ ...comp, withRecording: withRecording });
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
		let badFormatting = false;
		const children = self.panel.melody.children;
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
		this.parts = parts;
		// console.log(parts);
		const data = self.get();
		// app.fio.saveLocal(data);
	};

	this.addNote = function(n, d) {

		let note = n || self.panel.melodyInput.noteInput.value;
		let dur = d || self.panel.melodyInput.durationInput.value;

		let part = new UICollection({ class: "note-collection" });
		let noteEdit = new UIText({ value: note });
		let durEdit = new UIText({ value: dur });
		let removeBtn = new UIButton({ 
			text: "X",
			callback: () => {
				self.panel.melody.remove(part);
			}
		});
		part.append(noteEdit, 'note');
		part.append(durEdit, 'duration');
		part.append(removeBtn);

		// console.log(n, d, part);

		self.panel.melody.append(part);
		self.update();
	};

	this.clear = function() {
		self.panel.melody.clear();
	};

	this.get = function() {
		return {
			parts: self.parts,
			tonic: self.tonic,
			bpm: self.bpm,
			samples: this.samples,
			title: this.title,
			startDuration: this.startDuration,
		};
	};

	this.load = function(data) {

		self.clear();

		if (data.title) {
			app.ui.faces.title.update(data.title);
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
			for (let i = 0; i < data.length; i++) {
				self.panel.scaleRow[i].update(data.scale[i]);
			}
		}

		if (data.parts) {
			data.parts.forEach(part => {
				if (part === null) return self.addNote('rest', data.startDuration);
				const note = typeof part === 'string' ? part : part[0];
				const duration = typeof part === 'string' ? data.startDuration : part[1];
				if (note === null) self.addNote('rest', duration);
				else self.addNote(note, duration);
			});
		}
	};
}