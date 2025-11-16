/*
	defaults and props for mods
*/

import { Bounds, Modes } from '../../src/constants.js';

export const modDefaults = {
	min: { value: 0, step: 1 },
	max: { value: 1, step: 1 },
	step: { value: 1, step: 0.1 },
	kick: { value: 0, step: 1 },
	chance: { value: 0.5, step: 0.05 },
	mode: { value: Modes.VALUE },
	bound: { value: Bounds.stay },
};

export let propDefaults = {
	index: { value: 0, step: 1 },
};

export let typeOptions = ['number', 'number-list', 'string-list', 'note-list', 'stack', 'chance', 'graph-list'];