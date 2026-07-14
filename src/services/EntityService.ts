import { App, TFile } from 'obsidian';
import type { JournalUtilsSettings } from '../settings';
import type { EntityEntry, EntityKind } from '../types';
import {
	buildGroupPath,
	buildLocationPath,
	buildPersonPath,
	isPrimaryGroupNotePath,
	isPrimaryOrFlatPersonNotePath,
	sanitizeEntityName,
} from '../utils/paths';
import { ensureFolderExists } from '../utils/vault';
import { getBacklinkCountForFile } from './backlinks';
import { sortEntityEntries } from './entitySort';
import { DEFAULT_GROUP_TEMPLATE, DEFAULT_LOCATION_TEMPLATE } from './templateVars';
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

	isPrimaryGroupNote(file: TFile): boolean {
		if (file.extension !== 'md') {
			return false;
		}

		const settings = this.getSettings();
		return isPrimaryGroupNotePath(file.path, settings.groupsFolder);
	}

	getPeople(): EntityEntry[] {
		const people = this.app.vault
			.getMarkdownFiles()
			.filter((file) => this.isPrimaryPersonNote(file))
			.map((file) => this.toEntry('person', file));

		return sortEntityEntries(people, this.getSettings().sortByBacklinks);
	}

	getGroups(): EntityEntry[] {
		const groups = this.app.vault
			.getMarkdownFiles()
			.filter((file) => this.isPrimaryGroupNote(file))
			.map((file) => this.toEntry('group', file));

		return sortEntityEntries(groups, this.getSettings().sortByBacklinks);
	}

	async createPerson(name: string): Promise<TFile> {
		return this.createEntityNote('person', name);
	}

	async createLocation(name: string): Promise<TFile> {
		return this.createEntityNote('location', name);
	}

	async createGroup(name: string, memberNames: string[]): Promise<TFile> {
		const safeName = sanitizeEntityName(name);
		if (!safeName) {
			throw new Error('Invalid group name');
		}

		const settings = this.getSettings();
		const path = buildGroupPath(safeName, settings.groupsFolder);
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) {
			return existing;
		}

		const members: string[] = [];
		for (const memberName of memberNames) {
			const safeMember = sanitizeEntityName(memberName);
			if (!safeMember) {
				continue;
			}
			await this.createPerson(safeMember);
			members.push(safeMember);
		}

		const folderPath = path.slice(0, path.lastIndexOf('/'));
		await ensureFolderExists(this.app, folderPath);

		const content = await this.templateService.render(
			settings.groupTemplate,
			this.templateService.buildGroupVars(safeName, members),
			DEFAULT_GROUP_TEMPLATE,
		);

		return this.app.vault.create(path, content);
	}

	private async createEntityNote(kind: 'person' | 'location', name: string): Promise<TFile> {
		const safeName = sanitizeEntityName(name);
		if (!safeName) {
			throw new Error(`Invalid ${kind} name`);
		}

		const settings = this.getSettings();
		const path =
			kind === 'person'
				? buildPersonPath(safeName, settings.peopleFolder)
				: buildLocationPath(safeName, settings.locationsFolder);

		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) {
			return existing;
		}

		const folderPath = path.slice(0, path.lastIndexOf('/'));
		await ensureFolderExists(this.app, folderPath);

		const templatePath =
			kind === 'person' ? settings.personTemplate : settings.locationTemplate;
		const vars =
			kind === 'person'
				? this.templateService.buildPersonVars(safeName)
				: this.templateService.buildLocationVars(safeName);
		const content = await this.templateService.render(
			templatePath,
			vars,
			kind === 'location' ? DEFAULT_LOCATION_TEMPLATE : undefined,
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
