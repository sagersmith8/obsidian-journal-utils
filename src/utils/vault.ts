import { App, TFile, TFolder } from 'obsidian';

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

function collectMarkdownFiles(folder: TFolder): TFile[] {
	const files: TFile[] = [];

	for (const child of folder.children) {
		if (child instanceof TFile && child.extension === 'md') {
			files.push(child);
		} else if (child instanceof TFolder) {
			files.push(...collectMarkdownFiles(child));
		}
	}

	return files;
}

/** List markdown files under a folder path without scanning the whole vault. */
export function listMarkdownFilesInFolder(app: App, folderPath: string): TFile[] {
	const normalized = folderPath.replace(/\\/g, '/').replace(/\/+$/, '');
	if (!normalized) {
		return [];
	}

	const folder = app.vault.getFolderByPath(normalized);
	if (!folder) {
		return [];
	}

	return collectMarkdownFiles(folder);
}

/** Markdown notes at the vault root (legacy flat person notes). */
export function listVaultRootMarkdownFiles(app: App): TFile[] {
	return app.vault.getRoot().children.filter(
		(child): child is TFile => child instanceof TFile && child.extension === 'md',
	);
}

/** Collect markdown files from multiple configured folders. */
export function listMarkdownFilesInFolders(
	app: App,
	folderPaths: string[],
): TFile[] {
	const seen = new Set<string>();
	const files: TFile[] = [];

	for (const folderPath of folderPaths) {
		for (const file of listMarkdownFilesInFolder(app, folderPath)) {
			if (seen.has(file.path)) {
				continue;
			}
			seen.add(file.path);
			files.push(file);
		}
	}

	return files;
}
