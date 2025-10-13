/*
	handles change over time
	each property can be mod
	{ value, mod }, or { list, index, mod }

	needs defaults bc property defaults are 0
*/

import { Property } from './Property.js';
import { random, chance, getNumberPrecision } from '../../cool/cool.js';

export function Modulator(value, params, propName) {

	// console.log('mod params', params);

	let min = new Property(params.min ?? { value: 0 }, `${propName} min`);
	let max = new Property(params.max ?? { value: 1 }, `${propName} max`);

	// only min and max have and should need mods??? so no reason for props ... 
	// maybe for consistency or future proofing?

	let step = new Property(params.step ?? { value: 1 }, `${propName} step`);
	// "kick in" index, wait plays before starting
	let kick = new Property(params.kick ?? { value: 0 }, `${propName} kick`);
	let chup = new Property(params.chance ?? { value: 0.5 }, `${propName} chup`); // chance of update
	// let type = params.type ?? 'value'; // range, walk, value is no mod, walkUp, walkDown
	let type = new Property(params.type ?? { value: 'value' }, `${propName} type`);
	let bound = new Property(params.bound ?? { value: 'stay' }, `${propName} bound`);

	
	let precision = params.step ? getNumberPrecision(params.step.value) : 0;

	/*
		have to keep track if mod is "kicked off"
		so can return value, not range
	*/
	let isKicked = kick.get() > 0 ? false : true;

	function update(playCount) {
		if (!isKicked) {
			if (playCount < kick.get()) return;
			if (playCount >= kick.get()) isKicked = true;
		}
		if (!chance(chup.get())) return;

		min.update(playCount);
		max.update(playCount);

		let s = step.get();

		switch(type.get()) {
			case 'walk': 
				value += s * (chance(0.5) ? 1 : -1);
				value = +value.toFixed(precision);
			break;
			case 'walkUp': 
				value += s;
				value = +value.toFixed(precision);
			break;
			case 'walkDown': 
				value -= s;
				value = +value.toFixed(precision);
			break;
		}

		// worry about min and reverse later .... 
		if (value > max.get() && bound.get() === 'reset') value = min.get();

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