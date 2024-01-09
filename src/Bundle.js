/*
	bundle of props
	for fx, maybe other stuff later
*/

function Bundle(params={}, propName) {
	
	let type = 'bundle';
	let props = {};
	for (const param in params) {
		props[param] = new Property(params[param], param);
	}

	function update(totalPlays) {
		for (const prop in props) {
			props[prop].update(totalPlays);
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

	return { update, get };

}