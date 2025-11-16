/*
	monitor params
*/

import { Elements } from '../../../ui/src/UI.js';
const { UIRow, UILabel } = Elements;

export function Monitor(app) {

	const props = {
		melody: true,
		harmony: true,
		counterpoint: true,
		count: true,
		counter: true,
		instrument: true,
		attack: true,
		curve: true,
		release: true,
		double: true,
		fx: true,
		playBeat: true,
		transpose: true,
		scale: true,
		bmp: true,
	};

	let mRow;

	function formatProp(prop, value) {

		// if (prop === 'instrument') {
		// 	if (value.instrument) return value.instrument;
		// 	return value.name;
		// }
		if (prop === 'melody') {
			return value.filter(n => n[0] !== null).map(n => ` ${n[0]}:${n[1]}`);
		}
		if (prop === 'fx') {
			return JSON.stringify(value);
		}
		return value;
	}

	function update(voices, comp) {
		mRow.clear();

		const row = mRow.add(new UIRow({ class: 'break' }));
		for (const k in comp) {
			if (props[k]) {
				row.add(new UILabel({
					text: ` ${k}: ${formatProp(k, comp[k])},`,
					class: 'prop-value',
				}));
			}
		}

		for (let i = 0; i < voices.length; i++) {
			const row = mRow.add(new UIRow({ class: 'break' }));
			row.add(new UILabel({ text: `Loop ${i}: `}));

			const voice = voices[i];
			for (const prop in props) {
				if (!props[prop]) continue;
				if (!voice.hasOwnProperty(prop)) continue;

				row.add(new UILabel({
					text: ` ${prop}: ${formatProp(prop, voice[prop])},`,
					class: 'prop-value',
				}));
			}
		}
	}

	function connect() {
		const monitorPanel = app.ui.getPanel('monitor');
		const propRow = monitorPanel.addRow();

		for (const prop in props) {
			const ui = app.ui.addProp(`monitor-${prop}`, {
				type: 'UIToggleCheck',
				label: `${prop}`,
				class: 'monitor-prop',
				isOn: true,
				callback: value => { props[prop] = value; },
			});
		}

		mRow = monitorPanel.addRow('mRow', 'break');
	}

	return { connect, update };
}