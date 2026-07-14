export interface JournalUtilsSettings {
	peopleFolder: string;
	groupsFolder: string;
	locationsFolder: string;
	personTemplate: string;
	groupTemplate: string;
	locationTemplate: string;
	ghostBlocklist: string[];
	ignoredLinks: string[];
	sortByBacklinks: boolean;
	avatarDecorationEnabled: boolean;
	setupWizardComplete: boolean;
	migrationCompletedAt: string | null;
}

export const DEFAULT_SETTINGS: JournalUtilsSettings = {
	peopleFolder: 'people',
	groupsFolder: 'people/groups',
	locationsFolder: 'locations',
	personTemplate: 'people/template.md',
	groupTemplate: 'people/groups/template.md',
	locationTemplate: 'locations/template.md',
	ghostBlocklist: [],
	ignoredLinks: [],
	sortByBacklinks: true,
	avatarDecorationEnabled: true,
	setupWizardComplete: false,
	migrationCompletedAt: null,
};
