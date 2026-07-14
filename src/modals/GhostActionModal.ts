import { App, Editor, Modal, Notice, Setting, TFile } from 'obsidian';
import { openMemberPicker } from './MemberPickerModal';
import type { EntityService } from '../services/EntityService';
import type { MentionTrackingService } from '../services/MentionTrackingService';
import type { EntityEntry, GhostEntry } from '../types';
import { buildWikilink, formatWikilinkForFile } from '../utils/links';
import { showMentionTrackNotice } from '../utils/mentionNotices';
import type { MentionTrackResult } from '../services/MentionTrackingService';

export interface GhostActionContext {
	entityService: EntityService;
	people: EntityEntry[];
	ghosts: GhostEntry[];
	editor: Editor;
	sourceFile: TFile;
	mentionTrackingService: MentionTrackingService;
	ignoreGhost: (name: string) => Promise<void>;
}

export class GhostActionModal extends Modal {
	constructor(
		app: App,
		private ghost: GhostEntry,
		private ctx: GhostActionContext,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('journal-utils-ghost-action-modal');

		new Setting(contentEl).setName(this.ghost.name).setHeading();
		contentEl.createEl('p', {
			text: `${this.ghost.mentionCount} mention(s) in your vault, no profile yet.`,
			cls: 'journal-utils-ghost-action-desc',
		});

		this.addAction('Insert link only', () => this.insertLinkOnly());
		this.addAction('Create person note', () => void this.createPerson());
		this.addAction('Create location note', () => void this.createLocation());
		this.addAction('Create as group', () => this.createAsGroup());
		this.addAction('Ignore', () => void this.ignore(), true);
	}

	private addAction(label: string, onClick: () => void, warning = false): void {
		const button = this.contentEl.createEl('button', {
			text: label,
			cls: warning
				? 'mod-warning journal-utils-ghost-action-btn'
				: 'mod-cta journal-utils-ghost-action-btn',
		});
		button.addEventListener('click', onClick);
	}

	private insertLinkOnly(): void {
		this.ctx.editor.replaceSelection(buildWikilink(this.ghost.name));
		this.refocusEditor();
		this.close();
	}

	private createAsGroup(): void {
		this.close();
		openMemberPicker(this.app, {
			groupName: this.ghost.name,
			people: this.ctx.people,
			ghosts: this.ctx.ghosts,
			entityService: this.ctx.entityService,
			editor: this.ctx.editor,
			sourceFile: this.ctx.sourceFile,
			mentionTrackingService: this.ctx.mentionTrackingService,
			onDone: () => this.refocusEditor(),
		});
	}

	private async createPerson(): Promise<void> {
		await this.createAndInsert(
			() => this.ctx.entityService.createPerson(this.ghost.name),
			(file) => this.ctx.mentionTrackingService.trackPeople(this.ctx.sourceFile, [file]),
			'people',
		);
	}

	private async createLocation(): Promise<void> {
		await this.createAndInsert(
			() => this.ctx.entityService.createLocation(this.ghost.name),
			(file) => this.ctx.mentionTrackingService.trackLocation(this.ctx.sourceFile, file),
			'locations',
		);
	}

	private async createAndInsert(
		create: () => Promise<TFile>,
		track: (file: TFile) => Promise<MentionTrackResult>,
		listKey: 'people' | 'locations',
	): Promise<void> {
		try {
			const file = await create();
			const wikilink = formatWikilinkForFile(
				this.app.metadataCache,
				file,
				this.ctx.sourceFile.path,
			);
			this.ctx.editor.replaceSelection(wikilink);
			const result = await track(file);
			showMentionTrackNotice(result, listKey);
			new Notice(`Created ${file.basename}`);
			this.refocusEditor();
			this.close();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Could not create note: ${message}`);
		}
	}

	private async ignore(): Promise<void> {
		await this.ctx.ignoreGhost(this.ghost.name);
		new Notice(`Ignored ${this.ghost.name}`);
		this.refocusEditor();
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
		this.refocusEditor();
	}

	private refocusEditor(): void {
		window.requestAnimationFrame(() => {
			this.ctx.editor.focus();
		});
	}
}
