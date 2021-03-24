import { random, randInt, shuffle, chance, Range, ValuesList } from './helpers.js';

export default function Mutation(melody, debug) {
	
	debug = true;

	let mutations = 0;
	let ch = 0.35;

	const loopNums = new Range(1);
	const startIndexes = new Range(0);
	const indexStep = new Range(0);

	const melodyRepeats = new ValuesList([1]); // ?? 

	// duration of loop, whole note, half note etc.
	const durations = new ValuesList([2, 4], [1, 8]); 
	// duration changes between loops
	const durationSteps = new ValuesList([1], [0.5, 2, 4, 0.25]); 
	const startDelays = new ValuesList(
		[0, 1, 2, 4, 0.5, 8],
		[12, 16, 3, 5, 7, 11]
	);
	const harmonies = new ValuesList([4, 5], shuffle([2, 3, 6, 7]));

	// override randomness for a number of loops to setup themes
	const startParams = [
		[{
				noteDuration: 4,
				count: 0,
				counter: 1,
				doubler: false,
				doublerCounter: false,
				repeat: 1,
				startIndex: 0,
				startDelay: 0,
				melody: melody,
				harmony: 0,
		}],
		[{
				noteDuration: 4,
				count: 0,
				counter: 1,
				doubler: false,
				doublerCounter: false,
				repeat: 1,
				startIndex: 0,
				startDelay: 0,
				melody: melody,
				harmony: 0,
		},
		{
				noteDuration: 4,
				count: 0,
				counter: 1,
				doubler: false,
				doublerCounter: false,
				repeat: 1,
				startIndex: 0,
				startDelay: 0,
				melody: melody,
				harmony: 4,
		}]
	];

	function mutate() {
		
		loopNums.update(0.1, 0.2);
		
		// random start index
		// if (chance(ch) && mutations > 2 && startIndexes.max < melody.length) {
		// 	startIndexes.max++;
		// }

		if (mutations > 3) {

			// add harmony parts
			// if (chance(ch)) harmonies.update();

			// if (chance(ch)) indexStep.min--;
			// // maybe += chance(0.5) ? 1 : -1;
			// if (chance(ch)) indexStep.max++;

			// if (chance(ch)) durations.update();
			// if (chance(ch)) durationSteps.update();

			// if (chance(ch)) startDelays.update();

			// if (chance(ch)) melodyRepeats.add(random(melodyRepeats) * random([0.25, 0.5, 1.5]));

			// if (chance(ch)) {
			// 	let index = random(melody.length);
			// 	let slice = melody.slice(index, index + random(5));
			// 	melody.push(...slice);
			// }

			// if (chance(0.5) && melody.length > 4) melody.shift();
		}

		mutations++;
		if (debug) console.log(`${mutations} mutations`);
	}

	this.getTestLoops = function() {
		return [
			{
				noteDuration: 4,
				count: 0,
				counter: 1,
				doubler: false,
				doublerCounter: false,
				repeat: 1,
				startIndex: 0,
				startDelay: 0,
				melody: melody,
				harmony: 0,
			},
			{
				noteDuration: 4,
				count: 0,
				counter: 1,
				doubler: false,
				doublerCounter: false,
				repeat: 1,
				startIndex: 0,
				startDelay: 0,
				melody: melody,
				harmony: 4,
			}
		];
	};

	this.getLoops = function() {
		if (startParams[mutations]) return startParams[mutations];
		const loops = [];
		const loopNum = mutations == 1 ? 2 : loopNums.randInt;
		let duration = 8; // durations.random;
		let startIndex = startIndexes.randInt;
		let startDelay = 0; // first loop no delay

		for (let i = 0; i < loopNum; i++) {
			let melodyRepeat = melodyRepeats.random;
			if (duration > 8) melodyRepeat *= 2;
			loops.push({
				noteDuration: duration,
				count: 0,
				counter: duration < 4 ? duration / 4 : 1,
				doubler: false,
				doublerCounter: false,
				repeat: melodyRepeat,
				startIndex: startIndex,
				startDelay: startDelay,
				melody: melody,
				harmony: (loopNum > 1 && (chance(0.6) || loopNum == 2)) ? harmonies.random : 0,
			});

			// is this right?
			startIndex = random([startIndex, startIndex + indexStep.min, startIndex + indexStep.max]);
			duration = duration * durationSteps.random;
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
