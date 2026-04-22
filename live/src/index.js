import '../../composer/css/composer.scss';

import { Doodoo } from '../../src/doodoo.js';
import { DoodooFiles } from '../../src/doodoo-files.js';

import { Interface, Settings } from '../../../oi/src/oi.js';

import { FilesPanel } from '../../composer/src/files.js';
import { PlaybackPanel } from '../../composer/src/playback.js';
import { MonitorPanel } from '../../composer/src/monitor.js';
import { MeterPanel } from '../../composer/src/meter.js';
import { LivePanel } from '../../composer/src/live.js';

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

ui.settings.load();

console.log({ doodoo, ui });