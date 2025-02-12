/*
	interface to edit a mod
	should it be modal?
	should there be more than one?
*/

import { Elements } from '../../../ui/src/UI.js';
import { Interface } from '../../../ui/src/UI.js';
import { modDefaults, propDefaults, typeOptions } from './ModProps.js';

const { labelFromKey } = Interface();
const { UIRow, UITree, UIButton, UIChance, UINumberStep, UIInputList, UINumberList, UIGraph, UILabel, UISelect, UISelectButton } = Elements;

export function ModEditor(app) {

	let panel, propRow, paramsRow;

	// funtion to access app.modulators -- maybe better way to do this
	function updateMod(propString, propType, partIndex, valueType) {
		app.modulators.updateMod(propString, propType, partIndex, valueType);
	}

	function getModParams(propString, partIndex) {
		return app.modulators.getModParams(propString, partIndex);
	}

	function getPropDefaults(propString, partIndex) {
		return app.modulators.getPropDefaults(propString);
	}

	function getModRef(propString, partIndex) {
		return app.modulators.getModRef(propString, partIndex);
	}

	function getPropType(propString, partIndex) {
		return app.modulators.getPropType(propString, partIndex);
	}

	// main add the prop ui function ... 
	function addPropMod(propName, partIndex, propType) {
		clear();

		propRow.add(new UILabel({ text: labelFromKey(propName) }));
		propRow.addBreak();
		propRow.add(new UILabel({ text: "Prop Type" }));

		const propTypeSelect = propRow.add(new UISelect({
			value: propType,
			options: typeOptions,
			callback: type => { 
				paramsRow.clear();
				
				// delete props[propName].mod; // i guess delete and it will update when it updates?
				app.modulators.removePropMod(propName, partIndex);
				// app.modulators.removeMod(propName, partIndex);
				addPropParams(paramsRow, type, propName, partIndex);
			}
		}));
		propRow.addBreak();
		addPropParams(paramsRow, propType, propName, partIndex);
	}

	function addPropParams(row, propType, propString, partIndex) {
		const params = getModParams(propString, partIndex); // current settings
		const defaults = getPropDefaults(propString, partIndex); // default prop settings

		switch(propType) {
			case 'number':
			case 'chance':
				
				updateMod(propString, propType, partIndex, 'type');

				// set default if not existing isn't passed
				if (!params.hasOwnProperty('value')) {
					const step = +prompt('Step?', 1);
					updateMod(propString, 0, partIndex, 'value');
					updateMod(propString, step, partIndex, 'step');
				}
				addValue(row, propString, partIndex, 'Value');
			break;
			case 'number-list':
			case 'string-list':
			case 'graph-list':
			case 'input-list':
			case 'note-list':

				// set default if prop isn't passed
				updateMod(propString, propType, partIndex, 'type');

				if (!params.hasOwnProperty('list')) {
					updateMod(propString, defaults.list ?? [], partIndex, 'list');
				}

				if (!params.hasOwnProperty('index')) {
					updateMod(propString, defaults.index ?? 0, partIndex, 'index');
				}

				if (propType === 'graph-list') {
					if (!params.hasOwnProperty('graph')) {
						updateMod(propString, defaults.list ?? [], partIndex, 'graph');
					}
				}
				
				addList(row, propType, propString, partIndex);
			break;
			case 'stack':

				updateMod(propString, propType, partIndex, 'type');

				if (!params.hasOwnProperty('stack')) {
					updateMod(propString, defaults.stack ?? [[]], partIndex, 'stack');
				}

				if (!params.hasOwnProperty('options')) {
					updateMod(propString, defaults.options ?? [], partIndex, 'options');
				}

				addStack(row, propString, partIndex);
			break;
			case 'bundle':
				for (const param in params) {
					if (param === 'type') continue;
					row.add(new UILabel({ text: app.ui.labelFromKey(param), class: 'break-line' }));
					// row.addBreak();
					const propType = getPropType(`${propString}-${param}`, partIndex);
					addPropParams(row, propType, `${propString}-${param}`, partIndex);
					row.addBreak();
				}
				// needs ui to add params to bundle ... ?
			break;
		}
	}

	function addValue(row, propString, partIndex, label, level=0) {
		const params = getModParams(propString, partIndex);
		row.add(new UILabel({ text: label }));

		let uiClass = UINumberStep;
		if (params?.type === 'chance') uiClass = UIChance;
		const ui = row.add(new uiClass({
			...params, // step, options, etc from defaults
			value: params.value ?? 0,
			label: 'Chance',
			callback: value => {
				updateMod(propString, value, partIndex);
			}
		}));
		// propsUI[propString] = { value: ui };

		addMod(row, propString, partIndex, label, level);
	}

	function addList(row, propType, propString, partIndex, level=0) {
		const params = getModParams(propString, partIndex);
		const defaults = getPropDefaults(propString, partIndex);

		let uiClass;
		if (propType === 'number-list') uiClass = UINumberList;
		if (propType === 'string-list') uiClass = UIInputList;
		if (propType === 'graph-list') uiClass = UIGraph;

		const listUI = new uiClass({
			list: params.list ?? [],
			app: app,
			graph: params.graph,
			callback: (list, graph) => {
				updateMod(propString, list, partIndex, 'list'); 
				if (graph) updateMod(propString, graph, partIndex, 'graph'); 
			}
		});

		// maybe other things have options ??
		if (defaults.options) {
			row.add(new UILabel({ text: 'Options' }));
			row.add(new UISelectButton({
				options: defaults.options,
				callback: value => {
					listUI.pushItem(value);
				}
			}));
			row.addBreak();
		}

		row.add(new UILabel({ text: 'List' }));
		row.addBreak();
		row.add(listUI);
		row.addBreak();

		row.add(new UILabel({ text: 'Index' }));
		const indexUI = row.add(new UINumberStep({
			value: params.index ?? 0,
			min: 0,
			step: 1,
			callback: index => { 
				updateMod(propString, index, partIndex, 'index');
			}
		}));

		// propsUI[propString] = { list: listUI, index: indexUI };
		
		// index prop doesn't exist .... 
		addMod(row, propString, partIndex, 'Index', level);
	}

	function addStack(row, propString, partIndex, level=0) {
		const params = getModParams(propString, partIndex);
		const stacks = [];
		const select = row.add(new UISelectButton({
			selected: "choir",
			options: params.options ?? [],
			// callback: addInstrument,
			callback: value => {
				if (!stacks[index.value]) return;
				stacks[index.value].stack.pushItem(value);
				updateStack(); 
			}
		}));
		row.addBreak();

		row.add(new UILabel({ text: 'Index' }));
		// console.log('length', params.stack.length)
		const index = row.add(new UINumberStep({
			min: 0,
			max: params.stack.length - 1,
			value: 0,
		}));

		// remove stack
		row.add(new UIButton({
			text: '–',
			class: 'left-end',
			callback: () => {
				if (stacks.length === 0) return;
				const removeStack = stacks.pop();
				row.remove(removeStack);
				if (stacks.length === 0) return;
				index.max = stacks.length - 1;
				index.update(stacks.length - 1);
				updateStack(); 
			}
		}));

		// add stack
		row.add(new UIButton({
			text: '+',
			class: 'right-end',
			callback: () => {
				addStack(stacks.length)
				index.max = stacks.length - 1;
				index.update(stacks.length - 1);
				updateStack(); 
			}
		}));

		row.addBreak();

		function addStack(i, list) {
			// console.log('add stack', i, list);
			const stackRow = row.add(new UIRow());
			stackRow.add(new UILabel({ text: 'Stack ' + i }));
			const stack = stackRow.add(new UIInputList({
				list: list ?? [],
				callback: () => { updateStack(); }
			}), 'stack');
			row.addBreak();
			stacks.push(stackRow);
		}

		function updateStack() {
			const s = [];
			for (let i = 0; i < stacks.length; i++) {
				// console.log(i, stacks[i]);
				s[i] = { list: stacks[i].stack.list };
			}
			updateMod(propString, s, partIndex, 'stack');
		}

		for (let i = 0; i < params.stack.length; i++) {
			const stack = addStack(i, params.stack[i].list, partIndex);
		}
	}

	function addMod(row, propString, partIndex, label, level) {

		let prop = getModRef(propString, partIndex);

		// if mod property doesn't exist get default
		if (!prop) prop = modDefaults[propString.split('-').pop()];

		// make sure mod has all properties
		if (prop.mod) {
			for (const def in modDefaults) {
				if (!prop.mod.hasOwnProperty(def)) {
					prop.mod[def] = modDefaults[def];
				}
			}
		}

		if (level < 2) {
			row.add(new UIButton({
				text: '+Mod',
				callback: () => {
					if (prop.mod) return;
					prop.mod = structuredClone(modDefaults);
					addModTree(row, propString, partIndex, label, level);
				}
			}));
		}

		if (prop.mod) {
			row.addBreak();
			addModTree(row, propString, partIndex, label, level);
		}
	}

	function addModTree(row, propString, partIndex, label, level) {
		const prop = getModRef(propString, partIndex);
		const tree = getModTree(labelFromKey(label + 'Mod'), propString + "-mod", partIndex, level+1);
		row.add(tree);
		const removeBtn = row.add(new UIButton({
			text: 'X',
			callback: () => {
				delete prop.mod;
				row.remove(tree);
				row.remove(removeBtn);
			}
		}));
	}

	function getModTree(title, propString, partIndex, level) {
		const prop = getModRef(propString, partIndex);
		const params = getModParams(propString, partIndex);
		// console.log('mod tree', propString, prop);

		const tree = new UITree({ title: title });

		const minRow = tree.add(new UIRow({ class: 'break' }));
		addValue(minRow, propString + '-min', partIndex, 'Min', level);

		const maxRow = tree.add(new UIRow({ class: 'break' }));
		addValue(maxRow, propString + '-max', partIndex, 'Max', level);

		// const stepRow = tree.add(new UIRow({ class: 'break' }));
		// addValue(stepRow, propString + '-step', partIndex, 'Step', level);

		tree.add(new UILabel({ text: "Step" }));
		tree.add(new UINumberStep({
			value: params.step.value ?? 0,
			callback: value => {
				updateMod(propString + '-step', value, partIndex);
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Update" }));
		tree.add(new UIChance({
			value: params.chance?.value ?? 0,
			label: 'Chance',
			step: 0.05,
			callback: value => { 
				updateMod(propString + '-chance', value, partIndex);
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Kick In" }));
		tree.add(new UINumberStep({
			value: params.kick?.value ?? 0,
			callback: value => {
				updateMod(propString + '-kick', value, partIndex);
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Type" }));
		tree.add(new UISelect({
			value: params.type?.value ?? 'value',
			options: ['value', 'range', 'walk', 'walkUp', 'walkDown'],
			callback: value => { 
				updateMod(propString + '-type', value, partIndex);
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Bound" }));
		tree.add(new UISelect({
			value: params.bound?.value ?? 'stay',
			options: ['reset', 'reverse', 'stay'],
			callback: value => { 
				updateMod(propString + '-bound', value, partIndex);
			}

		}));
		tree.addBreak();
		
		return tree;
	}

	function clear() {
		propRow.clear();
		paramsRow.clear();
	}

	function collapse() {
		paramsRow.uiList
			.filter(c => c.constructor.name === 'UITree')
			.forEach(c => { c.close(); });
	}

	function connect() {
		panel = app.ui.getPanel('modEditor', { label: 'Mod Edit' });
		app.ui.addCallbacks([
			{
				text: "Close",
				callback: () => {
					clear();
					app.modulators.clearModEdit();
				}
			},
			{
				text: 'Collapse',
				callback: collapse
			},
		]);

		propRow = panel.add(new UIRow({ class: "break" }));
		paramsRow = panel.add(new UIRow({ class: "break" }));
	}

	return { connect, addPropMod, clear };
}