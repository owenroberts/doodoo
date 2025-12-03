import { SamplePaths } from './sample-paths.js';
import { Bounds, Modes, ToneFX } from './constants.js';
import { MIDI_NOTES } from './midi.js';

/**
 * default settings for properties modulated by doodoo
 * basically tries to do something interesting
 * overwritten by composition mods
 * @type {object}
 */
export const defaults = {

	// comp level mods
	transpose: {
		index: 60,
		list: ['C4'],
		options: [...MIDI_NOTES],
		type: 'note-list',
	},
	scale: {
		isBundle: true,
		chance: { value: 0, min: 0, max: 1, step: 0.1 },
		index: { value: 0 },
		step: { list: [1, -1, 2, -2] },
	},
	bpm: {
		value: 120,
	},

	// part level mods
	instruments: {
		stack: [{ list: ['choir'] }],
		options: ['choir', 'fmSynth', ...Object.keys(SamplePaths)],
	},
	voiceNum: { 
		value: 1, 
		step: 1,
		mod: {
			mode: { value: Modes.RANGE },
			min: { 
				value: 1,
				mod: {
					min: { value: 1 },
					max: { value: 3 },
					mode: { value: Modes.WALK_UP },
					chance: { value: 0.5 },
				}
			},
			max: { 
				value: 1,
				mod: {
					min: { value: 1 },
					max: { value: 5 },
					mode: { value: Modes.WALK_UP },
					chance: { value: 0.5 },
				}
			},
		}
	}, // number of voices per part
	harmony: {
		isBundle: true,
		chance: {
			value: 0, 
			step: 0.01,
			mod: { 
				min: { value: 0.5 },
				max: { value: 0.5 },
				kick: { value: 1 },
				chance: { value: 1 },
			} 
		},
		interval: { 
			list: [4, 5, 3, 7, 2, 6],
			index: 0,
			mod: { 
				mode: { value: Modes.RANGE },
				min: { value: 0 }, 
				max: { 
					value: 0,
					mod: {
						min: { value: 0 },
						max: { value: 5 },
						step: { value: 1 },
						mode: { value: Modes.WALK_UP },
					}
				},
			},
		},
	},
	// chance ?
	counterpoint: {
		value: 0,
		min: 0,
		max: 1,
		step: 0.1,
	},
	beatList: {
		list: [4, 2, 1, 8, 16], // prob should be string??
		index: 0,
		mod: {
			mode: { value: Modes.RANGE },
			chance: { value: 1 },
			min: { value: 0 },
			max: { 
				value: 0,
				mod: {
					max: { value: 6 },
					chance: { value: 0.3 },
					mode: { value: Modes.WALK_UP }
				}
			},
		}
	},
	playBeat: {
		isBundle: true,
		chance: {
			type: "chance",
			value: 0.5,
		},
		beat: {
			list: [4, 16, 8, 4, 2, 1],
			index: 0,
			mod: {
				mode: { value: Modes.RANGE },
				chance: { value: 1 },
				min: { value: 0 },
				max: { 
					value: 0,
					mod: {
						max: { value: 6 },
						chance: { value: 0.3 },
						mode: { value: Modes.WALK_UP }
					}
				},
			}
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
					chance: { value: 0.2 },
					mode: { value: Modes.WALK_UP },
					kick: { value: 2 },
				},
			},
			mode: { value: Modes.RANGE },
			chance: { value: 1 }, // to update the max mod -- think more on this
		}
	},
	startDelay: {
		list: [0, 1, 2, 4, 8, 3, 5, 7],
		index: 0,
		mod: {
			mode: { value: Modes.RANGE },
			chance: { value: 1 },
			kick: { value: 2 },
			min: { value: 0 },
			max: { 
				value: 0,
				mod: {
					min: { value: 0 },
					max: { value: 12 },
					chance: { value: 0.2 },
					mode: { value: Modes.WALK_UP },
				}
			},
			
		}
	},
	// chance to slice a part of the melody and concat to end
	slice: {
		isBundle: true,
		chance: { value: 0.1, step: 0.05 },
		length: {
			value: 1,
			mod: {
				mode: { value: Modes.RANGE },
				min: { value: 1 },
				max: { 
					value: 3,
					mod: {
						max: { value: 8 },
						mode: { value: Modes.WALK_UP },
					}
				},
			}
		},
		harmChance: { value: 0.1, step: 0.05, },
		harmList: {
			list: [3, 4, 5],
			index: 0,
			mod: {
				mode: { value: Modes.RANGE },
				chance: { value: 1 },
				min: { value: 0 },
				max: { value: 2 },
			}
		}
	},
	// chance to shift the first note in melody off
	shift: {
		isBundle: true,
		chance: { value: 0.2, step: 0.05, },
		length: {
			value: 16,
			mod: {
				min: { 
					value: 16,
					mod: {
						min: { value: 8 },
						max: { value: 16 },
						mode: { value: Modes.WALK_DOWN },
					}
				},
				max: { value: 32, },
				mode: { value: Modes.RANGE },
			}
		},
	},
	// play two notes at half time for each note
	double: {
		value: 0.1,
		step: 0.05,
	},
	// velocity, note velocity translates to loudness
	velocity: {
		type: "bundle",
		start: {
			value: 0.75,
			step: 0.05,
			mod: {
				min: { value: 0.25 },
				max: { value: 0.85 },
				mode: { value: Modes.RANGE },
			}
		},
		// step between values
		step: {
			value: 0.5,
			step: 0.01,
			mod: {
				min: { value: 0.1 },
				max: { value: 1 },
				chance: { value: 0.66 },
				mode: { value: Modes.WALK },
				step: { 
					value: 0.01,
					mod: {
						min: { value: 0.01 },
						max: { value: 0.1 },
						mode: { value: Modes.RANGE },
						chance: { value: 0.2 },
					}
				},
				
			}
		},
	},
	// ASDR, ish, maybe bundle ...
	attack: {
		value: 0.1,
		step: 0.05,
		mod: {
			mode: { value: Modes.RANGE },
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
					mode: { value: Modes.WALK_UP },
					chance: { value: 0.25 },
				}
			},
			mode: { value: Modes.RANGE },
		}
	},
	release: {
		value: 0.5,
		step: 0.05,
		mod: {
			mode: { value: Modes.RANGE },
			min: { value: 0.1 },
			max: { value: 0.5},
		}
	},
	// add decay and sustain?? and curves?? - only fm synth uses all those in envelope
	// chance of rest ... restChange ???
	rest: {
		value: 0,
		min: 0,
		max: 1,
		step: 0.1,
		mod: {
			min: { value: 0 },
			max: { value: 0.25 },
			mode: { value: Modes.RANGE },
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
		list: [...ToneFX],
		options: [...ToneFX],  // need options to get select list ... make this explicit ... 
		index: 0,
		mod: {
			mode: { value: Modes.RANGE },
			min: { value: 0 },
			max: { value: 10 },
		}
	},
	reverb: {
		isBundle: true,
		chance: { value: 1 },
		decay: { value: 5, step: 0.1, range: [0.5, 32] },
	},
	distortion: {
		isBundle: true,
		chance: { value: 0.1, type: "chance" },
		distortion: {
			value: 0.1,
			step: 0.01,
			mod: {
				min: { value: 0.05 },
				max: { value: 0.2 },
				mode: { value: Modes.RANGE },
			}
		}
	},
	bitCrush: {
		type: "bundle",
		chance: { value: 0.1, type: "chance" },
		bits: {
			list: [3, 4, 6, 8, 12, 16],
			mod: {
				min: { value: 0 },
				max: { value: 5 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		}
	},
	autoFilter: {
		type: "bundle",
		chance: { value: 0.1, type: "chance" },
		frequency: {
			list: ['2n', '4n', '8n', '16n', '32n'],
			mod: {
				min: { value: 0 },
				max: { value: 4 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		}
	},
	autoPanner: {
		type: "bundle",
		chance: { value: 0.1, type: "chance" },
		frequency: {
			list: ['2n', '4n', '8n', '16n', '32n'],
			mod: {
				min: { value: 0 },
				max: { value: 4 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		}
	},
	cheby: {
		type: "bundle",
		chance: { value: 0.1, type: "chance" },
		order: {
			value: 16,
			mod: {
				min: { value: 0 },
				max: { value: 40 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		}
	},
	chorus: {
		type: "bundle",
		chance: { value: 0.1, type: "chance" },
		frequency: {
			value: 4,
			mod: {
				min: { value: 1 },
				max: { value: 12 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
		delay: {
			value: 2.5,
			mod: {
				min: { value: 0.1 },
				max: { value: 12 },
				step: { value: 0.1 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
		depth: {
			value: 0.5,
			mod: {
				min: { value: 0 },
				max: { value: 1 },
				type: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
	},
	feedback: {
		type: "bundle",
		chance: { value: 0.1, type: "chance" },
		feedback: {
			value: 0.25,
			mod: {
				min: { value: 0.1 },
				max: { value: 0.5 },
				step: { value: 0.01 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
		delay: {
			list: ['8n', '4n', '16n', '32n'],
			mod: {
				min: { value: 0 },
				max: { value: 3 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
	},
	phaser: {
		type: "bundle",
		chance: { value: 0.1, type: "chance" },
		frequency: {
			value: 15,
			mod: {
				min: { value: 0 },
				max: { value: 32 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
		octaves: {
			value: 5,
			mod: {
				min: { value: 1 },
				max: { value: 16 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
		base: {
			value: 1000,
			mod: {
				min: { value: 0 },
				max: { value: 10_000 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
	},
	pingPong: {
		type: "bundle",
		chance: { value: 0.1, type: "chance" },
		feedback: {
			value: 0.25,
			mod: {
				min: { value: 0.1 },
				max: { value: 1 },
				step: { value: 0.01 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
		delay: {
			list: ['1n', '2n', '4n', '8n', '16n', '32n', '2t', '4t', '8t', '16t', '32t'],
			mod: {
				min: { value: 0 },
				max: { value: 10 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
	},
	tremolo: {
		type: "bundle",
		chance: { value: 0.1, type: "chance" },
		frequency: {
			value: 9,
			mod: {
				min: { value: 1 },
				max: { value: 18 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
		depth: {
			value: 0.25,
			mod: {
				min: { value: 0.1 },
				max: { value: 1 },
				step: { value: 0.05 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
	},
	vibrato: {
		type: "bundle",
		chance: { value: 0.1, type: "chance" },
		frequency: {
			value: 9,
			mod: {
				min: { value: 1 },
				max: { value: 18 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
		depth: {
			value: 0.25,
			mod: {
				min: { value: 0.1 },
				max: { value: 1 },
				step: { value: 0.05 },
				mode: { value: Modes.RANGE },
				chance: { value: 1 }
			}
		},
	},
};

