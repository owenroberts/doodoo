/*
	new doodoo greg paradigm
	expose properties, add mutators to them
	start with simple playback and add to it

	note is beat + pitch
*/

import * as Tone from 'tone';
import { PropertyDefaults } from './PropertyDefaults.js';
import { SamplePaths } from './SamplePaths.js';
import { MIDI_NOTES, getMelody, getHarmony, getTranspose, getCounterpoint } from './Midi.js';
import { Effects } from './Effects.js';
import { Part } from './Part.js';
import { random, chance, getDate } from '../../cool/cool.js';
import { Bundle } from './Bundle.js';

export function Doodoo(params, callback) {

	let debug = false;
	let defaultBeat = '4n'; // smallest unit of time
	let tonic = typeof params.tonic === 'string' ?
		params.tonic :
		MIDI_NOTES[params.tonic];
	let transpose = params.transpose ?? tonic; // tranpose key -- because melody is relative to tonic
	let useOctave = params.useOctave ?? false; // in transposition, continue through to octave vs looping around to begging of octave
	let harmonyScaleOnly = params.harmonyScaleOnly ?? true; // harmony can only have notes from scale
	let scale = params.scale ?? [0, 2, 4, 5, 7, 9, 11]; // major default
	let sequence = params.sequence ?? [[true]]; // part matrix, [play count [part count]]
	let volume = params.volume ?? 0;
	let autoLoad = params.autoLoad ?? true;
	let autoStart = params.autoStart ?? true;
	let playOnStart = false; // if trying to play before loaded
	let startLoops = params.startLoops ?? [];

	if (startLoops.length > 0) {
		if (!startLoops[0].hasOwnProperty('counts')) {
			return alert('Old start loops!');
		} // need an alert for now because this will throw errors
	}
	
	let useMeter = params.useMeter ?? false;
	let setMeter = params.setMeter ?? false;
	let useFFT = params.useFFT ?? false;
	let useMetro = params.useMetro ?? false;
	let withRecording = params.withRecording ?? false;
	let withCount = params.withCount ?? false;
	let waitForModTrigger = params.waitForModTrigger ?? false;
	let onLoop = params.onLoop ?? false;
	let onNote = params.onNote ?? false;
	let noMods = params.noMods ?? false;

	let isLiveMode = params.isLiveMode ?? false;
	let voiceCountOverride = 0; // for live mode
	let loopControls = params.loopControls;
	if (isLiveMode) {
		startLoops = [];
	}

	let useDefaultProps = params.useDefaultProps ?? true;
	// wtf what is props = mods
	const props = params.mods ? structuredClone(params.mods) : {};
	for (const prop in PropertyDefaults) {
		if (props.hasOwnProperty(prop)) continue;
		props[prop] = useDefaultProps ? structuredClone(PropertyDefaults[prop]) : {};
	}

	let samples; // holds the samples
	let samplesLoaded = false;
	// look for samples in props.instruments stack
	const instruments = props.instruments?.stack ?? [];
	const partMods = params.partMods ?? [];

	const loadInstruments = [...new Set([
		...instruments
			.flatMap(e => e.list)
			.filter(i => !i.includes('Synth')),
		...partMods.flatMap(m => m.instruments.stack)
			.flatMap(e => e.list)
			.filter(i => !i.includes('Synth')),
		...startLoops
			.flatMap(count => count.loops)
			.flatMap(loop => loop)
			.filter(loop => loop.instrument)
			.filter(loop => !loop.instrument.includes('Synth'))
			.map(loop => loop.instrument)
	])];

	let sequenceIndex = 0; // previously currentPart
	let totalPlays = 0; // track total plays of comp -- differnt than part play count (could be)
	let modCount = 0; // num mods --> different from total plays? -- idts

	let isPlaying = false;
	let toneLoop; // main loop, created in start and keeps time

	let parts = [];
	let voices = [];
	let totalBeats = 0;
	let beatCount = 0;
	let effects = new Effects();
	let fxToDispose = [];
	let meter;
	let recorder;
	let metro;
	
	// for now, treat parts as having the same format, determined by composer app
	// later, module to convert old versions if necessary
	// [ comp [ part [ beat 'C4', '4n'], ['A4', '4n']]]
	const comp = { tonic, transpose, scale, useOctave }; // need comp values for mods
	const scaleMod = new Bundle(props.scale, 'scale');

	let isSavePerformance = params.isSavePerformance ?? false;
	let performance = { 
		loops: [],
		date: getDate(), 
	};
	let performanceLoopIndex = 0;
	if (params.isPerformance) {
		performance = structuredClone(params.performance);
	} else {
		init();
	}


	if (withRecording) {
		recorder = new Tone.Recorder();
		if (!withCount) withCount = +prompt('Record number of loops?', 10);
	}

	if (autoLoad) loadTone();

	function init() {
		// have to get default beat before going through the parts ...
		params.parts.forEach(part => {
			part.forEach(note => {
				if (parseInt(note[1]) > parseInt(defaultBeat)) defaultBeat = note[1];
			});
		});

		props.beatList?.list.forEach(beat => {
			if (beat > parseInt(defaultBeat)) defaultBeat = beat + 'n';
		});

		for (let i = 0; i < params.parts.length; i++) {
			let partProps = {};
			if (partMods[i]) {
				partProps = { ...props, ...partMods[i] };
			} else {
				partProps = { ...props };
			}
			parts.push(new Part(params.parts[i], partProps, defaultBeat, comp, debug));
		}
	}

	// start tone using async func to wait for tone
	async function loadTone() {
		console.log('load');
		try {
			await Tone.start();
			// only load if using samples
			if (loadInstruments.length > 0) load(start); 
			else start();
		} catch(err) {
			console.error('load tone error', err);
		}
	}

	function load(callback) {
		const urls = {};
		for (let i = 0; i < loadInstruments.length; i++) {
			const instrument = loadInstruments[i];
			if (instrument === 'choir') {
				'AEIOU'.split('').forEach(letter => {
					const sampleURLs = SamplePaths['choir'+letter];
					for (const note in sampleURLs) {
						urls[`${instrument}-${letter}-${note}`] = `${instrument}/${letter}/${sampleURLs[note]}`;
					}
				});
			} else if (instrument.includes('choir')) {
				const letter = instrument.charAt(5);
				const sampleURLs = SamplePaths['choir'+letter];
				for (const note in sampleURLs) {
					urls[`choir-${letter}-${note}`] = `choir/${letter}/${sampleURLs[note]}`;
				}
			} else {
				for (const note in SamplePaths[instrument]) {
					urls[`${instrument}-${note}`] = `${instrument}/${SamplePaths[instrument][note]}`;
				}
			}
		}
		console.time(`load ${loadInstruments.join(', ')}`);
		samples = new Tone.ToneAudioBuffers({
			urls: urls,
			baseUrl: params.samplesURL || '../samples/',
			onload: () => {
				console.timeEnd(`load ${loadInstruments.join(', ')}`);
				if (callback) callback();
				samplesLoaded = true;
			},
			onerror: error => { console.error(error); },
		});
	}

	function start() {
		
		toneLoop = new Tone.Loop(playLoop, defaultBeat);
		Tone.Transport.start();
		if (params.bpm) Tone.Transport.bpm.value = params.bpm;
		toneLoop.start(Tone.Transport.seconds);
		// console.log(params.bpm, Tone.Transport.bpm.value)

		// master ing
		var compressor = new Tone.Compressor({
			"threshold": -30,
			"ratio": 3,
			"attack": 0.5,
			"release": 0.1
		});
		const limiter = new Tone.Limiter(-20);
		// Tone.Master.chain(compressor, limiter);
		// Tone.Master.chain(compressor);
		// Tone.Master.chain(limiter);

		if (useMeter) {
			meter = new Tone.Meter({ channelCount: 2 });
			Tone.Destination.connect(meter);
			params.setMeter(meter);
		}

		if (useFFT) {
			const fft = new Tone.FFT(16); // is bands
			Tone.Destination.connect(fft);
			params.getFFT(fft);
		}
		
		if (autoStart || playOnStart) {
			if (params.isPerformance) {
				getPerformanceLoop();
			} else {
				generateLoop();
			}
		}

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

		if (callback) callback();
	}

	function playLoop(time) {
		if (useMetro) metro.triggerAttackRelease('C4', '4n', time, 0.1);
		for (let i = 0; i < voices.length; i++) {
			const voice = voices[i];
			if (voice.count >= voice.countEnd) continue;
			if (voice.count % 1 !== 0) continue;
			const noteIndex = Math.floor(voice.count) % voice.melody.length;
			const note = voice.melody[noteIndex];
			if (note[0] !== null && note[0] !== 'rest') {
				let [pitch, beat, velocity] = note;
				if (voice.playBeat !== 'def') beat = voice.playBeat + 'n';
				if (!velocity) velocity = 1;
				if (voice.double) {
					// still weird w fmSynth idky
					beat = parseInt(beat) * 2 + 'n';
					let t = Tone.Time(beat).toSeconds();
					try {
						voice.toneInstrument.triggerAttackRelease(pitch, beat, time, velocity);
						voice.toneInstrument.triggerAttackRelease(pitch, beat, time + t, velocity);
					} catch(err) {
						console.log('that null error!'); // but its not a null value, its prob Infinity value for t
						console.log('voice', voice);
						console.log('pitch', pitch);
						console.log('beat', beat);
						console.log('time', time);
						console.log('t', t);
						console.log('time + t', time + t);
						console.log('velocity', velocity);
						console.warn(err);
					}
				} else {
					voice.toneInstrument.triggerAttackRelease(pitch, beat, time, velocity);
				}

			}
			if (onNote) onNote({ voiceIndex: i, note });
			voice.count += 1; // voice.counter;
		}

		beatCount++;
		if (beatCount === totalBeats && !waitForModTrigger) {
			if (params.isPerformance) {
				getPerformanceLoop();
			} else {
				generateLoop();
			}
		}
	}

	function generateLoop() {
		if (withCount) {
			if (totalPlays >= withCount * sequence[0].length) {
				Tone.Transport.stop();
				isPlaying = false;
				if (recorder) saveRecording();
				if (isSavePerformance) savePerformance();
				return;
			}
		}

		beatCount = 0;
		disposePrevious();
		voices = []; // play all voices from parts together

		let partsInSequence = [];
		let longestMelody = 0;

		// get parts in sequence
		for (let i = 0; i < parts.length; i++) {
			if (sequence[i][sequenceIndex]) {
				const partCount = parts[i].getCount(); // rewrite as class -- this is "loop count" maybe
				let starts;
				if (isLiveMode) {
					starts = startLoops;
				} else {
					let startIndex = 0;
					for (let j = 0; j < startLoops.length; j++) {
						if (partCount < startIndex + startLoops[j].counts) {
							startIndex = j;
							break;
						} else {
							startIndex += startLoops[j].counts;
						}
					}
				 	starts = startIndex < startLoops.length ? startLoops[startIndex].loops : [];
				}
				const partVoices = parts[i].get(starts, voiceCountOverride);
				partVoices.forEach(l => {
					if (l.melody.length > longestMelody) longestMelody = l.melody.length;
				});
				partsInSequence.push(partVoices);
			}
		}

		if (params.isRegularTime) {
			
			// get voice with longest beat count
			let partIndex = -1;
			let voiceIndex = -1;
			let beatCount = -1;

			for (let i = 0; i < partsInSequence.length; i++) {
				const voices = partsInSequence[i];
				for (let j = 0; j < voices.length; j++) {
					const voice = voices[j];
					if (voice.countEnd > beatCount) {
						partIndex = i;
						voiceIndex = j;
						beatCount = voice.countEnd;
					}
				}
			}

			// get remainer beats if exist
			let defaultBeatsInBar = params.timeBar * (parseInt(defaultBeat) / parseInt(params.timeBeat));
			let beatsLeftOver = beatCount % defaultBeatsInBar;
			if (beatsLeftOver > 0) {
				let makeUpBeats = defaultBeatsInBar - beatsLeftOver;
				for (let i = 0; i < makeUpBeats; i++) {
					partsInSequence[partIndex][voiceIndex].melody.push([null, defaultBeat]);
				}
				partsInSequence[partIndex][voiceIndex].countEnd += makeUpBeats;
			}
		}

		// make parts match length ... 
		for (let i = 0; i < partsInSequence.length; i++) {
			const voices = partsInSequence[i];
			for (let j = 0; j < voices.length; j++) {
				const voice = voices[j];
				const ratio = Math.floor(longestMelody / voice.melody.length);
				const clone = structuredClone(voice.melody);
				for (let k = 1; k < ratio; k++) {
					const copy = structuredClone(clone);
					voice.melody = voice.melody.concat(copy);
				}
				voice.countEnd = voice.melody.length;
			}
		}

		// get voices from parts
		for (let i = 0; i < partsInSequence.length; i++) {
			let partVoices = partsInSequence[i];
			for (let j = 0; j < partVoices.length; j++) {
				const voiceParams = partVoices[j];
				const harmony = voiceParams.harmony;
				const transposePitch = getTranspose(transpose, voiceParams.transpose);

				let melody;
				if (voiceParams.hasOwnProperty("liveLoopIndex")) {
					melody = voiceParams.melody;
				} else if (harmony === 0) {
					melody = getMelody(voiceParams.melody, tonic, transposePitch, scale);
				} else {
					// if live loop, melody is already transposed
					melody = getHarmony(voiceParams.melody, tonic, transposePitch, harmony, scale, useOctave, harmonyScaleOnly);
				}

				const toneInstrument = getInstrument(voiceParams.instrument, { ...voiceParams, volume });
				voices.push({ ...voiceParams, melody, toneInstrument, });

				// fuck for live this doesn't work ... ignore counterpoint for now ... 
				if (voiceParams.counterpoint) {
					const mel = getMelody(voiceParams.melody, tonic, transposePitch, scale);
					const counterpoint = getCounterpoint(mel, transposePitch, scale);
					const counterInstrument = getInstrument(voiceParams.instrument, { ...voiceParams, volume });
					if (voiceParams.hasOwnProperty("liveLoopIndex")) {
						delete voiceParams.liveLoopIndex;
					}
					voices.push({ ...voiceParams, melody: counterpoint, toneInstrument: counterInstrument });
				}
			}
		}

		totalBeats = Math.max(0, Math.max(...voices.map(l => l.melody.length)));

		const smallestBeat = Math.max(...voices.flatMap(voice => voice.melody.map(b => parseInt(b[1]))));
		toneLoop.interval = smallestBeat + 'n';
		
		if (!noMods) {
			for (let i = 0; i < parts.length; i++) {
				if (sequence[i][sequenceIndex]) parts[i].update();
			}

			scaleMod.update();
			let scaleModVals = scaleMod.get();
			if (chance(scaleModVals.chance)) {
				moveScale(Math.round(scaleModVals.index), scaleModVals.step);
			}

			if (params.onModulate) {
				params.onModulate(totalPlays, totalPlays / sequence[0].length);
			}
		}
		
		// move to next index in sequence (if more than one)
		sequenceIndex++;
		if (sequenceIndex >= sequence[0].length) sequenceIndex = 0;
		
		totalPlays++;
		
		if (Tone.Transport.state === 'stopped') Tone.Transport.start();
		
		if (isSavePerformance) {
			performance.loops.push({
				voices,
				totalBeats,
				interval: smallestBeat + 'n',
			});
		}

		if (isLiveMode) {
			updateLive();
		}

		if (onLoop) onLoop(totalPlays);
	}

	function getPerformanceLoop() {
		if (performanceLoopIndex >= performance.loops.length) {
			Tone.Transport.stop();
			isPlaying = false;
			if (recorder) saveRecording();
			return;
		}
		beatCount = 0;
		disposePrevious();
		const loop = structuredClone(performance.loops[performanceLoopIndex]); 
		voices = loop.voices;
		totalBeats = loop.totalBeats;
		toneLoop.interval = loop.interval;
		totalPlays++;

		for (let i = 0; i < voices.length; i++) {
			const voiceParams = voices[i];
			voices[i].toneInstrument = getInstrument(voiceParams.instrument, { ...voiceParams, volume });
		}

		if (Tone.Transport.state === 'stopped') Tone.Transport.start();
		if (onLoop) onLoop(totalPlays);
		if (params.onModulate) {
			params.onModulate(totalPlays, totalPlays / performance.loops.length);
		}
		performanceLoopIndex++;
	}


	function cloneVoice(voice) {
		let clone = {};
		for (let k in voice) {
			if (k === 'toneInstrument') continue;
			clone[k] = structuredClone(voice[k]);
		}
		clone.count = 0;
		return clone;
	}

	function updateLive(newLoopControls) {

		if (newLoopControls) loopControls = newLoopControls;

		// reset start loops
		startLoops = [];

		// assign voices to loops
		for (let i = 0; i < loopControls.length; i++) {
			if (loopControls[i] === 1) {
				let isLoopFound = false;
				for (let j = 0; j < voices.length; j++) {
					if (voices[j].liveLoopIndex === i) {
						startLoops.push(cloneVoice(voices[j]));
						isLoopFound = true;
					}
				}
				if (!isLoopFound) {
					for (let j = 0; j < voices.length; j++) {
						if (isLoopFound) continue;
						if (voices[j].hasOwnProperty('liveLoopIndex')) continue;
						let v = cloneVoice(voices[j]);
						v.liveLoopIndex = i;
						startLoops.push(v);
						isLoopFound = true;
					}
				}
			}
		}

		// add new loops if needed
		// doesn't totally make sense because if length is greater voiceCountOverride doesn't matter ... 
		let voiceCount = loopControls.filter(c => c > 0).length;
		if (voiceCount > startLoops.length) {
			voiceCountOverride = voiceCount;
		} else {
			voiceCountOverride = 0;
		}

		if (voiceCount === 0) {
			stop();
		} else if (!isPlaying) {
			play();
		}
	}

	function getInstrument(instrument, voiceParams) {
		const i = instrument.includes('Synth') ?
			getSynth(voiceParams) :
			getSampler(instrument, voiceParams);

		if (withRecording) i.chain(Tone.Destination, recorder);
		else i.toDestination();

		for (const fxName in voiceParams.fx) {
			const f = effects.get(fxName, voiceParams.fx[fxName]);
			if (withRecording) f.chain(Tone.Destination, recorder);
			else f.toDestination();
			i.connect(f);
			fxToDispose.push(f);
		}
		return i;
	}

	function getSynth(voiceParams) {
		const fmSynth = new Tone.FMSynth({ 
			volume: voiceParams.volume - 6 ?? -6,
			envelope: {
				attack: Math.max(0.1, voiceParams.attack),
				attackCurve: voiceParams.curve,
				release: voiceParams.release,
				// releaseCurve: voiceParams.curve, // leave on default exponential ...
				// sustain: 0,
			}
		});
		// console.log(fmSynth.envelope);
		return fmSynth;
	}

	function getSampler(instrument, voiceParams) {
		const sampleFiles = getSampleFiles(instrument);
		const sampler = new Tone.Sampler({
			urls: sampleFiles,
			volume: voiceParams.volume ?? 0,
			attack: voiceParams.attack,
			release: voiceParams.release,
			curve: voiceParams.curve,
		});
		sampler.instrument = instrument;
		return sampler;
	}

	function getSampleFiles(instrument) {
		const sampleFiles = {};
		// just make choir aeiou choices, randomize with stacking ... ?? 
		if (instrument.includes('choir')) {
			const letter = instrument.charAt(5) ?
				instrument.charAt(5) :
				random('AEIOU'.split(''));
			for (const note in SamplePaths['choir' + letter]) {
				sampleFiles[note] = samples.get(`choir-${letter}-${note}`);
			}
		} else {
			for (const note in SamplePaths[instrument]) {
				sampleFiles[note] = samples.get(`${instrument}-${note}`);
			}
		}
		return sampleFiles;
	}

	// dispose synths/samplers/fx from prevous playthrough
	function disposePrevious() {
		
		const disposeMe = [];
		
		for (let i = 0; i < voices.length; i++) {
			disposeMe.push(voices[i].toneInstrument);
		}

		for (let i = 0; i < fxToDispose.length; i++) {
			disposeMe.push(fxToDispose[i]);
		}
		
		for (let i = 0; i < disposeMe.length; i++) {
			const d = disposeMe[i];
			// console.log('wet', disposeMe[i].wet)
			// console.log('volume', disposeMe[i].volume)

			// this seems to cause clipping
			// if (d.wet) d.wet.linearRampToValueAtTime(0, 1);
			// if (d.volume) d.volume.linearRampToValueAtTime(0, 1);

			// if (disposeMe[i].releaseAll) disposeMe[i].releaseAll();
			setTimeout(() => {
				// console.log('dispose me', disposeMe[i].volume.value);
				disposeMe[i].dispose(); // way to calculate this??
			}, 2000);
		}

		voices = [];
		fxToDispose = [];
	}

	function saveRecording() {
		function checkMeter() {
			if (meter.getValue()[0] < -256) {
				clearInterval(saveInterval);
				saveFile();
			}
		}
			
		async function saveFile() {
			const recording = await recorder.stop();
			const url = URL.createObjectURL(recording);
			const anchor = document.createElement("a");
			const audioName = prompt('Name clip', params.title || "Doodoo_" + new Date().toDateString().replace(/ /g, '-'));
			anchor.download = audioName + ".webm";
			anchor.href = url;
			anchor.click();
		}

		// wait for sound to stop
		let saveInterval = setInterval(checkMeter, 1000 / 30);
	}

	function moveTonic(dir) {
		let n = MIDI_NOTES.indexOf(transpose) + dir;
		transpose = MIDI_NOTES[n];
	}

	function setTonic(note) {
		transpose = note;
	}

	function moveBPM(n) {
		let b = Tone.Transport.bpm.value;
		Tone.Transport.bpm.value = b + n;
	}

	function setBPM(bpm) {
		Tone.Transport.bpm.value = bpm; // starts 128
	}

	function moveScale(index, step) {
		if (index < scale.length) {
			scale[index] += step;
		}
	}

	function modulate() {
		totalPlays++;
		parts.forEach(part => { part.update(); });
	}

	// better name
	function isRecording() {
		if (!recorder) return false;
		return recorder.state === 'started' || recorder.state === 'paused';
	}

	function savePerformance() {
		
		performance.loops.forEach(loop => {
			loop.voices.forEach(voice => {
				voice.count = 0;
				delete voice.toneInstrument;
			})
		});
		let perf = JSON.stringify(performance);
		let title = prompt("Name performance", "Name");
		localStorage.setItem('greg-perf-' + title, perf);
		const blob = new Blob([perf], { type: 'application/x-download;charset=utf-8' });
		saveAs(blob, title + '.json');
	}

	function play() {
		if (!autoLoad && !samplesLoaded) return loadTone();
		if (loadInstruments.length > 0 && !samplesLoaded) {
			playOnStart = true;
			return;
		}
		isPlaying = true;
		
		if (params.isPerformance) {
			getPerformanceLoop();
		} else {
			generateLoop();
		}

		toneLoop.start(Tone.Transport.seconds);
		// seconds causes error with mystery fragments, 2 doodoos
		// toneLoop.start(Tone.now()); // this actually makes it not play the second time ... 

		if (withRecording) recorder.start();
	}

	function stop() {
		Tone.Transport.stop();
		toneLoop.stop();
		for (let i = 0; i < voices.length; i++) {
			// voices[i].toneInstrument.volume.rampTo(-128, 0.1, '+0');
			voices[i].toneInstrument.triggerRelease();
		}
		disposePrevious();
		isPlaying = false;
		if (withRecording && recorder.state === 'started') saveRecording();
		if (isSavePerformance) savePerformance();
		if (params.onStop) params.onStop();
	}

	function playNext() {
		// with waitForModTrigger
		if (params.isPerformance) {
			getPerformanceLoop();
		} else {
			generateLoop();
		}
	}

	return {
		play, stop, playNext, isRecording, modulate, 
		setBPM, moveBPM, setTonic, moveTonic, moveScale,
		updateLive,
		getVoices: () => { return voices; },
		isPlaying: () => { return isPlaying; },
		getStatusIsPlaying: () => { return isPlaying; }, // old
		printVoices: () => { console.log('loops', voices); }, // debug
		printParams: () => { console.log('params', 	parts.map(p => p.getParams())); }, // debug
		printComp: () => {
			console.log('tonic', tonic);
			console.log('transpose', transpose);
			console.log('scale', scale);
			console.log('default beat', defaultBeat);
			console.log('total plays', totalPlays);
		}
	};
}

// window.Doodoo = Doodoo;

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
