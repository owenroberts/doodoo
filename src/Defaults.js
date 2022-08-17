/*
	value range has a range of values and min update chance and max update chance
	so 
	value [min, max, ch1, ch2]
	range [value, chance]
	step [value, chance]

	value is always starting point, update is how it changes
	so min max 0, 0 does not mean it always stays at 0, 0

	start params -- fuck
*/

import { shuffle } from './cool.js';

let params = [
	{
		"key": "attackStart",
		"value": [0.25, 0.7],
		"type": "range",
		"range": [0, 1],
		"step": [0.05],
		"panel": "attack"
	},
	{
		"key": "attackStep",
		"value": [-0.2, 0.2],
		"type": "range",
		"range": [-1, 1],
		"step": [0.05],
		"panel": "attack"
	},
	{
		"key": "loopNums",
		"type": "range",
		"value": [1, 1, 0.1, 0.2],
		"range": [1, 32, 0, 1],
		"step": [1, 0.01],
		"panel": "loop"
	},
	{
		"key": "harmonies",
		"type": "list",
		"start": [4, 5],
		"add": [2, 3, 6, 7],
		"chance": 0.2,
		"shuffle": true,
		"panel": "loop"
	},
	{
		"key": "startIndexes",
		"type": "range",
		"value": [0, 0, 0, 0.3],
		"range": [0, 0, 0, 1],
		"step": [1, 0.01],
		"panel": "index"
	},
	{
		"key": "indexStep",
		"type": "range",
		"value": [0, 0, -0.2, 0.2],
		"range": [0, 8, -1, 1],
		"step": [1, 0.01],
		"panel": "index"
	},
	{
		"key": "durations",
		"type": "list",
		"start": [2, 4],
		"add": [1, 8, 16, 32],
		"chance": 0.3,
		"panel": "index"
	},
	{
		"key": "startDelays",
		"type": "list",
		"start": [0, 1, 2, 4, 0.5, 8],
		"add": [12, 16, 3, 5, 7, 11],
		"chance": 0.3,
		"panel": "index"
	},
	{
		"key": "sliceChance",
		"type": "chance",
		"value": 0.1,
		"panel": "slice"
	},
	{
		"key": "sliceLength",
		"type": "int",
		"value": 3,
		"range": [1, 8],
		"panel": "slice"
	},
	{
		"key": "shiftChance",
		"type": "chance",
		"value": 0.2,
		"panel": "slice"
	},
	{
		"key": "shiftLength",
		"type": "int",
		"value": 16,
		"range": [0, 32],
		"panel": "slice"
	},
	{
		"key": "startLoops",
		"type": "loops",
		"value": [],
		"panel": "loops",
	}
];

let defaults = {};
params.forEach(p => {
	const { key, type } = p;
	switch(type) {
		case 'range':
		case 'chance':
		case 'int':
		case 'loops':
			defaults[key] = p.value;
		break;
		case 'list':
			defaults[key] = {
				start: p.start,
				add: p.shuffle ? shuffle(p.add) : p.add,
				chance: p.chance
			};
		break;
	}
});

export default { params, defaults };

/*
	default start loops
	// [{ "noteDuration": 8 }],
		// [
			// { "noteDuration": 4, },
			// { "noteDuration": 4, "harmony": 4 }
		// ]
*/
