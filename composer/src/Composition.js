/*
	keep track of composition data to feed to doodoo
	these are constant values that can't be modded
*/

import { getDate } from '../../../cool/cool.js';
import { MIDI_NOTES, getMIDINote } from '../../src/midi.js';
import { defaults } from '../../src/defaults.js';
import { UILabel, UIList, UINumberStep, UISelect, UIPanel } from '../../../ui/src/UI.js';

export class CompositionPanel extends UIPanel {

		constructor(app) {
			super({ id: 'composition', ui: app.ui });
			this.ui = app.ui;
			this.doodoo = app.doodoo;
			this.title = 'doodoo-' + getDate();
	
			/* ui settings */	
			let scaleRow, scaleUI;
			let stackRows;

			this.addRef({ obj: this, ref: "title", });
			this.addRef({
				obj: this.doodoo.comp, 
				ref: 'tonic', 
				options: [...MIDI_NOTES],
				class: 'note-edit',
				type: 'UIInputStep', // guess later
			});
			this.addRef({
				obj: this.doodoo.comp,
				ref: 'transpose',
				options: [...MIDI_NOTES],
				class: 'note-edit',
				type: 'UIInputStep', 
			});

			this.addRef({
				obj: this.doodoo.comp,
				ref: 'bpm',
				range: [10, 300],
				type: 'UINumberStep',
			});

			this.addRef({
				obj: this.doodoo.comp,
				ref: 'useOctave', 
				// label: 'Multiple octaves',
			});

			this.addRef({
				obj: this.doodoo.comp,
				ref: 'harmonyScaleOnly', 
				label: 'Notes in key',
			});
			
			this.addRef({
				obj: this.doodoo.comp,
				ref: 'isRegularTime', 
				// label: 'Regular time',
			});
			

			this.addRef({
				obj: this.doodoo.comp,
				ref: 'timeBar', 
				// label: 'Bar',
			});

			this.addRef({
				obj: this.doodoo.comp,
				ref: 'timeBeat', 
				// label: 'Beat',
				type: 'UISelect',
				options: ['1n', '2n', '4n', '8n', '16n'],
			});

			this.addRef({
				obj: this.doodoo.comp,
				ref: 'scale',
				itemClass: UINumberStep,
			})
		}

		load(data) {
			console.log({ data });

			return;

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

	

}