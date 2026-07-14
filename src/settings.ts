import { DEFAULT_GHOST_BLOCKLIST } from './utils/paths';

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
	lastMigrationLog: string[];
	mentionTrackingEnabled: boolean;
}

export const DEFAULT_SETTINGS: JournalUtilsSettings = {
	peopleFolder: 'people',
	groupsFolder: 'people/groups',
	locationsFolder: 'locations',
	personTemplate: 'people/template.md',
	groupTemplate: 'people/groups/template.md',
	locationTemplate: 'locations/template.md',
	ghostBlocklist: [...DEFAULT_GHOST_BLOCKLIST],
	ignoredLinks: [],
	sortByBacklinks: true,
	avatarDecorationEnabled: true,
	setupWizardComplete: false,
	migrationCompletedAt: null,
	lastMigrationLog: [],
	mentionTrackingEnabled: true,
};

export function mergeSettings(
	saved: Partial<JournalUtilsSettings> | null,
): JournalUtilsSettings {
	const merged = Object.assign({}, DEFAULT_SETTINGS, saved ?? {});

	if (!saved?.ghostBlocklist || saved.ghostBlocklist.length === 0) {
		merged.ghostBlocklist = [...DEFAULT_GHOST_BLOCKLIST];
	} else {
		const existing = new Set(saved.ghostBlocklist.map((s) => s.toLowerCase()));
		const backfill = DEFAULT_GHOST_BLOCKLIST.filter(
			(term) => !existing.has(term.toLowerCase()),
		);
		merged.ghostBlocklist = [...saved.ghostBlocklist, ...backfill];
	}

	return merged;
}
