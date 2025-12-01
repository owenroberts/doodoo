/*
	live loop mode
	choose what loops to keep, mod, kill
 */

import { whichKeyMap } from '../../../cool/cool.js';
import { UILabel, UIButton, UIElement } from '../../../ui/src/oi.js';

const LoopStates = {
	KILL: 0,
	MOD: 1,
	KEEP: 2,
};

function getLoopState(n) {
	if (n === 0) return 'X';
	if (n === 1) return 'M';
	if (n === 2) return 'K';
}

export function Live(app) {

	let isActive = false;
	let loopUI = [];
	let loopControls = [];
	for (let i = 0; i < 10; i++) {
		loopControls[i] = LoopStates.KILL;
	}
	loopControls[0] = LoopStates.KEEP;

	/* keys */
	function keyDown(ev) {
		// if (!isActive) return;	
		let k = whichKeyMap[ev.which];
		if (!Number.isFinite(+k)) return;
		loopControls[+k] = (loopControls[+k] + 1) % 3; // cycle loop controls
		app.playback.updateLive(loopControls);
		updateLoopUI();
	}
	document.addEventListener("keydown", keyDown, false);

	function updateLoopUI() {
		for (let i = 0; i < loopControls.length; i++) {
			loopUI[i].setText(getLoopState(loopControls[i]));
		}
	}

	function connect() {
		const livePanel = app.ui.getPanel("live");
		
		app.ui.addCallback({
			callback: () => {
				app.playback.play({ isLiveMode: true, loopControls });
				isActive = true;
			},
			text: "Play",
			key: 'z',
		}, "live");

		for (let i = 0; i < loopControls.length; i++) {
			livePanel.addRow();
			livePanel.add(new UILabel({ text: `Loop ${i}` }));
			loopUI[i] = livePanel.add(new UILabel({
				text: getLoopState(loopControls[i]),
			}));
		}
	}

	function off() {
		isActive = false;
	}

	return { connect, off };
}