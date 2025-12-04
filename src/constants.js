/**
 * behavior of random walk at bounds
 * @type {enum}
 */
export const Bounds = {
	STAY: "stay",
	RESET: "reset",
	REVERSE: "reverse",
};

/**
 * mode of modulator update
 * @type {enum}
 */
export const Modes = {
	VALUE: "value",
	RANGE: "range",
	WALK: "walk",
	WALK_UP: "walkUp",
	WALK_DOWN: "walkDown",
};

export const ToneFX = [
	'distortion', 
	'bitCrush', 
	'cheby', 
	'chorus', 
	'autoFilter', 
	'autoPanner', 
	'feedback', 
	'phaser', 
	'pingPong', 
	'tremolo', 
	'vibrato',
];

export const defaultModSet = {
	mods: {},
	parts: new Array(8).fill(true),
};

export const compModList = [
	"bpm",
	"transpose",
	"scale",
];

/**
 * loop states for live mode
 * @type {enum}
 */
export const LoopStates = {
	KILL: 0,
	MOD: 1,
	KEEP: 2,
};
