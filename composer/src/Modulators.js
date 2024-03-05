/*
	ui section to add a modulator
	defaults are the default properties in Properites.js
	props are modified props
	props updated using string that references props obj structure, to prevent passing references
	propString 'curve-value', 'curve-mod-min', 'curve-mod-min-mod-max' etc

	
	why props not mods?
*/

function Modulators(app, defaults) {

	let panel, propsRow;
	let partModRow, partModTrees = [], partMods = [], partModIndex = 0;
	let props = {};
	let propsUI = {};
	let modDefaults = {
		min: { value: 0, step: 1 },
		max: { value: 1, step: 1 },
		step: { value: 1, step: 0.01 },
		kick: { value: 0, step: 1 },
		chance: { value: 0.5, step: 0.05 },
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

	function getPropType(propString, partIndex=-1) {
		const params = getParams(propString, partIndex);
		let type = 'number';
		if (params.hasOwnProperty('type')) type = params.type;
		else if (params.hasOwnProperty('list')) type = 'number-list';
		else if (params.hasOwnProperty('stack')) type = 'stack';
		return type;
	}

	function getPropFromString(propString, partIndex=-1) {
		// console.log('get', propString);
		// let prop;
		let prop = partIndex < 0 ? props : partMods[partIndex];
		
		if (propString.includes('-')) {
			// prop = props;
			const children = propString.split('-');
			for (let i = 0; i < children.length; i++) {
				prop = prop[children[i]];
			}
		} else {
			prop = prop[propString];
		}
		// console.log('return', prop);
		return prop;
	}

	function getParams(propString, partIndex=-1) {
		let prop = partIndex < 0 ? props : partMods[partIndex];
		if (propString.includes('-')) {
			const children = propString.split('-');
			for (let i = 0; i < children.length; i++) {
				prop = prop[children[i]];
			}
		} else {
			prop = prop[propString];
		}
		return structuredClone(prop);
	}

	function getDefaults(propString, partIndex=-1) {
		// let prop, propLast;
		let prop = partIndex < 0 ? props : partMods[partIndex];
		let propLast = propString;
		if (propString.includes('-')) {
			// prop = props;
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

	function addNewProp(propName, partIndex=-1) {
		// const propName = app.ui.faces.propSelect.value;
		// app.ui.faces.propSelect.value = '';
		if (!propName) return;
		if (props[propName] && partIndex < 0) return;
		const prop = structuredClone(defaults[propName]);
		if (partIndex < 0 && !props[propName]) props[propName] = prop;
		if (partIndex >= 0) {
			if (!partMods[partIndex]) partMods[partIndex] = {};
			if (!partMods[partIndex][propName]) partMods[partIndex][propName] = prop;
		}

		if (partIndex >= 0) {
			if (!partModTrees[partIndex]) addPartModTree(partIndex);
		}

		addProp(propName, partIndex);
	}

	function addPartModTree(partIndex) {
		const tree = new UITree({ title: `Part ${ partIndex }` });
		const removeBtn = partModRow.add(new UIButton({
			text: 'X',
			callback: () => {
				// delete partMods[partIndex];
				partMods.splice(partIndex, 1);
				partModRow.remove(tree);
				partModRow.remove(removeBtn);
			}
		}));
		partModRow.add(tree);
		partModTrees[partIndex] = tree;
	}

	function addProp(propName, partIndex=-1) {

		const tree = new UITree({ title: labelFromKey(propName) });
		const row = partIndex < 0 ? propsRow : partModTrees[partIndex];
		const removeBtn = row.add(new UIButton({
			text: 'X',
			callback: () => {
				delete props[propName];
				row.remove(tree);
				row.remove(removeBtn);
			}
		}));
		
		row.add(tree);
		row.addBreak();

		const propRow = new UIRow({ class: 'break' });
		const propParamsRow = new UIRow({ class: 'break' });
		
		propRow.add(new UILabel({ text: "Prop Type" }));
		const propType = getPropType(propName, partIndex);

		const propTypeSelect = new UISelect({
			value: propType,
			options: ['number', 'number-list', 'string-list', 'note-list', 'stack', 'chance', 'bundle'],
			callback: type => { 
				propParamsRow.clear();
				delete props[propName].mod;
				addPropUI(propParamsRow, type, propName, partIndex);
			}
		})
		propRow.add(propTypeSelect);
		tree.add(propRow);

		addPropUI(propParamsRow, propType, propName, partIndex);
		propRow.add(propParamsRow);

		// console.log('tree', tree);
	}

	function addPropUI(row, propType, propString, partIndex) {
		const params = getParams(propString, partIndex);
		const defaults = getDefaults(propString, partIndex);

		// console.log('params', params);
		// console.log('defaults', defaults);
		// console.log('type', propType);
		
		switch(propType) {
			case 'number':
			case 'chance':
				
				updateProp(propString, propType, partIndex, 'type');

				// set default if not existing isn't passed
				if (!params.hasOwnProperty('value')) {
					const step = +prompt('Step?', 1);
					updateProp(propString, 0, partIndex, 'value');
					updateProp(propString, step, partIndex, 'step');
				}
				addValue(row, propString, partIndex, 'Value');
			break;
			case 'number-list':
				// set default if prop isn't passed
				updateProp(propString, propType, partIndex, 'type');

				if (!params.hasOwnProperty('list')) {
					updateProp(propString, defaults.list ?? [], partIndex, 'list');
				}

				if (!params.hasOwnProperty('index')) {
					updateProp(propString, defaults.index ?? 0, partIndex, 'index');
				}
				
				addList(row, propString, partIndex);
			break;
			case 'stack':

				updateProp(propString, propType, partIndex, 'type');

				if (!params.hasOwnProperty('stack')) {
					updateProp(propString, defaults.stack ?? [[]], partIndex, 'stack');
				}

				if (!params.hasOwnProperty('options')) {
					updateProp(propString, defaults.options ?? [], partIndex, 'options');
				}

				addStack(row, propString, partIndex);
			break;
			case 'bundle':
				for (const param in params) {
					if (param === 'type') continue;
					row.add(new UILabel({ text: app.ui.labelFromKey(param), class: 'break-line' }));
					// row.addBreak();
					const propType = getPropType(`${propString}-${param}`, partIndex);
					addPropUI(row, propType, `${propString}-${param}`, partIndex);
					row.addBreak();
				}
				// needs ui to add params to bundle ... ?
			break;
		}
	}

	function updateProp(propString, value, partIndex=-1, valueType="value") {
		// let prop;
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

	function addValue(row, propString, partIndex, label, level=0) {
		const params = getParams(propString);
		row.add(new UILabel({ text: label }));
		// console.log(propString, params);
		
		let uiClass = UINumberStep;
		if (params?.type === 'chance') uiClass = UIChance;
		const ui = row.add(new uiClass({
			...params, // step, options, etc from defaults
			value: params.value ?? 0,
			label: 'Chance',
			callback: value => { updateProp(propString, value, partIndex); }
		}));
		propsUI[propString] = { value: ui }

		addMod(row, propString, partIndex, label, level);
	}

	function addList(row, propString, partIndex, level=0) {
		
		const params = getParams(propString);

		row.add(new UILabel({ text: 'List' }));
		
		let uiClass = UINumberList;
		if (typeof params.list[0] === 'string') {
			uiClass = UIInputList;
		} else if (!params.list) {
			if (prompt('Type? string or number', 'string') === 'string') uiClass = UIInputList;
		}

		const listUI = row.add(new uiClass({
			list: params.list ?? [],
			callback: list => { updateProp(propString, list, partIndex, 'list'); }
		}));
		row.addBreak();

		row.add(new UILabel({ text: 'Index' }));
		const indexUI = row.add(new UINumberStep({
			value: params.index ?? 0,
			min: 0,
			step: 1,
			callback: index => { updateProp(propString, index, partIndex, 'index'); }
		}));

		propsUI[propString] = { list: listUI, index: indexUI };
		
		// index prop doesn't exist .... 
		addMod(row, propString, partIndex, 'Index', level);
	}

	function addStack(row, propString, partIndex, level=0) {
		const params = getParams(propString, partIndex);
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
			updateProp(propString, s, partIndex, 'stack');
		}

		for (let i = 0; i < params.stack.length; i++) {
			const stack = addStack(i, params.stack[i].list, partIndex);
		}
	}

	function addMod(row, propString, partIndex, label, level) {

		let prop = getPropFromString(propString, partIndex);

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
		const prop = getPropFromString(propString, partIndex);
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
		const prop = getPropFromString(propString);
		const params = getParams(propString);
		// console.log('mod tree', propString, prop);

		const tree = new UITree({ title: title });

		const minRow = tree.add(new UIRow({ class: 'break' }));
		addValue(minRow, propString + '-min', 'Min', partIndex, level);

		const maxRow = tree.add(new UIRow({ class: 'break' }));
		addValue(maxRow, propString + '-max', 'Max', partIndex, level);

		const stepRow = tree.add(new UIRow({ class: 'break' }));
		addValue(stepRow, propString + '-step', 'Step', partIndex, level);

		tree.add(new UILabel({ text: "Update" }));
		tree.add(new UIChance({
			value: params.chance?.value ?? 0,
			label: 'Chance',
			step: 0.05,
			// callback: value => { prop.chance.value = value; }
			callback: value => { updateProp(propString + '-chance', value, partIndex); }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Type" }));
		tree.add(new UISelect({
			value: params.type?.value ?? 'value',
			options: ['value', 'range', 'walk', 'walkUp', 'walkDown'],
			// callback: value => { prop.type.value = value; }
			callback: value => { updateProp(propString + '-type', value, partIndex); }

		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Kick In" }));
		tree.add(new UINumberStep({
			value: params.kick?.value ?? 0,
			// callback: value => { prop.kick.value = value; }
			callback: value => { updateProp(propString + '-kick', value, partIndex); }
		}));
		tree.addBreak();

		return tree;
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

	function collapse() {
		propsRow.uiChildren
			.filter(c => c.constructor.name === 'UITree')
			.forEach(c => { c.close(); });
	}

	function load(data) {
		if (!data.mods && !data.partMods) return;
		
		propsRow.clear();
		props = {};
		for (const prop in data.mods) {
			props[prop] = structuredClone(data.mods[prop]);
			addProp(prop);
		}
		collapse();

		partModRow.clear();
		partMods = [];
		for (let i = 0; i < data.partMods.length; i++) {
			const mods = data.partMods[i];
			if (mods) {
				partMods[i] = {};
				addPartModTree(i);
				for (const prop in mods) {
					partMods[i][prop] = structuredClone(mods[prop]);
					addProp(prop, i);
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
				selected: 'instruments',
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

		panel.addRow();

		app.ui.addCallbacks([
			{
				text: 'Collapse',
				callback: collapse
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
			},
			{
				text: 'Zero Effects',
				callback: () => {
					const fxList = ['distortion', 'bitCrush', 'autoFilter', 'autoPanner', 'cheby', 'chorus', 'feedback', 'phaser', 'pingPong', 'tremolo', 'vibrato',];
					fxList.forEach(f => {
						if (!props.hasOwnProperty(f)) return;
						updateProp(f + '-chance', 0);
						propsUI[f + '-chance'].value.update(0); // crazy?
					});
				}
			}
		]);

		propsRow = panel.add(new UIRow({ class: "break" }));

		panel = app.ui.getPanel('part-mods', { label: 'Part Mods' });

		app.ui.addUIs({
			partModSelect: {
				type: "UIInputSearch",
				listName: "prop-list",
				label: "Add mod:",
				options: Object.keys(defaults),
				selected: 'instruments',
			}
		});

		app.ui.addCallbacks([
			{ 
				text: '+', 
				callback: () => {
					if (app.ui.faces.partModSelect.value.length === 0) {
						app.ui.faces.partModSelect.focus();
					} else {
						addNewProp(app.ui.faces.partModSelect.value, partModIndex);
						app.ui.faces.partModSelect.value = '';
					}
				},
			},
		]);

		app.ui.addProp('partModIndex', {
			type: "UINumberStep",
			value: 0,
			callback: value => { partModIndex = value; }
		});

		partModRow = panel.add(new UIRow({ class: "break" }));
	}

	return { connect, get, load, getMods, getPartMods };

}

