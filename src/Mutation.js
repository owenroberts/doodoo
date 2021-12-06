import { random, randInt, shuffle, chance, Range, ValuesList } from './cool.js';

export default function Mutation(melody, debug) {
	let mutations = 0;

	const loopNums = new Range(1);
	const harmonies = new ValuesList([4, 5], shuffle([2, 3, 6, 7]));
	const startIndexes = new Range(0);
	const indexStep = new Range(0);

	// duration of loop, whole note, half note etc.
	const durations = new ValuesList([2, 4], [1, 8, 16, 32]); 

	const startDelays = new ValuesList(
		[0, 1, 2, 4, 0.5, 8],
		[12, 16, 3, 5, 7, 11]
	);

	// override randomness for a number of loops to setup themes
	// should be set locally ?
	const startParams = [
		[{
				noteDuration: 8,
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
		harmonies.update(0.2);
		startIndexes.update(0, 0.3);
		indexStep.update(-0.2, 0.2);
		durations.update(0.3);
		startDelays.update(0.3);

		if (chance(0.1)) {
			let index = random(melody.length);
			let slice = melody.slice(index, index + random(3));
			melody.push(...slice);
		}

		if (chance(0.2) && melody.length > 16) {
			melody.shift();
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
		let startIndex = startIndexes.randInt;
		let startDelay = 0; // first loop no delay

		for (let i = 0; i < loopNum; i++) {
			
			let duration = durations.random;
			loops.push({
				noteDuration: duration,
				count: 0,
				counter: duration < 4 ? duration / 4 : 1,
				doubler: (duration > 4 && duration < 32) ? chance(0.5) : false,
				doublerCounter: duration > 4 ? chance(0.4) : false,
				repeat: duration > 9 ? random([2, 3, 4]) : 1,
				startIndex: startIndex,
				startDelay: startDelay,
				melody: melody,
				harmony: chance(0.6) ? harmonies.random : 0,
			});

			// is this right? -- startIndex can't be negative
			startIndex = Math.max(0, random([
				startIndex, 
				startIndex + indexStep.min, 
				startIndex + indexStep.max
			]));
			startDelay = startDelays.random;
		}
		return loops;
	};

	this.update = function() {
		mutate();
	};
}
