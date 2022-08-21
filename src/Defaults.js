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
		"type": "range",
		"value": [0.25, 0.7],
		"range": [0, 1],
		"step": 0.05,
		"panel": "attack"
	},
	{
		"key": "attackStep",
		"type": "range",
		"value": [-0.2, 0.2],
		"range": [-1, 1],
		"step": 0.05,
		"panel": "attack"
	},
	{
		"key": "loopNums",
		"type": "range",
		"value": [1, 1, 0.1, 0.2],
		"range": [1, 32],
		"step": 1,
		"panel": "loop"
	},
	{
		"key": "harmonyStart",
		"type": "list",
		"value": [4, 5],
		"panel": "harmony"
	},
	{
		"key": "harmonyAdd",
		"type": "list",
		"value": [2, 3, 6, 7],
		"shuffle": true,
		"panel": "harmony"
	},
	{
		"key": "harmonyChance",
		"type": "chance",
		"value": 0.2,
		"panel": "harmony"
	},
	{
		"key": "startIndexes",
		"type": "range",
		"value": [0, 0, 0, 0.3],
		"range": [0, 0],
		"step": 1,
		"panel": "index"
	},
	{
		"key": "indexStep",
		"type": "range",
		"value": [0, 0, -0.2, 0.2],
		"range": [0, 8, -1, 1],
		"step": 1,
		"panel": "index"
	},
	{
		"key": "durationStart",
		"type": "list",
		"value": [2, 4],
		"panel": "loop"
	},
	{
		"key": "durationAdd",
		"type": "list",
		"value": [1, 8, 16, 32],
		"shuffle": true,
		"panel": "loop"
	},
	{
		"key": "durationChance",
		"type": "chance",
		"value": 0.3,
		"panel": "loop"
	},
	{
		"key": "startDelaysStart",
		"type": "list",
		"value": [0, 1, 2, 4, 0.5, 8],
		"panel": "index"
	},
	{
		"key": "startDelaysAdd",
		"type": "list",
		"value": [12, 16, 3, 5, 7, 11],
		"shuffle": true,
		"panel": "index"
	},
	{
		"key": "startDelaysChance",
		"type": "chance",
		"value": 0.3,
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
		"type": "number",
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
		"type": "number",
		"value": 16,
		"range": [0, 32],
		"panel": "slice"
	},
	{
		"key": "startLoops",
		"type": "loops",
		"value": [],
		"panel": "loops",
	},
	{
		"key": "fxLimit",
		"type": "number",
		"value": 4,
		"range": [0, 16],
		"panel": "effects"
	},
	{
		"key": "reverbChance",
		"type": "chance",
		"value": 1,
		"panel": "effects"
	},
	{
		"key": "reberbDelay",
		"type": "number",
		"value": 0,
		"range": [0, 16],
		"panel": "effects"
	},
	{
		"key": "reverbDecay",
		"type": "number",
		"value": 5,
		"range": [0.5, 32],
		"step": 0.1,
		"panel": "effects"
	},
	{
		"key": "distortionChance",
		"type": "chance",
		"value": 0.25,
		"panel": "effects"
	},
	{
		"key": "distortionDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "effects"
	},
	{
		"key": "distortion",
		"type": "range",
		"value": [0.05, 0.2],
		"range": [0.01, 1],
		"step": 0.01,
		"panel": "effects"
	},
	{
		"key": "bitCrushChance",
		"type": "chance",
		"value": 0.25,
		"panel": "effects"
	},
	{
		"key": "bitCrushDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "effects"
	},
	{
		"key": "bitCrushBits",
		"type": "list",
		"value": [3, 4, 6, 8, 12, 16],
		"panel": "effects"
	},
	{
		"key": "autoFilterChance",
		"type": "chance",
		"value": 0.25,
		"panel": "effects"
	},
	{
		"key": "autoFilterDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "effects"
	},
	{
		"key": "autoFilterFrequency",
		"type": "list",
		"value": ['2n', '4n', '8n', '16n', '32n'],
		"panel": "effects"
	},
	{
		"key": "autoPannerChance",
		"type": "chance",
		"value": 0.25,
		"panel": "effects"
	},
	{
		"key": "autoPannerDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "effects"
	},
	{
		"key": "autoPannerFrequency",
		"type": "list",
		"value": ['2n', '4n', '8n', '16n', '32n'],
		"panel": "effects"
	},
	{
		"key": "chebyChance",
		"type": "chance",
		"value": 0.25,
		"panel": "effects"
	},
	{
		"key": "chebyDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "effects"
	},
	{
		"key": "chebyOrder",
		"type": "number",
		"value": 16,
		"range": [1, 100],
		"panel": "effects"
	},
	{
		"key": "chorusChance",
		"type": "chance",
		"value": 0.25,
		"panel": "effects"
	},
	{
		"key": "chorusDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "effects"
	},
	{
		"key": "chorusFrequency",
		"type": "number",
		"value": 4,
		"range": [1, 12],
		"panel": "effects"
	},
	{
		"key": "chorusDelayTime",
		"type": "number",
		"value": 2.5,
		"range": [0.1, 12],
		"step": 0.1,
		"panel": "effects"
	},
	{
		"key": "chorusDepth",
		"type": "number",
		"value": 0.5,
		"range": [0, 1],
		"panel": "effects"
	},
	{
		"key": "feedbackChance",
		"type": "chance",
		"value": 0.25,
		"panel": "effects"
	},
	{
		"key": "feedbackDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "effects"
	},
	{
		"key": "feedbackDelayTime",
		"type": "list",
		"value": ['8n', '4n', '16n', '32n'],
		"panel": "effects"
	},
	{
		"key": "feedback",
		"type": "number",
		"value": 0.5,
		"range": [0.1, 1],
		"step": 0.01,
		"panel": "effects"
	}
];

let defaults = {};
params.forEach(p => {
	const { key, value, type } = p;
	switch(type) {
		case 'range':
		case 'chance':
		case 'number':
		case 'loops':
			defaults[key] = p.value;
		break;
		case 'list':
			defaults[key] = p.shuffle ? shuffle(value) : value;
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


	// {
	// 	"key": "tremoloChance",
	// 	"type": "chance",
	// 	"value": 0.25,
	// 	"panel": "effects"
	// },
	// {
	// 	"key": "tremoloFrequency",
	// 	"type": "range",
	// 	"value": [9, 9],
	// 	"range": [1, 18],
	// 	"step": 1,
	// 	"panel": "effects"
	// },
	// {
	// 	"key": "tremoloDepth",
	// 	"type": "range",
	// 	"value": [0.1, 1],
	// 	"range": [0, 1],
	// 	"step": 0.05,
	// 	"panel": "effects"
	// },

	/*
	{
		"key": "chorusChance",
		"type": "chance",
		"value": 0.25,
		"panel": "effects"
	},
	{
		"key": "chorusFrequency",
		"type": "int",
		"value": 6,
		"range": [0.1, 8],
		"step": 0.1,
		"panel": "effects"
	},
	{
		"key": "chorusDelayTime",
		"type": "int",
		"value": 2.5,
		"range": [0.1, 8],
		"step": 0.1,
		"panel": "effects"
	},
	{
		"key": "chorusDepth",
		"type": "int",
		"value": 0.5,
		"range": [0.1, 1],
		"step": 0.1,
		"panel": "effects"
	},
	*/