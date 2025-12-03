import { UIRow, UITree, UIButton, UINumberStep, UIGraph, UILabel, UISelect, UISelectButton, UIToggle, labelFromKey, UIPanel, UIInputSearch } from '../../../ui/src/oi.js';
import { defaults } from '../../src/defaults.js';
import { modDefaults, propDefaults, typeOptions } from './ModProps.js';

/**
 * add new mods
 */
export class ModulatorsPanel extends UIPanel {
	constructor(app) {
		super({ id: "modulators", ui: app.ui });

		this.doodoo = app.doodoo;
		this.mods = app.doodoo.comp.mods;
		this.modInEditor = "none";

		// this.add(new UILabel({ text: "add mod "}));
		this.propSelect = this.add(new UIInputSearch({
			listName: "prop-list",
			options: Object.keys(defaults),
		}));

		this.add(new UIButton({
			text: "+",
			callback: () => {
				if (this.propSelect.value.length === 0) {
					this.propSelect.focus();
				} else {
					this.addMod(this.propSelect.value);
					this.propSelect.value = "";
				}
			}
		}));

		this.addButton({
			key: "shift-p",
			text: "print",
			callback: () => {
				console.log('mods', this.mods);
			}
		});

		this.addButton({
			text: "clear",
			callback: () => {
				mods = {};
				this.modsRow.clear();
			}
		});

		this.modsRow = this.add(new UIRow({ id: "mods-row", class: "break" }));

		// ui -- delete
		let partModRows = [], partModIndex = 0;
		let openModPart = -1;
		let openToggle;
	}

	addMod(propName) {

		if (!propName) return;
		if (this.modsRow.children[propName]) return; // one mod per part

		if (!this.mods[propName]) {
			this.mods[propName] = structuredClone(defaults[propName]);
		}

		// ui
		
		const row = this.modsRow.add(new UIRow({ class: "break" }), propName);

		row.add(new UILabel({ text: propName }));
		row.add(new UIButton({
			text: "x",
			callback: () => {
				delete this.mods[propName];
				if (this.modInEditor === propName) {
					this.closeEditor();
				}
				this.modsRow.remove(row);
			}
		}));

		row.add(new UIButton({
			text: "print",
			callback: () => {
				console.log(propName, this.mods[propName]);
				console.log(JSON.stringify(this.mods[propName]));
			}
		}));

		row.add(new UIToggle({
			text: "edit",
			value: false,
			callback: isOpen => {
				if (isOpen) {
					this.closeEditor();
					row.addClass('prop-edit');
					this.modInEditor = propName;
					// const type = this.getType(propName, this.mods[propName]);
					// this.ui.panels.modEditor.set(propName, this.mods[propName]);
					this.ui.panels.modEditor.set(propName);
					// check if open
					this.ui.sections[this.section].addPanel('modEditor');
				} else {
					row.removeClass('prop-edit');
				}
			}
		}));
	}

	closeEditor() {
		// this.ui.panels.modEditor.clear();
		this.modInEditor = "none";
		Array.from(document.getElementsByClassName('prop-edit'))
			.forEach(e => e.classList.remove('prop-edit'));
	}
	
	load() {

		this.modsRow.clear();
		this.mods = this.doodoo.comp.mods;

		for (const mod in this.mods) {
			this.addMod(mod);
		}

		return;

		if (data.partMods.length === 0) return;
		
		partModRow.clear();
		partMods = [];
		for (let i = 0; i < data.partMods.length; i++) {
			const mods = data.partMods[i];
			if (mods) {
				partMods[i] = {};
				// addPartModTree(i);
				addPartModUI(i);
				for (const mod in mods) {
					partMods[i][mod] = structuredClone(mods[mod]);
					addModUI(mod, i);
				}
			}
		}
	}
}

