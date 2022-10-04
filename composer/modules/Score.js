/*
	display score from mutated doodoos ...
*/

function Score(app) {
	const self = this;
	const { MIDI_NOTES } = app;

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
	let notoFont = new FontFace(
		"Noto",
		"url(https://fonts.gstatic.com/s/notomusic/v14/pe0rMIiSN5pO63htf1sxEkW7I9tAcVwo.woff2)"
	);
	let notoFontLoaded = false;
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
		console.log('loops', loops);
		
		let { width, height } = self.panel.el.getBoundingClientRect();
		const { tonic, scale } = app.composition;
		const tonicIndex = MIDI_NOTES.indexOf(tonic);
		const notesInScale = scale.map(interval => {
			let n = MIDI_NOTES[tonicIndex + interval];
			return n.substring(0, n.length - 1);
		});

		let key = tonic.substring(0, tonic.length - 1);
		if (scale.includes(3) && !scale.includes(4)) {
			key = minors[key];
		}
		let keySig = keys[key];
		let signature = keySig[0] === '#' ?
			sharps.slice(0, keySig[1]) :
			flats.slice(0, keySig[1]);
		
		let noteWidth = defaultNoteWidth; // default
		let startX = defaultNoteWidth * 2 + signature.length * noteWidth;
		let staffX = startX;
		let staffY = top;
		let staffWidth = width - padding - startX - margin * 2;
		let staffHeight = 11 * h + h;

		let noteDuration = loops.length === 0 ? 4 :
			Math.max(...loops.flatMap(loop => loop.melody.map(n => +n[1][0])));
		let noteDiff = noteDuration / 4;
		let compDuration = Math.max(loops.map(
			(loop) => loop.startDelay + loop.melody.length * loop.repeat
		));
		let numMeasures = Math.ceil(compDuration / noteDuration);
		console.log(compDuration, noteDuration, numMeasures);

		let incidentals = loops.flatMap(loop => loop.melody)
			.map((note, index) => { 
				return [
				note[0] ? note[0].substring(0, note[0].length - 1) : null,  
				Math.floor(index / noteDuration)
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

		for (let i = 0; i <= compDuration; i++) {

			// ctx.font = '12px monospace';
			// ctx.fillText(i, tempX, staffY + top);
			// ctx.fillText(i + extraColumnCount, tempX, staffY + top * 2);

			let colWidth = noteWidth;
			if (staffLineCount < numStaffLines) {
				Math.floor(staffWidth / columnsPerStaffLine[staffLineCount]);
				if (i === 0) {
					// tempX += staffWidth - colWidth * columnsPerStaffLine[staffLineCount];
				}
			}

			if (i > 0 && (i + extraColumnCount) % columnsPerStaffLine[staffLineCount] === 0) {
				staffLineCount++;
				staffY += staffHeight;
				tempX = staffX + noteWidth;
			}

			// ctx.font = '12px monospace';
			// ctx.fillText(i, tempX, staffY + top);
			// ctx.fillText(i + extraColumnCount, tempX, staffY + top * 2);

			if (i === compDuration) { // end of composition bar
				ctx.fillRect(tempX, staffY + top + h, 6, h * 4);
				ctx.fillRect(tempX, staffY + top + h * 7, 6, h * 4);
				continue;
			}

			let moreNotes = [];

			for (let j = 0; j < loops.length; j++) {
				let { startDelay, startIndex, doubler, repeat, melody } = loops[j];
				if (startDelay > i) continue;
				
				if (i > startDelay + melody.length * repeat) {
					moreNotes.push(false);
					continue;
				} else {
					moreNotes.push(true);
				}

				let loopIndex = (i - startDelay + startIndex) % melody.length;
				let [note, duration] = melody[loopIndex];

				
				if (note === null) { // draw rest

					// get measure the rest is in ...
					let measure = melody.slice(loopIndex - noteCount, loopIndex + (noteDuration - noteCount));
					console.log('measure', i, note, measure);
					console.log('fart')
					
					ctx.font = '26px Noto';
					if (duration === '8n') {
						let tempCount = noteCount % 4;
						let slice = melody.slice(loopIndex - tempCount, loopIndex + (4 - tempCount));
						// top or bottom staff ... 
						if (slice.every(n => n[0] === null)) {
							// half note rest
							if (tempCount === 0) {
								ctx.fillText('𝄼', tempX + colWidth, staffY + 11 * h); // 2n rest
							}
						}
						else if (tempCount % 2 === 0) {
							if (slice[tempCount+1][0] === null) {
								ctx.fillText('𝄽', tempX + colWidth / 2, staffY + 11.5 * h); // 4n rest
							} else {
								ctx.fillText('𝄾', tempX, staffY + 11.5 * h); // 8n rest
							}
						}
						else if (slice[tempCount-1][0] !== null) { 
							ctx.fillText('𝄾', tempX, staffY + 11.5 * h); // 8n rest
						}
					}
					
					noteCount++;
					// tempX += colWidth;
					// continue;
				
				} else { // draw note
				
					let y = top + staffY + C4Y + getNoteDiff('C4', note) * h2;
					ctx.strokeStyle = 'black';

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
						ctx.strokeStyle = 'black';
						ctx.ellipse(tempX, y, 6, 4, -Math.PI / 6, 0, Math.PI * 2);
						ctx.stroke();
					}

					if (duration === '2n') {
					}

					// connectors and stems
					if (duration === '4n') {
						ctx.beginPath();
						ctx.ellipse(tempX, y, 6, 4, -Math.PI / 6, 0, Math.PI * 2);
						ctx.fill();
						line(tempX + 5, y - 1, tempX + 5, y - h2);
					}

					// connector
					if (duration === '8n') {
						let diff = 0;
						let tempCount = noteCount % 4;
						let slice = melody.slice(loopIndex - tempCount, loopIndex + (4 - tempCount));
						
						let topY = C4Y + getNoteDiff('C4', note) * h2;
						let len = 0;

						for (let k = 0; k < slice.length; k++) {
							let [n, dur] = slice[k];
							if (k > tempCount) {
								if (!n || dur !== '8n') break;
							}
							if (!n) continue;
							if (k > tempCount) len += colWidth;
							let ny = C4Y + getNoteDiff('C4', n) * h2;
							if (ny < topY) topY = ny;
						}

						let tail = false;
						if (len > 0) { // rect for multiple notes
							ctx.fillRect(tempX + 5, staffY + topY - h2, len, 4);
						} else {
							if (slice[tempCount - 1]) {
								if (slice[tempCount - 1][0] === null) tail = true;
							} else {
								tail = true;
							}
						}

						// stem for this note
						line(tempX + 5, y - 1, tempX + 5, staffY + topY - h2);
						ctx.beginPath();
						ctx.ellipse(tempX, y, 6, 4, -Math.PI / 6, 0, Math.PI * 2);
						ctx.fill();

						if (tail) {
							let dir = tempCount === 3 ? -5 : 10;
							line(tempX + 5, staffY + topY - h2, tempX + dir, staffY + topY + h2)
						}
					}

					// middle lines
					if (staffY > top + h * 5 && staffY < top + h * 7) {
						line(tempX - 12, staffY + top + h * 6, tempX + 12, staffY + top + h * 6);
					}

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
			}
			tempX += colWidth;
		}
	}

	this.update = function(loops) {
		draw(loops);
	};

	this.init = function() {
		self.panel.el.appendChild(canvas);
		draw([])
	};
}
