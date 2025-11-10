import * as Tone from 'tone';

/**
 * Tone fx functions lookup table
 * @type {object}
 */
const fxMap = {
	reverb: ({ decay }) => {
		return new Tone.Reverb(decay);
	},
	distortion: ({ distortion }) => {
		return new Tone.Distortion(distortion);
	},
	bitCrush: ({ bits }) => {
		return new Tone.BitCrusher(bits);
	},
	autoFilter: ({ frequency }) => {
		return new Tone.AutoFilter(frequency).start();
	},
	autoPanner: ({ frequency }) => {
		return new Tone.AutoPanner(frequency).start();
	},
	cheby: ({ order }) => {
		return new Tone.Chebyshev(Math.round(order));
	},
	chorus: ({ frequency, delay, depth }) => {
		return new Tone.Chorus(Math.round(frequency), delay, depth).start();
	},
	feedback: ({ delay, feedback }) => {
		return new Tone.FeedbackDelay(delay, feedback);
	},
	phaser: ({ frequency, octaves, base }) => {
		return new Tone.Phaser(
			Math.floor(frequency), 
			Math.floor(octaves), 
			Math.floor(base),
		);
	},
	pingPong: ({ delay, feedback }) => {
		return new Tone.PingPongDelay(delay, feedback);
	},
	tremolo: ({ frequency, depth }) => {
		return new Tone.Tremolo(Math.floor(frequency), depth).start();
	},
	vibrato: ({ frequency, depth }) => {
		return new Tone.Vibrato(Math.floor(frequency), depth);
	},
};

/**
 * get Tone fx
 * @param  {string} fxName 
 * @param  {object} params 
 * @return {object} tone fx
 */
export function getFX(fxName, params) {
	return fxMap[fxName](params);
}

