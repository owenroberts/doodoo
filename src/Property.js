import { Modulator } from './Modulator.js';
import { PropertyTypes } from './constants.js';
import { assert, random } from '../../cool/cool.js';

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
		
		/*
			handle diff prop types in the class instead of subclasses (for now)
			good to see logic together and easier to add props in different places
			do classes if it gets more complicated
		 */
		
		if (params.hasOwnProperty('value')) {
			this.type = PropertyTypes.VALUE; // default type to value
			this.value = params.value ?? 0;
		}

		if (params.hasOwnProperty('list')) {
			this.type = PropertyTypes.LIST;
			this.list = params.list ?? [];
			this.index = params.index ?? 0;
		}
		
		if (params.hasOwnProperty('stack')) {
			this.type = PropertyTypes.STACK;
			this.stack = params.stack ?? [];
		}


		this.isMod = false;
		if (params.mod) {
			this.isMod = true;
			this.mod = this.type === PropertyTypes.VALUE ? 
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

		switch(this.type) {
			case PropertyTypes.VALUE:
				return this.isMod ? this.mod.get() : this.value;
			break;
			case PropertyTypes.LIST:
				let i = this.isMod ? Math.round(this.mod.get()) : this.index;
				return this.list[Math.min(this.list.length - 1, i)];
				// why do i need Math.min here?
			break;
			case PropertyTypes.STACK:
				if (voiceIndex < this.stack.length) {
					return random(this.stack[voiceIndex].list);
				} else { 
					return random(this.stack.flatMap(v => v.list));
				}
			break;
		}
	}

	/**
	 * set current value
	 * @param {number|string|boolean}
	 */
	set(value) {
		assert(this.type === PropertyTypes.VALUE, `Cannot set ${this.name} value, type is ${this.type}`);
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