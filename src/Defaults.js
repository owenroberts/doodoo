/*
	value range has a range of values and min update chance and max update chance
	so 
	value [min, max, ch1, ch2]
	range [value, chance]
	step [value, chance]

	value is always starting point, update is how it changes
	so min max 0, 0 does not mean it always stays at 0, 0

	default start loops
	// [{ "noteDuration": 8 }],
		// [
			// { "noteDuration": 4, },
			// { "noteDuration": 4, "harmony": 4 }
		// ]
*/

let controls = [
	{
		"key": "attackStart",
		"type": "range",
		"value": [0.25, 0.7],
		"range": [0, 1],
		"step": 0.05,
	},
	{
		"key": "attackStep",
		"type": "range",
		"value": [-0.2, 0.2],
		"range": [-1, 1],
		"step": 0.05,
	},
	{
		"key": "restChance",
		"type": "range",
		"value": [0, 0],
		"range": [0, 1],
		"step": 0.01,
	},
	{
		"key": "loopNums",
		"type": "range",
		"value": [1, 1, 0.1, 0.2],
		"range": [1, 32],
		"step": 1,
	},
	{
		"key": "harmonyChance",
		"type": "chance",
		"value": 0.6,
	},
	{
		"key": "harmonyList",
		"type": "list",
		"value": [4, 5],
	},
	{
		"key": "harmonyStart",
		"type": "list",
		"value": [4, 5],
	},
	{
		"key": "harmonyAdd",
		"type": "list",
		"value": [2, 3, 6, 7],
		"shuffle": true,
	},
	{
		"key": "harmonyUpdateChance",
		"type": "chance",
		"value": 0.2,
	},
	{
		"key": "startIndexes",
		"type": "range",
		"value": [0, 0, 0, 0.3],
		"range": [0, 0],
		"step": 1,
	},
	{
		"key": "indexStep",
		"type": "range",
		"value": [0, 0, -0.2, 0.2],
		"range": [0, 8, -1, 1],
		"step": 1,
	},
	{
		"key": "durationStart",
		"type": "list",
		"value": [2, 4],
	},
	{
		"key": "durationAdd",
		"type": "list",
		"value": [1, 8, 16, 32],
		"shuffle": true,
	},
	{
		"key": "durationChance",
		"type": "chance",
		"value": 0.3,
	},
	{
		"key": "startDelaysStart",
		"type": "list",
		"value": [0, 1, 2, 4, 0.5, 8],
	},
	{
		"key": "startDelaysAdd",
		"type": "list",
		"value": [12, 16, 3, 5, 7, 11],
		"shuffle": true,
	},
	{
		"key": "startDelaysChance",
		"type": "chance",
		"value": 0.3,
	},
	{
		"key": "sliceChance",
		"type": "chance",
		"value": 0.1,
	},
	{
		"key": "sliceLength",
		"type": "number",
		"value": 3,
		"range": [1, 8],
	},
	{
		"key": "shiftChance",
		"type": "chance",
		"value": 0.2,
	},
	{
		"key": "shiftLength",
		"type": "number",
		"value": 16,
		"range": [0, 32],
	},
	{
		"key": "doublerChance",
		"type": "chance",
		"value": 0.5,
	},
	{
		"key": "doublerCounterChance",
		"type": "chance",
		"value": 0.4,
	},
	{
		"key": "repeat",
		"type": "list",
		"value": [2, 3, 4],
	},
	{
		"key": "startLoops",
		"type": "loops",
		"value": [[{}]], //  one empty start loop
	},

	// fx 

	{
		"key": "fxLimit",
		"type": "number",
		"value": 1,
		"range": [0, 16],
	},
	{
		"key": "reverbChance",
		"type": "chance",
		"value": 1,
	},
	{
		"key": "reverbDelay",
		"type": "number",
		"value": 0,
		"range": [0, 16],
	},
	{
		"key": "reverbDecay",
		"type": "number",
		"value": 5,
		"range": [0.5, 32],
		"step": 0.1,
	},
	{
		"key": "distortionChance",
		"type": "chance",
		"value": 0.25,
	},
	{
		"key": "distortionDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
	},
	{
		"key": "distortion",
		"type": "range",
		"value": [0.05, 0.2],
		"range": [0.01, 1],
		"step": 0.01,
	},
	{
		"key": "bitCrushChance",
		"type": "chance",
		"value": 0.25,
	},
	{
		"key": "bitCrushDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
	},
	{
		"key": "bitCrushBits",
		"type": "list",
		"value": [3, 4, 6, 8, 12, 16],
	},
	{
		"key": "autoFilterChance",
		"type": "chance",
		"value": 0.25,
	},
	{
		"key": "autoFilterDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
	},
	{
		"key": "autoFilterFrequency",
		"type": "list",
		"value": ['2n', '4n', '8n', '16n', '32n'],
	},
	{
		"key": "autoPannerChance",
		"type": "chance",
		"value": 0.25,
	},
	{
		"key": "autoPannerDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
	},
	{
		"key": "autoPannerFrequency",
		"type": "list",
		"value": ['2n', '4n', '8n', '16n', '32n'],
	},
	{
		"key": "chebyChance",
		"type": "chance",
		"value": 0.25,
	},
	{
		"key": "chebyDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
	},
	{
		"key": "chebyOrder",
		"type": "number",
		"value": 16,
		"range": [1, 100],
	},
	{
		"key": "chorusChance",
		"type": "chance",
		"value": 0.25,
	},
	{
		"key": "chorusDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
	},
	{
		"key": "chorusFrequency",
		"type": "number",
		"value": 4,
		"range": [1, 12],
	},
	{
		"key": "chorusDelayTime",
		"type": "number",
		"value": 2.5,
		"range": [0.1, 12],
		"step": 0.1,
	},
	{
		"key": "chorusDepth",
		"type": "number",
		"value": 0.5,
		"range": [0, 1],
	},
	{
		"key": "feedbackChance",
		"type": "chance",
		"value": 0.25,
	},
	{
		"key": "feedbackDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
	},
	{
		"key": "feedbackDelayTime",
		"type": "list",
		"value": ['8n', '4n', '16n', '32n'],
	},
	{
		"key": "feedback",
		"type": "number",
		"value": 0.25,
		"range": [0.1, 1],
		"step": 0.01,
	},
	{
		"key": "phaserChance",
		"type": "chance",
		"value": 0.25,
	},
	{
		"key": "phaserDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
	},
	{
		"key": "phaserFrequency",
		"type": "number",
		"value": 15,
		"range": [0, 32],
	},
	{
		"key": "phaserOctaves",
		"type": "number",
		"value": 5,
		"range": [1, 16],
	},
	{
		"key": "phaserBaseFrequency",
		"type": "number",
		"value": 1000,
		"range": [1, 10000],
	},
	{
		"key": "pingPongChance",
		"type": "chance",
		"value": 0.25,
	},
	{
		"key": "pingPongDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
	},
	{
		"key": "pingPongDelayTime",
		"type": "list",
		"value": ['1n', '2n', '4n', '8n', '16n', '32n', '2t', '4t', '8t', '16t', '32t'],
	},
	{
		"key": "pingPongFeedback",
		"type": "number",
		"value": 0.25,
		"range": [0, 1],
		"step": 0.01,
	},
	{
		"key": "tremoloChance",
		"type": "chance",
		"value": 0.25,
	},
	{
		"key": "tremoloDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
	},
	{
		"key": "tremoloFrequency",
		"type": "range",
		"value": [9, 9],
		"range": [1, 18],
		"step": 1,
	},
	{
		"key": "tremoloDepth",
		"type": "range",
		"value": [0.1, 0.5],
		"range": [0, 1],
		"step": 0.05,
	},
	{
		"key": "vibratoChance",
		"type": "chance",
		"value": 0.25,
	},
	{
		"key": "vibratoDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
	},
	{
		"key": "vibratoFrequency",
		"type": "range",
		"value": [9, 9],
		"range": [1, 18],
		"step": 1,
	},
	{
		"key": "vibratoDepth",
		"type": "range",
		"value": [0.1, 0.5],
		"range": [0, 1],
		"step": 0.05,
	},
];

let defaults = {};
controls.forEach(params => {
	const { key, value, type } = params;
	switch(type) {
		case 'range':
		case 'chance':
		case 'number':
		case 'loops':
			defaults[key] = value;
		break;
		case 'list':
			defaults[key] = params.shuffle ? shuffle(value) : value;
		break;
	}
});

window.DoodooControls = { defaults, controls };
	

