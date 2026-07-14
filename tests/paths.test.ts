import { describe, expect, it } from 'vitest';
import {
	buildFlatPersonPath,
	buildVaultRootNotePath,
	buildGroupPath,
	isFlatPersonNotePath,
	isPrimaryOrFlatPersonNotePath,
	buildFlatLocationPath,
	buildLocationPath,
	buildPersonPath,
	isPrimaryGroupNotePath,
	isFlatLocationNotePath,
	isPrimaryLocationNotePath,
	isPrimaryOrFlatLocationNotePath,
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

describe('buildVaultRootNotePath', () => {
	it('builds vault-root note path', () => {
		expect(buildVaultRootNotePath('Ryerson')).toBe('Ryerson.md');
	});
});

describe('buildFlatPersonPath', () => {
	it('builds flat person path', () => {
		expect(buildFlatPersonPath('Matt')).toBe('people/Matt.md');
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

describe('buildFlatLocationPath', () => {
	it('builds flat location path', () => {
		expect(buildFlatLocationPath('Charleston')).toBe('locations/Charleston.md');
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
		expect(isPrimaryGroupNotePath('people/groups/The Ryersons/The Ryersons.md')).toBe(
			true,
		);
	});

	it('rejects non-primary group paths', () => {
		expect(isPrimaryGroupNotePath('people/groups/The Ryersons/member.md')).toBe(false);
	});
});

describe('isPrimaryLocationNotePath', () => {
	it('accepts canonical location notes', () => {
		expect(isPrimaryLocationNotePath('locations/Charleston/Charleston.md')).toBe(true);
	});

	it('rejects flat location notes', () => {
		expect(isPrimaryLocationNotePath('locations/Charleston.md')).toBe(false);
	});
});

describe('isFlatLocationNotePath', () => {
	it('accepts flat location notes', () => {
		expect(isFlatLocationNotePath('locations/Charleston.md')).toBe(true);
	});
});

describe('isPrimaryOrFlatLocationNotePath', () => {
	it('accepts nested and flat location notes', () => {
		expect(isPrimaryOrFlatLocationNotePath('locations/Charleston/Charleston.md')).toBe(true);
		expect(isPrimaryOrFlatLocationNotePath('locations/Charleston.md')).toBe(true);
	});
});

describe('isFlatPersonNotePath', () => {
	it('accepts flat person notes', () => {
		expect(isFlatPersonNotePath('people/Matt.md')).toBe(true);
		expect(isFlatPersonNotePath('people/Michael.md')).toBe(true);
	});

	it('rejects nested paths', () => {
		expect(isFlatPersonNotePath('people/Joy/Joy.md')).toBe(false);
	});
});

describe('isPrimaryOrFlatPersonNotePath', () => {
	it('accepts nested and flat primary notes', () => {
		expect(isPrimaryOrFlatPersonNotePath('people/Joy/Joy.md')).toBe(true);
		expect(isPrimaryOrFlatPersonNotePath('people/Matt.md')).toBe(true);
	});

	it('rejects sub-notes', () => {
		expect(isPrimaryOrFlatPersonNotePath('people/Joy/joy gifts.md')).toBe(false);
	});
});
