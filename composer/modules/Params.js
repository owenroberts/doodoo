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

		const minLabel = new UILabel({ text: key + ' Min' })
		const min = new UINumberRange({
			value: value[0],
			min: range[0],
			max: range[1],
			step: 0.05,
			callback: value => {
				defaults[key][0] = value;
			}
		});

		const maxLabel = new UILabel({ text: key + ' Max' })
		const max = new UINumberRange({
			value: value[1],
			min: range[0],
			max: range[1],
			step: 0.05,
			callback: value => {
				defaults[key][1] = value;
			}
		});

		row.append(minLabel);
		row.append(min);
		row.append(maxLabel);
		row.append(max);

	}

	this.init = function() {
		row = self.panel.doodooParams;

		for (let i = 0; i < params.length; i++) {
			switch(params[i].type) {
				case "range":
					addRange(params[i]);
				break;
			}
		}
	};

	this.get = function() {
		return { ...defaults };
	};
}