function random(min, max) {
	if (!max) {
		if (typeof min === "number") {
			return Math.random() * (min);
		} else if (Array.isArray(min)) {
			return min[Math.floor(Math.random() * min.length)];
		} else if (typeof min == 'object') {
			return min[random(Object.keys(min))];
		}
	} else {
		return Math.random() * (max - min) + min;
	}
}

function randInt(min, max) {
	if (!max) max = min, min = 0;
	return Math.round( Math.random() * (max - min) + min );
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
	let currentIndex = array.length, temporaryValue, randomIndex;
	while (0 !== currentIndex) {
	  randomIndex = Math.floor(Math.random() * currentIndex);
	  currentIndex -= 1;
	  temporaryValue = array[currentIndex];
	  array[currentIndex] = array[randomIndex];
	  array[randomIndex] = temporaryValue;
	}
	return array;
}

function chance(n) {
	return random(1) < n;
}

class Range {
	constructor(min, max) {
		this.min = min;
		this.max = typeof max === 'undefined' ? min : max;
	}

	update(ch1, ch2) {
		if (chance(Math.abs(ch1)) && this.min < this.max) {
			this.min += Math.sign(ch1);
		}
		if (chance(Math.abs(ch2))) {
			this.max += Math.sign(ch2);
		}
	}

	get range() {
		return [this.min, this.max];
	}

	get random() {
		return random(...this.range);
	}

	get randInt() {
		return randInt(...this.range);
	}
}


class ValuesList {
	constructor(startValues, addValues) {
		this.values = startValues;
		this.addValues = addValues || [];
	}

	add(value) {
		this.values.push(value);
	}

	update(pct) {
		if (chance(pct) && this.addValues.length > 0) {
			this.values.push(this.addValues.pop());
		}
	}

	get random() {
		return random(this.values);
	}
}

export { random, randInt, shuffle, chance, Range, ValuesList };