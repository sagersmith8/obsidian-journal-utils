/** Pre-seeded terms from journal template / section headings — not people or locations. */
export const DEFAULT_GHOST_BLOCKLIST: readonly string[] = [
	'accomplished',
	'excited',
	'Gratitude',
	'Goals',
	'learned',
	'gratitude',
	'workout',
	'Health',
	'Cardio',
	'Learned',
	'work',
	'Programming',
	'Chess',
	'Guitar',
	'signal',
	'Mindfulness',
	'meditation',
	'My Philosophy',
	'journal',
];

const INVALID_NAME_CHARS = /[\\/:*?"<>|]/g;

export function sanitizeEntityName(name: string): string | null {
	const trimmed = name.trim().replace(INVALID_NAME_CHARS, '');
	return trimmed.length > 0 ? trimmed : null;
}

export function buildVaultRootNotePath(name: string): string {
	const safe = sanitizeEntityName(name);
	if (!safe) {
		throw new Error('Invalid note name');
	}
	return `${safe}.md`;
}

export function buildFlatPersonPath(name: string, peopleFolder = 'people'): string {
	const safe = sanitizeEntityName(name);
	if (!safe) {
		throw new Error('Invalid person name');
	}
	return `${normalizeFolder(peopleFolder)}/${safe}.md`;
}

export function buildPersonPath(name: string, peopleFolder = 'people'): string {
	const safe = sanitizeEntityName(name);
	if (!safe) {
		throw new Error('Invalid person name');
	}
	return `${normalizeFolder(peopleFolder)}/${safe}/${safe}.md`;
}

export function buildGroupPath(name: string, groupsFolder = 'people/groups'): string {
	const safe = sanitizeEntityName(name);
	if (!safe) {
		throw new Error('Invalid group name');
	}
	return `${normalizeFolder(groupsFolder)}/${safe}/${safe}.md`;
}

export function buildLocationPath(name: string, locationsFolder = 'locations'): string {
	const safe = sanitizeEntityName(name);
	if (!safe) {
		throw new Error('Invalid location name');
	}
	return `${normalizeFolder(locationsFolder)}/${safe}/${safe}.md`;
}

function normalizeFolder(folder: string): string {
	return folder.replace(/\/+$/, '').replace(/^\/+/, '') || folder;
}

function basename(path: string): string {
	const parts = path.split('/');
	return parts[parts.length - 1] ?? path;
}

function basenameWithoutExt(path: string): string {
	const base = basename(path);
	return base.endsWith('.md') ? base.slice(0, -3) : base;
}

export function isPrimaryPersonNotePath(
	path: string,
	peopleFolder = 'people',
	groupsFolder = 'people/groups',
): boolean {
	const normalized = path.replace(/\\/g, '/');
	const people = normalizeFolder(peopleFolder);
	const groups = normalizeFolder(groupsFolder);

	if (!normalized.startsWith(`${people}/`) || normalized.startsWith(`${groups}/`)) {
		return false;
	}

	const relative = normalized.slice(people.length + 1);
	const segments = relative.split('/');
	if (segments.length !== 2) {
		return false;
	}

	const [folder, file] = segments;
	if (!folder || !file) {
		return false;
	}

	return folder === basenameWithoutExt(file);
}

export function isPrimaryGroupNotePath(
	path: string,
	groupsFolder = 'people/groups',
): boolean {
	const normalized = path.replace(/\\/g, '/');
	const groups = normalizeFolder(groupsFolder);

	if (!normalized.startsWith(`${groups}/`)) {
		return false;
	}

	const relative = normalized.slice(groups.length + 1);
	const segments = relative.split('/');
	if (segments.length !== 2) {
		return false;
	}

	const [folder, file] = segments;
	if (!folder || !file) {
		return false;
	}

	return folder === basenameWithoutExt(file);
}

export function isPrimaryLocationNotePath(
	path: string,
	locationsFolder = 'locations',
): boolean {
	const normalized = path.replace(/\\/g, '/');
	const locations = normalizeFolder(locationsFolder);

	if (!normalized.startsWith(`${locations}/`)) {
		return false;
	}

	const relative = normalized.slice(locations.length + 1);
	const segments = relative.split('/');
	if (segments.length !== 2) {
		return false;
	}

	const [folder, file] = segments;
	if (!folder || !file) {
		return false;
	}

	return folder === basenameWithoutExt(file);
}

/** Flat person note pending migration: `people/{Name}.md` */
export function isFlatPersonNotePath(
	path: string,
	peopleFolder = 'people',
): boolean {
	const normalized = path.replace(/\\/g, '/');
	const people = normalizeFolder(peopleFolder);

	if (!normalized.startsWith(`${people}/`)) {
		return false;
	}

	const relative = normalized.slice(people.length + 1);
	return relative.split('/').length === 1 && relative.endsWith('.md');
}

export function isPrimaryOrFlatPersonNotePath(
	path: string,
	peopleFolder = 'people',
	groupsFolder = 'people/groups',
): boolean {
	return (
		isPrimaryPersonNotePath(path, peopleFolder, groupsFolder) ||
		isFlatPersonNotePath(path, peopleFolder)
	);
}
