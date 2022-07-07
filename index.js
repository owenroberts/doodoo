const { Doodoo, MIDI_NOTES } = doodooLib; // import lib
const doodooDiv = document.getElementById('doodoos');
let doodoo; // there's only ever one doodoo

// debugging controls
document.addEventListener('keydown', ev => {
	if (ev.target.tagName == "INPUT") return;
	if (ev.key === 'a') doodoo.play();
	if (ev.key === 's') doodoo.stop();
	if (ev.key === 'd') doodoo.mutate();
	if (ev.key === 'f') doodoo.printLoops(); // debug
	if (ev.key === 'r') doodoo.record();
	if (ev.key === 'c') console.log(composition);
});

// examples
const compUrls = ['infinite_hell.json', 'garden.json', 'infinite_hell_2.json', 'zoo.json'];
const comps = [];
function loadCompositions() {
	compUrls.forEach(url => {
		const comp = fetch(`./compositions/${url}`)
			.then(res => res.json())
			.then(json => {
				createCompUI(json);
			});
	});
}
loadCompositions();

function createCompUI(comp) {

	
	const div = document.createElement('p');
	div.classList.add('comp');
	doodooDiv.appendChild(div);

	const title = document.createElement('span');
	title.textContent = comp.title;
	div.appendChild(title);

	const playBtn = document.createElement('button');
	const recordBtn = document.createElement('button');
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
	recordBtn.textContent = 'Record';
	stopBtn.textContent = 'Stop';
	mutateBtn.textContent = 'Mutate';

	div.appendChild(playBtn);
	div.appendChild(recordBtn);
	div.appendChild(stopBtn);
	div.appendChild(mutateBtn);
	div.appendChild(synthSelect);

	playBtn.addEventListener('click', () => { play(false); })
	recordBtn.addEventListener('click', () => { play(true); })
	stopBtn.addEventListener('click', ev => {
		doodoo.stop();
	});
	mutateBtn.addEventListener('click', () => {
		doodoo.mutate();
	});

	function play(withRecording) {
		if (!doodoo) {
			doodoo = new Doodoo({ ...comp, samples: samples, withRecording: withRecording });
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
}

// comp controls

const composition = {
	title: 'Doodoo_' + new Date().toDateString().replace(/ /g, '-'),
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

const playCompBtn = document.getElementById('play-comp');
const recordCompBtn = document.getElementById('record-comp');
const stopCompBtn = document.getElementById('stop-comp');
const saveCompBtn = document.getElementById('save-comp');
const loadCompInput = document.getElementById('load-file');
const loadCompBtn = document.getElementById('load-comp');
const mutateCompBtn = document.getElementById('mutate-comp');
const mutateCount = document.getElementById('mutation-count');

const notes = document.getElementsByClassName('note');
const tonicInput = document.getElementById('tonic');
const bpmInput = document.getElementById('bpm');
const synthSelect = document.getElementById('synth-select');
const noteDurationSelect = document.getElementById('note-duration');
const scaleInputs = document.getElementsByClassName('scale-input');
const melodyInput = document.getElementById('melody-input');
const durationInput = document.getElementById('duration-input');
const addNoteBtn = document.getElementById('add-note');
const melodyComp = document.getElementById('comp-melody');
const clearCompBtn = document.getElementById('clear-comp');

loadCompBtn.addEventListener('click', loadComp);
saveCompBtn.addEventListener('click', saveCompFile);

function loadComp() {
	for (let i = 0, f; f = loadCompInput.files[i]; i++) {
		if (!f.type.match('application/json')) continue;
		const reader = new FileReader();
		reader.onload = (function(file) {
			return function(e) {
				const data = JSON.parse(e.target.result);
				loadCompData(data);
			}
		})(f);
		reader.readAsText(f);
	}
}

function loadCompData(data) {
	for (const k in data) {
		composition[k] = data[k];
	}

	if (data.tonic) {
		tonicInput.value = typeof data.tonic === 'string' ? data.tonic :
			getMIDINote(data.tonic);
	}
	if (data.startDuration) noteDurationSelect.value = data.startDuration;
	if (data.scale) data.scale.forEach((index, interval) => {
		scaleInputs[index] = interval;
	});
	if (data.title) composition.title = data.title;

	melodyComp.innerHTML = '';

	if (typeof data.parts[0] === 'object') {
		if (data.parts.length === 1) {
			// one part, most cases
			composition.parts = data.parts[0];
		}
	}

	composition.parts.forEach(part => {
		if (typeof part === 'string') {
			addNote(part, composition.startDuration);
		} else {
			addNote(...part);
		}
	});
}

if (localStorage.getItem('comp')) {
	loadCompData(JSON.parse(localStorage.getItem('comp')));
}

function saveComp() {
	updateComp();
	localStorage.setItem('comp', JSON.stringify(composition));
}

function saveCompFile() {
	saveComp();
	const json = localStorage.getItem('comp');
	const blob = new Blob([json], { type: 'application/x-download;charset=utf-8' });
	saveAs(blob, prompt("Name composition", composition.title) + '.json');
}

function midiFormat(note) {
	if (note.length === 1 || note.length > 3) return false;
	let letter = note[0].toUpperCase();
	let number = note[note.length - 1];
	let sharp = note.includes('#') ? '#' : '';

	if (isNaN(+number) || !'ABCDEFG'.includes(letter)) {
		return false;
	}

	return letter + sharp + number;
}

function getMIDINote(noteIndex) {
	return MIDI_NOTES[noteIndex];
}

playCompBtn.addEventListener('click', () => { playComp(false); });
recordCompBtn.addEventListener('click', () => { playComp(true); });

function updateComp() {
	let badFormatting = false;
	composition.parts = [Array.from(notes).map(n => {
		let { note, duration } = n.dataset;
		let noteFormatted;

		if (['null', 'rest'].includes(note)) {
			noteFormatted = null;
		} else {
			noteFormatted = midiFormat(note);
			if (!noteFormatted) badFormatting = true;
		}

		if (duration.length > 3) badFormatting = true;
		if (isNaN(+duration[0])) badFormatting = true;
		if (duration.length === 1) duration += 'n';

		return [noteFormatted, duration];
	})];

	if (badFormatting) return alert('use notes in MIDI format like C4 or C#4, durations like 1n, 2n, 4n, 8n, etc.');

	composition.scale = Array.from(scaleInputs).map(n => n.value);
	
	composition.tonic = midiFormat(tonicInput.value || tonicInput.placeholder) || tonicInput.placeholder;
	tonicInput.value = composition.tonic;
	composition.bpm = (bpmInput.value > 60 && bpmInput.value < 200) ? bpmInput.value || 120 : 120;
	bpmInput.value = composition.bpm;

	composition.samples = synthSelect.value;
	composition.startDuration = noteDurationSelect.value;
}

function playComp(withRecording) {
	if (Array.from(notes).length === 0) return alert('add some notes to the melody');
	
	updateComp();

	if (doodoo) {
		doodoo.stop();
		Tone.Transport.cancel();
	}
	doodoo = new Doodoo({ ...composition, withRecording: withRecording });
	saveComp();
	// doodoo.play();
}

noteDurationSelect.addEventListener('change', ev => {
	composition.startDuration = noteDurationSelect.value;
	durationInput.placeholder = noteDurationSelect.value;
	saveComp();
});

stopCompBtn.addEventListener('click', () => {
	doodoo.stop();
});

mutateCompBtn.addEventListener('click', () => {
	doodoo.mutate();
});

clearCompBtn.addEventListener('click', ev => {
	melodyComp.innerHTML = '';
});

addNoteBtn.addEventListener('click', () => { addNote(); });
function addNote(_note, _duration) {
	let note = _note || melodyInput.value || melodyInput.placeholder;
	let duration = _duration || durationInput.value || composition.startDuration;

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
	saveComp();
}
