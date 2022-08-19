import { random, randInt, shuffle, chance, ValueRange, ValueList } from './cool.js';

export default function Part(melody, defaults, defaultDuration, debug) {

	let mutations = 0;

	const loopNums = new ValueRange(...defaults.loopNums);
	const harmonies = new ValueList(defaults.harmonies.start, defaults.harmonies.add, defaults.harmonies.chance);

	const startIndexes = new ValueRange(...defaults.startIndexes);
	const indexStep = new ValueRange(...defaults.indexStep);

	// duration of loop, whole note, half note etc.
	const durations = new ValueList(defaults.durations.start, defaults.durations.add, defaults.durations.chance); 

	const startDelays = new ValueList(defaults.startDelays.start, defaults.startDelays.add, defaults.startDelays.chance);

	const defaultLoop = {
		noteDuration: defaultDuration,
		count: 0,
		counter: 1,
		doubler: false,
		doublerCounter: false,
		repeat: 1,
		startIndex: 0,
		startDelay: 0,
		harmony: 0,
		melody: melody
	};
	const startLoops = defaults.startLoops.map(count => {
		return count.map(loop => {
			return { ...defaultLoop, ...loop };
		});
	});
	// console.log('start loops', startLoops);

	function mutate() {
		
		loopNums.update();
		harmonies.update();
		startIndexes.update();
		indexStep.update();
		durations.update();
		startDelays.update();

		if (chance(defaults.sliceChance)) {
			let index = random(melody.length);
			let slice = melody.slice(index, index + random(defaults.sliceLength));
			melody.push(...slice);
		}

		if (chance(defaults.shiftChance) && melody.length > defaults.shiftLength) {
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
		if (startLoops[mutations]) {
			// console.log(
			// 	startLoops[mutations]
			// 		.map(l => l.melody)
			// 		.map(m => m.map(n => n[0]).join(' '))
			// 		.join('\n')
			// );
			return startLoops[mutations];
		}

		const loops = [];
		// const loopNum = mutations == 1 ? 2 : loopNums.randInt;
		const loopNum = loopNums.randInt;
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
		return mutations;
	};
}
