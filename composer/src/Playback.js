function Playback(app) {

	let doodoo;
	let useMetro = false;
	let modCountUI;

	function play(withRecording, withCount) {
		const comp = app.composition.get();
		if (comp.parts.every(p => p.length === 0)) return alert('Add notes to the melody.');

		if (doodoo) {
			doodoo.stop();
			Tone.Transport.cancel();
		}

		doodoo = new Doodoo({
			...comp,
			withRecording: withRecording,
			withCount: withCount,
			onModulate: count => {
				modCountUI.text = 'Modulation: ' + count;
				app.score.update(doodoo.getLoops());
			},
			useMetro: useMetro,
			useMeter: app.meter.isOpen(),
			setMeter: app.meter.setMeter,
			props: app.modulators.get(),
			startLoops: app.startLoops.get(),
			useDefaultProps: true,
		});
		app.fio.saveLocal(comp);
		app.score.update(doodoo.getLoops());
	}

	function isRecording() {
		if (!doodoo) return false;
		return doodoo.isRecording();
	}

	function connect() {
		const playBackPanel = app.ui.getPanel('playback', { label: 'Play Back' });

		app.ui.addCallbacks([
			{ callback: play, key: '/', text: 'Play', args: [false] },
			{ 
				key: '.', 
				text: 'Play Once',
				callback: () => { play(false, 1); }, 
			},
			{ 
				key: ',', 
				text: 'Stop',
				callback: () => { if (doodoo) doodoo.stop(); }, 
			},
			{ callback: play, key: 'r', text: 'Record', args: [true] },
			{ 
				key: 'd', 
				text: 'Mutate',
				callback: () => { if (doodoo) doodoo.modulate(); },
			},
		], playBackPanel);

		modCountUI = playBackPanel.add(new UILabel({
			id: 'modulation-count',
			text: 'Modulation 0',
		}));

		app.ui.addProps({
			'useMetro': {
				type: 'UIToggleCheck',
				value: useMetro,
				label: 'Metro',
				key: 'm',
				callback: value => { useMetro = value; },
			}
		}, playBackPanel);

		app.ui.addCallback({
			row: true,
			callback() {
				if (!doodoo) return;
				doodoo.printLoops();
			},
			text: 'Print Loops',
			key: 'p',
		});

		app.ui.addCallback({
			callback() {
				if (!doodoo) return;
				doodoo.printParams();
			},
			text: 'Print Params',
			key: 'shift-p',
		});
	}

	return { connect, isRecording };

}