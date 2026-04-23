import '../../composer/css/composer.scss';

import { Doodoo } from '../../src/doodoo.js';
import { DoodooFiles } from '../../src/doodoo-files.js';

import { Interface, Settings } from '../../../oi/src/oi.js';

import { FilesPanel } from './files.js';
import { PlaybackPanel } from './playback.js';
import { LivePanel } from './live.js';
import { SamplerPanel } from './sampler.js';

// no changes needed here ... 
import { MonitorPanel } from '../../composer/src/monitor.js';
import { MeterPanel } from '../../composer/src/meter.js';

// import defaultWorkspace from '../workspaces/default.json';

const doodoo = new Doodoo({ 
	autoLoad: false, 
	autoPlay: false,
	// isEditor: true,
});
const fm = new DoodooFiles(doodoo);

const ui = new Interface({ 
	name: 'greg-live',
	// workspaces: [{
		// text: 'default',
		// url: defaultWorkspace,
	// }],
});

ui.addPanel(new FilesPanel(fm, ui));
ui.addPanel(new PlaybackPanel(doodoo, ui));
ui.addPanel(new MonitorPanel(doodoo, ui));
ui.addPanel(new MeterPanel(doodoo, ui));
ui.addPanel(new LivePanel(doodoo, ui));
ui.addPanel(new SamplerPanel(doodoo, ui, fm));

ui.settings.load();

console.log({ doodoo, ui, fm });