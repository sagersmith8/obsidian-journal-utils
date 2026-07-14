import { App, PluginSettingTab, Setting } from 'obsidian';
import type JournalUtilsPlugin from './main';
import { DEFAULT_SETTINGS } from './settings';

export class JournalUtilsSettingTab extends PluginSettingTab {
	plugin: JournalUtilsPlugin;

	constructor(app: App, plugin: JournalUtilsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Journal Utils' });
		containerEl.createEl('p', {
			text: 'Mobile-only plugin for people, group, and location wikilinks while journaling.',
		});

		containerEl.createEl('h3', { text: 'Mobile toolbar' });
		containerEl.createEl('p', {
			text: 'Settings → Mobile → Manage toolbar options. Add Insert person link and Insert location link.',
		});

		containerEl.createEl('h3', { text: 'Folders' });
		this.addFolderSetting('People folder', 'peopleFolder', 'Primary person notes.');
		this.addFolderSetting('Groups folder', 'groupsFolder', 'Group notes with members.');
		this.addFolderSetting('Locations folder', 'locationsFolder', 'Primary location notes.');

		containerEl.createEl('h3', { text: 'Templates' });
		this.addTextSetting(
			'Person template',
			'personTemplate',
			'Vault path used when creating a person note.',
		);
		this.addTextSetting(
			'Group template',
			'groupTemplate',
			'Vault path used when creating a group note.',
		);
		this.addTextSetting(
			'Location template',
			'locationTemplate',
			'Vault path used when creating a location note.',
		);

		containerEl.createEl('h3', { text: 'Picker behavior' });
		new Setting(containerEl)
			.setName('Sort by backlinks')
			.setDesc('Show frequently linked people and locations first.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.sortByBacklinks)
					.onChange(async (value) => {
						this.plugin.settings.sortByBacklinks = value;
						await this.plugin.saveSettings();
					}),
			);

		containerEl.createEl('h3', { text: 'Migration' });
		containerEl.createEl('p', {
			text: this.plugin.settings.migrationCompletedAt
				? `Last migration: ${this.plugin.settings.migrationCompletedAt}`
				: 'People folder has not been migrated yet.',
		});

		containerEl.createEl('h3', { text: 'Ghost mentions' });
		new Setting(containerEl)
			.setName('Ghost blocklist')
			.setDesc(
				'Comma-separated wikilink names to hide from ghost lists (journal section headings, etc.).',
			)
			.addTextArea((text) => {
				text.inputEl.rows = 4;
				text.setValue(this.plugin.settings.ghostBlocklist.join(', '));
				text.onChange(async (value) => {
					this.plugin.settings.ghostBlocklist = value
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean);
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Clear ignored ghosts')
			.setDesc(
				`${this.plugin.settings.ignoredLinks.length} name(s) dismissed via the picker.`,
			)
			.addButton((button) =>
				button.setButtonText('Clear').setWarning().onClick(async () => {
					this.plugin.settings.ignoredLinks = [];
					await this.plugin.saveSettings();
					this.plugin.ghostService.invalidateCache();
					this.display();
				}),
			);
	}

	private addFolderSetting(
		name: string,
		key: 'peopleFolder' | 'groupsFolder' | 'locationsFolder',
		desc: string,
	): void {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(desc)
			.addText((text) =>
				text
					.setValue(this.plugin.settings[key])
					.onChange(async (value) => {
						this.plugin.settings[key] = value.trim() || DEFAULT_SETTINGS[key];
						await this.plugin.saveSettings();
					}),
			);
	}

	private addTextSetting(
		name: string,
		key: 'personTemplate' | 'groupTemplate' | 'locationTemplate',
		desc: string,
	): void {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(desc)
			.addText((text) =>
				text
					.setValue(this.plugin.settings[key])
					.onChange(async (value) => {
						this.plugin.settings[key] = value.trim() || DEFAULT_SETTINGS[key];
						await this.plugin.saveSettings();
					}),
			);
	}
}
