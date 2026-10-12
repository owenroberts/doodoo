// simplified modulator syntax
// this is more like format mod

import { Modes, Bounds } from './constants.js';

/**
 * format modified - turns mod simple params in value params
 * @param  {[type]} params [description]
 * @return {[type]}        [description]
 */
export function formatModulator(params, name) {
	return {
		min: { value: params.min ?? 0 },
		max: { value: params.max ?? 1 },
		step: { value: params.step ?? 0.1 },
		chance: { value: params.chance ?? 0.5 },
		kick: { value: params.kick ?? 0 },
		mode: { value: params.mode ?? Modes.VALUE },
		bound: { value: params.bound ?? Bounds.STAY },
	};
}