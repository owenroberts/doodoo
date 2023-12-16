/*
	handles change over time
*/

function Modulator(params) {

	// console.log('mod params', params);

	let value = params.value ?? 0;
	let min = params.min ?? 0;
	let max = params.max ?? 1;
	let step = params.step ?? 1;
	let ch = params.chance ?? 0.5;
	let type = params.type ?? 'value'; // range, walk, value is no mod
	let dir = 0; // -1 down, 1 up, 0 both, assume default for now

	let minMod, maxMod;
	if (params.minMod) {

	}

	if (params.maxMod) {

	}

	function update() {
		if (!chance(ch)) return;
		if (minMod) minMod.update();
		if (maxMod) maxMod.update();

		if (type === 'walk') {
			value += (chance(0.5 + (dir/2)) ? step : -step);
			if (value < min) value = min;
			if (value > max) value = max;
			// console.log('walk', value);
		}
	}

	function get() {
		if (type === 'value') return value;
		if (type === 'walk') return value;
		if (type === 'range') return random(min, max);
	}

	function getInt() {
		return Math.floor(get());
	}

	return { update, get, getInt };


}