/*
	ui section to add a modulator
*/

function Modulators(app, props) {
	
	let panel;
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

	function add() {
		const propName = app.ui.faces.propSelect.value;
		if (!propName) return;
		if (props[propName].isMod) return;
		const defaults = props[propName];
		addMod(propName, defaults);
	}

	function addMod(prop, params) {

		props[prop].isMod = true;
		panel.addRow();

		const tree = getModTree(labelFromKey(prop), props[prop], params);
		panel.add(tree);

		for (const minMax in { minMod: params.minMod, maxMod: params.maxMod }) {
			// console.log(minMax, params[minMax], Object.keys(params[minMax]).length)

			for (const mmProp in minMaxDefaults) {
				props[prop][minMax][mmProp] = params[minMax][mmProp] ?? minMaxDefaults[mmProp];
			}

			const mTree = getModTree(
				labelFromKey(prop + ' ' + minMax),
				props[prop][minMax],
				{ ...minMaxDefaults, ...params[minMax] },
			);
			
			if (Object.keys(params[minMax]).length > 0) {
				tree.add(mTree);
			} else {
				const mBtn = new UIButton({
					text: labelFromKey(minMax),
					callback: () => {
						tree.add(mTree);
						mBtn.remove();
					}
				});
				tree.add(mBtn);
			}
		}
	}

	function getModTree(title, prop, params) {
		// console.log(title, prop, params);

		const tree = new UITree({ title: title });

		if (params.value) {
			tree.add(new UILabel({ text: "Value" }));
			tree.add(new UINumberStep({
				value: params.value,
				step: params.step,
				callback: value => {
					prop.value = value;
					// console.log('value', prop);
				}
			}));
			tree.addBreak();
		}

		tree.add(new UILabel({ text: "Min" }));
		tree.add(new UINumberStep({
			value: params.min,
			step: params.step,
			callback: value => {
				prop.min = value;
				// console.log('min', prop);
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Max" }));
		tree.add(new UINumberStep({
			value: params.max,
			step: params.step,
			callback: value => {
				prop.max = value;
				// console.log('max', prop);
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Step" }));
		tree.add(new UINumberStep({
			value: params.step,
			step: 0.1,
			callback: value => {
				prop.step = value;
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Update" }));
		tree.add(new UIChance({
			value: params.chance,
			label: 'Chance',
			step: 0.005,
			callback: value => {
				prop.chance = value;
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Type" }));
		tree.add(new UISelect({
			value: params.type,
			options: ['value', 'range', 'walk', 'walkUp', 'walkDown'],
			callback: value => { prop.type = value; }
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Kick In" }));
		tree.add(new UINumberStep({
			value: params.kick,
			callback: value => { prop.kick = value; }
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
				options: Object.keys(props),
				// callback: 
			}
		});

		app.ui.addCallbacks([
			{ callback: add, key: 'm', text: '+' },
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

