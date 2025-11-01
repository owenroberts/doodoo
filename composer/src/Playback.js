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
	let isSavePerformance = false;

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
			withRecording,
			withCount,
			noMods,
			onModulate: count => {
				modCountUI.text = count;
				app.score.update(doodoo.getVoices());
				if (count < withCount || withCount === undefined) { // prevent logging next play after stop
					app.monitor.update(doodoo.getVoices());
				}
			},
			useMetro,
			useMeter: app.meter.isOpen(),
			setMeter: app.meter.setMeter,
			mods: app.modulators.getMods(),
			partMods: app.modulators.getPartMods(),
			startLoops: app.startLoops.get(),
			useDefaultProps: true,
			isSavePerformance,
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
			{ 
				key: 'r', 
				text: 'Record', 
				callback: () => { play(true) },
			},
			{ 
				key: 'c',
				text: 'Play count', 
				callback: () => { play(false, +prompt('Loop count?', 10)) },
			},
			// {
			// 	key: 'shift-/', text: 'Play wo Mods',
			// 	callback: () => { play(false, false, true); }, 
			// },
			{ 
				key: 'd', 
				text: 'Mutate',
				callback: () => { if (doodoo) doodoo.modulate(); },
			}
		], playBackPanel);

		playBackPanel.add(new UILabel({ text: 'Loop' }));
		modCountUI = playBackPanel.add(new UILabel({
			id: 'loop-count',
			text: '0',
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
			},
			"isSavePerformance": {
				type: "UIToggleCheck",
				value: isSavePerformance,
				label: "Save performance",
				callback: value => { isSavePerformance = value; },
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