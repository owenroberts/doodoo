import { random, randInt, shuffle, chance,  } from './cool.js';

function Effects(def) {

	const fxFuncs = {
		distortion: () => {
			const dist = random(...def.distortion);
			return new Tone.Distortion(dist).toDestination();
		},
		bitCrush: () => {
			const bits = random(def.bitCrushBits);
			return new Tone.BitCrusher(bits).toDestination();
		},
		autoFilter: () => {
			const freq = random(def.autoFilterFrequency);
			return new Tone.AutoFilter(freq).toDestination().start();
		},
		autoPanner: () => {
			const freq = random(def.autoPannerFrequency);
			return new Tone.AutoPanner(freq).toDestination().start();
		},
		cheby: () => {
			const order = randInt(def.chebyOrder);
			return new Tone.Chebyshev(order).toDestination();
		},
		chorus: () => {
			const freq = randInt(def.chorusFrequency);
			const delay = random(def.chorusDelayTime);
			const depth = random(def.chorusDepth);
			return new Tone.Chorus(freq, delay, depth).toDestination().start();
		},
		feedback: () => {
			const feedback = random(def.feedback);
			const delay = random(def.feedbackDelayTime);
			return new Tone.FeedbackDelay(delay, feedback).toDestination();
		},
		phaser: () => {
			const freq = randInt(def.phaserFrequency);
			const octaves = randInt(def.phaserOctaves);
			const base = randInt(def.phaserBaseFrequency);
			return new Tone.Phaser(freq, octaves, base).toDestination();
		},
		tremolo: () => {
			const freq = randInt(...def.tremoloFrequency);
			const depth = random(...def.tremoloDepth);
			return new Tone.Tremolo(freq, depth).toDestination().start();
		},
		pingPong: () => {
			const delay = random(def.pingPongDelayTime);
			const feedback = random(def.pingPongFeedback);
			return new Tone.PingPongDelay(delay, feedback).toDestination();
		},
		vibrato: () => {
			const freq = randInt(...def.vibratoFrequency);
			const depth = random(def.vibratoDepth);
			return new Tone.Vibrato(freq, depth).toDestination();
		},
	}

	function getEffectChance(name, totalPlays) {
		return chance(def[name + 'Chance']) && totalPlays >= def[name + 'Delay'];
	}

	function connect(instrument, totalPlays) {

		// reverb separate for now ...
		if (getEffectChance('reverb', totalPlays)) {
			const reverb = new Tone.Reverb({ decay: def.reverbDecay }).toDestination();
			instrument.connect(reverb);
		}

		const filtered = shuffle(Object.keys(fxFuncs)
			.filter(name => getEffectChance(name, totalPlays)))
			.slice(0, def.fxLimit)
			.forEach(name => {
				instrument.connect(fxFuncs[name]());
			});
	}
	return { connect };
}

export default Effects;