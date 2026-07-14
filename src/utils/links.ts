import { MetadataCache, TFile } from 'obsidian';

/** Build a wikilink markdown string from resolved link text. */
export function buildWikilink(linkText: string): string {
	return `[[${linkText}]]`;
}

/** Shortest valid wikilink from sourcePath to target file. */
export function formatWikilinkForFile(
	metadataCache: MetadataCache,
	target: TFile,
	sourcePath: string,
): string {
	const linkText = metadataCache.fileToLinktext(target, sourcePath);
	return buildWikilink(linkText);
}
