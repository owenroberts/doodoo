/*
	NewDoo
	All properties used anywhere in Doodoo lol
	kick, when to start modding
	value (just the value), range (random), walk, walkUp, walkDown
	anything that has a value (or list+index) can have a mod

	should there be kind of generic default set up that does something interesting?
	or should it be only if something is composed?
	also means defaults need to be undone

*/

const props = {
	loopNum: { 
		value: 1, 
		step: 1,
		mod: {
			type: { value: 'range' },
			min: { 
				value: 1,
				chance: 1,
				mod: {
					min: { value: 1 },
					max: { value: 3 },
					type: { value: 'walkUp' },
					chance: { value: 0.5 },
				}
			},
			max: { 
				value: 1,
				mod: {
					min: { value: 1 },
					max: { value: 5 },
					type: { value: 'walkUp' },
					chance: { value: 0.5 },
				}
			},
		}
	}, // number of loops per part
	harmonyChance: { 
		value: 0, 
		step: 0.01,
		mod: { 
			min: { value: 0.5 },
			max: { value: 0.5 },
			kick: { value: 1 },
			chance: { value: 1 },
		} 
	},
	harmonyList: { 
		list: [4, 5, 3, 7, 2, 6],
		index: 0,
		mod: { 
			type: { value: 'range' },
			min: { value: 0 }, 
			max: { 
				value: 0,
				mod: {
					min: { value: 0 },
					max: { value: 5 },
					step: { value: 1 },
					type: { value: 'walkUp' },
				}
			},
		},
	},
	beatList: {
		list: [4, 2, 1, 8, 16, 32],
		index: 0,
		mod: {
			type: { value: 'range' },
			chance: { value: 1 },
			min: { value: 0 },
			max: { 
				value: 0,
				mod: {
					max: { value: 6 },
					chance: { value: 0.3 },
					type: { value: 'walkUp' }
				}
			},
		}
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
	startDelay: {
		list: [0, 1, 2, 4, 8, 3, 5, 7],
		index: 6,
		mod: {
			min: { value: 0 },
			type: { value: 'range' },
			chance: { value: 1 },
			max: { 
				value: 6,
				mod: {
					max: { value: 12 },
					chance: { value: 0.3 },
					type: { value: 'walkUp' },
				}
			},
			
		}
	},
};

window.DoodooProps = { props };