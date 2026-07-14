import { Notice } from 'obsidian';
import type { MentionTrackResult } from '../services/MentionTrackingService';

export type MentionListKey = 'people' | 'locations';

export function isFrontmatterYamlError(error: unknown): boolean {
	return error instanceof Error && error.name === 'YAMLParseError';
}

export function showMentionTrackNotice(
	result: MentionTrackResult,
	listKey: MentionListKey,
): void {
	if (result.failed) {
		new Notice('Could not update frontmatter — check YAML in this note');
		return;
	}

	if (!result.changed || result.addedLabels.length === 0) {
		return;
	}

	const names = result.addedLabels.join(', ');
	new Notice(`Added ${names} to ${listKey}`);
}
