import {
	App,
	Editor,
	FuzzyMatch,
	FuzzySuggestModal,
	Notice,
	TFile,
} from 'obsidian';
import type { EntityService } from '../services/EntityService';
import type { EntityEntry, GhostEntry } from '../types';
import { buildWikilink, formatWikilinkForFile } from '../utils/links';
import { sanitizeEntityName } from '../utils/paths';

export type PersonPickerItem =
	| { type: 'header'; label: string }
	| { type: 'person'; entry: EntityEntry }
	| { type: 'ghost'; ghost: GhostEntry }
	| { type: 'create'; name: string };

export class PersonPickerModal extends FuzzySuggestModal<PersonPickerItem> {
	constructor(
		app: App,
		private entityService: EntityService,
		private people: EntityEntry[],
		private ghosts: GhostEntry[],
		private editor: Editor,
		private sourcePath: string,
	) {
		super(app);
	}

	getItems(): PersonPickerItem[] {
		return [
			...this.people.map((entry) => ({ type: 'person' as const, entry })),
			...this.ghosts.map((ghost) => ({ type: 'ghost' as const, ghost })),
		];
	}

	getItemText(item: PersonPickerItem): string {
		if (item.type === 'header') {
			return item.label;
		}
		if (item.type === 'create') {
			return `Create new: ${item.name}`;
		}
		if (item.type === 'ghost') {
			return `${item.ghost.name} (${item.ghost.mentionCount})`;
		}
		if (item.entry.backlinkCount > 0) {
			return `${item.entry.displayName} (${item.entry.backlinkCount})`;
		}
		return item.entry.displayName;
	}

	renderSuggestion(suggestion: FuzzyMatch<PersonPickerItem>, el: HTMLElement): void {
		const item = suggestion.item;
		if (item.type === 'header') {
			el.addClass('journal-utils-picker-header');
			el.setText(item.label);
			return;
		}
		if (item.type === 'ghost') {
			el.addClass('journal-utils-picker-ghost');
		}
		super.renderSuggestion(suggestion, el);
	}

	getSuggestions(query: string): FuzzyMatch<PersonPickerItem>[] {
		const peopleItems = this.people.map(
			(entry): PersonPickerItem => ({ type: 'person', entry }),
		);
		const ghostItems = this.ghosts.map(
			(ghost): PersonPickerItem => ({ type: 'ghost', ghost }),
		);

		const peopleSuggestions = this.matchItems(peopleItems, query);
		const ghostSuggestions = this.matchItems(ghostItems, query);
		const suggestions: FuzzyMatch<PersonPickerItem>[] = [];

		if (peopleSuggestions.length > 0) {
			if (!query) {
				suggestions.push({
					item: { type: 'header', label: 'People' },
					match: { score: 0, matches: [] },
				});
			}
			suggestions.push(...peopleSuggestions);
		}

		if (ghostSuggestions.length > 0) {
			if (!query) {
				suggestions.push({
					item: { type: 'header', label: 'Mentioned, no profile' },
					match: { score: 0, matches: [] },
				});
			}
			suggestions.push(...ghostSuggestions);
		}

		const createItem = this.buildCreateItem(query);
		if (createItem) {
			suggestions.push({
				item: createItem,
				match: { score: 0, matches: [] },
			});
		}

		return suggestions;
	}

	onChooseItem(item: PersonPickerItem, _evt: MouseEvent | KeyboardEvent): void {
		if (item.type === 'header') {
			return;
		}
		if (item.type === 'create') {
			void this.createAndInsert(item.name);
			return;
		}
		if (item.type === 'ghost') {
			this.insertGhostLink(item.ghost.name);
			return;
		}

		this.insertLink(item.entry.file);
	}

	onClose(): void {
		super.onClose();
		this.refocusEditor();
	}

	private matchItems(
		items: PersonPickerItem[],
		query: string,
	): FuzzyMatch<PersonPickerItem>[] {
		const trimmed = query.trim().toLowerCase();
		const filtered = trimmed
			? items.filter((item) => this.getItemText(item).toLowerCase().includes(trimmed))
			: items;

		return filtered.map((item) => ({
			item,
			match: { score: 1, matches: [] },
		}));
	}

	private buildCreateItem(query: string): PersonPickerItem | null {
		const safeName = sanitizeEntityName(query);
		if (!safeName) {
			return null;
		}

		const lower = safeName.toLowerCase();
		const exists =
			this.people.some((entry) => entry.displayName.toLowerCase() === lower) ||
			this.ghosts.some((ghost) => ghost.name.toLowerCase() === lower);

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

	private insertGhostLink(name: string): void {
		this.editor.replaceSelection(buildWikilink(name));
		this.refocusEditor();
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
	people: EntityEntry[],
	ghosts: GhostEntry[],
	editor: Editor,
	sourceFile: TFile,
): void {
	new PersonPickerModal(
		app,
		entityService,
		people,
		ghosts,
		editor,
		sourceFile.path,
	).open();
}
