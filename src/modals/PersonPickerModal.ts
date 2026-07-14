import { App, Editor, FuzzySuggestModal, TFile } from 'obsidian';
import type { EntityEntry } from '../types';
import { formatWikilinkForFile } from '../utils/links';

export class PersonPickerModal extends FuzzySuggestModal<EntityEntry> {
	constructor(
		app: App,
		private entries: EntityEntry[],
		private editor: Editor,
		private sourcePath: string,
	) {
		super(app);
	}

	getItems(): EntityEntry[] {
		return this.entries;
	}

	getItemText(entry: EntityEntry): string {
		if (entry.backlinkCount > 0) {
			return `${entry.displayName} (${entry.backlinkCount})`;
		}
		return entry.displayName;
	}

	onChooseItem(entry: EntityEntry): void {
		const wikilink = formatWikilinkForFile(
			this.app.metadataCache,
			entry.file,
			this.sourcePath,
		);
		this.editor.replaceSelection(wikilink);
		this.refocusEditor();
	}

	onClose(): void {
		super.onClose();
		this.refocusEditor();
	}

	private refocusEditor(): void {
		requestAnimationFrame(() => {
			this.editor.focus();
		});
	}
}

export function openPersonPicker(
	app: App,
	entries: EntityEntry[],
	editor: Editor,
	sourceFile: TFile,
): void {
	new PersonPickerModal(app, entries, editor, sourceFile.path).open();
}
