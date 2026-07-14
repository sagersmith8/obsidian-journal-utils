import { describe, expect, it } from 'vitest';
import {
	buildMergedNoteContent,
	buildMigrationPlan,
	detectPrimaryPath,
	ensurePersonFrontmatter,
	getPersonKeyFromPath,
	summarizeMigrationPlan,
} from '../src/services/migrationPlan';

const OPTIONS = { peopleFolder: 'people', groupsFolder: 'people/groups' };

const MIND_PALACE_FIXTURE = [
	'people/Dad/Dad Gifts.md',
	'people/Dad/Dad.md',
	'people/Dad/Rules for the Boys.md',
	'people/Derek/Derek.md',
	'people/Graham.md',
	'people/Joy/Joy.md',
	'people/Joy/Masks.md',
	'people/Joy/joy gifts.md',
	'people/Matt.md',
	'people/Me/Gifts.md',
	'people/Me/Me.md',
	'people/Me/sage.md',
	'people/Michael.md',
	'people/Mom.md',
	'people/Nikhil.md',
	'people/Taylor.md',
	'people/Theisen/I wonder what Ts obsidian setup is.md',
	'people/Theisen/Theisen.md',
];

describe('getPersonKeyFromPath', () => {
	it('extracts keys from flat and nested paths', () => {
		expect(getPersonKeyFromPath('people/Matt.md', 'people')).toBe('Matt');
		expect(getPersonKeyFromPath('people/Joy/joy gifts.md', 'people')).toBe('Joy');
	});
});

describe('detectPrimaryPath', () => {
	it('prefers nested primary over sub-notes', () => {
		expect(
			detectPrimaryPath(
				['people/Joy/joy gifts.md', 'people/Joy/Joy.md', 'people/Joy/Masks.md'],
				'Joy',
				OPTIONS,
			),
		).toBe('people/Joy/Joy.md');
	});

	it('uses flat note as primary when nested primary is missing', () => {
		expect(detectPrimaryPath(['people/Matt.md'], 'Matt', OPTIONS)).toBe('people/Matt.md');
	});
});

describe('buildMigrationPlan', () => {
	it('plans flat moves and sub-note merges for mind-palace fixture', () => {
		const plan = buildMigrationPlan(MIND_PALACE_FIXTURE, OPTIONS);
		const summary = summarizeMigrationPlan(plan);

		expect(summary.moveCount).toBeGreaterThanOrEqual(6);
		expect(summary.mergeCount).toBeGreaterThanOrEqual(4);

		const matt = plan.people.find((person) => person.personKey === 'Matt');
		expect(matt?.needsMove).toBe(true);
		expect(matt?.primaryPath).toBe('people/Matt.md');
		expect(matt?.targetPath).toBe('people/Matt/Matt.md');

		const joy = plan.people.find((person) => person.personKey === 'Joy');
		expect(joy?.needsMove).toBe(false);
		expect(joy?.subNotes.map((sub) => sub.path)).toEqual([
			'people/Joy/joy gifts.md',
			'people/Joy/Masks.md',
		]);
	});

	it('ignores people/groups paths', () => {
		const plan = buildMigrationPlan(
			['people/groups/Ryerson/Ryerson.md', 'people/Matt.md'],
			OPTIONS,
		);
		expect(plan.people.some((person) => person.personKey === 'Ryerson')).toBe(false);
		expect(plan.people.some((person) => person.personKey === 'Matt')).toBe(true);
	});
});

describe('buildMergedNoteContent', () => {
	it('appends sub-note sections with headings', () => {
		const merged = buildMergedNoteContent('# Joy\n', [
			{ heading: 'joy gifts', content: 'Gift ideas here.' },
		]);
		expect(merged).toContain('## joy gifts');
		expect(merged).toContain('Gift ideas here.');
	});
});

describe('ensurePersonFrontmatter', () => {
	it('adds type person to existing frontmatter', () => {
		const updated = ensurePersonFrontmatter(
			'---\ntags:\n  - people/graham\n---\n# Graham\n',
			'Graham',
		);
		expect(updated).toContain('type: person');
	});
});
