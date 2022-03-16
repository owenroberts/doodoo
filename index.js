const { Doodoo } = doodooLib; // import lib

// examples
const infiniteHell = {
	title: 'Infinite Hell',
	tonic: 54,
	parts: ['C4', 'A3', 'G3', 'D4', 'E4', 'G4', 'A4', 'C5', 'C4', 'D5', 'C5', 'D5'],
	startDuration: '4n',
	samples: './samples/choir/', // -- add samples for sampler
	bpm: 112
};

const garden = {
	title: 'Garden',
	tonic: 'C#4',
	parts: [
		'C4', null, 'E3', 'F3', 'G3', null, 'D3', 'E3', 
		'D3', 'F3', 'E3', 'D3', 'F3', 'E3', 'D3', 'F3', 
	],
	samples: './samples/choir/',
};

const infiniteHell2 = {
	title: 'Infinite Hell 2',
	tonic: 'F#4',
	scale: [-4, -2, 0, 1, 3, 5, 7],
	startDuration: '8n',
	samples: './samples/choir/',
	bpm: 120,
	parts: [[
		['F#5', '2n'], [null, '4n'], [null, '8n'], ['C#5', '8n'],
		['D5', '8n'], ['E5', '8n'], ['F#5', '8n'], ['D5', '8n'], 
		['E5', '8n'], ['F#5', '8n'], ['A5', '8n'], ['E5', '8n'], 
		['F#5', '8n'], ['G5', '8n'], ['B5', '8n'], [null, '8n'], 
		['B5', '4n'], ['F#5', '4n'], ['D5', '4n'], ['B4', '4n'], 
		['D4', '2n'], [null, '4n'], ['F#5', '4n'], ['D5', '4n'], 
		['G4', '8n'], ['A4', '8n'], ['B4', '4n'], ['D5', '8n'], 
		['D5', '8n'], ['F#4', '8n'], ['D4', '8n'], ['D4', '8n'], 
		['D5', '8n'], ['F#4', '8n'], ['D4', '2n'],
	]]
};

const zoo = {
	title: 'Zoo',
	tonic: 'C#4', 
	startDuration: '8n',
	bpm: 138,
	samples: './samples/choir/',
	parts: [[
		['C#6', '2n'], ['D#6', '2n'], 
		[null, '2n'], [null, '8n'], ['A#5', '8n'], ['G#5', '8n'], [null, '8n'],
		['C#6', '2n'], ['D#6', '2n'], 
		['E6', '2n'], [null, '4n'], ['B5', '8n'], ['A5', '8n'],
		['E6', '2n'], ['F#6', '2n'], 
		['G#6', '2n'], [null, '4n'], ['C#7', '8n'], ['D#7', '8n'], 
		['C#7', '4n'], [null, '8n'],  ['A#6', '4n'], ['G#6', '4n'], ['A#6', '8n'], 
		['G#6', '4n'], ['A#6', '8n'], ['G#6', '8n'], ['A#6', '8n'], ['G#6', '4n'], [null, '8n']
	]]			
};

const comps = [infiniteHell, garden, infiniteHell2, zoo];
const doodooDiv = document.getElementById('doodoos');
let doodoo;

// debugging
document.addEventListener('keydown', ev => {
	if (ev.target.tagName == "INPUT") return;
	if (ev.key === 'a') doodoo.play();
	if (ev.key === 's') doodoo.stop();
	if (ev.key === 'd') doodoo.mutate();
	if (ev.key === 'p') doodoo.printLoops(); // debug
});

comps.forEach(comp => {
	
	const div = document.createElement('p');
	div.classList.add('comp');
	doodooDiv.appendChild(div);

	const title = document.createElement('span');
	title.textContent = comp.title;
	div.appendChild(title);

	const playBtn = document.createElement('button');
	const stopBtn = document.createElement('button');
	const mutateBtn = document.createElement('button');

	let samples = './samples/choir/';
	const synthSelect = document.createElement('select');
	const choirOption = document.createElement('option');
	const synthOption = document.createElement('option');

	synthSelect.appendChild(choirOption);
	synthSelect.appendChild(synthOption);

	choirOption.textContent = 'Choir';
	choirOption.value = './samples/choir/';

	synthOption.textContent = 'FMSynth';
	synthOption.value = 'synth';

	synthSelect.addEventListener('change', ev => {
		samples = synthSelect.value;
	});

	playBtn.textContent = 'Play';
	stopBtn.textContent = 'Stop';
	mutateBtn.textContent = 'Mutate';

	div.appendChild(playBtn);
	div.appendChild(stopBtn);
	div.appendChild(mutateBtn);
	div.appendChild(synthSelect);

	playBtn.addEventListener('click', play);
	stopBtn.addEventListener('click', ev => {
		doodoo.stop();
	});
	mutateBtn.addEventListener('click', () => {
		doodoo.mutate();
	});

	function play() {
		if (!doodoo) {
			doodoo = new Doodoo({ ...comp, samples: samples });
			doodoo.title = comp.title;
		} else if (doodoo.title !== comp.title) {
			doodoo.stop();
			Tone.Transport.cancel();
			doodoo = new Doodoo({ ...comp, samples: samples });
			doodoo.title = comp.title;
		} else {
			doodoo.play()
		}
	}
});


const playCompBtn = document.getElementById('play-comp');
const stopCompBtn = document.getElementById('stop-comp');
const mutateCompBtn = document.getElementById('mutate-comp');
const mutateCount = document.getElementById('mutation-count');

// comp controls
const composition = {
	tonic: 'C4',
	scale: [0, 2, 4, 5, 7, 9, 11],
	startDuration:  '4n',
	bpm: 120,
	samples: 'synth',
	parts: [],
	onMutate: function(mutationCount) {
		mutateCount.textContent = 'Mutation: ' + mutationCount
	}
};


const notes = document.getElementsByClassName('note');
const tonicInput = document.getElementById('tonic');
const bpmInput = document.getElementById('bpm');
const synthSelect = document.getElementById('synth-select');
const noteDurationSelect = document.getElementById('note-duration');
const scaleInputs = document.getElementsByClassName('scale-input');

playCompBtn.addEventListener('click', () => {
	if (Array.from(notes).length === 0) return alert('add some notes to the melody');
	
	let badFormatting = false;

	composition.parts = [Array.from(notes).map(n => {
		let note = n.dataset.note;
		let letter, sharp, number, noteFormatted;
		if (note.length === 2) {
			[letter, number] = note;
			if (isNaN(+number) || !'ABCDEFG'.includes(letter.toUpperCase())) {
				badFormatting = true;
			}
			noteFormatted = [letter.toUpperCase(), number].join('')
		} else if (note.length === 3) {
			[letter, sharp, number] = note;
			if (isNaN(+number) || !'ABCDEFG'.includes(letter.toUpperCase())) {
				badFormatting = true;
			}
			noteFormatted = [letter.toUpperCase(), sharp, number].join('')
		} else if (note === 'null') {
			noteFormatted = 'null';
		} else {
			badFormatting = true;
		}
		
		return [noteFormatted, n.dataset.duration];
	})];

	if (badFormatting) return alert('use notes in MIDI format like C4 or C#4');

	composition.scale = Array.from(scaleInputs).map(n => n.value);
	composition.tonic = tonicInput.value || tonicInput.placeholder;
	composition.bpm = bpmInput.value || 120;
	composition.samples = synthSelect.value;
	composition.startDuration = noteDurationSelect.value;

	if (doodoo) {
		doodoo.stop();
		Tone.Transport.cancel();
	}
	doodoo = new Doodoo(composition);
	// doodoo.play();
});

noteDurationSelect.addEventListener('change', ev => {
	composition.startDuration = noteDurationSelect.value;
	durationInput.placeholder = noteDurationSelect.value;
});

stopCompBtn.addEventListener('click', () => {
	doodoo.stop();
});

mutateCompBtn.addEventListener('click', () => {
	doodoo.mutate();
});

const melodyInput = document.getElementById('melody-input');
const durationInput = document.getElementById('duration-input');
const addNoteBtn = document.getElementById('add-note');
const melodyComp = document.getElementById('comp-melody');
const clearCompBtn = document.getElementById('clear-comp');

clearCompBtn.addEventListener('click', ev => {
	melodyComp.innerHTML = '';
});

addNoteBtn.addEventListener('click', addNote);
function addNote() {
	let note = melodyInput.value || melodyInput.placeholder;
	let duration = durationInput.value || composition.startDuration;

	let span = document.createElement('span');
	span.classList.add('note');
	span.dataset.note = note;
	span.dataset.duration = duration;
	melodyComp.appendChild(span);
	
	let noteEdit = document.createElement('input');
	noteEdit.value = note;
	noteEdit.addEventListener('change', ev => {
		span.dataset.note = noteEdit.value;
	});

	let durationEdit = document.createElement('input');
	durationEdit.value = duration;
	durationEdit.addEventListener('change', ev => {
		span.dataset.duration = durationEdit.value;
	});
	
	let remove = document.createElement('button');
	remove.textContent = 'X';
	remove.addEventListener('click', ev => {
		span.remove();
	});

	span.appendChild(noteEdit);
	span.appendChild(durationEdit);
	span.appendChild(remove);
}
