import {
	App,
	Editor,
	FuzzyMatch,
	FuzzySuggestModal,
	Notice,
	TFile,
} from 'obsidian';
import type { EntityService } from '../services/EntityService';
import type { EntityEntry } from '../types';
import { formatWikilinkForFile } from '../utils/links';
import { sanitizeEntityName } from '../utils/paths';

export type PersonPickerItem =
	| { type: 'person'; entry: EntityEntry }
	| { type: 'create'; name: string };

export class PersonPickerModal extends FuzzySuggestModal<PersonPickerItem> {
	constructor(
		app: App,
		private entityService: EntityService,
		private entries: EntityEntry[],
		private editor: Editor,
		private sourcePath: string,
	) {
		super(app);
	}

	getItems(): PersonPickerItem[] {
		return this.entries.map((entry) => ({ type: 'person', entry }));
	}

	getItemText(item: PersonPickerItem): string {
		if (item.type === 'create') {
			return `Create new: ${item.name}`;
		}
		if (item.entry.backlinkCount > 0) {
			return `${item.entry.displayName} (${item.entry.backlinkCount})`;
		}
		return item.entry.displayName;
	}

	getSuggestions(query: string): FuzzyMatch<PersonPickerItem>[] {
		const suggestions = super.getSuggestions(query);
		const createItem = this.buildCreateItem(query);
		if (createItem) {
			suggestions.push({
				item: createItem,
				match: { score: 0, matches: [] },
			});
		}
		return suggestions;
	}

	onChooseItem(item: PersonPickerItem): void {
		if (item.type === 'create') {
			void this.createAndInsert(item.name);
			return;
		}

		this.insertLink(item.entry.file);
	}

	onClose(): void {
		super.onClose();
		this.refocusEditor();
	}

	private buildCreateItem(query: string): PersonPickerItem | null {
		const safeName = sanitizeEntityName(query);
		if (!safeName) {
			return null;
		}

		const exists = this.entries.some(
			(entry) => entry.displayName.toLowerCase() === safeName.toLowerCase(),
		);
		if (exists) {
			return null;
		}

		return { type: 'create', name: safeName };
	}

	private async createAndInsert(name: string): Promise<void> {
		try {
			const file = await this.entityService.createPerson(name);
			this.insertLink(file);
			new Notice(`Created ${name}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Could not create person: ${message}`);
		}
	}

	private insertLink(file: TFile): void {
		const wikilink = formatWikilinkForFile(
			this.app.metadataCache,
			file,
			this.sourcePath,
		);
		this.editor.replaceSelection(wikilink);
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
	entityService: EntityService,
	entries: EntityEntry[],
	editor: Editor,
	sourceFile: TFile,
): void {
	new PersonPickerModal(app, entityService, entries, editor, sourceFile.path).open();
}
