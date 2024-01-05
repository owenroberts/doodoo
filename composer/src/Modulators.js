/*
	ui section to add a modulator
	defaults are the default properties in Properites.js
	props are modified props
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
		const prop = app.ui.faces.propSelect.value;
		app.ui.faces.propSelect.value = '';
		if (!prop) return;
		if (props[prop]) return;
		if (!props[prop]) {
			props[prop] = structuredClone(defaults[prop]);
		}
		// console.log('add new prop', prop, props[prop]);
		addProp(prop, true);
	}

	function addProp(prop, isOpen) {

		const tree = new UITree({ title: labelFromKey(prop) });
		if (isOpen) tree.open();

		const removeBtn = propsRow.add(new UIButton({
			text: 'X',
			callback: () => {
				delete props[prop];
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
		
		let propType = 'number';
		if (props[prop].hasOwnProperty('type')) propType = props[prop].type;
		else if (props[prop].hasOwnProperty('list')) propType = 'number-list';
		else if (props[prop].hasOwnProperty('stack')) propType = 'stack';

		const propTypeSelect = new UISelect({
			value: propType,
			options: ['number', 'number-list', 'string-list', 'note-list', 'stack'],
			callback: type => { 
				propParamsRow.clear();
				delete props[prop].mod;
				addPropType(propParamsRow, type, prop);
			}
		})
		propRow.add(propTypeSelect);
		tree.add(propRow);

		addPropType(propParamsRow, propType, prop);
		propRow.add(propParamsRow);

		// console.log('tree', tree);
	}

	function addPropType(row, propType, prop) {
		switch(propType) {
			case 'number':
				// set default if prop isn't passed
				if (!props[prop].hasOwnProperty('value')) {
					const step = +prompt('Step?', 1);
					props[prop] = { value: 0, step, type: propType, ...defaults[prop] }; 
				}
				addValue(row, prop, 'Value');
			break;
			case 'number-list':
				// set default if prop isn't passed
				if (!props[prop].hasOwnProperty('index')) {
					props[prop] = { index: 0, list: [], type: propType, ...defaults[prop] };
				}
				addList(row, prop);
			break;
			case 'stack':
				if (!props[prop].hasOwnProperty('stack')) {
					props[prop] = { 'stack': [[]], options: [], ...defaults[prop] };
				}
				addStack(row, prop);
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
		
		const params = getParams(propString);

		row.add(new UILabel({ text: 'List' }));
		let uiClass = UINumberList;
		if (params.list) {
			if (typeof params.list[0] === 'string') uiClass = UIInputList;
		} else {
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
		// console.log('add mod', prop);

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
			step: 0.005,
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
			{ callback: addNewProp, key: 'm', text: '+' },
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

