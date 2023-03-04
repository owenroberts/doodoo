/*
	handles mutations of one part
*/

function Part(melody, def, defaultDuration, debug) {

	let mutationCount = 0;
	const dd = +defaultDuration.slice(0, -1); // default duration number for math

	const attackStart = new ValueRange(...def.attackStart); // note attack velocity
	const restChance = new ValueRange(...def.restChance);
	const loopNums = new ValueRange(...def.loopNums);
	const harmonyList = new ValueList(def.harmonyList, def.harmonyIndex, def.harmonyUpdateChance);

	const startIndexes = new ValueRange(...def.startIndexes);
	// const indexStep = new ValueRange(...def.indexStep);

	// duration of loop, whole note, half note etc.
	const durationList = new ValueList(def.durationList, def.durationIndex, def.durationChance); 

	const startDelayList = new ValueList(def.startDelayList, def.startDelayIndex, def.startDelayChance);

	const defaultLoop = {
		noteDuration: 4,
		count: 0,
		counter: 1,
		repeat: 1,
		startIndex: 0,
		startDelay: 0,
		harmony: 0,
		melody: melody,
		countEnd: melody.length - 1,
		beatCount: 1,
		attack: 0.5,
		restChance: 0,
	};
	
	const startLoops = def.startLoops.map(count => {
		return count.map(loop => {
			return { ...defaultLoop, ...loop };
		});
	});

	const harmonyChance = new ValueWalker(...def.harmonyChance);
	const slideLength = new ValueRange(...def.sliceLength);

	const voiceList = new ValueList(def.voiceList, def.voiceIndex, def.voiceChance);

	function mutate() {
		
		loopNums.update();
		harmonyList.update();
		startIndexes.update();
		durationList.update();
		startDelayList.update();
		harmonyChance.update();
		voiceList.update();

		if (chance(def.sliceChance)) {
			let index = randInt(melody.length);
			let slice = melody.slice(index, index + slideLength.getRandInt());
			melody.push(...slice);
		}

		if (chance(def.shiftChance) && melody.length > def.shiftLength) {
			melody.shift();
		}

		mutationCount++;
		if (debug) console.log(`${mutationCount} mutations`);
	}

	function getLoops(tonic, transform) {
		if (startLoops[mutationCount]) {
			return startLoops[mutationCount];
		}

		const loops = [];
		const loopNum = loopNums.getRandInt();
		// let startIndex = startIndexes.getRandInt();
		const startIndexStep = new ValueWalker(...def.indexStep);
		startIndexStep.set(startIndexes.getRandInt());
		let startDelay = 0; // first loop no delay

		// console.log('loops', loopNum, loopNums.getRange());

		for (let i = 0; i < loopNum; i++) {
			
			const duration = durationList.getRandom();
			let mel = melody.flatMap(beat => {
				const [n, d] = beat; // note, duration
				let b = dd / duration;
				// n. ... 
				let a = [[n, duration + 'n']];
				for (let i = 1; i < b; i++) {
					a.push([null, dd + 'n']);
				}
				return a;
			});
			
			const repeat = duration > 9 ? random(def.repeat) : 1;

			loops.push({
				noteDuration: duration,
				count: 0,
				beatCount: duration < 32 && chance(def.doublerChance) ? 2 : 1,
				countEnd: (mel.length - 1) * repeat + startDelay,
				repeat: repeat,
				startIndex: startIndexStep.get(),
				startDelay: startDelay,
				melody: mel,
				harmony: chance(harmonyChance.get()) ? 
					harmonyList.getRandom() : 0,
				attack: attackStart.getRandom(),
				restChance: restChance.getRandom(),
				voice: voiceList.getRandom(),
			});


			// is this right? -- startIndex can't be negative
			startIndexStep.update();
			startDelay = startDelayList.getRandom();
		}
		return loops;
	}

	function update() {
		mutate();
		return mutationCount;
	}

	return { update, getLoops };
}
