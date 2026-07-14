import { describe, expect, it } from 'vitest';
import { countBacklinkSources, sortEntityEntries } from '../src/services/entitySort';
import type { EntityEntry } from '../src/types';

function entry(name: string, count: number): EntityEntry {
	return {
		kind: 'person',
		displayName: name,
		file: {} as EntityEntry['file'],
		backlinkCount: count,
		path: `people/${name}/${name}.md`,
	};
}

describe('countBacklinkSources', () => {
	it('counts backlink source paths', () => {
		const map = {
			keys: () => ['journal/a.md', 'journal/b.md'][Symbol.iterator](),
		};
		expect(countBacklinkSources(map)).toBe(2);
	});

	it('returns 0 when undefined', () => {
		expect(countBacklinkSources(undefined)).toBe(0);
	});
});

describe('sortEntityEntries', () => {
	it('sorts by backlink count descending', () => {
		const sorted = sortEntityEntries([entry('Matt', 10), entry('Joy', 100)], true);
		expect(sorted.map((e) => e.displayName)).toEqual(['Joy', 'Matt']);
	});

	it('sorts alphabetically when backlinks disabled', () => {
		const sorted = sortEntityEntries([entry('Matt', 100), entry('Joy', 10)], false);
		expect(sorted.map((e) => e.displayName)).toEqual(['Joy', 'Matt']);
	});
});
