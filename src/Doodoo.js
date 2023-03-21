/*
	main doodoo module
	loads samples
	sets default params
	play back loop
	record
	add fx
	etc
*/

function Doodoo(params, callback) {
	
	let debug = params.debug;
	let isPlaying = false;
	let defaultDuration = params.duration || '4n';
	let scale = params.scale || [0, 2, 4, 5, 7, 9, 11]; // major
	let autoStart = params.autoStart !== undefined ? params.autoStart : true;
	let autoLoad = params.autoLoad !== undefined ? params.autoStart : true;
	let useOctave = params.useOctave || false;
	
	let samples;
	let voices = params.voices || [params.samples]; // fix for old data
	if (params.controls) {
		if (params.controls.voiceList) {
			params.controls.voiceList
				.filter(v => !voices.includes(v))
				.forEach(v => { 
					if (v) voices.push(v);
				});
		}
		let startVoices = params.controls.startLoops.flatMap(c => c.flatMap(l => l.voice)).filter(v => !voices.includes(v));
		if (startVoices.length > 0) {
			startVoices.forEach(v => {
				if (v) voices.push(v);
			});
		};
	}
	
	if (voices.length === 0) voices.push('FMSynth');

	let withRecording = params.withRecording;
	let recorder;
	let withCount = params.withCount;

	if (withRecording) {
		recorder = new Tone.Recorder();
		if (!withCount) withCount = +prompt('Record number of mutations?', 10);
	}
	
	let tonic = typeof params.tonic === 'string' ?
		params.tonic :
		MIDI_NOTES[params.tonic];

	if (!params.transform) params.transform = params.tonic;
	let transform = typeof params.transform === 'string' ?
		params.transform :
		MIDI_NOTES[params.transform];

	let def = { ...defaults, ...params.controls }; // defaults
	// console.log('defaults', def);
	let effects = new Effects(def);

	/*
		parts data struture is currently convoluted
		all compositions have one part so far -- but idea of multiple parts is cool
		some parts are just notes with no durations ['C4', 'C4', 'A4'] etc
		some parts are array of arrays [['C4', '4n'], ['A4', '4n']], these go inside another array which is the "part"

		for now use just [] and [[]] figure out [[[]]] later
	*/

	let parts = [];
	if (typeof params.parts[0] === 'string') {
		const melody = params.parts.map(n => [n, defaultDuration]);
		parts.push(new Part(melody, def, defaultDuration, debug));
	} else if (typeof params.parts[0] === 'number') {
		const melody = params.parts.map(n => [MIDI_NOTES[n], defaultDuration]);
		parts.push(new Part(melody, def, defaultDuration, debug));
	} else if (Array.isArray(params.parts[0])) {
		if (Array.isArray(params.parts[0][0])) {
			for (let i = 0; i < params.parts.length; i++) {
				const melody = params.parts[i];
				parts.push(new Part(melody, def, defaultDuration, debug));
				const durations = params.parts[i].map(p => parseInt(p[1]));
				defaultDuration = Math.max(...durations) + 'n';
			}
		} else {
			const melody = params.parts;
			parts.push(new Part(melody, def, defaultDuration, debug));

			const durations = params.parts.map(p => parseInt(p[1]));
			defaultDuration = Math.max(...durations) + 'n';
		}
	}	

	let currentPart = 0;
	let totalPlays = 0;
	let simultaneous = params.simultaneous || false;

	let toneLoop;
	let loops = [];
	let currentCountTotal = 0;
	let currentCount = 0;

	const useMetro = params.useMetro;
	let metro;

	let usesSamples = voices.some(v => !v.includes('Synth'));
	let samplesLoaded = false;
	let playOnStart = false; // if trying to play before loaded
	if (autoLoad) loadTone();

	// start tone using async func to wait for tone
	async function loadTone() {
		try {
			await Tone.start();
			// only load if using samples
			if (usesSamples) load(start);
			else start();
		} catch(err) {
			console.error('load tone error', err);
		}
	}

	function start() {
		if (callback) callback();
		toneLoop = new Tone.Loop(loop, defaultDuration);
		Tone.Transport.start();
		if (params.bpm) Tone.Transport.bpm.value = params.bpm;
		toneLoop.start(Tone.Transport.seconds);
		if (autoStart || playOnStart) playTheme();
		
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
						getHarmony(params.melody, tonic, transform, params.harmony, scale, useOctave),
					voice: getVoice(params.voice || random(voices), params)
				};
				loops.push(part);
			});
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

		if (withCount) {
			if (mutationCount > withCount) {
				Tone.Transport.stop();
				isPlaying = false;
				if (recorder) saveRecording();
			}
		}
	}

	function loop(time) {
		if (useMetro) metro.triggerAttackRelease('C4', '4n', time, 0.1);	
		for (let i = 0; i < loops.length; i++) {
			const loop = loops[i];
			const attackStep = new ValueWalker(...def.attackStep);
			attackStep.set(loop.attack);
			if (loop.count > loop.countEnd) continue;
			for (let j = 0; j < loop.beatCount; j++) {
				if (loop.count < loop.startDelay) continue;
				if (loop.count % 1 !== 0 && !loop.doubler) continue;
				if (chance(loop.restChance)) continue;
				const beat = loop.melody[Math.floor(loop.count - loop.startDelay + loop.startIndex) % loop.melody.length];
				if (beat[0] !== null) {
					const [note, duration] = beat;
					// time offset for doubles
					let t = j * Tone.Time(`${+duration.slice(0, -1) * 2}n`).toSeconds();
					loop.voice.triggerAttackRelease(note, duration, time + t, attackStep.get());
				}
			}
			
			loop.count += 1; // loop.counter;
			attackStep.update();
		}

		currentCount++;
		if (currentCount === currentCountTotal) playTheme();
	}

	function getVoice(voice, params) {
		const v = voice.includes('Synth') ?
			getSynth(params) :
			getSampler(voice, params);
		
		if (withRecording) v.chain(Tone.Destination, recorder);
		else v.toDestination();

		effects.get(totalPlays).forEach(f => {
			if (withRecording) f.chain(Tone.Destination, recorder);
			else f.toDestination();
			v.connect(f);
		});

		return v;
	}

	function getSynth(params) {
		const fmSynth = new Tone.FMSynth({ 
			volume: params.volume || 0,
			envelope: {
				attack: params.voiceAttack,
				attackCurve: params.voiceAttackCurve,
			}
		});
		return fmSynth;
	}

	function getSampler(voice, params) {
		const sampleFiles = getSampleFiles(voice);
		const attack = ['toms'].includes(voice) ?
			params.voiceAttack / 4 :
			params.voiceAttack;
		
		console.log(voice, params.voiceAttack, attack);

		const sampler = new Tone.Sampler({
			urls: sampleFiles,
			volume: params.volume || 0,
			release: 1,
			// attack: attack,
			// curve: params.voiceAttackCurve,
		});
		console.log(sampler.attack, sampler.release);
		return sampler;
	}

	function getSampleFiles(voice) {
		console.log(voice);
		const sampleFiles = {};
		if (voice === 'choir') {
			const letter = totalPlays < 3 ? 'U' : random('AEIOU'.split(''));
			for (const note in SamplePaths[voice+letter]) {
				sampleFiles[note] = samples.get(`${voice}-${letter}-${note}`);
			}
		} else {
			for (const note in SamplePaths[voice]) {
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
					const voiceSampleURLS = SamplePaths['choir'+letter];
					for (const note in voiceSampleURLS) {
						urls[`${voice}-${letter}-${note}`] = `${voice}/${letter}/${voiceSampleURLS[note]}`;
					}
				});
			} else {
				for (const note in SamplePaths[voice]) {
					urls[`${voice}-${note}`] = `${voice}/${SamplePaths[voice][note]}`;
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
			baseUrl: params.samplesURL || '../samples/',
			onload: () => {
				console.timeEnd(`load ${voices.join(', ')}`);
				if (callback) callback();
				samplesLoaded = true;
			}
		});
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
		let n = MIDI_NOTES.indexOf(transform) + dir;
		transform = MIDI_NOTES[n];
	}

	function setTonic(note) {
		transform = note;
	}

	function printLoops() {
		console.log('loops', loops); // debug
	}

	function printParams() {
		console.log(parts.map(p => p.getParams()));
	}

	function getLoops() {
		return loops;
	}

	function moveBPM(n) {
		let b = Tone.Transport.bpm.value;
		Tone.Transport.bpm.value = b + n;
	}

	function setBPM(bpm) {
		Tone.Transport.bpm.value = bpm; // starts 128
	}

	function getIsPlaying() {
		return isPlaying;
	}

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
		playTheme();
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

	function mutate() {
		parts.forEach(part => {
			part.update();
		});
	}

	return { play, stop, mutate, moveTonic, setTonic, moveBPM, setBPM, getIsPlaying, isRecording, printLoops, getLoops, printParams };
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

