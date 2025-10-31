/*
	playback controls 
*/

import * as Tone from 'tone';
import { Doodoo } from '../../src/Doodoo.js';
import { Elements } from '../../../ui/src/UI.js';
const { UILabel } = Elements;

export function Playback(app) {
	let doodoo;
	let useMetro = false;
	let modCountUI;
	let saveOnPlay = true;

	function play(withRecording, withCount, noMods) {
		const comp = app.composition.get() ?? {};
		if (comp.parts.every(p => p.length === 0)) {
			return alert('Add notes to the melody.');
		}

		if (doodoo) {
			doodoo.stop();
			Tone.Transport.cancel();
		}

		doodoo = new Doodoo({
			...comp,
			withRecording: withRecording,
			withCount: withCount,
			noMods: noMods,
			onModulate: count => {
				modCountUI.text = 'Modulation: ' + count;
				app.score.update(doodoo.getVoices());
				if (count < withCount || withCount === undefined) { // prevent logging next play after stop
					app.monitor.update(doodoo.getVoices());
				}
			},
			useMetro: useMetro,
			useMeter: app.meter.isOpen(),
			setMeter: app.meter.setMeter,
			mods: app.modulators.getMods(),
			partMods: app.modulators.getPartMods(),
			startLoops: app.startLoops.get(),
			useDefaultProps: true,
		});
		// setting?
		if (saveOnPlay) app.fio.saveLocal(false);
		app.score.update(doodoo.getVoices());
	}

	function isRecording() {
		if (!doodoo) return false;
		return doodoo.isRecording();
	}

	function connect() {
		const playBackPanel = app.ui.getPanel('playback', { label: 'Play Back' });

		app.ui.addCallbacks([
			{ callback: play, key: '/', text: 'Play' },
			{ 
				key: '.', 
				text: 'Play Once',
				callback: () => { play(false, 1); }, 
			},
			{ 
				key: ',', 
				text: 'Stop',
				callback: () => { if (doodoo) doodoo.stop(); }, 
			},
			{ callback: play, key: 'r', text: 'Record', args: [true] },
			{
				key: 'shift-/', text: 'Play wo Mods',
				callback: () => { play(false, false, true); }, 
			},
			{ 
				key: 'd', 
				text: 'Mutate',
				callback: () => { if (doodoo) doodoo.modulate(); },
			}
		], playBackPanel);

		modCountUI = playBackPanel.add(new UILabel({
			id: 'modulation-count',
			text: 'Modulation 0',
		}));

		app.ui.addProps({
			'useMetro': {
				type: 'UIToggleCheck',
				value: useMetro,
				label: 'Metro',
				key: 'm',
				callback: value => { useMetro = value; },
			},
			"saveOnPlay": {
				type: "UIToggleCheck",
				value: saveOnPlay,
				label: "Save on play",
				callback: value => { saveOnPlay = value; },
			}
		}, playBackPanel);

		app.ui.addCallback({
			row: true,
			callback() {
				if (!doodoo) return;
				doodoo.printVoices();
			},
			text: 'Print Voices',
			key: 'p',
		});

		app.ui.addCallback({
			callback() {
				if (!doodoo) return;
				doodoo.printParams();
			},
			text: 'Print Params',
			key: 'shift-p',
		});
	}

	return { connect, isRecording };
}