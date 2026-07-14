import { describe, expect, it } from 'vitest';
import { composeGroupNote, splitFrontmatter } from '../src/utils/frontmatter';

describe('splitFrontmatter', () => {
	it('splits yaml frontmatter from body', () => {
		const content = '---\ntype: person\n---\n# Ryerson\n\nNotes here.';
		expect(splitFrontmatter(content)).toEqual({
			frontmatter: 'type: person',
			body: '# Ryerson\n\nNotes here.',
		});
	});
});

describe('composeGroupNote', () => {
	it('preserves existing body when converting person to group', () => {
		const rendered = '---\ntype: group\nmembers:\n  - "[[Steve]]"\n---\n# Ryerson\n';
		const preserved = '# Ryerson\n\nFamily notes.';
		expect(composeGroupNote(rendered, preserved)).toBe(
			'---\ntype: group\nmembers:\n  - "[[Steve]]"\n---\n# Ryerson\n\nFamily notes.\n',
		);
	});

	it('uses template body when preserved body is empty', () => {
		const rendered = '---\ntype: group\n---\n# Ryerson\n';
		expect(composeGroupNote(rendered, '')).toBe('---\ntype: group\n---\n# Ryerson\n');
	});
});
