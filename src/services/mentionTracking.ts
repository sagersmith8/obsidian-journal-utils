export type LinkResolver = (linkText: string, sourcePath: string) => string | null;

/** Extract link text from a frontmatter list entry or plain name. */
export function parseWikilinkString(value: string): string | null {
	let trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		trimmed = trimmed.slice(1, -1).trim();
		if (!trimmed) {
			return null;
		}
	}

	const match = trimmed.match(/^\[\[(.*?)\]\]$/);
	if (match) {
		const linkText = match[1]?.trim() ?? '';
		return linkText || null;
	}

	return trimmed;
}

/** Coerce Obsidian frontmatter list values to string entries. */
export function normalizeListProperty(raw: unknown): string[] {
	if (!Array.isArray(raw)) {
		return [];
	}

	return raw.filter((item): item is string => typeof item === 'string');
}

/** Resolve a list entry to a vault file path for deduplication. */
export function entryResolvesToPath(
	entry: string,
	sourcePath: string,
	resolveLink: LinkResolver,
): string | null {
	const linkText = parseWikilinkString(entry);
	if (!linkText) {
		return null;
	}

	return resolveLink(linkText, sourcePath);
}

/**
 * Return formatted wikilink strings to append, deduped by resolved file path.
 * `candidatePaths` are target note paths; `formatEntry` produces list values like `[[Joy]]`.
 */
export function collectNewEntries(
	existingEntries: string[],
	candidatePaths: string[],
	sourcePath: string,
	resolveLink: LinkResolver,
	formatEntry: (path: string) => string,
): string[] {
	const existingPaths = new Set<string>();
	for (const entry of existingEntries) {
		const path = entryResolvesToPath(entry, sourcePath, resolveLink);
		if (path) {
			existingPaths.add(path);
		}
	}

	const newEntries: string[] = [];
	const seenCandidates = new Set<string>();

	for (const path of candidatePaths) {
		if (!path || seenCandidates.has(path) || existingPaths.has(path)) {
			continue;
		}

		seenCandidates.add(path);
		existingPaths.add(path);
		newEntries.push(formatEntry(path));
	}

	return newEntries;
}

/** Extract display names from a group note members frontmatter value. */
export function extractMemberNames(raw: unknown): string[] {
	return normalizeListProperty(raw)
		.map((entry) => parseWikilinkString(entry))
		.filter((name): name is string => Boolean(name));
}
