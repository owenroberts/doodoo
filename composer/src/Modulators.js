/*
	ui section to add a modulator
	defaults are the default properties in Properites.js
	props are modified props
*/

function Modulators(app, defaults) {

	let panel, propsRow;
	let props = {};
	let modDefaults = {
		min: { value: 0, step: 0.1 },
		max: { value: 1, step: 0.1 },
		step: { value: 1, step: 0.01 },
		kick: { value: 0, step: 1 },
		chance: { value: 0, step: 0.0005 },
		type: { value: 'value', options: ['value', 'range', 'walk', 'walkUp', 'walkDown'] },
	};

	let propDefaults = {
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

		const tree = new UITree({ title: labelFromKey(prop) });
		tree.open();
		propsRow.add(tree);

		const propRow = new UIRow({ class: 'break' });
		const propParamsRow = new UIRow({ class: 'break' });
		
		propRow.add(new UILabel({ text: "Prop Type" }));
		const propTypeSelect = new UISelect({
			value: props[prop].type ?? 'number',
			options: ['number', 'number-list', 'string-list', 'note-list'],
			callback: type => { 
				propParamsRow.clear();
				delete props[prop].mod;
				addPropType(propParamsRow, type, prop);
			}
		})
		propRow.add(propTypeSelect, undefined, true);
		tree.add(propRow);

		if (props[prop].value) addPropType(propParamsRow, 'number', prop);
		if (props[prop].list) addPropType(propParamsRow, 'number-list', prop);

		propRow.add(propParamsRow);

		// console.log('tree', tree);
	}

	function addPropType(row, propType, prop) {
		switch(propType) {
			case 'number':
				// set default if prop isn't passed
				if (!props[prop].hasOwnProperty('value')) {
					const step = +prompt('Step?', 1);
					props[prop] = { value: 0, step, type: propType }; 
				}
				// how to set step?
				addValue(row, prop, 'Value');
			break;
			case 'number-list':
				// set default if prop isn't passed
				console.log('props prop', props[prop])
				if (!props[prop].hasOwnProperty('index')) {
					props[prop] = { index: 0, list: [], type: propType };
				}
				addList(row, prop);
			break;
		}
	}

	function getPropFromString(propString) {
		let prop;
		if (propString.includes('-')) {
			prop = props;
			const parts = propString.split('-');
			for (let i = 0; i < parts.length; i++) {
				prop = prop[parts[i]];
			}
		} else {
			prop = props[propString];
		}

		return prop;
	}

	function getParams(propString) {
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
		return { ...defaults[propLast], ...modDefaults[propLast], ...structuredClone(prop), };
	}

	function updateProp(propString, value, valueType="value") {
		let prop;
		if (propString.includes('-')) {
			prop = props;
			const parts = propString.split('-');
			for (let i = 0; i < parts.length; i++) {
				prop = prop[parts[i]];
			}
			prop[valueType] = value;
		} else {
			props[propString][valueType] = value;
		}
	}

	function addValue(row, propString, label, level=0) {
		const params = getParams(propString);
		row.add(new UILabel({ text: label }));
		row.add(new UINumberStep({
			...params, // step, options, etc from defaults
			value: params.value ?? 0,
			callback: value => { updateProp(propString, value); }
		}));
		addMod(row, propString, label, level);
	}

	function addList(row, propString, level=0) {
		// let { prop, params } = getPropFromString(propString);
		const params = getParams(propString);
		// console.log('add list prop', propString, prop);

		row.add(new UILabel({ text: 'List' }));
		row.add(new UINumberList({
			list: params.list ?? [],
			callback: list => { updateProp(propString, list, 'list'); }
		}));
		row.addBreak();

		row.add(new UILabel({ text: 'Index' }));
		row.add(new UINumberStep({
			value: params.index ?? 0,
			min: 0,
			step: 1,
			callback: index => { updateProp(propString, index, 'index'); }
		}))
		
		// index prop doesn't exist .... 
		addMod(row, propString, 'Index', level);
	}

	function addMod(row, propString, label, level) {
		// const { prop, params } = getPropFromString(propString);

		// const params = getParams(propString);
		const prop = getPropFromString(propString);
		// console.log('add mod', propString, prop);

		if (prop.mod) {
			row.addBreak();
			const tree = getModTree(labelFromKey(label + 'Mod'), propString + "-mod", level+1);
			row.add(tree);
		} else if (level < 2) {
			row.add(new UIButton({
				text: '+Mod',
				callback: () => {
					if (prop.mod) return;
					prop.mod = structuredClone(modDefaults);
					const tree = getModTree(labelFromKey(label + 'Mod'), propString + "-mod", level+1);
					row.add(tree);
				}
			}));
		}
	}

	function getModTree(title, propString, level) {
		// console.log('mod tree', title, mod);
		const prop = getPropFromString(propString);

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
				callback: () => { console.log('props', props); }
			},
			{
				text: 'Clear Props',
				callback: () => {
					props = {};
					propsRow.clear();
				}
			}
		]);

		propsRow = panel.add(new UIRow());
	}

	return { connect, get, load };

}

