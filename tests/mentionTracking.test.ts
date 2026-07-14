import { describe, expect, it } from 'vitest';
import {
	collectNewEntries,
	extractMemberNames,
	entryResolvesToPath,
	normalizeListProperty,
	parseWikilinkString,
	type LinkResolver,
} from '../src/services/mentionTracking';

describe('parseWikilinkString', () => {
	it('parses quoted and unquoted wikilink strings', () => {
		expect(parseWikilinkString('"[[Steve Ryerson]]"')).toBe('Steve Ryerson');
		expect(parseWikilinkString('[[Steve Ryerson]]')).toBe('Steve Ryerson');
		expect(parseWikilinkString('Steve Ryerson')).toBe('Steve Ryerson');
	});

	it('returns null for empty or whitespace input', () => {
		expect(parseWikilinkString('')).toBeNull();
		expect(parseWikilinkString('   ')).toBeNull();
		expect(parseWikilinkString('[[]]')).toBeNull();
	});
});

describe('normalizeListProperty', () => {
	it('returns string items from arrays', () => {
		expect(normalizeListProperty(['[[Joy]]', '[[Matt]]'])).toEqual([
			'[[Joy]]',
			'[[Matt]]',
		]);
	});

	it('returns empty array for non-array values', () => {
		expect(normalizeListProperty(undefined)).toEqual([]);
		expect(normalizeListProperty(null)).toEqual([]);
		expect(normalizeListProperty('[[Joy]]')).toEqual([]);
		expect(normalizeListProperty({ link: '[[Joy]]' })).toEqual([]);
	});

	it('filters out non-string entries', () => {
		expect(normalizeListProperty(['[[Joy]]', 42, null])).toEqual(['[[Joy]]']);
	});
});

describe('entryResolvesToPath', () => {
	const resolver: LinkResolver = (linkText) => {
		if (linkText === 'Joy') {
			return 'people/Joy/Joy.md';
		}
		if (linkText === 'people/Joy/Joy') {
			return 'people/Joy/Joy.md';
		}
		return null;
	};

	it('resolves wikilink entries through the injected resolver', () => {
		expect(
			entryResolvesToPath('[[Joy]]', 'journal/2026-07-12.md', resolver),
		).toBe('people/Joy/Joy.md');
	});

	it('returns null when link text cannot be parsed or resolved', () => {
		expect(entryResolvesToPath('', 'journal/2026-07-12.md', resolver)).toBeNull();
		expect(
			entryResolvesToPath('[[Unknown]]', 'journal/2026-07-12.md', resolver),
		).toBeNull();
	});
});

describe('extractMemberNames', () => {
	it('parses wikilink and plain member entries', () => {
		expect(
			extractMemberNames(['[[Steve Ryerson]]', 'Annette Ryerson']),
		).toEqual(['Steve Ryerson', 'Annette Ryerson']);
	});

	it('returns empty array for invalid values', () => {
		expect(extractMemberNames(null)).toEqual([]);
		expect(extractMemberNames(['', '[[]]'])).toEqual([]);
	});
});

describe('collectNewEntries', () => {
	const sourcePath = 'journal/2026-07-12.md';
	const resolveLink: LinkResolver = (linkText) => {
		const map: Record<string, string> = {
			Joy: 'people/Joy/Joy.md',
			Matt: 'people/Matt/Matt.md',
			'people/Joy/Joy': 'people/Joy/Joy.md',
		};
		return map[linkText] ?? null;
	};
	const formatEntry = (path: string): string => {
		if (path === 'people/Joy/Joy.md') {
			return '[[Joy]]';
		}
		if (path === 'people/Matt/Matt.md') {
			return '[[Matt]]';
		}
		return `[[${path}]]`;
	};

	it('returns no entries when candidate already exists under another link form', () => {
		const existing = ['[[people/Joy/Joy]]'];
		const result = collectNewEntries(
			existing,
			['people/Joy/Joy.md'],
			sourcePath,
			resolveLink,
			formatEntry,
		);
		expect(result).toEqual([]);
	});

	it('dedupes duplicate candidates to a single append', () => {
		const result = collectNewEntries(
			[],
			['people/Joy/Joy.md', 'people/Joy/Joy.md'],
			sourcePath,
			resolveLink,
			formatEntry,
		);
		expect(result).toEqual(['[[Joy]]']);
	});

	it('returns new formatted entries for unseen candidate paths', () => {
		const result = collectNewEntries(
			['[[Joy]]'],
			['people/Matt/Matt.md'],
			sourcePath,
			resolveLink,
			formatEntry,
		);
		expect(result).toEqual(['[[Matt]]']);
	});

	it('skips empty candidate paths', () => {
		const result = collectNewEntries(
			[],
			['', 'people/Matt/Matt.md'],
			sourcePath,
			resolveLink,
			formatEntry,
		);
		expect(result).toEqual(['[[Matt]]']);
	});
});
