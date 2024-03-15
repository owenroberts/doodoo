/*
	return effects to chain to synth
*/

import * as Tone from 'tone';

export default function Effects(def) {

	const fxFuncs = {
		reverb: (params) => {
			return new Tone.Reverb(params.decay);
		},
		distortion: (params) => {
			return new Tone.Distortion(params.distortion);
		},
		bitCrush: (params) => {
			return new Tone.BitCrusher(params.bits);
		},
		autoFilter: (params) => {
			return new Tone.AutoFilter(params.frequency).start();
		},
		autoPanner: (params) => {
			return new Tone.AutoPanner(params.frequency).start();
		},
		cheby: (params) => {
			return new Tone.Chebyshev(Math.round(params.order));
		},
		chorus: (params) => {
			const freq = Math.round(params.frequency);
			const delay = params.delay;
			const depth = params.depth;
			return new Tone.Chorus(freq, delay, depth).start();
		},
		feedback: (params) => {
			return new Tone.FeedbackDelay(params.delay, params.feedback);
		},
		phaser: (params) => {
			const frequency = Math.floor(params.frequency);
			const octaves = Math.floor(params.octaves);
			const base = Math.floor(params.base);
			return new Tone.Phaser(frequency, octaves, base);
		},
		pingPong: (params) => {
			return new Tone.PingPongDelay(params.delay, params.feedback);
		},
		tremolo: (params) => {
			const frequency = Math.floor(params.frequency);
			const depth = params.depth;
			return new Tone.Tremolo(frequency, depth).start();
		},
		vibrato: (params) => {
			const frequency = Math.floor(params.frequency);
			const depth = params.depth;
			return new Tone.Vibrato(frequency, depth);
		},
	};

	function get(fxName, params) {
		return fxFuncs[fxName](params);
	}

	return { get };
}

