// simple version of setting up doodoo player
// can also load directly into doodoo download file and adding to doodoo params .. 

import { Doodoo } from './doodoo.js';
import { DoodooFiles } from './doodoo-files.js';	

window.addEventListener("load", function() {
	
	const doodoo = new Doodoo({ 
		autoLoad: false,
		autoPlay: false,
		samplesURL: './samples/'
	});
	const fm = new DoodooFiles(doodoo);

	const compSelect = document.getElementById("comp-select");
	const playBtn = document.getElementById("play");
	const stopBtn = document.getElementById("stop");
	const loopCountInput = document.getElementById("loop-count");

	playBtn.addEventListener("click", () => {
		play();
	});

	stopBtn.addEventListener("click", () => {
		doodoo.stop();
	});

	async function play() {
		const url = `./compositions/${compSelect.value}`;
		const res = await fetch(url);
		const json = await res.json();
		fm.load(json);
		doodoo.config.withCount = +loopCountInput.value;
		doodoo.setup();
		doodoo.play();
	}
});

