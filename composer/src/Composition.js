/*
	keep track of composition data to feed to doodoo
*/



function Composition(app, defaults) {

	const durationList = ['32n', '16n', '8n', '8n.', '4n', '4n.', '2n', '2n.', '1n', '1n.',];
	
	let doodoo;

	/* comp props */
	let title = defaults.title;
	let tonic = defaults.tonic;
	let duration = defaults.duration;
	let bpm = defaults.bpm;
	let transform = defaults.transform || defaults.tonic;
	let simultaneous = defaults.simultaneous || false;
	let scale = defaults.scale;
	let useOctave = defaults.useOctave || false;
	let voices = []; // no default ??
	let parts = [];

	/* ui settings */	
	let useMetro = false;
	let currentPart = 0;
	let partRows = [];
	let noteWidth = 60;

	let mutationCountUI;
	let noteInput, durationInput, scaleRow, scaleUI, voiceRow, melodyPanel;

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

	function playOnce() {
		play(false, 1);
	}

	function play(withRecording, withCount) {
		if (parts.length === 0) return alert('Add notes to the melody.');

		update();
		if (doodoo) {
			doodoo.stop();
			Tone.Transport.cancel();
		}
		const comp = get();
		doodoo = new Doodoo({ 
			...comp,
			withRecording: withRecording,
			withCount: withCount,
			onMutate: count => {
				mutationCountUI.text = 'Mutation: ' + count;
				app.score.update(doodoo.getLoops());
			},
			useMetro: useMetro,
			controls: app.controls.get(),
		});
		app.fio.saveLocal(comp);
		// console.log(doodoo.getLoops());
		app.score.update(doodoo.getLoops());
	}

	function isRecording() {
		if (!doodoo) return false;
		return doodoo.isRecording();
	}

	function stop() {
		if (doodoo) doodoo.stop();
	}

	function mutate() {
		if (doodoo) doodoo.mutate();
	}

	function update() {
		parts = [];
		
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

		if (partRows.length > 1) {
			for (let i = 0; i < partRows.length; i++) {
				parts.push(makePart(partRows[i].children));
			}
		} else {
			parts = makePart(partRows[0].children);
		}
	}

	function doubleIt() {
		// double current melody
		const part = partRows[currentPart].children;
		part.forEach(beat => {
			addNote(beat.note.value, beat.duration.value, true);
		});
		update();
		updateDisplay();
	}

	function addNote(n, d, skipUpdate, insertBefore) {

		let note = n || app.ui.faces.noteInput.value.toUpperCase();
		let duration = d || app.ui.faces.durationInput.value;
		// console.log('part index', insertBefore);

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
						value = duration;
					}
					durEdit.value = value;
				}
				part.el.className = 'note-collection d' + value.replace(/\./g, 'dot');
				update();
				updateDisplay();
			},
			list: [...durationList],
		});

		let doubleBtn = new UIButton({
			text: "+",
			class: 'double-btn',
			callback: () => {
				addNote(noteEdit.value, durEdit.value, false, part);
			}
		});
		
		let removeBtn = new UIButton({ 
			text: "x",
			class: 'remove-btn',
			callback: () => {
				// melodyRow.remove(part);
				partRows[currentPart].remove(part);
				update();
				updateDisplay();
			}
		});

		if (insertBefore) {
			partRows[currentPart].insert(part, insertBefore);
		} else {
			partRows[currentPart].append(part);
		}
		
		part.append(noteEdit, 'note');
		part.append(durEdit, 'duration');
		part.append(doubleBtn);
		part.append(removeBtn);
		

		if (!skipUpdate) update();
		if (!skipUpdate) updateDisplay();
	}
	
	function addNotes(notes) {
		notes.forEach(note => {
			if (note === null) return addNote('rest', duration, true);
			const n = typeof note === 'string' ? note : note[0];
			const d = typeof note === 'string' ? duration : note[1];
			if (n === null) addNote('rest', d, true);
			else addNote(n, d, true);
		});
	}

	function addPart() {
		let row = melodyPanel.addRow('part-' + partRows.length, 'break-line-up');
		row.addClass('part');
		partRows.push(row);
		currentPart = partRows.length - 1;
		app.ui.faces.currentPart.addOption(currentPart, 'Part ' + currentPart); // ?
		app.ui.faces.currentPart.value = currentPart;
	}

	function removePart() {
		const row = partRows.pop();
		if (currentPart > partRows.length - 1) currentPart = currentPart - 1;
		melodyPanel.removeRow(row);
		app.ui.faces.currentPart.removeOption(partRows.length);
		app.ui.faces.currentPart.value = currentPart;
		update();
	}

	function addVoice(voice) {
		if (!voice) return;
		if (!Array.isArray(voices)) voices = [voices]; // fix for old data
		if (voices.includes(voice)) return;
		voices.push(voice);
		const voiceCollection = new UICollection({ class: 'voice-collection' });
		voiceCollection.append(new UILabel({ "text": voice }));
		voiceCollection.append(new UIButton({
			"text": "X",
			callback: () => {
				voices.splice(voices.indexOf(voice), 1);
				voiceRow.remove(voiceCollection);
			}
		}));
		voiceRow.append(voiceCollection, voice);
	}

	function updateDisplay() {

		// get number of parts and width of comp area
		const n = parts.length;
		const w = app.ui.panels.melody.el.getBoundingClientRect().width;

		// get smallest note
		const durations = partRows.length > 1 ?
			parts.flatMap(p => { return p.map(n => n[1]) }) : 
			parts.flatMap(p => p[1]);
		let noteDivision = Math.max(...durations.map(d => parseInt(d)));
		if (durations.includes(noteDivision + 'n.')) noteDivision * 2;
		if (noteDivision < 0) noteDivision = '4n';

		// start with 4 notes per line, add 4 more if it can handle four more (make it 2?)
		let npl = 4;
		while (w / (npl + 4) > noteWidth) {
			npl += 4;
		}

		app.ui.panels.melody.setProp('--column-width', Math.floor((w - 3*npl ) / npl));
		app.ui.panels.melody.setProp('--notes-per-row', npl);
		app.ui.panels.melody.setProp('--default-duration', noteDivision);
	}

	function clear() {
		partRows.forEach(part => part.clear());
	}

	function get() {
		update();
		return { parts, tonic, transform, bpm, voices, title, duration, scale, simultaneous, useOctave };
	}

	function load(data) {
		if (data.title) app.ui.faces.title.update(data.title);
		if (data.transform) app.ui.faces.transform.update(data.transform);
		if (data.bpm) app.ui.faces.bpm.update(data.bpm);
		if (data.duration) app.ui.faces.duration.update(data.duration);
		if (data.useOctave) app.ui.faces.useOctave.update(data.useOctave);

		if (data.voices) {
			voices = [];
			voiceRow.clear();
			let v = Array.isArray(data.voices) ? [...data.voices] : [data.voices];
			v.forEach(voice => { addVoice(voice) });
		} else {
			defaults.voices.forEach(voice => { addVoice(voice) });
		}
		
		if (data.tonic) {
			app.ui.faces.tonic.update(typeof data.tonic === 'string' ? 
				data.tonic :
				getMIDINote(data.tonic)
			);
		}

		if (data.scale) {
			scale = data.scale.map(i => +i);
			scaleUI.set(scale);
		}
		
		if (data.parts) {

			clear();
			parts = [];
			if (Array.isArray(data.parts[0])) {
				if (Array.isArray(data.parts[0][0])) {
					for (let i = 0; i < data.parts.length; i++) {
						currentPart = i;
						if (i > 0) {
							partRows[i] = melodyPanel.addRow('part-' + i, 'break-line-up');
							partRows[i].addClass('part');
							app.ui.faces.currentPart.addOption(i, 'Part ' + i);
						}
						addNotes(data.parts[i]);
					}
				} else { addNotes(data.parts); }
			} else { addNotes(data.parts); }
			currentPart = 0;
		}

		update();
		updateDisplay();
	}

	function connect() {

		const playBackPanel = app.ui.getPanel('playback', { label: 'Play Back' });
		const compositionPanel = app.ui.getPanel('composition');
		melodyPanel = app.ui.getPanel('melody');

		app.ui.addCallbacks([
			{ callback: play, key: 'space', text: 'Play', args: [false] },
			{ callback: playOnce, key: '.', text: 'Play Once' },
			{ callback: stop, key: ',', text: 'Stop' },
			{ callback: play, key: 'r', text: 'Record', args: [true] },
			{ callback: mutate, key: 'd', text: 'Mutate' },
		], playBackPanel);

		mutationCountUI = new UILabel({
			id: 'mutation-count',
			text: 'Mutation 0',
		});
		playBackPanel.add(mutationCountUI);
		
		app.ui.addProps({
			'useMetro': {
				type: 'UIToggleCheck',
				value: useMetro,
				label: 'Metro',
				key: 'm',
				callback: value => { useMetro = value; },
			}
		}, playBackPanel);

		app.ui.addUIs({
			'title': {
				id: 'title',
				value: title,
				callback: value => { title = value; }
			},
			'tonic': {
				type: 'UIListStep',
				value: tonic,
				label: 'Tonic',
				class: 'note-edit',
				list: [...MIDI_NOTES, 'null', 'rest'],
				callback: value => { tonic = value; }
			},
			'transform': {
				type: 'UIListStep',
				value: transform,
				label: 'Tonic Transform',
				class: 'note-edit',
				list: [...MIDI_NOTES, 'null', 'rest'],
				callback: value => { transform = value; }
			},
			'bpm': {
				value: bpm,
				label: 'BPM',
				type: 'UINumberStep',
				range: [60, 250],
				callback: value => { bpm = value;}
			},
			'duration': {
				value: duration,
				"type": "UISelect",
				label: "Default Duration",
				selected: '4n',
				options: [
					{ "value": "1n", "text": "Whole 1n" },
					{ "value": "2n", "text": "Half 2n" },
					{ "value": "4n", "text": "Quarter 4n" },
					{ "value": "8n", "text": "Eighth 8n" }
				],
				callback: value => { duration = value; }
			},
			'simultaneous': {
				value: simultaneous,
				type: 'UIToggleCheck',
				label: 'Simultaneous Parts',
				callback: value => { simultaneous = value; }
			},
			'useOctave': {
				type: 'UIToggleCheck',
				label: 'Use Octave',
				value: useOctave,
				callback: value => { useOctave = value; }
			},
		}, compositionPanel);

		compositionPanel.addRow(undefined, 'break');
		compositionPanel.add(new UILabel({ text: 'Scale Intervals' }));
		scaleRow = compositionPanel.addRow(undefined, 'break');
		scaleUI = new UINumberList({
			list: scale,
			callback: value => { 
				scale = value; 
			}
		});
		compositionPanel.add(scaleUI);


		const voicesUI = new UISelectButton({
			label: 'Voices',
			callback: addVoice,
			"selected": "synth",
			"options": [
				{ "value": "choir", "text": "Choir" },
				{ "value": "fmSynth", "text": "FMSynth" },
				{ "value": "toms", "text": "Toms" },
				{ "value": "bamboo", "text": "Bamboo" },
				{ "value": "strings", "text": "Strings" },
				{ "value": "flute", "text": "Flute" },
				{ "value": "guitar", "text": "Guitar" }
			]
		});
		compositionPanel.add(new UILabel({ class: 'break' }));
		compositionPanel.add(voicesUI);
		voiceRow = compositionPanel.addRow();

		app.ui.addCallback({
			row: true,
			callback() {
				if (!doodoo) return;
				doodoo.printLoops();
			},
			text: 'Print Loops',
			key: 'p',
		}, 'composition');

		app.ui.addCallback({
			callback() {
				if (!doodoo) return;
				doodoo.printParams();
			},
			text: 'Print Params',
			key: 'shift-p',
		}, 'composition');
		
		melodyPanel.addRow(undefined, 'break');

		app.ui.addProps({
			'melodyScale': {
				type: 'UINumberStep',
				value: 12,
				label: 'Scale',
				callback: value => {
					melodyPanel.setProp('--ui-scale', value);
					updateDisplay();
				},
				reset: true,
			},
			'noteWidth': {
				type: 'UINumberStep',
				label: 'Note Width',
				value: 80,
				callback: value => {
					noteWidth = value;
					if (partRows[0]) updateDisplay();
				},
				range: [40, 200],
				reset: true
			}, 
		}, melodyPanel);

		melodyPanel.addRow(undefined, 'break');

		app.ui.addProp('currentPart', {
			type: 'UISelect',
			options: [{ value: 0, text: 'Part 0' }],
			callback: value => { currentPart = +value; }
		}, melodyPanel);

		app.ui.addCallbacks([
			{ callback: addPart, text: '+' },
			{ callback: removePart, text: '–' },
			{ callback: clear, text: 'Clear', key: '0' },
		], melodyPanel);

		app.ui.addProps({
			'noteInput': {
				type: 'UIListStep',
				value: 'C4',
				class: 'note-edit',
				list: [...MIDI_NOTES, 'null', 'rest']
			},
			'durationInput': {
				type: 'UIListStep',
				value: '4n',
				list: [...durationList],
				callback: value => { 
					if (!value.includes('n')) return;
					duration = value;
				}
			}
		}, melodyPanel);

		app.ui.addUI({ 
			type: 'UIButton', 
			callback: addNote, 
			text: '+', 
			key: '+'
		}, melodyPanel);

		app.ui.addUI({ 
			type: 'UIButton', 
			callback: doubleIt, 
			text: 'Double It', 
		}, melodyPanel);

		melodyPanel.addRow('melody', 'break');

		partRows[0] = melodyPanel.addRow('part-0', 'break-line-up');
		partRows[0].addClass('part');
	}

	return { connect, load, get, clear, isRecording, update };
}