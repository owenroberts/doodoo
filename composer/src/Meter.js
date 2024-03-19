/*
	visualize overall loudness of the output
*/

import { Cool } from '../../../cool/cool.js';

export function Meter(app) {

	let panel;
	const interval = 1000 / 30;
	let timer = 0;
	let toneMeter;


	const canvas = document.createElement('canvas');
	let ctx;
	if (canvas.getContext('2d')) {
		ctx = canvas.getContext('2d');
	} else {
		return;
	}

	const w = 320, h = 28, m = 4;
	canvas.width = w;
	canvas.height = h;
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, w, h);

	function draw() {
		requestAnimationFrame(draw);
		if (!toneMeter) return;
		const time = performance.now();
		if (time + interval > timer) {
			timer = time;
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, w, h);
			
			const v = toneMeter.getValue();
			const left = Cool.map(v[0], -266, 0, 1, w - m * 8, true);
			const right = Cool.map(v[1], -266, 0, 1, w - m * 8, true);

			ctx.fillStyle = 'LawnGreen';
			
			ctx.fillRect(m, m, left, m * 2);
			ctx.fillRect(m, m * 4, right, m * 2);

			if (left > 2) {
				ctx.fillText(Math.round(v[0]), w - 32, m * 3);
			}
			if (right > 2) {
				ctx.fillText(Math.round(v[1]), w - 32, m * 6);
			}


		}
	}
	timer = performance.now();
	requestAnimationFrame(draw);

	function setMeter(meter) {
		toneMeter = meter;
	}

	function isOpen() {
		return panel.isOpen;
	}

	function connect() {
		panel = app.ui.getPanel('meter');
		panel.el.appendChild(canvas);
		panel.el.style.textAlign = 'left'; // prob ui way to do this
	}

	return { connect, setMeter, isOpen };
}