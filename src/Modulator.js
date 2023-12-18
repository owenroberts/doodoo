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
	let type = params.type ?? 'value'; // range, walk, value is no mod, walkUp, walkDown
	let kick = params.kick ?? 0; // "kick in" index, wait plays before starting
	let dir = 0; // -1 down, 1 up, 0 both, assume default for now

	let minMod, maxMod;
	if (params.minMod) {
		// console.log('min mod params', params.minMod);
		minMod = new Modulator({ ...params.minMod, value: min, isMinMod: true });
	}

	if (params.maxMod) {
		// console.log('max pre params',)
		maxMod = new Modulator({ ...params.maxMod, value: max, isMaxMod: true });
	}

	function update(totalPlays) {
		if (totalPlays < kick) return;
		if (!chance(ch)) return;
		if (minMod) {
			minMod.update(totalPlays);
			min = minMod.get();
			// if (!params.isMinMod) console.log('min', min);
		}
		
		if (maxMod) {
			maxMod.update(totalPlays);
			max = maxMod.get();
		}

		if (type === 'walk') {
			value += (chance(0.5 + (dir/2)) ? step : -step);
		}

		if (type === 'walkUp') {
			value += step;
		}

		if (type === 'walkDown') {
			value -= step;
		}

		if (value < min) value = min;
		if (value > max) value = max;

		// if (params.isMinMod) console.log('min mod value', value);
		// if (params.isMaxMod) console.log('max mod value', value);
	}

	function get() {
		if (type === 'range') {
			// if (!params.isMinMod) console.log('get', min, max);
			return random(min, max);
		} else {
			return value;
		}
	}

	function getInt() {
		return Math.floor(get());
	}

	return { update, get, getInt };


}