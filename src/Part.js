/*
	handle modulations on part
	part of mod rewrite
*/

import { Property } from './Property.js';
import { Bundle } from './Bundle.js';
import { random, randInt, chance } from '../../cool/cool.js';
import { getHarmony, getTranspose } from './Midi.js';

export function Part(part, props, defaultBeat, comp, debug) {
	// default beat number for math -- also smallest beat in entire composition
	// this is the problem! can't go smaller than the smallest ... 
	// so beat mod can only make it slower ...
	// think on this more ... 
	
	let mods = {};
	let playCount = 0; // better name -- clear that this counting the number of play of this part

	/* set up modulators */
	for (const prop in props) {
		if (props[prop]?.type === 'bundle') {
			mods[prop] = new Bundle(props[prop], prop);
		} else {
			mods[prop] = new Property(props[prop], prop); // modulator replaces default props
		}
	}

	function update() {
		playCount++;
		for (const mod in mods) {
			mods[mod].update(playCount);
		}

		const slice = mods.slice.get();
		if (chance(slice.chance)) {
			// console.log('slice', slice);
			// console.log('mel', part.map(n => `${n[0]},${n[1]}`));
			let index = randInt(part.length);
			let addSlice = part.slice(index, index + Math.round(slice.length)); // look at how slice works more ... 
			// console.log('add', addSlice.map(n => `${n[0]},${n[1]}`));
			if (chance(slice.harmChance)) {
				const harm = slice.harmList;
				addSlice = getHarmony(addSlice, comp.tonic, comp.transpose, harm, comp.scale, comp.useOctave);
				// console.log('harm', harm, addSlice.map(n => `${n[0]},${n[1]}`));
			}
			part.push(...addSlice);
			// console.log('2', part.map(n => `${n[0]},${n[1]}`))
		}

		const shift = mods.shift.get();
		if (chance(shift.chance) && part.length > shift.length) {
			part.shift();
		}
	}

	// convert melody to beats with params
	function getBeats(beatMod) {
		let beats = part.flatMap(note => {
			let [pitch, beat] = note; // note, duration
			
			// apply mod -- defaults to 4, quarter for now
			// math.max(1), prevents 0.5n, but maybe that's cool? idk
			// solves the weird null issue in theory
			// maybe make it a param?
			let newBeat = Math.max(1, (beatMod / 4) * parseInt(beat));
			let beatsInDefault = parseInt(defaultBeat) / newBeat;
			
			let firstPitch = chance(mods.rest.get()) ? 'rest' : pitch;
			let newPart = [[firstPitch, newBeat + 'n', mods.velocity.get().step]];
			mods.velocity.update(playCount); // update for next note
			
			for (let i = 1; i < beatsInDefault; i++) {
				newPart.push([null, defaultBeat]);
			}
			
			return newPart;
		});
		return beats;
	}

	function get(startLoops) {

		const voices = []; // need a better word, voices? instruments?
		const voiceNum = startLoops.length > 0 ? startLoops.length : mods.voiceNum.getInt();
		
		// new beat mod can't be smaller than default -- for now
		// maybe needs to be defaultBeatNum / 2, not sure after working on repeat
		const beatMods = [...Array(voiceNum)].map(() => mods.beatList.get());
		const maxBeat = Math.min(...beatMods);
		
		for (let i = 0; i < voiceNum; i++) {
			
			// set beginning velocity before generating voice
			const velocity = mods.velocity.get();
			mods.velocity.set('step', velocity.start);

			let melody = getBeats(beatMods[i]);
			
			// repeat if shorter beat mod
			const clone = structuredClone(melody);
			for (let j = 1; j < (beatMods[i] / maxBeat); j++) {
				const copy = structuredClone(clone);
				melody = melody.concat(copy);
			}

			let startIndex = mods.startIndex.getInt();
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

			const startDelay = i > 0 ? mods.startDelay.getInt() : 0;
			for (let i = 0; i < startDelay; i++) {
				melody.unshift([null, defaultBeat]);
			}

			const fx = {};
			let whileCount = 0;
			
			while (Object.keys(fx).length < mods.fxLimit.get() && 
				whileCount < props.fxList.list.length) {
				const f = mods.fxList.get();
				if (mods[f]) {
					if (chance(mods[f].get().chance)) {
						fx[f] = mods[f].get();
					}
				}
				whileCount++;
			}

			// always add reverb ... 
			if (chance(mods.reverb.get().chance)) {
				// jesus that looks awful
				fx.reverb = mods.reverb.get();
			}

			const harmony = mods.harmony.get(); // this actually looks chill
			const playBeat = mods.playBeat.get();

			const voice = {
				melody: melody,
				count: 0, // count through loop
				countEnd: melody.length,
				harmony: chance(harmony.chance) ?
					harmony.interval : 0,
				counterpoint: chance(mods.counterpoint.get()),
				instrument: mods.instruments.get(i),
				attack: mods.attack.get(),
				curve: mods.curve.get(),
				release: mods.release.get(),
				double: chance(mods.double.get()),
				fx: fx,
				playBeat: chance(playBeat.chance) ? playBeat.beat : 'def',
				transpose: mods.transpose.get(),
			};

			if (startLoops) {
				if (startLoops[i]) {
					for (const prop in startLoops[i]) {
						voice[prop] = startLoops[i][prop];
					}
				}
			}

			voices.push(voice);
		}

		// console.log('voice num', voiceNum);
		// console.log('voice length', voices.map(l => l.melody.length));
		// console.log('harmonies', voices.map(l => l.harmony));
		// console.log('start indexes', voices.map(l => l.startIndex));
		// console.log('curve', voices.map(l => l.curve));
		// console.log('play beats', voices.map(l => l.playBeat));

		// console.log('fx', voices.map(l => Object.keys(l.fx).toString()));
		// console.log('voices', voices);
		
		return voices;
	}

	// prop need to work on this more ...
	function getParams() {
		const params = {};
		for (const m in mods) {
			params[m] = mods[m].get();
		}
		return params;
	}

	return { 
		get, update, getParams,
		getCount: () => { return playCount; },
	};
}