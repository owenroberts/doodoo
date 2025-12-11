import * as Tone from 'tone';
import { Doodoo } from '../../src/doodoo.js';
import { UIPanel, UILabel, UIModal, UIButton, UIElement } from '../../../oi/src/oi.js';

/**
 * play, stop, etc.
 * metronome?
 */
export class PlaybackPanel extends UIPanel {
	
	constructor(doodoo, ui) {
		super({ id: 'playback', ui });
		
		this.doodoo = doodoo;
		this.isSaveOnPlay = false;

		this.add(new UILabel({ text: 'Loop' }));
		const loopCountDisplay = this.add(new UILabel({
			id: 'loop-count',
			text: '0',
		}));

		this.addButton({
			callback: () => { this.play({ withCount: false, }); },
			key: "/",
			text: "Play",
		});

		this.addButton({ 
			callback: () => { 
				this.play({ withRecording: false, withCount: 1 }); 
			}, 
			key: '.', 
			text: 'Play 1',
		});

		this.addButton({ 
			key: 'c',
			text: 'Play N', 
			callback: () => { 
				this.play({ 
					withRecording: false, 
					withCount: +prompt('Loop count?', 10) 
				}); 
			},
		});

		this.addButton({ 
			key: ',', 
			text: 'Stop',
			callback: () => { this.doodoo.stop(); }, 
		});

		this.addButton({ 
			key: 'shift-,', 
			text: 'Stop next',
			callback: () => { this.doodoo.stopNext(); }, 
		});

		this.addButton({ 
			key: 'r', 
			text: 'Record', 
			callback: () => { this.play({ withRecording: true }) },
		});

		this.addButton({
			key: 'x',
			text: "Play performance",
			callback: () => {
				this.playPerformance();
			}
		});

		this.addBreak();

		this.addRef({
			obj: this.doodoo,
			ref: "metroCount",
			ignoreSettings: true,
		});

		this.addRef({
			obj: this.doodoo.config,
			ref: "isMetronomeOn",
		});

		this.addRef({
			obj: this,
			ref: "isSaveOnPlay",
		});

		this.addRef({
			obj: this.doodoo.config,
			ref: "isSavePerformance",
		});

		this.addBreak();

		this.addButton({
			key: "p",
			text: "log voices",
			callback: () => {
				this.doodoo.printVoices();
			}
		});

		this.addButton({
			key: "shift-p",
			text: "log params",
			callback: () => {
				this.doodoo.printParams();
			}
		});

		this.doodoo.config.onMod = loopCount => {
			loopCountDisplay.setText(loopCount);
			ui.panels.monitor.update(this.doodoo.voices, this.doodoo.comp);
		};

		
	}

	play({ withRecording=false, withCount=false, localPerformance, isLiveMode=false }={}) {

		if (this.doodoo.isPlaying) {
			this.doodoo.stop();
			Tone.Transport.cancel();
		}

		this.doodoo.reset();
		this.doodoo.config.withRecording = withRecording;
		this.doodoo.config.withCount = withCount;
		this.doodoo.config.isLiveMode = isLiveMode;

		if (localPerformance) {
			this.doodoo.performance = localPerformance;
			this.doodoo.config.isPerformance = true;
		} else {
			if (this.doodoo.comp.parts.every(p => p.length === 0)) {
				return alert('Add notes to the melody.');
			}
			this.doodoo.config.isPerformance = false;
		}

		this.doodoo.setup(); // resets parts
		this.doodoo.play();
		if (this.isSaveOnPlay) {
			this.ui.panels.files.saveLocal(false);
		}
	}

	playPerformance(withRecording) {
		const m = new UIModal({
			app: this.app,
			title: "Saved performances",
		});

		const savedPerformances = Object.keys(localStorage)
			.filter(k => k.includes('greg-perf'));

		savedPerformances.forEach(title => {
			m.add(new UIButton({
				text: title.replace('greg-', ''),
				callback: () => {
					const perf = JSON.parse(localStorage.getItem(title));
					this.play({ withRecording, localPerformance: perf }); 
					m.clear();
				}
			}));
			m.addBreak();
		});
	}
}