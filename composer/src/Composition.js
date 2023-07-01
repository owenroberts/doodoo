/*
	keep track of composition data to feed to doodoo
*/

function Composition(app, defaults) {

	/* comp props */
	let title = defaults.title;
	let tonic = defaults.tonic;
	let duration = defaults.duration;
	let bpm = defaults.bpm;
	let transform = defaults.transform || defaults.tonic;
	let scale = defaults.scale;
	let useOctave = defaults.useOctave || false;
	let voices = []; // no default ??
	
	/* ui settings */	
	let scaleRow, scaleUI, voiceRow;

	function getMIDINote(noteIndex) {
		return MIDI_NOTES[noteIndex];
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

	function get() {
		app.melody.update();
		const parts = app.melody.getParts();
		const sequence = app.melody.getSequence();
		// console.log('get sequence', sequence);
		return { tonic, transform, bpm, voices, title, duration, scale, useOctave, sequence, parts };
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
				{ "value": "guitar", "text": "Guitar" },
				{ "value": "piano", "text": "Piano" },
			]
		});
		compositionPanel.add(new UILabel({ class: 'break' }));
		compositionPanel.add(voicesUI);
		voiceRow = compositionPanel.addRow();

		
	}

	return { connect, load, get };
}