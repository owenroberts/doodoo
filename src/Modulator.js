/*
	handles change over time
	each property can be mod
	{ value, mod }, or { list, index, mod }

	needs defaults bc property defaults are 0
*/

function Modulator(value, params, propName) {

	// console.log('mod params', params);

	let min = new Property(params.min ?? { value: 0 });
	let max = new Property(params.max ?? { value: 1 });
	let step = new Property(params.step ?? { value: 1 });
	// "kick in" index, wait plays before starting
	let kick = new Property(params.kick ?? { value: 0 });
	let chup = new Property(params.chance ?? { value: 0.5 }); // chance of update
	// let type = params.type ?? 'value'; // range, walk, value is no mod, walkUp, walkDown
	let type = new Property(params.type ?? { value: 'value' });

	/*
		have to keep track if mod is "kicked off"
		so can return value, not range
	*/
	let isKicked = kick.get() > 0 ? false : true;


	function update(totalPlays) {
		if (!isKicked) {
			if (totalPlays < kick.get()) return;
			if (totalPlays >= kick.get()) isKicked = true;
		}
		if (!chance(chup.get())) return;

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

	function set(_value) {
		value = _value;
		if (isKicked) clamp();
	}

	function get() {
		if (type.get() === 'range' && isKicked) {
			return random(min.get(), max.get());
		} else {
			if (isKicked) clamp();
			return value;
		}
	}

	return { update, get, set };

}