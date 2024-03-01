// getting global objects into iife
const { MIDI_NOTES } = DoodooMidi;
const { props } = DoodooProps;
const { Interface, Settings } = UI;
const { UIElement, UICollection, UIButton, UILabel, UINumberStep, UIListStep, UIChance, UINumberList, UISelectButton, UIText, UIRow, UIToggleCheck, UIFile, UIInput, UIInputList, UITree, UIToggleGrid, UISelect, UIList, UIListAdd } = UI.Elements;

const app = {};
const comp = {
	title: 'Doodoo_' + new Date().toDateString().replace(/ /g, '-'),
	tonic: 'C4', // def to transform ...
	scale: [0, 2, 4, 5, 7, 9, 11],
	beat:  '4n',
	bpm: 120,
	instruments: ['choir']
}; // composition defaults

app.composition = new Composition(app, comp);
app.playback = new Playback(app);
app.melody = new Melody(app, comp);
app.fio = new FilesIO(app);
app.score = new Score(app);
app.meter = new Meter(app);
app.monitor = new Monitor(app);
app.modulators = new Modulators(app, props);
app.startLoops = new StartLoops(app, props);

app.ui = Interface(app, { useMain: true });
app.ui.setup();
app.fio.connect();
app.composition.connect();
app.melody.connect();
app.playback.connect();
app.score.connect();
app.meter.connect();
app.monitor.connect();
app.modulators.connect();
app.startLoops.connect();

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
app.score.draw([]);
// app.startLoops.load();

// console.log(app);