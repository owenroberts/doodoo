/*
	manage the many many doodoo params
*/
function Params(app, defaults) {

	// this.attackStart = [0.25, 0.7];
	// this.attackStep = [-0.2, 0.2];

	this.get = function() {
		return {
			attackStart: this.attackStart,
			attackStep: this.attackStep,
		};
	};
}