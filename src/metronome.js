import * as Tone from 'tone';

export class Metronome {

	constructor(doodoo) {

		this.doodoo = doodoo;

		this.isActive = this.doodoo.config.isMetronomeOn;
		this.interval = this.doodoo.config.metroInterval;
	}

	reset() {
		this.isActive = this.doodoo.config.isMetronomeOn;
		this.interval = this.doodoo.config.metroInterval;

		if (this.isActive && !this.synth) {
			this.setup();
		}

		if (!this.isActive && this.synth) {
			this.synth.dispose();
			this.synth = undefined;
		}
	}

	setup() {
		if (!this.isActive) return;
		this.synth = new Tone.MetalSynth({
			volume: -12,
			frequency: 250,
			envelope: {
				attack: 0.01,
				decay: 0.01,
				release: 0.2
			},
			harmonicity: 3.1,
			modulationIndex: 32,
			resonance: 4000,
			octaves: 1.5,
		}).toDestination();
	}

	update(time) {
		if (!this.isActive) return;
		if (this.doodoo.stepIndex % this.interval === 0) {
			this.synth.triggerAttackRelease('C4', '4n', time, 0.1);
		}
	}

}