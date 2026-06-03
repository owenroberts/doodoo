import * as Tone from 'tone';
import { whichKeyMap } from '@b/cool';
import { UIPanel, UILabel, UIButton, UIElement, UIModal, UIText } from '../../../oi/src/oi.js';

export class SamplerPanel extends UIPanel {
	constructor(doodoo, ui, fm) {
		super({ id: "sampler", ui });

		this.ui = ui;
		this.fm = fm;
		this.isLoaded = false;
		this.keyMap = {};

		document.addEventListener("keydown", ev => {
			this.keyDown(ev);
		}, false);

		this.addButton({
			text: "add sample",
			callback: () => {
				const m = new UIModal({
					ui,
					callback: () => {
						this.fm.data.samples[name.value] = { key: key.value, src: src.value };
					}
				});

				const name = m.add(new UIText({
					placeholder: "name",
				})); 

				const key = m.add(new UIText({
					placeholder: "key",
				}));

				const src = m.add(new UIText({
					placeholder: "src",
				}));
			},
		});

		this.addBreak();
	}

	load() {

		const urls = {};
		for (const k in this.fm.data.samples) {
			const { key, src } = this.fm.data.samples[k];
			urls[k] = `/${src}`;
			this.keyMap[key] = k;

			this.addLabel(key);
			this.addLabel(src);
			this.addBreak();
		}

		this.sampler = new Tone.Players(urls, () => {
			console.log("sampler loaded");
			this.isLoaded = true;
		}).toDestination();
	}

	async keyDown(ev) {
		if (!this.isLoaded) return;
		if (ev.ctrlKey) return;
		if (ev.shiftKey) return;
		if (ev.altKey) return;
		
		let k = whichKeyMap[ev.which];
		const sample = this.keyMap[k];

  		if (sample) {
  			if (Tone.context.state !== 'running') {
   				await Tone.start();
  			}

    		const player = this.sampler.player(sample);
    		
		    if (player.state === "started") {
				player.stop();
			} else {
				player.start();
			}
		}
	}
}