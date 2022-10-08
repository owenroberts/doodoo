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
		"key": "restChance",
		"type": "range",
		"value": [0, 0],
		"range": [0, 1],
		"step": 0.01,
		"panel": "attack",
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
		"key": "harmonyChance",
		"type": "chance",
		"value": 0.6,
		"panel": "harmony"
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
		"key": "harmonyUpdateChance",
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
		"key": "doublerChance",
		"type": "chance",
		"value": 0.5,
		"panel": "doubler"
	},
	{
		"key": "doublerCounterChance",
		"type": "chance",
		"value": 0.4,
		"panel": "doubler"
	},
	{
		"key": "repeat",
		"type": "list",
		"value": [2, 3, 4],
		"panel": "doubler"
	},
	{
		"key": "startLoops",
		"type": "loops",
		"value": [[{}]], //  one empty start loop
		"panel": "loops",
	},

	// fx 

	{
		"key": "fxLimit",
		"type": "number",
		"value": 1,
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
		"key": "reverbDelay",
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
		"panel": "distortion"
	},
	{
		"key": "distortionDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "distortion"
	},
	{
		"key": "distortion",
		"type": "range",
		"value": [0.05, 0.2],
		"range": [0.01, 1],
		"step": 0.01,
		"panel": "distortion"
	},
	{
		"key": "bitCrushChance",
		"type": "chance",
		"value": 0.25,
		"panel": "distortion"
	},
	{
		"key": "bitCrushDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "distortion"
	},
	{
		"key": "bitCrushBits",
		"type": "list",
		"value": [3, 4, 6, 8, 12, 16],
		"panel": "distortion"
	},
	{
		"key": "autoFilterChance",
		"type": "chance",
		"value": 0.25,
		"panel": "filter"
	},
	{
		"key": "autoFilterDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "filter"
	},
	{
		"key": "autoFilterFrequency",
		"type": "list",
		"value": ['2n', '4n', '8n', '16n', '32n'],
		"panel": "filter"
	},
	{
		"key": "autoPannerChance",
		"type": "chance",
		"value": 0.25,
		"panel": "filter"
	},
	{
		"key": "autoPannerDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "filter"
	},
	{
		"key": "autoPannerFrequency",
		"type": "list",
		"value": ['2n', '4n', '8n', '16n', '32n'],
		"panel": "filter"
	},
	{
		"key": "chebyChance",
		"type": "chance",
		"value": 0.25,
		"panel": "filter"
	},
	{
		"key": "chebyDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "filter"
	},
	{
		"key": "chebyOrder",
		"type": "number",
		"value": 16,
		"range": [1, 100],
		"panel": "filter"
	},
	{
		"key": "chorusChance",
		"type": "chance",
		"value": 0.25,
		"panel": "chorus"
	},
	{
		"key": "chorusDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "chorus"
	},
	{
		"key": "chorusFrequency",
		"type": "number",
		"value": 4,
		"range": [1, 12],
		"panel": "chorus"
	},
	{
		"key": "chorusDelayTime",
		"type": "number",
		"value": 2.5,
		"range": [0.1, 12],
		"step": 0.1,
		"panel": "chorus"
	},
	{
		"key": "chorusDepth",
		"type": "number",
		"value": 0.5,
		"range": [0, 1],
		"panel": "chorus"
	},
	{
		"key": "feedbackChance",
		"type": "chance",
		"value": 0.25,
		"panel": "delay"
	},
	{
		"key": "feedbackDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "delay"
	},
	{
		"key": "feedbackDelayTime",
		"type": "list",
		"value": ['8n', '4n', '16n', '32n'],
		"panel": "delay"
	},
	{
		"key": "feedback",
		"type": "number",
		"value": 0.25,
		"range": [0.1, 1],
		"step": 0.01,
		"panel": "delay"
	},
	{
		"key": "phaserChance",
		"type": "chance",
		"value": 0.25,
		"panel": "phaser"
	},
	{
		"key": "phaserDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "phaser"
	},
	{
		"key": "phaserFrequency",
		"type": "number",
		"value": 15,
		"range": [0, 32],
		"panel": "phaser"
	},
	{
		"key": "phaserOctaves",
		"type": "number",
		"value": 5,
		"range": [1, 16],
		"panel": "phaser"
	},
	{
		"key": "phaserBaseFrequency",
		"type": "number",
		"value": 1000,
		"range": [1, 10000],
		"panel": "phaser"
	},
	{
		"key": "pingPongChance",
		"type": "chance",
		"value": 0.25,
		"panel": "delay"
	},
	{
		"key": "pingPongDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "delay"
	},
	{
		"key": "pingPongDelayTime",
		"type": "list",
		"value": ['1n', '2n', '4n', '8n', '16n', '32n', '2t', '4t', '8t', '16t', '32t'],
		"panel": "delay"
	},
	{
		"key": "pingPongFeedback",
		"type": "number",
		"value": 0.25,
		"range": [0, 1],
		"step": 0.01,
		"panel": "delay"
	},
	{
		"key": "tremoloChance",
		"type": "chance",
		"value": 0.25,
		"panel": "tremolo"
	},
	{
		"key": "tremoloDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "tremolo"
	},
	{
		"key": "tremoloFrequency",
		"type": "range",
		"value": [9, 9],
		"range": [1, 18],
		"step": 1,
		"panel": "tremolo"
	},
	{
		"key": "tremoloDepth",
		"type": "range",
		"value": [0.1, 0.5],
		"range": [0, 1],
		"step": 0.05,
		"panel": "tremolo"
	},
	{
		"key": "vibratoChance",
		"type": "chance",
		"value": 0.25,
		"panel": "vibrato"
	},
	{
		"key": "vibratoDelay",
		"type": "number",
		"value": 8,
		"range": [0, 16],
		"panel": "vibrato"
	},
	{
		"key": "vibratoFrequency",
		"type": "range",
		"value": [9, 9],
		"range": [1, 18],
		"step": 1,
		"panel": "vibrato"
	},
	{
		"key": "vibratoDepth",
		"type": "range",
		"value": [0.1, 0.5],
		"range": [0, 1],
		"step": 0.05,
		"panel": "vibrato"
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
	

