import { createProperty } from './create-property.js';


/**
 * bundles two properties that rely on one another for mods
 * used moslty for fx
 */
export class Bundle {

	/**
	 * creates a bundle
	 * @param  {object} params - { key, value } of props in bundle
	 * @param  {string} name   
	 */
	constructor(params={}, name) {
		this.name = name;
		this.props = {};
		for (const param in params) {
			if (param === 'isBundle') continue;
			this.props[param] = createProperty(params[param], param);
		}
	}

	/**
	 * updates props in bundle
	 * @param  {number} playCount - plays in doodoo
	 */
	update(loopCount) {
		for (const prop in this.props) {
			this.props[prop].update(loopCount);
		}
	}

	/**
	 * get values from prop
	 * @param  {number} voiceIndex - plays in doodoo
	 * @return {object} { prop: value, prop: value }
	 */
	get(voiceIndex) {
		let values = {};
		for (const prop in this.props) {
			if (prop === 'isBundle') continue; // this is the error right?
			values[prop] = this.props[prop].get(voiceIndex);
		}
		return values;
	}

	/**
	 * set value in prop
	 * @param {string} name
	 * @param {number} value
	 */
	set(name, value) {
		this.props[name].set(value);
	}
}