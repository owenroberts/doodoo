import { choice, coinFlip } from '../../cool/cool.js';

const debug = false;
const MIDI_NOTES = [
	"C_1", "C#_1", "D_1", "D#_1", "E_1", "F_1", "F#_1", "G_1", "G#_1", "A_1", "A#_1", "B_1",
	"C0", "C#0", "D0", "D#0", "E0", "F0", "F#0", "G0", "G#0", "A0", "A#0", "B0",
	"C1", "C#1", "D1", "D#1", "E1", "F1", "F#1", "G1", "G#1", "A1", "A#1", "B1",
	"C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2",
	"C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
	"C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
	"C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
	"C6", "C#6", "D6", "D#6", "E6", "F6", "F#6", "G6", "G#6", "A6", "A#6", "B6",
	"C7", "C#7", "D7", "D#7", "E7", "F7", "F#7", "G7", "G#7", "A7", "A#7", "B7",
	"C8", "C#8", "D8", "D#8", "E8", "F8", "F#8", "G8", "G#8", "A8", "A#8", "B8",
	"C9", "C#9", "D9", "D#9", "E9", "F9", "F#9", "G9"
];

const MIDI_RANGE = [12, 83]; // 83 is B5 -- should set locally ??

function constrainNoteRange(midiNoteNum) {
	if (debug && (midiNoteNum < MIDI_RANGE[0] || midiNoteNum > MIDI_RANGE[1])) {
		console.log('** constrain **', midiNoteNum, MIDI_RANGE[0], MIDI_RANGE[1]);
	}

	while (midiNoteNum < MIDI_RANGE[0]) {
		midiNoteNum += 12;
	}
	while (midiNoteNum > MIDI_RANGE[1]) {
		midiNoteNum -= 12;
	}
	return midiNoteNum;
}

function getMelody(melody, tonic, transpose, scale) {
	return melody.map(note => {
		if (note[0] === null || note[0] == 'rest') { return note; }
		else {
			const pitch = note[0];
			const midiTonic = MIDI_NOTES.indexOf(tonic);
			const midiTranspose = MIDI_NOTES.indexOf(transpose);
			const tonicDelta = midiTonic - midiTranspose;
			const midiPitch = MIDI_NOTES.indexOf(pitch) - tonicDelta;
			note[0] = MIDI_NOTES[constrainNoteRange(midiPitch)];
			return note;
		}
	});
}

function getHarmony(melody, tonic, transpose, interval, scale, useOctave=false, harmonyScaleOnly=true) {
	return melody.map(note => {
		if (note[0] === null || note[0] == 'rest') { return note; }
		else {
			const pitch = note[0];
			const midiPitch = MIDI_NOTES.indexOf(pitch);
			const midiTonic = MIDI_NOTES.indexOf(tonic);
			const midiTranspose = MIDI_NOTES.indexOf(transpose);
			const tonicDelta = midiTonic - midiTranspose; // change in key
			const diff = midiPitch - midiTonic;
			
			// differences in octaves (C4 comes before B4)
			const octaveDiff = (Math.floor(midiPitch / 12) - Math.floor(midiTonic / 12)) * 12; 
			// should this be just C4 not midiTonic? (seems to work fine)

			let scaleIndex = getScaleIndex(pitch, tonic, scale);

			// add harmony interval to index, accounting for scale length
			let midiHarmony = scale[(scaleIndex + interval - 1) % scale.length]; // harmony in scale

			// if note is not in scale
			if (scaleIndex === -1) {
				// console.log({harmonyScaleOnly})
				// test -- what do do here? find closest in scale or just interval
				// up or down?
				
				let closest = 12;
				let newIndex = 0;
				for (let i = 0; i < scale.length; i++) {
					let int = Math.abs(midiPitch - (midiTonic + scale[i]));
					if (int < closest) {
						closest = int;
						newIndex = i;
					}
				}
				midiHarmony = scale[(newIndex + interval - 1) % scale.length];
					
				if (!harmonyScaleOnly) {
					// this is actually goofy as fuck but whatever
					midiHarmony += midiPitch - (midiTonic + scale[newIndex]);
				}
			}
			
			if (useOctave) {
				// add 12 * index n above the scale 
				midiHarmony += Math.floor((scaleIndex + interval - 1) / scale.length) * 12;
			}

			// over 1 octave above or below
			let offset = Math.floor(Math.abs(diff) / 12) * 12 * Math.sign(diff); 
			let returnMidi = MIDI_NOTES.indexOf(tonic) + midiHarmony + offset - tonicDelta + octaveDiff;
			note[0] = (MIDI_NOTES[constrainNoteRange(returnMidi)])
			return note;
		}
	});
}

function getTranspose(pitch, value) {
	return constrainNoteRange(MIDI_NOTES[MIDI_NOTES.indexOf(pitch) + value]);
}

// get difference between two pitches
function getMidiDelta(a, b) {
	if (a === undefined) return 0;
	if (b === undefined) return 0;
	return MIDI_NOTES.indexOf(a) - MIDI_NOTES.indexOf(b);
}

// useful? (DRY w getHarmony?)
function getScaleIndex(pitch, tonic, scale) {
	const midiTonic = MIDI_NOTES.indexOf(tonic);
	const midiPitch = MIDI_NOTES.indexOf(pitch);
	const diff = midiPitch - midiTonic; // difference between note and tonic
	if (Math.abs(diff) % 12 === 0) {
		return 0;
	}
	const scaleIndex = diff < 0 ?
		scale.indexOf(12 - (Math.abs(diff) % 12)) : // below tonic
		scale.indexOf(diff % 12); // above tonic
	return scaleIndex;
}

function getOctave(pitch, tonic) {
	const midiTonic = MIDI_NOTES.indexOf(tonic);
	const midiPitch = MIDI_NOTES.indexOf(pitch);
	const pitchDiff = midiTonic - midiPitch;
	const octaveDiff = (Math.floor(midiPitch / 12) - Math.floor(midiTonic / 12)) * 12;
	const octaveOffset = Math.floor(Math.abs(pitchDiff) / 12) * 12 * Math.sign(pitchDiff);
	return octaveDiff + octaveOffset;
}

function getPitchFromInterval(pitch, tonic, scale, interval, debug) {
	if (interval === 0) return pitch;
	if (interval === 1) return pitch;
	if (interval === -1) return pitch;
	
	let midiNote = MIDI_NOTES.indexOf(pitch);
	let scaleIndex = getScaleIndex(pitch, tonic, scale);
	// get the scale degree and go one over (don't want to add current scale degree)
	if (interval > 0) {
		scaleIndex += 1;
		if (scaleIndex > scale.length - 1) {
			scaleIndex = 0;
		}
	}

	// get relative intervals
	let intervals = scale.map((n, i) => { 
		return i > 0 ? 
			n - scale[i-1] :
			// interval between 7 and 1, only used if starting going around scale
			12 - scale[scale.length - 1]; 
	}); 
	
	if (interval > 0) {
		// interval include the staring pitch, so -1
		for (let i = 0; i < interval - 1; i++) {
			// console.log(i, midiNote, MIDI_NOTES[midiNote]);
			midiNote += intervals[scaleIndex]; // add relative step of next interval
			scaleIndex++;
			if (scaleIndex > intervals.length - 1) {
				scaleIndex = 0;
			}
			// console.log(i, midiNote, MIDI_NOTES[midiNote]);
		}
	} else {
		for (let i = 0; i < Math.abs(interval) - 1; i++) {
			midiNote -= intervals[scaleIndex];
			scaleIndex--;
			if (scaleIndex < 0) {
				scaleIndex = intervals.length - 1;
			}
		}
	}

	return MIDI_NOTES[constrainNoteRange(midiNote)];
}

function getCounterpoint(melody, tonic, scale) {
	const counterpoint = [];
	let prevCounterpointPitch;
	let prevMelodyPitch;
	let prevLeap;
	let highestPitch;
	let pitchIndex = 0;

	for (let i = 0; i < melody.length; i++) {
		const [pitch, beat] = melody[i];
		// console.log(pitch, beat);
		if (pitch === null || pitch === 'rest') {
			counterpoint[i] = [pitch, beat];
			continue;
		}

		let interval = 1;
		let counterpointPitch;

		if (pitchIndex === 0) {
			interval = choice([5, 8, 10]); // V, octave, III
			counterpointPitch = getPitchFromInterval(pitch, tonic, scale, interval);
			// console.log({ counterpointPitch, pitch, tonic, scale, interval });
			highestPitch = getPitchFromInterval(pitch, tonic, scale, 10);
			prevLeap = 0;
		} else {
			let options = [-2, -3, -4, -5, -6, -7, -8, 1, 2, 3, 4, 5, 6, 7, 8]; // scale degrees

			// maybe rewrite, use filters to remove options for each rule, then check for optoins left
			const prevCounterScaleDegree = getScaleIndex(prevCounterpointPitch, tonic, scale);
			
			const melScaleDegree = getScaleIndex(pitch, tonic, scale);
			const prevMelScaleDegree = getScaleIndex(prevMelodyPitch, tonic, scale);
			const melMotion = melScaleDegree - prevMelScaleDegree;

			for (let i = options.length - 1; i >= 0; i--) {
				if (options.length < 2) continue; // stop removing if only one option left

				const potentialInterval = options[i];
				const potentialPitch = getPitchFromInterval(prevCounterpointPitch, tonic, scale, potentialInterval);
				const potentialScaleDegree = getScaleIndex(potentialPitch, tonic, scale);
				const counterMotion = potentialScaleDegree - prevCounterScaleDegree;
				const melInterval = Math.abs(potentialScaleDegree - melScaleDegree) - 1;

				// don't go below melody (or same)
				if (MIDI_NOTES.indexOf(potentialPitch) <= MIDI_NOTES.indexOf(pitch)) {
					// console.log('below mel', potentialInterval, potentialPitch, pitch);
					options.splice(i, 1);
					continue;
				}

				// prob don't go above 10 either right? but that's the original 10
				if (MIDI_NOTES.indexOf(potentialPitch) > MIDI_NOTES.indexOf(highestPitch)) {
					// console.log('above 10', potentialInterval, potentialPitch, highestPitch);
					options.splice(i, 1);
					continue;
				}

				// avoid the most: direct parallel
				// same motion, same interval
				if (melMotion === counterMotion) {
					options.splice(i, 1);
					continue;
				}

				// no direction motion to perfect consonance 
				// 

				// no prev note 3x
				if (potentialPitch === prevCounterpointPitch && prevLeap === 0) {
					options.splice(i, 1);
					continue;
				}

				// no dissonant interval between counter point and melody
				// but has to be "unlocked" so i feel like its ok
				
				if ([2, 4, 7].includes(melInterval)) {
					// console.log('dissonant interval', potentialInterval, melInterval, potentialPitch, pitch);
					if (coinFlip()) options.splice(i, 1);
					continue;
				}

				// leaps recovered by stepwise motion
				// is this more important that contrary motion?
				let potentialLeap = MIDI_NOTES.indexOf(potentialPitch) - MIDI_NOTES.indexOf(prevCounterpointPitch);
				if (Math.abs(prevLeap) > 2 && Math.abs(potentialLeap) > 2) {
					// console.log('stepwise', potentialInterval, prevLeap, potentialLeap);
					if (coinFlip()) options.splice(i, 1);
					continue;
				}

				// direct similar: same direction different interval
				// same as contrary motion -- >
				// contrary motion best ... how to do this?
				// get melody motion, favor opposite intervals
				if (Math.sign(melMotion) === Math.sign(counterMotion)) {
					if ([5, 8].includes(melInterval) || coinFlip()) {
						// console.log('contrary motion', melMotion, counterMotion);
						options.splice(i, 1);
						continue;
					}
				}

				// avoid dissonant leaps (7, dim, aug)
				if (potentialInterval === Math.abs(7)) {
					// console.log('avoid 7');
					options.splice(i, 1);
					continue;
				}

				// avoid same note
				if (potentialInterval === 1) {
					options.splice(i, 1);
					continue;
				}
			}

			interval = choice(options);
			counterpointPitch = getPitchFromInterval(prevCounterpointPitch, tonic, scale, interval);
			prevLeap = MIDI_NOTES.indexOf(counterpointPitch) - MIDI_NOTES.indexOf(prevCounterpointPitch);
			// console.log({ options: options.join(','), interval, prev: prevCounterpointPitch, counter: counterpointPitch });

			if (counterpointPitch === undefined || counterpointPitch.includes('0')) {
				console.log({ options });
				console.log({ counterpointPitch, prevCounterpointPitch, tonic, scale, interval });
			}

		}
		
		counterpoint[i] = [counterpointPitch, beat];
		
		prevMelodyPitch = pitch;
		prevCounterpointPitch = counterpointPitch;
		pitchIndex++;
	}
	return counterpoint;
}

export { MIDI_NOTES, MIDI_RANGE, constrainNoteRange, getMelody, getHarmony, getTranspose, getMidiDelta, getCounterpoint };