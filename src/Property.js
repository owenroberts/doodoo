/*
	Property container for new part
	returns, modulates values
	{ value, mod } or { list, index, mod }
*/

function Property(params) {
	console.log('property', params);
	let value = params.value ?? 0;
	let isMod = false;
	let mod;

	if (params.mod) {
		isMod = true;
		mod = new Modulator(value, params.mod);
	}

	function update(totalPlays) {
		if (isMod) mod.update(totalPlays);
	}

	function get() {
		if (isMod) return mod.get();
		return value;
	}

	function getInt() {
		return Math.floor(get());	
	}

	return { update, get, getInt };

}