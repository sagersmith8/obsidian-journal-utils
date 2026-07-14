import { App, Modal, Notice } from 'obsidian';
import type JournalUtilsPlugin from '../main';
import type { MigrationService } from '../services/MigrationService';
import {
	summarizeMigrationPlan,
	type MigrationPlan,
	type PersonMigrationPlan,
} from '../services/migrationPlan';

export class MigrationPreviewModal extends Modal {
	private plan: MigrationPlan;

	constructor(
		app: App,
		private plugin: JournalUtilsPlugin,
		private migrationService: MigrationService,
	) {
		super(app);
		this.plan = migrationService.buildPlan();
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('journal-utils-migration-modal');

		contentEl.createEl('h2', { text: 'Migrate people folder' });
		contentEl.createEl('p', {
			text: 'Commit or sync your vault before migrating. Obsidian will update wikilinks when files move.',
			cls: 'journal-utils-migration-warning',
		});

		const summary = summarizeMigrationPlan(this.plan);
		contentEl.createEl('p', {
			text: `${summary.personCount} people, ${summary.moveCount} moves, ${summary.mergeCount} sub-notes to merge.`,
			cls: 'journal-utils-migration-summary',
		});

		if (this.plan.people.length === 0) {
			contentEl.createEl('p', {
			text: 'No migration needed. People notes already match the standard structure.',
				cls: 'journal-utils-migration-empty',
			});
			contentEl
				.createEl('button', { text: 'Close', cls: 'mod-cta' })
				.addEventListener('click', () => this.close());
			return;
		}

		const list = contentEl.createDiv({ cls: 'journal-utils-migration-list' });
		for (const person of this.plan.people) {
			this.renderPersonRow(list, person);
		}

		const actions = contentEl.createDiv({ cls: 'journal-utils-migration-actions' });
		actions
			.createEl('button', { text: 'Cancel', cls: 'mod-warning' })
			.addEventListener('click', () => this.close());
		actions
			.createEl('button', { text: 'Run migration', cls: 'mod-cta' })
			.addEventListener('click', () => void this.runMigration());
	}

	private renderPersonRow(container: HTMLElement, person: PersonMigrationPlan): void {
		const row = container.createDiv({ cls: 'journal-utils-migration-row' });
		row.createEl('strong', { text: person.personKey });

		const details: string[] = [];
		if (person.needsMove) {
			details.push(`${person.primaryPath} → ${person.targetPath}`);
		} else {
			details.push(`${person.primaryPath} (path unchanged)`);
		}
		if (person.subNotes.length > 0) {
			details.push(
				`merge ${person.subNotes.length} sub-note(s): ${person.subNotes.map((sub) => sub.heading).join(', ')}`,
			);
		}
		if (person.updateFrontmatter) {
			details.push('add type: person frontmatter');
		}

		row.createEl('p', { text: details.join(' · '), cls: 'journal-utils-migration-row-detail' });
	}

	private async runMigration(): Promise<void> {
		const button = this.contentEl.querySelector(
			'.journal-utils-migration-actions .mod-cta',
		) as HTMLButtonElement | null;
		if (button) {
			button.disabled = true;
			button.textContent = 'Migrating…';
		}

		const result = await this.migrationService.execute(this.plan);

		this.plugin.settings.migrationCompletedAt = new Date().toISOString();
		this.plugin.settings.lastMigrationLog = result.log;
		await this.plugin.saveSettings();
		this.plugin.entityService.invalidateCache();
		this.plugin.ghostService.invalidateCache();

		if (result.errors.length > 0) {
			new Notice(
				`Migration finished with ${result.errors.length} error(s). ${result.moved} moved, ${result.merged} merged.`,
			);
			console.error('[Journal Utils] Migration errors:', result.errors);
		} else {
			new Notice(
				`Migration complete: ${result.moved} moved, ${result.merged} merged, ${result.deleted} sub-notes removed.`,
			);
		}

		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
