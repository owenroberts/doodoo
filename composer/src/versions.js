import { UIPanel, UIButton, UIRow, UILabel } from '../../../oi/src/oi.js';
import { getDate } from '../../../cool/cool.js';


/**
 * manage versions of composition
 */
export class VersionsPanel extends UIPanel {

	constructor(doodoo, ui) {
		super({ id: "versions", ui });

		this.doodoo = doodoo;
		this.files = ui.panels.files;

		this.addRef({
			obj: this.files.data,
			ref: "versionIndex",
			callback: value => {
				console.log(value, this);
				this.files.loadVersion(value);
			},
			ignoreSettings: true,
		});

		this.addButton({ 
			callback: () => {
				this.addVersion();
			}, 
			key: "v", 
			text: "+",
		});

		// this.addBreak();

		this.versionsRow = this.add(new UIRow({ id: "versions" }));
		this.load();
	}

	addVersion(index) {

		if (!Number.isFinite(index)) {
			index = this.files.data.versions.length;
			this.files.data.versions.push({
				comp: structuredClone(this.doodoo.comp),
				tag: prompt("tag current version?", "initial version"),
				createdOn: getDate(),
				lastSavedOn: getDate(),
			});
			this.ui.faces.versionIndex.update(index);
		}

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
			callback: () => { console.log(this.files.data.versions[index]); },
		}));

		this.versionsRow.add(new UIButton({
			text: "tag",
			callback: () => { console.log(this.files.data.versions[index].tag); },
		}));

		this.versionsRow.add(new UIButton({
			text: "select",
			callback: () => {
				this.ui.faces.versionIndex.update(index); // example where update is really set
				this.files.loadVersion(index);
			}
		}));

		
	}

	load() {
		this.versionsRow.clear();
		for (let i = 0; i < this.files.data.versions.length; i++) {
			this.addVersion(i);
		}
	}

}