import { describe, expect, it, vi } from 'vitest';
import { TFile, type App } from 'obsidian';
import { MentionTrackingService } from '../src/services/MentionTrackingService';
import { DEFAULT_SETTINGS } from '../src/settings';

function makeTFile(path: string): TFile {
	const file = new TFile();
	file.path = path;
	file.basename = path.split('/').pop()?.replace(/\.md$/, '') ?? path;
	file.extension = 'md';
	return file;
}

function makeMockApp(frontmatter: Record<string, unknown>, linkDests: Record<string, string>) {
	const processFrontMatter = vi.fn(
		async (_file: TFile, fn: (frontmatter: Record<string, unknown>) => void) => {
			fn(frontmatter);
		},
	);

	const app = {
		metadataCache: {
			getFirstLinkpathDest: (linkText: string) => {
				const path = linkDests[linkText];
				return path ? makeTFile(path) : null;
			},
			fileToLinktext: (file: TFile) => file.basename,
		},
		vault: {
			getAbstractFileByPath: (path: string) => makeTFile(path),
		},
		fileManager: {
			processFrontMatter,
		},
	} as unknown as App;

	return { app, processFrontMatter, frontmatter };
}

describe('MentionTrackingService', () => {
	it('creates people list on first insert', async () => {
		const { app, frontmatter } = makeMockApp({}, { Joy: 'people/Joy/Joy.md' });
		const service = new MentionTrackingService(app, () => DEFAULT_SETTINGS);
		const source = makeTFile('journal/2026-07-12.md');
		const joy = makeTFile('people/Joy/Joy.md');

		const result = await service.trackPeople(source, [joy]);

		expect(result).toEqual({ changed: true, addedLabels: ['Joy'] });
		expect(frontmatter.people).toEqual(['[[Joy]]']);
	});

	it('does not change frontmatter when person already listed', async () => {
		const { app, frontmatter, processFrontMatter } = makeMockApp(
			{ people: ['[[Joy]]'] },
			{ Joy: 'people/Joy/Joy.md' },
		);
		const service = new MentionTrackingService(app, () => DEFAULT_SETTINGS);
		const source = makeTFile('journal/2026-07-12.md');
		const joy = makeTFile('people/Joy/Joy.md');

		const result = await service.trackPeople(source, [joy]);

		expect(result).toEqual({ changed: false, addedLabels: [] });
		expect(frontmatter.people).toEqual(['[[Joy]]']);
		expect(processFrontMatter).toHaveBeenCalledOnce();
	});

	it('skips processFrontMatter when mention tracking is disabled', async () => {
		const { app, processFrontMatter } = makeMockApp({}, { Joy: 'people/Joy/Joy.md' });
		const service = new MentionTrackingService(app, () => ({
			...DEFAULT_SETTINGS,
			mentionTrackingEnabled: false,
		}));
		const source = makeTFile('journal/2026-07-12.md');
		const joy = makeTFile('people/Joy/Joy.md');

		const result = await service.trackPeople(source, [joy]);

		expect(result).toEqual({ changed: false, addedLabels: [] });
		expect(processFrontMatter).not.toHaveBeenCalled();
	});

	it('coerces invalid people property before append', async () => {
		const { app, frontmatter } = makeMockApp(
			{ people: null },
			{ Matt: 'people/Matt/Matt.md' },
		);
		const service = new MentionTrackingService(app, () => DEFAULT_SETTINGS);
		const source = makeTFile('journal/2026-07-12.md');
		const matt = makeTFile('people/Matt/Matt.md');

		const result = await service.trackPeople(source, [matt]);

		expect(result.changed).toBe(true);
		expect(frontmatter.people).toEqual(['[[Matt]]']);
	});

	it('appends to locations on trackLocation', async () => {
		const { app, frontmatter } = makeMockApp(
			{},
			{ Charleston: 'locations/Charleston/Charleston.md' },
		);
		const service = new MentionTrackingService(app, () => DEFAULT_SETTINGS);
		const source = makeTFile('journal/2026-07-12.md');
		const charleston = makeTFile('locations/Charleston/Charleston.md');

		const result = await service.trackLocation(source, charleston);

		expect(result).toEqual({ changed: true, addedLabels: ['Charleston'] });
		expect(frontmatter.locations).toEqual(['[[Charleston]]']);
	});
});
