/*
	manage the many many doodoo controls
*/
function Controls(app, defaults, controls) {
	
	let startLoopsRow;
	let originalDefaults = { ...defaults };

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
	};

	function labelFromKey(key) {
		let label = key[0].toUpperCase() + key.substring(1);
		label = label.replace(/(?<=[a-z])(?=[A-Z])/g, ' ');
		return label;
	}

	function setupControl(control, row) {
		const { key, type } = control;
		const label = labelFromKey(key);
		row.append(new UILabel({ text: label }));
		row.append(new UIButton({
			text: 'Reset',
			callback: () => {
				resetControl(key, row);
			}
		}));

		if (type === 'range') addRange(control, row);
		if (type === 'list' && control.value) addList(control, row);
		if (type === 'chance') addChance(control, row);
		if (type === 'number') addNumber(control, row);
	}

	function resetControl(key, row, value) {
		const control = controls.filter(p => p.key === key)[0];
		if (value === undefined) value = Array.isArray(originalDefaults[key]) ?
			[...originalDefaults[key]] :
			originalDefaults[key];
		defaults[key] = value;
		control.value = value;
		row.clear();
		setupControl(control, row);
	}

	function addChance(control, row, label) {
		let { key, value, index, range } = control;
		
		if (label) row.append(new UILabel({ text: label }));
		row.append(new UIChance({
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

	function addNumber(control, row, label) {
		let { key, value, range, step, index } = control;

		if (label) row.append(new UILabel({ text: label  }));
		row.append(new UINumberStep({
			value: index !== undefined ? value[index] : value,
			min: range[0],
			max: range[1],
			step: control.step || 1, // default is whole num
			callback: value => {
				if (index !== undefined) defaults[key][index] = value;
				else defaults[key] = value;
			}
		}));
	}

	function addRange(control, row, label) {
		let { key, value, range, step } = control;

		if (label) row.append(new UILabel({ text: label }));
		addNumber({ ...control, index: 0 }, row, 'Min');
		addNumber({ ...control, index: 1 }, row, 'Max');

		if (value.length > 2) {
			// some range chance is negative for Math.sign for update value
			let r = range.length <= 2 ? [0, 1] : range.slice(2);
		 	addChance({ ...control, range: r, index: 2 }, row, 'Min Update');
			addChance({ ...control, range: r, index: 3 }, row, 'Max Update');
		}
	}

	function addList(control, row, label) {
		let { key, value } = control;
		if (label) row.append(new UILabel({ text: label }));
		row.append(new UINumberList({
			list: value,
			callback: value => {
				defaults[key] = value;
			} 
		}));
	}

	// loop section ...
	function addLoops(control) {
		const counts = control.value;
		const countLabel = new UILabel({ text: "Counts" });
		startLoopsRow.append(countLabel);
		
		const subtractCount = new UIButton({
			text: '–',
			class: 'left-end',
			callback: () => {
				defaults.startLoops.pop();
				startLoopsRow.removeK('count' + defaults.startLoops.length);
			}
		});
		startLoopsRow.append(subtractCount);

		const addCount = new UIButton({
			text: '+',
			class: 'right-end',
			callback: () => {
				const count = [{}];
				defaults.startLoops.push(count);
				addLoopCount(defaults.startLoops.length - 1, count);
			}
		});
		startLoopsRow.append(addCount);
		
		for (let i = 0; i < counts.length; i++) {
			addLoopCount(i, counts[i]);
		}
	}

	function addLoopCount(index, loops) {
		const countRow = new UIRow({ class: 'break-line-up' });
		startLoopsRow.append(countRow, 'count' + index);
		const countLabel = new UILabel({ text: "Count " + index });
		countRow.append(countLabel);

		const loopLabel = new UILabel({ text: "Loops" });
		countRow.append(loopLabel);
		
		const subtractLoop = new UIButton({
			text: '–',
			class: 'left-end',
			callback: () => {
				defaults.startLoops[index].pop();
				countRow.removeK('loop' + defaults.startLoops[index].length);
			}
		});
		countRow.append(subtractLoop);

		const plusLoop = new UIButton({
			text: '+',
			class: 'right-end',
			callback: () => {
				defaults.startLoops[index].push({});
				addLoop(index, defaults.startLoops[index].length - 1, {}, countRow);
			}
		});
		countRow.append(plusLoop);

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
			class: 'break',
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
		let label = labelFromKey(key);
		switch(typeof value) {
			case "boolean":
				let bool = new UIToggleCheck({
					label: label,
					value: value,
					callback: value => {
						defaults.startLoops[countIndex][loopIndex][key] = value;
					}
				});
				loopRow.append(bool);
			break;
			case "number":
				let controlLabel = new UILabel({ text: label });
				loopRow.append(controlLabel);
				let num = new UINumberStep({
					value: value,
					callback: value => {
						defaults.startLoops[countIndex][loopIndex][key] = value;
					}
				});
				loopRow.append(num);
			break;
		}
		loopRow.append(new UILabel({ class: 'break' }));
	}

	function resetControls() {
		let fxIndex = controls.findIndex(c => c.key === 'fxLimit');
		for (let i = 0; i < fxIndex; i++) {
			const { key, panel } = controls[i];
			if (key === 'loops') continue;
			resetControl(key, app.ui.panels[panel]['row-' + key]);
		}	
	}

	function resetEffects() {
		// get fx starting point in controls list
		let fxIndex = controls.findIndex(c => c.key === 'fxLimit');
		for (let i = fxIndex; i < controls.length; i++) {
			const { key, panel } = controls[i];
			resetControl(key, app.ui.panels[panel]['row-' + key]);
		}
	}

	function zeroEffects() {
		let fxIndex = controls.findIndex(c => c.key === 'fxLimit');
		for (let i = fxIndex; i < controls.length; i++) {
			const { key, panel } = controls[i];
			if (!key.includes('Chance')) continue;
			resetControl(key, app.ui.panels[panel]['row-' + key], 0);
		}
	}

	function load(data) {
		// load local storage or comp data
		if (data) {
			for (let i = 0; i < controls.length; i++) {
				const { key, type } = controls[i];
				if (data[key] === undefined) continue;
				defaults[key] = data[key];
				switch(type) {
					case 'list':
						for (const k in data[key]) {
							controls[i][k] = data[key][k];
						}
					break;
					case 'effect':
						controls[i].chance = data[key + 'Chance'];
						controls[i].delay = data[key + 'Delay'];
					break;
					default:
						controls[i].value = data[key];
					break;
				}
			}
		}

		const panelData = localStorage.getItem('settings-doodoo') ?
			JSON.parse(localStorage.getItem('settings-doodoo')).panels : {};

		for (let i = 0; i < controls.length; i++) {
			const control = controls[i];
			let row;
			if (control.panel) {
				const panelName = control.panel;
				app.ui.getPanel(panelName, {
					label: labelFromKey(panelName) + ' Control'
				});
				row = app.ui.panels[panelName].addRow('row-' + control.key);
				row.addClass('break-line-up');
				
				if (panelData[panelName]) {
					const { gridArea } = panelData[panelName];
					const panel = app.ui.panels[panelName];
					panel.setup(panelData[panelName]);
					app.ui.getLayout()[gridArea].panels.append(panel);
				}
			}
			if (control.type === 'loops') addLoops(control);
			else setupControl(control, row);
		}
	}

	function get() {
		return { ...defaults };
	}

	function connect() {

		const controlsPanel = app.ui.getPanel('controls');
		const loopsPanel = app.ui.getPanel('loops', { label: 'Start Loops' });

		app.ui.addCallbacks([
			{ callback: resetControls, text: 'Reset Controls' },
			{ callback: resetEffects, text: 'Reset Effects' },
			{ callback: zeroEffects, text: 'Zero Effects' },
		], controlsPanel);

		startLoopsRow = loopsPanel.addRow('start-loops-row');
	}

	return { get, load, connect };

}