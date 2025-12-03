import { UIRow, UITree, UIButton, UIRange, UINumberStep, UIGraph, UILabel, UISelect, UISelectButton, UIInputStep, UIList, labelFromKey, UIPanel, UIText } from '../../../ui/src/oi.js';
import { modDefaults, propDefaults, typeOptions } from './ModProps.js';
import { Modes, Bounds } from '../../src/constants.js';
import { defaults } from '../../src/defaults.js';
import { MIDI_NOTES } from '../../src/midi.js';

export class ModEditorPanel extends UIPanel {
	constructor(app) {
		super({ id: "modEditor", ui: app.ui });

		this.doodoo = app.doodoo;
		this.mods = app.doodoo.comp.mods;

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
		this.mods = this.doodoo.comp.mods;
	}

	clear() {
		this.propRow.clear();
		this.paramsRow.clear();
	}

	collapse() {
		this.paramsRow.childList
			.filter(c => c.constructor.name === 'UITree')
			.forEach(c => { c.close(); });
	}

	getType(propRef) {
		// const mod = this.mods[propName];
		let type = 'number';
		if (propRef.hasOwnProperty('type')) type = params.type;
		else if (propRef.hasOwnProperty('list')) {
			if (typeof propRef.list[0] === 'string') type = 'string-list';
			if (typeof propRef.list[0] === 'number') type = 'number-list';
		}
		else if (propRef.hasOwnProperty('stack')) type = 'stack';
		return type;
	}

	set(propName) {

		if (!this.mods[propName]) {
			this.mods[propName] = {};
		}

		if (this.mods[propName].isBundle) {
			this.propRow.add(new UILabel({ text: labelFromKey(propName) + " bundle" }));
			this.propRow.addBreak();
			for (const param in params) {
				if (param === 'type') continue; // get rid of type!

				// this is where it gets tricky!
				const propString = `${propName}-${param}`;
				const propType = getPropType(propString, partIndex);

				paramsRow.add(new UILabel({ text: labelFromKey(propString) }));
				addPropMod(propString, partIndex, propType, true);
				paramsRow.addBreak();
			}
		} else {
			this.propsRow.add(new UILabel({ text: propName }));
			this.propsRow.addBreak();
			this.propsRow.add(new UILabel({ text: "type" })); // need better term than type
			this.addModEdit(propName, this.mods[propName]);
		}
	}

	addModEdit(propName, propRef) {
		this.addTypeSelector(propName, propRef);
		this.addParams(propName, propRef);
	}

	addTypeSelector(propName, propRef, isBundle=false) {
		const type = this.getType(propRef);
		const propTypeSelect = new UISelect({
			value: type,
			options: typeOptions,
			callback: type => { 
				this.paramsRow.clear();
				
				// reset propRef -- don't set directly! breaks ref!
				for (const k in propRef) {
					delete propRef[k];
				}
				propRef.type = type;

				this.addParams(propName, propRef); // renew params
			}
		});

		if (isBundle) {
			this.paramsRow.add(propTypeSelect);
			this.paramsRow.addBreak();
		} else { 
			this.propsRow.add(propTypeSelect);
			this.propsRow.addBreak();
		}
	}

	addParams(propName, propRef) {
		const type = propRef.type ?? this.getType(propRef);

		console.log(propName, propRef, type);

		switch(type) {
			// chance and number same thing?
			case "number":
			case "chance":
				this.addValue(this.paramsRow, "value", propRef);
			break;

			case 'number-list':
			case 'string-list':
			case 'graph-list':
			case 'input-list':
			case 'note-list':
				propRef.index = 0;
				this.addList(this.paramsRow, propName, propRef);
			break;

			case "stack":
				propRef.stack = [[]];
				propRef.options = defaults[propName].options ?? [];
				this.addStack(this.paramsRow, propName, propRef);
			break;
		}
	}

	addValue(row, propName, propRef, level=0, label) {

		row.add(new UILabel({ text: label ?? propName }));
		
		const uiClass = propRef.type === "chance" ? UIRange : UINumberStep;
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

		switch(propRef.type) {
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

		const listUI = new uiListClass(uiListParams);

		
		row.add(new UILabel({ text: 'list' }));
		row.addBreak();
		row.add(listUI);
		row.addBreak();

		row.add(new UILabel({ text: 'index' }));
		const indexUI = row.add(new UINumberStep({
			obj: propRef,
			ref: "index",
			value: 0,
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
				addStack(stacks.length);
				updateStack(); 
			}
		}));

		row.addBreak();

		function addStack(i, list) {
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
			addStack(i, propRef.stack[i].list);
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