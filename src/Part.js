import { random, randInt, shuffle, chance } from './cool.js';
import ValueRange from './ValueRange.js';
import ValueList from './ValueList.js';

export default function Part(melody, def, defaultDuration, debug) {

	let mutations = 0;

	const loopNums = new ValueRange(...def.loopNums);
	const harmonies = new ValueList(def.harmonyStart, def.harmonyAdd, def.harmonyUpdateChance);

	const startIndexes = new ValueRange(...def.startIndexes);
	const indexStep = new ValueRange(...def.indexStep);

	// duration of loop, whole note, half note etc.
	const durations = new ValueList(def.durationStart, def.durationAdd, def.durationsChance); 

	const startDelays = new ValueList(def.startDelaysStart, def.startDelaysAdd, def.startDelaysChance);

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
	const startLoops = def.startLoops.map(count => {
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

		if (chance(def.sliceChance)) {
			let index = randInt(melody.length);
			let slice = melody.slice(index, index + randInt(1, def.sliceLength));
			melody.push(...slice);
		}

		if (chance(def.shiftChance) && melody.length > def.shiftLength) {
			melody.shift();
		}

		mutations++;
		if (debug) console.log(`${mutations} mutations`);
	}

	function getTestLoops() {
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
	}

	function getLoops() {
		if (startLoops[mutations]) {
			return startLoops[mutations];
		}

		const loops = [];
		const loopNum = loopNums.getRandInt();
		let startIndex = startIndexes.getRandInt();
		let startDelay = 0; // first loop no delay

		for (let i = 0; i < loopNum; i++) {
			
			let duration = durations.getRandom();
			loops.push({
				noteDuration: duration,
				count: 0,
				counter: duration < 4 ? duration / 4 : 1,
				doubler: (duration > 4 && duration < 32) ? chance(def.doublerChance) : false,
				doublerCounter: duration > 4 ? chance(def.doublerCounterChance) : false,
				repeat: duration > 9 ? random(...def.repeat) : 1,
				startIndex: startIndex,
				startDelay: startDelay,
				melody: melody,
				harmony: chance(def.harmonyChance) ? harmonies.getRandom() : 0,
			});

			// is this right? -- startIndex can't be negative
			startIndex = Math.max(0, random([
				startIndex, 
				startIndex + indexStep.getMin(), 
				startIndex + indexStep.getMax(),
			]));
			startDelay = startDelays.getRandom();
		}
		return loops;
	}

	function update() {
		mutate();
		return mutations;
	}

	return { update, getLoops, getTestLoops };
}
