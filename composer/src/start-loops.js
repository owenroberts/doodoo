import { UIPanel, UIRow, UILabel, UIButton, UITree, UINumberStep, UISelectButton, UIToggleCheck, UIText, UISelect } from '../../../oi/src/oi.js';
import { SamplePaths } from '../../src/sample-paths.js';

const startLoopDefaults = {
	instrument: {
		value: "choir",
		options: ['choir', 'fmSynth', ...Object.keys(SamplePaths)],
	},
	harmony: { value: 0, },
	double: { value: false, },
	attack: { value: 0, },
	release: { value: 1, },
	playBeat: { value: 4, options: [1, 2, 4, 8, 16], },
	counterpoint: { value: false },
};

/**
 * set params for beginning counts of play back
 */
export class StartLoopsPanel extends UIPanel {
	constructor(doodoo, ui) {
		super({ id: "startLoops", ui });
		
		this.doodoo = doodoo;
		this.startLoops = this.doodoo.comp.startLoops;

		this.addButton({
			text: 'log',
			callback: () => { 
				console.log('start loops', this.startLoops);
				console.log('start loops', this.doodoo.comp.startLoops);
			}
		});

		this.addButton({
			text: 'collapse',
			callback: () => {
				startLoopsRow.children
					.forEach(c => { 
						if (c.constructor.name === 'UITree') {
							c.close(); 
						}
					});
			}
		});

		const uiRow = this.addRow({ id: 'ui-row' });

		uiRow.add(new UILabel({ text: "counts" }));
		uiRow.add(new UIButton({
			text: '–',
			class: 'left-end',
			callback: () => {
				this.startLoops.pop();
				this.startLoopsRow.removeK(`count-${this.startLoops.length}`);
			}
		}));

		uiRow.add(new UIButton({
			text: '+',
			class: 'right-end',
			callback: () => {
				this.startLoops.push({ counts: 1, loops: []});
				this.addCount(this.startLoops.length - 1);
			}
		}));

		this.startLoopsRow = this.addRow({ id: 'start-loops-row' });
	}

	addCount(index) {

		this.startLoopsRow.addBreak();
		
		const countRow = this.startLoopsRow.add(new UITree({ title: `count ${index}`}), `count-${index}`);

		countRow.add(new UILabel({ text: "counts "}));
		countRow.add(new UINumberStep({
			obj: this.startLoops[index],
			ref: "counts",
		}));
		countRow.addBreak();

		countRow.add(new UILabel({ text: "loops" }));

		countRow.add(new UIButton({
			text: '–',
			class: 'left-end',
			callback: () => {
				this.startLoops[index].loops.pop();
				countRow.removeK(`loop-${this.startLoops[index].loops.length}`);
			}
		}));

		countRow.add(new UIButton({
			text: '+',
			class: 'right-end',
			callback: () => {
				this.startLoops[index].loops.push({});
				this.addLoop(index, this.startLoops[index].loops.length - 1, {}, countRow);
			}
		}));

		countRow.addBreak();

		for (let i = 0; i < this.startLoops[index].loops.length; i++) {
			this.addLoop(index, i, this.startLoops[index].loops[i], countRow);
		}
	}

	addLoop(countIndex, loopIndex, loop, countRow) {
		const loopRow = countRow.add(new UIRow(), `loop-${loopIndex}`);
		loopRow.add(new UILabel({ text: `loop ${loopIndex}` }));
		loopRow.addBreak();

		loopRow.add(new UISelectButton({
			options: Object.keys(startLoopDefaults),
			callback: propName => {
				this.addLoopControl(propName, startLoopDefaults[propName].value, countIndex, loopIndex, loopRow);
			}
		}));
		loopRow.addBreak();

		for (const propName in loop) {
			this.addLoopControl(propName, loop[propName], countIndex, loopIndex, loopRow);
		}
	}

	addLoopControl(propName, value, countIndex, loopIndex, loopRow) {
		
		loopRow.add(new UILabel({ text: propName }));

		const def = startLoopDefaults[propName];

		let uiClass = UIToggleCheck;
		if (typeof value === "number") uiClass = UINumberStep;
		if (typeof value === "string") uiClass = UIText;
		if (def.options) uiClass = UISelect;

		this.startLoops[countIndex].loops[loopIndex][propName] = value;

		loopRow.add(new uiClass({
			obj: this.startLoops[countIndex].loops[loopIndex],
			ref: propName,
			options: def.options,
		}));
		
		loopRow.addBreak();
		
		loopRow.append(new UILabel({ class: 'break' }));
	}

	load() {
		this.startLoops = this.doodoo.comp.startLoops;
		this.startLoopsRow.clear();
		for (let i = 0; i < this.startLoops.length; i++) {
			this.addCount(i);
		}
	}
}