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

class ValueRange {
	constructor(min, max, ch1, ch2) {
		this.min = min;
		this.max = typeof max === 'undefined' ? min : max;
		if (ch1) this.ch1 = ch1 || 0.5;
		if (ch2) this.ch2 = ch2 || 0.5;
	}

	update() {
		if (chance(Math.abs(this.ch1)) && this.min < this.max) {
			this.min += Math.sign(this.ch1);
		}
		if (chance(Math.abs(this.ch2))) {
			this.max += Math.sign(this.ch2);
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

class ValueList {
	constructor(startValues, addValues, chance) {
		this.values = startValues;
		this.addValues = addValues || [];
		this.chance = chance || 0.5;
	}

	add(value) {
		this.values.push(value);
	}

	update() {
		if (chance(this.chance) && this.addValues.length > 0) {
			this.values.push(this.addValues.pop());
		}
	}

	get random() {
		return random(this.values);
	}
}

export { random, randInt, shuffle, chance, ValueRange, ValueList };