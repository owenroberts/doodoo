import { UIPanel, UIButton, UIRow, UILabel } from '../../../oi/src/oi.js';

/**
 * manage versions of composition
 */
export class VersionsPanel extends UIPanel {

	constructor(fm, ui) {
		super({ id: "versions", ui });

		this.fm = fm;

		this.addRef({
			// obj: this.fm.data,
			min: 0,
			value: this.fm.data.versionIndex,
			label: "versionIndex",
			face: "versionIndex",
			callback: value => {
				this.switchVersion(value);
				// this.fm.loadVersion();
			},
			ignoreSettings: true,
		});

		this.addButton({ 
			callback: () => {
				this.newVersion();
			}, 
			key: "v", 
			text: "+",
		});

		this.versionsRow = this.add(new UIRow({ id: "versions" }));
		this.load();
	}

	newVersion() {
		const tag = prompt("tag new version?", "new version");
		if (!tag) return;
		this.fm.addVersion(tag);
		this.addVersion(this.fm.data.versions.length - 1);
	}

	switchVersion(index) {
		if (index === this.fm.data.versionIndex) return;
		if (!confirm("switching versions will lose current changes")) return;

		if (index > this.fm.data.versions.length - 1) {
			this.newVersion();
		} else {
			this.fm.data.versionIndex = index;
			this.fm.loadVersion();
			this.ui.panels.files.loadVersion();
		}
	}

	addVersion(index) {

		if (index > 0) {
			this.versionsRow.addBreak();
		}

		this.versionsRow.add(new UILabel({ text: `version ${index}`}));

		this.versionsRow.add(new UIButton({
			text: "X",
			callback: () => {
				alert("gonna do this later");
			}
		}));

		this.versionsRow.add(new UIButton({
			text: "log",
			callback: () => { console.log(this.fm.data.versions[index]); },
		}));

		this.versionsRow.add(new UIButton({
			text: "tag",
			callback: () => { console.log(this.fm.data.versions[index].tag); },
		}));

		this.versionsRow.add(new UIButton({
			text: "select",
			callback: () => {
				this.switchVersion(index);
				// this.ui.faces.versionIndex.update(index); // example where set makes more sense than update
				// this.fm.loadVersion();
				this.ui.faces.versionIndex.update(index, true);
				// this.ui.panels.files.loadVersion();
			}
		}));
	}

	load() {
		this.versionsRow.clear();
		for (let i = 0; i < this.fm.data.versions.length; i++) {
			this.addVersion(i);
		}
	}

}