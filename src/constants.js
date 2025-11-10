/**
 * types of properties in doodoo
 * @type {enum}
 */
export const PropertyTypes = {
	VALUE: "value",
	LIST: "list",
	STACK: "stack",
	BUNDLE: "bundle",
};

/**
 * behavior of random walk at bounds
 * @type {enum}
 */
export const Bounds = {
	STAY: "stay",
	RESET: "reset",
	REVERSE: "reverse",
};

export const ModulatorTypes = {
	VALUE: "value",
	RANGE: "range",
	WALK: "walk",
	WALK_UP: "walkUp",
	WALK_DOWN: "walkDown",
};