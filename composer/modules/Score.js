/*
	display score from mutated doodoos ...
*/

function Score(app) {
	const self = this;

	const canvas = document.createElement('canvas');
	let ctx;
	if (canvas.getContext('2d')) {
		ctx = canvas.getContext('2d');
	} else {
		return;
	}

	let m = 10; // margin
	let p = 8; // css padding
	let t = 20; // top
	let h = 12; // row height
	let h2 = 6;
	let w = 24; // width
	let C4 = 60; // middle c index ? 
	let C4Y = t + h * 6; // y value
	let noteIndexes = "ABCDEFG".split("");
	let noteWidth = 12;

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


	function line(x1, y1, x2, y2) {
		ctx.beginPath(); 
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	}

	function staff(_x, _y, width) {
		ctx.strokeStyle = 'black';
		for (let i = 0; i < 11; i++) {
			let y = t + i * h + h;
			if (i !== 5) line(m, _y + y, width - m - p, y); 
		}

		// clefs
		ctx.fillStyle = 'black';
		ctx.font = h * 5 + 'px serif';
		ctx.fillText('𝄞', m, _y + t + h * 4.5);
		ctx.font = h * 3 + 'px serif';
		ctx.fillText('𝄢', m, _y + t + h * 10.5);

		// key signature
		const { tonic, scale } = app.composition;
		let key = tonic.substring(0, tonic.length - 1);
		if (scale.includes(3) && !scale.includes(4)) {
			key = minors[key];	
		} 
		let keySig = keys[key];
		let signature = keySig[0] === '#' ?
			sharps.slice(0, keySig[1]) :
			flats.slice(0, keySig[1]);

		ctx.font = h * 1.65 + 'px serif';
		signature.forEach(n => {
			let y = t + h + _y + (trebleSigs.indexOf(n)) * h / 2;
			ctx.fillText(keySig[0], _x, y);
			ctx.fillText(keySig[0], _x, y + h * 7);
			_x += noteWidth;
		});

		return _x;
	}

	function draw(loops) {

		console.log('loops', loops)
		let { width, height } = self.panel.el.getBoundingClientRect();
		canvas.width = width - p; // - padding
		canvas.height = height - p;
		noteWidth = 12;

		ctx.fillStyle = 'lightgray';
		ctx.fillRect(0, 0, width, height); // bg
		
		let staffY = 0;
		let staffX = 32;
		staffX = staff(staffX, staffY, width);
		staffX += noteWidth;
		let staffWidth = width - p - staffX - m * 2;

		if (loops.length === 0) return;

		let noteDuration = Math.min(...loops.flatMap(loop => loop.melody.map(n => +n[1][0])));
		let noteDiff = noteDuration / 4;
		let compDuration = Math.max(loops.map(
			(loop) => loop.startDelay + loop.melody.length * loop.repeat
		));
		let numMeasures = Math.ceil(compDuration / noteDuration);
		let compWidth = compDuration * noteWidth + numMeasures * noteWidth;
		console.log(staffWidth, numMeasures, compWidth);
		
		let notesPerStaffLine = compDuration;
		let measuresPerStaffLine = numMeasures;
		let totalColumns = numMeasures + 1 + numMeasures * noteDuration;

		if (staffWidth > compWidth) {
			noteWidth = Math.floor(staffWidth / totalColumns);
		} else {
			// add new staff
			notesPerStaffLine = Math.floor(staffWidth / noteWidth);
			// measuresPerStaffLine = Math.floor()
		}
		console.log(noteWidth, staffWidth, totalColumns);


		let tempX = staffX;
		let noteCount = 0;
		let measureCount = 0;

		for (let i = 0; i < totalColumns; i++) {

			if (i === totalColumns - 1) { // end of composition bar
				console.log(i === totalColumns, tempX, tempX - measureCount * noteWidth);

				ctx.font = '12px monospace';
				ctx.fillText('x', tempX - measureCount * noteWidth, t + h);
				ctx.fillStyle = 'black';
				// ctx.strokeRect(tempX, t + h, 6, h * 4);
				ctx.fillRect(tempX - measureCount * noteWidth, t + h, 6, h * 4);
				// ctx.strokeRect(tempX, t + h * 7, 6, h * 4);
				ctx.fillRect(tempX - measureCount * noteWidth, t + h * 7, 6, h * 4);
				continue;
			}

			ctx.font = '12px monospace';
			ctx.fillText('.', tempX - measureCount * noteWidth, t + h);

			let rest = [];
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

				if (melody[loopIndex][0] === null) {
					rest.push(j);
					continue;
				}

				rest = false;

				let [note, duration] = melody[loopIndex];
				let letter = note[0];
				let number = +note[note.length - 1];
				let y = C4Y
					+ (2 - noteIndexes.indexOf(letter)) * h2
					+ (4 - number) * h2 * 7
					// ((2 - noteIndexes.indexOf(letter)) * h) / 2 +
					// (((4 - number) * h) / 2) * 7;
				
				ctx.beginPath();
				// ctx.ellipse(tempX, staffY + y, 6, 4, 0, 0, Math.PI * 2);
				ctx.ellipse(tempX, y, 6, 4, -Math.PI / 6, 0, Math.PI * 2);
				ctx.fill();
				
				if (note.includes("#")) {
					// textSize(18);
					// text("#", x - 12, y);
				}
				
				if ([4, 8].includes(parseInt(duration))) {
					line(tempX + 5, staffY + y - 1, tempX + 5, y - h * 2);
				}
				
				if (staffY > t + h * 5 && staffY < t + h * 7) {
					line(tempX - 12, staffY + t + h * 6, tempX + 12,staffY +  t + h * 6);
				}

				noteCount++;
				if (noteCount === noteDuration) {
					tempX += noteWidth;
					line(tempX, staffY + t + h, tempX, staffY + t + h * 5);
					line(tempX, staffY + t + h * 7, tempX, staffY + t + h * 11);
					noteCount = 0;
					measureCount++;
				}
				
				// text(note, x + 6, y + 3);
			}
			// console.log('rest', rest);
			tempX += noteWidth;
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
