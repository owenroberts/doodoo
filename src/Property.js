import { Modulator } from './Modulator.js';
import { random } from '../../cool/cool.js';

/**
 * Property container
 * tracks and modulates values
 * single value { value , mod } 
 * list { list, index, mod }
 * stack (of lists)
 */
export class Property {

	/**
	 * constructs a Property
	 * @param  {object} [params]
	 * @param  {string} [params.type] - type, value, list, stack
	 * @param  {number|string|boolean} [params.value] - start value
	 * @param  {number} [params.index] - start index in list
	 * @param  {array} [params.list]
	 * @param  {array[]} [params.stack]
	 * @param  {string} propName name of the prop, debugging mostly
	 */
	constructor(params={}, name) {

		this.name = name;
		// default type to value
		this.type = "value";
		if (params.hasOwnProperty('list')) this.type = 'list';
		if (params.hasOwnProperty('stack')) this.type = 'stack';

		// its a little nuts to have all of them in class version .. 
		this.value = params.value ?? 0;
		this.index = params.index ?? 0;
		this.list = params.list ?? [];
		this.stack = params.stack ?? [];

		this.isMod = false;
		if (params.mod) {
			this.isMod = true;
			this.mod = this.type === 'value' ? 
				new Modulator(this.value, params.mod, name) :
				new Modulator(this.index, params.mod, name) ;
		}
	}

	/**
	 * update mod
	 * @param  {number} loopCount - number of loops
	 */
	update(loopCount) {
		if (this.isMod) this.mod.update(loopCount);
	}

	/**
	 * get current value of property
	 * @param  {number} voiceIndex - voice index in part
	 * @return {number|string|boolean} value - current value 
	 */
	get(voiceIndex) {

		if (this.type === 'stack') {
			if (voiceIndex < this.stack.length) {
				return random(this.stack[voiceIndex].list);
			} else {
				return random(this.stack.flatMap(v => v.list));
			}
		}

		if (this.type === 'list') {
			let i = this.isMod ? Math.round(this.mod.get()) : this.index;
			return this.list[Math.min(this.list.length - 1, i)];
			// why do i need Math.min here?
		} 

		return this.isMod ? this.mod.get() : this.value;
	}

	/**
	 * set current value
	 * @param {number|string|boolean}
	 */
	set(value) {
		// this only works for single value??
		this.value = value;
		if (this.mod) this.mod.set(value);
	}

	/**
	 * get rounded int of current value
	 * @return {number} - rounded value
	 */
	getInt() {
		return Math.round(this.get());
	}
}