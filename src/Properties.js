/*
	NewDoo
	All properties used anywhere in Doodoo lol
	kick, when to start modding
	use [value, min, max, step, chance]?

*/

const props = {
	loopNum: {
		value: 1,
		min: 1,
		max: 5,
		chance: 0.5,
		step: 1,
		type: 'range',
		kick: 0,
		minMod: {},
		maxMod: {},
	}, // number of loops per part
};

window.DoodooProps = { props };