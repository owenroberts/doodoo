import { UIRow, UITree, UIButton, UINumberStep, UIGraph, UILabel, UISelect, UISelectButton, UIToggle, labelFromKey, UIPanel, UIInputSearch, UIList, UIToggleCheck } from '../../../ui/src/oi.js';
import { defaults } from '../../src/defaults.js';
import { defaultModSet, compModList } from '../../src/constants.js';

/**
 * add new mods
 */
export class ModulatorsPanel extends UIPanel {
	constructor(app) {
		super({ id: "modulators", ui: app.ui });

		this.doodoo = app.doodoo;
		// this.mods = app.doodoo.comp.mods;
		this.modsets = app.doodoo.comp.modsets;
		this.modsetIndex = 0;
		this.modInEditor = "none";

		this.addButton({
			key: "shift-p",
			text: "print",
			callback: () => {
				console.log('mods', this.modsets);
			}
		});

		this.addButton({
			text: "clear",
			callback: () => {
				this.modsets = [];
				this.modsRow.clear();
			}
		});

		this.addBreak();

		this.addRef({
			obj: this,
			ref: 'modsetIndex',
			callback: value => {
				if (value > this.modsets.length - 1) {
					const addSet = confirm("Add new set?");
					if (addSet) {
						this.modsets.push(structuredClone(defaultModSet))
						this.addSet(value);
					}
				}
			}
		});

		this.addBreak();

		this.setsRow = this.add(new UIRow({ id: "sets-row" }));

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

					if (this.modsetIndex > 0 && compModList.includes(this.propSelect.value)) {
						alert('comp mods must go in modset 0');
						return;
					}

					this.addMod(this.propSelect.value);
					this.propSelect.value = "";
				}
			}
		}));

		this.modsRow = this.add(new UIRow({ id: "mods-row", class: "break" }));
	}

	addSet(index) {

		const set = this.modsets[index];
		const row = this.setsRow.add(new UIRow());
		row.add(new UILabel({ text: `set ${index}`}));

		row.add(new UIButton({
			text: "X",
			callback: () => {
				if (this.modsets.length > 0) {
					this.modsets.splice(index, 1);
					this.setsRow.remove(row);
				}
			}
		}));

		row.add(new UIButton({
			text: "print",
			callback: () => {
				console.log(index, set);
			}
		}))

		row.add(new UIButton({
			text: "edit",
			callback: () => {
				this.closeEditor();
				this.modsRow.clear();
				this.children.modsetIndex.update(index);
				for (const k in set.mods) {
					this.addMod(k);
				}
			}
		}));

		row.addBreak();
		// row.add(new UILabel({ text: "parts" }));
		row.add(new UIList({
			treeTitle: "parts",
			itemClass: UIToggleCheck,
			obj: set,
			ref: "parts",
			isFixed: true,
		}));
	}

	addMod(propName) {

		if (!propName) return;
		if (this.modsRow.children[propName]) return; // one mod per part

		const mods = this.modsets[this.modsetIndex].mods;

		if (!mods[propName]) {
			mods[propName] = structuredClone(defaults[propName]);
		}

		// ui
		
		const row = this.modsRow.add(new UIRow({ class: "break" }), propName);

		row.add(new UILabel({ text: propName }));
		row.add(new UIButton({
			text: "x",
			callback: () => {
				delete mods[propName];
				if (this.modInEditor === propName) {
					this.closeEditor();
				}
				this.modsRow.remove(row);
			}
		}));

		row.add(new UIButton({
			text: "print",
			callback: () => {
				console.log(propName, mods[propName]);
				console.log(JSON.stringify(mods[propName]));
			}
		}));

		row.add(new UIToggle({
			text: "edit",
			value: false,
			callback: isOpen => {
				if (isOpen) {
					this.closeEditor();
					this.modInEditor = propName;
					row.addClass('prop-edit');
					this.ui.panels.modEditor.set(this.modsetIndex, propName);
					this.ui.sections[this.section].addPanel('modEditor');
				} else {
					this.closeEditor();
				}
			}
		}), "toggle");
	}

	closeEditor() {
		if (this.modInEditor !== "none") {
			console.log(this.modInEditor, this.modsRow.children)
			this.modsRow.children[this.modInEditor].children.toggle.off();
			this.modsRow.children[this.modInEditor].removeClass('prop-edit');
			this.modInEditor = "none";
		}
		this.ui.panels.modEditor.clear();
	}
	
	load() {

		this.setsRow.clear();
		this.modsRow.clear();
		// this.mods = this.doodoo.comp.mods;
		
		this.modsets = this.doodoo.comp.modsets;

		for (let i = 0; i < this.modsets.length; i++) {
			this.addSet(i);
		}
	}
}