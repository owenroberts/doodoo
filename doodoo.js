import { random, randInt, shuffle, chance, Range } from './lib/cool.js';
import { MIDI, getMelody, getHarmony } from './lib/midi.js';
import Mutation from './lib/Mutation.js';

Number.prototype.clamp = function(min, max) {
	return Math.min(Math.max(this, min), max);
};

export default function Doodoo(params, callback) {
	// params -- tonic, parts,_startDuration, scale, samples

	let debug = false;
	let noteNames = [];
	let choirSamples;
	let defaultDuration = params.startDuration || '4n';

	const scale = params.scale || [0, 2, 4, 5, 7, 9, 11]; // major
	
	let tonic = typeof params.tonic === 'string' ?
		params.tonic :
		MIDI[params.tonic];

	const _parts = typeof params.parts[0] === 'string' ?
		[params.parts] :
		params.parts;

	const parts = _parts.map(part => {
		let melody;
		if (typeof part[0] == 'string') melody = part.map(note => [note, defaultDuration]);
		if (typeof part[0] == 'number') melody = part.map(note => [MIDI[note], defaultDuration]);
		if (typeof part[0] == 'object') melody = part;
		return new Mutation(melody, false);
	});

	let currentPart = 0;
	let totalPlays = 0;

	// global so it doesn't jump all over the place
	// actually resets with each loop anyway ... 
	const attackStart = new Range(0.25, 0.7);
	const attackStep = new Range(-0.2, 0.2);
	// this is really velocity

	let toneLoop;
	let loops = [];

	const useMetro = false;
	let metro;

	// start tone using async func to wait for tone
	(async () => {
		await Tone.start();
		load(start);
	})();

	function start() {
		if (callback) callback();
		toneLoop = new Tone.Loop(loop, defaultDuration);
		Tone.Transport.start();
		toneLoop.start(0);
		playTheme();
		if (useMetro) {
			metro = new Tone.MetalSynth({
				volume: -48,
				frequency: 250,
				envelope: {
					attack: 0.01,
					decay: 0.01,
					release: 0.2
				},
				harmonicity: 3.1,
				modulationIndex: 32,
				resonance: 4000,
				octaves: 1.5,
			}).toDestination(); 
		}
	}

	function playTheme() {
		loops = [];
		parts[currentPart].getLoops().forEach(params => {
			const part = {
				...params,
				melody: params.harmony === 0 ? 
					getMelody(params.melody, tonic) :
					getHarmony(params.melody, tonic, params.harmony, scale),
				sampler: getSampler(),
				attack: attackStart.random,
				ended: false,
			};
			loops.push(part);
		});

		loops.forEach(loop => {
			let n = [];
			loop.melody.forEach(beat => {
				const [note, duration] = beat;
				let beats = +defaultDuration[0] / +duration[0];
				n.push(beat);
				for (let i = 1; i < beats; i++) {
					n.push([null, defaultDuration]);
				}
			});
			loop.melody = n;
		});

		parts[currentPart].update();
		currentPart++;
		if (currentPart >= parts.length) currentPart = 0;
		totalPlays++;
		if (Tone.Transport.state === 'stopped') Tone.Transport.start();
	}

	function loop(time) {
		if (useMetro) metro.triggerAttackRelease('c4', '32n', time, 0.3);
		let attack = attackStart.random;
		for (let i = 0; i < loops.length; i++) {
			const loop = loops[i];

			const { melody, noteDuration, sampler, counter, doubler, doublerCounter, repeat, startIndex, startDelay } = loops[i];
			
			if (loop.count > (melody.length - 1) * repeat + startDelay) {
				loop.ended = true;
			}

			if (!loop.ended) {
				let n = doubler ? (counter * noteDuration) / 4 : 1;
				for (let j = 0; j < n; j++) {
					if (loop.count >= startDelay && (loop.count % 1 === 0 || doubler)) {
						const beat = melody[Math.floor(loop.count - startDelay + startIndex) % melody.length];
						if (!beat) {
							// think i fixed this
							console.log('beat', beat, startIndex);
							console.log('loop', i, loop)
							continue;
						} 
						if (beat[0] !== null) {
							const [note, duration] = beat;
							// time offset for doubles
							let t = j ? Tone.Time(`${noteDuration}n`).toSeconds() * j : 0; 
							sampler.triggerAttackRelease(note, duration, time + t, attack);
						}
						if (doublerCounter) loop.count += counter;
					}
				}
				if (!doublerCounter || loop.count < startDelay) loop.count += counter;
			}
		}

		if (loops.every(l => l.ended)) {
			playTheme();
		} else {
			attack += attackStep.random;
			attack.clamp(0.1, 1);
		}
	}

	function getSampler() {
		const voice = totalPlays < 3 ? 
			'U' :
			random('AEIOU'.split(''));
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

		const reverb = new Tone.Reverb({ decay: 5 }).toDestination();
		sampler.connect(reverb);

		if (totalPlays > 8) {
			let effect;
			if (chance(0.25)) {
				const dist = random(0.05, 0.2);
				effect = new Tone.Distortion(dist).toDestination();
				// console.log('Distortion', dist);
			}
			else if (chance(0.25)) {
				effect = new Tone.Chorus(6, 2.5, 0.5);
				// console.log('Chorus')
			}
			else if (chance(0.25)) {
				const bits = random([4,8,12]);
				effect = new Tone.BitCrusher(bits).toDestination();
				// console.log('BitCrusher', bits);
			}
			else if (chance(0.25)) {
				const freq = random(0.5, 1);
				const depth = random(0.1, 1);
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
			baseUrl: params.samples || './doodoo/samples/choir/',
			onload: () => {
				console.timeEnd('load choir samples');
				callback();
			}
		});
	}

	this.printLoops = function() {
		console.log('loops', loops); // debug
	}

	this.setBPM = function(bpm) {
		Tone.Transport.bpm.value = bpm; // starts 128
	};

	this.play = function() {
		if (Tone.Transport.state === 'stopped') playTheme();
	};

	this.stop = function() {
		Tone.Transport.stop();
	};

	this.mutate = function() {
		parts.forEach(part => {
			part.update();
		});
	};

}

/*
	
	melodies can be written just as notes
	parts: [
		'C4', null, 'E3', 'F3', 'G3', null, 'D3', 'E3', 
		'D3', 'F3', 'E3', 'D3', 'F3', 'E3', 'D3', 'F3', 
	], // from garden

	or including durations
	const part1 = [
		['C#6', '2n'], ['D#6', '2n'], [null, '2n'], [null, '8n'], ['A#5', '8n'], ['G#5', '8n'], [null, '8n'],
		['C#6', '2n'], ['D#6', '2n'], ['E6', '2n'], [null, '4n'], ['B5', '8n'], ['A5', '8n'],
		['E6', '2n'], ['F#6', '2n'], ['G#6', '2n'], [null, '4n'], ['C#7', '8n'], ['D#7', '8n'], 
		['C#7', '8n'], [null, '8n'], ['A#6', '4n'], ['G#6', '4n'], ['A#6', '8n'], ['G#6', '4n'], ['A#6', '8n'], ['G#6', '8n'], ['A#6', '8n'], ['G#6', '4n'], [null, '8n']
	]; // from

	use midi notes or letter notes
	// const melody = [60, 57, 55, 62, 64, 67, 69, 72, 60, 74, 72, 74];
	// const melody = ['C4', 'A3', 'G3', 'D4', 'E4', 'G4', 'A4', 'C5', 'C4', 'D5', 'C5', 'D5'];
*/

// https://www.guitarland.com/MusicTheoryWithToneJS/PlayMajorScale.html
// http://www.myriad-online.com/resources/docs/manual/english/gregorien.htm

// https://en.wikibooks.org/wiki/IB_Music/Music_History/Medieval_Period#:~:text=The%20Gregorian%20chant%20began%20to,independently%20of%20the%20original%20chant.
/*
	The Gregorian chant began to evolve around 700. From 700 - 900, composers would write a line in parallel motion to the chant at a fixed interval of a fifth or a fourth above the original line. This technique evolved further from 900 - 1200. During this period, the upper line moved independently of the original chant. After 1100, upper lines even began gaining rhythmic independence.
*/

// https://github.com/saebekassebil/teoria

