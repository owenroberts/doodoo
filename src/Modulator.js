/*
	handles change over time
	each property can be mod
	{ value, mod }, or { list, index, mod }
*/

function Modulator(value, params) {

	console.log('mod params', params);

	let min = new Property(params.min);
	let max = new Property(params.max);
	let step = new Property(params.step);
	let ch = new Property(params.chance);
	// let type = params.type ?? 'value'; // range, walk, value is no mod, walkUp, walkDown
	let type = new Property(params.type);
	// let kick = params.kick ?? 0; // "kick in" index, wait plays before starting
	let kick = new Property(params.kick);

	function update(totalPlays) {
		if (totalPlays < kick.value) return;
		if (!chance(ch.value)) return;
		
		min.update(totalPlays);
		max.update(totalPlays);

		if (type === 'walk') value += (chance(0.5) ? step.value : -step.value);
		if (type === 'walkUp') value += step.value;
		if (type === 'walkDown') value -= step.value;

		if (value < min.value) value = min.value;
		if (value > max.value) value = max.value;
	}

	function get() {
		if (type.value === 'range') {
			return random(min.value, max.value);
		} else {
			return value;
		}
	}

	return { update, get };

}