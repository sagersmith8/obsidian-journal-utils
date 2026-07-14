import { App, Editor, Modal, Notice } from 'obsidian';
import type { EntityService } from '../services/EntityService';
import type { EntityEntry, GhostEntry } from '../types';
import { formatWikilinkForFile } from '../utils/links';
import { sanitizeEntityName } from '../utils/paths';

type MemberListItem =
	| { type: 'person'; name: string }
	| { type: 'ghost'; name: string; mentionCount: number }
	| { type: 'create'; name: string };

export interface MemberPickerContext {
	groupName: string;
	people: EntityEntry[];
	ghosts: GhostEntry[];
	entityService: EntityService;
	editor: Editor;
	sourcePath: string;
	onDone?: () => void;
}

export class MemberPickerModal extends Modal {
	private selected = new Map<string, string>();
	private searchQuery = '';
	private listEl!: HTMLElement;
	private chipsEl!: HTMLElement;

	constructor(
		app: App,
		private ctx: MemberPickerContext,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('journal-utils-member-picker');

		contentEl.createEl('h2', { text: `Create group: ${this.ctx.groupName}` });
		contentEl.createEl('p', {
			text: 'Select members. Missing person notes are created when you confirm.',
			cls: 'journal-utils-member-picker-desc',
		});

		this.chipsEl = contentEl.createDiv({ cls: 'journal-utils-member-chips' });
		this.renderChips();

		const searchWrap = contentEl.createDiv({ cls: 'journal-utils-member-search' });
		const searchInput = searchWrap.createEl('input', {
			type: 'search',
			placeholder: 'Search people and ghosts…',
		});
		searchInput.addEventListener('input', () => {
			this.searchQuery = searchInput.value;
			this.renderList();
		});

		this.listEl = contentEl.createDiv({ cls: 'journal-utils-member-list' });
		this.renderList();

		const actions = contentEl.createDiv({ cls: 'journal-utils-member-actions' });
		actions
			.createEl('button', { text: 'Cancel', cls: 'mod-warning' })
			.addEventListener('click', () => this.close());
		actions
			.createEl('button', { text: 'Create group', cls: 'mod-cta' })
			.addEventListener('click', () => void this.confirm());
	}

	onClose(): void {
		this.contentEl.empty();
		this.ctx.onDone?.();
	}

	private renderChips(): void {
		this.chipsEl.empty();
		if (this.selected.size === 0) {
			this.chipsEl.createEl('span', {
			text: 'No members selected yet',
			cls: 'journal-utils-member-chips-empty',
			});
			return;
		}

		for (const name of this.selected.values()) {
			const chip = this.chipsEl.createSpan({ cls: 'journal-utils-member-chip' });
			chip.createSpan({ text: name });
			const remove = chip.createEl('button', { text: '×', cls: 'journal-utils-member-chip-remove' });
			remove.addEventListener('click', (event) => {
				event.stopPropagation();
				this.toggleMember(name);
			});
		}
	}

	private renderList(): void {
		this.listEl.empty();
		const items = this.getFilteredItems();

		if (items.length === 0) {
			this.listEl.createEl('p', {
				text: 'No matches. Try a different search.',
				cls: 'journal-utils-member-list-empty',
			});
			return;
		}

		for (const item of items) {
			const row = this.listEl.createDiv({ cls: 'journal-utils-member-row' });
			const label = this.getItemLabel(item);
			const isSelected = this.isSelected(this.getItemName(item));

			if (isSelected) {
				row.addClass('is-selected');
			}
			if (item.type === 'ghost') {
				row.addClass('is-ghost');
			}

			row.createSpan({ text: label });
			row.addEventListener('click', () => {
				this.toggleMember(this.getItemName(item));
			});
		}
	}

	private getFilteredItems(): MemberListItem[] {
		const query = this.searchQuery.trim().toLowerCase();
		const items: MemberListItem[] = [];

		for (const person of this.ctx.people) {
			if (!query || person.displayName.toLowerCase().includes(query)) {
				items.push({ type: 'person', name: person.displayName });
			}
		}

		for (const ghost of this.ctx.ghosts) {
			if (ghost.name.toLowerCase() === this.ctx.groupName.toLowerCase()) {
				continue;
			}
			if (!query || ghost.name.toLowerCase().includes(query)) {
				items.push({ type: 'ghost', name: ghost.name, mentionCount: ghost.mentionCount });
			}
		}

		const createItem = this.buildCreateItem(this.searchQuery);
		if (createItem) {
			items.push(createItem);
		}

		return items;
	}

	private buildCreateItem(query: string): MemberListItem | null {
		const safeName = sanitizeEntityName(query);
		if (!safeName) {
			return null;
		}

		const lower = safeName.toLowerCase();
		if (lower === this.ctx.groupName.toLowerCase()) {
			return null;
		}

		const exists =
			this.ctx.people.some((entry) => entry.displayName.toLowerCase() === lower) ||
			this.ctx.ghosts.some((ghost) => ghost.name.toLowerCase() === lower) ||
			this.isSelected(safeName);

		if (exists) {
			return null;
		}

		return { type: 'create', name: safeName };
	}

	private getItemLabel(item: MemberListItem): string {
		if (item.type === 'create') {
			return `Add new person: ${item.name}`;
		}
		if (item.type === 'ghost') {
			return `${item.name} (${item.mentionCount}) — ghost`;
		}
		return item.name;
	}

	private getItemName(item: MemberListItem): string {
		return item.name;
	}

	private isSelected(name: string): boolean {
		return this.selected.has(name.toLowerCase());
	}

	private toggleMember(name: string): void {
		const key = name.toLowerCase();
		if (this.selected.has(key)) {
			this.selected.delete(key);
		} else {
			this.selected.set(key, name);
		}
		this.renderChips();
		this.renderList();
	}

	private async confirm(): Promise<void> {
		if (this.selected.size === 0) {
			new Notice('Select at least one member.');
			return;
		}

		try {
			const members = Array.from(this.selected.values());
			const file = await this.ctx.entityService.createGroup(this.ctx.groupName, members);
			const wikilink = formatWikilinkForFile(
				this.app.metadataCache,
				file,
				this.ctx.sourcePath,
			);
			this.ctx.editor.replaceSelection(wikilink);
			new Notice(`Created group ${file.basename}`);
			this.close();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Could not create group: ${message}`);
		}
	}
}

export function openMemberPicker(app: App, ctx: MemberPickerContext): void {
	new MemberPickerModal(app, ctx).open();
}
