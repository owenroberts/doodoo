import { random, randInt, shuffle, chance, Range } from './lib/helpers.js';
import { MIDI, getMelody, getHarmony } from './lib/midi.js';
import Mutation from './lib/Mutation.js';

// export default function Dududu(_tonic, _melody, _startDuration, _scale) {
export default function Dududu(_tonic, _parts, _scale) {

	let noteNames = [];
	let choirSamples;
	

	const scale = _scale || [0, 2, 4, 5, 7, 9, 11]; // major
	
	let tonic = typeof _tonic === 'string' ?
		_tonic :
		MIDI[_tonic];

	const parts = _parts.map(part => {
		const melody = typeof part[0] === 'string' ?
			part :
			part.map(note => MIDI[note]);
		return new Mutation(melody, false);
	});

	let currentPart = 0;
	let totalPlays = 0;

	// global so it doesn't jump all over the place
	const attackStart = new Range(0.25, 0.7);
	const attackStep = new Range(-0.2, 0.2);
	// this is really velocity

	let toneLoop;
	let loops = [];

	function start() {
		toneLoop = new Tone.Loop(loop, '4n');
		Tone.Transport.start('+0.1');
		toneLoop.start(0);
		playTheme();
	}

	function playTheme() {
		parts[currentPart].getLoops().forEach(params => {
			loops.push(makeLoop(params));
			// console.log('loops', loops);
		});

		// change toneLoop duration if anything is lower ... 

		parts[currentPart].update();
		currentPart++;
		if (currentPart >= parts.length) currentPart = 0;
		totalPlays++;
	}

	function makeLoop(params) {

		let noteDuration = params.duration;
		let counter = 1;
		if (noteDuration < 4) {
			counter = noteDuration / 4;
		}
		
		return {
			melody: params.harmony === 0 ? 
				getMelody(params.melody, tonic) :
				getHarmony(params.melody, tonic, params.harmony, scale),
			sampler: getSampler(),
			
			attack: attackStart.random,
			noteDuration: noteDuration,
			startIndex: params.startIndex,
			startDelay: params.startDelay,
			count: params.startIndex || 0,
			counter: counter,
			doubler: params.doubler,
			repeat: params.melodyRepeat,
			ended: false,
		};
	}

	function loop(time) {
		let attack = attackStart.random;
		for (let i = 0; i < loops.length; i++) {
			const loop = loops[i];

			const { melody, noteDuration, sampler, counter, doubler, repeat, startIndex, startDelay } = loops[i];
			

			if (loop.count > (melody.length - 1) * repeat + startIndex + startDelay) {
				loop.ended = true;
			}

			if (!loop.ended) {
				let n = (counter * noteDuration) / 4;
				for (let j = 0; j < n; j++) {
					if (loop.count >= startDelay && (loop.count % 1 === 0 || doubler)) {
						const note = melody[Math.floor(loop.count - startDelay) % melody.length];
						if (note != null) {
							let t = j ? Tone.Time(`${noteDuration}n`).toSeconds() * j : 0;
							console.log(note, noteDuration, n, loop.count, counter);
							// console.log('time', time, 't', t);
							sampler.triggerAttackRelease(note, `${noteDuration}n`, time + t, attack);
						}
						if (doubler && loop.count < melody.length - 1) loop.count += counter;
					}
				}
				if (!doubler) loop.count += counter;
			}
		}

		if (loops.every(l => l.ended)) {
			// playTheme();
			// console.log('play new theme');
		} else {
			attack += attackStep.random;
			attack.clamp(0.1, 1);
		}
	}

	function getSampler() {
		const voice = totalPlays < 3 ? 
			'U' :
			Cool.random('AEIOU'.split(''));
		const samples = {};
		for (let i = 0; i < noteNames.length; i++) {
			const note = noteNames[i];
			samples[note] = choirSamples.get(`${voice}-${note}`);
		}

		const sampler = new Tone.Sampler({
			urls: samples,
			volume: -6,
			release: 1,
		}).toDestination();
		sampler.sync();

		const reverb = new Tone.Reverb({ decay: 5 }).toDestination();
		sampler.connect(reverb);

		if (totalPlays > 8) {
			let effect;
			if (chance(0.25)) {
				const dist = Cool.random(0.05, 0.2);
				effect = new Tone.Distortion(dist).toDestination();
				// console.log('Distortion', dist);
			}
			else if (chance(0.25)) {
				effect = new Tone.Chorus(6, 2.5, 0.5);
				// console.log('Chorus')
			}
			else if (chance(0.25)) {
				const bits = Cool.random([4,8,12]);
				effect = new Tone.BitCrusher(bits).toDestination();
				// console.log('BitCrusher', bits);
			}
			else if (chance(0.25)) {
				const freq = Cool.random(0.5, 1);
				const depth = Cool.random(0.1, 1);
				effect = new Tone.Tremolo(freq, depth).toDestination();
				// console.log('Tremolo', freq, depth);
			}
			if (effect) sampler.connect(effect);
		}
		
		return sampler;
	}

	function load(callback) {

		noteNames = [2,3,4].flatMap(n => 'ABCDEFG'.split('').map(letter => `${letter}${n}`));

		let urls = {};
		for (let i = 0; i < noteNames.length; i++) {
			'AEIOU'.split('').forEach(voice => {
				const note = noteNames[i];
				urls[`${voice}-${note}`] = `${voice}/CH-${voice}${voice}-${note}.mp3`;
			});
		}

		// add ee and aa
		console.time('load choir samples');
		choirSamples = new Tone.ToneAudioBuffers({
			urls: urls,
			baseUrl: "./samples/choir/",
			onload: () => {
				console.timeEnd('load choir samples');
				callback();
			}
		});
	}

	this.setBPM = function(bpm) {
		Tone.Transport.bpm.value = bpm; // starts 128
	}

	this.play = function() {
		playTheme();
	};

	this.stop = function() {
		Tone.Transport.stop();
	};

	this.mutie = function() {
		mutate();
	};

	(async () => {
		await Tone.start();
		load(start);
	})();
}

// https://www.guitarland.com/MusicTheoryWithToneJS/PlayMajorScale.html
// http://www.myriad-online.com/resources/docs/manual/english/gregorien.htm

// https://en.wikibooks.org/wiki/IB_Music/Music_History/Medieval_Period#:~:text=The%20Gregorian%20chant%20began%20to,independently%20of%20the%20original%20chant.
/*
	The Gregorian chant began to evolve around 700. From 700 - 900, composers would write a line in parallel motion to the chant at a fixed interval of a fifth or a fourth above the original line. This technique evolved further from 900 - 1200. During this period, the upper line moved independently of the original chant. After 1100, upper lines even began gaining rhythmic independence.
*/

// https://github.com/saebekassebil/teoria

