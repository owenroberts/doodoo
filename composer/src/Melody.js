function Melody(app, defaults) {

	let currentPart = 0;
	let partRows = [];
	let noteWidth = 60;

	let parts = [];
	let sequence = [[true]];

	let defaultBeat = defaults.beat ?? '4n';
	// const beatList = ['32n', '16n', '8n', '8n.', '4n', '4n.', '2n', '2n.', '1n', '1n.',];
	const beatList = ['32n', '16n', '8n', '4n', '2n', '1n']; // n.s are hard use rests for now

	let pitchInput, beatInput, melodyPanel, sequenceGrid;

	function midiFormat(pitch) {
		if (pitch.length === 1 || pitch.length > 3) return false;
		let letter = pitch[0].toUpperCase();
		let number = pitch[pitch.length - 1];
		let sharp = pitch.includes('#') ? '#' : '';

		if (isNaN(+number) || !'ABCDEFG'.includes(letter)) {
			return false;
		}

		return letter + sharp + number;
	}

	function addNote(p, b, partIndex, skipUpdate, insertBefore) {
		if (partIndex === undefined) partIndex = currentPart;
		let pitch = p || pitchInput.value.toUpperCase();
		let beat = b || beatInput.value;
		// console.log('part index', insertBefore);
		const myRow = partRows[partIndex];

		let note = new UICollection({ class: "note-collection" });
		note.addClass('b' + beat.replace(/\./g, 'dot'));
		
		let pitchEdit = new UIListStep({ 
			value: pitch, 
			class: 'pitch-edit', 
			list: [...MIDI_NOTES, 'null', 'rest']
		});
		
		let beatEdit = new UIListStep({ 
			value: beat,
			class: 'beat-edit',
			callback: value => {
				if (!value.includes('n')) {
					if (['1','2','4','8','16','32'].includes(value)) {
						value += 'n';
					} else {
						value = beat;
					}
					beatEdit.value = value;
				}
				note.el.className = 'note-collection b' + value.replace(/\./g, 'dot');
				update();
				updateDisplay();
			},
			list: [...beatList],
		});

		let doubleBtn = new UIButton({
			text: "+",
			class: 'double-btn',
			callback: () => {
				addNote(pitchEdit.value, beatEdit.value, partIndex, false, note);
			}
		});

		let endBtn = new UIButton({
			text: ">",
			class: 'end-btn',
			callback: () => {
				addNote(pitchEdit.value, beatEdit.value, partIndex, false, false);
			}
		});

		let restBtn = new UIButton({
			text: '𝄽',
			class: 'rest-btn',
			callback: () => { pitchEdit.value = 'rest'; },
		});

		let removeBtn = new UIButton({ 
			text: "x",
			class: 'remove-btn',
			callback: () => {
				myRow.remove(note);
				update();
				updateDisplay();
			}
		});

		if (insertBefore) {
			myRow.insert(note, insertBefore);
		} else {
			myRow.append(note);
		}
		
		note.append(pitchEdit, 'pitch');
		note.append(beatEdit, 'beat');
		note.append(endBtn);
		note.append(restBtn);
		note.append(doubleBtn);
		note.append(removeBtn);
		

		if (!skipUpdate) update();
		if (!skipUpdate) updateDisplay();
	}

	function addNotes(notes, partNum) {
		const pn = partNum ?? currentPart;
		notes.forEach(note => {
			if (note === null) return addNote('rest', defaultBeat, pn,  true);
			const pitch = typeof note === 'string' ? note : note[0];
			const beat = typeof note === 'string' ? defaultBeat : note[1];
			if (pitch === null) addNote('rest', beat, pn, true);
			else addNote(pitch, beat, pn, true);
		});
	}

	function addPart() {
		let row = melodyPanel.addRow('part-' + partRows.length, 'break-line-up');
		row.addClass('part');
		partRows.push(row);
		currentPart = partRows.length - 1;
		app.ui.faces.currentPart.addOption(currentPart, 'Part ' + currentPart); // ?
		app.ui.faces.currentPart.value = currentPart;
		sequence.push(Array(sequence[0].length).fill(true));
		sequenceGrid.update(sequence);
	}

	function removePart() {
		const row = partRows.pop();
		if (currentPart > partRows.length - 1) currentPart = currentPart - 1;
		melodyPanel.removeRow(row);
		app.ui.faces.currentPart.removeOption(partRows.length);
		app.ui.faces.currentPart.value = currentPart;
		sequence.pop();
		sequenceGrid.update(sequence);
		update();
	}

	function doubleIt() {
		// double current melody
		const part = partRows[currentPart].children;
		part.forEach(note => {
			addNote(note.pitch.value, note.beat.value, currentPart, true);
		});
		update();
		updateDisplay();
	}

	function update() {
		parts = [];
		
		function makePart(children) {
			let badFormatting = false;
			const part = Array.from(children).map(note => {
				let pitch = note.pitch.value;
				let beat = note.beat.value;
				let pitchFormatted;
				if (['null', 'rest'].includes(pitch)) {
					pitchFormatted = "rest";
				} else {
					pitchFormatted = midiFormat(pitch);
					if (!pitchFormatted) badFormatting = true;
				}

				if (beat.length > 3) badFormatting = true;
				if (isNaN(+beat[0])) badFormatting = true;
				if (beat.length === 1) beat += 'n';
				return [pitchFormatted, beat];
			});

			if (badFormatting) {
				return alert('use notes in MIDI format like C4 or C#4, beats like 1n, 2n, 4n, 8n, etc.');
			}
			return part;
		}

		for (let i = 0; i < partRows.length; i++) {
			parts.push(makePart(partRows[i].children));
		}

		// console.log('update', parts);
		return parts;
	}

	function updateDisplay() {

		// get number of parts and width of comp area
		const n = parts.length;
		const w = app.ui.panels.melody.el.getBoundingClientRect().width;

		// get smallest note
		const beats = parts.flatMap(p => { return p.map(n => n[1]) });
		let noteDivision = Math.max(...beats.map(d => parseInt(d)));
		if (beats.includes(noteDivision + 'n.')) noteDivision * 2;
		if (noteDivision < 0) noteDivision = '4n';

		// start with 4 notes per line, add 4 more if it can handle four more (make it 2?)
		let npl = 4;
		while (w / (npl + 4) > noteWidth) {
			npl += 4;
		}

		app.ui.panels.melody.setProp('--column-width', Math.floor((w - 3*npl ) / npl));
		app.ui.panels.melody.setProp('--notes-per-row', npl);
		app.ui.panels.melody.setProp('--default-beat', noteDivision);
	}

	function clear() {
		// partRows.forEach(part => part.clear());
		partRows[currentPart].clear();
	}

	function load(data) {
		// console.log('load sequence', [...data.sequence]);
		if (data.sequence) {
			// fuckin shit, should i use app.ui here?
			sequence = data.sequence;
			sequenceGrid.update(data.sequence);
		}

		if (data.parts) {
			// console.log('data', [...data.parts]);
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
						addNotes(data.parts[i], i);
					}
				} else { 
					addNotes(data.parts); 
				}
			} else { 
				addNotes(data.parts); 
			}
			update(); // update parts only really, this is weird
			currentPart = 0;
			
			// console.log('parts', [...parts], parts.length);
			// console.log('load', sequence.length, parts.length);
			if (!data.sequence) {
				sequence.push(Array(parts.length).fill(true));
				sequenceGrid.update(sequence);
			} else if (sequence.length < parts.length) {
				for (let i = sequence.length; i < parts.length; i++) {
					sequence.push(Array(sequence[0].length).fill(true))
				}
				sequenceGrid.update(sequence);
			}
			// console.log('seq grid', sequenceGrid)
		}


		update();
		updateDisplay();
	}

	function connect() {
		melodyPanel = app.ui.getPanel('melody');

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

		sequenceGrid = app.ui.addUI({
			type: 'UIToggleGrid',
			text: 'Part Sequencer',
			value: sequence,
			callback: value => {
				sequence = value;
			}
		}, melodyPanel);

		melodyPanel.addRow('melody', 'break');

		pitchInput = app.ui.addProp('pitchInput', {
			type: 'UIListStep',
			value: 'C4',
			class: 'pitch-edit',
			list: [...MIDI_NOTES, 'null', 'rest']
		});

		beatInput = app.ui.addProp('beatInput', {
			type: 'UIListStep',
			value: '4n',
			list: [...beatList],
			callback: value => { 
				if (!value.includes('n')) return;
				defaultBeat = value;
			}
		});

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

		melodyPanel.addRow(undefined, 'break');

		

		partRows[0] = melodyPanel.addRow('part-0', 'break-line-up');
		partRows[0].addClass('part');
	}

	return { 
		connect, clear, update, load,
		getParts() { return parts; },
		getSequence() { return sequence; },
	};

}