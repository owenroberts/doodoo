/*
	handle mutations on part
	part of mutations rewrite
*/

function NewPart(part, props, defaultBeat, debug) {
	// let mutationCount = 0;
	// default beat number for math -- also smallest beat in entire composition
	// this is the problem! can't go smaller than the smallest ... 
	// so beat mod can only make it slower ...
	// think on this more ... 

	let defaultBeatNum = parseInt(defaultBeat);
	let mods = {};

	// console.log('new part props', props);

	/* set up modulators */
	for (const prop in props) {
		mods[prop] = new Property(props[prop], prop); // modulator replaces default props
	}

	// console.log('new part mods', mods);

	function update(totalPlays) {
		for (const mod in mods) {
			mods[mod].update(totalPlays);
		}

		if (chance(mods.sliceChance.get())) {
			let index = randInt(part.length);
			let slice = part.slice(index, index + mods.sliceLength.getInt());
			part.push(...slice);
		}

		if (chance(mods.shiftChance.get()) && part.length > mods.shiftLength.get()) {
			part.shift();
		}
	}

	// convert melody to beats with params
	function getBeats(beatMod) {
		// console.log('dur', duration, 'dd', dd);
		let beats = part.flatMap(note => {
			let [pitch, beat] = note; // note, duration
			let beatNum = parseInt(beat);
			
			// apply mod -- defaults to 4, quarter for now
			let newBeat = (beatMod / 4) * beatNum;
			
			let beatsInDefault = defaultBeatNum / newBeat;
			
			// if (newBeat < defaultBeatNum) {
			// 	beatsInDefault = defaultBeatNum / currentBeat;
			// 	newBeat = (defaultBeatNum /  ) * (newBeat / currentBeat);
			// }

			let firstPitch = chance(mods.rest.get()) ? null : pitch;
			let newPart = [[firstPitch, newBeat + 'n', mods.velocityStep.get()]];
			mods.velocityStep.update(); // update for next note
			
			for (let i = 1; i < beatsInDefault; i++) {
				newPart.push([null, defaultBeatNum + 'n', mods.velocityStep.get()]);
				mods.velocityStep.update();
			}
			return newPart;
		});
		return beats;
	}

	function get() {

		const loops = []; // need a better word, voices? instruments?
		const loopNum = mods.loopNum.getInt();
		
		// new beat mod can't be smaller than default -- for now
		// maybe needs to be defaultBeatNum / 2, not sure after working on repeat
		// console.log('deafult', defaultBeatNum)
		// const beatMods = [...Array(loopNum)].map(() => Math.min(defaultBeatNum, mods.beatList.get()));
		const beatMods = [...Array(loopNum)].map(() => mods.beatList.get());
		const maxBeat = Math.min(...beatMods);
		console.log('beatMods', beatMods)
		// console.log('minBeat', minBeat);
		
		for (let i = 0; i < loopNum; i++) {
			
			// set beginning velocity before generating loop
			mods.velocityStep.set(mods.velocityStart.get()); 
			let melody = getBeats(beatMods[i]);
			
			// repeat if shorter beat mod
			console.log('repeat', beatMods[i], maxBeat, (beatMods[i] / maxBeat), melody.length);
			const copy = [...melody];
			for (let j = 1; j < (beatMods[i] / maxBeat); j++) {
				// console.log('concat', j);
				melody = melody.concat([...copy]);
			}


			let startIndex = mods.startIndex.getInt();
			if (startIndex > 0) {
				// console.log('start index', i, startIndex);
				// console.log('mel', melody.map(n => n[0]));

				// find the next note
				while (melody[startIndex][0] === null) {
					startIndex++;
					if (startIndex >= melody.length) {
						startIndex = 0;
					}
					// console.log('while', startIndex, melody[startIndex][0]);
				}

				melody = melody.slice(startIndex).concat(melody.slice(0, startIndex));
				// console.log('new mel', melody.map(n => n[0]));

			}

			const startDelay = i > 0 ? mods.startDelay.getInt() : 0;
			// console.log('start delay', i, startDelay);
			for (let i = 0; i < startDelay; i++) {
				melody.unshift([null, defaultBeatNum + 'n']);
			}
			// console.log('final mel', i, melody.map(n => n[0]));

			// console.log('part length', i, melody.length, defaultBeat);
			// console.log('beats', melody.map(n => n[1]));
			// console.log('vel', melody.map(n => n[2]));


			loops.push({
				melody: melody,
				count: 0, // count through loop
				countEnd: melody.length - 1,
				beatCount: 1, // doubler param ... need this?
				harmony: chance(mods.harmonyChance.get()) ?
					mods.harmonyList.get() : 0,
				instrument: mods.instruments.get(i),
				attack: mods.attack.get(),
				curve: mods.curve.get(),
				release: mods.release.get(),
				double: chance(mods.doubleChance.get()),
			});
		}

		// console.log('loop num', loopNum);
		console.log('loop length', loops.map(l => l.melody.length));
		// console.log('harmonies', loops.map(l => l.harmony));
		// console.log('start indexes', loops.map(l => l.startIndex));


		return loops;
	}

	return { get, update };
}