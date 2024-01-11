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
	instruments: {
		stack: [{ list: ['choir'] }],
		options: ['choir', 'fmSynth', ...Object.keys(SamplePaths)],
		// options: ['fmSynth', 'choir', 'toms', 'flute', 'strings', 'guitar', 'piano', 'bamboo', 'crow_bass']
	},
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
		list: [4, 2, 1, 8, 16],
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
	playBeatChance: {
		type: "chance",
		value: 0.5,
	},
	playBeatList: {
		list: [4, 16, 8, 4, 2, 1],
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
	// chance to slice a part of the melody and concat to end
	sliceChance: {
		value: 0.1,
		step: 0.05,
	},
	// length of slice
	sliceLength: {
		value: 1,
		mod: {
			type: { value: 'range' },
			min: { value: 1 },
			max: { 
				value: 3,
				mod: {
					max: { value: 8 },
					type: { type: 'walkUp' },
				}
			},
		}		
	},
	// chance to shift the first note in melody off
	shiftChance: {
		value: 0.2,
		step: 0.05,
	},
	// min length of melody for shift
	shiftLength: {
		value: 16,
		mod: {
			min: { 
				value: 16,
				mod: {
					min: { value: 8 },
					max: { value: 16 },
					type: { value: 'walkDown' },
				}
			},
			max: { value: 32, },
			type: { value: 'range' },
		}
	},
	// play two notes at half time for each note
	doubleChance: {
		value: 0.1,
		step: 0.05,
	},
	// velocity, note velocity that is really loudness
	velocityStart: {
		value: 0.75,
		step: 0.05,
		mod: {
			min: { value: 0.25 },
			max: { value: 0.85 },
			type: { value: 'range' },
		}
	},
	// step between values
	velocityStep: {
		value: 0.5,
		step: 0.01,
		mod: {
			min: { value: 0.1 },
			max: { value: 1 },
			chance: { value: 0.66 },
			type: { value: 'walk' },
			step: { 
				value: 0.01,
				mod: {
					min: { value: 0.01 },
					max: { value: 0.1 },
					type: { value: 'range' },
					chance: { value: 0.2 },
				}
			},
			
		}
	},
	// ASDR, ish, maybe bundle ...
	attack: {
		value: 0.1,
		step: 0.05,
		mod: {
			type: { value: 'range' },
			min: { value: 0.1 },
			max: { value: 0.5 },
		}
	},
	curve: {
		list: ["linear", "exponential", "sine", "cosine", "bounce", "ripple", "step"],
		index: 0,
		mod: {
			chance: { value: 0.1 },
			min: { value: 0 },
			max: { 
				value: 0,
				mod: {
					min: { value: 0 },
					max: { value: 6 },
					type: { value: 'walkUp' },
					chance: { value: 0.25 },
				}
			},
			type: { value: 'range' },
		}
	},
	release: {
		value: 0.5,
		step: 0.05,
		mod: {
			type: { value: 'range' },
			min: { value: 0.1 },
			max: { value: 0.5},
		}
	},
	// add decay and sustain?? and curves?? - only fm synth uses all those in envelope
	// chance of rest ... 
	rest: {
		value: 0,
		step: 0.05,
		type: 'chance',
		mod: {
			min: { value: 0, type: 'chance', step: 0.05, },
			max: { value: 0.25, type: 'chance', step: 0.05, },
			type: { value: 'range' },
			kick: { value: 2 },
		}
	},

	// fx

	// limit of fx added to a instrument
	fxLimit: {
		"value": 0,
		"mod": {
			"min": { "value": 1, },
			"max": { "value": 1, },
            "step": { "value": 1, },
			"kick": { "value": 4, },
			"chance": { "value": 1, },
		}
	},
	fxList: {
		// reverb is separate
		list: ['distortion', 'bitCrush', 'autoFilter', 'autoPanner', 'cheby', 'chorus', 'feedback', 'phaser', 'pingPong', 'tremolo', 'vibrato',],
		index: 0,
		mod: {
			type: { value: 'range' },
			min: { value: 0 },
			max: { value: 10 },
		}
	},
	reverb: {
		type: 'bundle',
		chance: { value: 1 },
		decay: { value: 5, step: 0.1, range: [0.5, 32] },
	},
	distortion: {
		type: 'bundle',
		chance: { value: 0.25, type: "chance" },
		distortion: {
			value: 0.1,
			step: 0.01,
			mod: {
				min: { value: 0.05 },
				max: { value: 0.2 },
				type: { value: 'range' },
			}
		}
	},
	bitCrush: {
		type: "bundle",
		chance: { value: 0.25, type: "chance" },
		bits: {
			list: [3, 4, 6, 8, 12, 16],
			mod: {
				min: { value: 0 },
				max: { value: 5 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		}
	},
	autoFilter: {
		type: "bundle",
		chance: { value: 0.25, type: "chance" },
		frequency: {
			list: ['2n', '4n', '8n', '16n', '32n'],
			mod: {
				min: { value: 0 },
				max: { value: 4 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		}
	},
	autoPanner: {
		type: "bundle",
		chance: { value: 0.25, type: "chance" },
		frequency: {
			list: ['2n', '4n', '8n', '16n', '32n'],
			mod: {
				min: { value: 0 },
				max: { value: 4 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		}
	},
	cheby: {
		type: "bundle",
		chance: { value: 0.25, type: "chance" },
		order: {
			value: 16,
			mod: {
				min: { value: 0 },
				max: { value: 100 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		}
	},
	chorus: {
		type: "bundle",
		chance: { value: 0.25, type: "chance" },
		frequency: {
			value: 4,
			mod: {
				min: { value: 1 },
				max: { value: 12 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
		delay: {
			value: 2.5,
			mod: {
				min: { value: 0.1 },
				max: { value: 12 },
				step: { value: 0.1 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
		depth: {
			value: 0.5,
			mod: {
				min: { value: 0 },
				max: { value: 1 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
	},
	feedback: {
		type: "bundle",
		chance: { value: 0.25, type: "chance" },
		feedback: {
			value: 0.25,
			mod: {
				min: { value: 0.1 },
				max: { value: 0.5 },
				step: { value: 0.01 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
		delay: {
			list: ['8n', '4n', '16n', '32n'],
			mod: {
				min: { value: 0 },
				max: { value: 3 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
	},
	phaser: {
		type: "bundle",
		chance: { value: 0.25, type: "chance" },
		frequency: {
			value: 15,
			mod: {
				min: { value: 0 },
				max: { value: 32 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
		octaves: {
			value: 5,
			mod: {
				min: { value: 1 },
				max: { value: 16 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
		base: {
			value: 1000,
			mod: {
				min: { value: 0 },
				max: { value: 10_000 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
	},
	pingPong: {
		type: "bundle",
		chance: { value: 0.25, type: "chance" },
		feedback: {
			value: 0.25,
			mod: {
				min: { value: 0.1 },
				max: { value: 1 },
				step: { value: 0.01 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
		delay: {
			list: ['1n', '2n', '4n', '8n', '16n', '32n', '2t', '4t', '8t', '16t', '32t'],
			mod: {
				min: { value: 0 },
				max: { value: 10 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
	},
	tremolo: {
		type: "bundle",
		chance: { value: 0.25, type: "chance" },
		frequency: {
			value: 9,
			mod: {
				min: { value: 1 },
				max: { value: 18 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
		depth: {
			value: 0.25,
			mod: {
				min: { value: 0.1 },
				max: { value: 1 },
				step: { value: 0.05 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
	},
	vibrato: {
		type: "bundle",
		chance: { value: 0.25, type: "chance" },
		frequency: {
			value: 9,
			mod: {
				min: { value: 1 },
				max: { value: 18 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
		depth: {
			value: 0.25,
			mod: {
				min: { value: 0.1 },
				max: { value: 1 },
				step: { value: 0.05 },
				type: { value: 'range' },
				chance: { value: 1 }
			}
		},
	},

};

window.DoodooProps = { props };