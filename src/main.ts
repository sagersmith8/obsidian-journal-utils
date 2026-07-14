import { Notice, Platform, Plugin } from 'obsidian';
import { openPersonPicker } from './modals/PersonPickerModal';
import { EntityService } from './services/EntityService';
import { GhostService } from './services/GhostService';
import { TemplateService } from './services/TemplateService';
import { mergeSettings, type JournalUtilsSettings } from './settings';
import { JournalUtilsSettingTab } from './settingsTab';

export default class JournalUtilsPlugin extends Plugin {
	settings!: JournalUtilsSettings;
	entityService!: EntityService;
	ghostService!: GhostService;
	templateService!: TemplateService;

	async onload(): Promise<void> {
		if (!Platform.isMobile) {
			return;
		}

		await this.loadSettings();
		this.templateService = new TemplateService(this.app);
		this.entityService = new EntityService(
			this.app,
			() => this.settings,
			this.templateService,
		);
		this.ghostService = new GhostService(this.app, () => this.settings);

		this.addSettingTab(new JournalUtilsSettingTab(this.app, this));
		this.registerCacheInvalidationEvents();
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

	private registerCacheInvalidationEvents(): void {
		const invalidate = (): void => {
			this.entityService.invalidateCache();
			this.ghostService.invalidateCache();
		};

		this.registerEvent(this.app.metadataCache.on('changed', invalidate));
		this.registerEvent(this.app.metadataCache.on('resolved', invalidate));
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

				openPersonPicker(
					this.app,
					this.entityService,
					this.entityService.getPeople(),
					this.ghostService.getGhosts(),
					editor,
					sourceFile,
				);
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

		this.addCommand({
			id: 'log-ghost-entities',
			name: 'Log ghost mentions (debug)',
			callback: () => {
				const ghosts = this.ghostService.getGhosts();
				console.log('[Journal Utils] Ghosts:', ghosts);
				new Notice(`Logged ${ghosts.length} ghosts to console`);
			},
		});
	}
}
