/*
	ui section to add a modulator
	defaults are the default properties in Properites.js
	props are modified props
*/

function Modulators(app, defaults) {
	
	let panel;
	let props = {};
	const minMaxDefaults = {
		min: 0,
		max: 0,
		chance: 0,
		step: 1,
		kick: 0,
		type: 'walk',
	};

	function labelFromKey(key) {
		let label = key[0].toUpperCase() + key.substring(1);
		label = label.replace(/(?<=[a-z])(?=[A-Z])/g, ' ');
		return label;
	}

	function addProp() {
		const prop = app.ui.faces.propSelect.value;
		if (!prop) return;
		if (!props[prop]) {
			props[prop] = structuredClone(defaults[prop]);
		}
		addMod(prop);
	}

	function addMod(prop) {

		panel.addRow();
		const tree = new UITree({ title: labelFromKey(prop) });
		tree.open();
		panel.add(tree);

		const propType = 'number'; // default prop type
		const propRow = new UIRow({ class: 'break' });

		propRow.add(new UILabel({ text: "Prop Type" }));
		const propTypeSelect = new UISelect({
			options: ['number', 'number-list', 'string-list', 'note-list'],
			callback: value => { 
				propRow.clear();
				prop.mod = undefined;
				if (value == 'number') addValue(propRow, prop, 'Value', 0);
			}
		})
		propRow.add(propTypeSelect, undefined, true);
		tree.add(propRow);

		if (props[prop].value) addValue(propRow, prop, 'Value', 0);

		// console.log('tree', tree);
	}

	function addValue(propRow, prop, label, level) {

		// need to rethink adding mods here, use mod string??
		// mod string, loopNum, loopNum-mod-min
		// const p = props[prop]; // can do it this way // but will it sucK??

		propRow.add(new UILabel({ text: label }));
		propRow.add(new UINumberStep({
			value: props[prop].value ?? 0,
			step: props[prop].step ?? 1,
			callback: value => { 
				props[prop].value = value;
			}
		}));

		if (level > 1) return;
		propRow.add(new UIButton({
			text: '+Mod',
			callback: () => {
				// console.log('prop', prop);
				if (props[prop].mod) return;
				props[prop].mod = { min: {}, max: {}, step: {}, chance: {}, kick: {}, type: {}, };
				
				const tree = getModTree(labelFromKey(prop + 'Mod'), props[prop].mod, level+1);
				propRow.add(tree);
			}
		}));
	}

	function getModTree(title, mod, level) {
		// console.log('mod tree', title, mod);

		const tree = new UITree({ title: title });

		const minRow = new UIRow({ class: 'break' });
		tree.add(minRow);
		addValue(minRow, mod.min, title + ' Min', 'Min', level);

		tree.add(new UILabel({ text: "Max" }));
		tree.add(new UINumberStep({
			value: mod.max?.value ?? 1,
			step: mod.step?.value ?? 1,
			// callback: value => { mod.max = value; }
			callback: value => { 
				if (!mod.max) mod.max = {};
				mod.max.value = value;
			}
		}));
		tree.addBreak();

		if (mod.max?.mod && isFirstLevel) {
			const maxTree = getModTree(title + 'Max Mod', mod.max.mod, false);
			tree.add(maxTree);
		}

		tree.add(new UILabel({ text: "Step" }));
		tree.add(new UINumberStep({
			value: mod.step?.value ?? 1,
			step: 0.1,
			// callback: value => { mod.step = value; }
			callback: value => { mod.step = { value }; }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Update" }));
		tree.add(new UIChance({
			value: mod.chance?.value ?? 0,
			label: 'Chance',
			step: 0.005,
			// callback: value => { mod.chance = value; }
			callback: value => { mod.chance = { value }; }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Type" }));
		tree.add(new UISelect({
			value: mod.type?.value ?? 'value',
			options: ['value', 'range', 'walk', 'walkUp', 'walkDown'],
			// callback: value => { mod.type = value; }
			callback: value => { mod.type = { value }; }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Kick In" }));
		tree.add(new UINumberStep({
			value: mod.kick?.value ?? 0,
			// callback: value => { mod.kick = value; }
			callback: value => { mod.kick = { value }; }
		}));
		tree.addBreak();

		return tree;
	}

	function get() {
		return props;
	}

	function load(mods) {
		for (const prop in mods) {
			props[prop] = structuredClone(mods[prop]);
			addMod(prop, mods[prop]);
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
				selected: 'loopNum',
				// callback: 
			}
		});

		app.ui.addCallbacks([
			{ callback: addProp, key: 'm', text: '+' },
			{ 
				key: 'shift-p', 
				text: 'Print Props',
				callback: () => {
					console.log('props', props);
				}
			}
		]);
	}

	return { connect, get, load };

}

