let params = [
	{
		"key": "attackStart",
		"value": [0.25, 0.7],
		"type": "range",
		"range": [0, 1],
		"step": 0.05
	},
	{
		"key": "attackStep",
		"value": [-0.2, 0.2],
		"type": "range",
		"range": [-1, 1],
		"step": 0.05
	}
];

let defaults = {};
params.forEach(p => {
	const { key, value } = p;
	defaults[key] = value;
});

module.exports = { 
	doodooParams: params, 
	doodooDefaults: defaults 
};
