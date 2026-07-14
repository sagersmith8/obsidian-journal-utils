import { App, TFile } from 'obsidian';
import type { JournalUtilsSettings } from '../settings';
import { formatWikilinkForFile } from '../utils/links';
import type { EntityService } from './EntityService';
import {
	collectNewEntries,
	extractMemberNames,
	normalizeListProperty,
	parseWikilinkString,
} from './mentionTracking';

export interface MentionTrackResult {
	changed: boolean;
	addedLabels: string[];
	failed?: boolean;
}

type MentionListKey = 'people' | 'locations';

export class MentionTrackingService {
	constructor(
		private app: App,
		private entityService: EntityService,
		private getSettings: () => JournalUtilsSettings,
	) {}

	async trackPeople(sourceFile: TFile, targets: TFile[]): Promise<MentionTrackResult> {
		return this.trackList(sourceFile, 'people', targets);
	}

	async trackLocation(sourceFile: TFile, target: TFile): Promise<MentionTrackResult> {
		return this.trackList(sourceFile, 'locations', [target]);
	}

	async trackGroupInsert(
		sourceFile: TFile,
		groupFile: TFile,
		knownMembers?: string[],
	): Promise<MentionTrackResult> {
		if (!this.isEnabled()) {
			return { changed: false, addedLabels: [] };
		}

		const memberNames =
			knownMembers && knownMembers.length > 0
				? knownMembers
				: extractMemberNames(
						this.app.metadataCache.getFileCache(groupFile)?.frontmatter?.members,
					);

		const personFiles: TFile[] = [];
		for (const name of memberNames) {
			const person = this.entityService.findPersonNoteByName(name);
			if (person) {
				personFiles.push(person);
			}
		}

		return this.trackPeople(sourceFile, personFiles);
	}

	private isEnabled(): boolean {
		return this.getSettings().mentionTrackingEnabled;
	}

	private async trackList(
		sourceFile: TFile,
		key: MentionListKey,
		targets: TFile[],
	): Promise<MentionTrackResult> {
		if (!this.isEnabled()) {
			return { changed: false, addedLabels: [] };
		}

		if (sourceFile.extension !== 'md') {
			return { changed: false, addedLabels: [] };
		}

		const candidates = targets.filter((file) => file.extension === 'md');
		if (candidates.length === 0) {
			return { changed: false, addedLabels: [] };
		}

		const sourcePath = sourceFile.path;
		const resolveLink = (linkText: string, fromPath: string): string | null => {
			const dest = this.app.metadataCache.getFirstLinkpathDest(linkText, fromPath);
			return dest instanceof TFile ? dest.path : null;
		};

		const formatEntry = (path: string): string => {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) {
				return formatWikilinkForFile(this.app.metadataCache, file, sourcePath);
			}

			return `[[${path}]]`;
		};

		let result: MentionTrackResult = { changed: false, addedLabels: [] };

		try {
			await this.app.fileManager.processFrontMatter(sourceFile, (frontmatter) => {
				const existing = normalizeListProperty(frontmatter[key]);
				const candidatePaths = candidates.map((file) => file.path);
				const newEntries = collectNewEntries(
					existing,
					candidatePaths,
					sourcePath,
					resolveLink,
					formatEntry,
				);

				if (newEntries.length === 0) {
					return;
				}

				frontmatter[key] = [...existing, ...newEntries];
				result = {
					changed: true,
					addedLabels: newEntries.map(
						(entry) => parseWikilinkString(entry) ?? entry,
					),
				};
			});
		} catch (error) {
			console.error('[Journal Utils] Mention tracking failed:', error);
			return {
				changed: false,
				addedLabels: [],
				failed: true,
			};
		}

		return result;
	}
}
