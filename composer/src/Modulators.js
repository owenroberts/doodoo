/*
	ui section to add a modulator
	defaults are the default properties in Properites.js
	props are modified props
	props updated using string that references props obj structure, to prevent passing references
	propString 'curve-value', 'curve-mod-min', 'curve-mod-min-mod-max' etc

	
	why props not mods?
*/

import { UIRow, UITree, UIButton, UIChance, UINumberStep, UIGraph, UILabel, UISelect, UISelectButton, UIToggle, labelFromKey } from '../../../ui/src/UI.js';
import { defaults } from '../../src/defaults.js';
import { modDefaults, propDefaults, typeOptions } from './ModProps.js';

// defaults are the default settings for props and mods
// mods are new mods that overwrite defaults

export function Modulators(app) {

	let mods = {}; // mods are modulators of properties
	let partMods = []; // save current part mods

	// ui
	let panel, modsRow;
	let partModRow, partModRows = [], partModIndex = 0;
	let openModEdit = "None";
	let openModPart = -1;
	let openToggle;

	function getPropType(propString, partIndex=-1) {
		const params = getModParams(propString, partIndex);
		let type = 'number';
		if (params.hasOwnProperty('type')) type = params.type;
		else if (params.hasOwnProperty('list')) {
			if (typeof params.list[0] === 'string') type = 'string-list';
			if (typeof params.list[0] === 'number') type = 'number-list';
		}
		else if (params.hasOwnProperty('stack')) type = 'stack';
		return type;
	}

	function getModRef(propString, partIndex=-1) {
		let modsRef = partIndex < 0 ? mods : partMods[partIndex];
		if (propString.includes('-')) {
			const children = propString.split('-');
			let mod = modsRef;
			for (let i = 0; i < children.length; i++) {
				mod = mod[children[i]];
			}
			return mod;
		} else {
			return modsRef[propString];
		}
	}

	function getModParams(propString, partIndex=-1) {
		return structuredClone(getModRef(propString, partIndex));
	}

	function getPropDefaults(propString) {
		let propLast = propString;
		if (propString.includes('-')) {
			propLast = propString.split('-').pop();
		}
		return { ...defaults[propLast], ...modDefaults[propLast] };
	}

	function addNewMod(propName, partIndex=-1) {

		if (!propName) return;
		if (mods[propName] && partIndex < 0) return; // only one mod per part
		if (partIndex >= 0 && partMods[partIndex]) {
			// only one prop mod per part mod
			if (partMods[partIndex].hasOwnProperty(propName)) return;
		}

		const defaultParams = structuredClone(defaults[propName]);
		if (partIndex < 0 && !mods[propName]) mods[propName] = defaultParams;
		if (partIndex >= 0) {
			if (!partMods[partIndex]) partMods[partIndex] = {};
			if (!partMods[partIndex][propName]) partMods[partIndex][propName] = defaultParams;
		}

		if (partIndex >= 0) {
			if (!partModRows[partIndex]) addPartModUI(partIndex, true);
		}

		// addPropTree(propName, partIndex, true);
		addModUI(propName, partIndex);
	}

	function addModUI(propName, partIndex=-1) {
		const row = partIndex < 0 ? modsRow : partModRows[partIndex];
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
				removeMod(propName, partIndex);
				if (openModEdit === propName && openModPart === partIndex) {
					closeEdit();
				}
				row.remove(propRow);
				if (partIndex >= 0) {
					if (!partMods[partIndex]) {
						partModRow.remove(partModRows[partIndex]);
					}
				}
			}
		}));

		const printBtn = propRow.add(new UIButton({
			text: "P",
			callback: () => {
				console.log(propName, mods[propName]);
			}
		}))

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
					app.modEditor.clear();
					openToggle = editBtn;
					clearModEditHighlight();
					openModEdit = propName;
					openModPart = partIndex;
					propRow.addClass('prop-edit');
					const type = getPropType(propName, partIndex);
					if (type === 'bundle') app.modEditor.addBundle(propName, partIndex);
					else app.modEditor.addProp(propName, partIndex, type);

					app.ui.panels.modEditor.dock();
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

	function removeMod(propName, partIndex=-1) {
		if (partIndex >= 0) {
			delete partMods[partIndex][propName];
			if (Object.keys(partMods[partIndex]).length === 0) {
				partMods.splice(partIndex, 1);
			}
		}
		else delete mods[propName];
	}

	function removePropMod(propName, partIndex=-1) {
		delete mods[propName].mod;
	}

	function updateMod(propString, value, partIndex=-1, valueType="value") {
		let modsRef = partIndex < 0 ? mods : partMods[partIndex];
		if (propString.includes('-')) {
			let mod = modsRef;
			const children = propString.split('-');
			for (let i = 0; i < children.length; i++) {
				mod = mod[children[i]];
			}
			mod[valueType] = value;
		} else {
			modsRef[propString][valueType] = value;
		}
	}

	function get() {
		return { mods, partMods };
	}

	function getMods() {
		return mods;
	}

	function getPartMods() {
		return partMods;
	}

	function load(data) {
		if (!data.mods && !data.partMods) return;

		modsRow.clear();
		mods = {};
		for (const mod in data.mods) {
			mods[mod] = structuredClone(data.mods[mod]);
			addModUI(mod);
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
				for (const mod in mods) {
					partMods[i][mod] = structuredClone(mods[mod]);
					addModUI(mod, i);
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
			}
		});

		app.ui.addCallbacks([
			{ 
				text: '+', 
				callback: () => {

					if (app.ui.faces.propSelect.value.length === 0) {
						app.ui.faces.propSelect.focus();
					} else {
						addNewMod(app.ui.faces.propSelect.value);
						app.ui.faces.propSelect.value = '';
					}
				},
			},
		]);

		app.ui.addProp('partModIndex', {
			label: "Part Index",
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
						addNewMod(app.ui.faces.propSelect.value, partModIndex);
						app.ui.faces.propSelect.value = '';
					}
				},
			},
		]);

		panel.addRow();

		app.ui.addCallbacks([
			{ 
				key: 'shift-p', 
				text: 'Print',
				callback: () => { 
					console.log('mods', mods);
					partMods.forEach((m, i) => {
						console.log('part mod', i, m);
					});
				}
			},
			{
				text: 'Clear',
				callback: () => {
					mods = {};
					partMods = []; // ?
					modsRow.clear();
				}
			},
			{
				text: 'Zero Effects',
				callback: () => {
					ToneFX.forEach(f => {
						if (!mods.hasOwnProperty(f)) return;
						updateMod(f + '-chance', 0);
					});
				}
			}
		]);

		modsRow = panel.add(new UIRow({ class: "break" }));
		partModRow = panel.add(new UIRow({ class: "break" }));
	}

	return { connect, get, load, getMods, getPartMods, updateMod, getModParams, getPropDefaults, getModRef, getPropType, clearModEdit, removePropMod, removeMod };

}

