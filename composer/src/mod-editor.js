import { UIButton, UIGraph, UIInputStep, UILabel, UIList, UINumberStep, UIPanel, UIRange, UIRow, UISelect, UIText, UITree } from '@b/oi';
import { Bounds, Modes } from '@b/doodoo/src/constants.js';
import { defaults } from '@b/doodoo/src/defaults.js';
import { MIDI_NOTES } from '@b/doodoo/src/midi.js';

const modDefaults = {
	min: { value: 0, step: 1 },
	max: { value: 1, step: 1 },
	step: { value: 1, step: 0.1 },
	kick: { value: 0, step: 1 },
	chance: { value: 0.5, step: 0.1 },
	mode: { value: Modes.VALUE },
	bound: { value: Bounds.STAY },
};

let uiDataTypeOptions = [
	'number', 
	'chance', 
	'number-list', 
	'string-list', 
	'note-list', 
	'stack', 
	'graph-list',
];

/**
 * edit params of specific mods
 */
export class ModEditorPanel extends UIPanel {
	constructor(doodoo, ui) {
		super({ id: "modEditor", ui });

		this.doodoo = doodoo;
		this.modsets = this.doodoo.comp.modsets;

		this.addButton({
			text: "close",
			callback: () => {
				this.clear();
				this.ui.panels.modulators.closeEditor();
			},
		});

		this.addButton({
			text: "collapse",
			callback: () => {
				this.collapse();
			},
		});

		this.addBreak();

		this.propsRow = this.add(new UIRow());
		this.paramsRow = this.add(new UIRow());
	}

	load() {
		// this.mods = this.doodoo.comp.mods;
		this.modsets = this.doodoo.comp.modsets;
	}

	clear() {
		this.propsRow.clear();
		this.paramsRow.clear();
	}

	collapse() {
		this.paramsRow.childList
			.forEach(c => {
				if (c.constructor.name === 'UITree') {
					c.close();
				}
				c.childList
					.forEach(c2 =>  { 
						if (c2.constructor.name === 'UITree') {
							c2.close();
						}
					});
			});
	}

	getUIDataType(propRef) {
		let type = 'number';
		if (propRef.hasOwnProperty('uiDataType')) {
			type = propRef.uiDataType;
		} else if (propRef.options?.[0] === "C_1") {
			type = "note-list";
		} else if (propRef.hasOwnProperty('list')) {
			if (typeof propRef.list[0] === 'string') {
				type = 'string-list';
			}
			if (typeof propRef.list[0] === 'number') {
				type = 'number-list';
			}
		} else if (propRef.hasOwnProperty('stack')) {
			type = 'stack';
		}
		return type;
	}

	set(index, propName) {
		// console.log(index, propName, this.modsets[index].mods[propName]);
		const mods = this.modsets[index].mods;

		if (!mods[propName]) {
			mods[propName] = {};
		}

		if (mods[propName].isBundle) {
			
			this.propsRow.add(new UILabel({ text: `${propName} bundle`, class: "mod-prop-label" }));
			this.propsRow.addBreak();

			for (const k in mods[propName]) {
				if (k === 'isBundle') continue; // still have to do this??

				const propRow = this.paramsRow.add(new UIRow());
				propRow.add(new UILabel({ text: k, class: "mod-prop-label" }));
				propRow.addBreak();
				propRow.add(new UILabel({ text: "data type" }));
				this.addModEdit(propRow, k, mods[propName][k]);
			}
		} else {
			this.propsRow.add(new UILabel({ text: propName, class: "mod-prop-label" }));
			this.propsRow.addBreak();
			this.paramsRow.add(new UILabel({ text: "data type" }));
			this.addModEdit(this.paramsRow, propName, mods[propName]);
		}
	}

	addModEdit(row, propName, propRef) {
		if (propName.includes("chance") || propRef.isChance) {
			propRef.uiDataType = "chance";
		}
		this.addTypeSelector(row, propName, propRef);
		this.addParams(row, propName, propRef);
	}

	addTypeSelector(row, propName, propRef, isBundle=false) {
		
		const propTypeSelect = row.append(new UISelect({
			value: this.getUIDataType(propRef),
			options: uiDataTypeOptions,
			callback: value => { 
				this.paramsRow.clear();
				
				// reset propRef -- don't set directly! breaks ref!
				for (const k in propRef) {
					delete propRef[k];
				}
				propRef.uiDataType = value;

				this.addParams(row, propName, propRef); // renew params
			}
		}));

		row.addBreak();
	}

	addParams(row, propName, propRef) {
		const uiDataType = this.getUIDataType(propRef);
		if (!propRef.uiDataType) propRef.uiDataType = uiDataType;

		switch(uiDataType) {
			case "number":
			case "chance":
				this.addValue(row, "value", propRef);
			break;

			case 'number-list':
			case 'string-list':
			case 'graph-list':
			case 'input-list':
			case 'note-list':
				this.addList(row, propName, propRef);
			break;

			case "stack":
				// propRef.stack = [[]]; // why??? 
				propRef.options = defaults[propName].options ?? [];
				this.addStack(row, propName, propRef);
			break;
		}
	}

	addValue(row, propName, propRef, level=0, label) {
		row.add(new UILabel({ text: label ?? propName }));
		// console.log(propName)
		const uiClass = propRef.uiDataType === "chance" ? UIRange : UINumberStep;
		row.add(new uiClass({
			obj: propRef,
			ref: propName,
		}));

		this.addMod(row, propName, propRef, level);
	}

	addList(row, propName, propRef, level=0, label) {

		let uiListClass = UIList;
		let uiListParams = {
			obj: propRef,
			ref: "list",
			list: propRef.list ?? [],
		};

		switch(propRef.uiDataType) {
			case "note-list":
				// uiListParams.list = propRef.list;
				uiListParams.itemClass = UIInputStep;
				uiListParams.options = [...MIDI_NOTES];
			break;
			case "number-list":
				uiListParams.itemClass = UINumberStep;
			break;
			case "string-list": 
				uiListParams.itemClass = UISelect;
				uiListParams.options = propRef.options;
			break;
			case "graph-list":
				uiListClass = UIGraph;
				uiListParams.graph = propRef.graph;
				uiListParams.ui = this.ui;
			break;
		}

		console.log({uiListClass, uiListParams});

		const listUI = new uiListClass(uiListParams);
		
		row.add(new UILabel({ text: 'list' }));
		row.addBreak();
		row.add(listUI);
		row.addBreak();

		row.add(new UILabel({ text: 'index' }));
		const indexUI = row.add(new UINumberStep({
			obj: propRef,
			ref: "index",
			value: propRef.index ?? 0,
		}));

		this.addMod(row, "index", propRef, level);
	}

	addStack(row, propName, propRef, level=0, label) {
		// make this a ui?

		const stacks = [];

		row.add(new UIButton({
			text: '–',
			class: 'left-end',
			callback: () => {
				if (stacks.length === 0) return;
				const removeStack = stacks.pop();
				row.remove(removeStack);
				if (stacks.length === 0) return;
				updateStack(); 
			}
		}));

		row.add(new UIButton({
			text: '+',
			class: 'right-end',
			callback: () => {
				addNewStack(stacks.length);
				updateStack(); 
			}
		}));

		row.addBreak();

		function addNewStack(i, list) {
			// console.log('add stack', i, list);
			const stackRow = row.add(new UIRow());
			stackRow.add(new UILabel({ text: 'stack ' + i }));
			stackRow.addBreak();

			let uiItemClass = UIText;
			if (propRef.value === "number") {
				uiItemClass = UINumberStep;
			}
			if (propRef.options?.length > 0) {
				uiItemClass = UISelect;
			}

			const stack = stackRow.add(new UIList({
				itemClass: uiItemClass,
				list: list ?? [],
				options: propRef.options,
				callback: () => { updateStack(); }
			}), 'stack');

			
			row.addBreak();
			stacks.push(stackRow);
		}

		function updateStack() {
			const s = [];
			for (let i = 0; i < stacks.length; i++) {
				s[i] = { list: stacks[i].children.stack.list };
			}
			propRef.stack = s;
		}

		for (let i = 0; i < propRef.stack.length; i++) {
			addNewStack(i, propRef.stack[i].list);
		}
	}

	addMod(row, propName, propRef, level) {

		// make sure mod has all properties
		if (propRef.mod) {
			for (const k in modDefaults) {
				if (!propRef.mod.hasOwnProperty(k)) {
					propRef.mod[k] = modDefaults[k];
				}
			}
		}

		if (level < 2) {
			row.add(new UIButton({
				text: '+m',
				callback: () => {
					if (propRef.mod) return;
					propRef.mod = structuredClone(modDefaults);
					this.addModTree(row, propName, propRef, level);
				}
			}));
		}

		if (propRef.mod) {
			row.addBreak();
			this.addModTree(row, propName, propRef, level);
		}
	}

	addModTree(row, propName, propRef, level) {
		row.addBreak();
		const tree = row.add(new UITree({ title: `${propName} mod` }));
		const removeBtn = row.add(new UIButton({
			text: "X",
			callback: () => {
				delete propRef.mod;
				row.remove(tree);
				row.remove(removeBtn);
			}
		}));

		const minRow = tree.add(new UIRow({ class: 'break' }));
		this.addValue(minRow, "value", propRef.mod.min, level + 1, "min");
		
		const maxRow = tree.add(new UIRow({ class: 'break' }));
		this.addValue(maxRow, "value", propRef.mod.max, level + 1, "max");

		const stepRow = tree.add(new UIRow({ class: 'break' }));
		this.addValue(stepRow, "value", propRef.mod.step, level + 1, "step");

		tree.add(new UILabel({ text: "chance" }));
		tree.add(new UIRange({
			obj: propRef.mod.chance,
			ref: "value",			
			step: 0.1,
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "kick in" }));
		tree.add(new UINumberStep({
			obj: propRef.mod.kick,
			ref: "value",
		}));
		tree.addBreak();

		// these don't work >>

		tree.add(new UILabel({ text: "mode" }));
		tree.add(new UISelect({
			obj: propRef.mod.mode,
			ref: "value",
			options: Object.values(Modes),
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "bound" }));
		tree.add(new UISelect({
			obj: propRef.mod.bound, 
			ref: "value",
			options: Object.values(Bounds),
		}));
		tree.addBreak();
	}
}