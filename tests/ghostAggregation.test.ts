import { describe, expect, it } from 'vitest';
import {
	aggregateUnresolvedLinks,
	buildGhostEntries,
	isBlocklisted,
	isIgnored,
} from '../src/services/ghostAggregation';

describe('aggregateUnresolvedLinks', () => {
	it('sums counts across source files', () => {
		const counts = aggregateUnresolvedLinks({
			'journal/a.md': { Thomas: 2, Joy: 1 },
			'journal/b.md': { Thomas: 3 },
		});
		expect(counts.get('Thomas')).toBe(5);
		expect(counts.get('Joy')).toBe(1);
	});
});

describe('buildGhostEntries', () => {
	it('filters blocklist and existing names', () => {
		const counts = new Map([
			['Thomas', 10],
			['Gratitude', 100],
			['Joy', 5],
		]);

		const ghosts = buildGhostEntries(counts, {
			blocklist: ['Gratitude'],
			ignoredLinks: [],
			existingNames: new Set(['joy']),
		});

		expect(ghosts.map((g) => g.name)).toEqual(['Thomas']);
		expect(ghosts[0]?.mentionCount).toBe(10);
	});
});

describe('isBlocklisted', () => {
	it('matches case-insensitively', () => {
		expect(isBlocklisted('gratitude', ['Gratitude'])).toBe(true);
	});
});

describe('isIgnored', () => {
	it('matches case-insensitively', () => {
		expect(isIgnored('Thomas', ['thomas'])).toBe(true);
		expect(isIgnored('Thomas', ['Joy'])).toBe(false);
	});
});

describe('buildGhostEntries ignored links', () => {
	it('filters ignored names on next getGhosts-style call', () => {
		const counts = new Map([
			['Thomas', 10],
			['OldFriend', 3],
		]);

		const before = buildGhostEntries(counts, {
			blocklist: [],
			ignoredLinks: [],
			existingNames: new Set(),
		});
		expect(before.map((g) => g.name)).toEqual(['Thomas', 'OldFriend']);

		const after = buildGhostEntries(counts, {
			blocklist: [],
			ignoredLinks: ['OldFriend'],
			existingNames: new Set(),
		});
		expect(after.map((g) => g.name)).toEqual(['Thomas']);
	});
});
