import { App, TFile } from 'obsidian';
import type { JournalUtilsSettings } from '../settings';
import type { EntityEntry, EntityKind } from '../types';
import { composeGroupNote, splitFrontmatter } from '../utils/frontmatter';
import {
	buildFlatLocationPath,
	buildFlatPersonPath,
	buildGroupPath,
	buildLocationPath,
	buildPersonPath,
	buildVaultRootNotePath,
	isPrimaryGroupNotePath,
	isPrimaryOrFlatLocationNotePath,
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

	isPrimaryLocationNote(file: TFile): boolean {
		if (file.extension !== 'md') {
			return false;
		}

		const settings = this.getSettings();
		return isPrimaryOrFlatLocationNotePath(
			file.path,
			settings.locationsFolder,
		);
	}

	/** Find any markdown note that [[name]] would resolve to, including vault-root legacy notes. */
	findPersonNoteByName(name: string): TFile | null {
		const safeName = sanitizeEntityName(name);
		if (!safeName) {
			return null;
		}

		const resolved = this.app.metadataCache.getFirstLinkpathDest(safeName, '');
		if (resolved instanceof TFile) {
			if (this.isPrimaryGroupNote(resolved)) {
				return null;
			}
			return resolved;
		}

		const settings = this.getSettings();
		const candidatePaths = [
			buildPersonPath(safeName, settings.peopleFolder),
			buildFlatPersonPath(safeName, settings.peopleFolder),
			buildVaultRootNotePath(safeName),
		];

		for (const path of candidatePaths) {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) {
				return file;
			}
		}

		const lower = safeName.toLowerCase();
		for (const file of this.app.vault.getMarkdownFiles()) {
			if (
				!this.isPrimaryGroupNote(file) &&
				file.basename.toLowerCase() === lower
			) {
				return file;
			}
		}

		return null;
	}

	findLocationNoteByName(name: string): TFile | null {
		const safeName = sanitizeEntityName(name);
		if (!safeName) {
			return null;
		}

		const settings = this.getSettings();
		const candidatePaths = [
			buildLocationPath(safeName, settings.locationsFolder),
			buildFlatLocationPath(safeName, settings.locationsFolder),
		];

		for (const path of candidatePaths) {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) {
				return file;
			}
		}

		const resolved = this.app.metadataCache.getFirstLinkpathDest(safeName, '');
		if (resolved instanceof TFile && this.isPrimaryLocationNote(resolved)) {
			return resolved;
		}

		const lower = safeName.toLowerCase();
		for (const file of this.app.vault.getMarkdownFiles()) {
			if (
				this.isPrimaryLocationNote(file) &&
				file.basename.toLowerCase() === lower
			) {
				return file;
			}
		}

		return null;
	}

	getEntryForFile(file: TFile, kind: EntityKind = 'person'): EntityEntry {
		return this.toEntry(kind, file);
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

	getLocations(): EntityEntry[] {
		const locations = this.app.vault
			.getMarkdownFiles()
			.filter((file) => this.isPrimaryLocationNote(file))
			.map((file) => this.toEntry('location', file));

		return sortEntityEntries(locations, this.getSettings().sortByBacklinks);
	}

	async createPerson(name: string): Promise<TFile> {
		const existing = this.findPersonNoteByName(name);
		if (existing) {
			return existing;
		}
		return this.createEntityNote('person', name);
	}

	async createLocation(name: string): Promise<TFile> {
		const existing = this.findLocationNoteByName(name);
		if (existing) {
			return existing;
		}
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

		const members = await this.ensureMemberPersonNotes(safeName, memberNames);
		const folderPath = path.slice(0, path.lastIndexOf('/'));
		await ensureFolderExists(this.app, folderPath);

		const content = await this.renderGroupContent(safeName, members);
		return this.app.vault.create(path, content);
	}

	async convertPersonToGroup(name: string, memberNames: string[]): Promise<TFile> {
		const safeName = sanitizeEntityName(name);
		if (!safeName) {
			throw new Error('Invalid group name');
		}

		const personFile = this.findPersonNoteByName(safeName);
		if (!personFile) {
			throw new Error('Person note not found');
		}

		const settings = this.getSettings();
		const groupPath = buildGroupPath(safeName, settings.groupsFolder);
		const existingGroup = this.app.vault.getAbstractFileByPath(groupPath);
		if (existingGroup instanceof TFile) {
			return existingGroup;
		}

		const members = await this.ensureMemberPersonNotes(safeName, memberNames);
		const originalContent = await this.app.vault.read(personFile);
		const { body } = splitFrontmatter(originalContent);
		const content = await this.renderGroupContent(safeName, members, body);

		await ensureFolderExists(this.app, groupPath.slice(0, groupPath.lastIndexOf('/')));
		await this.app.fileManager.renameFile(personFile, groupPath);

		const movedFile = this.app.vault.getAbstractFileByPath(groupPath);
		if (!(movedFile instanceof TFile)) {
			throw new Error('Failed to convert person note to group');
		}

		await this.app.vault.modify(movedFile, content);
		return movedFile;
	}

	private async ensureMemberPersonNotes(
		groupName: string,
		memberNames: string[],
	): Promise<string[]> {
		const members: string[] = [];
		const groupLower = groupName.toLowerCase();

		for (const memberName of memberNames) {
			const safeMember = sanitizeEntityName(memberName);
			if (!safeMember || safeMember.toLowerCase() === groupLower) {
				continue;
			}
			await this.createPerson(safeMember);
			members.push(safeMember);
		}

		return members;
	}

	private async renderGroupContent(
		title: string,
		memberNames: string[],
		preservedBody = '',
	): Promise<string> {
		const settings = this.getSettings();
		const rendered = await this.templateService.render(
			settings.groupTemplate,
			this.templateService.buildGroupVars(title, memberNames),
			DEFAULT_GROUP_TEMPLATE,
		);

		return composeGroupNote(rendered, preservedBody);
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
