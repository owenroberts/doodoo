/*
	ui section to add a modulator
*/

function Modulators(app, props) {
	
	let panel;

	function labelFromKey(key) {
		let label = key[0].toUpperCase() + key.substring(1);
		label = label.replace(/(?<=[a-z])(?=[A-Z])/g, ' ');
		return label;
	}

	function add() {
		const propName = app.ui.faces.propSelect.value;
		if (!propName) return;
		if (props[propName].isModulator) return;

		const defaults = props[propName];
		props[propName].isModulator = true;
		panel.addRow();

		const tree = new UITree({ title: labelFromKey(propName) });
		panel.add(tree);
		addDefaults(props[propName], defaults, tree);


		const minMaxDefault = {
			value: 0,
			min: 0,
			max: 0,
			chance: 0,
			step: 1,
		};

		const minModBtn = new UIButton({
			text: 'Min Mod',
			callback: () => {
				const minTree = new UITree({ title: labelFromKey(propName + 'Min Mod') });
				tree.add(minTree);
				addDefaults(props[propName].minMod, minMaxDefault, minTree);
				minModBtn.remove();
			}
		});
		tree.add(minModBtn);

		const maxModBtn = new UIButton({
			text: 'Max Mod',
			callback: () => {
				const maxTree = new UITree({ title: labelFromKey(propName + 'Max Mod') });
				tree.add(maxTree);
				addDefaults(props[propName].maxMod, minMaxDefault, maxTree);
				maxModBtn.remove();
			}
		});
		tree.add(maxModBtn);
	}

	function addDefaults(prop, defaults, tree) {

		tree.add(new UILabel({ text: "Value" }));
		tree.add(new UINumberStep({
			value: defaults.value,
			step: defaults.step,
			callback: value => {
				prop.value = value;
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Min" }));
		tree.add(new UINumberStep({
			value: defaults.min,
			step: defaults.step,
			callback: value => {
				prop.min = value;
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Max" }));
		tree.add(new UINumberStep({
			value: defaults.max,
			step: defaults.step,
			callback: value => {
				prop.max = value;
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Step" }));
		tree.add(new UINumberStep({
			value: defaults.step,
			step: 0.1,
			callback: value => {
				prop.step = value;
			}
		}));
		tree.addBreak();

		tree.add(new UILabel({ text: "Chance" }));
		tree.add(new UINumberStep({
			value: defaults.chance,
			step: 0.05,
			callback: value => {
				prop.chance = value;
			}
		}));
		tree.addBreak();
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

	return { connect };

}

