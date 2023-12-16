// getting global objects into iife
const { MIDI_NOTES } = DoodooMidi;
const { defaults, controls } = DoodooControls;
const { props } = DoodooProps;
const { Interface, Settings } = UI;
const { UIElement, UICollection, UIButton, UILabel, UINumberStep, UIListStep, UIChance, UINumberList, UISelectButton, UIText, UIRow, UIToggleCheck, UIFile, UIInput, UIInputList, UITree, UIToggleGrid, UISelect } = UI.Elements;

const app = {};
const comp = {
	title: 'Doodoo_' + new Date().toDateString().replace(/ /g, '-'),
	tonic: 'C4', // def to transform ...
	scale: [0, 2, 4, 5, 7, 9, 11],
	beat:  '4n',
	bpm: 120,
	instruments: ['choir']
}; // composition defaults

app.controls = new Controls(app, defaults, controls); // doodoo defaults control
app.composition = new Composition(app, comp);
app.playback = new Playback(app);
app.melody = new Melody(app, comp);
app.fio = new FilesIO(app);
app.score = new Score(app);
app.meter = new Meter(app);
app.modulators = new Modulators(app, props);

app.ui = Interface(app, { useMain: true });
app.ui.setup();
app.fio.connect();
app.composition.connect();
app.melody.connect();
app.playback.connect();
app.score.connect();
app.controls.connect();
app.meter.connect();
app.modulators.connect();

app.ui.settings = Settings(app, {
	name: 'doodoo',
	workspaceFields: ['noteWidth'],
	workspaces: [{
		text: 'Default',
		url: 'workspaces/Default.json',
	}]
});
app.ui.settings.load(); // wtf -- load settings and shit ...
app.composition.load({});
app.controls.load();
app.score.draw([]);

// console.log(app);