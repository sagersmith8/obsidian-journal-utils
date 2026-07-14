import {
	buildPersonPath,
	isFlatPersonNotePath,
	isPrimaryPersonNotePath,
} from '../utils/paths';
import { splitFrontmatter } from '../utils/frontmatter';
import {
	DEFAULT_PERSON_TEMPLATE,
	slugifyTitle,
	substituteTemplateVars,
} from './templateVars';

export interface MigrationPlanOptions {
	peopleFolder: string;
	groupsFolder: string;
}

export interface SubNoteMigration {
	path: string;
	heading: string;
}

export interface PersonMigrationPlan {
	personKey: string;
	primaryPath: string;
	targetPath: string;
	subNotes: SubNoteMigration[];
	needsMove: boolean;
	updateFrontmatter: boolean;
}

export interface MigrationPlan {
	people: PersonMigrationPlan[];
}

export interface MigrationPlanSummary {
	moveCount: number;
	mergeCount: number;
	personCount: number;
}

function normalizePath(path: string): string {
	return path.replace(/\\/g, '/');
}

function basenameWithoutExt(path: string): string {
	const base = path.split('/').pop() ?? path;
	return base.endsWith('.md') ? base.slice(0, -3) : base;
}

function normalizeFolder(folder: string): string {
	return folder.replace(/\/+$/, '').replace(/^\/+/, '') || folder;
}

export function isMigratablePeoplePath(
	path: string,
	peopleFolder: string,
	groupsFolder: string,
): boolean {
	const normalized = normalizePath(path);
	const people = normalizeFolder(peopleFolder);
	const groups = normalizeFolder(groupsFolder);

	if (!normalized.startsWith(`${people}/`) || !normalized.endsWith('.md')) {
		return false;
	}

	return !normalized.startsWith(`${groups}/`);
}

export function getPersonKeyFromPath(
	path: string,
	peopleFolder: string,
): string | null {
	const normalized = normalizePath(path);
	const people = normalizeFolder(peopleFolder);

	if (!normalized.startsWith(`${people}/`)) {
		return null;
	}

	const relative = normalized.slice(people.length + 1);
	const segments = relative.split('/').filter(Boolean);
	if (segments.length === 0) {
		return null;
	}

	if (segments.length === 1) {
		return basenameWithoutExt(segments[0] ?? '');
	}

	return segments[0] ?? null;
}

export function detectPrimaryPath(
	paths: string[],
	personKey: string,
	options: MigrationPlanOptions,
): string {
	const sorted = [...paths].sort((a, b) => a.localeCompare(b));

	const nestedPrimary = sorted.find((path) =>
		isPrimaryPersonNotePath(path, options.peopleFolder, options.groupsFolder),
	);
	if (nestedPrimary) {
		return nestedPrimary;
	}

	const flatPrimary = sorted.find((path) =>
		isFlatPersonNotePath(path, options.peopleFolder),
	);
	if (flatPrimary) {
		return flatPrimary;
	}

	const basenameMatch = sorted.find(
		(path) => basenameWithoutExt(path).toLowerCase() === personKey.toLowerCase(),
	);
	if (basenameMatch) {
		return basenameMatch;
	}

	return sorted[0] ?? buildPersonPath(personKey, options.peopleFolder);
}

export function buildMigrationPlan(
	filePaths: string[],
	options: MigrationPlanOptions,
): MigrationPlan {
	const grouped = new Map<string, string[]>();

	for (const path of filePaths) {
		if (!isMigratablePeoplePath(path, options.peopleFolder, options.groupsFolder)) {
			continue;
		}

		const personKey = getPersonKeyFromPath(path, options.peopleFolder);
		if (!personKey) {
			continue;
		}

		const existing = grouped.get(personKey) ?? [];
		existing.push(normalizePath(path));
		grouped.set(personKey, existing);
	}

	const people: PersonMigrationPlan[] = [];

	for (const [personKey, paths] of grouped.entries()) {
		const primaryPath = detectPrimaryPath(paths, personKey, options);
		const targetPath = buildPersonPath(personKey, options.peopleFolder);
		const subNotes = paths
			.filter((path) => path !== primaryPath)
			.sort((a, b) => a.localeCompare(b))
			.map((path) => ({
				path,
				heading: basenameWithoutExt(path),
			}));

		const needsMove = normalizePath(primaryPath) !== normalizePath(targetPath);
		const updateFrontmatter = true;

		if (!needsMove && subNotes.length === 0) {
			continue;
		}

		people.push({
			personKey,
			primaryPath,
			targetPath,
			subNotes,
			needsMove,
			updateFrontmatter,
		});
	}

	people.sort((a, b) => a.personKey.localeCompare(b.personKey));
	return { people };
}

export function summarizeMigrationPlan(plan: MigrationPlan): MigrationPlanSummary {
	return {
		personCount: plan.people.length,
		moveCount: plan.people.filter((person) => person.needsMove).length,
		mergeCount: plan.people.reduce((sum, person) => sum + person.subNotes.length, 0),
	};
}

export function buildMergedNoteContent(
	primaryContent: string,
	subNotes: { heading: string; content: string }[],
): string {
	let result = primaryContent.trimEnd();

	for (const subNote of subNotes) {
		const body = stripFrontmatter(subNote.content).trim();
		if (!body) {
			continue;
		}
		result += `\n\n---\n\n## ${subNote.heading}\n\n${body}\n`;
	}

	return result.endsWith('\n') ? result : `${result}\n`;
}

function stripFrontmatter(content: string): string {
	return splitFrontmatter(content).body;
}

export function ensurePersonFrontmatter(content: string, title: string): string {
	const slug = slugifyTitle(title);
	const date = new Date().toISOString().slice(0, 10);

	if (!content.startsWith('---\n')) {
		return substituteTemplateVars(DEFAULT_PERSON_TEMPLATE, { title, slug, date }) + content;
	}

	const { frontmatter, body } = splitFrontmatter(content);
	if (!frontmatter) {
		return content;
	}

	if (/^type:\s*person\s*$/m.test(frontmatter)) {
		return content;
	}

	const updatedFrontmatter = `${frontmatter.trimEnd()}\ntype: person\n`;
	return `---\n${updatedFrontmatter}---\n${body}`;
}
