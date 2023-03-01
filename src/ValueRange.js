/*
	range of values
	ch1 ch2 chance to update (sign of ch is direction)
*/

function ValueRange(min, max, ch1, ch2) {

	function update() {
		
		if (chance(Math.abs(ch1)) && min + Math.sign(ch1) < max) {
			min += Math.sign(ch1);
		}

		if (chance(Math.abs(ch2)) && max + Math.sign(ch2) > min) {
			max += Math.sign(ch2);
		}
	}

	return { 
		update, 
		getRange: () => { return [min, max]; },
		getRandom: () => { return random(min, max); },
		getRandInt: () => { return randInt(min, max); },
		getMin: () => { return min; },
		getMax: () => { return max; },
	};
}