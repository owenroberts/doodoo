// getting global objects into iife
const { MIDI_NOTES } = DoodooMidi;
const { defaults, controls } = DoodooControls;
const { Interface, Settings } = UI;
const { UICollection, UIButton, UILabel, UINumberStep, UIListStep, UIChance, UINumberList } = UI.Elements;

const app = {};
const compDefaults = {
	title: 'Doodoo_' + new Date().toDateString().replace(/ /g, '-'),
	tonic: 'C4', // def to transform ...
	scale: [0, 2, 4, 5, 7, 9, 11],
	duration:  '4n',
	bpm: 120,
	voices: ['choir', 'toms']
};

app.controls = new Controls(app, defaults, controls); // doodoo defaults control
app.composition = new Composition(app, compDefaults);

app.ui = Interface(app, {
	useMain: true,
	name: 'doodoo',
	workspaceFields: ['noteWidth'],
});

app.fio = new FilesIO(app);
app.score = new Score(app);

app.ui.load('./interface/panels.json', () => {
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

	app.score.init();
});

console.log('app', app);
