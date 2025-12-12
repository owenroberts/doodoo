import '../css/composer.scss';

import { Doodoo } from '../../src/doodoo.js';
import { FileManager } from '../../src/file-manager.js';
import { getDate } from '../../../cool/cool.js';

import { Interface, Settings } from '../../../oi/src/oi.js';

import { CompositionPanel } from './composition.js';
import { FilesPanel } from './files.js';
import { VersionsPanel } from './versions.js';
import { PlaybackPanel } from './playback.js';
import { MelodyPanel } from './melody.js';
import { MonitorPanel } from './monitor.js';
import { MeterPanel } from './meter.js';
import { ModulatorsPanel } from './modulators.js';
import { ModEditorPanel } from './mod-editor.js';
import { StartLoopsPanel } from './start-loops.js';
import { LivePanel } from './live.js';
// import { Score } from './Score.js';

import defaultWorkspace from '../workspaces/default.json';

const doodoo = new Doodoo({ 
	autoLoad: false, 
	autoPlay: false,
	isEditor: true, 
});

const ui = new Interface({ 
	name: 'doodoo',
	workspaces: [{
		text: 'default',
		url: defaultWorkspace,
	}],
});

const fm = new FileManager(doodoo);

ui.addPanel(new CompositionPanel(doodoo, ui));
ui.addPanel(new FilesPanel(fm, ui));
ui.addPanel(new VersionsPanel(fm, ui));
ui.addPanel(new PlaybackPanel(doodoo, ui));
ui.addPanel(new MelodyPanel(doodoo, ui));
ui.addPanel(new MonitorPanel(doodoo, ui));
ui.addPanel(new MeterPanel(doodoo, ui));
ui.addPanel(new ModulatorsPanel(doodoo, ui));
ui.addPanel(new ModEditorPanel(doodoo, ui));
ui.addPanel(new StartLoopsPanel(doodoo, ui));
ui.addPanel(new LivePanel(doodoo, ui));
// app.score = Score(app);

ui.settings.load();

console.log({ doodoo, ui });