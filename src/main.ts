import { Notice, Platform, Plugin } from 'obsidian';
import { openLocationPicker } from './modals/LocationPickerModal';
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
			id: 'log-people-entities',
			name: 'Log people entities (debug)',
			callback: () => {
				const people = this.entityService.getPeople();
				console.log('[Journal Utils] People:', people);
				new Notice(`Logged ${people.length} people to console`);
			},
		});

		this.addCommand({
			id: 'log-groups-entities',
			name: 'Log group entities (debug)',
			callback: () => {
				const groups = this.entityService.getGroups();
				console.log('[Journal Utils] Groups:', groups);
				new Notice(`Logged ${groups.length} groups to console`);
			},
		});

		this.addCommand({
			id: 'log-location-entities',
			name: 'Log location entities (debug)',
			callback: () => {
				const locations = this.entityService.getLocations();
				console.log('[Journal Utils] Locations:', locations);
				new Notice(`Logged ${locations.length} locations to console`);
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
