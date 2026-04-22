import { saveAs } from 'file-saver';
import { UIPanel, UIModal, UIButton } from '../../../oi/src/oi.js';

/**
 * panel for greg file manager
 */
export class FilesPanel extends UIPanel {

	constructor(fm, ui) {
		super({ id: "files", ui });
		
		this.fm = fm; // file manager
		this.ui = ui;

		this.addRef({ obj: this.fm.data, ref: "title", ignoreSettings: true });

		this.addBreak();

		this.addButton({ 
			callback: () => {
				this.loadLocal();
			},
			key: 'shift-l', 
			text: 'load local',
		});

		this.addButton({ 
			callback: () => {
				this.listLocal();
			},
			key: 'ctrl-l', 
			text: 'list local',
		});

		this.addButton({
			isFile: true, 
			callback: data => { this.load(data); },
			key: 'shift-o', 
			text: 'open file',
		});
	}

	load(data) {
		console.log('load', data);
		this.fm.load(data);
		this.ui.faces.title.update(this.fm.data.title);
	}

	loadLocal(titleFromList) {

		let title = titleFromList;
		if (!title) title = localStorage.getItem('greg-title');
		if (!title) prompt('Search title');
		if (!title) return alert('No title.');

		const localData = localStorage.getItem('greg-' + title);
		if (!localData) {
			const localSaves = Object.keys(localStorage).filter(k => k.includes('greg'));
			return alert('No data, Locals saves: ' + localSaves);
		}

		const data = JSON.parse(localData);
		this.load(data);
	}

	listLocal() {
		const m = new UIModal({
			ui: this.ui,
			title: "local saves",
		});

		const localSaves = Object.keys(localStorage)
			.filter(k => k.includes('greg') && !k.includes('title') && !k.includes("settings"));

		localSaves.forEach(title => {
			m.add(new UIButton({
				text: title.replace('greg-', ''),
				callback: () => { 
					this.loadLocal(title.replace('greg-', ''));
					m.clear();
				}
			}));
			m.add(new UIButton({
				text: "X",
				callback: () => {
					const confirmDelete = confirm(`delete local save ${title}?`);
					if (confirmDelete) {
						localStorage.removeItem(title);
						m.clear();
					}
				}
			}));
			m.addBreak();
		});
	}
}