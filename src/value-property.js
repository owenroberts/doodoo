import { Modulator } from './Modulator.js';
import { Property } from './property.js';

/**
 * value property,
 * single value { value , mod } 
 */
export class ValueProperty extends Property {

	/**
	 * constructs a Property
	 * @param  {number} [params.value] - start value
	 * @param  {string} name
	 */
	constructor(params={}, name) {
		super(params, name);
		this.value = params.value ?? 0;
		
		if (params.mod) {
			this.isMod = true;
			this.mod = new Modulator(this.value, params.mod, name);
		}
	}

	/**
	 * get current value
	 * @param  {number} _voiceIndex - voice index in part
	 * @return {number} value 
	 */
	get(_voiceIndex) {
		return this.isMod ? this.mod.get() : this.value;
	}

	/**
	 * set current value
	 * @param {number}
	 */
	set(value) {
		this.value = value;
		if (this.mod) this.mod.set(value);
	}
}