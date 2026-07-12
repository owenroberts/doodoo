import * as Tone from 'tone';
import { random, assert } from '@b/cool';
import { SamplePaths } from './sample-paths.js';
import { getFX } from './fx.js';

/**
 * loads samples and provides instruments
 */
export class Instruments {

	constructor(params) {
		this.samples = {};
		this.isLoaded = false;
		this.samplesURL = params.samplesURL;
		// this.withRecording = params.withRecording ?? false;
		this.toDispose = [];
		this.loadList = [];
	}

	load(callback) {

		if (this.isLoaded) {
			return callback();
		}

		if (this.loadList.length === 0) {
			this.isLoaded = true;
			return callback();
		}

		const urls = {};
		for (let i = 0; i < this.loadList.length; i++) {
			const instrument = this.loadList[i];
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
		console.time(`load ${this.loadList.join(', ')}`);
		this.samples = new Tone.ToneAudioBuffers({
			urls,
			baseUrl: this.samplesURL || '../samples/',
			onload: () => {
				console.timeEnd(`load ${this.loadList.join(', ')}`);
				if (callback) callback();
				this.isLoaded = true;
			},
			onerror: error => { console.error(error); },
		});
	}

	get(instrument, voiceParams, recorder) {
		const i = instrument.includes('Synth') ?
			this.getSynth(voiceParams) :
			this.getSampler(instrument, voiceParams);

		if (recorder) i.chain(Tone.Destination, recorder);
		else i.toDestination();

		for (const fxName in voiceParams.fx) {
			const f = getFX(fxName, voiceParams.fx[fxName]);
			if (recorder) f.chain(Tone.Destination, recorder);
			else f.toDestination();
			i.connect(f);
			this.toDispose.push(f);
		}
		this.toDispose.push(i);
		return i;
	}

	getSynth(voiceParams) {
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
		return fmSynth;
	}

	getSampler(instrument, voiceParams) {
		const sampleFiles = this.getSampleFiles(instrument);
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

	getSampleFiles(instrument) {
		const sampleFiles = {};
		// just make choir aeiou choices, randomize with stacking ... ?? 
		if (instrument.includes('choir')) {
			const letter = instrument.charAt(5) ?
				instrument.charAt(5) :
				random('AEIOU'.split(''));
			for (const note in SamplePaths['choir' + letter]) {
				sampleFiles[note] = this.samples.get(`choir-${letter}-${note}`);
			}
		} else {
			for (const note in SamplePaths[instrument]) {
				sampleFiles[note] = this.samples.get(`${instrument}-${note}`);
			}
		}
		return sampleFiles;
	}

	dispose() {
		
		const disposeMe = [];

		// don't remember why this works but it does error otherwise		
		for (let i = 0; i < this.toDispose.length; i++) {
			disposeMe.push(this.toDispose[i]);
		}

		for (let i = 0; i < disposeMe.length; i++) {
			const d = disposeMe[i];
			setTimeout(() => {
				disposeMe[i].dispose(); // way to calculate this??
			}, 2000);
		}

		this.toDispose = [];
	}
}