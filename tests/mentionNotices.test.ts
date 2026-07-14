import { describe, expect, it, vi } from 'vitest';
import { isFrontmatterYamlError, showMentionTrackNotice } from '../src/utils/mentionNotices';

vi.mock('obsidian', () => ({
	Notice: vi.fn(),
}));

import { Notice } from 'obsidian';

describe('isFrontmatterYamlError', () => {
	it('detects YAMLParseError by name', () => {
		const error = new Error('bad yaml');
		error.name = 'YAMLParseError';
		expect(isFrontmatterYamlError(error)).toBe(true);
	});

	it('returns false for other errors', () => {
		expect(isFrontmatterYamlError(new Error('nope'))).toBe(false);
	});
});

describe('showMentionTrackNotice', () => {
	it('shows added notice when list changed', () => {
		showMentionTrackNotice(
			{ changed: true, addedLabels: ['Joy'] },
			'people',
		);
		expect(Notice).toHaveBeenCalledWith('Added Joy to people');
	});

	it('joins multiple added labels', () => {
		showMentionTrackNotice(
			{ changed: true, addedLabels: ['Joy', 'Matt'] },
			'people',
		);
		expect(Notice).toHaveBeenCalledWith('Added Joy, Matt to people');
	});

	it('shows nothing when unchanged', () => {
		vi.mocked(Notice).mockClear();
		showMentionTrackNotice({ changed: false, addedLabels: [] }, 'people');
		expect(Notice).not.toHaveBeenCalled();
	});

	it('shows frontmatter error when tracking failed', () => {
		showMentionTrackNotice({ changed: false, addedLabels: [], failed: true }, 'people');
		expect(Notice).toHaveBeenCalledWith(
			'Could not update frontmatter — check YAML in this note',
		);
	});
});
