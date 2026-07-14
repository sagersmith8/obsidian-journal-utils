import { App, Modal, TFile } from 'obsidian';

export interface ReclassifyPersonContext {
	groupName: string;
	personFile: TFile;
	onConvert: () => Promise<void>;
	onCancel?: () => void;
}

export class ReclassifyPersonModal extends Modal {
	constructor(
		app: App,
		private ctx: ReclassifyPersonContext,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('journal-utils-reclassify-modal');

		contentEl.createEl('h2', { text: `Convert ${this.ctx.groupName} to a group?` });
		contentEl.createEl('p', {
			text: `A person note already exists at ${this.ctx.personFile.path}. Convert it to a group note with your selected members? Existing note content will be kept.`,
			cls: 'journal-utils-reclassify-desc',
		});

		const actions = contentEl.createDiv({ cls: 'journal-utils-reclassify-actions' });
		actions
			.createEl('button', { text: 'Cancel', cls: 'mod-warning' })
			.addEventListener('click', () => {
				this.ctx.onCancel?.();
				this.close();
			});
		actions
			.createEl('button', { text: 'Convert to group', cls: 'mod-cta' })
			.addEventListener('click', () => void this.convert());
	}

	private async convert(): Promise<void> {
		await this.ctx.onConvert();
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export function openReclassifyPersonModal(app: App, ctx: ReclassifyPersonContext): void {
	new ReclassifyPersonModal(app, ctx).open();
}
