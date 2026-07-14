import { App, PluginSettingTab, Setting } from 'obsidian';
import type JournalUtilsPlugin from './main';

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
			text: 'Mobile-only plugin. Configure people, group, and location link pickers.',
		});

		new Setting(containerEl)
			.setName('People folder')
			.setDesc('Vault folder for person notes.')
			.addText((text) =>
				text
					.setPlaceholder('people')
					.setValue(this.plugin.settings.peopleFolder)
					.onChange(async (value) => {
						this.plugin.settings.peopleFolder = value.trim() || 'people';
						await this.plugin.saveSettings();
					}),
			);
	}
}
