import { getDate } from '@b/cool';
import { MIDI_NOTES, getMIDINote } from '@b/doodoo/src/midi.js';
import { defaults } from '@b/doodoo/src/defaults.js';
import { UILabel, UIList, UINumberStep, UISelect, UIPanel } from '@b/oi';

/**
 * edit composition level params for doodoo
 * tonic, transpose, bpm, useOctve, isScaleNotesOnly, isRegularTime, bar, beat, scale
 * title?
 */
export class CompositionPanel extends UIPanel {

	constructor(doodoo, ui) {
		super({ id: "composition", ui });

		this.doodoo = doodoo;

		this.addButton({
			text: "log",
			callback: () => {
				console.log(JSON.stringify(this.doodoo.comp));
				console.log(this.doodoo.comp);
			}
		});
		
		this.addRef({
			obj: this.doodoo.comp, 
			ref: "tonic",
			options: [...MIDI_NOTES],
		});
		
		this.addRef({
			obj: this.doodoo.comp,
			ref: "transpose",
			options: [...MIDI_NOTES],
		});

		this.addRef({
			obj: this.doodoo.comp,
			ref: "bpm",
			range: [10, 300],
		});

		this.addRef({
			obj: this.doodoo.comp,
			ref: "useOctave",
		});

		this.addRef({
			obj: this.doodoo.comp,
			ref: "isScaleNotesOnly",
		});
		
		this.addRef({
			obj: this.doodoo.comp,
			ref: "isRegularTime",
		});
		
		this.addRef({
			obj: this.doodoo.comp,
			ref: "bar",
		});

		this.addRef({
			obj: this.doodoo.comp,
			ref: "beat",
			options: ['1n', '2n', '4n', '8n', '16n'],
		});

		this.addRef({
			obj: this.doodoo.comp,
			ref: "scale",
			itemClass: UINumberStep,
		});
	}

	load() {
		for (const k in this.doodoo.comp) {
			if (this.children[k]) {
				this.children[k].update(this.doodoo.comp[k]);
			}
		}
	}
}