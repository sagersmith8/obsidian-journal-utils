import { describe, expect, it } from 'vitest';
import { buildWikilink } from '../src/utils/links';

describe('buildWikilink', () => {
	it('wraps link text in wikilink syntax', () => {
		expect(buildWikilink('Joy')).toBe('[[Joy]]');
		expect(buildWikilink('people/Joy/Joy')).toBe('[[people/Joy/Joy]]');
	});
});
