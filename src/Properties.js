/*
	NewDoo
	All properties used anywhere in Doodoo lol
	kick, when to start modding
	use [value, min, max, step, chance]?
	walk, walkUp, walkDown

*/

const props = {
	loopNum: { value: 1, step: 1, }, // number of loops per part
	harmonyChance: { value: 0, step: 0.01, mod: { min: { value: 0.5 }, max: { value: 0.5} } },
	harmonyList: { 
		list: [0, 4, 5, 2, 3, 6, 7],
		// this looks wacked, but better than alternative ... ?
		mod: { 
			type: { value: 'range' },
			min: { value: 0 }, 
			max: { value: 5 } 
		},
	},
};

window.DoodooProps = { props };