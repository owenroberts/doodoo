/*
	handles change over time
	each property can be mod
	{ value, mod }, or { list, index, mod }
*/

function Modulator(value, params) {

	// console.log('mod params', params);

	let min = new Property(params.min);
	let max = new Property(params.max);
	let step = new Property(params.step);
	// "kick in" index, wait plays before starting
	let kick = new Property(params.kick);
	let updateChance = new Property(params.chance);
	// let type = params.type ?? 'value'; // range, walk, value is no mod, walkUp, walkDown
	let type = new Property(params.type);

	/*
		have to keep track if mod is "kicked off"
		so can return value, not range
	*/
	let isKicked = false;


	function update(totalPlays) {
		if (totalPlays < kick.get()) return;
		if (totalPlays >= kick.get()) isKicked = true;
		if (!chance(updateChance.get())) return;
		
		min.update(totalPlays);
		max.update(totalPlays);

		if (type.get() === 'walk') value += (chance(0.5) ? step.get() : -step.get());
		if (type.get() === 'walkUp') value += step.get();
		if (type.get() === 'walkDown') value -= step.get();

		clamp();
	}

	function clamp() {
		if (value < min.get()) value = min.get();
		if (value > max.get()) value = max.get();
	}

	function get() {
		if (type.get() === 'range' && isKicked) {
			return random(min.get(), max.get());
		} else {
			clamp();
			return value;
		}
	}

	return { update, get };

}