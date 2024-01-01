/*
	Property container for new part
	returns, modulates values
	{ value, mod } or { list, index, mod }
	list with mod mods index
*/

function Property(params={}, propName) {
	// console.log('property params', params);

	// default to value if no list and no value
	let type = params.hasOwnProperty('list') ? 'list' : 'value';
	// console.log(propName, params);

	let value = params.value ?? 0;
	let index = params.index ?? 0;
	let list = params.list ?? [];

	let isMod = false;
	let mod;

	if (params.mod) {
		isMod = true;
		mod = type === 'value' ? 
			new Modulator(value, params.mod, propName) :
			new Modulator(index, params.mod, propName) ;
	}

	function update(totalPlays) {
		if (isMod) mod.update(totalPlays);
	}

	function get() {
		if (type === 'list') {
			let i = isMod ? Math.round(mod.get()) : index;
			// if (propName === 'beatList') console.log('index', i);
			return list[Math.min(list.length - 1, i)];
		} 

		return isMod ? mod.get() : value;
	}

	function getInt() {
		return Math.floor(get());
	}

	return { update, get, getInt };

}