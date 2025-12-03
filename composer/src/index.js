import '../css/composer.scss';

import { Doodoo } from '../../src/doodoo.js';
import { getDate } from '../../../cool/cool.js';

import { Interface, Settings } from '../../../ui/src/oi.js';

import { CompositionPanel } from './composition.js';
import { FilesPanel } from './files.js';
import { PlaybackPanel } from './playback.js';
import { MelodyPanel } from './melody.js';
import { MonitorPanel } from './monitor.js';
import { MeterPanel } from './meter.js';
import { ModulatorsPanel } from './modulators.js';
import { ModEditorPanel } from './mod-editor.js';

// import { StartLoops } from './StartLoops.js';
// import { Live } from './Live.js';
// import { Score } from './Score.js';

import DefaultWorkspace from '../workspaces/Default.json';

const app = {
	doodoo: new Doodoo({ 
		autoLoad: false, 
		autoPlay: false,
		isEditor: true, 
	}),
};

app.ui = new Interface(app, { 
	useMain: true,
	settings: {
		name: 'doodoo',
		workspaceFields: ['noteWidth'],
		workspaces: [{
			text: 'Default',
			url: DefaultWorkspace,
		}]
	}
});

// app.ui.setup();

app.ui.addPanel(new CompositionPanel(app));
app.ui.addPanel(new FilesPanel(app));
app.ui.addPanel(new PlaybackPanel(app));
app.ui.addPanel(new MelodyPanel(app));
app.ui.addPanel(new MonitorPanel(app));
app.ui.addPanel(new MeterPanel(app));
app.ui.addPanel(new ModulatorsPanel(app));
app.ui.addPanel(new ModEditorPanel(app));

// app.startLoops = StartLoops(app, defaults);
// app.live = Live(app);
// app.score = Score(app);

app.ui.settings.load(); // wtf -- load settings and shit ...
// app.composition.load({});
// app.score.draw([]);

console.log('app', app);