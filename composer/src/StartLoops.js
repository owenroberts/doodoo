/*
	ui for start loops
	set params for the beginning of the composition
*/

function StartLoops(app) {

	let startLoopsRow;
	let startLoops = [];
	let defaults = {
		instrument: 'choir',
		harmony: 0,
		double: false,
		attack: 0,
		release: 1,
	};

	function addLoopCount(index, loops) {
		startLoopsRow.addBreak();
		const countRow = startLoopsRow.add(new UITree({ title: "Count " + index }), 'count' + index);
		countRow.add(new UILabel({ text: "Loops" }));

		countRow.add(new UIButton({
			text: '–',
			class: 'left-end',
			callback: () => {
				startLoops[index].pop();
				countRow.removeK('loop' + startLoops[index].length);
			}
		}));

		countRow.add(new UIButton({
			text: '+',
			class: 'right-end',
			callback: () => {
				startLoops[index].push({});
				addLoop(index, startLoops[index].length - 1, {}, countRow);
			}
		}));

		for (let i = 0; i < loops.length; i++) {
			addLoop(index, i, loops[i], countRow);
		}
	}

	function addLoop(countIndex, loopIndex, loop, countRow) {
		const loopRow = countRow.add(new UIRow(), 'loop' + loopIndex);
		loopRow.add(new UILabel({ text: "Loop " + loopIndex }));

		loopRow.add(new UISelectButton({
			options: Object.keys(defaults),
			callback: prop => {
				addLoopControl(prop, defaults[prop], countIndex, loopIndex, loopRow);
			}
		}));

		for (const key in loop) {
			addLoopControl(key, loop[key], countIndex, loopIndex, loopRow);
		}
	}

	function addLoopControl(key, value, countIndex, loopIndex, loopRow) {
		/* set values when loop control added, otherwise have to edit to get it to save */
		let label = app.ui.labelFromKey(key);
		switch(typeof value) {
			case "boolean":
				loopRow.add(new UILabel({ text: label }));
				loopRow.add(new UIToggleCheck({
					value: value,
					callback: value => {
						startLoops[countIndex][loopIndex][key] = value;
					}
				}));
				startLoops[countIndex][loopIndex][key] = value;
			break;
			case "number":
				loopRow.add(new UILabel({ text: label }));
				loopRow.add(new UINumberStep({
					value: value,
					callback: value => {
						startLoops[countIndex][loopIndex][key] = value;
					}
				}));
				startLoops[countIndex][loopIndex][key] = value;
			break;
			case "string":
				loopRow.add(new UILabel({ text: label }));
				loopRow.add(new UIText({
					value: value,
					callback: value => {
						startLoops[countIndex][loopIndex][key] = value;
					}
				}));
				startLoops[countIndex][loopIndex][key] = value;
			break;
		}
		loopRow.append(new UILabel({ class: 'break' }));
	}

	function get() {
		return startLoops;
	}

	function load(data) {
		if (data) {
			startLoops = structuredClone(data);
			startLoopsRow.clear();
			for (let i = 0; i < startLoops.length; i++) {
				addLoopCount(i, startLoops[i]);
			}
		}
	}

	function connect() {
		const loopsPanel = app.ui.getPanel('start-loops', { label: 'Start Loops' });

		app.ui.addCallbacks([
			{
				text: 'Collapse',
				callback: () => {
					startLoopsRow.uiChildren
						.filter(c => c.constructor.name === 'UITree')
						.forEach(c => { c.close(); });
				}
			},
			{ 
				text: 'Print',
				callback: () => { console.log('start loops', startLoops); }
			},
		]);

		const uiRow = loopsPanel.addRow('ui-row');

		uiRow.add(new UILabel({ text: "Counts" }));
		uiRow.add(new UIButton({
			text: '–',
			class: 'left-end',
			callback: () => {
				startLoops.pop();
				startLoopsRow.removeK('count' + startLoops.length);
			}
		}));

		uiRow.add(new UIButton({
			text: '+',
			class: 'right-end',
			callback: () => {
				const count = [{}];
				startLoops.push(count);
				addLoopCount(startLoops.length - 1, count);
			}
		}));

		startLoopsRow = loopsPanel.addRow('start-loops-row');
	}

	return { get, load, connect };
}