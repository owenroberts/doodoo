/*
	new doodoo greg paradigm
	expose properties, add mutators to them
	start with simple playback and add to it

	note is beat + pitch
*/

function Doodoo(params, callback) {

	let defaultBeat = '4n'; // smallest unit of time
	let tonic = typeof params.tonic === 'string' ?
		params.tonic :
		MIDI_NOTES[params.tonic];
	let transpose = params.transpose ?? tonic; // tranpose key -- because melody is relative to tonic
	let useOctave = params.useOctave ?? false; // in transposition, continue through to octave vs looping around to begging of octave
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
	let useMetro = params.useMetro ?? false;
	let withRecording = params.withRecording ?? false;
	let withCount = params.withCount ?? false;
	let onLoop = params.onLoop ?? false;
	let onNote = params.onNote ?? false;
	let noMods = params.noMods ?? false;
	
	let useDefaultProps = params.useDefaultProps ?? true;
	const props = params.mods ? structuredClone(params.mods) : {};
	for (const prop in DoodooProps.props) {
		if (props.hasOwnProperty(prop)) continue;
		props[prop] = useDefaultProps ? structuredClone(DoodooProps.props[prop]) : {};
	}

	// console.log('new doo props', useDefaultProps, props);

	let samples; // holds the samples
	// look for samples in props.instruments stack
	let loadInstruments = [...new Set([
		...props.instruments.stack
			.flatMap(e => e.list)
			.filter(i => !i.includes('Synth')),
		...params.partMods.flatMap(m => m.instruments.stack)
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
	let loops = []; // list of generated loops (more like parts), need name for this!!!! tracks?
	let totalBeats = 0;
	let beatCount = 0;
	let effects = new Effects();
	let fxToDispose = [];
	let meter;
	let recorder;
	let metro;

	// have to get default beat before going through the parts ...
	params.parts.forEach(part => {
		part.forEach(note => {
			if (parseInt(note[1]) > parseInt(defaultBeat)) defaultBeat = note[1];
		});
	});

	props.beatList.list.forEach(beat => {
		if (beat > parseInt(defaultBeat)) defaultBeat = beat + 'n';
	});

	// for now, treat parts as having the same format, determined by composer app
	// later, module to convert old versions if necessary
	// [ comp [ part [ beat 'C4', '4n'], ['A4', '4n']]]
	const comp = { tonic, transpose, scale, useOctave }; // need comp values for mods
	for (let i = 0; i < params.parts.length; i++) {
		let partProps;
		if (params?.partMods[i]) {
			partProps = { ...props, ...params.partMods[i] };
		} else {
			partProps = { ...props };
		}
		parts.push(new Part(params.parts[i], partProps, defaultBeat, comp, debug));
	}

	if (withRecording) {
		recorder = new Tone.Recorder();
		if (!withCount) withCount = +prompt('Record number of modulations?', 10);
	}

	if (autoLoad) loadTone();

	// start tone using async func to wait for tone
	async function loadTone() {
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
			}
		});
	}

	function start() {
		if (callback) callback();
		toneLoop = new Tone.Loop(playLoops, defaultBeat);
		Tone.Transport.start();
		if (params.bpm) Tone.Transport.bpm.value = params.bpm;
		toneLoop.start(Tone.Transport.seconds);

		// master ing
		var compressor = new Tone.Compressor({
			"threshold": -30,
			"ratio": 3,
			"attack": 0.5,
			"release": 0.1
		});
		const limiter = new Tone.Limiter(-20);
		Tone.Master.chain(compressor, limiter);
		// Tone.Master.chain(compressor);


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
			if (loop.count % 1 !== 0) continue;
			const noteIndex = Math.floor(loop.count) % loop.melody.length;
			const note = loop.melody[noteIndex];
			if (note[0] !== null && note[0] !== 'rest') {
				let [pitch, beat, velocity] = note;
				if (loop.playBeat !== 'def') beat = loop.playBeat + 'n';
				if (!velocity) velocity = 1;
				if (loop.double) {
					// still weird w fmSynth idky
					beat = parseInt(beat) * 2 + 'n';
					let t = Tone.Time(beat).toSeconds();
					loop.instrument.triggerAttackRelease(pitch, beat, time, velocity);
					loop.instrument.triggerAttackRelease(pitch, beat, time + t, velocity);
				} else {
					loop.instrument.triggerAttackRelease(pitch, beat, time, velocity);
				}

			}
			if (onNote) onNote({ loopIndex: i, note: note, });
			loop.count += 1; // loop.counter;
		}

		beatCount++;
		if (beatCount === totalBeats) generateLoops();
	}

	function generateLoops() {
		beatCount = 0;
		disposePrevious();
		loops = [];

		// let currentParts = parts.filter((p, i) => sequence[i][sequenceIndex]);

		let currentParts = [];
		let longestMelody = 0;
		for (let i = 0; i < parts.length; i++) {
			if (sequence[i][sequenceIndex]) {
				const partCount = parts[i].getCount();
				let startIndex = 0;
				for (let j = 0; j < startLoops.length; j++) {
					if (partCount < startIndex + startLoops[j].counts) {
						startIndex = j;
						break;
					} else {
						startIndex += startLoops[j].counts;
					}
				}
				const starts = startIndex < startLoops.length ? startLoops[startIndex].loops : {};
				const loops = parts[i].get(starts);
				loops.forEach(l => {
					if (l.melody.length > longestMelody) longestMelody = l.melody.length;
				});
				currentParts.push(loops);
			}
		}


		// make parts match length ... 
		for (let i = 0; i < currentParts.length; i++) {
			const loops = currentParts[i];
			for (let j = 0; j < loops.length; j++) {
				const loop = loops[j];
				// console.log(i, j, 'loop 1', loop.countEnd);
				const ratio = Math.floor(longestMelody / loop.melody.length);
				const clone = structuredClone(loop.melody);
				for (let k = 1; k < ratio; k++) {
					const copy = structuredClone(clone);
					loop.melody = loop.melody.concat(copy);
				}
				loop.countEnd = loop.melody.length - 1;
				// console.log(i, j, 'loop 2', loop.countEnd);
			}
		}

		for (let i = 0; i < currentParts.length; i++) {
			let partLoops = currentParts[i];
			for (let j = 0; j < partLoops.length; j++) {

				const loopParams = partLoops[j];

				// const v = volume + (loopies.length * -3); // lower volume of multiple loops
				const loop = {
					...loopParams,
					melody: loopParams.harmony === 0 ? 
						getMelody(loopParams.melody, tonic, transpose, scale) :
						getHarmony(loopParams.melody, tonic, transpose, loopParams.harmony, scale, useOctave),
					instrument: getInstrument(loopParams.instrument, { ...loopParams, volume: volume }),
				};
				loops.push(loop);
			}
		}
	
		totalBeats = Math.max(0, Math.max(...loops.map(l => l.melody.length)));

		const smallestBeat = Math.max(...loops.flatMap(loop => loop.melody.map(b => parseInt(b[1]))));
		toneLoop.interval = smallestBeat + 'n';
		
		if (!noMods) {
			for (let i = 0; i < parts.length; i++) {
				if (sequence[i][sequenceIndex]) parts[i].update();
			}
			if (params.onModulate) params.onModulate(totalPlays);
		}
		
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

		if (onLoop) onLoop(totalPlays);
	}

	function getInstrument(instrument, loopParams) {
		const i = instrument.includes('Synth') ?
			getSynth(loopParams) :
			getSampler(instrument, loopParams);

		if (withRecording) i.chain(Tone.Destination, recorder);
		else i.toDestination();

		for (const fxName in loopParams.fx) {
			const f = effects.get(fxName, loopParams.fx[fxName]);
			if (withRecording) f.chain(Tone.Destination, recorder);
			else f.toDestination();
			i.connect(f);
			fxToDispose.push(f);
		}
		return i;
	}

	function getSynth(loopParams) {
		// console.log('synth params', loopParams);
		const fmSynth = new Tone.FMSynth({ 
			volume: loopParams.volume ?? -6,
			envelope: {
				attack: Math.max(0.1, loopParams.attack),
				attackCurve: loopParams.curve,
				release: loopParams.release,
				// releaseCurve: loopParams.curve, // leave on default exponential ...
				// sustain: 0,
			}
		});
		// console.log(fmSynth.envelope);
		return fmSynth;
	}

	function getSampler(instrument, loopParams) {
		const sampleFiles = getSampleFiles(instrument);
		const sampler = new Tone.Sampler({
			urls: sampleFiles,
			volume: loopParams.volume ?? 0,
			attack: loopParams.attack,
			release: loopParams.release,
			curve: loopParams.curve,
		});
		sampler.instrument = instrument;
		return sampler;
	}

	function getSampleFiles(instrument) {
		const sampleFiles = {};
		// just make choir aeiou choices, randomize with stacking ... ?? 
		if (instrument === 'choir') {
			const letter = random('AEIOU'.split(''));
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
				// console.log('dispose me', disposeMe[i].volume.value);
				disposeMe[i].dispose(); // way to calculate this??
			}, 2000);
		}

		loops = [];
		fxToDispose = [];
	}

	async function saveRecording() {
		const recording = await recorder.stop();
		const url = URL.createObjectURL(recording);
		const anchor = document.createElement("a");
		const audioName = prompt('Name clip', params.title || "Doodoo_" + new Date().toDateString().replace(/ /g, '-'));
		anchor.download = audioName + ".webm";
		anchor.href = url;
		anchor.click();
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

	function modulate() {
		totalPlays++;
		parts.forEach(part => { part.update(); });
	}

	// better name
	function isRecording() {
		if (!recorder) return false;
		return recorder.state === 'started' || recorder.state === 'paused';
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
		play, stop, isRecording, modulate,
		getLoops: () => { return loops; },
		getStatusIsPlaying: () => { return isPlaying; },
		printLoops: () => { console.log('loops', loops); }, // debug
		printParams: () => { console.log(parts.map(p => p.getParams())); }, // debug
	}
}

window.Doodoo = Doodoo;

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
