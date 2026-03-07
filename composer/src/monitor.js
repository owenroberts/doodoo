import { UIRow, UILabel, UIPanel, UIElement, UICollection } from '../../../oi/src/oi.js';

/**
 * monitor property values in realtime
 */
export class MonitorPanel extends UIPanel {
	constructor(doodoo, ui) {
		super({ id: 'monitor', ui });


		this.props = {
			"monitor-melody": true,
			"monitor-harmony": true,
			"monitor-counterpoint": true,
			"monitor-count": true,
			"monitor-counter": true,
			"monitor-instrument": true,
			"monitor-attack": true,
			"monitor-curve": true,
			"monitor-release": true,
			"monitor-double": true,
			"monitor-fx": true,
			"monitor-playBeat": true,
			"monitor-transpose": true,
			"monitor-scale": true,
			"monitor-bpm": true,
		};

		this.propList = Object.keys(this.props);

		this.propRow = this.addRow({ id: "prop-row" });
		for (const prop in this.props) {
			this.addLabel(prop.replace("monitor-", ""));
			this.addRef({
				obj: this.props,
				ref: prop, // `monitor-${prop}`,
				class: 'monitor-prop',
				noRow: true,
				noLabel: true,
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
			const propKey = k.replace("monitor-", "");
			thr.add(new UIElement({ tag: "th", text: propKey }));
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
				const propKey = k.replace("monitor-", "");
				let value = ".";
				if (this.props[k] && voice.hasOwnProperty(propKey)) {
					value = this.formatProp(k, voice[propKey]);
				} else if (this.props[k] && i === 0) {
					if (propKey === "bpm") value = comp.bpm;
					if (propKey === "transpose") value = comp.transpose;
					if (propKey === "scale") value = JSON.stringify(comp.scale);
				}
				tr.add(new UIElement({ tag: "td", text: value }));
			}
		}
	}
}