import * as Tone from 'tone';
import { defaults } from './defaults.js';
import { MIDI_NOTES, getMelody, getHarmony, getTranspose, getCounterpoint } from './midi.js';
import { Part } from './part.js';
import { random, chance, getDate } from '../../cool/cool.js';
import { Instruments } from './instruments.js';
import { createProperty } from './create-property.js';

/**
 * main greg class for music generation and playback
 */
export class Doodoo {

	constructor(params, callback) {

		/**
		 * configuration of doodoo instance
		 * @type {object}
		 */
		this.config = {
			debug: false,
			defaultBeat: '4n', // smallest unit of time
			autoLoad: params.autoLoad ?? true,
			autoStart: params.autoStart ?? true,
			playOnStart: false, // if trying to play before loaded
			volume: params.volume ?? 0,
			useMeter: params.useMeter ?? false,
			updateMeter: params.updateMeter ?? false,
			useFFT: params.useFFT ?? false, // this is used for four compositions
			getFFT: params.getFFT ?? false, // this is used for four compositions
			useMetro: params.useMetro ?? false,
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
		};

		/**
		 * composition properties
		 * @type {object}
		 */
		this.comp = {
			bpm: params.bpm,
			tonic: params.tonic, // assert tonic is midi note name?
			transpose: params.transpose ?? tonic, // tranpose key -- because melody is relative to tonic
			useOctave: params.useOctave ?? false, // in transposition, continue through to octave vs looping around to begging of octave
			harmonyScaleOnly: params.harmonyScaleOnly ?? true, // harmony can only have notes from scale
			scale: params.scale ?? [0, 2, 4, 5, 7, 9, 11], // major default
			isRegularTime: params.isRegularTime ?? false,
			timeBar: params.timeBar,
			timeBeat: params.timeBeat,
			sequence: params.sequence ?? [[true]],
		};

		this.sequenceIndex = 0; // previously currentPart
		this.sequenceLength = this.comp.sequence[0].length;
		this.loopCount = 0; // track total plays of comp -- differnt than part play count (could be)
		this.modCount = 0; // num mods --> different from total plays? -- idts
		this.isPlaying = false;
		
		this.partMods = params.partMods ?? [];
		this.startLoops = params.startLoops ?? [];
	
		this.loopControls = params.loopControls;
		this.voiceCountOverride = 0; // for live mod
		if (this.config.isLiveMode) {
			this.startLoops = [];
		}

		this.props = params.mods ? structuredClone(params.mods) : {}; // props vs mods ... 
		for (const prop in defaults) {
			if (this.props.hasOwnProperty(prop)) continue;
			this.props[prop] = this.config.useDefaultProps ? structuredClone(defaults[prop]) : {};
		}

		/**
		 * mods that effect entire composition
		 * @type {object}
		 */
		this.mods = {
			scale: createProperty(this.props.scale, 'scale'),
			// transpose
			// bpm
		};

		this.instruments = new Instruments(params, this.props, this.startLoops);

		// [ comp [ part [ beat 'C4', '4n'], ['A4', '4n']]]
		this.toneLoop; // main loop, created in start and keeps time
		this.parts = [];
		this.voices = [];
		this.beatCount = 0;
		this.beatCounter = 0;

		this.performance = { 
			loops: [],
			date: getDate(), 
		};
		this.performanceLoopIndex = 0;
		if (this.config.isPerformance) {
			this.performance = structuredClone(params.performance);
		} else {
			this.initParts(params.parts);
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

	initParts(parts) {
		// have to get default beat before going through the parts ...
		parts.forEach(part => {
			part.forEach(note => {
				if (parseInt(note[1]) > parseInt(this.config.defaultBeat)) this.config.defaultBeat = note[1];
			});
		});

		this.props.beatList?.list.forEach(beat => {
			if (beat > parseInt(this.config.defaultBeat)) this.config.defaultBeat = beat + 'n';
		});

		for (let i = 0; i < parts.length; i++) {
			let partProps = {};
			if (this.partMods[i]) {
				partProps = { ...this.props, ...this.partMods[i] };
			} else {
				partProps = { ...this.props };
			}
			this.parts.push(new Part(parts[i], partProps, this.config.defaultBeat, this.comp));
		}
	}

	// start tone using async func to wait for tone
	async loadTone() {
		try {
			await Tone.start();
			// only load if using samples
			if (this.instruments.loadList.length > 0) {
				this.instruments.load(() => {
					this.start();
				}); 
			} else {
				this.start();
			}
		} catch(err) {
			console.error('load tone error', err);
		}
	}

	start() {
		this.toneLoop = new Tone.Loop(time => {
			this.playLoop(time);
		}, this.config.defaultBeat);
		Tone.Transport.start();
		if (this.comp.bpm) Tone.Transport.bpm.value = this.comp.bpm;
		this.toneLoop.start(Tone.Transport.seconds);
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
		
		if (this.config.autoStart || this.config.playOnStart) {
			this.playNext();
		}

		if (this.config.useMetro) {
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
			this.metroCount = this.comp.timeBar;
			this.metroCounter = this.metroCount - 1;
		}

		this.isPlaying = true;
		if (this.config.withRecording) this.recorder.start();
	}

	playLoop(time) {
		if (this.config.useMetro) {
			if (this.metroCounter === this.metroCount - 1) {
				this.metro.triggerAttackRelease('C4', '4n', time, 0.1);
				this.metroCounter = 0;
			} else {
				this.metroCounter++;
			}
		}

		for (let i = 0; i < this.voices.length; i++) {
			const voice = this.voices[i];
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
			if (this.config.onNote) this.config.onNote({ voiceIndex: i, note });
			voice.count += 1; // voice.counter;
		}

		this.beatCounter++;
		if (this.beatCounter === this.beatCount && !this.config.waitForModTrigger) {
			this.playNext();
		}
	}

	generateLoop() {
		if (this.config.withCount) {
			if (this.loopCount >= this.config.withCount * this.sequenceLength) {
				Tone.Transport.stop();
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
					starts = this.startLoops;
				} else {
					let startIndex = 0;
					for (let j = 0; j < this.startLoops.length; j++) {
						if (partCount < startIndex + this.startLoops[j].counts) {
							startIndex = j;
							break;
						} else {
							startIndex += this.startLoops[j].counts;
						}
					}
				 	starts = startIndex < this.startLoops.length ? this.startLoops[startIndex].loops : [];
				}
				const partVoices = this.parts[i].get(starts, this.config.voiceCountOverride);
				partVoices.forEach(l => {
					if (l.melody.length > longestMelody) longestMelody = l.melody.length;
				});
				partsInSequence.push(partVoices);
			}
		}

		// make playback have regular bar lengths
		if (this.comp.isRegularTime) {
			
			// get voice with longest beat count
			let partIndex = -1;
			let voiceIndex = -1;
			let beatCounter = -1;

			for (let i = 0; i < partsInSequence.length; i++) {
				const voices = partsInSequence[i];
				for (let j = 0; j < voices.length; j++) {
					const voice = voices[j];
					if (voice.countEnd > this.beatCounter) {
						partIndex = i;
						voiceIndex = j;
						this.beatCounter = voice.countEnd;
					}
				}
			}

			// get remainer beats if exist
			let defaultBeatsInBar = this.comp.timeBar * (parseInt(this.config.defaultBeat) / parseInt(this.comp.timeBeat));
			let beatsLeftOver = this.beatCounter % defaultBeatsInBar;
			if (beatsLeftOver > 0) {
				let makeUpBeats = defaultBeatsInBar - beatsLeftOver;
				for (let i = 0; i < makeUpBeats; i++) {
					partsInSequence[partIndex][voiceIndex].melody.push([null, this.defaultBeat]);
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
				const transposePitch = getTranspose(this.comp.transpose, voiceParams.transpose);

				let melody;
				if (voiceParams.hasOwnProperty("liveLoopIndex")) {
					melody = voiceParams.melody;
				} else if (harmony === 0) {
					melody = getMelody(voiceParams.melody, this.comp.tonic, transposePitch, this.comp.scale);
				} else {
					// if live loop, melody is already transposed
					melody = getHarmony(voiceParams.melody, this.comp.tonic, transposePitch, harmony, this.comp.scale, this.comp.useOctave, this.comp.harmonyScaleOnly);
				}

				const toneInstrument = this.instruments.get(voiceParams.instrument, { ...voiceParams, volume: this.config.volume }, this.recorder);
				this.voices.push({ ...voiceParams, melody, toneInstrument, });

				// fuck for live this doesn't work ... ignore counterpoint for now ... 
				if (voiceParams.counterpoint) {
					const mel = getMelody(voiceParams.melody, this.comp.tonic, transposePitch, this.comp.scale);
					const counterpoint = getCounterpoint(mel, transposePitch, this.comp.scale);
					const counterInstrument = this.instruments.get(voiceParams.instrument, { ...voiceParams, volume: this.config.volume }, this.recorder);
					if (voiceParams.hasOwnProperty("liveLoopIndex")) {
						delete voiceParams.liveLoopIndex;
					}
					this.voices.push({ ...voiceParams, melody: counterpoint, toneInstrument: counterInstrument });
				}
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

		this.mods.scale.update();
		let scaleMod = this.mods.scale.get();
		if (chance(scaleMod.chance)) {
			this.shiftScale(Math.round(scaleMod.index), scaleMod.step);
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
		clone.count = 0;
		return clone;
	}

	updateLive(newLoopControls) {

		if (newLoopControls) this.loopControls = newLoopControls;

		// reset start loops
		this.startLoops = [];

		// assign voices to loops
		for (let i = 0; i < this.loopControls.length; i++) {
			if (this.loopControls[i] === 1) {
				let isLoopFound = false;
				for (let j = 0; j < this.voices.length; j++) {
					if (this.voices[j].liveLoopIndex === i) {
						this.startLoops.push(cloneVoice(this.voices[j]));
						isLoopFound = true;
					}
				}
				if (!isLoopFound) {
					for (let j = 0; j < this.voices.length; j++) {
						if (isLoopFound) continue;
						if (this.voices[j].hasOwnProperty('liveLoopIndex')) continue;
						let v = cloneVoice(this.voices[j]);
						v.liveLoopIndex = i;
						this.startLoops.push(v);
						isLoopFound = true;
					}
				}
			}
		}

		// add new loops if needed
		// doesn't totally make sense because if length is greater voiceCountOverride doesn't matter ... 
		let voiceCount = this.loopControls.filter(c => c > 0).length;
		if (voiceCount > this.startLoops.length) {
			this.voiceCountOverride = voiceCount;
		} else {
			this.voiceCountOverride = 0;
		}

		if (voiceCount === 0) {
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
		this.comp.bpm += bmp
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
				voice.count = 0;
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
		if (!this.config.autoLoad && !this.instruments.loaded) return loadTone();
		if (this.instruments.loaded) {
			this.config.playOnStart = true;
			return;
		}
		this.isPlaying = true;
		
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

	playNext() {
		// with waitForModTrigger
		if (this.config.isPerformance) {
			this.getPerformanceLoop();
		} else {
			this.generateLoop();
		}
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