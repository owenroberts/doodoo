import * as Tone from 'tone';
import { UIPanel, UILabel, UIModal, UIButton, UIElement } from '@b/oi';

/**
 * play, stop, etc.
 * metronome?
 */
export class PlaybackPanel extends UIPanel {
	
	constructor(doodoo, ui) {
		super({ id: 'playback', ui });
		
		this.doodoo = doodoo;
		this.isSaveOnPlay = false;

		this.add(new UILabel({ text: 'loop' }));
		const loopCountDisplay = this.add(new UILabel({
			id: 'loop-count',
			text: '0',
		}));

		this.addButton({
			callback: () => { this.play({ loopsInPlay: false, }); },
			key: "/",
			text: "play",
		});

		this.addButton({ 
			callback: () => { 
				this.play({ withRecording: false, loopsInPlay: 1 }); 
			}, 
			key: '.', 
			text: 'play 1',
		});

		this.addButton({ 
			key: 'c',
			text: 'play n', 
			callback: () => { 
				this.play({ 
					withRecording: false, 
					loopsInPlay: +prompt("loop count?", 10) 
				}); 
			},
		});

		this.addButton({ 
			key: ',', 
			text: 'stop',
			callback: () => { this.doodoo.stop(); }, 
		});

		this.addButton({ 
			key: 'shift-,', 
			text: 'stop next',
			callback: () => { this.doodoo.stopNext(); }, 
		});

		this.addButton({ 
			key: 'r', 
			text: 'record', 
			callback: () => { this.play({ withRecording: true }) },
		});

		this.addButton({
			key: 'x',
			text: "replay",
			callback: () => {
				this.playReplay();
			}
		});

		this.addBreak();

		this.addRef({
			obj: this.doodoo.config,
			ref: "isMetronomeOn",
		});

		this.addRef({
			obj: this.doodoo.config,
			ref: "metroInterval",
			ignoreSettings: true,
		});

		this.addRef({
			obj: this,
			ref: "isSaveOnPlay",
		});

		this.addRef({
			obj: this.doodoo.config,
			ref: "isSaveReplay",
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

		this.addButton({
			key: "shift-c",
			text: "log config",
			callback: () => {
				this.doodoo.printConfig();
			}
		});

		this.doodoo.events.onLoop = loopCount => {
			loopCountDisplay.setText(loopCount);
			ui.panels.monitor.update(this.doodoo.voices, this.doodoo.comp);
		};
	}

	play({ withRecording=false, loopsInPlay=false, localReplay, isLiveMode=false }={}) {

		if (this.doodoo.isPlaying) {
			this.doodoo.stop();
			Tone.Transport.cancel();
		}

		this.doodoo.reset();

		this.doodoo.config.withRecording = withRecording;
		// this.doodoo.instruments.withRecording = withRecording; // fuck *** 
		if (withRecording) {
			this.doodoo.config.loopsInPlay = +prompt("record number of loops?", 12);
		} else {
			this.doodoo.config.loopsInPlay = loopsInPlay;
		}
		this.doodoo.config.isLiveMode = isLiveMode;

		if (localReplay) {
			this.doodoo.replay.load(localReplay);
			this.doodoo.config.isReplay = true;
		} else {
			if (this.doodoo.comp.parts.every(p => p.length === 0)) {
				return alert('Add notes to the melody.');
			}
			this.doodoo.config.isReplay = false;
		}

		// this.doodoo.setup(); // resets parts
		this.doodoo.play();

		if (this.isSaveOnPlay) {
			this.ui.panels.files.saveLocal(false);
		}
	}

	playReplay(withRecording) {
		const m = new UIModal({
			ui: this.ui,
			title: "saved replays",
		});

		const savedReplays = Object.keys(localStorage)
			.filter(k => k.includes('greg-replay'));

		savedReplays.forEach(title => {
			m.add(new UIButton({
				text: title.replace('greg-', ''),
				callback: () => {
					const replay = JSON.parse(localStorage.getItem(title));
					
					this.play({ withRecording, localReplay: replay });
					m.clear();
				}
			}));
			m.add(new UIButton({
				text: "x",
				callback: () => {
					localStorage.removeItem(title);
					m.clear();
				}
			}))
			m.addBreak();
		});
	}
}