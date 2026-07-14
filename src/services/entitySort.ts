import type { EntityEntry } from '../types';

/** Sort entities by backlink count (desc), then name. Exported for unit tests. */
export function sortEntityEntries(
	entries: EntityEntry[],
	sortByBacklinks: boolean,
): EntityEntry[] {
	const copy = [...entries];
	if (!sortByBacklinks) {
		return copy.sort((a, b) => a.displayName.localeCompare(b.displayName));
	}
	return copy.sort((a, b) => {
		if (b.backlinkCount !== a.backlinkCount) {
			return b.backlinkCount - a.backlinkCount;
		}
		return a.displayName.localeCompare(b.displayName);
	});
}

/** Count distinct source notes linking to a file. Exported for unit tests. */
export function countBacklinkSources(
	backlinks: { keys(): Iterable<string> } | undefined,
): number {
	if (!backlinks) {
		return 0;
	}
	return Array.from(backlinks.keys()).length;
}
