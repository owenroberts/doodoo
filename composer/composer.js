// getting global objects into iife
const { MIDI_NOTES } = DoodooMidi;
const { defaults, controls } = DoodooControls;
const { Interface, Settings } = UI;
const { UIElement, UICollection, UIButton, UILabel, UINumberStep, UIListStep, UIChance, UINumberList, UISelectButton, UIText, UIRow } = UI.Elements;

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
app.fio = new FilesIO(app);
app.score = new Score(app);

app.ui = Interface(app, {
	useMain: true,
});
app.ui.setup();
app.fio.connectUI();
app.composition.connectUI();
app.controls.connectUI();
app.score.connectUI();

app.ui.settings = new Settings(app, {
	name: 'doodoo',
	workspaceFields: ['noteWidth'],
	workspaces: [{
		text: 'Default',
		url: '/composer/interface/workspaces/Default.json',
	}]
});
app.ui.settings.load(); // wtf -- load settings and shit ...

const compData = localStorage.getItem('comp');
if (compData && compData !== 'undefined'){
	const data = JSON.parse(compData);
	app.composition.load(data);
	app.controls.load(data.controls);
} else {
	app.composition.load({});
	app.controls.load();
}

app.score.draw([]);