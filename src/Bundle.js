/*
	bundle of props
	for fx, maybe other stuff later
*/

import Property from './Property.js';

export default function Bundle(params={}, propName) {
	
	let type = 'bundle';
	let props = {};
	for (const param in params) {
		props[param] = new Property(params[param], param);
	}

	function update(playCount) {
		for (const prop in props) {
			props[prop].update(playCount);
		}
	}

	function get(loopIndex) {
		let values = {};
		for (const prop in props) {
			if (prop === 'type') continue;
			values[prop] = props[prop].get(loopIndex);
		}
		return values;
	}

	function set(param, value) {
		props[param].set(value);
	}

	return { update, get, set };

}