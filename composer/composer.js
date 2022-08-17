const { Doodoo, MIDI_NOTES, doodooDefaults, doodooDefaultParams } = doodooLib; // import lib

window.addEventListener("load", function() {

	const app = {};
	app.MIDI_NOTES = MIDI_NOTES;

	const compDefaults = {
		title: 'Doodoo_' + new Date().toDateString().replace(/ /g, '-'),
		tonic: 'C4',
		scale: [0, 2, 4, 5, 7, 9, 11],
		startDuration:  '4n',
		bpm: 120,
		samples: "../samples/choir/"
	};
	// app.doodoo = new Doodoo(defaults);
	app.params = new Params(app, doodooDefaults, doodooDefaultParams); // doodoo params control
	app.composition = new Composition(app, compDefaults);

	app.ui = new Interface(app, {
		useMain: true
	});
	
	
	app.ui.settings = new Settings(app, 'doodoo');
	app.fio = new FilesIO(app);
	
	app.ui.load('./interface.json', () => {
		app.ui.settings.load();
		app.composition.init();
		app.params.init();

		const compData = localStorage.getItem('comp');
		if (compData && compData !== 'undefined'){
			const data = JSON.parse(compData);
			app.composition.load(data);
			app.params.load(data.params);
		} else {
			app.composition.load({});
			app.params.load();
		}

	});

	console.log(app);
});


/*


loadCompBtn.addEventListener('click', loadComp);
saveCompBtn.addEventListener('click', saveCompFile);

playCompBtn.addEventListener('click', () => { playComp(false); });
recordCompBtn.addEventListener('click', () => { playComp(true); });

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



*/