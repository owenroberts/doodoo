/*
	manage the many many doodoo params
*/
function Params(app, defaults, params) {
	const self = this;

	// let startLoopsRow;
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

	function addChance(param, row, label) {
		let { key, value, index, range } = param;

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

	function addNumber(param, row, label) {
		let { key, value, range, step, index } = param;

		if (label) row.append(new UILabel({ text: label  }));
		row.append(new UINumberStep({
			value: index !== undefined ? value[index] : value,
			min: range[0],
			max: range[1],
			step: param.step || 1, // default is whole num
			callback: value => {
				if (index !== undefined) defaults[key][index] = value;
				else defaults[key] = value;
			}
		}));
	}

	function addRange(param, row, label) {
		let { key, value, range, step } = param;

		if (label) row.append(new UILabel({ text: label }));
		addNumber({ ...param, index: 0 }, row, 'Min');
		addNumber({ ...param, index: 1 }, row, 'Max');

		if (value.length > 2) {
			// some range chance is negative for Math.sign for update value
			let r = range.length <= 2 ? [0, 1] : range.slice(2);
		 	addChance({ ...param, range: r, index: 2 }, row, 'Min Update');
			addChance({ ...param, range: r, index: 3 }, row, 'Max Update');
		}
	}

	function addList(param, row, label) {
		let { key, value } = param;
		if (label) row.append(new UILabel({ text: label }));
		row.append(new UINumberList({
			list: value,
			callback: value => {
				defaults[key] = value;
			} 
		}));
	}

	// loop section ...
	function addLoops(param) {
		const counts = param.value;
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
				console.log('add count', defaults.startLoops);
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

		const paramSelect = new UISelectButton({
			options: Object.keys(defaultLoop),
			class: 'break',
			callback: value => {
				addLoopParam(value, defaultLoop[value], countIndex, loopIndex, loopRow);
			}
		});

		loopRow.append(paramSelect);

		for (const key in loop) {
			addLoopParam(key, loop[key], countIndex, loopIndex, loopRow);
		}
	}

	function addLoopParam(key, value, countIndex, loopIndex, loopRow) {
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
				let paramLabel = new UILabel({ text: label });
				loopRow.append(paramLabel);
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

	function setupParam(param, row) {
		const { key, type } = param;
		const label = labelFromKey(key);
		row.append(new UILabel({ text: label }));
		row.append(new UIButton({
			text: 'Reset',
			callback: () => {
				const value = Array.isArray(originalDefaults[key]) ?
					[...originalDefaults[key]] :
					originalDefaults[key]
				defaults[key] = value;
				param.value = value;
				row.clear();
				setupParam(param, row);
			}
		}));
		// row.append(new UIElement({ class: 'break' }));

		if (type === 'range') addRange(param, row);
		if (type === 'list' && param.value) addList(param, row);
		if (type === 'chance') addChance(param, row);
		if (type === 'number') addNumber(param, row);
	}

	this.init = function(data) {
		// row = self.panel.doodooParams;
		startLoopsRow = app.ui.panels.loops.startLoops;
	};

	this.load = function(data) {
		// load local storage or comp data
		if (data) {
			params.forEach(p => {
				if (data[p.key] !== undefined) {
					defaults[p.key] = data[p.key];
					switch(p.type) {
						case 'list':
							for (const k in data[p.key]) {
								p[k] = data[p.key][k];
							}
						break;
						default:
							p.value = data[p.key];
						break;
					}
				}
			});
		}

		const panelData = localStorage.getItem('settings-doodoo') ?
			JSON.parse(localStorage.getItem('settings-doodoo')).panels : {};

		for (let i = 0; i < params.length; i++) {
			const param = params[i];
			let row;
			if (param.panel) {
				const panelName = param.panel;
				if (app.ui.panels[panelName]) row = app.ui.panels[panelName].lastRow;
				else {
					app.ui.createPanel(panelName, {
						label: 'Param ' + labelFromKey(panelName)
					});
				}
				row = app.ui.panels[panelName].addRow();
				row.addClass('break-line-up');
				
				if (panelData[panelName]) {
					const { gridArea } = panelData[panelName];
					const panel = app.ui.panels[panelName];
					panel.setup(panelData[panelName]);
					app.ui.layout[gridArea].panels.append(panel);
				}
			}
			if (param.type === 'loops') addLoops(param);
			else setupParam(param, row);
		}
	};

	this.get = function() {
		return { ...defaults };
	};
}