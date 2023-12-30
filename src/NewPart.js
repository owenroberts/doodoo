/*
	handle mutations on part
	part of mutations rewrite
*/

function NewPart(part, props, defaultBeat, debug) {
	// let mutationCount = 0;
	let defaultBeatNum = +defaultBeat.slice(0, -1); // default beat number for math
	let mods = {};

	// console.log('new part props', props);

	/* set up modulators */
	for (const prop in props) {
		mods[prop] = new Property(props[prop]); // modulator replaces default props
	}

	function update(totalPlays) {
		for (const mod in mods) {
			mods[mod].update(totalPlays);
		}
	}

	// convert melody to beats with params
	function getBeats(currentBeat) {
		// console.log('dur', duration, 'dd', dd);
		let beats = part.flatMap(note => {
			let [pitch, beat] = note; // note, duration
			let beatNum = +beat.slice(0, -1);
			let beatsInDefeault = defaultBeatNum / beatNum;
			if (currentBeat && currentBeat < defaultBeatNum) {
				beatsInDefeault = defaultBeatNumber / currentBeat;
				beatNum = (defaultBeatNum / beatNumber) * (beatNum / currentBeat);
			} 
			let newPart = [[pitch, beatNum + 'n']];
			for (let i = 1; i < beatsInDefeault; i++) {
				newPart.push([null, defaultBeatNum + 'n']);
			}
			return newPart;
		});
		return beats;
	}

	function get() {
		const loops = []; // need a better word, voices? instruments?
		const loopNum = mods.loopNum.getInt();
		// console.log('loop num', loopNum);
		// harm chance always 0
		for (let i = 0; i < loopNum; i++) {
			const currentBeat = defaultBeat;
			const melody = getBeats(currentBeat);
			loops.push({
				melody: melody,
				count: 0, // count through loop
				countEnd: melody.length - 1,
				beatCount: 1, // doubler param ... need this?
				// harmony: 0, // default tonic,
				harmony: chance(mods.harmonyChance.get()) ?
					mods.harmonyList.get() : 0,
				instrument: 'fmSynth',
				startIndex: mods.startIndex.getInt(),
			});
		}

		// console.log('harmonies', loops.map(l => l.harmony));
		console.log('start indexes', loops.map(l => l.startIndex));

		return loops;
	}

	return { get, update };
}