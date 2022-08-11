/*
	manage the many many doodoo params
*/
function Params(app, defaults, params) {
	const self = this;

	let row, startLoopsRow;

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

	function addRange(param) {
		let { key, value, range, step } = param;
		let label = labelFromKey(key);

		const paramLabel = new UILabel({ text: label, class: 'break-line-up' });
		const minLabel = new UILabel({ text: 'Min' });
		const min = new UINumberStep({
			value: value[0],
			min: range[0],
			max: range[1],
			step: step[0],
			callback: value => {
				defaults[key][0] = value;
			}
		});

		const maxLabel = new UILabel({ text: 'Max' });
		const max = new UINumberStep({
			value: value[1],
			min: range[0],
			max: range[1],
			step: step[0],
			callback: value => {
				defaults[key][1] = value;
			}
		});

		row.append(paramLabel);
		row.append(minLabel);
		row.append(min);
		row.append(maxLabel);
		row.append(max);

		if (value.length > 2) {
			const updateMin = new UIChance({
				label: 'Min Chance',
				value: value[2],
				min: range[2],
				max: range[3],
				step: step[1],
				callback: value => {
					defaults[key][2] = value;
				}
			});

			const updateMax = new UIChance({
				label: 'Max Chance',
				value: value[3],
				min: range[2],
				max: range[3],
				step: step[1],
				callback: value => {
					defaults[key][3] = value;
				}
			});

			row.append(updateMin);
			row.append(updateMax);
		}
	}

	function addList(param) {
		let { key, start, add, chance } = param;
		let label = labelFromKey(key);

		const paramLabel = new UILabel({ text: label, class: 'break-line-up' });
		row.append(paramLabel);

		const chanceRange = new UIChance({
			label: 'Chance',
			value: chance,
			min: 0,
			max: 1,
			step: 0.01,
			callback: value => {
				defaults[key].chance = value;
			}
		});
		row.append(chanceRange);

		const startLabel = new UILabel({ text: 'Start', class: 'break' });
		const startList = new UINumberList({
			list: start,
			callback: value => {
				defaults[key].start = value;
			} 
		});

		row.append(startLabel);
		row.append(startList);

		const addLabel = new UILabel({ text: 'Add', class: 'break' });
		const addList = new UINumberList({
			list: add,
			callback: value => {
				defaults[key].add = value;
			} 
		});

		row.append(addLabel);
		row.append(addList);
	}

	function addChance(param) {
		let { key, value} = param;
		let label = labelFromKey(key);

		const paramLabel = new UILabel({ text: label, class: 'break-line-up' });
		row.append(paramLabel);

		const chanceRange = new UIChance({
			label: 'Chance',
			value: value,
			min: 0,
			max: 1,
			step: 0.01,
			callback: value => {
				defaults[key] = value;
			}
		});
		row.append(chanceRange);
	}

	function addInt(param) {
		let { key, value, range } = param;
		let label = labelFromKey(key);

		const paramLabel = new UILabel({ text: label + ' Value', class: 'break-line-up' });
		row.append(paramLabel);

		const valueRange = new UINumberStep({
			value: value,
			min: range[0],
			max: range[1],
			step: 1,
			callback: value => {
				defaults[key][0] = value;
			}
		});
		row.append(valueRange);
	}

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
				console.log(defaults.startLoops);
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

	this.init = function(data) {
		row = self.panel.doodooParams;
		startLoopsRow = app.ui.panels.loops.startLoops;
	};

	this.load = function(data) {
		if (data) {
			params.forEach(p => {
				if (data[p.key]) {
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

		for (let i = 0; i < params.length; i++) {
			switch(params[i].type) {
				case "range":
					addRange(params[i]);
				break;
				case "list":
					addList(params[i]);
				break;
				case "chance":
					addChance(params[i]);
				break;
				case "int":
					addInt(params[i]);
				break;
				case "loops":
					addLoops(params[i]);
				break;
			}
		}
	};

	this.get = function() {
		return { ...defaults };
	};
}