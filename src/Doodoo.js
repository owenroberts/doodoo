// import * as Tone from 'tone';
import { random, randInt, shuffle, chance, ValueRange } from './cool.js';
import { MIDI_NOTES, getMelody, getHarmony } from './midi.js';
import Part from './Part.js';
import SamplePaths from './SamplePaths.js';
import Defaults from './Defaults.js';
const doodooDefaults = Defaults.defaults;
const doodooControls = Defaults.controls;

const samplePaths = SamplePaths.SamplePaths; // wtf

Number.prototype.clamp = function(min, max) {
	return Math.min(Math.max(this, min), max);
};

function Doodoo(params, callback) {
	
	let debug = params.debug;
	let isPlaying = false;
	let defaultDuration = params.duration || '4n';
	let scale = params.scale || [0, 2, 4, 5, 7, 9, 11]; // major
	
	let samples;
	if (params.samples) samplesURL = Array.isArray(samplesURL) ? samplesURL : [samplesURL];

	let voices = params.voices || [params.samples]; // fix for old data

	let withRecording = params.withRecording;
	let recorder, recordingMutationCount;

	if (withRecording) {
		recorder = new Tone.Recorder();
		recordingMutationCount = +prompt('Record number of mutations?', 10);
	}
	
	let tonic = typeof params.tonic === 'string' ?
		params.tonic :
		MIDI_NOTES[params.tonic];

	if (!params.transform) params.transform = params.tonic;
	let transform = typeof params.transform === 'string' ?
		params.transform :
		MIDI_NOTES[params.transform];

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
		if (Array.isArray(params.parts[0][0])) {
			for (let i = 0; i < params.parts.length; i++) {
				const melody = params.parts[i];
				parts.push(new Part(melody, defaults, defaultDuration, debug));
				const durations = params.parts[i].map(p => parseInt(p[1]));
				defaultDuration = Math.max(...durations) + 'n';
			}
		} else {
			const melody = params.parts;
			parts.push(new Part(melody, defaults, defaultDuration, debug));

			const durations = params.parts.map(p => parseInt(p[1]));
			defaultDuration = Math.max(...durations) + 'n';
		}
	}	

	let currentPart = 0;
	let totalPlays = 0;
	let simultaneous = params.simultaneous || false;

	// attack velocity -- only (?) global params
	const attackStart = new ValueRange(...defaults.attackStart);
	const attackStep = new ValueRange(...defaults.attackStep);

	let toneLoop;
	let loops = [];
	let currentCountTotal = 0;
	let currentCount = 0;

	const useMetro = params.useMetro;
	let metro;

	// start tone using async func to wait for tone
	async function loadTone() {
		await Tone.start();
		if (voices.filter(v => !v.includes('Synth')).length > 0) load(start);
		else start();
	}

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
		currentCount = 0;
		loops = [];

		let currentParts = simultaneous ? parts : [parts[currentPart]];
		currentParts.forEach(part => {
			part.getLoops().forEach(params => {
				const part = {
					...params,
					melody: params.harmony === 0 ? 
						getMelody(params.melody, tonic, transform) :
						getHarmony(params.melody, tonic, transform, params.harmony, scale),
					// sampler: samplesURL !== 'synth' ? getSampler() : getSynth()
					voice: getVoice(random(voices))
				};
				loops.push(part);
			});
		});

		/* play notes on default beat ...*/
		loops.forEach(loop => {
			let n = [];
			loop.melody.forEach(beat => {
				const [note, duration] = beat;
				let beats = +defaultDuration[0] / +duration[0];
				if (duration.includes('.')) beats *= 1.5;
				n.push(beat);
				for (let i = 1; i < beats; i++) {
					n.push([null, defaultDuration]);
				}
			});
			loop.melody = n;
			loop.countNum = loop.doubler ? (loop.counter * loop.noteDuration) / 4 : 1;
			loop.countEnd = (loop.melody.length - 1) * loop.repeat + loop.startDelay;
			loop.len = loop.melody.length;
		});

		currentCountTotal = Math.max(0, Math.max(...loops.map(l => l.melody.length)));

		let mutationCount = currentParts.map(part => part.update())[0];
		if (params.onMutate) params.onMutate(mutationCount);

		if (!simultaneous) {
			currentPart++;
			if (currentPart >= parts.length) currentPart = 0;
		}
		totalPlays++;
		
		if (Tone.Transport.state === 'stopped') Tone.Transport.start();

		if (mutationCount > recordingMutationCount) {
			Tone.Transport.stop();
			isPlaying = false;
			saveRecording();
		}
	}

	function loop(time) {
		if (useMetro) metro.triggerAttackRelease('c4', '4n', time, 0.1);	
		let attack = attackStart.random;
		for (let i = 0; i < loops.length; i++) {
			const loop = loops[i];
			if (loop.count > loop.countEnd) continue;
			for (let j = 0; j < loop.countNum; j++) {
				if (loop.count < loop.startDelay) continue;
				if (loop.count % 1 !== 0 && !loop.doubler) continue;
				const beat = loop.melody[Math.floor(loop.count - loop.startDelay + loop.startIndex) % loop.len];
				if (beat[0] !== null) {
					const [note, duration] = beat;
					// time offset for doubles
					let t = j ? Tone.Time(`${loop.noteDuration}n`).toSeconds() * j : 0; 
					loop.voice.triggerAttackRelease(note, duration, time + t, attack);
				}
				if (loop.doublerCounter) loop.count += loop.counter;
			}
			if (!loop.doublerCounter || loop.count < loop.startDelay) loop.count += loop.counter;
		}

		attack += attackStep.random;
		attack.clamp(0.1, 1);

		currentCount++;
		if (currentCount === currentCountTotal) playTheme();
	}

	function getVoice(voice) {
		if (voice.includes('Synth')) return getSynth();
		else return getSampler(voice);
	}

	function getSynth() {
		const fmSynth = new Tone.FMSynth({ 
			volume: params.volume || 0
		}).toDestination();
		addEffects(fmSynth);
		if (withRecording) fmSynth.connect(recorder);
		return fmSynth;
	}

	function getSampler(voice) {
		const sampleFiles = getSampleFiles(voice);
		const sampler = new Tone.Sampler({
			urls: sampleFiles,
			volume: params.volume || 0,
			release: 1,
		}).toDestination();
		addEffects(sampler);
		if (withRecording) sampler.connect(recorder);
		return sampler;
	}

	function addEffects(sampler) {
		let effects = [];

		if (chance(defaults.reverbChance) && totalPlays > defaults.reverbDelay && effects.length <= defaults.fxLimit) {
			const reverb = new Tone.Reverb({ decay: defaults.reverbDecay }).toDestination();
			effects.push(reverb);
		}

		if (chance(defaults.distortionChance) && totalPlays > defaults.distortionDelay && effects.length <= defaults.fxLimit) {
			const dist = random(...defaults.distortion);
			const effect = new Tone.Distortion(dist).toDestination();
			effects.push(effect);
		}

		if (chance(defaults.bitCrushChance) && totalPlays > defaults.bitCrushDelay && effects.length <= defaults.fxLimit) {
			const bits = random(defaults.bitCrushBits);
			const effect = new Tone.BitCrusher(bits).toDestination();
			effects.push(effect);
		}

		if (chance(defaults.autoFilterChance) && totalPlays > defaults.autoFilterDelay && effects.length <= defaults.fxLimit) {
			const freq = random(defaults.autoFilterFrequency);
			const autoFilter = new Tone.AutoFilter(freq).toDestination().start();
			effects.push(autoFilter);
		}

		if (chance(defaults.autoPannerChance) && totalPlays > defaults.autoPannerDelay && effects.length <= defaults.fxLimit) {
			const freq = random(defaults.autoPannerFrequency);
			const autoPanner = new Tone.AutoPanner(freq).toDestination().start();
			effects.push(autoPanner);
		}

		if (chance(defaults.chebyChance) && totalPlays > defaults.chebyDelay && effects.length <= defaults.fxLimit) {
			const order = randInt(defaults.chebyOrder);
			const cheby = new Tone.Chebyshev(order).toDestination();
			effects.push(cheby);
		}

		if (chance(defaults.chorusChance) && totalPlays > defaults.chorusDelay && effects.length <= defaults.fxLimit) {
			const freq = randInt(defaults.chorusFrequency);
			const delay = random(defaults.chorusDelayTime);
			const depth = random(defaults.chorusDepth);
			const chorus = new Tone.Chorus(freq, delay, depth).toDestination().start();
			effects.push(chorus);
		}

		if (chance(defaults.feedbackChance) && totalPlays > defaults.feedbackDelay && effects.length <= defaults.fxLimit) {
			const feedback = random(defaults.feedback);
			const delay = random(defaults.feedbackDelayTime);
			const fb = new Tone.FeedbackDelay(delay, feedback).toDestination();
			effects.push(fb);
		}

		if (chance(defaults.phaserChance) && totalPlays > defaults.phaserDelay && effects.length <= defaults.fxLimit) {
			const freq = randInt(defaults.phaserFrequency);
			const octaves = randInt(defaults.phaserOctaves);
			const base = randInt(defaults.phaserBaseFrequency);
			const phaser = new Tone.Phaser(freq, octaves, base).toDestination();
			effects.push(phaser);
		}

		if (chance(defaults.pingPongChance) && totalPlays > defaults.pingPongDelay && effects.length <= defaults.fxLimit) {
			const delay = random(defaults.pingPongDelayTime);
			const feedback = random(defaults.pingPongFeedback);
			const pingPong = new Tone.PingPongDelay(delay, feedback).toDestination();
			effects.push(pingPong);
		}

		if (chance(defaults.tremoloChance) && totalPlays > defaults.tremoloDelay && effects.length <= defaults.fxLimit) {
			const freq = randInt(defaults.tremoloFrequency);
			const depth = random(defaults.tremoloDepth);
			const tremolo = new Tone.Tremolo(freq, depth).toDestination().start();
			effects.push(tremolo);
		}

		if (chance(defaults.vibratoChance) && totalPlays > defaults.vibratoDelay && effects.length <= defaults.fxLimit) {
			const freq = randInt(...defaults.vibratoFrequency);
			const depth = random(defaults.vibratoDepth);
			const vibrato = new Tone.Vibrato(freq, depth).toDestination();
			effects.push(vibrato);
		}

		effects.forEach(effect => sampler.connect(effect));
	}

	function getSampleFiles(voice) {
		const sampleFiles = {};
		if (voice === 'choir') {
			const letter = totalPlays < 3 ? 'U' : random('AEIOU'.split(''));
			for (const note in samplePaths[voice+letter]) {
				sampleFiles[note] = samples.get(`${voice}-${letter}-${note}`);
			}
		} else {
			for (const note in samplePaths[voice]) {
				sampleFiles[note] = samples.get(`${voice}-${note}`);
			}
		}
		return sampleFiles;
	}

	function loadSamples() {
		let urls = {};
		voices.forEach(voice => {
			if (voice === 'choir') {
				'AEIOU'.split('').forEach(letter => {
					const voiceSampleURLS = samplePaths['choir'+letter];
					for (const note in voiceSampleURLS) {
						urls[`${voice}-${letter}-${note}`] = `${voice}/${letter}/${voiceSampleURLS[note]}`;
					}
				});
			} else {
				for (const note in samplePaths[voice]) {
					urls[`${voice}-${note}`] = `${voice}/${samplePaths[voice][note]}`;
				}
			}
		});
		return urls;
	}

	function load(callback) {
		let urls = loadSamples();
		console.time(`load ${voices.join(', ')}`);
		samples = new Tone.ToneAudioBuffers({
			urls: urls,
			baseUrl: '../samples/',
			onload: () => {
				console.timeEnd(`load ${voices.join(', ')}`);
				if (callback) callback();
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
		let n = MIDI_NOTES.indexOf(transform) + dir;
		transform = MIDI_NOTES[n];
	};

	this.setTonic = function(note) {
		transform = note;
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

	this.isRecording = function() {
		return recorder.state === 'started' || recorder.state === 'paused';
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
		if (withRecording && recorder.state === 'started') saveRecording();
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
	doodooControls: doodooControls
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

