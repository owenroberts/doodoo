/*
	keep track of composition data to feed to doodoo
	these are constant values that can't be modded
*/

import { MIDI_NOTES } from '../../src/Midi.js';
// import '../../build/ui.min.js'; // skip UI for now ... 
// const { UILabel, UINumberList } = UI.Elements;
import { Elements } from '../../../ui/src/UI.js';
const { UILabel, UINumberList, UISelect } = Elements;

export function Composition(app, defaults) {

	/* comp props */
	let title = defaults.title;
	let tonic = defaults.tonic;
	// only really matters if melody has no beats or default is lower than beats in mel
	let bpm = defaults.bpm;
	let transpose = defaults.transpose ?? defaults.tonic;
	let scale = defaults.scale;
	let useOctave = defaults.useOctave ?? false;
	let harmonyScaleOnly = defaults.harmonyScaleOnly ?? true;
	
	let isRegularTime = defaults.isRegularTime ?? false;
	let timeBeat = '4n';
	let timeBar = 4;
	
	/* ui settings */	
	let scaleRow, scaleUI;
	let stackRows;

	function getMIDINote(noteIndex) {
		return MIDI_NOTES[noteIndex];
	}

	function get() {
		app.melody.update();
		const parts = app.melody.getParts();
		const sequence = app.melody.getSequence();
		return { tonic, transpose, bpm, title, scale, useOctave, harmonyScaleOnly, sequence, parts, isRegularTime, timeBeat, timeBar };
	}

	function load(data) {
		if (data.title) app.ui.faces.title.update(data.title);
		if (data.transpose) app.ui.faces.transpose.update(data.transpose);
		if (data.bpm) app.ui.faces.bpm.update(data.bpm);
		if (data.useOctave) app.ui.faces.useOctave.update(data.useOctave);
		if (data.isRegularTime) app.ui.faces.isRegularTime.update(data.isRegularTime);
		if (data.timeBeat) app.ui.faces.timeBeat.update(data.timeBeat);
		if (data.timeBar) app.ui.faces.timeBar.update(data.timeBar);
		
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
			'transpose': {
				type: 'UIListStep',
				value: transpose,
				label: 'Transpose',
				class: 'note-edit',
				list: [...MIDI_NOTES, 'null', 'rest'],
				callback: value => { transpose = value; }
			},
			'bpm': {
				value: bpm,
				label: 'BPM',
				type: 'UINumberStep',
				range: [10, 300],
				callback: value => { bpm = value;}
			},
			'isRegularTime': {
				value: isRegularTime,
				label: 'Regular Time',
				type: 'UIToggleCheck',
				callback: value => { isRegularTime = value; },
			},
			'timeBar': {
				value: timeBar,
				label: 'Bar',
				type: 'UINumberStep',
				callback: value => { timeBeat = value; },								
			},
			'timeBeat': {
				value: timeBeat,
				label: 'Beat',
				type: 'UISelect',
				options: ['1n', '2n', '4n', '8n', '16n'],
				callback: value => { timeBeat = value; },								
			},
			'useOctave': {
				type: 'UIToggleCheck',
				label: 'Use Octave',
				value: useOctave,
				callback: value => { useOctave = value; }
			},
			'harmonyScaleOnly': {
				type: 'UIToggleCheck',
				label: 'Harmony Scale Only',
				value: harmonyScaleOnly,
				callback: value => { harmonyScaleOnly = value; }
			}
		}, compositionPanel);

		compositionPanel.addRow(undefined, 'break');
		compositionPanel.add(new UILabel({ text: 'Scale Intervals' }));
		scaleRow = compositionPanel.addRow(undefined, 'break');
		scaleUI = new UINumberList({
			list: scale,
			callback: value => { scale = value; }
		});
		compositionPanel.add(scaleUI);
	}

	return { connect, load, get };
}