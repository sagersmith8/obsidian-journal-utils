import {
	App,
	Editor,
	FuzzyMatch,
	FuzzySuggestModal,
	Notice,
	TFile,
} from 'obsidian';
import { GhostActionModal } from './GhostActionModal';
import { openMemberPicker } from './MemberPickerModal';
import type { EntityService } from '../services/EntityService';
import type { EntityEntry, GhostEntry } from '../types';
import { formatWikilinkForFile } from '../utils/links';
import { sanitizeEntityName } from '../utils/paths';

export type PersonPickerItem =
	| { type: 'header'; label: string }
	| { type: 'person'; entry: EntityEntry }
	| { type: 'group'; entry: EntityEntry }
	| { type: 'ghost'; ghost: GhostEntry }
	| { type: 'create'; name: string }
	| { type: 'create-group'; name: string };

export class PersonPickerModal extends FuzzySuggestModal<PersonPickerItem> {
	constructor(
		app: App,
		private entityService: EntityService,
		private people: EntityEntry[],
		private groups: EntityEntry[],
		private ghosts: GhostEntry[],
		private editor: Editor,
		private sourcePath: string,
		private ignoreGhost: (name: string) => Promise<void>,
	) {
		super(app);
	}

	getItems(): PersonPickerItem[] {
		return [
			...this.people.map((entry) => ({ type: 'person' as const, entry })),
			...this.groups.map((entry) => ({ type: 'group' as const, entry })),
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
		if (item.type === 'create-group') {
			return `Convert to group: ${item.name}`;
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
		if (item.type === 'group' || item.type === 'create-group') {
			el.addClass('journal-utils-picker-group');
		}
		super.renderSuggestion(suggestion, el);
	}

	getSuggestions(query: string): FuzzyMatch<PersonPickerItem>[] {
		const peopleItems = this.people.map(
			(entry): PersonPickerItem => ({ type: 'person', entry }),
		);
		const groupItems = this.groups.map(
			(entry): PersonPickerItem => ({ type: 'group', entry }),
		);
		const ghostItems = this.ghosts.map(
			(ghost): PersonPickerItem => ({ type: 'ghost', ghost }),
		);

		const peopleSuggestions = this.matchItems(peopleItems, query);
		const groupSuggestions = this.matchItems(groupItems, query);
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

		if (groupSuggestions.length > 0) {
			if (!query) {
				suggestions.push({
					item: { type: 'header', label: 'Groups' },
					match: { score: 0, matches: [] },
				});
			}
			suggestions.push(...groupSuggestions);
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

		const createGroupItem = this.buildCreateGroupItem(query);
		if (createGroupItem) {
			suggestions.push({
				item: createGroupItem,
				match: { score: 0, matches: [] },
			});
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
		if (item.type === 'create-group') {
			this.openGroupMemberPicker(item.name);
			return;
		}
		if (item.type === 'ghost') {
			new GhostActionModal(this.app, item.ghost, {
				entityService: this.entityService,
				people: this.people,
				ghosts: this.ghosts,
				editor: this.editor,
				sourcePath: this.sourcePath,
				ignoreGhost: this.ignoreGhost,
			}).open();
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

	private buildCreateGroupItem(query: string): PersonPickerItem | null {
		const safeName = sanitizeEntityName(query);
		if (!safeName) {
			return null;
		}

		const lower = safeName.toLowerCase();
		const personExists = this.people.some(
			(entry) => entry.displayName.toLowerCase() === lower,
		);
		const groupExists = this.groups.some(
			(entry) => entry.displayName.toLowerCase() === lower,
		);

		if (!personExists || groupExists) {
			return null;
		}

		return { type: 'create-group', name: safeName };
	}

	private buildCreateItem(query: string): PersonPickerItem | null {
		const safeName = sanitizeEntityName(query);
		if (!safeName) {
			return null;
		}

		const lower = safeName.toLowerCase();
		const exists =
			this.people.some((entry) => entry.displayName.toLowerCase() === lower) ||
			this.groups.some((entry) => entry.displayName.toLowerCase() === lower) ||
			this.ghosts.some((ghost) => ghost.name.toLowerCase() === lower);

		if (exists) {
			return null;
		}

		return { type: 'create', name: safeName };
	}

	private openGroupMemberPicker(groupName: string): void {
		openMemberPicker(this.app, {
			groupName,
			people: this.people,
			ghosts: this.ghosts,
			entityService: this.entityService,
			editor: this.editor,
			sourcePath: this.sourcePath,
			onDone: () => this.refocusEditor(),
		});
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
	people: EntityEntry[],
	groups: EntityEntry[],
	ghosts: GhostEntry[],
	editor: Editor,
	sourceFile: TFile,
	ignoreGhost: (name: string) => Promise<void>,
): void {
	new PersonPickerModal(
		app,
		entityService,
		people,
		groups,
		ghosts,
		editor,
		sourceFile.path,
		ignoreGhost,
	).open();
}
