import '../css/composer.scss';

import { Doodoo } from '../../src/doodoo.js';
import { getDate } from '../../../cool/cool.js';

import { Interface, Settings } from '../../../ui/src/UI.js';

import { CompositionPanel } from './Composition.js';
import { FilesIO } from './FilesIO.js';
import { Melody } from './Melody.js';
import { Meter } from './Meter.js';
import { Modulators } from './Modulators.js';
import { ModEditor } from './ModEditor.js';
import { Monitor } from './Monitor.js';
import { Playback } from './Playback.js';
import { Score } from './Score.js';
import { StartLoops } from './StartLoops.js';
import { Live } from './Live.js';

import DefaultWorkspace from '../workspaces/Default.json';

const app = {
	doodoo: new Doodoo({ 
		autoLoad: false, 
		autoPlay: false,
		isEditor: true, 
	}),
};

app.ui = new Interface(app, { useMain: true });
// app.ui.setup();
app.ui.addPanel(new CompositionPanel(app));
// app.playback = Playback(app);
// app.melody = Melody(app, comp);
// app.fio = FilesIO(app);
// app.score = Score(app);
// app.meter = Meter(app);
// app.monitor = Monitor(app);
// app.modulators = Modulators(app, defaults);
// app.modEditor = ModEditor(app);
// app.startLoops = StartLoops(app, defaults);
// app.live = Live(app);

// app.fio.connect();
// app.melody.connect();
// app.playback.connect();
// app.score.connect();
// app.meter.connect();
// app.monitor.connect();
// app.modulators.connect();
// app.modEditor.connect();
// app.startLoops.connect();
// app.live.connect();

app.ui.settings = Settings(app, {
	name: 'doodoo',
	workspaceFields: ['noteWidth'],
	workspaces: [{
		text: 'Default',
		url: DefaultWorkspace,
	}]
});
app.ui.settings.load(); // wtf -- load settings and shit ...
// app.composition.load({});
// app.score.draw([]);

console.log('app', app);