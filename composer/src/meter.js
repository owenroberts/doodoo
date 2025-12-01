import { map } from '../../../cool/cool.js';
import { UIPanel } from '../../../ui/src/oi.js';

/**
 * visualize overall loudness of the output
 */
export class MeterPanel extends UIPanel {
	constructor(app) {
		super({ id: 'meter', ui: app.ui });

		this.toneMeter;

		this.interval = 1000 / 30;
		this.timer = 0;

		const canvas = document.createElement('canvas');
		// this.ctx;
		if (canvas.getContext('2d')) {
			this.ctx = canvas.getContext('2d');
		} else {
			return;
		}	

		this.w = 320;
		this.h = 28;
		this.m = 4;
		canvas.width = this.w;
		canvas.height = this.h;
		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, this.w, this.h);

		this.el.appendChild(canvas);
		this.setStyle('textAlign', 'left');

		this.timer = performance.now();
		requestAnimationFrame(() => {
			this.draw() 
		});

		app.doodoo.config.useMeter = true;
		app.doodoo.config.updateMeter = meter => {
			this.toneMeter = meter;
		}
	}

	draw() {

		requestAnimationFrame(() => {
			this.draw() 
		});
		if (!this.toneMeter) return;
		if (!this.isOpen()) return;
		
		const time = performance.now();
		if (time > this.timer + this.interval) {
			this.timer = time;
			this.ctx.fillStyle = 'black';
			this.ctx.fillRect(0, 0, this.w, this.h);
			
			const v = this.toneMeter.getValue();
			const left = map(v[0], -266, 0, 1, this.w - this.m * 8, true);
			const right = map(v[1], -266, 0, 1, this.w - this.m * 8, true);

			this.ctx.fillStyle = 'LawnGreen';
			this.ctx.fillRect(this.m, this.m, left, this.m * 2);
			this.ctx.fillRect(this.m, this.m * 4, right, this.m * 2);

			if (left > 2) {
				this.ctx.fillText(Math.round(v[0]), this.w - 32, this.m * 3);
			}

			if (right > 2) {
				this.ctx.fillText(Math.round(v[1]), this.w - 32, this.m * 6);
			}
		}
	}
}