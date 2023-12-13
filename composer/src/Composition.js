/*
	keep track of composition data to feed to doodoo
*/

function Composition(app, defaults) {

	/* comp props */
	let title = defaults.title;
	let tonic = defaults.tonic;
	let duration = defaults.duration;
	let bpm = defaults.bpm;
	let transpose = defaults.transpose || defaults.tonic;
	let scale = defaults.scale;
	let useOctave = defaults.useOctave || false;
	let instruments = []; // no default ??
	let stacking = [[]];
	
	/* ui settings */	
	let scaleRow, scaleUI, instrumentRow;
	let stackRows;

	function getMIDINote(noteIndex) {
		return MIDI_NOTES[noteIndex];
	}

	function addInstrument(instrument) {
		if (!instrument) return;
		if (!Array.isArray(instruments)) instruments = [instruments]; // fix for old data
		if (instruments.includes(instrument)) return;
		instruments.push(instrument);
		const instrumentCollection = new UICollection({ class: 'instrument-collection' });
		instrumentCollection.append(new UILabel({ "text": instrument }));
		instrumentCollection.append(new UIButton({
			"text": "X",
			callback: () => {
				instruments.splice(instruments.indexOf(instrument), 1);
				instrumentRow.remove(instrumentCollection);
			}
		}));
		instrumentRow.append(instrumentCollection, instrument);
	}

	function get() {
		app.melody.update();
		const parts = app.melody.getParts();
		const sequence = app.melody.getSequence();
		return { tonic, transpose, bpm, instruments, title, duration, scale, useOctave, sequence, parts, stacking };
	}

	function load(data) {
		if (data.title) app.ui.faces.title.update(data.title);
		if (data.transpose) app.ui.faces.transpose.update(data.transpose);
		if (data.bpm) app.ui.faces.bpm.update(data.bpm);
		if (data.duration) app.ui.faces.duration.update(data.duration);
		if (data.useOctave) app.ui.faces.useOctave.update(data.useOctave);

		if (data.instruments) {
			instruments = [];
			instrumentRow.clear();
			let i = Array.isArray(data.instruments) ? [...data.instruments] : [data.instruments];
			i.forEach(instrument => { addInstrument(instrument) });
		} else {
			defaults.instruments.forEach(instrument => { addInstrument(instrument) });
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

		if (data.stacking) {
			stacking = data.stacking;
			stackRows.clear();
			
			for (let i = 0; i < data.stacking.length; i++) {
				const stack = data.stacking[i];
				const row = stackRows.add(new UIRow({ class: 'break' }));
				row.add(new UILabel({ text: 'Stack ' + i }));
				for (let j = 0; j < stack.length; j++) {
					const instrument = stack[j];
					const v = new UICollection();
					v.add(new UILabel({ text: instrument }));
					v.add(new UIButton({
						text: 'x',
						callback: () => {
							row.remove(v);
							let idx = stacking[i].indexOf(instrument);
							stacking[i].splice(idx, 1);
						}
					}));
					row.add(v);
				}
			}
		}
	}

	function connect() {

		const compositionPanel = app.ui.getPanel('composition');

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
			'transpose': {
				type: 'UIListStep',
				value: transpose,
				label: 'Tonic transpose',
				class: 'note-edit',
				list: [...MIDI_NOTES, 'null', 'rest'],
				callback: value => { transpose = value; }
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
					{ "value": "8n", "text": "Eighth 8n" },
					{ "value": "16n", "text": "Sixteenth 16n" },

				],
				callback: value => { duration = value; }
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

		const instrumentOptions = [
			{ "value": "choir", "text": "Choir" },
			{ "value": "fmSynth", "text": "FMSynth" },
			{ "value": "toms", "text": "Toms" },
			{ "value": "bamboo", "text": "Bamboo" },
			{ "value": "strings", "text": "Strings" },
			{ "value": "flute", "text": "Flute" },
			{ "value": "guitar", "text": "Guitar" },
			{ "value": "piano", "text": "Piano" },
		];

		const instrumentsUI = new UISelectButton({
			label: 'Instruments',
			callback: addInstrument,
			"selected": "synth",
			"options": instrumentOptions
		});
		compositionPanel.add(new UILabel({ class: 'break' }));
		compositionPanel.add(instrumentsUI);
		instrumentRow = compositionPanel.addRow();

		const stackingRow = compositionPanel.addRow();
		// stacking -- instruments to use on loop n, n + 1 etc
		stackingRow.add(new UILabel({ text: "Stacking" }))
		stackRows = new UIRow({ class: 'break' });
		
		const stackIndex = new UINumberStep({
			min: 0,
			max: stacking.length - 1,
			value: stacking.length - 1,
		});
		
		const stackingUI = new UISelectButton({
			label: 'Stacking Instruments',
			"selected": "synth",
			options: instrumentOptions,
			callback: value => {
				let row;
				let index = stackIndex.value;
				if (stackRows.children.length === 0) {
					row = stackRows.add(new UIRow({ class: 'break' }));
					row.add(new UILabel({ text: 'Stack 0' }));
				} else {
					row = stackRows.children[index];
				}
				stacking[index].push(value);
				const v = new UICollection();
				v.add(new UILabel({ text: value }));
				v.add(new UIButton({
					text: 'x',
					callback: () => {
						row.remove(v);
						let i = stacking[index].indexOf(value);
						stacking[index].splice(i, 1);
					}
				}));
				row.add(v);
			}
		});

		const stackingSubtract = new UIButton({
			text: '–',
			class: 'left-end',
			callback: () => {
				if (stackRows.children.length === 0) return;
				stackRows.pop();
				stacking.pop();
				if (stackRows.children.length === 0) return;
				stackIndex.max = stackRows.children.length - 1;
				stackIndex.update(stackRows.children.length - 1);
			}
		});
		
		const stackingAdd = new UIButton({
			text: '+',
			class: 'right-end',
			callback: () => {
				let row = stackRows.add(new UIRow({ class: 'break' }));
				row.add(new UILabel({ text: 'Stack ' + (stackRows.children.length - 1) }));
				stackIndex.max = stackRows.children.length - 1
				stackIndex.update(stackRows.children.length - 1);
				stacking.push([]);
			}
		});

		stackingRow.add(stackIndex);
		stackingRow.add(stackingSubtract);
		stackingRow.add(stackingAdd);
		stackingRow.add(stackingUI);
		stackingRow.add(stackRows);
	}

	return { connect, load, get };
}