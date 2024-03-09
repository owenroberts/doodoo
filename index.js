window.addEventListener("load", function() {
	const doodooDiv = document.getElementById('doodoos');
	let doodoo; // there's only one doodoo

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
				.then(json => { createCompUI(json); })
				.catch(err => { console.log('my err', err); });
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
		const modulateBtn = document.createElement('button');

		let voice = 'choir';
		const synthSelect = document.createElement('select');
		const choirOption = document.createElement('option');
		const synthOption = document.createElement('option');

		synthSelect.appendChild(choirOption);
		synthSelect.appendChild(synthOption);

		choirOption.textContent = 'Choir';
		choirOption.value = 'choir';

		synthOption.textContent = 'FMSynth';
		synthOption.value = 'fmSynth';

		synthSelect.addEventListener('change', ev => {
			voice = synthSelect.value;
		});

		playBtn.textContent = 'Play';
		recordBtn.textContent = 'Record';
		stopBtn.textContent = 'Stop';
		modulateBtn.textContent = 'Modulate';

		div.appendChild(playBtn);
		div.appendChild(recordBtn);
		div.appendChild(stopBtn);
		div.appendChild(modulateBtn);
		div.appendChild(synthSelect);

		playBtn.addEventListener('click', () => { play(false); })
		recordBtn.addEventListener('click', () => { play(true); })
		stopBtn.addEventListener('click', ev => {
			doodoo.stop();
		});
		modulateBtn.addEventListener('click', () => {
			doodoo.modulate();
		});

		function play(withRecording) {
			if (!doodoo) {
				doodoo = new Doodoo({ 
					...comp, 
					voices: [voice], 
					withRecording: withRecording,
					samplesURL: location.href.includes('doodoo') ?  './samples/' : './samples/doodoo/',
				});
				doodoo.title = comp.title;
			} else if (doodoo.title !== comp.title) {
				doodoo.stop();
				Tone.Transport.cancel();
				doodoo = new Doodoo({ ...comp, voices: [voice] });
				doodoo.title = comp.title;
			} else {
				doodoo.play()
			}
		}
	}
});

