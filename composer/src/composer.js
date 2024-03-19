// getting global objects into iife
import { MIDI_NOTES } from '../../src/Midi.js';
import { DoodooProps } from '../../src/Properties.js';
// import '../../build/ui.min.js'; // skip UI for now ... 
// const { Interface, Settings } = UI;
import { Interface, Settings } from '../../../ui/src/UI.js';

import { Composition } from './Composition.js';
import { FilesIO } from './FilesIO.js';
import { Melody } from './Melody.js';
import { Meter } from './Meter.js';
import { Modulators } from './Modulators.js';
import { Monitor } from './Monitor.js';
import { Playback } from './Playback.js';
import { Score } from './Score.js';
import { StartLoops } from './StartLoops.js';

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
app.modulators = new Modulators(app, DoodooProps);
app.startLoops = new StartLoops(app, DoodooProps);

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

// console.log('app', app);