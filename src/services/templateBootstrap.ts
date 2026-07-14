import { App } from 'obsidian';
import type { JournalUtilsSettings } from '../settings';
import {
	DEFAULT_GROUP_TEMPLATE,
	DEFAULT_LOCATION_TEMPLATE,
	DEFAULT_PERSON_TEMPLATE,
} from './templateVars';
import { ensureFolderExists } from '../utils/vault';

const VAULT_TEMPLATES: {
	pathKey: 'personTemplate' | 'groupTemplate' | 'locationTemplate';
	content: string;
}[] = [
	{ pathKey: 'personTemplate', content: DEFAULT_PERSON_TEMPLATE },
	{
		pathKey: 'groupTemplate',
		content: DEFAULT_GROUP_TEMPLATE.replace('{{members}}', 'members:'),
	},
	{ pathKey: 'locationTemplate', content: DEFAULT_LOCATION_TEMPLATE },
];

export async function ensureDefaultTemplates(
	app: App,
	settings: JournalUtilsSettings,
): Promise<string[]> {
	const created: string[] = [];

	for (const template of VAULT_TEMPLATES) {
		const path = settings[template.pathKey];
		if (!path || app.vault.getAbstractFileByPath(path)) {
			continue;
		}

		const folderPath = path.slice(0, path.lastIndexOf('/'));
		if (folderPath) {
			await ensureFolderExists(app, folderPath);
		}

		await app.vault.create(path, template.content);
		created.push(path);
	}

	return created;
}
