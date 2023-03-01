/*
	random walk
	value, step, chance, min, max, dir (chance of up down), dir walker?
	dir -1 means it only goes down
	dir 0 equal up or down
	dir 1 only up
	dir / 2 so it 50% + -50% or +50%
	dirWalk, dir value has its own walker (aaaaaaaaaahhhhhrgg)
*/

function ValueWalker(val, step=0.1, ch=1, min=0, max=1, dir=0, dirWalk=false) {

	if (max < val) max = val;

	function update() {
		if (chance(ch)) {
			set(val + (chance(0.5 + (dir/2)) ? step : -step));
		}
	}

	function set(v) {
		val = v;
		if (val < min) val = min;
		if (val > max) val = max;
	}

	return {
		update,
		set,
		get: () => { return val; },
		setMin: v => { min = v; },
		setMax: v => { max = v; },
	}
	
}