/*
	value range has a range of values and min update chance and max update chance
	so 
	value [min, max, ch1, ch2]
	range [value, chance]
	step [value, chance]

*/
import { shuffle } from './cool.js';

let params = [
	{
		"key": "attackStart",
		"value": [0.25, 0.7],
		"type": "range",
		"range": [0, 1],
		"step": [0.05]
	},
	{
		"key": "attackStep",
		"value": [-0.2, 0.2],
		"type": "range",
		"range": [-1, 1],
		"step": [0.05]
	},
	{
		"key": "loopNums",
		"value": [1, 1, 0.1, 0.2],
		"range": [1, 32, 0, 1],
		"type": "range",
		"step": [1, 0.01],
	},
	{
		"key": "harmonies",
		"type": "list",
		"start": [4, 5],
		"add": [2, 3, 6, 7],
		"chance": 0.2,
		"shuffle": true
	}
];

let defaults = {};
params.forEach(p => {
	const { key, type } = p;
	switch(type) {
		case 'range':
			defaults[key] = p.value;
		break;
		case 'list':
			defaults[key] = {
				start: p.start,
				add: p.shuffle ? shuffle(p.add) : p.add,
				chance: p.chance
			}
	}
});

export default { 
	params, 
	defaults 
};
