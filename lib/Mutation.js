import { random, randInt, shuffle, chance, Range, PropRange } from './helpers.js';

export default function Mutation(melody, noteDuration, debug) {
	
	let mutations = 0;
	let ch = 0.35;

	const loopNums = new Range(1);
	const startIndexes = new Range(0);
	const indexStep = new Range(0);

	const melodyRepeats = new PropRange([1]); // ?? 

	// duration of loop, whole note, half note etc.
	const durations = new PropRange([noteDuration || 2], [1, 4, 8]); 
	// duration changes between loops
	const durationSteps = new PropRange([1], [0.5, 2, 4, 0.25]); 
	const startDelays = new PropRange(
		[0, 1, 2, 4, 0.5, 8],
		[12, 16, 3, 5, 7, 11]
	);
	const harmonies = new PropRange([4, 5], shuffle([2, 3, 6, 7]));

	function mutate() {

		// change number of loops
		if (mutations == 0) {
			loopNums.max = 2; // after first play add a harmony
		} else {
			// its okay if they swap
			if (chance(0.05)) loopNums.min += 1;
			if (chance(0.1)) loopNums.max += 1;
		}
		

		// random start index
		if (chance(ch) && mutations > 2 && startIndexes.max < melody.length) {
			startIndexes.max++;
		}

		if (mutations > 3) {

			// add harmony parts
			if (chance(ch)) harmonies.update();

			if (chance(ch)) indexStep.min--;
			// maybe += chance(0.5) ? 1 : -1;
			if (chance(ch)) indexStep.max++;

			if (chance(ch)) durations.update();
			if (chance(ch)) durationSteps.update();

			if (chance(ch)) startDelays.update();

			if (chance(ch)) melodyRepeats.add(random(melodyRepeats) * random([0.25, 0.5, 1.5]));

			if (chance(ch)) {
				let index = Cool.random(melody.length);
				let slice = melody.slice(index, index + Cool.random(5));
				melody.push(...slice);
			}

			if (chance(0.5) && melody.length > 4) melody.shift();
		}

		mutations++;
		if (debug) console.log(`${mutations} mutations`);
	}

	this.getLoops = function() {
		const loops = [];
		const loopNum = mutations == 1 ? 2 : loopNums.randInt;
		let duration = durations.random;
		let startIndex =  startIndexes.randInt;
		let startDelay = mutations == 0 ? 0 : startDelays.random;
		console.log('duration', duration, durations.values);

		for (let i = 0; i < loopNum; i++) {
			let melodyRepeat = melodyRepeats.random;
			if (duration > 8) melodyRepeat *= 2;
			
			loops.push({
				duration: duration,
				melodyRepeat: melodyRepeat,
				startIndex: startIndex,
				startDelay: startDelay,
				melody: melody,
				harmony: (chance(0.6) || loopNum == 2) ? harmonies.random : 0,
			});

			// is this right?
			startIndex = random([startIndex, startIndex + indexStep.min, startIndex + indexStep.max]);
			duration = duration * durationSteps.random;
			console.log('steps', duration, durations.values);
			if (mutations > 3) {
				startDelay = startDelays.random;
			}
		}
		return loops;
	};

	this.update = function() {
		mutate();
	};
}
