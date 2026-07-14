import { describe, expect, it, vi } from 'vitest';
import { TFile, type App } from 'obsidian';
import type { EntityService } from '../src/services/EntityService';
import { MentionTrackingService } from '../src/services/MentionTrackingService';
import { DEFAULT_SETTINGS } from '../src/settings';

function makeTFile(path: string): TFile {
	const file = new TFile();
	file.path = path;
	file.basename = path.split('/').pop()?.replace(/\.md$/, '') ?? path;
	file.extension = 'md';
	return file;
}

function makeEntityService(
	resolver: Record<string, string>,
): Pick<EntityService, 'findPersonNoteByName'> {
	return {
		findPersonNoteByName: (name: string) => {
			const path = resolver[name];
			return path ? makeTFile(path) : null;
		},
	};
}

function makeMockApp(
	frontmatter: Record<string, unknown>,
	linkDests: Record<string, string>,
	fileCache: Record<string, Record<string, unknown>> = {},
) {
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
			getFileCache: (file: TFile) => fileCache[file.path] ?? null,
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

function makeService(
	app: App,
	entityResolver: Record<string, string>,
	settings = DEFAULT_SETTINGS,
): MentionTrackingService {
	return new MentionTrackingService(
		app,
		makeEntityService(entityResolver) as EntityService,
		() => settings,
	);
}

describe('MentionTrackingService', () => {
	it('creates people list on first insert', async () => {
		const { app, frontmatter } = makeMockApp({}, { Joy: 'people/Joy/Joy.md' });
		const service = makeService(app, { Joy: 'people/Joy/Joy.md' });
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
		const service = makeService(app, { Joy: 'people/Joy/Joy.md' });
		const source = makeTFile('journal/2026-07-12.md');
		const joy = makeTFile('people/Joy/Joy.md');

		const result = await service.trackPeople(source, [joy]);

		expect(result).toEqual({ changed: false, addedLabels: [] });
		expect(frontmatter.people).toEqual(['[[Joy]]']);
		expect(processFrontMatter).toHaveBeenCalledOnce();
	});

	it('skips processFrontMatter when mention tracking is disabled', async () => {
		const { app, processFrontMatter } = makeMockApp({}, { Joy: 'people/Joy/Joy.md' });
		const service = makeService(
			app,
			{ Joy: 'people/Joy/Joy.md' },
			{ ...DEFAULT_SETTINGS, mentionTrackingEnabled: false },
		);
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
		const service = makeService(app, { Matt: 'people/Matt/Matt.md' });
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
		const service = makeService(app, {});
		const source = makeTFile('journal/2026-07-12.md');
		const charleston = makeTFile('locations/Charleston/Charleston.md');

		const result = await service.trackLocation(source, charleston);

		expect(result).toEqual({ changed: true, addedLabels: ['Charleston'] });
		expect(frontmatter.locations).toEqual(['[[Charleston]]']);
	});

	it('expands group members from knownMembers into people', async () => {
		const { app, frontmatter } = makeMockApp(
			{},
			{
				'Steve Ryerson': 'people/Steve Ryerson/Steve Ryerson.md',
				'Annette Ryerson': 'people/Annette Ryerson/Annette Ryerson.md',
			},
		);
		const service = makeService(app, {
			'Steve Ryerson': 'people/Steve Ryerson/Steve Ryerson.md',
			'Annette Ryerson': 'people/Annette Ryerson/Annette Ryerson.md',
		});
		const source = makeTFile('journal/2026-07-12.md');
		const group = makeTFile('people/groups/The Ryersons/The Ryersons.md');

		const result = await service.trackGroupInsert(source, group, [
			'Steve Ryerson',
			'Annette Ryerson',
		]);

		expect(result.changed).toBe(true);
		expect(frontmatter.people).toEqual([
			'[[Steve Ryerson]]',
			'[[Annette Ryerson]]',
		]);
	});

	it('expands group members from frontmatter cache when knownMembers omitted', async () => {
		const groupPath = 'people/groups/The Ryersons/The Ryersons.md';
		const { app, frontmatter } = makeMockApp(
			{},
			{
				'Steve Ryerson': 'people/Steve Ryerson/Steve Ryerson.md',
			},
			{
				[groupPath]: {
					frontmatter: {
						members: ['[[Steve Ryerson]]'],
					},
				},
			},
		);
		const service = makeService(app, {
			'Steve Ryerson': 'people/Steve Ryerson/Steve Ryerson.md',
		});
		const source = makeTFile('journal/2026-07-12.md');
		const group = makeTFile(groupPath);

		const result = await service.trackGroupInsert(source, group);

		expect(result.changed).toBe(true);
		expect(frontmatter.people).toEqual(['[[Steve Ryerson]]']);
	});

	it('dedupes group members already listed in people', async () => {
		const { app, frontmatter } = makeMockApp(
			{ people: ['[[Steve Ryerson]]'] },
			{ 'Steve Ryerson': 'people/Steve Ryerson/Steve Ryerson.md' },
		);
		const service = makeService(app, {
			'Steve Ryerson': 'people/Steve Ryerson/Steve Ryerson.md',
		});
		const source = makeTFile('journal/2026-07-12.md');
		const group = makeTFile('people/groups/The Ryersons/The Ryersons.md');

		const result = await service.trackGroupInsert(source, group, ['Steve Ryerson']);

		expect(result).toEqual({ changed: false, addedLabels: [] });
		expect(frontmatter.people).toEqual(['[[Steve Ryerson]]']);
	});
});
