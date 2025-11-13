/**
 * property container
 * tracks and modulates values
 */
export class Property {

	/**
	 * constructs a Property
	 * @param  {object} [params]
	 * @param  {string} name
	 */
	constructor(params={}, name) {
		this.name = name;
		this.isMod = false;
	}

	/**
	 * update mod
	 * @param  {number} loopCount - number of loops
	 */
	update(loopCount) {
		if (!this.isMod) return; 
		this.mod.update(loopCount);
	}

	/**
	 * get rounded int of current value
	 * @return {number} - rounded value
	 */
	getInt() {
		return Math.round(this.get());
	}
}