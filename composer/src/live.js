/*
	live loop mode
	choose what loops to keep, mod, kill
 */

import { whichKeyMap } from '../../../cool/cool.js';
import { UIPanel, UILabel, UIButton, UIElement } from '../../../oi/src/oi.js';
import { LoopStates } from '../../src/constants.js';

export class LivePanel extends UIPanel {
	constructor(doodoo, ui) {
		super({ id: "live", ui });

		this.doodoo = doodoo;
		this.loopControls = this.doodoo.loopControls;

		this.isActive = false;
		this.loopUI = [];

		this.loopControls[0] = LoopStates.KEEP;
		
		for (let i = 1; i < 10; i++) {
			this.loopControls[i] = LoopStates.KILL;
		}

		document.addEventListener("keydown", ev => {
			this.keyDown(ev);
		}, false);

		this.addButton({
			callback: () => {
				ui.panels.playback.play({ isLiveMode: true });
				this.isActive = true;
			},
			text: "play",
			key: 'z',
		});

		for (let i = 0; i < this.loopControls.length; i++) {
			this.addRow();
			this.add(new UILabel({ text: `loop ${i}` }));
			this.loopUI[i] = this.add(new UILabel({
				text: this.getLoopState(this.loopControls[i]),
			}));
		}

		this.doodoo.onStop = () => {
			this.isActive = false;
		};
	}

	/* keys */
	keyDown(ev) {
		if (!this.isActive) return;
		let k = whichKeyMap[ev.which];
		if (!Number.isFinite(+k)) return;
		this.loopControls[+k] = (this.loopControls[+k] + 1) % 3; // cycle loop controls
		this.doodoo.updateLive();
		this.updateLoopUI();
	}

	updateLoopUI() {
		for (let i = 0; i < this.loopControls.length; i++) {
			this.loopUI[i].setText(this.getLoopState(this.loopControls[i]));
		}
	}

	getLoopState(n) {
		if (n === 0) return 'X';
		if (n === 1) return 'M';
		if (n === 2) return 'K';
	}
}