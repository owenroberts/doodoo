// https://www.guitarland.com/MusicTheoryWithToneJS/PlayMajorScale.html
// http://www.myriad-online.com/resources/docs/manual/english/gregorien.htm

// https://en.wikibooks.org/wiki/IB_Music/Music_History/Medieval_Period#:~:text=The%20Gregorian%20chant%20began%20to,independently%20of%20the%20original%20chant.
/*
	The Gregorian chant began to evolve around 700. From 700 - 900, composers would write a line in parallel motion to the chant at a fixed interval of a fifth or a fourth above the original line. This technique evolved further from 900 - 1200. During this period, the upper line moved independently of the original chant. After 1100, upper lines even began gaining rhythmic independence.
*/

// https://github.com/saebekassebil/teoria

	

function Sound(intervals, tonic, _scale) {

	const scale = _scale || [0, 2, 4, 5, 7, 9, 11]; // major

	var MIDI_NUM_NAMES = [
		"C_1", "C#_1", "D_1", "D#_1", "E_1", "F_1", "F#_1", "G_1", "G#_1", "A_1", "A#_1", "B_1",
		"C0", "C#0", "D0", "D#0", "E0", "F0", "F#0", "G0", "G#0", "A0", "A#0", "B0",
		"C1", "C#1", "D1", "D#1", "E1", "F1", "F#1", "G1", "G#1", "A1", "A#1", "B1",
		"C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2",
		"C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
		"C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
		"C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
		"C6", "C#6", "D6", "D#6", "E6", "F6", "F#6", "G6", "G#6", "A6", "A#6", "B6",
		"C7", "C#7", "D7", "D#7", "E7", "F7", "F#7", "G7", "G#7", "A7", "A#7", "B7",
		"C8", "C#8", "D8", "D#8", "E8", "F8", "F#8", "G8", "G#8", "A8", "A#8", "B8",
		"C9", "C#9", "D9", "D#9", "E9", "F9", "F#9", "G9"];

	// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
	function shuffle(array) {
		let currentIndex = array.length, temporaryValue, randomIndex;
		while (0 !== currentIndex) {
		  randomIndex = Math.floor(Math.random() * currentIndex);
		  currentIndex -= 1;
		  temporaryValue = array[currentIndex];
		  array[currentIndex] = array[randomIndex];
		  array[randomIndex] = temporaryValue;
		}
		return array;
	}

	function chance(n) {
		return Cool.random(1) < n;
	}

	class Range {
		constructor(min, max) {
			this.min = min;
			this.max = max;
		}

		get range() {
			return [this.min, this.max];
		}
	}

	let noteNames = [];
	let choirSamples;
	let loops = [];

	let mutations = 0;
	let lastGameLevel = 0; // change tonic based on game level
	
	let loopNum = new Range(1, 1);  // starts at 1
	let startIndex = new Range(0, 0);

	let lens = [1];

	let durs = [1];
	let addDurs = [1, 4, 8];
	let durJumps = [1];
	let addDurJumps = [0.5, 2, 4, 0.25];

	let startDelays = [0, '1n', '2n', '4n', '8n', '1m', '2m'];
	let longDelays = ['3m', '4m'];
	
	let indexJump = new Range(0, 0);
	let attackStart = new Range(0.25, 0.7);
	let attackJump = new Range(-0.2, 0.2);
	let harmonyChoices = [4, 5];
	let addHarmonyChoices = shuffle([2, 3, 6, 7]);


	function mutate() {

		// change number of loops
		if (mutations == 0) {
			loopNum.max = 2; // after first play add a harmony
		} else {
			// its okay if they swap
			if (chance(0.05)) loopNum.min += 1;
			if (chance(0.1)) loopNum.max += 1;
		}

		let ch = 0.35;

		// random start index
		if (chance(ch) && mutations > 2 && startIndex.max < intervals.length) {
			startIndex.max++;
		}

		if (mutations > 3) {

			// add harmony parts
			if (chance(ch) && addHarmonyChoices.length > 0) {
				harmonyChoices.push(addHarmonyChoices.pop());
			}

			if (chance(ch)) {
				indexJump.min--;
				// maybe += chance(0.5) ? 1 : -1;
			}

			if (chance(ch)) {
				indexJump.max++;
			}

			if (chance(ch) && addDurs.length > 0) {
				durs.push(addDurs.pop());
			}

			if (chance(ch) && addDurJumps.length > 0) {
				durJumps.push(addDurJumps.pop());
			}

			if (chance(ch) && longDelays.length > 0) {
				startDelays.push(longDelays.pop());
			}

			if (chance(ch)) lens.push(Cool.random(lens) * Cool.random([0.25, 0.5, 1.5]));

			if (chance(ch)) {
				let index = Cool.random(intervals.length);
				let slice = intervals.slice(index, index + Cool.random(5));
				intervals.push(...slice);
				// console.log('intervals', intervals);
			}

			if (chance(0.5) && intervals.length > 4) intervals.shift();
		}

		mutations++;

		// console.log('mutations', mutations, 'tonic', tonic);
		// console.log('harmonies', harmonyChoices);
		// console.log('loopNum', loopNum);
		// console.log('startIndex', startIndex);
		// console.log('lens', lens);
	}

	function playTheme() {
		// Tone.Transport.bpm.value = 128;

		loops.forEach(loop => loop.stop());
		Tone.Transport.stop();

		// console.log('mutations num', mutations);
		let num = Cool.randomInt(...loopNum.range); // number of loops
		if (mutations == 1) num = 2; // harmony on second play through
		// how many loops is too many loops?
		let dur = Cool.random(durs); // start duration
		let len = Cool.random(lens);
		let idx = Cool.randomInt(...startIndex.range); // start index
		let delay = mutations == 0 ? 0 : Cool.random(startDelays);

		// console.log('num loops', num);
		loops.push(makeLoop(dur, len, idx, delay, getMelody(tonic))); 
		for (let i = 1; i < num; i++) {
			let mel = (chance(0.6) || num == 2) ?
				getHarmony(tonic, Cool.random(harmonyChoices)) :
				getMelody(tonic);

			idx = Cool.random([idx, idx + indexJump.min, idx - indexJump.max]);
			dur = dur * Cool.random(durJumps);
			if (mutations > 3) {
				delay = Cool.random([...startDelays, ...longDelays]);
				if (chance(0.1)) delay += 't';
				if (chance(0.25) && delay != 0) delay += '.';
			}
			len = Cool.random(lens);
			if (dur > 8) len *= 2;
			loops.push(makeLoop(dur, len, idx, delay, mel));
		}
		
		Tone.Transport.start('+0.1');
		mutate();
	}

	function makeLoop(dur, len, idx, delay, melody) {
		// console.log('loop length', melody.length * len, 'dur', `${dur}n`);
		const sampler = getSampler();
		let count = idx || 0;
		let attack = Cool.random(...attackStart.range);
		let counter = 1;
		let durPlay = dur;
		if (dur > 4 && dur < 32 && chance(0.25)) {
			counter = 1 / dur;
			durPlay /= 2;
		}
		const loop = new Tone.Loop((time) => {
			// console.log(count, attack, dur, len, idx, delay);
			if (chance(0.95)) { // 5% chance of rest
				const note = melody[Math.floor(count) % melody.length];
				sampler.triggerAttackRelease(note, `${durPlay}n`, undefined, attack);
			}
			attack += Cool.random(...attackJump.range);
			attack.clamp(0.1, 1);
			count += counter;
			if (count >= melody.length * len + idx) {
				loop.stop();
				if (loops.every(loop => { return loop.state == 'stopped'})) {
					playTheme();
				}
			}
		}, `${dur}n`).start(delay);
		return loop;
	}

	function getMelody(startNote) {
		let melody = [];
		for (let i = 0; i < intervals.length; i++) {
			if (intervals[i] !== null) {
				const note = startNote + intervals[i];
				melody.push(MIDI_NUM_NAMES[note]);
			} else {
				melody.push(null);
			}
		}
		// console.log(melody);
		return melody;
	}

	function getHarmony(startNote, interval) {
		interval -= 1; // offset
		let harmony = [];
		for (let i = 0; i < intervals.length; i++) {
			const int = intervals[i];
			if (int !== null) {

				// find where in the scale this note goes
				let index;
				let offset = Math.floor(Math.abs(int) / 12) * 12 * (int < 0 ? -1 : 1);
				
				if (int < 0) { // interval below tonic
					index = scale.indexOf(12 - (Math.abs(int) % 12));
				} else { // interval above tonic
					index = scale.indexOf(int % 12);
				}

				let harm = scale[(index + interval) % scale.length];
				const note = startNote + harm + offset;
				harmony.push(MIDI_NUM_NAMES[note]);
			} else {
				harmony.push(null);
			}
		}
		// console.log(harmony);
		return harmony;
	}

	function getSampler() {
		// const voice = 'U'; // 
		const voice = mutations < 3 ? 
			'U' :
			Cool.random('AEIOU'.split(''));
		const samples = {};
		for (let i = 0; i < noteNames.length; i++) {
			const note = noteNames[i];
			samples[note] = choirSamples.get(`${voice}-${note}`);
		}

		// samples = {
		// 	C4: choirSamples.get('C4');
		// 	A3: choirSamples.get(A3);
		// 	G3: choirSamples.get(G3);
		// 	'Eb4': choirSamples.get('Eb4');
		// };

		const sampler = new Tone.Sampler({
			urls: samples,
			volume: -6
		}).toDestination();

		// const freeverb = new Tone.Freeverb().toDestination();
		// freeverb.dampening = 2000;

		const reverb = new Tone.Reverb({ decay: 5 }).toDestination();
		sampler.connect(reverb);

		if (mutations > 8) {
			let effect;
			if (chance(0.25)) {
				const dist = Cool.random(0.05, 0.2);
				effect = new Tone.Distortion(dist).toDestination();
				// console.log('Distortion', dist);
			}
			else if (chance(0.25)) {
				effect = new Tone.Chorus(6, 2.5, 0.5);
				// console.log('Chorus')
			}
			else if (chance(0.25)) {
				const bits = Cool.random([4,8,12]);
				effect = new Tone.BitCrusher(bits).toDestination();
				// console.log('BitCrusher', bits);
			}
			else if (chance(0.25)) {
				const freq = Cool.random(0.5, 1);
				const depth = Cool.random(0.1, 1);
				effect = new Tone.Tremolo(freq, depth).toDestination();
				// console.log('Tremolo', freq, depth);
			}
			if (effect) sampler.connect(effect);
		}
		
		return sampler;
	}

	function setup(callback) {

		for (let i = 2; i <= 4; i++) {
			'ABCDEFG'.split('').forEach(letter => {
				noteNames.push(`${letter}${i}`);
			});
		}

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
			baseUrl: "./samples/choir/",
			onload: () => {
				console.timeEnd('load choir samples');
				callback();
			}
		});
	}

	this.setBPM = function(bpm) {
		Tone.Transport.bpm.value = bpm; // starts 128
	}

	this.play = function() {
		playTheme();
	};

	this.mutie = function() {
		mutate();
	};

	(async () => {
		await Tone.start();
		setup(playTheme);
	})();
}