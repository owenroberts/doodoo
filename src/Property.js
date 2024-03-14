/*
	Property container for new part
	returns, modulates values
	{ value, mod } or { list, index, mod }
	list with mod mods index
*/


import Modulator from './Modulator.js';

export default function Property(params={}, propName) {
	// console.log('property params', params);

	// default to value if no list and no value
	let type = params.hasOwnProperty('list') ? 'list' : 'value';
	if (params.hasOwnProperty('stack')) type = 'stack';
	// console.log(propName, params);

	let value = params.value ?? 0;
	let index = params.index ?? 0;
	let list = params.list ?? [];
	let stack = params.stack ?? [];

	let isMod = false;
	let mod;

	if (params.mod) {
		isMod = true;
		mod = type === 'value' ? 
			new Modulator(value, params.mod, propName) :
			new Modulator(index, params.mod, propName) ;
	}

	function update(playCount) {
		if (isMod) mod.update(playCount);
	}

	function get(loopIndex) {

		if (type === 'stack') {
			let value;
			if (loopIndex < stack.length) {
				value = random(stack[loopIndex].list);
			} else {
				// get all the options in stack
				// maybe change later
				value = random(stack.flatMap(v => v.list));
			}
			return value;
		}

		if (type === 'list') {
			let i = isMod ? Math.round(mod.get()) : index;
			return list[Math.min(list.length - 1, i)];
		} 

		return isMod ? mod.get() : value;
	}

	function set(_value) {
		value = _value;
		if (mod) mod.set(value);
	}

	function getInt() {
		return Math.round(get());
	}

	return { update, get, set, getInt };

}

// window.Property = Property;