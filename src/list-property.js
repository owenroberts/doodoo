import { Modulator } from './modulator.js';
import { Property } from './property.js';

/**
 * list prop
 * list { list, index, mod }
 */
export class ListProperty extends Property {

	/**
	 * constructs a Property
	 * @param  {object}  [params]
	 * @param  {number}  [params.index] - start index in list
	 * @param  {array}   [params.list]
	 * @param  {string}  name
	 */
	constructor(params={}, name) {
		super(params, name);
		this.list = params.list ?? [];
		this.index = params.index ?? 0;
		
		if (params.mod) {
			this.isMod = true;
			this.mod = new Modulator(this.index, params.mod, name);
		}
	}

	/**
	 * get current value
	 * @param  {number} voiceIndex - voice index in part
	 * @return {number|string|boolean} value 
	 */
	get(_voiceIndex) {
		let i = this.isMod ? Math.round(this.mod.get()) : this.index;
		return this.list[Math.min(this.list.length - 1, i)];
	}
}