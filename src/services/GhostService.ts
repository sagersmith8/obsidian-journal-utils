import { App, TFile } from 'obsidian';
import type { JournalUtilsSettings } from '../settings';
import type { GhostEntry } from '../types';
import {
	aggregateUnresolvedLinks,
	buildGhostEntries,
} from './ghostAggregation';

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
		const names = new Set<string>();

		for (const file of this.app.vault.getMarkdownFiles()) {
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
