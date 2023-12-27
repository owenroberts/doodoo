/*
	ui section to add a modulator
	defaults are the default properties in Properites.js
	props are modified props
*/

function Modulators(app, defaults) {
	
	let panel;
	let props = {};
	let modDefaults = {
		min: { value: 0, step: 0.1 },
		max: { value: 1, step: 0.1 },
		step: { value: 1, step: 0.01 },
		kick: { value: 0, step: 1 },
		chance: { value: 0, step: 0.0005 },
		type: { value: 'value', options: ['value', 'range', 'walk', 'walkUp', 'walkDown'] },
		index: { value: 0, step: 1 },
	};

	function labelFromKey(key) {
		let label = key[0].toUpperCase() + key.substring(1);
		label = label.replace(/(?<=[a-z])(?=[A-Z])/g, ' ');
		return label;
	}

	function addNewProp() {
		const prop = app.ui.faces.propSelect.value;
		if (!prop) return;
		if (props[prop]) return;
		if (!props[prop]) {
			props[prop] = structuredClone(defaults[prop]);
		}
		addProp(prop);
	}

	function addProp(prop) {

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
				// props[prop].mod = undefined;
				delete props[prop].mod;
				if (value == 'number') addValue(propRow, prop, 'Value');
				if (value == 'number-list') addList(propRow, prop);
			}
		})
		propRow.add(propTypeSelect, undefined, true);
		tree.add(propRow);

		if (props[prop].value) addValue(propRow, prop, 'Value');
		if (props[prop].list) addList(propRow, prop);

		// console.log('tree', tree);
	}

	function getPropFromString(propString) {
		let prop, propLast;
		if (propString.includes('-')) {
			prop = props;
			const parts = propString.split('-');
			for (let i = 0; i < parts.length; i++) {
				prop = prop[parts[i]];
			}
			propLast = parts[parts.length - 1];
		} else {
			prop = props[propString];
			propLast = propString;
		}
		const params = { ...defaults[propLast], ...modDefaults[propLast], ...structuredClone(prop), };

		// console.log('get prop from string', propString, prop);
		return { prop, params };
	}

	function addValue(propRow, propString, label, level=0) {

		const { prop, params } = getPropFromString(propString);
		console.log('prop', propString, prop, params);

		propRow.add(new UILabel({ text: label }));
		propRow.add(new UINumberStep({
			...params, // step, options, etc from defaults
			value: params.value ?? 0,
			// step: prop.step ?? 1, // big f-ing ???
			callback: value => {
				// console.log(propString, value, prop);
				prop.value = value;
			}
		}));
		addMod(propRow, propString, label, level);

		// if (prop.mod) {
		// 	propRow.addBreak();
		// 	const tree = getModTree(labelFromKey(label + 'Mod'), propString + "-mod", level+1);
		// 	propRow.add(tree);
		// } else if (level < 2) {
		// 	propRow.add(new UIButton({
		// 		text: '+Mod',
		// 		callback: () => {
		// 			// console.log('prop', prop);
		// 			if (prop.mod) return;
		// 			prop.mod = structuredClone(modDefaults);
		// 			const tree = getModTree(labelFromKey(label + 'Mod'), propString + "-mod", level+1);
		// 			propRow.add(tree);
		// 		}
		// 	}));
		// }
	}

	function addList(propRow, propString, level=0) {
		const { prop, params } = getPropFromString(propString);

		propRow.add(new UILabel({ text: 'List' }));
		propRow.add(new UINumberList({
			list: params.list ?? [],
			callback: list => { prop.list = list; }
		}));
		propRow.addBreak();
		addValue(propRow, propString + '-index', 'Index', level+1);

		// index prop doesn't exist .... 
		addMod(propRow, propString + '-index', 'Index', level);
	}

	function addMod(propRow, propString, label, level) {
		const { prop, params } = getPropFromString(propString);
		console.log('add mod', propString, prop, params);
		if (prop.mod) {
			propRow.addBreak();
			const tree = getModTree(labelFromKey(label + 'Mod'), propString + "-mod", level+1);
			propRow.add(tree);
		} else if (level < 2) {
			propRow.add(new UIButton({
				text: '+Mod',
				callback: () => {
					if (prop.mod) return;
					prop.mod = structuredClone(modDefaults);
					const tree = getModTree(labelFromKey(label + 'Mod'), propString + "-mod", level+1);
					propRow.add(tree);
				}
			}));
		}
	}

	function getModTree(title, propString, level) {
		// console.log('mod tree', title, mod);
		const { prop } = getPropFromString(propString);

		const tree = new UITree({ title: title });

		const minRow = tree.add(new UIRow({ class: 'break' }));
		addValue(minRow, propString + '-min', 'Min', level);

		const maxRow = tree.add(new UIRow({ class: 'break' }));
		addValue(maxRow, propString + '-max', 'Max', level);

		const stepRow = tree.add(new UIRow({ class: 'break' }));
		addValue(stepRow, propString + '-step', 'Step', level);

		tree.add(new UILabel({ text: "Update" }));
		tree.add(new UIChance({
			value: prop.chance?.value ?? 0,
			label: 'Chance',
			step: 0.005,
			callback: value => { prop.chance.value = value; }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Type" }));
		tree.add(new UISelect({
			value: prop.type?.value ?? 'value',
			options: ['value', 'range', 'walk', 'walkUp', 'walkDown'],
			callback: value => { prop.type.value = value; }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Kick In" }));
		tree.add(new UINumberStep({
			value: prop.kick?.value ?? 0,
			callback: value => { prop.kick.value = value; }
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
			addProp(prop, mods[prop]);
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
			{ callback: addNewProp, key: 'm', text: '+' },
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

