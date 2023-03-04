/*
	list of values
	expand, update based on chance,
	return randoms
*/

function ValueList(list, index, updateChance) {
	if (updateChance === undefined) updateChance = 0.5;
	
	return {
		update: () => {
			if (index === list.length) return;
			if (chance(updateChance)) index++;
		},
		getRandom: () => { 
			console.log('rand', list, index, list.slice(0, index));
			return random(list.slice(0, index)) 
		},
		getSlice: () => { return list.slice(0, index) },
		get: () => { return list; }
	}
}