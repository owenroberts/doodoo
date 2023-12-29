/*
	NewDoo
	All properties used anywhere in Doodoo lol
	kick, when to start modding
	use [value, min, max, step, chance]?
	walk, walkUp, walkDown

*/

const props = {
	loopNum: { value: 1, step: 1, }, // number of loops per part
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