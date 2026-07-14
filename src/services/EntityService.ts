import { App, TFile } from 'obsidian';
import type { JournalUtilsSettings } from '../settings';
import type { EntityEntry, EntityKind } from '../types';
import { buildPersonPath, isPrimaryOrFlatPersonNotePath, sanitizeEntityName } from '../utils/paths';
import { ensureFolderExists } from '../utils/vault';
import { getBacklinkCountForFile } from './backlinks';
import { sortEntityEntries } from './entitySort';
import { TemplateService } from './TemplateService';

export class EntityService {
	private backlinkCache = new Map<string, number>();

	constructor(
		private app: App,
		private getSettings: () => JournalUtilsSettings,
		private templateService: TemplateService,
	) {}

	invalidateCache(): void {
		this.backlinkCache.clear();
	}

	getBacklinkCount(file: TFile): number {
		const cached = this.backlinkCache.get(file.path);
		if (cached !== undefined) {
			return cached;
		}

		const count = getBacklinkCountForFile(this.app.metadataCache, file);
		this.backlinkCache.set(file.path, count);
		return count;
	}

	isPrimaryPersonNote(file: TFile): boolean {
		if (file.extension !== 'md') {
			return false;
		}

		const settings = this.getSettings();
		return isPrimaryOrFlatPersonNotePath(
			file.path,
			settings.peopleFolder,
			settings.groupsFolder,
		);
	}

	getPeople(): EntityEntry[] {
		const people = this.app.vault
			.getMarkdownFiles()
			.filter((file) => this.isPrimaryPersonNote(file))
			.map((file) => this.toEntry('person', file));

		return sortEntityEntries(people, this.getSettings().sortByBacklinks);
	}

	async createPerson(name: string): Promise<TFile> {
		const safeName = sanitizeEntityName(name);
		if (!safeName) {
			throw new Error('Invalid person name');
		}

		const settings = this.getSettings();
		const path = buildPersonPath(safeName, settings.peopleFolder);
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) {
			return existing;
		}

		const folderPath = path.slice(0, path.lastIndexOf('/'));
		await ensureFolderExists(this.app, folderPath);

		const content = await this.templateService.render(
			settings.personTemplate,
			this.templateService.buildPersonVars(safeName),
		);

		return this.app.vault.create(path, content);
	}

	private toEntry(kind: EntityKind, file: TFile): EntityEntry {
		return {
			kind,
			displayName: file.basename,
			file,
			backlinkCount: this.getBacklinkCount(file),
			path: file.path,
		};
	}
}
