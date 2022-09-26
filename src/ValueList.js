/*
	list of values
	expand, update based on chance,
	return randoms
*/

import { chance, random, randInt } from './cool.js';

function ValueList(startList, addList, updateChance) {
	if (updateChance === undefined) updateChance = 0.5;
	let values = [...startList];
	
	return {
		update: () => {
			if (addList.length === 0) return;
			if (chance(updateChance)) {
				values.push(addList.pop());
			}
		},
		add: value => { values.push(value); },
		getRandom: () => { return random(values) },
	}
}

export default ValueList;