import { Modulator } from './Modulator.js';
import { Property } from './property.js';
import { random } from '../../cool/cool.js';

/**
 * stack property
 * stack of lists, apply to voice by index
 */
export class StackProperty extends Property {

	/**
	 * constructs a Property
	 * @param  {object}  [params]
	 * @param  {array[]} [params.stack]
	 * @param  {string}  propName name of the prop, debugging mostly
	 */
	constructor(params={}, name) {
		super(params, name);
		this.stack = params.stack ?? []
		if (params.mod) {
			this.isMod = true;
			this.mod = new Modulator(this.index, params.mod, name);
		}
	}

	/**
	 * get current value
	 * @param  {number} voiceIndex - voice index in part
	 * @return {number|string|boolean} value - current value 
	 */
	get(voiceIndex) {
		if (voiceIndex < this.stack.length) {
			return random(this.stack[voiceIndex].list);
		} else { 
			return random(this.stack.flatMap(v => v.list));
		}
	}
}