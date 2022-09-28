// import { MIDI_NOTES } from './Midi.js';
/*
	display score from mutated doodoos ...
*/

function Score(app) {
	const self = this;

	const canvas = document.createElement('canvas');
	let ctx;
	if (canvas.getContext('2d')) {
		ctx = canvas.getContext('2d');
	}

	let m = 10; // margin
	let p = 8; // css padding
	let t = 20; // top
	let h = 12; // height ?
	let w = 24; // width
	let C4 = 60; // middle c index ? 
	let C4Y = t + h * 6; // y value
	let noteIndexes = "ABCDEFG".split("");

	function line(x1, y1, x2, y2) {
		ctx.beginPath(); 
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();

	}

	function draw(loops) {
		let { width, height } = self.panel.el.getBoundingClientRect();
		canvas.width = width - p; // - padding
		canvas.height = height - p;

		ctx.fillStyle = 'lightgray';
		ctx.fillRect(0, 0, width, height);

		// staff
		ctx.strokeStyle = 'black';
		for (let i = 0; i < 11; i++) {
			let y = t + i * h + h;
			if (i !== 5) {
				line(m, y, width - m - p, y); 
			} else {
				// stroke("gray");
				// line(m, y, width - m, y);
			}
		}

		// clefs
		ctx.fillStyle = 'black';
		ctx.font = h * 5 + 'px serif';
		ctx.fillText('𝄞', m, t + h * 4.5);
		ctx.font = h * 4 + 'px serif';
		ctx.fillText('𝄢', m, t + h * 10.5);

		// figure out composition
		// get smallest note duration
		let noteDurations = new Set(
			loops.flatMap((loop) => loop.melody.map((n) => n[1]))
		);
		let noteDuration = noteDurations[0]; // fix later

		// comp length
		let loopDurations = loops.map(
			(loop) => loop.startDelay + loop.melody.length * loop.repeat
		);
		let compDuration = loopDurations.sort()[loopDurations.length - 1];
		let w = (width - m * 5) / compDuration;
		console.log(compDuration)
		
		// measures
		for (let j = 0; j <= compDuration; j++) {
			if (j > 1 && j % 4 === 0) {
				let x = m * 2 + w / 2 + w * j;
				// stroke("black");
				// fill('black');
				if (j === compDuration) {
					// ctx.strokeRect(x, t + h, 6, h * 4);
					// ctx.fillRect(x, t + h, 6, h * 4);
					// ctx.strokeRect(x, t + h * 7, 6, h * 4);
					// ctx.fillRect(x, t + h * 7, 6, h * 4);
				} else {
					line(x, t + h, x, t + h * 5);
					line(x, t + h * 7, x, t + h * 11);
				}
			}
		}

		// notes
		for (let j = 0; j < compDuration; j++) {
			
			let rest = [];
			let moreNotes = [];
			
			for (let i = 0; i < loops.length; i++) {
				let { startDelay, startIndex, doubler, repeat, melody } = loops[i];
				if (startDelay > j) continue;
				if (j > startDelay + melody.length * repeat) {
					moreNotes.push(false);
					continue;
				} else {
					moreNotes.push(true);
				}
				let loopIndex = (j - startDelay + startIndex) % melody.length;

				if (melody[loopIndex][0] !== null) {
					rest = false;
					let [note, duration] = melody[loopIndex];
					let letter = note[0];
					let number = +note[note.length - 1];
					let y = C4Y +
						((2 - noteIndexes.indexOf(letter)) * h) / 2 +
						(((4 - number) * h) / 2) * 7;
					let x = m * 2 + w + w * j;
					// fill("black");
					// noStroke();
					// push();
					// translate(x, y);
					// rotate(-PI/6);
					// ellipse(0, 0, 12, 8);

					// pop();
					console.log(x, y);
					ctx.beginPath();
					ctx.ellipse(x, y, 12, 8, -Math.PI / 6, 0, Math.PI * 2);
					ctx.fill();
					
					if (note.includes("#")) {
						// textSize(18);
						// text("#", x - 12, y);
					}
					
					if (duration.includes('4')) {
						// stroke('black');
						// line(x + 5, y - 1, x + 5, y - h * 2);
					}
					
					if (y > t + h*5 && y < t + h*7) {
						// line(x - 12, t + h*6, x + 12, t + h * 6);
					}
					// text(note, x + 6, y + 3);
				} else {
					rest.push(i);
				}
			}
		}


	}

	this.update = function(loops) {
		console.log(loops);
		draw(loops);
	};

	this.init = function() {
		console.log(self)
		self.panel.el.appendChild(canvas);
		draw([])
	};
}
