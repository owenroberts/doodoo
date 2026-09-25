import * as Tone from 'tone';
import { getDate } from '@b/cool';

export class PerformanceManager {

	constructor(doodoo) {
		this.doodoo = doodoo;
		this.reset();
	}

	reset() {
		this.loopIndex = 0;
		this.active = {
			loops: [],
			date: getDate(),
		};
	}

	addLoop(loop) {
		this.active.loops.push(loop);
	}

	getNextLoop() {
		if (this.loopIndex >= this.active.loops.length) {
			Tone.getTransport().stop();
			this.doodoo.isPlaying = false;
			this.doodoo.saveRecording();
			return;
		}
		
		this.doodoo.beatCounter = 0;
		this.doodoo.instruments.dispose();
		
		const loop = structuredClone(this.active.loops[this.loopIndex]); 
		this.doodoo.voices = loop.voices;
		this.doodoo.beatCount = loop.beatCount;
		this.doodoo.toneLoop.interval = loop.interval;
		this.doodoo.loopCount++;

		this.doodoo.addInstruments();

		if (Tone.getTransport().state === 'stopped') {
			Tone.getTransport().start();
		}

		if (this.doodoo.events.onLoop) {
			this.doodoo.events.onLoop(this.doodoo.loopCount);
		}

		if (this.doodoo.events.onMod) {
			this.doodoo.events.onMod(this.doodoo.loopCount, this.doodoo.loopCount / this.active.loops.length);
		}

		this.loopIndex++;
	}

	load(data) {

		console.log('data', data);

		this.reset();
		this.active = structuredClone(data);

		console.log('active', this.active);

		const list = [
			...this.active.loops
				.flatMap(l => l.voices)
				.flatMap(v => v.instrument)
		];
		this.doodoo.setupSampleList(list);
	}

	save() {
		if (!this.doodoo.config.isSavePerformance) return;
		console.log('save perf')
		
		// dont need this anymore ... 
		this.active.loops.forEach(loop => {
			loop.voices.forEach(voice => {
				voice.counter = 0;
				delete voice.toneInstrument;
			});
		});

		let perf = JSON.stringify(this.active);

		console.log('perf', perf);

		let title = prompt("name performance", "name");
		localStorage.setItem('greg-perf-' + title, perf);
		const blob = new Blob([perf], { type: 'application/x-download;charset=utf-8' });
		saveAs(blob, title + '.json');
	}

}