/*
	Property container for new part
	returns, modulates values
	{ value, mod } or { list, index, mod }
	list with mod mods index
*/

function Property(params={}) {
	// console.log('property params', params);

	// default to value if no list and no value
	let type = params.hasOwnProperty('list') ? 'list' : 'value'; 

	let value = params.value ?? 0;
	let index = params.index ?? 0;
	let list = params.list ?? [];

	let isMod = false;
	let mod;

	if (params.mod) {
		isMod = true;
		mod = type === 'value' ? 
			new Modulator(value, params.mod) :
			new Modulator(index, params.mod) ;
	}

	function update(totalPlays) {
		if (isMod) mod.update(totalPlays);
	}

	function get() {
		if (type === 'list') {
			let i = isMod ? Math.round(mod.get()) : index;
			return list[Math.min(list.length - 1, i)];
		} 

		return isMod ? mod.get() : value;
	}

	function getInt() {
		return Math.floor(get());
	}

	return { update, get, getInt };

}