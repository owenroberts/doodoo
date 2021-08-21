const debug = false;
const MIDI = [
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

const MIDI_RANGE = [12, 100];

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

function getMelody(melody, startNote) {
	return melody.map(beat => {
		const [note, duration] = beat;
		if (note === null) {
			return beat;
		} else {
			// interval based on start of melody (not key or tonic ...)
			// should i just add tonal or theoria or whatever?
			let midiNoteNum = MIDI.indexOf(startNote) + (MIDI.indexOf(note) - MIDI.indexOf(melody[0][0]));
			return [MIDI[constrainNoteRange(midiNoteNum)], duration];
		}
	});
}

function getHarmony(melody, startNote, interval, scale) {
	return melody.map(beat => {
		const [note, duration] = beat;
		if (note === null) {
			return beat;
		} else {
			const int = MIDI.indexOf(note) - MIDI.indexOf(melody[0][0]);
			// find where in the scale this note goes
			let offset = Math.floor(Math.abs(int) / 12) * 12 * (int < 0 ? -1 : 1);
			let idx = int < 0 ?
				scale.indexOf(12 - (Math.abs(int) % 12)) : // interval below tonic
				scale.indexOf(int % 12); // interval above tonic
			let harm = scale[(idx + interval - 1) % scale.length];
			let midiNoteNum = MIDI.indexOf(startNote) + harm + offset;
			return [MIDI[constrainNoteRange(midiNoteNum)], duration];
		}
	});
}

export { MIDI, getMelody, getHarmony };