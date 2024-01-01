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

	let defaultBeatNum = +defaultBeat.slice(0, -1); 
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
	}

	// convert melody to beats with params
	function getBeats(beatMod) {
		// console.log('dur', duration, 'dd', dd);
		let beats = part.flatMap(note => {
			let [pitch, beat] = note; // note, duration
			let beatNum = +beat.slice(0, -1);
			
			// apply mod -- defaults to 4, quarter for now
			let newBeat = (beatMod / 4) * beatNum;
			
			let beatsInDefault = defaultBeatNum / newBeat;
			
			// if (newBeat < defaultBeatNum) {
			// 	beatsInDefault = defaultBeatNum / currentBeat;
			// 	newBeat = (defaultBeatNum /  ) * (newBeat / currentBeat);
			// }

			let newPart = [[pitch, newBeat + 'n']];
			for (let i = 1; i < beatsInDefault; i++) {
				newPart.push([null, defaultBeatNum + 'n']);
			}
			return newPart;
		});
		return beats;
	}

	function get() {
		const loops = []; // need a better word, voices? instruments?
		const loopNum = mods.loopNum.getInt();
		
		for (let i = 0; i < loopNum; i++) {
			
			let beatMod = mods.beatList.get();
			// console.log('* beat mod', beatMod);
			// new beat duration can't be smaller than default -- for now
			if (beatMod > defaultBeat / 2) beatMod = 4;
			let melody = getBeats(beatMod);


			let startIndex = mods.startIndex.getInt();
			if (startIndex > 0) {
				console.log('start index', i, startIndex);
				console.log('mel', melody.map(n => n[0]));

				// find the next note
				while (melody[startIndex][0] === null) {
					startIndex++;
					if (startIndex >= melody.length) {
						startIndex = 0;
					}
					console.log('while', startIndex, melody[startIndex][0]);
				}

				melody = melody.slice(startIndex).concat(melody.slice(0, startIndex));
				console.log('new mel', melody.map(n => n[0]));
			}

			const startDelay = i > 0 ? mods.startDelay.getInt() : 0;
			// console.log('start delay', i, startDelay);
			for (let i = 0; i < startDelay; i++) {
				melody.unshift([null, defaultBeatNum + 'n']);
			}
			console.log('final mel', i, melody.map(n => n[0]));

			loops.push({
				melody: melody,
				count: 0, // count through loop
				countEnd: melody.length - 1,
				beatCount: 1, // doubler param ... need this?
				// harmony: 0, // default tonic,
				harmony: chance(mods.harmonyChance.get()) ?
					mods.harmonyList.get() : 0,
				instrument: 'fmSynth',
				
			});
		}

		// console.log('loop num', loopNum);
		// console.log('harmonies', loops.map(l => l.harmony));
		// console.log('start indexes', loops.map(l => l.startIndex));

		return loops;
	}

	return { get, update };
}