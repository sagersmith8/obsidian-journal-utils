import type { GhostEntry } from '../types';

export type UnresolvedLinksMap = Record<string, Record<string, number>>;

export function normalizeGhostName(name: string): string {
	return name.trim();
}

/** Sum mention counts per link target across all source files. */
export function aggregateUnresolvedLinks(
	unresolvedLinks: UnresolvedLinksMap,
): Map<string, number> {
	const counts = new Map<string, number>();

	for (const targets of Object.values(unresolvedLinks)) {
		for (const [target, count] of Object.entries(targets)) {
			const name = normalizeGhostName(target);
			if (!name) {
				continue;
			}
			counts.set(name, (counts.get(name) ?? 0) + count);
		}
	}

	return counts;
}

export function isBlocklisted(name: string, blocklist: string[]): boolean {
	const lower = name.toLowerCase();
	return blocklist.some((term) => term.toLowerCase() === lower);
}

export function isIgnored(name: string, ignoredLinks: string[]): boolean {
	const lower = name.toLowerCase();
	return ignoredLinks.some((term) => term.toLowerCase() === lower);
}

export function buildGhostEntries(
	counts: Map<string, number>,
	options: {
		blocklist: string[];
		ignoredLinks: string[];
		existingNames: Set<string>;
	},
): GhostEntry[] {
	const ghosts: GhostEntry[] = [];

	for (const [name, mentionCount] of counts.entries()) {
		if (isBlocklisted(name, options.blocklist)) {
			continue;
		}
		if (isIgnored(name, options.ignoredLinks)) {
			continue;
		}
		if (options.existingNames.has(name.toLowerCase())) {
			continue;
		}

		ghosts.push({ name, mentionCount });
	}

	return ghosts.sort((a, b) => {
		if (b.mentionCount !== a.mentionCount) {
			return b.mentionCount - a.mentionCount;
		}
		return a.name.localeCompare(b.name);
	});
}
