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