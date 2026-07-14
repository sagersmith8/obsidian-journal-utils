import {
	App,
	Editor,
	FuzzyMatch,
	FuzzySuggestModal,
	Notice,
	TFile,
} from 'obsidian';
import { GhostActionModal } from './GhostActionModal';
import type { EntityService } from '../services/EntityService';
import type { MentionTrackingService } from '../services/MentionTrackingService';
import type { EntityEntry, GhostEntry } from '../types';
import { formatWikilinkForFile } from '../utils/links';
import { sanitizeEntityName } from '../utils/paths';

export type LocationPickerItem =
	| { type: 'header'; label: string }
	| { type: 'location'; entry: EntityEntry }
	| { type: 'ghost'; ghost: GhostEntry }
	| { type: 'create'; name: string };

export class LocationPickerModal extends FuzzySuggestModal<LocationPickerItem> {
	constructor(
		app: App,
		private entityService: EntityService,
		private locations: EntityEntry[],
		private ghosts: GhostEntry[],
		private editor: Editor,
		private sourceFile: TFile,
		private mentionTrackingService: MentionTrackingService,
		private ignoreGhost: (name: string) => Promise<void>,
	) {
		super(app);
	}

	private get sourcePath(): string {
		return this.sourceFile.path;
	}

	getItems(): LocationPickerItem[] {
		return [
			...this.locations.map((entry) => ({ type: 'location' as const, entry })),
			...this.ghosts.map((ghost) => ({ type: 'ghost' as const, ghost })),
		];
	}

	getItemText(item: LocationPickerItem): string {
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

	renderSuggestion(suggestion: FuzzyMatch<LocationPickerItem>, el: HTMLElement): void {
		const item = suggestion.item;
		if (item.type === 'header') {
			el.addClass('journal-utils-picker-header');
			el.setText(item.label);
			return;
		}
		if (item.type === 'ghost') {
			el.addClass('journal-utils-picker-ghost');
		}
		if (item.type === 'location') {
			el.addClass('journal-utils-picker-location');
			if (!this.entityService.isPrimaryLocationNote(item.entry.file)) {
				el.addClass('journal-utils-picker-legacy');
			}
		}
		super.renderSuggestion(suggestion, el);
	}

	getSuggestions(query: string): FuzzyMatch<LocationPickerItem>[] {
		const locationItems = this.locations.map(
			(entry): LocationPickerItem => ({ type: 'location', entry }),
		);
		const legacyItem = this.getLegacyLocationItem(query);
		if (legacyItem) {
			locationItems.unshift(legacyItem);
		}

		const ghostItems = this.ghosts.map(
			(ghost): LocationPickerItem => ({ type: 'ghost', ghost }),
		);

		const locationSuggestions = this.matchItems(locationItems, query);
		const ghostSuggestions = this.matchItems(ghostItems, query);
		const suggestions: FuzzyMatch<LocationPickerItem>[] = [];

		if (locationSuggestions.length > 0) {
			if (!query) {
				suggestions.push({
					item: { type: 'header', label: 'Locations' },
					match: { score: 0, matches: [] },
				});
			}
			suggestions.push(...locationSuggestions);
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

	onChooseItem(item: LocationPickerItem, _evt: MouseEvent | KeyboardEvent): void {
		if (item.type === 'header') {
			return;
		}
		if (item.type === 'create') {
			void this.createAndInsert(item.name);
			return;
		}
		if (item.type === 'ghost') {
			new GhostActionModal(this.app, item.ghost, {
				entityService: this.entityService,
				people: this.entityService.getPeople(),
				ghosts: this.ghosts,
				editor: this.editor,
				sourceFile: this.sourceFile,
				mentionTrackingService: this.mentionTrackingService,
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
		items: LocationPickerItem[],
		query: string,
	): FuzzyMatch<LocationPickerItem>[] {
		const trimmed = query.trim().toLowerCase();
		const filtered = trimmed
			? items.filter((item) => this.getItemText(item).toLowerCase().includes(trimmed))
			: items;

		return filtered.map((item) => ({
			item,
			match: { score: 1, matches: [] },
		}));
	}

	private buildCreateItem(query: string): LocationPickerItem | null {
		const safeName = sanitizeEntityName(query);
		if (!safeName) {
			return null;
		}

		const lower = safeName.toLowerCase();
		const exists =
			this.locations.some((entry) => entry.displayName.toLowerCase() === lower) ||
			this.ghosts.some((ghost) => ghost.name.toLowerCase() === lower) ||
			this.entityService.findLocationNoteByName(safeName);

		if (exists) {
			return null;
		}

		return { type: 'create', name: safeName };
	}

	private getLegacyLocationItem(query: string): LocationPickerItem | null {
		const safeName = sanitizeEntityName(query);
		if (!safeName) {
			return null;
		}

		const file = this.entityService.findLocationNoteByName(safeName);
		if (!file || this.isListedInPicker(file)) {
			return null;
		}

		if (!file.basename.toLowerCase().includes(query.trim().toLowerCase())) {
			return null;
		}

		return {
			type: 'location',
			entry: this.entityService.getEntryForFile(file, 'location'),
		};
	}

	private isListedInPicker(file: TFile): boolean {
		return this.locations.some((entry) => entry.file.path === file.path);
	}

	private async createAndInsert(name: string): Promise<void> {
		try {
			const file = await this.entityService.createLocation(name);
			this.insertLink(file);
			new Notice(`Created ${name}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Could not create location: ${message}`);
		}
	}

	private insertLink(file: TFile): void {
		const wikilink = formatWikilinkForFile(
			this.app.metadataCache,
			file,
			this.sourcePath,
		);
		this.editor.replaceSelection(wikilink);
		void this.mentionTrackingService.trackLocation(this.sourceFile, file);
		this.refocusEditor();
	}

	private refocusEditor(): void {
		requestAnimationFrame(() => {
			this.editor.focus();
		});
	}
}

export function openLocationPicker(
	app: App,
	entityService: EntityService,
	mentionTrackingService: MentionTrackingService,
	locations: EntityEntry[],
	ghosts: GhostEntry[],
	editor: Editor,
	sourceFile: TFile,
	ignoreGhost: (name: string) => Promise<void>,
): void {
	new LocationPickerModal(
		app,
		entityService,
		locations,
		ghosts,
		editor,
		sourceFile,
		mentionTrackingService,
		ignoreGhost,
	).open();
}
