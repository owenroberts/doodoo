/*
	manage the many many doodoo controls
*/
function Controls(app, defaults, controls) {
	// console.log(defaults, controls);
	
	let startLoopsRow, controlsPanel, fxPanel, controlTrees = {};
	let originalDefaults = JSON.parse(JSON.stringify(defaults));

	// has to match Part.js
	const defaultLoop = {
		noteDuration: 4,
		count: 0,
		counter: 1,
		doubler: false,
		doublerCounter: false,
		repeat: 1,
		startIndex: 0,
		startDelay: 0,
		harmony: 0,
		voice: 'choir', // make list later
	};

	function labelFromKey(key) {
		let label = key[0].toUpperCase() + key.substring(1);
		label = label.replace(/(?<=[a-z])(?=[A-Z])/g, ' ');
		return label;
	}

	function setupControl(control, tree) {
		const { key, type } = control;
		tree.add(new UIButton({
			text: 'Reset',
			callback: () => {
				resetControl(key, tree);
			}
		}));

		tree.addBreak();
		if (type === 'range') addRange(control, tree);
		if (type === 'list' && control.value) addList(control, tree);
		if (type === 'chance') addChance(control, tree);
		if (type === 'number') addNumber(control, tree);
		if (type === 'walker') addWalker(control, tree);
		tree.addBreak();
	}

	function resetControl(key, tree, value) {
		const control = controls.filter(p => p.key === key)[0];
		if (!control) return; // bug fix for now
		if (value === undefined) {
			value = Array.isArray(originalDefaults[key]) ?
			[...originalDefaults[key]] :
			originalDefaults[key];
		}
		defaults[key] = value;
		control.value = value;
		if (!tree) tree = controlTrees[key];
		tree.clear();
		setupControl(control, tree);
	}

	function addWalker(control, tree, label) {
		let { key, value } = control;
		if (label) tree.add(new UILabel({ text: label }));
		addNumber({ ...control, index: 0, }, tree);

		tree.add(new UILabel({ text: 'Walker', class: 'break' }));
		addNumber({ ...control, index: 1 }, tree, 'Step');
		addChance({ ...control, index: 2 }, tree);
		addNumber({ ...control, index: 3 }, tree, 'Min');
		addNumber({ ...control, index: 4 }, tree, 'Max');
		addNumber({ ...control, index: 5, range: [-1, 1], step: 0.1 }, tree, 'Dir');
	}

	function addChance(control, tree, label) {
		let { key, value, index, range } = control;
		
		if (label) tree.add(new UILabel({ text: label }));
		tree.add(new UIChance({
			label: 'Chance',
			value: index !== undefined ? value[index] : value,
			min: range ? range[0] : 0,
			max: range ? range[1] : 1,
			step: 0.01,
			callback: value => {
				if (index !== undefined) defaults[key][index] = value;
				else defaults[key] = value;
			}
		}));
	}

	function addNumber(control, tree, label) {
		let { key, value, range, step, index } = control;

		if (label) tree.add(new UILabel({ text: label  }));
		tree.add(new UINumberStep({
			value: index !== undefined ? value[index] : value,
			min: range ? range[0] : 0,
			max: range ? range[1] : 100,
			step: control.step || 1, // default is whole num
			callback: value => {
				if (index !== undefined) defaults[key][index] = value;
				else defaults[key] = value;
			}
		}));
	}

	function addRange(control, tree, label) {
		let { key, value, range, step } = control;

		if (label) tree.add(new UILabel({ text: label }));
		addNumber({ ...control, index: 0 }, tree, 'Min');
		addNumber({ ...control, index: 1 }, tree, 'Max');

		if (value.length > 2) {
			// some range chance is negative for Math.sign for update value
			let r = range.length <= 2 ? [0, 1] : range.slice(2);
		 	addChance({ ...control, range: r, index: 2 }, tree, 'Min Update');
			addChance({ ...control, range: r, index: 3 }, tree, 'Max Update');
		}
	}

	function addList(control, row, label) {
		let { key, value } = control;
		if (label) row.add(new UILabel({ text: label }));
		row.add(new UINumberList({
			list: value,
			callback: value => {
				defaults[key] = value;
			} 
		}));
	}

	// loop section ...
	function addLoops(control, tree) {
		const counts = control.value;
		const countLabel = new UILabel({ text: "Counts" });
		tree.add(countLabel);
		
		const subtractCount = new UIButton({
			text: '–',
			class: 'left-end',
			callback: () => {
				defaults.startLoops.pop();
				tree.removeK('count' + defaults.startLoops.length);
			}
		});
		tree.add(subtractCount);

		const addCount = new UIButton({
			text: '+',
			class: 'right-end',
			callback: () => {
				const count = [{}];
				defaults.startLoops.push(count);
				addLoopCount(defaults.startLoops.length - 1, count, tree);
			}
		});
		tree.add(addCount);
		
		for (let i = 0; i < counts.length; i++) {
			addLoopCount(i, counts[i], tree);
		}
	}

	function addLoopCount(index, loops, tree) {
		const countRow = new UIRow({ class: 'break-line-up' });
		tree.add(countRow, 'count' + index);
		
		const countLabel = new UILabel({ text: "Count " + index });
		countRow.add(countLabel);

		const loopLabel = new UILabel({ text: "Loops" });
		countRow.add(loopLabel);
		
		const subtractLoop = new UIButton({
			text: '–',
			class: 'left-end',
			callback: () => {
				defaults.startLoops[index].pop();
				countRow.removeK('loop' + defaults.startLoops[index].length);
			}
		});
		countRow.add(subtractLoop);

		const plusLoop = new UIButton({
			text: '+',
			class: 'right-end',
			callback: () => {
				defaults.startLoops[index].push({});
				addLoop(index, defaults.startLoops[index].length - 1, {}, countRow);
			}
		});
		countRow.add(plusLoop);

		for (let i = 0; i < loops.length; i++) {
			addLoop(index, i, loops[i], countRow);
		}
	}

	function addLoop(countIndex, loopIndex, loop, countRow) {
		
		const loopRow = new UIRow();
		countRow.append(loopRow, 'loop' + loopIndex);
		const loopLabel = new UILabel({ text: "Loop " + loopIndex });
		loopRow.append(loopLabel);

		const controlSelect = new UISelectButton({
			options: Object.keys(defaultLoop),
			// class: 'break',
			callback: value => {
				addLoopControl(value, defaultLoop[value], countIndex, loopIndex, loopRow);
			}
		});

		loopRow.append(controlSelect);

		for (const key in loop) {
			addLoopControl(key, loop[key], countIndex, loopIndex, loopRow);
		}
	}

	function addLoopControl(key, value, countIndex, loopIndex, loopRow) {
		/* set values when loop control added, otherwise have to edit to get it to save */
		let label = labelFromKey(key);
		switch(typeof value) {
			case "boolean":
				let bool = new UIToggleCheck({
					value: value,
					callback: value => {
						defaults.startLoops[countIndex][loopIndex][key] = value;
					}
				});
				loopRow.append(new UILabel({ text: label }));
				loopRow.append(bool);
				defaults.startLoops[countIndex][loopIndex][key] = value;
			break;
			case "number":
				let num = new UINumberStep({
					value: value,
					callback: value => {
						defaults.startLoops[countIndex][loopIndex][key] = value;
					}
				});
				loopRow.append(new UILabel({ text: label }));
				loopRow.append(num);
				defaults.startLoops[countIndex][loopIndex][key] = value;
			break;
			case "string":
				let str = new UIText({
					value: value,
					callback: value => {
						defaults.startLoops[countIndex][loopIndex][key] = value;
					}
				});
				loopRow.append(new UILabel({ text: label }));
				loopRow.append(str);
				defaults.startLoops[countIndex][loopIndex][key] = value;
			break;
		}
		loopRow.append(new UILabel({ class: 'break' }));
	}

	function resetControls() {
		let fxIndex = controls.findIndex(c => c.key === 'fxLimit');
		for (let i = 0; i < fxIndex; i++) {
			const { key, panel } = controls[i];
			if (key === 'loops') continue;
			resetControl(key);
		}	
	}

	function resetEffects() {
		// get fx starting point in controls list
		let fxIndex = controls.findIndex(c => c.key === 'fxLimit');
		for (let i = fxIndex; i < controls.length; i++) {
			const { key, panel } = controls[i];
			resetControl(key);
		}
	}

	function zeroEffects() {
		let fxIndex = controls.findIndex(c => c.key === 'fxLimit');
		for (let i = fxIndex; i < controls.length; i++) {
			const { key, panel } = controls[i];
			if (!key.includes('Chance')) continue;
			resetControl(key, undefined, 0);
		}
	}

	function load(data) {
		if (data) {
			for (const key in data) {
				const value = data[key];
				if (key === 'startLoops') {
					controlTrees['startLoops'].clear();
					defaults.startLoops = data[key];
					addLoops({ value: data[key] }, controlTrees['startLoops']);
				}
				else resetControl(key, undefined, data[key]);
			}
		} else {
			let isFx = false; // once we get to fxLimit, put things in fx panel
			for (let i = 0; i < controls.length; i++) {
				const control = controls[i];
				const { key, type } = control;
				if (key === 'fxLimit') isFx = true;
				const tree = new UITree({ title: labelFromKey(key) });
				controlTrees[key] = tree;
				if (isFx) fxPanel.append(tree);
				else controlsPanel.append(tree);
					
				if (type === 'loops') addLoops(control, tree);
				else setupControl(control, tree);
			
			}
		}

	}

	function get() {
		return { ...defaults };
	}

	function connect() {

		controlsPanel = app.ui.getPanel('controls');
		fxPanel = app.ui.getPanel('Effects');

		const loopsPanel = app.ui.getPanel('loops', { label: 'Start Loops' });

		app.ui.addCallbacks([
			{ callback: resetControls, text: 'Reset Controls' },
		], controlsPanel);
		
		app.ui.addCallbacks([
			{ callback: resetEffects, text: 'Reset Effects' },
			{ callback: zeroEffects, text: 'Zero Effects' },
		], fxPanel);

		startLoopsRow = loopsPanel.addRow('start-loops-row');
	}

	return { get, load, connect };

}