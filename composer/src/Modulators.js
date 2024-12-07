/*
	ui section to add a modulator
	defaults are the default properties in Properites.js
	props are modified props
	props updated using string that references props obj structure, to prevent passing references
	propString 'curve-value', 'curve-mod-min', 'curve-mod-min-mod-max' etc

	
	why props not mods?
*/

import { Elements } from '../../../ui/src/UI.js';
import { Interface } from '../../../ui/src/UI.js';
import { modDefaults, propDefaults, typeOptions } from './ModProps.js';

const { labelFromKey } = Interface();
const { UIRow, UITree, UIButton, UIChance, UINumberStep, UIInputList, UINumberList, UIGraph, UILabel, UISelect, UISelectButton, UIToggle } = Elements;

// defaults are the default settings for props and mods
// mods are new mods that overwrite defaults

export function Modulators(app, defaults) {

	let props = {}; // are props mods?? yes .... fuck ... why aren't they mods again? no, they're props, props have mods, part mods should really be part props -- but you dont add a prop unless you want to mod
	let partMods = []; // save current part mods

	// ui
	let panel, propsRow;
	let partModRow, partModRows = [], partModIndex = 0;
	let openModEdit = "None";
	let openModPart = -1;
	let openToggle;

	function getPropType(propString, partIndex=-1) {
		const params = getPropParams(propString, partIndex);
		let type = 'number';
		if (params.hasOwnProperty('type')) type = params.type;
		else if (params.hasOwnProperty('list')) {
			if (typeof params.list[0] === 'string') type = 'string-list';
			if (typeof params.list[0] === 'number') type = 'number-list';
		}
		else if (params.hasOwnProperty('stack')) type = 'stack';
		return type;
	}

	function getPropRef(propString, partIndex=-1) {
		let prop = partIndex < 0 ? props : partMods[partIndex];
		if (propString.includes('-')) {
			const children = propString.split('-');
			for (let i = 0; i < children.length; i++) {
				prop = prop[children[i]];
			}
		} else {
			prop = prop[propString];
		}
		return prop;
	}

	function getPropParams(propString, partIndex=-1) {
		return structuredClone(getPropRef(propString, partIndex));
	}

	function getPropDefaults(propString) {
		let propLast = propString;
		if (propString.includes('-')) {
			propLast = propString.split('-').pop();
		}
		return { ...defaults[propLast], ...modDefaults[propLast] };
	}

	function addNewProp(propName, partIndex=-1) {

		if (!propName) return;
		if (props[propName] && partIndex < 0) return; // only one mod per part
		if (partIndex >= 0 && partMods[partIndex]) {
			// only one prop mod per part mod
			if (partMods[partIndex].hasOwnProperty(propName)) return;
		}

		const prop = structuredClone(defaults[propName]);
		if (partIndex < 0 && !props[propName]) props[propName] = prop;
		if (partIndex >= 0) {
			if (!partMods[partIndex]) partMods[partIndex] = {};
			if (!partMods[partIndex][propName]) partMods[partIndex][propName] = prop;
		}

		if (partIndex >= 0) {
			if (!partModRows[partIndex]) addPartModUI(partIndex, true);
		}

		// addPropTree(propName, partIndex, true);
		addPropUI(propName, partIndex);
	}

	function addPropUI(propName, partIndex=-1) {
		const row = partIndex < 0 ? propsRow : partModRows[partIndex];
		const propRow = row.add(new UIRow({ class: 'break' }));
		propRow.add(new UILabel({ text: labelFromKey(propName) }));

		function closeEdit() {
			app.modEditor.clear();
			openModEdit = "None";
			openModPart = -1;
			propRow.removeClass('prop-edit');
		}

		const removeBtn = propRow.add(new UIButton({
			text: 'X',
			callback: () => {
				removeProp(propName, partIndex);
				if (openModEdit === propName && openModPart === partIndex) {
					closeEdit();
				}
				row.remove(propRow);
				if (partIndex >= 0) {
					if (Object.keys(partMods[partIndex]).length === 0) {
						partModRow.remove(partModRows[partIndex]);
					}
				}
			}
		}));

		const editBtn = propRow.add(new UIToggle({
			text: "Edit",
			callback: () => {
				// close if open
				if (openToggle) {
					openToggle.off();
					openToggle = undefined;
				}
				if (openModEdit === propName && openModPart === partIndex) {
					closeEdit();
				} else {
					openToggle = editBtn;
					clearModEditHighlight();
					openModEdit = propName;
					openModPart = partIndex;
					propRow.addClass('prop-edit');
					app.modEditor.addPropMod(propName, partIndex, getPropType(propName, partIndex));
				}
			}
		}));
	}

	function addPartModUI(partIndex) {
		partModRows[partIndex] = partModRow.add(new UIRow({ class: "break-line-up" }));
		partModRows[partIndex].add(new UILabel({ text: `Part ${partIndex} Mods`}));
		partModRows[partIndex].addBreak();
	}

	function clearModEdit() {
		openModEdit = "None";
		openModPart = -1;
		clearModEditHighlight();
	}

	function clearModEditHighlight() {
		Array.from(document.getElementsByClassName('prop-edit'))
			.forEach(e => e.classList.remove('prop-edit'));
	}

	function removeProp(propName, partIndex=-1) {
		if (partIndex >= 0) delete partMods[partIndex][propName];
		else delete props[propName];
	}

	function removePropMod(propName, partIndex=-1) {
		delete props[propName].mod;
	}

	function updateProp(propString, value, partIndex=-1, valueType="value") {
		let prop = partIndex < 0 ? props : partMods[partIndex];
		if (propString.includes('-')) {
			// prop = props;
			const children = propString.split('-');
			for (let i = 0; i < children.length; i++) {
				prop = prop[children[i]];
			}
			prop[valueType] = value;
		} else {
			prop[propString][valueType] = value;
		}
	}

	function get() {
		return { mods: props, partMods };
	}

	function getMods() {
		return props;
	}

	function getPartMods() {
		return partMods;
	}

	function load(data) {
		if (!data.mods && !data.partMods) return;
		
		propsRow.clear();
		props = {};
		for (const prop in data.mods) {
			props[prop] = structuredClone(data.mods[prop]);
			addPropUI(prop);
		}
		if (!data.partMods) return;
		
		partModRow.clear();
		partMods = [];
		for (let i = 0; i < data.partMods.length; i++) {
			const mods = data.partMods[i];
			if (mods) {
				partMods[i] = {};
				// addPartModTree(i);
				addPartModUI(i);
				for (const prop in mods) {
					partMods[i][prop] = structuredClone(mods[prop]);
					addPropUI(prop, i);
				}
			}
		}
	}

	function connect() {
		panel = app.ui.getPanel('modulators', { label: 'Modulators' });

		app.ui.addUIs({
			propSelect: {
				type: "UIInputSearch",
				listName: "prop-list",
				label: "Add mod:",
				options: Object.keys(defaults),
				// selected: 'loopNum',
			}
		});

		app.ui.addCallbacks([
			{ 
				key: 'm', 
				text: '+', 
				callback: () => {
					if (app.ui.faces.propSelect.value.length === 0) {
						app.ui.faces.propSelect.focus();
					} else {
						addNewProp(app.ui.faces.propSelect.value);
						app.ui.faces.propSelect.value = '';
					}
				},
			},
		]);

		app.ui.addProp('partModIndex', {
			type: "UINumberStep",
			value: 0,
			callback: value => { partModIndex = value; }
		});

		app.ui.addCallbacks([
			{ 
				text: '+', 
				callback: () => {
					if (app.ui.faces.propSelect.value.length === 0) {
						app.ui.faces.propSelect.focus();
					} else {
						addNewProp(app.ui.faces.propSelect.value, partModIndex);
						app.ui.faces.propSelect.value = '';
					}
				},
			},
		]);

		panel.addRow();

		app.ui.addCallbacks([
			{ 
				key: 'shift-p', 
				text: 'Print Mods',
				callback: () => { 
					console.log('mods', props); 
					partMods.forEach((m, i) => {
						console.log('part mod', i, m);
					});
				}
			},
			{
				text: 'Clear Mods',
				callback: () => {
					props = {};
					propsRow.clear();
				}
			},
			{
				text: 'Zero Effects',
				callback: () => {
					const fxList = ['distortion', 'bitCrush', 'autoFilter', 'autoPanner', 'cheby', 'chorus', 'feedback', 'phaser', 'pingPong', 'tremolo', 'vibrato',];
					fxList.forEach(f => {
						if (!props.hasOwnProperty(f)) return;
						updateProp(f + '-chance', 0);
					});
				}
			}
		]);

		propsRow = panel.add(new UIRow({ class: "break" }));

		

		partModRow = panel.add(new UIRow({ class: "break" }));
	}

	return { connect, get, load, getMods, getPartMods, removeProp, updateProp, getPropParams, getPropDefaults, getPropRef, getPropType, clearModEdit, removePropMod };

}

