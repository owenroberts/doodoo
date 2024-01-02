/*
	new doodoo greg paradigm
	expose properties, add mutators to them
	start with simple playback and add to it

	note is beat + pitch
*/

function NewDoo(params, callback) {

	let defaultBeat = params.beat ?? '4n'; // smallest unit of time
	let tonic = typeof params.tonic === 'string' ?
		params.tonic :
		MIDI_NOTES[params.tonic];
	let transpose = params.transpose ?? tonic; // tranpose key -- because melody is relative to tonic
	let useOctave = params.useOctave ?? false; // in transposition, continue through to octave vs looping around to begging of octave
	let scale = params.scale ?? [0, 2, 4, 5, 7, 9, 11]; // major default
	let sequence = params.sequence ?? [[true]]; // part matrix, [play count [part count]]
	let instruments = params.instruments;
	let stacking = params.stacking ?? [];
	let volume = params.volume ?? 0;
	let autoLoad = params.autoLoad ?? true;
	let autoStart = params.autoStart ?? true;
	let playOnStart = false; // if trying to play before loaded
	let usesSamples = false; // [...instruments, ...stacking.flatMap(v => v)].some(v => !v.includes('Synth'));
	let useMeter = params.useMeter ?? false;
	let setMeter = params.setMeter ?? false;
	let useMetro = params.useMetro ?? false;
	let withRecording = params.withRecording ?? false;
	let withCount = params.withCount ?? false;
	let onLoop = params.onLoop ?? false;
	
	let useDefaultProps = params.useDefaultProps ?? true;
	const props = params.props ? structuredClone(params.props) : {};
	for (const prop in DoodooProps.props) {
		if (props.hasOwnProperty(prop)) continue;
		props[prop] = useDefaultProps ? structuredClone(DoodooProps.props[prop]) : {};
	}

	// console.log('new doo props', useDefaultProps, props);

	let sequenceIndex = 0; // previously currentPart
	let totalPlays = 0; // track total plays of comp
	let mutationCount = 0; // num mutations --> different from total plays? -- idts

	let isPlaying = false;
	let toneLoop; // main loop, created in start and keeps time

	let parts = [];
	let loops = []; // list of generated loops (more like parts), need name for this!!!! tracks?
	let playTotalBeats = 0;
	let playBeatCount = 0;
	let def = {}; // set up later
	let effects = new Effects(def);
	let fxToDispose = [];
	let meter;
	let recorder;

	// for now, treat parts as having the same format, determined by composer app
	// later, module to convert old versions if necessary
	// [ comp [ part [ beat 'C4', '4n'], ['A4', '4n']]]
	for (let i = 0; i < params.parts.length; i++) {
		const part = params.parts[i];
		const beats = part.map(p => parseInt(p[1]));
		defaultBeat = Math.max(...beats) + 'n';  
		parts.push(new NewPart(part, props, defaultBeat, debug));
	}

	if (withRecording) {
		recorder = new Tone.Recorder();
		if (!withCount) withCount = +prompt('Record number of mutations?', 10);
	}

	
	if (autoLoad) loadTone();

	// start tone using async func to wait for tone
	async function loadTone() {
		try {
			await Tone.start();
			if (usesSamples) load(start); // only load if using samples
			else start();
		} catch(err) {
			console.error('load tone error', err);
		}
	}

	// start playback
	function start() {
		if (callback) callback();
		toneLoop = new Tone.Loop(playLoops, defaultBeat);
		Tone.Transport.start();
		if (params.bpm) Tone.Transport.bpm.value = params.bpm;
		toneLoop.start(Tone.Transport.seconds);

		if (useMeter) {
			meter = new Tone.Meter({ channels: 2 });
			Tone.Destination.connect(meter);
			params.setMeter(meter)
		}
		
		if (autoStart || playOnStart) generateLoops();
		
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

	function playLoops(time) {
		if (useMetro) metro.triggerAttackRelease('C4', '4n', time, 0.1);
		for (let i = 0; i < loops.length; i++) {
			const loop = loops[i];
			if (loop.count > loop.countEnd) continue;
			for (let j = 0; j < loop.beatCount; j++) {
				if (loop.count % 1 !== 0) continue;
				const noteIndex = Math.floor(loop.count) % loop.melody.length;
				const note = loop.melody[noteIndex];
				if (note[0] !== null) {
					const [pitch, beat] = note;
					loop.instrument.triggerAttackRelease(pitch, beat, time, 1);
				}
			}
			
			loop.count += 1; // loop.counter;
		}

		playBeatCount++;
		if (playBeatCount === playTotalBeats) generateLoops();
	}

	// generate next play through
	function generateLoops() {
		playBeatCount = 0;
		disposePrevious();
		loops = [];
		
		let currentParts = parts.filter((p, i) => sequence[i][sequenceIndex]);

		for (let i = 0; i < currentParts.length; i++) {
			const partLoops = currentParts[i].get(); // voices in part, or tracks?
			for (let j = 0; j < partLoops.length; j++) {
				const loopParams = partLoops[j];
				let instrument = loopParams.instrument ?? random(instruments);
				if (stacking[j]) {
					if (stacking[j].length > 0) {
						instrument = random(stacking[j]);
					}
				}

				// const v = volume + (loopies.length * -3); // lower volume of multiple loops
				const loop = {
					...loopParams,
					melody: loopParams.harmony === 0 ? 
						getMelody(loopParams.melody, tonic, transpose) :
						getHarmony(loopParams.melody, tonic, transpose, loopParams.harmony, scale, useOctave),
					instrument: getInstrument(instrument, { ...loopParams, volume: volume })
				};
				loops.push(loop);
			}
		}
	
		playTotalBeats = Math.max(0, Math.max(...loops.map(l => l.melody.length)));

		const smallestBeat = Math.max(...loops.flatMap(loop => loop.melody.map(b => b[1].slice(0, -1))));
		toneLoop.interval = smallestBeat + 'n';
		
		// let mutationCount = currentParts.map(part => part.update())[0];
		// console.log('total plays', totalPlays);
		currentParts.forEach(part => { part.update(totalPlays); });
		if (params.onMutate) params.onMutate(totalPlays);
		
		// move to next index in sequence (if more than one)
		sequenceIndex++;
		if (sequenceIndex >= sequence[0].length) sequenceIndex = 0;
		
		totalPlays++;
		
		if (Tone.Transport.state === 'stopped') Tone.Transport.start();

		if (withCount) {
			if (totalPlays > withCount * sequence[0].length) {
				Tone.Transport.stop();
				isPlaying = false;
				if (recorder) saveRecording();
			}
		}

		if (onLoop) onLoop(totalPlays, mutationCount);
	}

	function getInstrument(instrument, voiceParams) {
		const i = instrument.includes('Synth') ?
			getSynth(voiceParams) :
			getSampler(instrument, voiceParams);

		if (withRecording) i.chain(Tone.Destination, recorder);
		else i.toDestination();

		effects.get(totalPlays, instrument).forEach(f => {
			if (withRecording) f.chain(Tone.Destination, recorder);
			else f.toDestination();
			i.connect(f);
			fxToDispose.push(f);
		});

		return i;
	}

	function getSynth(voiceParams) {
		const fmSynth = new Tone.FMSynth({ 
			volume: voiceParams.volume || -6,
			envelope: {
				// attack: voiceParams.voiceAttack,
				// attackCurve: voiceParams.voiceCurve,
				// release: voiceParams.voiceRelease,
				// releaseCurve: voiceParams.voiceCurve, // this one maybe take out ...
			}
		});
		return fmSynth;
	}

	function getSampler(instrument, voiceParams) {
		const sampleFiles = getSampleFiles(instrument);
		// const attack = ['toms'].includes(voice) ?
		// 	voiceParams.voiceAttack / 4 :
		// 	voiceParams.voiceAttack;
		
		const sampler = new Tone.Sampler({
			urls: sampleFiles,
			volume: voiceParams.volume || 0,
			// attack: attack,
			// release: voiceParams.voiceRelease,
			// curve: voiceParams.voiceCurve,
		});
		return sampler;
	}

	function getSampleFiles(instrument) {
		const sampleFiles = {};
		// just make choir aeiou choices, randomize with stacking ... ?? 
		if (instrument === 'choir') {
			const letter = totalPlays < 3 ? 'U' : random('AEIOU'.split(''));
			for (const note in SamplePaths[instrument+letter]) {
				sampleFiles[note] = samples.get(`${instrument}-${letter}-${note}`);
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
		for (let i = 0; i < loops.length; i++) {
			disposeMe.push(loops[i].instrument);
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
				disposeMe[i].dispose(); // way to calculate this??
			}, 1000);
		}

		loops = [];
		fxToDispose = [];
	}

	function play() {
		if (!autoLoad) return loadTone();
		if (usesSamples && !samplesLoaded) {
			playOnStart = true;
			return;
		}
		generateLoops();
		toneLoop.start(Tone.Transport.seconds);
		isPlaying = true;
		if (withRecording) recorder.start();
	}

	function stop() {
		Tone.Transport.stop();
		toneLoop.stop();
		isPlaying = false;
		if (withRecording && recorder.state === 'started') saveRecording();
	}

	return {
		play, stop,
		getLoops: () => { return loops; }
	}
}

window.NewDoo = NewDoo;