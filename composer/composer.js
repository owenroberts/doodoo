const { Doodoo, MIDI_NOTES, doodooDefaults, doodooControls } = doodooLib; // import lib

window.addEventListener("load", function() {

	const app = {};
	app.MIDI_NOTES = MIDI_NOTES;

	const compDefaults = {
		title: 'Doodoo_' + new Date().toDateString().replace(/ /g, '-'),
		tonic: 'C4',
		scale: [0, 2, 4, 5, 7, 9, 11],
		duration:  '4n',
		bpm: 120,
		voices: ['choir', 'toms']
	};
	// app.doodoo = new Doodoo(defaults);
	app.controls = new Controls(app, doodooDefaults, doodooControls); // doodoo defaults control
	app.composition = new Composition(app, compDefaults);

	app.ui = new Interface(app, {
		useMain: true
	});
	
	const workspaceFields = [
		'noteWidth',
	];
	app.ui.settings = new Settings(app, 'doodoo', undefined, workspaceFields);
	app.fio = new FilesIO(app);
	
	app.ui.load('./interface/interface.json', () => {
		app.ui.settings.load();
		app.composition.init();
		app.controls.init();

		const compData = localStorage.getItem('comp');
		if (compData && compData !== 'undefined'){
			const data = JSON.parse(compData);
			app.composition.load(data);
			app.controls.load(data.controls);
		} else {
			app.composition.load({});
			app.controls.load();
		}

	});

	console.log(app);
});