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
		if (note[0] === null) { return note; }
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

function getHarmony(melody, tonic, transpose, interval, scale, useOctave=false) {
	return melody.map(note => {
		if (note[0] === null) { return note; }
		else {
			const pitch = note[0];
			const midiPitch = MIDI_NOTES.indexOf(pitch);
			const midiTonic = MIDI_NOTES.indexOf(tonic);
			const midiTranspose = MIDI_NOTES.indexOf(transpose);
			const tonicDelta = midiTonic - midiTranspose; // change in key
			const octave = (Math.floor(midiPitch / 12) - Math.floor(midiTonic) / 12) * 12; // differences in octaves (C4 comes before B4)

			const diff = midiPitch - midiTonic; // difference between note and tonic
			const scaleIndex = diff < 0 ?
				scale.indexOf(12 - (Math.abs(diff) % 12)) : // below tonic
				scale.indexOf(diff % 12); // above tonic


			let midiHarmony = scale[(scaleIndex + interval - 1) % scale.length]; // harmony in scale
			
			if (useOctave) midiHarmony += Math.floor((scaleIndex + interval - 1) / scale.length) * 12;

			if (scaleIndex === -1) {
				console.log('not in scale');
				// test -- what do do here? find closest in scale or just interval
				midiHarmony = 0;
			}

			let offset = Math.floor(Math.abs(diff) / 12) * 12 * Math.sign(diff); // 1+ octave above or below
			let returnMidi = MIDI_NOTES.indexOf(tonic) + midiHarmony + offset - tonicDelta + octave;
			note[0] = (MIDI_NOTES[constrainNoteRange(returnMidi)])
			return note;
		}
	});
}

window.DoodooMidi = { MIDI_NOTES };