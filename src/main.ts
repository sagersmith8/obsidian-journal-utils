import { Notice, Platform, Plugin } from 'obsidian';
import { openPersonPicker } from './modals/PersonPickerModal';
import { EntityService } from './services/EntityService';
import { mergeSettings, type JournalUtilsSettings } from './settings';
import { JournalUtilsSettingTab } from './settingsTab';

export default class JournalUtilsPlugin extends Plugin {
	settings!: JournalUtilsSettings;
	entityService!: EntityService;

	async onload(): Promise<void> {
		if (!Platform.isMobile) {
			return;
		}

		await this.loadSettings();
		this.entityService = new EntityService(this.app, () => this.settings);

		this.addSettingTab(new JournalUtilsSettingTab(this.app, this));
		this.registerEntityServiceEvents();
		this.registerCommands();
	}

	onunload(): void {}

	async loadSettings(): Promise<void> {
		this.settings = mergeSettings(
			(await this.loadData()) as Partial<JournalUtilsSettings> | null,
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private registerEntityServiceEvents(): void {
		this.registerEvent(
			this.app.metadataCache.on('changed', () => {
				this.entityService.invalidateCache();
			}),
		);
		this.registerEvent(
			this.app.metadataCache.on('resolved', () => {
				this.entityService.invalidateCache();
			}),
		);
	}

	private registerCommands(): void {
		this.addCommand({
			id: 'insert-person-link',
			name: 'Insert person link',
			icon: 'user',
			editorCheckCallback: (checking, editor) => {
				if (checking) {
					return !!editor;
				}

				const sourceFile = this.app.workspace.getActiveFile();
				if (!sourceFile || !editor) {
					new Notice('Open a note to insert a person link.');
					return false;
				}

				const people = this.entityService.getPeople();
				if (people.length === 0) {
					new Notice('No people notes found.');
					return false;
				}

				openPersonPicker(this.app, people, editor, sourceFile);
				return true;
			},
		});

		this.addCommand({
			id: 'log-people-entities',
			name: 'Log people entities (debug)',
			callback: () => {
				const people = this.entityService.getPeople();
				console.log('[Journal Utils] People:', people);
				new Notice(`Logged ${people.length} people to console`);
			},
		});
	}
}
