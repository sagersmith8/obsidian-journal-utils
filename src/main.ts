import { Notice, Platform, Plugin } from 'obsidian';
import { openLocationPicker } from './modals/LocationPickerModal';
import { MigrationPreviewModal } from './modals/MigrationPreviewModal';
import { openPersonPicker } from './modals/PersonPickerModal';
import { EntityService } from './services/EntityService';
import { MentionTrackingService } from './services/MentionTrackingService';
import { MigrationService } from './services/MigrationService';
import { GhostService } from './services/GhostService';
import { TemplateService } from './services/TemplateService';
import { ensureDefaultTemplates } from './services/templateBootstrap';
import { mergeSettings, type JournalUtilsSettings } from './settings';
import { JournalUtilsSettingTab } from './settingsTab';

export default class JournalUtilsPlugin extends Plugin {
	settings!: JournalUtilsSettings;
	entityService!: EntityService;
	ghostService!: GhostService;
	migrationService!: MigrationService;
	templateService!: TemplateService;
	mentionTrackingService!: MentionTrackingService;

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
		this.migrationService = new MigrationService(this.app, () => this.settings);
		this.mentionTrackingService = new MentionTrackingService(
			this.app,
			this.entityService,
			() => this.settings,
		);

		this.addSettingTab(new JournalUtilsSettingTab(this.app, this));
		this.registerCacheInvalidationEvents();
		this.registerCommands();
		void this.bootstrapTemplates();
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

	async ignoreGhost(name: string): Promise<void> {
		const normalized = name.trim();
		if (!normalized) {
			return;
		}

		const lower = normalized.toLowerCase();
		const alreadyIgnored = this.settings.ignoredLinks.some(
			(term) => term.toLowerCase() === lower,
		);
		if (!alreadyIgnored) {
			this.settings.ignoredLinks.push(normalized);
			await this.saveSettings();
		}

		this.ghostService.invalidateCache();
	}

	private async bootstrapTemplates(): Promise<void> {
		try {
			const created = await ensureDefaultTemplates(this.app, this.settings);
			if (created.length > 0) {
				new Notice(`Journal Utils created ${created.length} template file(s).`);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.error('[Journal Utils] Template bootstrap failed:', message);
		}
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
					this.mentionTrackingService,
					this.entityService.getPeople(),
					this.entityService.getGroups(),
					this.ghostService.getGhosts(),
					editor,
					sourceFile,
					(name) => this.ignoreGhost(name),
				);
				return true;
			},
		});

		this.addCommand({
			id: 'insert-location-link',
			name: 'Insert location link',
			icon: 'map-pin',
			editorCheckCallback: (checking, editor) => {
				if (checking) {
					return !!editor;
				}

				const sourceFile = this.app.workspace.getActiveFile();
				if (!sourceFile || !editor) {
					new Notice('Open a note to insert a location link.');
					return false;
				}

				openLocationPicker(
					this.app,
					this.entityService,
					this.mentionTrackingService,
					this.entityService.getLocations(),
					this.ghostService.getGhosts(),
					editor,
					sourceFile,
					(name) => this.ignoreGhost(name),
				);
				return true;
			},
		});

		this.addCommand({
			id: 'migrate-people-folder',
			name: 'Migrate people folder to standard structure',
			icon: 'folder-sync',
			callback: () => {
				new Notice('Commit or sync your vault before migrating.');
				new MigrationPreviewModal(
					this.app,
					this,
					this.migrationService,
				).open();
			},
		});

		this.addCommand({
			id: 'ensure-default-templates',
			name: 'Ensure default templates in vault',
			icon: 'file-plus',
			callback: () => void this.bootstrapTemplates(),
		});
	}
}
