import { Property } from './Property.js';
import { ModulatorTypes, Bounds } from './Constants.js';
import { random, chance, getNumberPrecision } from '../../cool/cool.js';

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

		/*
			currently, only min and max have mods, therefore need properties
			but for consistency and future proof all props are Properties
		*/

		this.min = new Property(params.min ?? { value: 0 }, `${name} min`);
		this.max = new Property(params.max ?? { value: 1 }, `${name} max`);

		this.step = new Property(params.step ?? { value: 1 }, `${name} step`);
	
		// "kick in" count, wait plays before starting
		this.kick = new Property(params.kick ?? { value: 0 }, `${name} kick`);
		this.isKicked = this.kick.get() > 0 ? false : true;

		this.chup = new Property(params.chance ?? { value: 0.5 }, `${name} chup`); // chance of update
		this.type = new Property(params.type ?? { value: ModulatorTypes.VALUE }, `${name} type`);
		this.bound = new Property(params.bound ?? { value: Bounds.STAY }, `${name} bound`);
		
		// float precision to help with maths
		this.precision = params.step ? getNumberPrecision(params.step.value) : 0;
	}

	/**
	 * update the mod
	 * @param  {number} playCount - play count from doodoo
	 */
	update(playCount) {
		if (!this.isKicked) {
			if (playCount < this.kick.get()) return;
			if (playCount >= this.kick.get()) this.isKicked = true;
		}
		if (!chance(this.chup.get())) return;

		this.min.update(playCount);
		this.max.update(playCount);

		let s = this.step.get();

		switch(this.type.get()) {
			case ModulatorTypes.WALK: 
				this.value += s * (chance(0.5) ? 1 : -1);
				this.value = +this.value.toFixed(this.precision);
			break;
			case ModulatorTypes.WALK_UP: 
				this.value += s;
				this.value = +this.value.toFixed(this.precision);
			break;
			case ModulatorTypes.WALK_DOWN: 
				this.value -= s;
				this.value = +this.value.toFixed(this.precision);
			break;
		}

		// worry about min and reverse later .... 
		if (this.value > this.max.get() && this.bound.get() === 'reset') this.value = this.min.get();

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
		if (this.type.get() === ModulatorTypes.RANGE && this.isKicked) {
			return random(this.min.get(), this.max.get());
		} else {
			if (this.isKicked) this.clamp();
			return this.value;
		}
	}
}