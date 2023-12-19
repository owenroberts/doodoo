function Melody(app, defaults) {

	let currentPart = 0;
	let partRows = [];
	let noteWidth = 60;

	let parts = [];
	let sequence = [[true]];

	let duration = defaults.duration ?? '4n';
	// const durationList = ['32n', '16n', '8n', '8n.', '4n', '4n.', '2n', '2n.', '1n', '1n.',];
	const durationList = ['32n', '16n', '8n', '4n', '2n', '1n']; // n.s are hard use rests for now


	let noteInput, durationInput, melodyPanel, sequenceGrid;

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
		part.forEach(beat => {
			addNote(beat.note.value, beat.duration.value, true);
		});
		update();
		updateDisplay();
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
		const durations = parts.flatMap(p => { return p.map(n => n[1]) });
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
						addNotes(data.parts[i]);
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