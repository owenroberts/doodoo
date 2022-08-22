import { random, randInt, shuffle, chance, ValueRange, ValueList } from './cool.js';

export default function Part(melody, defaults, defaultDuration, debug) {

	let mutations = 0;

	const loopNums = new ValueRange(...defaults.loopNums);
	const harmonies = new ValueList(defaults.harmonyStart, defaults.harmonyAdd, defaults.harmonyUpdateChance);

	const startIndexes = new ValueRange(...defaults.startIndexes);
	const indexStep = new ValueRange(...defaults.indexStep);

	// duration of loop, whole note, half note etc.
	const durations = new ValueList(defaults.durationStart, defaults.durationAdd, defaults.durationsChance); 

	const startDelays = new ValueList(defaults.startDelaysStart, defaults.startDelaysAdd, defaults.startDelaysChance);

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
			let index = randInt(melody.length);
			let slice = melody.slice(index, index + randInt(1, defaults.sliceLength));
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
			return startLoops[mutations];
		}

		const loops = [];
		const loopNum = loopNums.randInt;
		let startIndex = startIndexes.randInt;
		let startDelay = 0; // first loop no delay

		for (let i = 0; i < loopNum; i++) {
			
			let duration = durations.random;
			loops.push({
				noteDuration: duration,
				count: 0,
				counter: duration < 4 ? duration / 4 : 1,
				doubler: (duration > 4 && duration < 32) ? chance(defaults.doublerChance) : false,
				doublerCounter: duration > 4 ? chance(defaults.doublerCounterChance) : false,
				repeat: duration > 9 ? random(...defaults.repeat) : 1,
				startIndex: startIndex,
				startDelay: startDelay,
				melody: melody,
				harmony: chance(defaults.harmonyChance) ? harmonies.random : 0,
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
