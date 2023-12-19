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
		const propName = app.ui.faces.propSelect.value;
		if (!propName) return;
		if (!props[propName]) {
			props[propName] = structuredClone(defaults[propName]);
		}
		if (props[propName].isMod) return;
		// const params = structuredClone(defaults[prop]);
		console.log(props[propName]);
		// addMod(propName, defaults);
		const prop = props[propName];


		panel.addRow();
		const tree = new UITree({ title: labelFromKey(propName) });
		tree.open();
		panel.add(tree);

		
		const propType = 'number'; // default prop type
		const propRow = new UIRow();

		tree.add(new UILabel({ text: "Prop Type" }));
		const propTypeSelect = new UISelect({
			options: ['number', 'number-list', 'string-list', 'note-list'],
			callback: value => { 
				console.log('prop type', value);
				propRow.clear();
				prop.mod = undefined;
				if (value == 'number') addValue(propRow, prop);
			}
		})
		tree.add(propTypeSelect, undefined, true);
		tree.add(propRow, undefined, true);

		if (prop.value) addValue(propRow, prop);

		tree.add(new UIButton({
			text: '+ Mod',
			callback: () => {
				console.log('mod', prop);
				if (prop.mod) return;
				prop.mod = {};
				// const modTree = getModTree();
				const mod = addMod(labelFromKey(propName + 'Mod'), prop)
				propRow.add(mod);
			}
		}), undefined, true);
		
		console.log('tree', tree);

	}

	function addValue(propRow, prop) {
		propRow.add(new UILabel({ text: "Value" }));
		propRow.add(new UINumberStep({
			value: prop.value ?? 0,
			step: prop.step ?? 1,
			callback: value => { prop.value = value; }
		}));
		// propRow.addBreak();
	}

	function addList() {

	}

	function addMod(title, prop) {

		const tree = getModTree(title, prop.mod);
		panel.add(tree);

		for (const mm in { minMod: 'minMod', maxMod: 'maxMod' }) {
			if (prop.mod[mm]) {
				const mTree = getModTree(labelFromKey(title + ' ' + mm), prop.mod[mm]);
				tree.add(mTree);
			} else {
				prop.mod[mm] = {};
				const mTree = getModTree(labelFromKey(title + ' ' + mm), prop.mod[mm]);
				const mBtn = new UIButton({
					text: labelFromKey(mm),
					callback: () => {
						tree.add(mTree);
						mBtn.remove();
					}
				});
				tree.add(mBtn);
			}
		}
		return tree;
	}

	function getModTree(title, mod) {
		// console.log(title, prop, params);

		const tree = new UITree({ title: title });

		tree.add(new UILabel({ text: "Min" }));
		tree.add(new UINumberStep({
			value: mod.min ?? 0,
			step: mod.step ?? 1,
			callback: value => { mod.min = value; }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Max" }));
		tree.add(new UINumberStep({
			value: mod.max ?? 1,
			step: mod.step ?? 1,
			callback: value => { mod.max = value; }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Step" }));
		tree.add(new UINumberStep({
			value: mod.step ?? 1,
			step: 0.1,
			callback: value => { mod.step = value; }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Update" }));
		tree.add(new UIChance({
			value: mod.chance ?? 0,
			label: 'Chance',
			step: 0.005,
			callback: value => { mod.chance = value; }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Type" }));
		tree.add(new UISelect({
			value: mod.type ?? 'value',
			options: ['value', 'range', 'walk', 'walkUp', 'walkDown'],
			callback: value => { mod.type = value; }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Kick In" }));
		tree.add(new UINumberStep({
			value: mod.kick ?? 0,
			callback: value => { mod.kick = value; }
		}));
		tree.addBreak();

		return tree;
	}

	function get() {
		return props;
	}

	function load(mods) {
		for (const prop in mods) {
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

