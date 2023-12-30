/*
	NewDoo
	All properties used anywhere in Doodoo lol
	kick, when to start modding
	value (just the value), range (random), walk, walkUp, walkDown
	anything that has a value (or list+index) can have a mod	

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
	// melody starts at a different note -- omg
	startIndex: { 
		value: 0, 
		mod: { 
			max: { 
				value: 0, 
				mod: { 
					min: { value: 0 }, 
					max: { value: 8 }, 
					chance: { value: 0.3 }, 
					type: { value: 'walkUp' }
				},
			},
			type: { value: 'range' },
			chance: { value: 1 }, // to update the max mod -- think more on this
		}
	},
};

window.DoodooProps = { props };