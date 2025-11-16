/*
	playback controls 
*/

import * as Tone from 'tone';
import { Doodoo } from '../../src/doodoo.js';
import { Elements } from '../../../ui/src/UI.js';
const { UILabel, UIModal, UIButton, UIElement } = Elements;

export function Playback(app) {

	let doodoo;
	let useMetro = false;
	let modCountUI;
	let saveOnPlay = true;
	let isSavePerformance = false;

	function updateLive(loopControls) {
		if (!doodoo) return;
		doodoo.updateLive(loopControls);
	}

	function play({ withRecording=false, withCount=false, localPerformance, isLiveMode=false, loopControls }={}) {

		if (doodoo) {
			doodoo.stop();
			Tone.Transport.cancel();
		}

		const doodooParams = {
			withRecording,
			withCount,
			// noMods,
			isLiveMode,
			loopControls,
			onMod: loopCount => {
				modCountUI.text = loopCount;
				app.score.update(doodoo.voices);
				app.monitor.update(doodoo.voices, doodoo.comp);
			},
			onStop: () => {
				app.live.off();
			},
			useMetro,
			useMeter: app.meter.isOpen(),
			updateMeter: app.meter.updateMeter,
		};

		if (localPerformance) {
			doodooParams.performance = localPerformance;
			doodooParams.isPerformance = true;
		} else {
			const comp = app.composition.get() ?? {};
			if (comp.parts.every(p => p.length === 0)) {
				return alert('Add notes to the melody.');
			}

			Object.assign(doodooParams, { ...comp });
			doodooParams.mods = app.modulators.getMods();
			doodooParams.partMods = app.modulators.getPartMods();
			doodooParams.startLoops = app.startLoops.get();
			doodooParams.useDefaultProps = true;
			doodooParams.isSavePerformance = isSavePerformance;
			doodooParams.isPerformance = false;
		}

		doodoo = new Doodoo(doodooParams);
		// setting?
		if (saveOnPlay) app.fio.saveLocal(false);
		app.score.update(doodoo.voices);
	}

	function playPerformance(withRecording) {
		const m = new UIModal({
			app: app,
			title: "Saved performances",
			position: [200, 120],
		});

		const savedPerformances = Object.keys(localStorage)
			.filter(k => k.includes('greg-perf'));

		savedPerformances.forEach(title => {
			m.add(new UIButton({
				text: title.replace('greg-', ''),
				callback: () => {
					const perf = JSON.parse(localStorage.getItem(title));
					play({ withRecording, localPerformance: perf }); 
					m.clear();
				}
			}));
			m.addBreak();
		});
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
				callback: () => { play({ withRecording: false, withCount: 1 }); }, 
			},
			{ 
				key: ',', 
				text: 'Stop',
				callback: () => { if (doodoo) doodoo.stop(); }, 
			},
			{ 
				key: 'shift-,', 
				text: 'Stop next',
				callback: () => { if (doodoo) doodoo.stopNext(); }, 
			},
			{ 
				key: 'r', 
				text: 'Record', 
				callback: () => { play({ withRecording: true }) },
			},
			{ 
				key: 'c',
				text: 'Play count', 
				callback: () => { 
					play({ 
						withRecording: false, 
						withCount: +prompt('Loop count?', 10) 
					}); 
				},
			},
			// {
			// 	key: 'shift-/', text: 'Play wo Mods',
			// 	callback: () => { play(false, false, true); }, 
			// },
			// { 
			// 	key: 'd', 
			// 	text: 'Mutate',
			// 	callback: () => { if (doodoo) doodoo.modulate(); },
			// },
			{
				key: 'x',
				text: "Play performance",
				callback: playPerformance,
			},
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
		}, playBackPanel);

		playBackPanel.addBreak();

		app.ui.addProps({
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

	return { connect, play, updateLive, isRecording };
}