import { Notice, Platform, Plugin } from 'obsidian';
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
		this.registerDebugCommands();
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

	private registerDebugCommands(): void {
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
