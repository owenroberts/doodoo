/*
	keep track of composition data to feed to doodoo
*/

function Composition(app, defaults) {
	
	let doodoo;
	let scaleRow, noteInput, durationInput, voiceRow;
	let mutationCountUI;

	let title = defaults.title;
	let tonic = defaults.tonic;
	let transform = defaults.transform || defaults.tonic;
	let bpm = defaults.bpm;
	let voices = [];
	let scale = defaults.scale;
	let duration = defaults.duration;
	let parts = [];
	let simultaneous = defaults.simultaneous || false;
	
	let useMetro = false;

	let currentPart = 0;
	let partRows = [];
	
	let noteWidth = 60;

	
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

	function updateScale() {
		// implies variable scale length, should just keep at 7?
		scaleRow.clear();
		for (let i = 0; i < scale.length; i++) {
			let interval = new UINumberStep({
				value: scale[i],
				range: [-11, 11],
				callback: value => { scale[i] = +value; }
			});
			scaleRow.append(interval, i);
		}
	}

	function play(withRecording) {
		console.log('play');
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
			onMutate: count => {
				mutationCountUI.text = 'Mutation: ' + count;
				// app.score.update(doodoo.getLoops());
			},
			useMetro: useMetro,
			controls: app.controls.get(),
		});
		// doodoo.play();
		// app.fio.saveLocal(comp);
		// app.score.update(doodoo.getLoops());
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

	function addNote(n, d, skipUpdate) {

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
						value = duration;
					}
					durEdit.value = value;
				}
				part.el.className = 'note-collection d' + value.replace(/\./g, 'dot');
				update();
				updateDisplay();
			},
			list: ['32n', '16n', '8n', '8n.', '4n', '4n.', '2n', '2n.', '1n', '1n.',]
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
		
		part.append(noteEdit, 'note');
		part.append(durEdit, 'duration');
		part.append(removeBtn);
		// melodyRow.append(part);
		partRows[currentPart].append(part);

		if (!skipUpdate) update();
		if (!skipUpdate) updateDisplay();
	}

	function addPart() {
		let row = app.ui.panels.melody.addRow('part-' + partRows.length, 'break-line-up');
		row.addClass('part');
		partRows.push(row);
		currentPart = partRows.length - 1;
		app.ui.faces.currentPart.addOption(currentPart, true, 'Part ' + currentPart);
	}

	function addParts(parts) {
		parts.forEach(part => {
			if (part === null) return addNote('rest', data.duration, true);
			const note = typeof part === 'string' ? part : part[0];
			const duration = typeof part === 'string' ? data.duration : part[1];
			if (note === null) addNote('rest', duration, true);
			else addNote(note, duration, true);
		});
	}

	function addVoice(voice) {
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
		voiceRow.append(voiceCollection);
	}

	function updateDisplay() {
		const n = parts.length;
		const w = app.ui.panels.melody.el.getBoundingClientRect().width;

		const durations = partRows.length > 1 ?
			parts.flatMap(p => { return p.map(n => n[1]) }) : 
			parts.flatMap(p => p[1]);
		let noteDivision = Math.max(...durations.map(d => parseInt(d)));
		if (durations.includes(noteDivision + 'n.')) noteDivision * 2;
		if (noteDivision < 0) noteDivision = '4n';

		let npl = 4;
		while (w / npl > noteWidth) {
			npl += 4;
		}

		app.ui.panels.melody.setProp('--column-width', Math.floor(w / npl));
		app.ui.panels.melody.setProp('--notes-per-row', npl);
		app.ui.panels.melody.setProp('--default-duration', noteDivision);
	}

	function clear() {
		partRows.forEach(part => part.clear());
	}

	function get() {
		update();
		return { parts, tonic, transform, bpm, voices, title, duration, scale, simultaneous };
	}

	function load(data) {
		if (data.title) app.ui.faces.title.update(data.title);
		if (data.transform) app.ui.faces.transform.update(data.transform);
		if (data.bpm) app.ui.faces.bpm.update(data.bpm);
		if (data.duration) app.ui.faces.duration.update(data.duration);

		if (data.voices) {
			let voices = Array.isArray(data.voices) ? [...data.voices] : [data.voices];
			voices.forEach(voice => addVoice);
		} else {
			defaults.voices.forEach(voice => addVoice)
		}
		
		if (data.tonic) {
			app.ui.faces.tonic.update(typeof data.tonic === 'string' ? 
				data.tonic :
				getMIDINote(data.tonic)
			);
		}

		if (data.scale) scale = data.scale.map(i => +i);
		updateScale();

		if (data.parts) {

			clear();
			parts = [];
			if (Array.isArray(data.parts[0])) {
				if (Array.isArray(data.parts[0][0])) {
					for (let i = 0; i < data.parts.length; i++) {
						currentPart = i;
						if (i > 0) {
							let row = app.ui.panels.melody.addRow('part-' + i, 'break-line-up');
							row.addClass('part');
							partRows.push(row);
						}
						addParts(data.parts[i]);
					}
				} else {
					addParts(data.parts);
				}
			}
			currentPart = 0;
		}
		update();
		updateDisplay();
	}

	function connectUI() {

		const playBackPanel = app.ui.createPanel('playback', { label: 'Play Back' });
		const compositionPanel = app.ui.createPanel('composition');
		const melodyPanel = app.ui.createPanel('melody');

		app.ui.addCallbacks([
			{ callback: play, key: 'space', text: 'Play', args: [false] },
			{ callback: stop, key: 'alt-space', text: 'Stop' },
			{ callback: play, key: 'r', text: 'Record', args: [true] },
			{ callback: mutate, key: 'd', text: 'Mutate' },
			{ key: 't', text: 'Test', callback: () => {
				console.log(useMetro);	
			}}
		], playBackPanel);

		mutationCountUI = new UILabel({
			type: 'UIElement',
			id: 'mutation-count',
			text: 'Mutation 0',
		});
		playBackPanel.add(mutationCountUI);
		
		app.ui.addProp('useMetro', {
			type: 'UIToggleCheck',
			value: useMetro,
			callback: value => { useMetro = value; },
			key: 'm',
			label: 'Metro'
		}, playBackPanel);

		app.ui.addProps({
			'title': {
				id: 'title',
				value: title,
				callback: value => { title = value; }
			},
			'tonic': {
				value: tonic,
				label: 'Tonic',
				callback: value => { tonic = value; }
			},
			'transform': {
				value: transform,
				label: 'Tonic Transform',
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
		}, compositionPanel);

		compositionPanel.addRow(undefined, 'break');
		compositionPanel.add(new UILabel({ text: 'Scale Intervals '}));
		scaleRow = compositionPanel.addRow(undefined, 'break');

		voiceRow = compositionPanel.addRow();
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
		compositionPanel.add(voicesUI);

		melodyPanel.addRow(undefined, 'break');

		app.ui.addProp('melodyScale', {
			type: 'UINumberStep',
			value: 12,
			label: 'Scale',
			callback: value => {
				melodyPanel.setProp('--ui-scale', value);
			},
			reset: true,
		}, melodyPanel);

		app.ui.addProp('noteWidth', {
			type: 'UINumberStep',
			label: 'Note Width',
			value: 80,
			callback: value => {
				noteWidth = value;
				if (partRows[0]) updateDisplay();
			},
			range: [40, 120],
			reset: true
		}, melodyPanel);

		melodyPanel.addRow(undefined, 'break');

		app.ui.addProp('currentPart', {
			type: 'UISelect',
			label: 'Part',
			options: [ { value: 0, text: 'Part 0' }],
			callback: value => { currentPart = +value; }
		}, melodyPanel);

		app.ui.addCallback({ callback: addPart, text: '+' }, melodyPanel);

		app.ui.addCallback({ callback: clear, text: 'Clear', key: '0' }, melodyPanel);

		// replace w list steps ...
		noteInput = melodyPanel.add(new UIText({ placeholder: 'C4' }));
		durationInput = melodyPanel.add(new UIText({ placeholder: '4n' }));
		app.ui.addUI({ 
			type: 'UIButton', 
			callback: addNote, 
			text: '+', 
			key: '+'
		}, melodyPanel);

		melodyPanel.addRow('melody', 'break');

		partRows[0] = melodyPanel.addRow('part-0', 'break-line-up');
		partRows[0].addClass('part');

		// noteInput = app.ui.panels.melody.melodyInput.noteInput;
		// durationInput = app.ui.panels.melody.melodyInput.durationInput;
	}

	return { connectUI, load, get };
}