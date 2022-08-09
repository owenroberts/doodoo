/*
	manage the many many doodoo params
*/
function Params(app, defaults, params) {
	const self = this;

	// this.attackStart = [0.25, 0.7];
	// this.attackStep = [-0.2, 0.2];

	let row;

	function addRange(param) {
		let { key, value, range, step } = param;
		let label = key[0].toUpperCase() + key.substring(1);
		label = label.replace(/(?=[A-Z])/g, ' ');

		const minLabel = new UILabel({ text: label + ' Min' });
		const min = new UINumberRange({
			value: value[0],
			min: range[0],
			max: range[1],
			step: step[0],
			callback: value => {
				defaults[key][0] = value;
			}
		});

		const maxLabel = new UILabel({ text: label + ' Max' });
		const max = new UINumberRange({
			value: value[1],
			min: range[0],
			max: range[1],
			step: step[0],
			callback: value => {
				defaults[key][1] = value;
			}
		});

		row.append(minLabel);
		row.append(min);
		row.append(maxLabel);
		row.append(max);

		if (value.length > 2) {
			const updateMinLabel = new UILabel({ text: label + ' Update Min' });
			const updateMin = new UINumberRange({
				value: value[2],
				min: range[2],
				max: range[3],
				step: step[1],
				callback: value => {
					defaults[key][2] = value;
				}
			});

			const updateMaxLabel = new UILabel({ text: label + ' Update Max' })
			const updateMax = new UINumberRange({
				value: value[3],
				min: range[2],
				max: range[3],
				step: step[1],
				callback: value => {
					defaults[key][3] = value;
				}
			});

			row.append(updateMinLabel);
			row.append(updateMin);
			row.append(updateMaxLabel);
			row.append(updateMax);
		}
	}

	function addList(param) {
		let { key, start, add, chance } = param;
		let label = key[0].toUpperCase() + key.substring(1);
		label = label.replace(/(?=[A-Z])/g, ' ');

		const startLabel = new UILabel({ text: label + ' Start' });
		const startList = new UINumberList({
			list: start,
			callback: value => {
				defaults[key].start = value;
			} 
		});

		row.append(startLabel);
		row.append(startList);

		const addLabel = new UILabel({ text: label + ' Add' });
		const addList = new UINumberList({
			list: add,
			callback: value => {
				defaults[key].add = value;
			} 
		});

		row.append(addLabel);
		row.append(addList);

		const chanceLabel = new UILabel({ text: label + ' Chance' });
		const chanceRange = new UINumberRange({
			value: chance,
			min: 0,
			max: 1,
			step: 0.01,
			callback: value => {
				defaults[key].chance = value;
			}
		});

		row.append(chanceLabel);
		row.append(chanceRange);

	}

	this.init = function() {
		row = self.panel.doodooParams;

		for (let i = 0; i < params.length; i++) {
			switch(params[i].type) {
				case "range":
					addRange(params[i]);
				break;
				case "list":
					addList(params[i]);
				break;
			}
		}
	};

	this.get = function() {
		return { ...defaults };
	};
}