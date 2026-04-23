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
		this.partIndex = 0;
		this.loopControls = this.doodoo.loopControls;

		this.isActive = false;
		this.loopUI = [];

		for (let i = 0; i < this.loopControls.length; i++) {
			this.loopControls[i][0] = LoopStates.KEEP;
			for (let j = 1; j < 10; j++) {
				this.loopControls[i][j] = LoopStates.KILL;
			}
		}
		
		document.addEventListener("keydown", ev => {
			this.keyDown(ev);
		}, false);

		this.addButton({
			callback: () => {
				ui.panels.playback.play({ isLiveMode: true });
				this.isActive = true;
			},
			text: "play live",
			key: "shift-/",
		});

		const partIndexRef = this.addRef({
			obj: this,
			ref: 'partIndex',
			key: '`',
			keyHandler: index => {
				this.partIndex += 1;
				if (this.partIndex === -1) {
					partIndexRef.update(this.doodoo.comp.parts.length - 1);
				}
				else if (this.partIndex >= this.doodoo.comp.parts.length) {
					partIndexRef.update(0);
				}
				else {
					partIndexRef.update(this.partIndex, true);
				}
				// add asterisk to index
			},
		});

		this.addBreak();

		const table = this.add(new UIElement({ tag: "table", id: "live-table" }));
		this.thead = table.add(new UIElement({ tag: "thead" }));
		this.tbody = table.add(new UIElement({ tag: "tbody" }));

		this.doodoo.onStop = () => {
			this.isActive = false;
		};
	}

	load() {
		this.loopControls = this.doodoo.loopControls; // reactivate ref

		for (let i = 0; i < this.loopControls.length; i++) {
			this.loopControls[i][0] = LoopStates.KEEP;
			for (let k = 1; k < 10; k++) {
				this.loopControls[i][k] = LoopStates.KILL;
			}
		}

		this.loopUI = Array.from({ length: this.loopControls.length }, () => []);

		this.thead.clear();
		this.tbody.clear();

		const thr = this.thead.add(new UIElement({ tag: "tr"}));
		thr.add(new UIElement({ tag: "th", text: "loop" }));

		for (let i = 0; i < this.loopControls.length; i++) {
			thr.add(new UIElement({ tag: "th", text: i }));
		}

		for (let k = 0; k < 10; k++) {
			const tr = this.tbody.add(new UIElement({ tag: "tr" }));
			tr.add(new UIElement({ tag: "td", text: k }));
			
			for (let i = 0; i < this.loopControls.length; i++) {
				this.loopUI[i][k] = tr.add(new UIElement({ 
					tag: "td", 
					text: this.getLoopState(this.loopControls[i][k]),
				}));
			}
		}
	}

	/* keys */
	keyDown(ev) {
		if (!this.isActive) return;
		let k = whichKeyMap[ev.which];
		if (!Number.isFinite(+k)) return;

		const val = this.loopControls[this.partIndex][+k];
		this.loopControls[this.partIndex][+k] = (val + 1) % 3; // cycle loop controls
		this.doodoo.updateLive();
		this.updateLoopUI();
	}

	updateLoopUI() {
		for (let i = 0; i < this.loopControls.length; i++) {
			for (let k = 0; k < 10; k++) {
				const val = this.getLoopState(this.loopControls[i][k]);
				this.loopUI[i][k].setText(val);
			}
		}
	}

	getLoopState(n) {
		if (n === 0) return 'X';
		if (n === 1) return 'M';
		if (n === 2) return 'K';
	}
}