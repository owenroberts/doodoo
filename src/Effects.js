/*
	return effects to chain to synth
*/

function Effects(def) {

	const fxFuncs = {
		reverb: (params) => {
			// { decay: (voiceName === 'toms' ? 0.5 : def.reverbDecay) }
			const decay = params.decay;
			return new Tone.Reverb(decay);
		},
		distortion: (params) => {
			const dist = random(params.distortion);
			return new Tone.Distortion(dist);
		},
		bitCrush: (params) => {
			const bits = random(params.bitCrushBits);
			return new Tone.BitCrusher(bits);
		},
		autoFilter: (params) => {
			const freq = random(params.autoFilterFrequency);
			return new Tone.AutoFilter(freq).start();
		},
		autoPanner: (params) => {
			const freq = random(params.autoPannerFrequency);
			return new Tone.AutoPanner(freq).start();
		},
		cheby: (params) => {
			const order = randInt(params.chebyOrder);
			return new Tone.Chebyshev(order);
		},
		chorus: (params) => {
			const freq = randInt(params.chorusFrequency);
			const delay = random(params.chorusDelayTime);
			const depth = random(params.chorusDepth);
			return new Tone.Chorus(freq, delay, depth).start();
		},
		feedback: (params) => {
			const feedback = random(params.feedback);
			const delay = random(params.feedbackDelayTime);
			return new Tone.FeedbackDelay(delay, feedback);
		},
		phaser: (params) => {
			const freq = randInt(params.phaserFrequency);
			const octaves = randInt(params.phaserOctaves);
			const base = randInt(params.phaserBaseFrequency);
			return new Tone.Phaser(freq, octaves, base);
		},
		tremolo: (params) => {
			const freq = randInt(...params.tremoloFrequency);
			const depth = random(...params.tremoloDepth);
			return new Tone.Tremolo(freq, depth).start();
		},
		pingPong: (params) => {
			const delay = random(params.pingPongDelayTime);
			const feedback = random(params.pingPongFeedback);
			return new Tone.PingPongDelay(delay, feedback);
		},
		vibrato: (params) => {
			const freq = randInt(...params.vibratoFrequency);
			const depth = random(params.vibratoDepth);
			return new Tone.Vibrato(freq, depth);
		},
	};

	function get(fxName, params) {
		// console.log('effects get', fxName, params);
		// console.log(fxFuncs[fxName](params))
		return fxFuncs[fxName](params);
	}

	return { get };
}

