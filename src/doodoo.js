// import * as Tone from 'tone';
import { random, randInt, shuffle, chance, ValueRange } from './cool.js';
import { MIDI_NOTES, getMelody, getHarmony } from './midi.js';
import Part from './Part.js';
import Defaults from './Defaults.js';
const doodooDefaults = Defaults.defaults;
const doodooDefaultParams = Defaults.params;

Number.prototype.clamp = function(min, max) {
	return Math.min(Math.max(this, min), max);
};

function Doodoo(params, callback) {
	
	let isPlaying = false;
	let noteNames = [];
	let choirSamples;
	let debug = params.debug;
	let samples = params.samples || 'synth';
	let defaultDuration = params.startDuration || '4n';
	let withRecording = params.withRecording;
	let recorder, recordingMutationCount;

	if (withRecording) {
		recorder = new Tone.Recorder();
		recordingMutationCount = +prompt('Record number of mutations?', 10);
	}

	const scale = params.scale || [0, 2, 4, 5, 7, 9, 11]; // major
	
	let tonic = typeof params.tonic === 'string' ?
		params.tonic :
		MIDI_NOTES[params.tonic];

	let doodooParams = params.params;
	let defaults = { ...doodooDefaults, ...doodooParams };
	// console.log('defaults', defaults);

	/*
		parts data struture is currently convoluted
		all compositions have one part so far -- but idea of multiple parts is cool
		some parts are just notes with no durations ['C4', 'C4', 'A4'] etc
		some parts are array of arrays [['C4', '4n'], ['A4', '4n']], these go inside another array which is the "part"

		for now use just [] and [[]] figure out [[[]]] later
	*/

	let parts = [];
	if (params.parts[0] === 'string') {
		const melody = params.parts.map(n => [n, defaultDuration]);
		parts.push(new Part(melody, defaults, defaultDuration, debug));
	} else if (typeof params.parts[0] === 'number') {
		const melody = params.parts.map(n => [MIDI_NOTES[n], defaultDuration]);
		parts.push(new Part(melody, defaults, defaultDuration, debug));
	} else if (Array.isArray(params.parts[0])) {
		const melody = params.parts;
		parts.push(new Part(melody, defaults, defaultDuration, debug));

		const durations = params.parts.map(p => parseInt(p[1]));
		defaultDuration = Math.max(...durations) + 'n';
	}	

	let currentPart = 0;
	let totalPlays = 0;

	// attack velocity -- only (?) global params
	const attackStart = new ValueRange(...defaults.attackStart);
	const attackStep = new ValueRange(...defaults.attackStep);

	let toneLoop;
	let loops = [];

	const useMetro = params.useMetro;
	let metro;

	// start tone using async func to wait for tone
	async function loadTone() {
		await Tone.start();
		if (samples !== 'synth') load(start);
		else start();
	};

	if (params.autoLoad) loadTone();

	function start() {
		if (callback) callback();
		toneLoop = new Tone.Loop(loop, defaultDuration);
		Tone.Transport.start();
		if (params.bpm) Tone.Transport.bpm.value = params.bpm;
		toneLoop.start(0);
		playTheme();
		
		if (useMetro) {
			metro = new Tone.MetalSynth({
				volume: -12,
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

		isPlaying = true;
		if (withRecording) recorder.start();
	}

	function playTheme() {
		loops = [];
		// console.log(parts[currentPart].getLoops())
		parts[currentPart].getLoops().forEach(params => {
			const part = {
				...params,
				melody: params.harmony === 0 ? 
					getMelody(params.melody, tonic) :
					getHarmony(params.melody, tonic, params.harmony, scale),
				sampler: samples !== 'synth' ? getSampler() : getSynth(),
				ended: false,
			};
			loops.push(part);
		});

		/* play notes on default beat ...*/
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

		console.log(
			loops
				.map(l => l.melody)
				.map(m => m.map(n => { return n[0] ? n[0] : ''}).join(' '))
				.join('')
		);

		let mutationCount = parts[currentPart].update();
		if (params.onMutate) params.onMutate(mutationCount);

		currentPart++;
		if (currentPart >= parts.length) currentPart = 0;
		totalPlays++;
		
		if (Tone.Transport.state === 'stopped') Tone.Transport.start();

		if (mutationCount > recordingMutationCount) {
			Tone.Transport.stop();
			isPlaying = false;
			saveRecording();
		}
	}

	function loop(time) {
		if (useMetro) metro.triggerAttackRelease('c4', '4n', time, 0.3);
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

	function getSynth() {
		const fmSynth = new Tone.FMSynth().toDestination();
		if (withRecording) fmSynth.connect(recorder);
		return fmSynth;
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
		
		if (withRecording) sampler.connect(recorder);
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

	async function saveRecording() {
		const recording = await recorder.stop();
		const url = URL.createObjectURL(recording);
		const anchor = document.createElement("a");
		const audioName = prompt('Name clip', "Doodoo_" + new Date().toDateString().replace(/ /g, '-'));
		anchor.download = audioName + ".webm";
		anchor.href = url;
		anchor.click();
	}

	this.moveTonic = function(dir) {
		let n = MIDI_NOTES.indexOf(tonic) + dir;
		tonic = MIDI_NOTES[n];
		tonic = MIDI_NOTES[n];
	};

	this.setTonic = function(note) {
		tonic = note;
	};

	this.printLoops = function() {
		console.log('loops', loops); // debug
	};

	this.moveBPM = function(n) {
		let b = Tone.Transport.bpm.value;
		Tone.Transport.bpm.value = b + n;
	};

	this.setBPM = function(bpm) {
		Tone.Transport.bpm.value = bpm; // starts 128
	};

	this.getIsPlaying = function() {
		return isPlaying;
	};

	this.play = function() {
		if (!params.autoLoad) return loadTone();
		if (Tone.Transport.state === 'stopped') playTheme();
		isPlaying = true;
		if (withRecording) recorder.start();
	};

	this.stop = function() {
		Tone.Transport.stop();
		isPlaying = false;
		if (withRecording) saveRecording();
	};

	this.mutate = function() {
		parts.forEach(part => {
			part.update();
		});
	};
}

export default { 
	Doodoo: Doodoo,
	MIDI_NOTES: MIDI_NOTES,
	doodooDefaults: doodooDefaults,
	doodooDefaultParams: doodooDefaultParams
};

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

