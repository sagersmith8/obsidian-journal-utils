import { App, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import type JournalUtilsPlugin from './main';
import { DEFAULT_SETTINGS } from './settings';

export class JournalUtilsSettingTab extends PluginSettingTab {
	plugin: JournalUtilsPlugin;

	constructor(app: App, plugin: JournalUtilsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const migrationDesc = this.plugin.settings.migrationCompletedAt
			? `Last migration: ${this.plugin.settings.migrationCompletedAt}`
			: 'People folder has not been migrated yet.';

		return [
			{
				name: 'Mobile toolbar',
				desc: 'Settings → Mobile → Manage toolbar options. Add Insert person link and Insert location link.',
				searchable: false,
			},
			{
				type: 'group',
				heading: 'Folders',
				items: [
					{
						name: 'People folder',
						desc: 'Primary person notes.',
						control: {
							type: 'text',
							key: 'peopleFolder',
							defaultValue: DEFAULT_SETTINGS.peopleFolder,
						},
					},
					{
						name: 'Groups folder',
						desc: 'Group notes with members.',
						control: {
							type: 'text',
							key: 'groupsFolder',
							defaultValue: DEFAULT_SETTINGS.groupsFolder,
						},
					},
					{
						name: 'Locations folder',
						desc: 'Primary location notes.',
						control: {
							type: 'text',
							key: 'locationsFolder',
							defaultValue: DEFAULT_SETTINGS.locationsFolder,
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'Templates',
				items: [
					{
						name: 'Person template',
						desc: 'Vault path used when creating a person note.',
						control: {
							type: 'text',
							key: 'personTemplate',
							defaultValue: DEFAULT_SETTINGS.personTemplate,
						},
					},
					{
						name: 'Group template',
						desc: 'Vault path used when creating a group note.',
						control: {
							type: 'text',
							key: 'groupTemplate',
							defaultValue: DEFAULT_SETTINGS.groupTemplate,
						},
					},
					{
						name: 'Location template',
						desc: 'Vault path used when creating a location note.',
						control: {
							type: 'text',
							key: 'locationTemplate',
							defaultValue: DEFAULT_SETTINGS.locationTemplate,
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'Mention tracking',
				items: [
					{
						name: 'Update people/locations frontmatter on insert',
						desc: 'Append deduplicated people and locations lists when using insert picker commands. Does not scan manually typed links.',
						control: {
							type: 'toggle',
							key: 'mentionTrackingEnabled',
							defaultValue: DEFAULT_SETTINGS.mentionTrackingEnabled,
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'Picker behavior',
				items: [
					{
						name: 'Sort by backlinks',
						desc: 'Show frequently linked people and locations first.',
						control: {
							type: 'toggle',
							key: 'sortByBacklinks',
							defaultValue: DEFAULT_SETTINGS.sortByBacklinks,
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'Migration',
				items: [
					{
						name: 'Status',
						desc: migrationDesc,
						searchable: false,
					},
				],
			},
			{
				type: 'group',
				heading: 'Ghost mentions',
				items: [
					{
						name: 'Ghost blocklist',
						desc: 'Comma-separated wikilink names to hide from ghost lists (journal section headings, etc.).',
						render: (setting) => {
							setting.addTextArea((text) => {
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
						},
					},
					{
						name: 'Clear ignored ghosts',
						desc: `${this.plugin.settings.ignoredLinks.length} name(s) dismissed via the picker.`,
						action: async () => {
							this.plugin.settings.ignoredLinks = [];
							await this.plugin.saveSettings();
							this.plugin.ghostService.invalidateCache();
							this.update();
						},
					},
				],
			},
		];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const stringKeys = [
			'peopleFolder',
			'groupsFolder',
			'locationsFolder',
			'personTemplate',
			'groupTemplate',
			'locationTemplate',
		] as const;

		if (
			(stringKeys as readonly string[]).includes(key) &&
			typeof value === 'string'
		) {
			const settingsKey = key as (typeof stringKeys)[number];
			this.plugin.settings[settingsKey] =
				value.trim() || DEFAULT_SETTINGS[settingsKey];
		} else if (key === 'mentionTrackingEnabled' && typeof value === 'boolean') {
			this.plugin.settings.mentionTrackingEnabled = value;
		} else if (key === 'sortByBacklinks' && typeof value === 'boolean') {
			this.plugin.settings.sortByBacklinks = value;
		}

		await this.plugin.saveSettings();
	}
}
