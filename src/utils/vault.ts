import { App } from 'obsidian';

/** Create nested vault folders if they do not exist. */
export async function ensureFolderExists(app: App, folderPath: string): Promise<void> {
	const normalized = folderPath.replace(/\\/g, '/').replace(/\/+$/, '');
	if (!normalized || app.vault.getAbstractFileByPath(normalized)) {
		return;
	}

	const parts = normalized.split('/');
	let current = '';
	for (const part of parts) {
		current = current ? `${current}/${part}` : part;
		if (!app.vault.getAbstractFileByPath(current)) {
			await app.vault.createFolder(current);
		}
	}
}
