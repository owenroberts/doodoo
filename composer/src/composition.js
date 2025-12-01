import { getDate } from '../../../cool/cool.js';
import { MIDI_NOTES, getMIDINote } from '../../src/midi.js';
import { defaults } from '../../src/defaults.js';
import { UILabel, UIList, UINumberStep, UISelect, UIPanel } from '../../../ui/src/oi.js';

/**
 * edit composition level params for doodoo
 * tonic, transpose, bpm, useOctve, harmonyScaleOnly, isRegularTime, timeBar, timeBeat, scale
 * title?
 */
export class CompositionPanel extends UIPanel {

	constructor(app) {
		super({ id: 'composition', ui: app.ui });

		this.doodoo = app.doodoo;
		
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
			// label: 'Notes in key',
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
		});
	}

	load(data) {
		for (const k in data) {
			// console.log(k);
			if (this.children[k]) {
				// console.log(k, data[k], this.children[k].update);
				this.children[k].update(data[k]);
			}
		}
	}
}