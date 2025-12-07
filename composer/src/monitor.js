import { UIRow, UILabel, UIPanel, UIElement, UICollection } from '../../../oi/src/oi.js';

/**
 * monitor property values in realtime
 */
export class MonitorPanel extends UIPanel {
	constructor(doodoo, ui) {
		super({ id: 'monitor', ui });


		this.props = {
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
			bpm: true,
		};

		this.propList = Object.keys(this.props);

		this.propRow = this.addRow({ id: "prop-row" });
		for (const prop in this.props) {
			this.addRef({
				obj: this.props,
				ref: prop, // `monitor-${prop}`,
				class: 'monitor-prop',
				noRow: true,
			});
		}

		this.monitorRow = this.addRow({ id: "monitor-row", class: "break" });

		const table = this.add(new UIElement({ tag: "table", id: "monitor-table" }));
		const colGroup = table.add(new UIElement({ tag: "colgroup" }));
		const thead = table.add(new UIElement({ tag: "thead" }));
		const thr = thead.add(new UIElement({ tag: "tr"}));
		thr.add(new UIElement({ tag: "th", text: "loop" }));

		this.tcols = [colGroup.add(new UIElement({ tag: "col" }))];
		for (let i = 0; i < this.propList.length; i++) {
			this.tcols[i + 1] = colGroup.add(new UIElement({ tag: "col" }));
			const k = this.propList[i];
			thr.add(new UIElement({ tag: "th", text: k }));
		}
		
		this.tbody = table.add(new UIElement({ tag: "tbody" }));
	}

	formatProp(prop, value) {

		if (prop === 'melody') {
			// return value.filter(n => n[0] !== null).map(n => ` ${n[0]}:${n[1]}`);
			return value.filter(n => n[0] !== null).map(n => ` ${n[0]}`);
		}
		if (prop === 'fx') {
			return JSON.stringify(value);
		}
		return value;
	}

	update(voices=[], comp={}) {

		this.tbody.clear();

		for (let i = 0; i < this.propList.length; i++) {
			const k = this.propList[i];
			if (this.props[k]) {
				this.tcols[i + 1].removeClass('collapsed');
			} else {
				this.tcols[i + 1].addClass('collapsed');
			}
		}

		for (let i = 0; i < voices.length; i++) {
			// const row = this.monitorRow.add(new UIRow({ class: 'break' }));
			// row.add(new UILabel({ text: `Loop ${i}: `}));
			const tr = this.tbody.add(new UIElement({ tag: "tr" }));
			tr.add(new UIElement({ tag: "td", text: i }));

			const voice = voices[i];
			for (let j = 0; j < this.propList.length; j++) {
				const k = this.propList[j];
				let value = ".";
				if (this.props[k] && voice.hasOwnProperty(k)) {
					value = this.formatProp(k, voice[k]);
				} else if (this.props[k] && i === 0) {
					if (k === "bpm") value = comp.bpm;
					if (k === "transpose") value = comp.transpose;
					if (k === "scale") value = JSON.stringify(comp.scale);
				}
				tr.add(new UIElement({ tag: "td", text: value }));
			}
		}
	}
}