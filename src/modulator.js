import { random, chance, getNumberPrecision } from '@b/cool';
import { createProperty } from './create-property.js';
import { Modes, Bounds } from './constants.js';

/**
 * modulators change property values over time
 * mod.get() replaces value of prop
 * only mods numbers, for list and stack modulates index
 */
export class Modulator {
	
	/**
	 * create modulator
	 * @param  {number} value  - starting value of property
	 * @param  {object} params 
	 * @param  {string} name   - name of property being modded
	 */
	constructor(value, params, name) {

		this.value = value;
		this.name = `${name} mod`;

		/*
			currently, only min and max have mods, therefore need properties
			but for consistency and future proof all props are Properties
		*/

		this.min = createProperty(params.min ?? { value: 0 }, `${name} min`);
		this.max = createProperty(params.max ?? { value: 1 }, `${name} max`);

		this.step = createProperty(params.step ?? { value: 1 }, `${name} step`);
	
		// "kick in" count, wait plays before starting
		this.kick = createProperty(params.kick ?? { value: 0 }, `${name} kick`);
		this.isKicked = this.kick.get() > 0 ? false : true;

		this.chup = createProperty(params.chance ?? { value: 0.5 }, `${name} chup`); // chance of update
		this.mode = createProperty(params.mode ?? { value: Modes.VALUE }, `${name} mode`);
		this.bound = createProperty(params.bound ?? { value: Bounds.STAY }, `${name} bound`);
		
		// float precision to help with maths
		this.precision = params.step ? getNumberPrecision(params.step.value) : 0;
	}

	/**
	 * update the mod
	 * @param  {number} playCount - play count from doodoo
	 */
	update(playCount) {
		// worry about min and reverse later .... 
		
		if (!this.isKicked) {
			if (playCount < this.kick.get()) return;
			if (playCount >= this.kick.get()) this.isKicked = true;
		}
		if (!chance(this.chup.get())) return;

		this.min.update(playCount);
		this.max.update(playCount);
		this.step.update(playCount);

		let s = this.step.get();

		switch(this.mode.get()) {
			case Modes.WALK: 
				this.value += s * (chance(0.5) ? 1 : -1);
				this.value = +this.value.toFixed(this.precision);
			break;
			case Modes.WALK_UP: 
				this.value += s;
				this.value = +this.value.toFixed(this.precision);
			break;
			case Modes.WALK_DOWN: 
				this.value -= s;
				this.value = +this.value.toFixed(this.precision);
			break;
		}

		if (this.value > this.max.get()) {
			switch(this.bound.get()) {
				case Bounds.RESET:
					this.value = this.min.get();
				break;
				case Bounds.REVERSE:
					// needs testing ... 
					switch(this.mode.get()) {
						case Modes.WALK_UP:
							this.mode.set(Modes.WALK_DOWN);
						break;
						case Modes.WALK_DOWN:
							this.mode.set(Modes.WALK_UP);
						break;
					}
				break;
			}
		}



		this.clamp();
	}

	/**
	 * clamp value between min and max
	 */
	clamp() {
		if (this.value < this.min.get()) this.value = this.min.get();
		if (this.value > this.max.get()) this.value = this.max.get();
	}

	/**
	 * set value
	 * @param {number} value
	 */									
	set(value) {
		this.value = value;
		if (this.isKicked) this.clamp();
	}

	/**
	 * get value
	 * @return {number}
	 */
	get() {
		// console.log(this.name, this.type);
		if (this.mode.get() === Modes.RANGE && this.isKicked) {
			return random(this.min.get(), this.max.get());
		} else {
			if (this.isKicked) this.clamp();
			return this.value;
		}
	}
}