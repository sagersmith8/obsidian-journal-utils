import { App, TFile } from 'obsidian';
import type { JournalUtilsSettings } from '../settings';
import type { EntityEntry, EntityKind } from '../types';
import { isPrimaryOrFlatPersonNotePath } from '../utils/paths';
import { getBacklinkCountForFile } from './backlinks';
import { sortEntityEntries } from './entitySort';

export class EntityService {
	private backlinkCache = new Map<string, number>();

	constructor(
		private app: App,
		private getSettings: () => JournalUtilsSettings,
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
