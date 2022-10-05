import { random, randInt, shuffle, chance,  } from './Random.js';

function Effects(def) {

	const fxFuncs = {
		distortion: () => {
			const dist = random(...def.distortion);
			return new Tone.Distortion(dist);
		},
		bitCrush: () => {
			const bits = random(def.bitCrushBits);
			return new Tone.BitCrusher(bits);
		},
		autoFilter: () => {
			const freq = random(def.autoFilterFrequency);
			return new Tone.AutoFilter(freq).start();
		},
		autoPanner: () => {
			const freq = random(def.autoPannerFrequency);
			return new Tone.AutoPanner(freq).start();
		},
		cheby: () => {
			const order = randInt(def.chebyOrder);
			return new Tone.Chebyshev(order);
		},
		chorus: () => {
			const freq = randInt(def.chorusFrequency);
			const delay = random(def.chorusDelayTime);
			const depth = random(def.chorusDepth);
			return new Tone.Chorus(freq, delay, depth).start();
		},
		feedback: () => {
			const feedback = random(def.feedback);
			const delay = random(def.feedbackDelayTime);
			return new Tone.FeedbackDelay(delay, feedback);
		},
		phaser: () => {
			const freq = randInt(def.phaserFrequency);
			const octaves = randInt(def.phaserOctaves);
			const base = randInt(def.phaserBaseFrequency);
			return new Tone.Phaser(freq, octaves, base);
		},
		tremolo: () => {
			const freq = randInt(...def.tremoloFrequency);
			const depth = random(...def.tremoloDepth);
			return new Tone.Tremolo(freq, depth).start();
		},
		pingPong: () => {
			const delay = random(def.pingPongDelayTime);
			const feedback = random(def.pingPongFeedback);
			return new Tone.PingPongDelay(delay, feedback);
		},
		vibrato: () => {
			const freq = randInt(...def.vibratoFrequency);
			const depth = random(def.vibratoDepth);
			return new Tone.Vibrato(freq, depth);
		},
	};

	function getEffectChance(name, totalPlays) {
		return chance(def[name + 'Chance']) && totalPlays >= def[name + 'Delay'];
	}

	function get(totalPlays) {

		// reverb separate for now ...
		let fx = [];
		if (getEffectChance('reverb', totalPlays)) {
			const reverb = new Tone.Reverb({ decay: def.reverbDecay });
			// instrument.connect(reverb);
			fx.push(reverb);
		}

		const filtered = shuffle(Object.keys(fxFuncs)
			.filter(name => getEffectChance(name, totalPlays)))
			.slice(0, def.fxLimit)
			.map(name => fxFuncs[name]());
		
		return [...fx, ...filtered];
			// .forEach(name => {
			// 	if (recorder) instrument.chain(fxFuncs[name](), recorder);
			// 	else instrument.connect(fxFuncs[name]());
			// });
	}
	return { get };
}

export default Effects;