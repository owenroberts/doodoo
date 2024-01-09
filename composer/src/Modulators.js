/*
	ui section to add a modulator
	defaults are the default properties in Properites.js
	props are modified props
	props updated using string that references props obj structure, to prevent passing references
	propString 'curve-value', 'curve-mod-min', 'curve-mod-min-mod-max' etc

	

*/

function Modulators(app, defaults) {

	let panel, propsRow;
	let props = {};
	let modDefaults = {
		min: { value: 0, step: 1 },
		max: { value: 1, step: 1 },
		step: { value: 1, step: 0.01 },
		kick: { value: 0, step: 1 },
		chance: { value: 0.5, step: 0.0005 },
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
		const propName = app.ui.faces.propSelect.value;
		app.ui.faces.propSelect.value = '';
		if (!propName) return;
		if (props[propName]) return;
		if (!props[propName]) {
			props[propName] = structuredClone(defaults[propName]);
		}
		// console.log('add new prop', prop, props[prop]);
		addProp(propName, true);
	}

	function getPropType(propString) {
		const params = getParams(propString);
		let type = 'number';
		if (params.hasOwnProperty('type')) type = params.type;
		else if (params.hasOwnProperty('list')) type = 'number-list';
		else if (params.hasOwnProperty('stack')) type = 'stack';
		return type;
	}

	function addProp(propName, isOpen) {

		const tree = new UITree({ title: labelFromKey(propName) });
		if (isOpen) tree.open();

		const removeBtn = propsRow.add(new UIButton({
			text: 'X',
			callback: () => {
				delete props[propName];
				propsRow.remove(tree);
				propsRow.remove(removeBtn);
			}
		}));
		
		propsRow.add(tree);
		propsRow.addBreak();

		const propRow = new UIRow({ class: 'break' });
		const propParamsRow = new UIRow({ class: 'break' });

		// console.log('props', prop, props[prop]);
		
		propRow.add(new UILabel({ text: "Prop Type" }));
		const propType = getPropType(propName);

		const propTypeSelect = new UISelect({
			value: propType,
			options: ['number', 'number-list', 'string-list', 'note-list', 'stack', 'chance', 'bundle'],
			callback: type => { 
				propParamsRow.clear();
				delete props[propName].mod;
				addPropType(propParamsRow, type, propName);
			}
		})
		propRow.add(propTypeSelect);
		tree.add(propRow);

		addPropType(propParamsRow, propType, propName);
		propRow.add(propParamsRow);

		// console.log('tree', tree);
	}

	function addPropType(row, propType, propString) {
		const params = getParams(propString);
		switch(propType) {
			case 'number':
			case 'chance':
				// set default if propName isn't passed
				
				if (!params.hasOwnProperty('value')) {
					const step = +prompt('Step?', 1);
					updateProp(propString, 0, 'value');
					updateProp(propString, step, 'step');
					updateProp(propString, propType, 'type');
					const defaults = getDefaults(propString);
					for (const prop in defaults) {
						updateProp(propString, prop, defaults[prop]);
					}

					// props[propName] = { value: 0, step, type: propType, ...defaults[propName] }; 
				}
				addValue(row, propString, 'Value');
			break;
			case 'number-list':
				// set default if prop isn't passed
				if (!params.hasOwnProperty('list')) {
					updateProp(propString, 0, 'index');
					updateProp(propString, [], 'list');
					updateProp(propString, propType, 'type');
					const defaults = getDefaults(propString);
					for (const prop in defaults) {
						updateProp(propString, prop, defaults[prop]);
					}
				}
				
				addList(row, propString);
			break;
			case 'stack':
				if (!params.hasOwnProperty('stack')) {
					updateProp(propString, [[]], 'stack');
					updateProp(propString, [], 'options');
					updateProp(propString, propType, 'type');
					const defaults = getDefaults(propString);
					for (const prop in defaults) {
						updateProp(propString, prop, defaults[prop]);
					}
				}
				addStack(row, propString);
			break;
			case 'bundle':
				for (const param in params) {
					if (param === 'type') continue;
					row.add(new UILabel({ text: app.ui.labelFromKey(param) }));
					row.addBreak();
					const propType = getPropType(`${propString}-${param}`);
					addPropType(row, propType, `${propString}-${param}`);
				}
				// needs ui to add params to bundle ... ?
			break;
		}
	}

	function getPropFromString(propString) {
		// console.log('get', propString);
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
		// console.log('return', prop);
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
		return structuredClone(prop);
	}

	function getDefaults(propString) {
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
		return { ...defaults[propLast], ...modDefaults[propLast] };
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
		// console.log(propString, params);
		
		let uiClass = UINumberStep;
		if (params?.type === 'chance') uiClass = UIChance;
		row.add(new uiClass({
			...params, // step, options, etc from defaults
			value: params.value ?? 0,
			label: 'Chance',
			callback: value => { updateProp(propString, value); }
		}));

		addMod(row, propString, label, level);
	}

	function addList(row, propString, level=0) {
		
		const params = getParams(propString);

		row.add(new UILabel({ text: 'List' }));
		
		let uiClass = UINumberList;
		if (typeof params.list[0] === 'string') {
			uiClass = UIInputList;
		} else if (!params.list) {
			if (prompt('Type? string or number', 'string') === 'string') uiClass = UIInputList;
		}

		row.add(new uiClass({
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

	function addStack(row, propString, level=0) {
		const params = getParams(propString);

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
			// console.log('update stacks', s);
			updateProp(propString, s, 'stack');
		}

		for (let i = 0; i < params.stack.length; i++) {
			const stack = addStack(i, params.stack[i].list);
		}
	}

	function addMod(row, propString, label, level) {

		let prop = getPropFromString(propString);
		// console.log('add mod', propString, prop);

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
					addModTree(row, propString, label, level);
				}
			}));
		}

		if (prop.mod) {
			row.addBreak();
			addModTree(row, propString, label, level);
		}
	}

	function addModTree(row, propString, label, level) {
		const prop = getPropFromString(propString);
		const tree = getModTree(labelFromKey(label + 'Mod'), propString + "-mod", level+1);
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

	function getModTree(title, propString, level) {
		const prop = getPropFromString(propString);
		const params = getParams(propString);
		// console.log('mod tree', propString, prop);

		const tree = new UITree({ title: title });

		const minRow = tree.add(new UIRow({ class: 'break' }));
		addValue(minRow, propString + '-min', 'Min', level);

		const maxRow = tree.add(new UIRow({ class: 'break' }));
		addValue(maxRow, propString + '-max', 'Max', level);

		const stepRow = tree.add(new UIRow({ class: 'break' }));
		addValue(stepRow, propString + '-step', 'Step', level);

		tree.add(new UILabel({ text: "Update" }));
		tree.add(new UIChance({
			value: params.chance?.value ?? 0,
			label: 'Chance',
			step: 0.05,
			// callback: value => { prop.chance.value = value; }
			callback: value => { updateProp(propString + '-chance', value); }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Type" }));
		tree.add(new UISelect({
			value: params.type?.value ?? 'value',
			options: ['value', 'range', 'walk', 'walkUp', 'walkDown'],
			// callback: value => { prop.type.value = value; }
			callback: value => { updateProp(propString + '-type', value); }

		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Kick In" }));
		tree.add(new UINumberStep({
			value: params.kick?.value ?? 0,
			// callback: value => { prop.kick.value = value; }
			callback: value => { updateProp(propString + '-kick', value); }
		}));
		tree.addBreak();

		return tree;
	}

	function get() {
		return props;
	}

	function load(mods) {
		propsRow.clear();
		props = {};
		for (const prop in mods) {
			props[prop] = structuredClone(mods[prop]);
			addProp(prop, false);
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
						addNewProp();
					}
				},
			},
			{
				text: 'Collapse',
				callback: () => {
					propsRow.uiChildren
						.filter(c => c.constructor.name === 'UITree')
						.forEach(c => { c.close(); });
				}
			},
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

		propsRow = panel.add(new UIRow({ class: "break" }));
	}

	return { connect, get, load };

}

