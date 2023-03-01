/*
	handles mutations of one part
*/

function Part(melody, def, defaultDuration, debug) {
	console.log(melody);

	let mutationCount = 0;

	const attackStart = new ValueRange(...def.attackStart); // note attack velocity
	const restChance = new ValueRange(...def.restChance);
	const loopNums = new ValueRange(...def.loopNums);
	const harmonyList = new ValueList(def.harmonyList, def.harmonyIndex, def.harmonyUpdateChance);

	const startIndexes = new ValueRange(...def.startIndexes);
	const indexStep = new ValueRange(...def.indexStep);

	// duration of loop, whole note, half note etc.
	const durationList = new ValueList(def.durationList, def.durationIndex, def.durationChance); 

	const startDelayList = new ValueList(def.startDelayList, def.startDelayIndex, def.startDelayChance);

	const defaultLoop = {
		noteDuration: 4,
		count: 0,
		counter: 1,
		doubler: false,
		doublerCounter: false,
		repeat: 1,
		startIndex: 0,
		startDelay: 0,
		harmony: 0,
		melody: melody,
		attack: 0.5,
		restChance: 0,
	};
	
	const startLoops = def.startLoops.map(count => {
		return count.map(loop => {
			return { ...defaultLoop, ...loop };
		});
	});

	const harmonyChance = new ValueWalker(...def.harmonyChance);

	function mutate() {
		
		loopNums.update();
		harmonyList.update();
		startIndexes.update();
		indexStep.update();
		durationList.update();
		startDelayList.update();
		harmonyChance.update();

		if (chance(def.sliceChance)) {
			let index = randInt(melody.length);
			let slice = melody.slice(index, index + randInt(1, def.sliceLength));
			melody.push(...slice);
		}

		if (chance(def.shiftChance) && melody.length > def.shiftLength) {
			melody.shift();
		}

		mutationCount++;
		if (debug) console.log(`${mutationCount} mutations`);
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
				attack: 0.5,
				restChance: 0,
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
				attack: 0.5,
				restChance: 0,
			}
		];
	}

	function getLoops() {
		if (startLoops[mutationCount]) {
			return startLoops[mutationCount];
		}

		const loops = [];
		const loopNum = loopNums.getRandInt();
		let startIndex = startIndexes.getRandInt();
		let startDelay = 0; // first loop no delay

		// console.log('loops', loopNum, loopNums.getRange());

		for (let i = 0; i < loopNum; i++) {
			
			let duration = durationList.getRandom();
			loops.push({
				noteDuration: duration,
				count: 0,
				// counter: duration < 4 ? duration / 4 : 1, // how much we count by (useless with new system)
				doubler: duration < 32 ? chance(def.doublerChance) : false,
				repeat: duration > 9 ? random([...def.repeat]) : 1,
				startIndex: startIndex,
				startDelay: startDelay,
				melody: melody,
				harmony: chance(harmonyChance.get()) ? 
					harmonyList.getRandom() : 0,
				attack: attackStart.getRandom(),
				restChance: restChance.getRandom(),
			});

			// is this right? -- startIndex can't be negative
			startIndex = Math.max(0, random([
				startIndex, 
				startIndex + indexStep.getMin(), 
				startIndex + indexStep.getMax(),
			]));
			startDelay = startDelayList.getRandom();
		}
		return loops;
	}

	function update() {
		mutate();
		return mutationCount;
	}

	return { update, getLoops, getTestLoops };
}
