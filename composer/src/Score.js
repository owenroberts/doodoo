/*
	display score from mutated doodoos ...
	display is very convoluted nonsense that i should document at some point ...
*/

function Score(app) {

	let panel;
	const canvas = document.createElement('canvas');
	let ctx;
	if (canvas.getContext('2d')) {
		ctx = canvas.getContext('2d');
	} else {
		return;
	}

	let defaultNoteWidth = 16;
	let margin = 10; // margin
	let padding = 8; // css padding
	let top = 20; // top
	let h = 12; // row height
	let h2 = 6;
	// let C4Index = 60; // middle c index ? 
	let C4Y = h * 6; // y value
	let noteIndexes = "CDEFGAB".split("");

	let sharps = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
	let flats = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
	let keys = {
		'G': 	['#', 1],
		'D': 	['#', 2],
		'A': 	['#', 3],
		'E': 	['#', 4],
		'B': 	['#', 5],
		'F#': 	['#', 6],
		'C#': 	['#', 7],
		'F': 	['b', 1],
		'Bb': 	['b', 2],
		'Eb': 	['b', 3],
		'Ab': 	['b', 4],
		'Db': 	['b', 5],
		'Gb': 	['b', 6],
		'Cb': 	['b', 7],
	};
	let minors = {
		'A': 	'C',
		'E': 	'G',
		'B': 	'D',
		'F#': 	'A',
		'C#': 	'E',
		'G#': 	'B',
		'Eb': 	'Gb',
		'D#': 	'F#',
		'Bb': 	'Db',
		'F': 	'Ab',
		'C': 	'Eb',
		'G': 	'Bb',
		'D': 	'F',
	};
	let trebleSigs = ['G', 'F', 'E', 'D', 'C', 'B', 'A'];
	// ♭, ♮, ♯

	let restCharacters = {
		'1n': '\u1D13B',
		'2n': '\u1D13C',
		'4n': '\u1D13D',
		'8n': '\u1D13E',
		'16n': '\u1D13F',
		'32n': '\u1D140',
	};

	// support unicode musical characters
	let notoFontLoaded = false;
	let notoFont = new FontFace(
		"Noto",
		"url(https://fonts.gstatic.com/s/notomusic/v14/pe0rMIiSN5pO63htf1sxEkW7I9tAcVwo.woff2)"
	);
	notoFont.load().then((font) => {
		document.fonts.add(font);
		console.log("Font loaded");
		notoFontLoaded = true;
	});

	function line(x1, y1, x2, y2) {
		ctx.beginPath(); 
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	}

	function getNoteDiff(a, b) {
		let letterA = a[0];
		let numberA = +a[a.length - 1];
		let letterB = b[0];
		let numberB = +b[b.length - 1];
		let noteDiff = noteIndexes.indexOf(letterA) - noteIndexes.indexOf(letterB);
		let octaveDiff = numberA - numberB;
		return noteDiff + octaveDiff * 7;
	}

	function draw(loops) {
		let { width, height } = panel.el.getBoundingClientRect();
		const { tonic, scale } = app.composition.get();

		const tonicIndex = MIDI_NOTES.indexOf(tonic);
		const notesInScale = scale.map(interval => {
			let n = MIDI_NOTES[tonicIndex + interval];
			return n.substring(0, n.length - 1);
		});

		let key = tonic.substring(0, tonic.length - 1);
		if (scale.includes(3) && !scale.includes(4)) {
			key = minors[key];
		}
		let signature = [];
		if (keys[key]) {
			let keySig = keys[key];
			signature = keySig[0] === '#' ?
				sharps.slice(0, keySig[1]) :
				flats.slice(0, keySig[1]);
		}
		
		let noteWidth = defaultNoteWidth; // default
		let startX = defaultNoteWidth * 2 + signature.length * noteWidth;
		let staffX = startX;
		let staffY = top;
		let staffWidth = width - padding - startX - margin * 2;
		let staffHeight = 11 * h + h;

		let noteDuration = loops.length === 0 ? 4 :
			Math.max(...loops.flatMap(loop => loop.melody.map(n => +n[1][0])));
		let noteDiff = noteDuration / 4;
		let compDuration = Math.max(...loops.map(loop => loop.len));
		let numMeasures = Math.ceil(compDuration / noteDuration);

		let incidentals = loops
			.flatMap(loop => loop.melody)
			.map((note, index) => { return [
				note[0] ? note[0].substring(0, note[0].length - 1) : null,  
				Math.floor((index % compDuration) / noteDuration)
			]})
			.filter(i => i[0] !== null)
			.filter(i => !notesInScale.includes(i[0]));
		
		let numIncidentals = incidentals.length;
		let incidentalsPerMeasure = [];
		for (let i = 0; i < numMeasures; i++) {
			incidentalsPerMeasure[i] = incidentals.filter(inc => inc[1] === i).length;
		}

		let compWidth = compDuration * noteWidth 
			+ numMeasures * noteWidth
			+ numIncidentals * noteWidth;

		let notesPerStaffLine = compDuration;
		let measuresPerStaffLine = numMeasures;
		let numStaffLines = 1;
		let totalColumns = 1 + numMeasures + numMeasures * noteDuration + numIncidentals;
		let columnsPerStaffLine = [totalColumns];

		if (staffWidth > compWidth) {
			noteWidth = Math.floor(staffWidth / totalColumns);
		} else {
			columnsPerStaffLine = [0];
			for (let i = 0; i < numMeasures; i++) {
				let measureCols = noteDuration + incidentalsPerMeasure[i] + 1;
				let measureWidth = measureCols * noteWidth;
				let currentWidth = columnsPerStaffLine[numStaffLines - 1] * noteWidth;
				if (currentWidth + measureWidth < staffWidth) {
					columnsPerStaffLine[numStaffLines - 1] += measureCols;
				} else {
					numStaffLines++;
					columnsPerStaffLine.push(measureCols);
				}
			}
		}

		canvas.width = width - padding; // - padding
		canvas.height = staffHeight * numStaffLines + top * 2;

		ctx.fillStyle = 'lightgray';  // bg
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = 'black';
		ctx.strokeStyle = 'black';

		// draw staff lines
		for (let i = 0; i < numStaffLines; i++) {
			// staff(32, i * staffHeight, width);
			let _y = top + i * staffHeight;
			let _x = 32;
			
			ctx.strokeStyle = 'gray';
			for (let i = 0; i < 11; i++) {
				let y = top + i * h + h;
				if (i !== 5) line(margin, _y + y, width - margin - padding, _y + y); 
			}

			// clefs
			ctx.fillStyle = 'black';
			ctx.font = h * 5 + 'px serif';
			ctx.fillText('𝄞', margin, _y + top + h * 4.5);
			ctx.font = h * 3 + 'px serif';
			ctx.fillText('𝄢', margin, _y + top + h * 9.5);

			ctx.font = h * 1.5 + 'px serif';
			signature.forEach(n => {
				let y = top + h + _y + (trebleSigs.indexOf(n)) * h2;
				ctx.fillText('♯', _x, y);
				ctx.fillText('♯', _x, y + h * 7);
				_x += defaultNoteWidth;
			});
		}

		if (loops.length === 0) return;

		let tempX = staffX + noteWidth;
		let noteCount = 0;
		let extraColumnCount = 0;
		let staffLineCount = 0;
		let staffLineBreak = columnsPerStaffLine[staffLineCount];

		// console.log(compDuration, numMeasures, numIncidentals, columnsPerStaffLine)

		for (let i = 0; i <= compDuration; i++) {

			// ctx.font = '12px monospace';
			// ctx.fillText(i, tempX, staffY + top);
			// ctx.fillText(i + extraColumnCount, tempX, staffY + top * 2);

			let colWidth = noteWidth;
			if (staffLineCount < numStaffLines - 1) {
				colWidth = Math.floor(staffWidth / columnsPerStaffLine[staffLineCount]);
			}

			if (i === compDuration) { // end of composition bar
				ctx.fillStyle = 'black';
				ctx.fillRect(tempX - colWidth / 2, staffY + top + h, 6, h * 4);
				ctx.fillRect(tempX - colWidth / 2, staffY + top + h * 7, 6, h * 4);
				continue;
			}

			if (i > 0 && (i + extraColumnCount) > staffLineBreak - 1) {
				staffLineCount++;
				staffY += staffHeight;
				tempX = staffX + noteWidth;
				staffLineBreak += columnsPerStaffLine[staffLineCount];
			}

			// ctx.font = '12px monospace';
			// ctx.fillText(i, tempX, staffY + top);
			// ctx.fillText(i + extraColumnCount, tempX, staffY + top * 2);

			if (i === compDuration) { // end of composition bar
				ctx.fillStyle = 'black';
				ctx.fillRect(tempX, staffY + top + h, 6, h * 4);
				ctx.fillRect(tempX, staffY + top + h * 7, 6, h * 4);
				continue;
			}

			let notes = [];
			let measures = [];
			for (let j = 0; j < loops.length; j++) {
				let { startDelay, startIndex, doubler, repeat, melody } = loops[j];
				let loopIndex = (i - startDelay + startIndex) % melody.length;
				if (!melody[loopIndex]) continue;
				notes.push(melody[loopIndex]);
				measures.push(melody.slice(loopIndex - noteCount, loopIndex + (noteDuration - noteCount)));
			}
			
			// console.log('notes', notes);
			if (notes.every(n => n[0] === null)) { // draw rest
				
				let continueNote = false;

				ctx.font = '26px Noto';
				if (measures.flatMap(l => l).every(n => n[0] === null)) {
					// temp count doesn't exist here, not sure what this is suposed to do
					// if (tempCount === 0) {
						ctx.fillText('𝄻', tempX + colWidth, staffY + 11 * h); // whole note rest
						continueNote = true;
					// }
				}

				measures.forEach(loop => { 
					loop.forEach((n, index) => {
						if (index < noteCount && index + (noteDuration / parseInt(n[1])) > noteCount) {
							continueNote = true;
						}
					})
				});
				
				
				if (!continueNote) { // check note duration
					let sliceLength = noteDuration / 4 * 2; // 1 half note worth 
					let tempCount = noteCount % sliceLength; // deal with one half
					let whichHalf = noteCount >= sliceLength ? 1 : 0;
					let slice = measures.map(loop => loop.slice(sliceLength * whichHalf, sliceLength + sliceLength * whichHalf));
					if (slice.flatMap(l => l).every(n => n[0] === null)) {
						if (tempCount === 0) {
							ctx.fillText('𝄼', tempX + colWidth, staffY + 11 * h); // 2n rest
						}
					}

					else if (tempCount % 2 === 0) {
						if (slice.filter(loop => loop[tempCount+1])
								.every(loop => loop[tempCount+1][0] === null)) {
							ctx.fillText('𝄽', tempX + colWidth / 2, staffY + 11.5 * h); // 4n rest
						} else {
							ctx.fillText('𝄾', tempX, staffY + 11.5 * h); // 8n rest
						}
					}


					else if (slice.filter(loop => loop[tempCount-1])
							.every(loop => loop[tempCount-1][0] !== null)) { 
						ctx.fillText('𝄾', tempX, staffY + 11.5 * h); // 8n rest
					}
				}
				
				noteCount++;
			} else { // draw note
				// let y = top + staffY + C4Y + getNoteDiff('C4', note) * h2;
				ctx.strokeStyle = 'black';

				notes.forEach(_n => {
					let [note, duration] = _n;
					if (note === null) return;
					let y = top + staffY + C4Y + getNoteDiff('C4', note) * h2;

					// sharp, flat, natural
					let n = note.substring(0, note.length - 1);
					if (!notesInScale.includes(n)) {
						ctx.font = '18px sans-serif';
						if (note.includes('#')) {
							ctx.fillText('♯', tempX - colWidth / 2, y + 8); // idky
							// flats?
						} else {
							ctx.fillText('♮', tempX - colWidth / 2, y + 8);
						}
						// console.log('inc', i, noteCount, noteDuration);
						tempX += colWidth;
						extraColumnCount++;
					}
					
					if (duration === '1n') {
						ctx.beginPath();
						ctx.ellipse(tempX, y, 5, 3, -Math.PI / 6, 0, Math.PI * 2);
						ctx.stroke();
					}

					if (duration === '2n') {
						ctx.beginPath();
						ctx.ellipse(tempX, y, 5, 3, -Math.PI / 6, 0, Math.PI * 2);
						ctx.stroke();
						line(tempX + 5, y - 1, tempX + 5, y - h * 2);
					}
					
					if (duration === '4n') {
						ctx.beginPath();
						ctx.ellipse(tempX, y, 6, 4, -Math.PI / 6, 0, Math.PI * 2);
						ctx.fill();
						line(tempX + 5, y - 1, tempX + 5, y - h * 2);
					}

					if (duration === '8n') {
						
						let sliceLength = noteDuration / 4 * 2; // 1 half note worth 
						let tempCount = noteCount % sliceLength; // deal with one half
						let whichHalf = noteCount >= sliceLength ? 1 : 0;
						let slice = measures.map(loop => loop.slice(sliceLength * whichHalf, sliceLength + sliceLength * whichHalf));

						// console.log('slice', slice);
						
						let topY = C4Y + getNoteDiff('C4', note) * h2;
						let len = 0;

						for (let k = 0; k < sliceLength; k++) {
							let n = slice.filter(loop => loop[k]).map(loop => loop[k]);
							// console.log('n', n);
							if (k > tempCount) {
								if (n.every(e => e[0] === null) || 
									n.every(e => e[1] !== '8n')) { 
									break;
								}
							}
							if (n.every(e => e[0] === null)) continue;
							if (k > tempCount) len += colWidth;
							n.forEach(e => {
								if (e[0] === null) return;
								let ny = C4Y + getNoteDiff('C4', e[0]) * h2;
								if (ny < topY) topY = ny;
							});
						}

						let tail = false;
						if (len > 0) { // rect for multiple notes
							ctx.fillRect(tempX + 5, staffY + topY - h2, len, 4);
						} 
						else {
							tail = slice
								.filter(loop => loop[tempCount - 1])
								.every(loop => loop[tempCount - 1][0] === null);
						}

						// stem for this note
						line(tempX + 5, y - 1, tempX + 5, staffY + topY - h2);
						ctx.beginPath();
						ctx.ellipse(tempX, y, 6, 4, -Math.PI / 6, 0, Math.PI * 2);
						ctx.fill();

						if (tail) {
							// let dir = tempCount === 3 ? -5 : 10;
							line(tempX + 5, staffY + topY - h2, tempX + 10, staffY + topY + h2)
						}
					}

					// middle lines
					if (staffY > top + h * 5 && staffY < top + h * 7) {
						line(tempX - 12, staffY + top + h * 6, tempX + 12, staffY + top + h * 6);
					}
				});

				noteCount++;
			}
			
			// draw measure lines
			if (noteCount === noteDuration) {
				tempX += colWidth;
				extraColumnCount++
				let x = tempX;
				ctx.strokeStyle = 'black';
				line(x + colWidth / 2, staffY + top + h, x + colWidth / 2, staffY + top + h * 5);
				line(x + colWidth / 2, staffY + top + h * 7, x + colWidth / 2, staffY + top + h * 11);
				noteCount = 0;
			}
			tempX += colWidth;
		}
	}

	function update(loops) {
		draw(loops);
	}

	function connect() {
		panel = app.ui.getPanel('score');
		panel.el.appendChild(canvas);
	}

	return { connect, update, draw };
}
