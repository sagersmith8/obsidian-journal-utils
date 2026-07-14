import { MetadataCache, TFile } from 'obsidian';
import { countBacklinkSources } from './entitySort';

interface MetadataCacheWithBacklinks extends MetadataCache {
	getBacklinksForFile(file: TFile): { keys(): Iterable<string> } | undefined;
}

export function getBacklinkCountForFile(
	metadataCache: MetadataCache,
	file: TFile,
): number {
	const cache = metadataCache as MetadataCacheWithBacklinks;
	return countBacklinkSources(cache.getBacklinksForFile?.(file));
}
