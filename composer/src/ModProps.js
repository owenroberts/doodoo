/*
	defaults and props for mods
*/

let modDefaults = {
	min: { value: 0, step: 1 },
	max: { value: 1, step: 1 },
	step: { value: 1, step: 0.01 },
	kick: { value: 0, step: 1 },
	chance: { value: 0.5, step: 0.05 },
	type: { value: 'value' }, // options: ['value', 'range', 'walk', 'walkUp', 'walkDown']
	bound: { value: 'stay' }, // options: ['reset', 'reverse', 'stay']
};

let propDefaults = {
	index: { value: 0, step: 1 },
};

let typeOptions = ['number', 'number-list', 'string-list', 'note-list', 'stack', 'chance', 'bundle', 'graph-list'];



export { modDefaults, propDefaults, typeOptions };