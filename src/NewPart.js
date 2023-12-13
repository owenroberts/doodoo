/*
	handle mutations on part
	part of mutations rewrite
*/

function NewPart(part, defaults, defaultBeat, debug) {
	let mutationCount = 0;
	let defaultBeatNum = +defaultBeat.slice(0, -1); // default beat number for math

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
		const loopNum = 1;
		for (let i = 0; i < loopNum; i++) {
			const currentBeat = defaultBeat;
			const melody = getBeats(currentBeat);
			loops.push({
				melody: melody,
				count: 0, // count through loop
				countEnd: melody.length - 1,
				beatCount: 1, // doubler param ... need this?
				harmony: 0, // default tonic
			});
		}
		return loops;
	}

	return { get };
}