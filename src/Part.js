/*
	handle modulations on part
	part of mod rewrite
*/

import { Property } from './Property.js';
import { Bundle } from './Bundle.js';
import { random, randInt, chance } from '../../cool/cool.js';
import { getHarmony } from './Midi.js';

export function Part(part, props, defaultBeat, comp, debug) {
	// default beat number for math -- also smallest beat in entire composition
	// this is the problem! can't go smaller than the smallest ... 
	// so beat mod can only make it slower ...
	// think on this more ... 
	
	let mods = {};
	let playCount = 0;

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
			let addSlice = part.slice(index, index + Math.round(slice.length));
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
			let newBeat = (beatMod / 4) * parseInt(beat);
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

		const loops = []; // need a better word, voices? instruments?
		const loopNum = startLoops.length > 0 ? startLoops.length : mods.loopNum.getInt();
		
		// new beat mod can't be smaller than default -- for now
		// maybe needs to be defaultBeatNum / 2, not sure after working on repeat
		const beatMods = [...Array(loopNum)].map(() => mods.beatList.get());
		const maxBeat = Math.min(...beatMods);
		
		for (let i = 0; i < loopNum; i++) {
			
			// set beginning velocity before generating loop
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
			// console.log('fx limit', mods.fxLimit.get(), Object.keys(fx).length);
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

			const loop = {
				melody: melody,
				count: 0, // count through loop
				countEnd: melody.length - 1,
				harmony: chance(harmony.chance) ?
					harmony.interval : 0,
				instrument: mods.instruments.get(i),
				attack: mods.attack.get(),
				curve: mods.curve.get(),
				release: mods.release.get(),
				double: chance(mods.double.get()),
				fx: fx,
				playBeat: chance(playBeat.chance) ? playBeat.beat : 'def',
			};

			if (startLoops) {
				if (startLoops[i]) {
					for (const prop in startLoops[i]) {
						loop[prop] = startLoops[i][prop];
					}
				}
			}

			loops.push(loop);
		}

		// console.log('loop num', loopNum);
		// console.log('loop length', loops.map(l => l.melody.length));
		// console.log('harmonies', loops.map(l => l.harmony));
		// console.log('start indexes', loops.map(l => l.startIndex));
		// console.log('curve', loops.map(l => l.curve));
		// console.log('play beats', loops.map(l => l.playBeat));

		// console.log('fx', loops.map(l => Object.keys(l.fx).toString()));
		// console.log('loops', loops);
		
		return loops;
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