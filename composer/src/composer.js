import '../css/composer.scss';

import { MIDI_NOTES } from '../../src/Midi.js';
import { DoodooProps } from '../../src/Properties.js';
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
import { getDate } from '../../../cool/cool.js';

import DefaultWorkspace from '../workspaces/Default.json';

const app = {};
const comp = {
	title: 'Doodoo_' + getDate(),
	tonic: 'C4', // def to transform ...
	scale: [0, 2, 4, 5, 7, 9, 11],
	beat:  '4n',
	bpm: 120,
	instruments: ['choir']
}; // composition defaults

app.composition = Composition(app, comp);
app.playback = Playback(app);
app.melody = Melody(app, comp);
app.fio = FilesIO(app);
app.score = Score(app);
app.meter = Meter(app);
app.monitor = Monitor(app);
app.modulators = Modulators(app, DoodooProps);
app.startLoops = StartLoops(app, DoodooProps);

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
		url: DefaultWorkspace,
	}]
});
app.ui.settings.load(); // wtf -- load settings and shit ...
app.composition.load({});
app.score.draw([]);

console.log('app', app);