import * as Tone from 'tone';
import { random, chance, getDate, assert, defineSafeProperty } from '@b/cool';
import { defaults } from './defaults.js';
import { MIDI_NOTES } from './midi.js';
import { Part } from './part.js';
import { Instruments } from './instruments.js';
import { createProperty } from './create-property.js';
import { defaultModSet, compModList, LoopStates } from './constants.js';
import { FileManager } from './doodoo-file-manager';
import { Replay } from './replay';

/**
 * main greg class for music generation and playback
 */
export class Doodoo {

	constructor(params, callback) {

		this.isToneSetup = false;
		this.isConfigured = false; // parts are setup with mod
		this.isPlaying = false;

		this.initConfig(params);
		this.initComp(params);
		this.initEvents(params);

		this.reset();

		this.fm = new FileManager(this);
		this.instruments = new Instruments(params);
		this.replay = new Replay(this);
		
		this.loopControls = params.loopControls ?? [];
		this.liveLoops = [];
		this.voiceCountOverrides = [];
		
		if (this.config.isLiveMode) {
			// this.comp.startLoops = []; // use liveLoops or something instead?
		}

		if (!this.config.isEditor) {
			this.buildParts();
		} else if (this.config.isReplay) {
			this.replay.load(params.replay);
		}

		if (this.config.withRecording) {
			this.recorder = new Tone.Recorder();
			if (!this.config.withCount) {
				withCount = +prompt('Record number of loops?', 10);
			}
		}

		if (this.config.autoLoad) {
			this.loadTone(() => {
				if (this.config.autoPlay || this.config.playOnStart) {
					this.play();
				}
			});
		}
	}

	initConfig(params) {
		/**
		 * configuration of doodoo instance
		 * @type {object}
		 */
		defineSafeProperty(this, "config", {
			debug: false,
			defaultBeat: '4n', // smallest unit of time
			autoLoad: params.autoLoad ?? true,
			autoStart: params.autoStart ?? true,
			// >> really necessary? 
			playOnStart: false, // if trying to play before loaded
			volume: params.volume ?? 0,
			useMeter: params.useMeter ?? false,
			useFFT: params.useFFT ?? false, // this is used for four compositions
			isMetronomeOn: params.isMetronomeOn ?? false,
			metroCount: params.metroCount ?? 4,
			withRecording: params.withRecording ?? false,
			withCount: params.withCount ?? false,
			waitForModTrigger: params.waitForModTrigger ?? false,
			isLiveMode: params.isLiveMode ?? false,
			useDefaultProps: params.useDefaultProps ?? true,
			isSaveReplay: params.isSaveReplay ?? false, // save data of play
			isReplay: params.isReplay ?? false, // playback of a replay
			isEditor: params.isEditor ?? false,
			// networked greg
			isServer: params.isServer ?? false, // server generates comp and nothing else ... 
			isClient: params.isClient ?? false,
		});
	}

	initEvents(params) {
		defineSafeProperty(this, "events", {
			onLoop: params.onLoop ?? false,
			onNote: params.onNote ?? false,
			onMod: params.onMod ?? false,
			onMeterInit: params.onMeterInit ?? false,
			onFFTInit: params.useFFT ?? false,
			onStop: params.onStop ?? false,
		});
	}

	initComp(params) {

		/**
		 * composition properties
		 * @type {object}
		 */
		defineSafeProperty(this, "comp", {
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
		});
	}

	reset() {
		this.sequenceIndex = 0;
		this.sequenceLength = this.comp.sequence[0].length;
		this.loopCount = 0; // total plays of comp
		this.modCount = 0;  // num mods --> different from total plays? -- idts, but maybe could be ... 
		
		this.beatCount = 0;
		this.beatCounter = 0;

		this.metroCount = this.config.metroCount;
		this.metroCounter = this.metroCount - 1;

		this.parts = [];
		this.voices = [];

		this.isConfigured = false;
	}

	load(json) {
		this.fm.load(json);
		this.reset();
		this.isConfigured = false;
		this.instruments.isLoaded = false;
	}

	buildParts() {

		if (this.comp.parts.length === 0) {
			return;
		}

		
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

		// need partmods for load list
		const sampleList = [
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
		this.setupSampleList(sampleList);
		

		this.isConfigured = true;
	}

	setupSampleList(list) {
		list = list.filter(i => !i.includes("Synth"));
		list = [...new Set(list)].sort();
		this.sampleList = [...list];
	}

	setupLive() {
		const partCount = this.comp.parts.length;
		this.loopControls = Array.from({ length: partCount }, () => []);
		this.liveLoops = Array.from({ length: partCount }, () => []);
		this.voiceCountOverrides = Array.from({ length: partCount }, () => 0);

		// update to not direct set, break refs
	}

	// start tone using async func to wait for tone
	async loadTone(callback) {
		if (this.isToneSetup) return callback();

		try {
			await Tone.start();
			this.setupTone();
			callback();
		} catch(err) {
			console.error('load tone error', err);
		}
	}

	setupTone() {
		if (this.toneLoop) this.toneLoop.dispose();
		this.toneLoop = new Tone.Loop(time => {
			this.step(time);
		}, this.config.defaultBeat);
		Tone.getTransport().start();
		Tone.getTransport().bpm.value = this.comp.bpm;
		this.toneLoop.start(Tone.getTransport().seconds);
		
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
			this.events.onMeterInit(this.meter);
		}

		if (this.config.useFFT) {
			const fft = new Tone.FFT(16); // is bands
			Tone.Destination.connect(fft);
			this.config.onFFTInit(fft);
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
		
		if (this.config.withRecording) {
			if (!this.recorder) {
				this.recorder = new Tone.Recorder();
				if (!this.config.withCount) {
					this.config.withCount = +prompt("record number of loops?", 12);
				}
			}
			this.recorder.start();
		} else {
			if (this.recorder) this.recorder.dispose();
			this.recorder = undefined;
		}

		this.isToneSetup = true;
	}

	step(time) {

		// console.log("step", this.loopCount, time);

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
						this.instruments.play(voice.instrumentIndex, pitch, beat, time, velocity);
						this.instruments.play(voice.instrumentIndex, pitch, beat, time + t, velocity);
					} catch(err) {
						this.thatDamnError({ voice, pitch, beat, time, t, velocity, err});
					}
				} else {
					this.instruments.play(voice.instrumentIndex, pitch, beat, time, velocity);
				}

			}
			if (this.events.onNote) {
				this.events.onNote({ voiceIndex: i, note });
			}
			voice.counter += 1; // voice.counter;
		}

		this.beatCounter++;
		if (this.beatCounter === this.beatCount && !this.config.waitForModTrigger) {
			this.next(time);
		}
	}

	generateLoop(time) {

		if (this.config.withCount) {
			if (this.loopCount >= this.config.withCount * this.sequenceLength) {
				Tone.getTransport().stop(time);
				this.isPlaying = false;
				this.saveRecording();
				this.replay.save();
				return;
			}
		}

		// console.log('gen', JSON.stringify(this.comp.sequence));

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
				// const harmony = voiceParams.harmony;
				this.voices.push({ ...partVoices[j] });
			}
		}

		this.addInstruments();

		this.beatCount = Math.max(0, Math.max(...this.voices.map(l => l.melody.length)));

		const smallestBeat = Math.max(...this.voices.flatMap(v => v.melody.map(b => parseInt(b[1]))));
		this.toneLoop.interval = smallestBeat + 'n';

		// console.log('gen', this.beatCount, this.voices);
		// for catslair, not sure if it works for normal
		if (this.beatCount === 0 && this.voices.length === 0) {
			this.isPlaying = false;
		}
		
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
			Tone.getTransport().bpm.value = this.comp.bpm;
		}

		// this is the same as onLoop, but comes before increment ... figure out which one is right ... 
		if (this.events.onMod) {
			this.events.onMod(this.loopCount, this.loopCount / this.sequenceLength);
		}
		
		// move to next index in sequence (if more than one)
		this.sequenceIndex++;
		if (this.sequenceIndex >= this.sequenceLength) {
			this.sequenceIndex = 0;
		}

		this.loopCount++;
		
		if (Tone.getTransport().state === 'stopped') {
			Tone.getTransport().start();
		}
		
		if (this.config.isSaveReplay) {
			this.replay.addLoop({
				voices: this.voices,
				beatCount: this.beatCount,
				interval: smallestBeat + 'n', // toneLoop.interval
			});
		}

		if (this.config.isLiveMode) {
			this.updateLive();
		}

		if (this.events.onLoop) {
			this.events.onLoop(this.loopCount);
		}
	}

	addInstruments() {
		for (let i = 0; i < this.voices.length; i++) {
			this.voices[i].instrumentIndex = this.instruments.add({ ...this.voices[i], volume: this.config.volume }, this.recorder);
		}
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

	checkMeter() {
		if (this.meter.getValue()[0] < -256) {
			clearInterval(this.saveInterval);
			this.saveFile();
		}
	}

	async saveFile() {
		const recording = await this.recorder.stop();
		const url = URL.createObjectURL(recording);
		const anchor = document.createElement("a");
		const title = (localStorage.getItem("greg-title") ?? "greg") + "-" + getDate().toLowerCase();
		const audioName = prompt('Name clip', title);
		anchor.download = audioName + ".webm";
		anchor.href = url;
		anchor.click();
	}

	saveRecording() {
		if (!this.config.withRecording) return;
		if (!this.recorder.state === 'started') return;
		if (!this.recorder) return;
	
			
		// wait for sound to stop
		this.saveInterval = setInterval(() => {
			this.checkMeter();
		}, 1000 / 30);
	}

	shiftTranspose(dir) {
		let n = MIDI_NOTES.indexOf(this.comp.transpose) + dir;
		this.comp.transpose = MIDI_NOTES[n];
	}

	shiftBPM(n) {
		this.comp.bpm += n;
		Tone.getTransport().bpm.value = this.comp.bpm;
	}

	setBPM(bpm) {
		this.comp.bpm += bmp;
		Tone.getTransport().bpm.value = this.comp.bpm;
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

	play() {

		if (this.config.isSaveReplay) {
			this.replay.reset();
		}

		// DRY?
		this.metroCounter = this.metroCount - 1;
		this.loopCount = 0;

		if (!this.isConfigured) {
			this.buildParts();
		}

		// has to happen after parts
		if (!this.instruments.isLoaded) {
			return this.instruments.loadSamples(this.sampleList, () => {
				this.play();
			});
		}

		if (!this.isToneSetup) {
			return this.loadTone(() => {
				this.play();
			});
		}

		this.isPlaying = true;
		this.next(); // get next loop (or replay);

		// fix for catslair time issue
		Tone.getTransport().stop();
		Tone.getTransport().start();
		// end fix

		// seconds causes error with mystery fragments, 2 doodoos
		// toneLoop.start(Tone.now()); // this actually makes it not play the second time ... 
		this.toneLoop.start(Tone.getTransport().seconds);
		
		if (this.config.withRecording && this.recorder) {
			this.recorder.start();	
		}
	}

	next(time) {
		if (!this.isPlaying) this.isPlaying = true; // right?
		// with waitForModTrigger
		if (this.config.isReplay) {
			console.log(this.replay);
			this.replay.getNextLoop();
		} else if (!this.config.isClient) {
			this.generateLoop(time);
		}
	}

	stop() {
		Tone.getTransport().stop();
		this.toneLoop.stop();
		this.instruments.releaseAll();
		this.instruments.dispose();
		this.isPlaying = false;
		
		this.saveRecording();
		this.replay.save();

		if (this.events.onStop) {
			this.events.onStop();
		}
	}

	stopNext() {
		this.config.withCount = this.loopCount;
	}

	// debug
	printVoices() { console.log('voices', this.voices); }
	printParams() { console.log('params', this.parts.map(p => p.getParams())); }
	printComp() { console.log('composition', this.comp); }
	printConfig() { console.log("config", this.config); }

	thatDamnError({ voice, pitch, beat, time, t, velocity, err}) {
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
}