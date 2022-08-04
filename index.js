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

