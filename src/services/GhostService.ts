import { App, TFile } from 'obsidian';
import type { JournalUtilsSettings } from '../settings';
import type { GhostEntry } from '../types';
import {
	aggregateUnresolvedLinks,
	buildGhostEntries,
} from './ghostAggregation';
import {
	listMarkdownFilesInFolders,
	listVaultRootMarkdownFiles,
} from '../utils/vault';

export class GhostService {
	private cachedGhosts: GhostEntry[] | null = null;

	constructor(
		private app: App,
		private getSettings: () => JournalUtilsSettings,
	) {}

	invalidateCache(): void {
		this.cachedGhosts = null;
	}

	getGhosts(): GhostEntry[] {
		if (this.cachedGhosts) {
			return this.cachedGhosts;
		}

		const settings = this.getSettings();
		const counts = aggregateUnresolvedLinks(
			this.app.metadataCache.unresolvedLinks,
		);
		const existingNames = this.collectExistingLinkNames();

		this.cachedGhosts = buildGhostEntries(counts, {
			blocklist: settings.ghostBlocklist,
			ignoredLinks: settings.ignoredLinks,
			existingNames,
		});

		return this.cachedGhosts;
	}

	private collectExistingLinkNames(): Set<string> {
		const settings = this.getSettings();
		const names = new Set<string>();

		const entityFiles = [
			...listMarkdownFilesInFolders(this.app, [
				settings.peopleFolder,
				settings.groupsFolder,
				settings.locationsFolder,
			]),
			...listVaultRootMarkdownFiles(this.app),
		];

		for (const file of entityFiles) {
			names.add(file.basename.toLowerCase());
			names.add(file.path.toLowerCase());

			const dest = this.app.metadataCache.getFirstLinkpathDest(
				file.basename,
				'',
			);
			if (dest instanceof TFile) {
				names.add(dest.basename.toLowerCase());
			}
		}

		for (const [target] of aggregateUnresolvedLinks(
			this.app.metadataCache.unresolvedLinks,
		)) {
			const resolved = this.app.metadataCache.getFirstLinkpathDest(target, '');
			if (resolved instanceof TFile) {
				names.add(target.toLowerCase());
				names.add(resolved.basename.toLowerCase());
			}
		}

		return names;
	}
}
