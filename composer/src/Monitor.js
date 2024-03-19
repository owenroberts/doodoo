/*
	monitor params
*/

import { Elements } from '../../../ui/src/UI.js';
const { UIRow, UILabel } = Elements;

export function Monitor(app) {

	const props = {
		melody: true,
		count: true,
		countEnd: true,
		harmony: true,
		instrument: true,
		attack: true,
		curve: true,
		release: true,
		double: true,
		fx: true,
		playBeat: true,
	};

	let mRow;

	function formatProp(prop, value) {

		if (prop === 'instrument') {
			if (value.instrument) return value.instrument;
			return value.name;
		}
		if (prop === 'melody') {
			return value.filter(n => n[0] !== null).map(n => ` ${n[0]}:${n[1]}`);
		}
		if (prop === 'fx') {
			return JSON.stringify(value);
		}
		return value;
	}

	function update(loops) {
		mRow.clear();

		for (let i = 0; i < loops.length; i++) {
			const row = mRow.add(new UIRow({ class: 'break' }));
			row.add(new UILabel({ text: `Loop ${i} -> `}));

			const loop = loops[i];
			for (const prop in props) {
				if (!props[prop]) continue;

				row.add(new UILabel({
					text: `${prop}: ${formatProp(prop, loop[prop])},`,
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
				label: `${prop}:`,
				class: 'monitor-prop',
				isOn: true,
				callback: value => { props[prop] = value; },
			});
		}

		mRow = monitorPanel.addRow('mRow', 'break');
	}

	return { connect, update };
}