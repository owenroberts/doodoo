import { Property } from './Property.js';
import { Bundle } from './Bundle.js';
import { random, randInt, chance } from '../../cool/cool.js';
import { getHarmony, getTranspose } from './Midi.js';
import { PropertyTypes } from './constants.js';

/**
 * handles update modulations on part melody
 * destructive and non-destructive mods
 */
export class Part {
	
	/**
	 * creates part
	 * @param  {array}  melody      
	 * @param  {object} props       
	 * @param  {string} defaultBeat - smallest beat interval in tone notation
	 * @param  {object} comp        - composition settings
	 */
	constructor(melody, props, defaultBeat, comp) {
		
		this.melody = melody;
		this.defaultBeat = defaultBeat;
		this.comp = comp;
		this.mods = {};
		this.loopCount = 0; // better name -- clear that this counting the number of play of this part
		this.fxListCount = props.fxList.list.length;

		// set up prop modulators
		for (const prop in props) {
			if (props[prop]?.type === PropertyTypes.BUNDLE) {
				this.mods[prop] = new Bundle(props[prop], prop);
			} else {
				this.mods[prop] = new Property(props[prop], prop); // modulator replaces default props
			}
		}
	}

	/**
	 * mod props
	 */
	update() {

		this.loopCount++;

		// update mods
		for (const mod in this.mods) {
			this.mods[mod].update(this.loopCount);
		}

		// process destructive mods

		// think about slice more at some point
		const slice = this.mods.slice.get();
		if (chance(slice.chance)) {
			let index = randInt(this.melody.length);
			let addSlice = this.melody.slice(index, index + Math.round(slice.length));
			
			if (chance(slice.harmChance)) {
				const harm = slice.harmList;
				addSlice = getHarmony(addSlice, this.comp.tonic, this.comp.transpose, harm, this.comp.scale, this.comp.useOctave);
			}
			this.melody.push(...addSlice);
		}

		const shift = this.mods.shift.get();
		if (chance(shift.chance) && this.melody.length > shift.length) {
			this.melody.shift();
		}
	}

	/**
	 * get melody with beats modded by beatMod
	 * modifier of voice beat, like 4n -> 8n
	 * @param  {number} beatMod 
	 * @return {array}
	 */
	getBeats(beatMod) {
		return this.melody.flatMap(note => {
			let [pitch, beat] = note; // note, duration
			
			// apply mod -- defaults to 4, quarter for now
			let newBeat = Math.max(1, (beatMod / 4) * parseInt(beat));
			let beatsInDefault = parseInt(this.defaultBeat) / newBeat;
			
			let firstPitch = chance(this.mods.rest.get()) ? 'rest' : pitch;
			let newPart = [[firstPitch, newBeat + 'n', this.mods.velocity.get().step]];
			this.mods.velocity.update(this.loopCount); // update for next note
			
			for (let i = 1; i < beatsInDefault; i++) {
				newPart.push([null, this.defaultBeat]);
			}
			
			return newPart;
		});
	}

	/**
	 * get voices from part at current loop
	 * @param  {array}  startLoops         - loops to override mods
	 * @param  {number} voiceCountOverride - set total voice count, for live mode
	 * @return {array}
	 */
	get(startLoops, voiceCountOverride) {

		const voices = []; // need a better word, voices? instruments?
		let voiceCount = startLoops.length > 0 ? startLoops.length : this.mods.voiceNum.getInt();
		if (voiceCountOverride > 0) {
			voiceCount = voiceCountOverride;
		}
		
		const beatMods = [...Array(voiceCount)].map(() => this.mods.beatList.get());
		const maxBeat = Math.min(...beatMods);
		
		for (let i = 0; i < voiceCount; i++) {
			
			// set beginning velocity before generating voice
			const velocity = this.mods.velocity.get();
			this.mods.velocity.set('step', velocity.start);

			let melody = this.getBeats(beatMods[i]);
			
			// repeat if shorter beat mod
			const clone = structuredClone(melody);
			for (let j = 1; j < (beatMods[i] / maxBeat); j++) {
				const copy = structuredClone(clone);
				melody = melody.concat(copy);
			}

			let startIndex = this.mods.startIndex.getInt();
			if (startIndex > 0) {
				// find the next note
				while (melody[startIndex][0] === null) {
					startIndex++;
					if (startIndex >= melody.length) {
						startIndex = 0;
					}
				}
				melody = melody.slice(startIndex).concat(melody.slice(0, startIndex));
			}

			const startDelay = i > 0 ? this.mods.startDelay.getInt() : 0;
			for (let i = 0; i < startDelay; i++) {
				melody.unshift([null, this.defaultBeat]);
			}

			const fx = {};
			let whileCount = 0;
			
			while (Object.keys(fx).length < this.mods.fxLimit.get() && 
				whileCount < this.fxListCount) {
				const f = this.mods.fxList.get();
				if (mods[f]) {
					if (chance(this.mods[f].get().chance)) {
						fx[f] = this.mods[f].get();
					}
				}
				whileCount++;
			}

			// always add reverb ... 
			if (chance(this.mods.reverb.get().chance)) {
				fx.reverb = this.mods.reverb.get();
			}

			const harmony = this.mods.harmony.get(); // this actually looks chill
			const playBeat = this.mods.playBeat.get();

			const voice = {
				melody,
				count: 0, // count through loop
				countEnd: melody.length,
				harmony: chance(harmony.chance) ?
					harmony.interval : 0,
				counterpoint: chance(this.mods.counterpoint.get()),
				instrument: this.mods.instruments.get(i),
				attack: this.mods.attack.get(),
				curve: this.mods.curve.get(),
				release: this.mods.release.get(),
				double: chance(this.mods.double.get()),
				fx,
				playBeat: chance(playBeat.chance) ? playBeat.beat : 'def',

				// what is this ... shouldn't be able to transpose part independtly ... 
				transpose: this.mods.transpose.get(), 
			};

			if (startLoops) {
				if (startLoops[i]) {
					for (const prop in startLoops[i]) {
						// console.log(i, prop, startLoops[i])
						voice[prop] = startLoops[i][prop];
					}
				}
			}

			voices.push(voice);
		}
		
		return voices;
	}

	/**
	 * get current params of mod, mostly to print
	 * @return {object}
	 */
	getParams() {
		const params = {};
		for (const m in this.mods) {
			params[m] = this.mods[m].get();
		}
		return params;
	}
}