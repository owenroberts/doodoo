import * as Tone from 'tone';
import { random, chance, getDate, assert, defineSafeProperty } from '@b/cool';
import { defaults } from './defaults.js';
import { MIDI_NOTES } from './midi.js';
import { Part } from './part.js';
import { Instruments } from './instruments.js';
import { createProperty } from './create-property.js';
import { defaultModSet, compModList, LoopStates } from './constants.js';

/**
 * main greg class for music generation and playback
 */
export class Doodoo {

	constructor(params, callback) {

		/**
		 * configuration of doodoo instance
		 * @type {object}
		 */
		const config = {
			debug: false,
			defaultBeat: '4n', // smallest unit of time
			autoLoad: params.autoLoad ?? true,
			autoStart: params.autoStart ?? true,
			// >> really necessary? 
			playOnStart: false, // if trying to play before loaded
			volume: params.volume ?? 0,
			useMeter: params.useMeter ?? false,
			updateMeter: params.updateMeter ?? false,
			useFFT: params.useFFT ?? false, // this is used for four compositions
			getFFT: params.getFFT ?? false, // this is used for four compositions
			isMetronomeOn: params.isMetronomeOn ?? false,
			withRecording: params.withRecording ?? false,
			withCount: params.withCount ?? false,
			waitForModTrigger: params.waitForModTrigger ?? false,
			onLoop: params.onLoop ?? false,
			onNote: params.onNote ?? false,
			onMod: params.onMod ?? false,
			isLiveMode: params.isLiveMode ?? false,
			useDefaultProps: params.useDefaultProps ?? true,
			isSavePerformance: params.isSavePerformance ?? false, // save data of play
			isPerformance: params.isPerformance ?? false, // playback of a performance
			isEditor: params.isEditor ?? false,
		};

		/**
		 * composition properties
		 * @type {object}
		 */
		const comp = {
			bpm: params.bpm ?? 120,
			tonic: params.tonic ?? 'C4', // assert tonic is midi note name?
			transpose: params.transpose ?? params.tonic ?? 'C4', // tranpose key -- because melody is relative to tonic
			useOctave: params.useOctave ?? false, // in transposition, continue through to octave vs looping around to begging of octave
			isScaleNotesOnly: params.isScaleNotesOnly ?? true, // harmony can only have notes from scale
			scale: params.scale ?? [0, 2, 4, 5, 7, 9, 11], // major default
			isRegularTime: params.isRegularTime ?? false,
			bar: params.bar ?? 4, // beat per bar
			beat: params.beat ?? "4n", // beat
			sequence: params.sequence ?? [[true]],
			modsets: params.modsets ?? [structuredClone(defaultModSet)], // { mods, parts }
			// mods: params.mods ?? {}, // props vs mods ... 
			parts: params.parts ?? [],
			// partMods: params.partMods ?? [],
			startLoops: params.startLoops ?? [],
		};

		// prevents reassignment from UI which uses pass by ref
		defineSafeProperty(this, "config", config);
		defineSafeProperty(this, "comp", comp);

		this.sequenceIndex = 0; // previously currentPart
		this.sequenceLength = this.comp.sequence[0].length;
		this.loopCount = 0; // track total plays of comp -- differnt than part play count (could be)
		this.modCount = 0; // num mods --> different from total plays? -- idts
		this.isPlaying = false;
		
		this.loopControls = params.loopControls ?? [];
		this.liveLoops = [];
		this.voiceCountOverrides = [];
		
		if (this.config.isLiveMode) {
			// this.comp.startLoops = []; // use liveLoops or something instead?
		}

		this.toneLoop; // main loop, created in start and keeps time
		// [ comp [ part [ note 'C4', '4n'], ['A4', '4n']]]
		this.parts = [];
		this.voices = [];
		this.beatCount = 0;
		this.beatCounter = 0;

		this.metroCount = params.metroCount ?? 4;
		this.metroCounter = this.metroCount - 1;

		this.performance = { 
			loops: [],
			date: getDate(), 
		};
		this.performanceLoopIndex = 0;
		
		this.instruments = new Instruments(params);

		if (!this.config.isEditor) {
			this.setup();
		} else if (this.config.isPerformance) {
			this.performance = structuredClone(params.performance);
			// need to get instruments to load here ... 
		}

		if (this.config.withRecording) {
			this.recorder = new Tone.Recorder();
			if (!this.config.withCount) {
				withCount = +prompt('Record number of loops?', 10);
			}
		}

		if (this.config.autoLoad) {
			this.loadTone();
		}
	}

	setup() {

		this.instruments.isLoaded = false; // force sample reload
		this.parts = []; // reset parts

		// const mods = structuredClone(this.comp.mods); // props vs mods ... 
		// for (const prop in defaults) {
		// 	if (mods.hasOwnProperty(prop)) continue;
		// 	mods[prop] = this.config.useDefaultProps ? structuredClone(defaults[prop]) : {};
		// }

		// mods that effect entire composition
		const compMods = structuredClone(this.comp.modsets[0].mods);
		this.mods = {};
		if (compMods.scale) {
			this.mods.scale = createProperty(compMods.scale, 'scale');
		}

		if (compMods.transpose) {
			this.mods.transpose = createProperty(compMods.transpose, 'transpose');
		}
		
		if (compMods.bpm) {
			this.mods.bpm = createProperty(compMods.bpm, 'bpm');
		}

		// have to get default beat before going through the parts ...
		this.comp.parts.forEach(part => {
			part.forEach(note => {
				if (parseInt(note[1]) > parseInt(this.config.defaultBeat)) {
					this.config.defaultBeat = note[1];
				}
			});
		});

		// check beat list for possible smaller beats 
		this.comp.modsets.forEach(set => {
			set.mods.beatList?.list.forEach(beat => {
				if (beat > parseInt(this.config.defaultBeat)) {
					this.config.defaultBeat = beat + 'n';
				}
			})
		});

		// create parts with mods
		const partMods = [];
		for (let i = 0; i < this.comp.parts.length; i++) {
			
			partMods[i] = {};

			for (let j = 0; j < this.comp.modsets.length; j++) {
				if (this.comp.modsets[j].parts[i]) {
					for (const k in this.comp.modsets[j].mods) {
						partMods[i][k] = structuredClone(this.comp.modsets[j].mods[k]);
					}
				}
			}

			if (this.config.useDefaultProps) {
				for (const k in defaults) {
					if (partMods[i].hasOwnProperty(k)) continue;
					if (compModList.includes(k)) continue;
					partMods[i][k] = structuredClone(defaults[k]);
				}
			}

			this.parts.push(new Part(
				this.comp.parts[i], 
				partMods[i], 
				this.config.defaultBeat,
				this.comp,
			));
		}
		
		if (partMods.length > 0) {
			// intruments not designed to handle non-stack
			assert(!partMods[0].instruments.list, 'instruments prop is list!');
			assert(!partMods[0].instruments.value, 'instruments prop is value!');
		}


		// load instruments
		// reset instruments loaded ... or use a loaded dict to get loaded

		let loadList = [
			// ...mods.instruments?.stack?.flatMap(e => e.list),
			// ...this.comp.partMods?.flatMap(m => m.instruments.stack)
				// .flatMap(e => e.list),
			...partMods
				.flatMap(m => m.instruments.stack)
				.flatMap(s => s.list),
			...this.comp.startLoops
				.flatMap(count => count.loops)
				.flatMap(loop => loop)
				.filter(loop => loop.instrument)
				.map(loop => loop.instrument)
		];

		loadList = loadList.filter(i => !i.includes("Synth"));
		loadList = [...new Set(loadList)];
		this.instruments.loadList = loadList;
	}

	setupLive() {
		const partCount = this.comp.parts.length;
		this.loopControls = Array.from({ length: partCount }, () => []);
		this.liveLoops = Array.from({ length: partCount }, () => []);
		this.voiceCountOverrides = Array.from({ length: partCount }, () => 0);

		// update to not direct set, break refs
	}

	// start tone using async func to wait for tone
	async loadTone() {
		try {
			await Tone.start();
			this.instruments.load(() => {
				this.start();
			}); 
		} catch(err) {
			console.error('load tone error', err);
		}
	}

	start() {
		if (this.toneLoop) this.toneLoop.dispose();
		this.toneLoop = new Tone.Loop(time => {
			this.playLoop(time);
		}, this.config.defaultBeat);
		Tone.Transport.start();
		Tone.Transport.bpm.value = this.comp.bpm;
		this.toneLoop.start(Tone.Transport.seconds);
		
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

		if (this.config.useMeter) {
			this.meter = new Tone.Meter({ channelCount: 2 });
			Tone.Destination.connect(this.meter);
			this.config.updateMeter(this.meter);
		}

		if (this.config.useFFT) {
			const fft = new Tone.FFT(16); // is bands
			Tone.Destination.connect(fft);
			this.config.getFFT(fft);
		}
		
		if (this.config.isMetronomeOn) {
			this.metro = new Tone.MetalSynth({
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

		this.isPlaying = true;
		if (this.config.autoStart || this.config.playOnStart) {
			this.playNext();
		}
		if (this.config.withRecording) this.recorder.start();
	}

	playLoop(time) {
		if (this.config.isMetronomeOn) {
			if (this.metroCounter === this.metroCount - 1) {
				this.metro.triggerAttackRelease('C4', '4n', time, 0.1);
				this.metroCounter = 0;
			} else {
				this.metroCounter++;
			}
		}

		for (let i = 0; i < this.voices.length; i++) {
			const voice = this.voices[i];
			if (voice.counter >= voice.count) continue;
			if (voice.counter % 1 !== 0) continue;
			const noteIndex = Math.floor(voice.counter) % voice.melody.length;
			const note = voice.melody[noteIndex];
			if (note[0] !== null && note[0] !== 'rest') {
				let [pitch, beat, velocity] = note;
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
			if (this.config.onNote) this.config.onNote({ voiceIndex: i, note });
			voice.counter += 1; // voice.counter;
		}

		this.beatCounter++;
		if (this.beatCounter === this.beatCount && !this.config.waitForModTrigger) {
			this.playNext(time);
		}
	}

	generateLoop(time) {
		if (this.config.withCount) {
			if (this.loopCount >= this.config.withCount * this.sequenceLength) {
				Tone.Transport.stop(time);
				this.isPlaying = false;
				this.saveRecording();
				this.savePerformance();
				return;
			}
		}

		this.beatCounter = 0;
		this.instruments.dispose();
		this.voices = []; // play all voices from parts together

		let partsInSequence = [];
		let longestMelody = 0;

		// get parts in sequence
		for (let i = 0; i < this.parts.length; i++) {
			if (this.comp.sequence[i][this.sequenceIndex]) {
				const partCount = this.parts[i].loopCount;
				let starts;
				if (this.config.isLiveMode) {
					starts = this.liveLoops[i];
				} else {
					let startIndex = 0;
					for (let j = 0; j < this.comp.startLoops.length; j++) {
						if (partCount < startIndex + this.comp.startLoops[j].counts) {
							startIndex = j;
							break;
						} else {
							startIndex += this.comp.startLoops[j].counts;
						}
					}
				 	starts = startIndex < this.comp.startLoops.length ? this.comp.startLoops[startIndex].loops : [];
				}
				const partVoices = this.parts[i].get(starts, this.voiceCountOverrides[i], this.comp);
				partVoices.forEach(l => {
					if (l.melody.length > longestMelody) longestMelody = l.melody.length;
					l.partIndex = i;
				});
				partsInSequence.push(partVoices);
			}
		}

		// make playback have regular bar lengths
		if (this.comp.isRegularTime) {
			
			// get voice with longest beat count
			let partIndex = -1;
			let voiceIndex = -1;
			let beatCount = -1;

			for (let i = 0; i < partsInSequence.length; i++) {
				const voices = partsInSequence[i];
				for (let j = 0; j < voices.length; j++) {
					const voice = voices[j];
					if (voice.count > this.beatCount) {
						partIndex = i;
						voiceIndex = j;
						this.beatCount = voice.count;
					}
				}
			}

			// get remainer beats if exist
			let defaultBeatsInBar = this.comp.bar * (parseInt(this.config.defaultBeat) / parseInt(this.comp.beat));
			let beatsLeftOver = this.beatCount % defaultBeatsInBar;
			if (beatsLeftOver > 0) {
				let makeUpBeats = defaultBeatsInBar - beatsLeftOver;
				for (let i = 0; i < makeUpBeats; i++) {
					partsInSequence[partIndex][voiceIndex].melody.push([null, this.defaultBeat]);
				}
				partsInSequence[partIndex][voiceIndex].count += makeUpBeats;
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
				voice.count = voice.melody.length;
			}
		}

		// get voices from parts
		for (let i = 0; i < partsInSequence.length; i++) {
			let partVoices = partsInSequence[i];
			for (let j = 0; j < partVoices.length; j++) {
				const voiceParams = partVoices[j];
				const harmony = voiceParams.harmony;

				const toneInstrument = this.instruments.get(voiceParams.instrument, { ...voiceParams, volume: this.config.volume }, this.recorder);
				this.voices.push({ ...voiceParams, toneInstrument,  });
				
			}
		}

		this.beatCount = Math.max(0, Math.max(...this.voices.map(l => l.melody.length)));

		const smallestBeat = Math.max(...this.voices.flatMap(v => v.melody.map(b => parseInt(b[1]))));
		this.toneLoop.interval = smallestBeat + 'n';
		
		for (let i = 0; i < this.parts.length; i++) {
			if (this.comp.sequence[i][this.sequenceIndex]) {
				this.parts[i].update();
			}
		}

		// comp level mods
		for (const k in this.mods) {
			this.mods[k].update();
		}

		if (this.mods.scale) {
			let scaleMod = this.mods.scale.get();
			if (chance(scaleMod.chance)) {
				this.shiftScale(Math.round(scaleMod.index), scaleMod.step);
			}
		}

		if (this.mods.transpose) {
			this.comp.transpose = this.mods.transpose.get();
		}

		if (this.mods.bpm) {
			this.comp.bpm = this.mods.bpm.get();
			Tone.Transport.bpm.value = this.comp.bpm;
		}

		if (this.config.onMod) {
			this.config.onMod(this.loopCount, this.loopCount / this.sequenceLength);
		}
		
		// move to next index in sequence (if more than one)
		this.sequenceIndex++;
		if (this.sequenceIndex >= this.sequenceLength) {
			this.sequenceIndex = 0;
		}

		this.loopCount++;
		
		if (Tone.Transport.state === 'stopped') {
			Tone.Transport.start();
		}
		
		if (this.config.isSavePerformance) {
			this.performance.loops.push({
				voices: this.voices,
				beatCount: this.beatCount,
				interval: smallestBeat + 'n', // toneLoop.interval
			});
		}

		if (this.config.isLiveMode) {
			this.updateLive();
		}

		if (this.config.onLoop) {
			this.config.onLoop(this.loopCount);
		}
	}

	getPerformanceLoop() {
		if (this.performanceLoopIndex >= this.performance.loops.length) {
			Tone.Transport.stop();
			this.isPlaying = false;
			saveRecording();
			return;
		}
		
		this.beatCounter = 0;
		this.instruments.dispose();
		
		const loop = structuredClone(this.performance.loops[this.performanceLoopIndex]); 
		this.voices = loop.voices;
		this.beatCount = loop.beatCount;
		this.toneLoop.interval = loop.interval;
		this.loopCount++;

		for (let i = 0; i < this.voices.length; i++) {
			const voiceParams = this.voices[i];
			this.voices[i].toneInstrument = this.instruments.get(voiceParams.instrument, { ...voiceParams, volume: this.config.volume }, this.recorder);
		}

		if (Tone.Transport.state === 'stopped') Tone.Transport.start();
		if (this.config.onLoop) {
			this.config.onLoop(this.loopCount);
		}
		if (params.config.onMod) {
			params.config.onMod(this.loopCount, this.loopCount / this.performance.loops.length);
		}
		this.performanceLoopIndex++;
	}

	cloneVoice(voice) {
		let clone = {};
		for (let k in voice) {
			if (k === 'toneInstrument') continue;
			clone[k] = structuredClone(voice[k]);
		}
		clone.counter = 0;
		return clone;
	}

	updateLive(newLoopControls) {

		// reset start loops
		// this.comp.startLoops = [];

		for (let i = 0; i < this.liveLoops.length; i++) {
			this.liveLoops[i] = []; // reset each part's live loops
		}

		let totalVoices = 0;
		
		// assign voices to loops
		for (let i = 0; i < this.loopControls.length; i++) {
			const partControls = this.loopControls[i];
			for (let j = 0; j < partControls.length; j++) {
				if (partControls[j] === LoopStates.KEEP) {
					let isLoopFound = false;
					for (let k = 0; k < this.voices.length; k++) {
						if (this.voices[k].partIndex !== i) continue;
						if (this.voices[k].liveLoopIndex === j) {
							this.liveLoops[i].push(this.cloneVoice(this.voices[k]));
							isLoopFound = true;
						}
					}
					if (!isLoopFound) {
						for (let k = 0; k < this.voices.length; k++) {
							if (isLoopFound) continue;
							if (this.voices[k].hasOwnProperty('liveLoopIndex')) continue;
							if (this.voices[k].partIndex !== i) continue;
							let v = this.cloneVoice(this.voices[k]);
							v.liveLoopIndex = j;
							this.liveLoops[i].push(v);
							isLoopFound = true;
						}
					}
				}
			}

			// add new loops if needed
			// doesn't totally make sense because if length is greater voiceCountOverride doesn't matter ... 
			let voiceCount = this.loopControls[i].filter(c => c !== LoopStates.KILL).length;
			if (voiceCount > this.liveLoops[i].length) {
				this.voiceCountOverrides[i] = voiceCount;
			} else {
				this.voiceCountOverrides[i] = 0;
			}

			totalVoices += voiceCount;
		}

		if (totalVoices === 0) {
			this.stop();
		} else if (!this.isPlaying) {
			this.play();
		}
	}

	saveRecording() {
		if (!this.config.withRecording) return;
		if (!this.recorder.state === 'started') return;
		if (!this.recorder) return;
	
		function checkMeter() {
			if (this.meter.getValue()[0] < -256) {
				clearInterval(saveInterval);
				saveFile();
			}
		}
			
		async function saveFile() {
			const recording = await this.recorder.stop();
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

	shiftTranspose(dir) {
		let n = MIDI_NOTES.indexOf(this.comp.transpose) + dir;
		this.comp.transpose = MIDI_NOTES[n];
	}

	shiftBPM(n) {
		this.comp.bpm += n;
		Tone.Transport.bpm.value = this.comp.bpm;
	}

	setBPM(bpm) {
		this.comp.bpm += bmp;
		Tone.Transport.bpm.value = this.comp.bpm;
	}

	shiftScale(index, step) {
		if (index >= this.comp.scale.length) return; // assert?
		this.comp.scale[index] += step;
	}

	modulate() {
		this.modCount++;
		this.parts.forEach(part => { part.update(); });
	}

	isRecording() {
		if (!this.recorder) return false;
		return this.recorder.state === 'started' || this.recorder.state === 'paused';
	}

	savePerformance() {
		if (!this.config.isPerformance) return;
		
		this.performance.loops.forEach(loop => {
			loop.voices.forEach(voice => {
				voice.counter = 0;
				delete voice.toneInstrument;
			})
		});
		let perf = JSON.stringify(this.performance);
		let title = prompt("Name performance", "Name");
		localStorage.setItem('greg-perf-' + title, perf);
		const blob = new Blob([perf], { type: 'application/x-download;charset=utf-8' });
		saveAs(blob, title + '.json');
	}

	play() {
		// re-check instruments ... 
		if (!this.config.autoLoad && !this.instruments.isLoaded) {
			return this.loadTone();
		}

		// what does this do?
		// if (this.instruments.isLoaded) {
		// 	this.config.playOnStart = true;
		// 	return;
		// }
		this.isPlaying = true;

		// DRY?
		this.metroCounter = this.metroCount - 1;
		this.loopCount = 0;
		
		this.playNext();
		this.toneLoop.start(Tone.Transport.seconds);
		// seconds causes error with mystery fragments, 2 doodoos
		// toneLoop.start(Tone.now()); // this actually makes it not play the second time ... 
		if (this.config.withRecording) this.recorder.start();
	}

	stop() {
		Tone.Transport.stop();
		this.toneLoop.stop();
		for (let i = 0; i < this.voices.length; i++) {
			// voices[i].toneInstrument.volume.rampTo(-128, 0.1, '+0');
			this.voices[i].toneInstrument.triggerRelease();
		}
		this.instruments.dispose();
		this.isPlaying = false;
		
		this.saveRecording();
		this.savePerformance();
		if (this.config.onStop) {
			this.config.onStop();
		}
	}

	playNext(time) {
		if (!this.isPlaying) this.isPlaying = true; // right?
		// with waitForModTrigger
		if (this.config.isPerformance) {
			this.getPerformanceLoop();
		} else {
			this.generateLoop(time);
		}
	}

	stopNext() {
		this.config.withCount = this.loopCount;
	}

	reset() {
		this.sequenceIndex = 0;
		this.sequenceLength = this.comp.sequence[0].length;
		this.loopCount = 0; 
		this.modCount = 0;
		this.isPlaying = false;
		this.beatCount = 0;
		this.beatCounter = 0;
		this.performanceLoopIndex = 0;
	}

	// debug
	printVoices() {
		console.log('voices', this.voices); 
	}

	printParams() {
		console.log('params', this.parts.map(p => p.getParams())); 
	}

	printComp() {
		console.log('composition', this.comp);
	}
}