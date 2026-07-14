import { describe, expect, it } from 'vitest';
import {
	buildGroupPath,
	buildLocationPath,
	buildPersonPath,
	isPrimaryGroupNotePath,
	isPrimaryLocationNotePath,
	isPrimaryPersonNotePath,
	sanitizeEntityName,
} from '../src/utils/paths';

describe('sanitizeEntityName', () => {
	it('trims whitespace', () => {
		expect(sanitizeEntityName('  Joy  ')).toBe('Joy');
	});

	it('strips invalid path characters', () => {
		expect(sanitizeEntityName('bad/name')).toBe('badname');
	});

	it('returns null for empty result', () => {
		expect(sanitizeEntityName('   ')).toBeNull();
	});
});

describe('buildPersonPath', () => {
	it('builds nested person path', () => {
		expect(buildPersonPath('Joy')).toBe('people/Joy/Joy.md');
	});

	it('throws for invalid names', () => {
		expect(() => buildPersonPath('   ')).toThrow('Invalid person name');
	});
});

describe('isPrimaryPersonNotePath', () => {
	it('accepts canonical person notes', () => {
		expect(isPrimaryPersonNotePath('people/Joy/Joy.md')).toBe(true);
	});

	it('rejects flat and sub-notes', () => {
		expect(isPrimaryPersonNotePath('people/Matt.md')).toBe(false);
		expect(isPrimaryPersonNotePath('people/Joy/joy gifts.md')).toBe(false);
	});

	it('rejects group notes', () => {
		expect(isPrimaryPersonNotePath('people/groups/Ryersons/Ryersons.md')).toBe(false);
	});
});

describe('buildGroupPath', () => {
	it('builds group path', () => {
		expect(buildGroupPath('The Ryersons')).toBe(
			'people/groups/The Ryersons/The Ryersons.md',
		);
	});
});

describe('buildLocationPath', () => {
	it('builds location path', () => {
		expect(buildLocationPath('Charleston')).toBe('locations/Charleston/Charleston.md');
	});
});

describe('isPrimaryGroupNotePath', () => {
	it('accepts canonical group notes', () => {
		expect(isPrimaryGroupNotePath('people/groups/Ryersons/Ryersons.md')).toBe(true);
	});
});

describe('isPrimaryLocationNotePath', () => {
	it('accepts canonical location notes', () => {
		expect(isPrimaryLocationNotePath('locations/Charleston/Charleston.md')).toBe(true);
	});
});
