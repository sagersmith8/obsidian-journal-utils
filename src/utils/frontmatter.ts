export function splitFrontmatter(content: string): {
	frontmatter: string | null;
	body: string;
} {
	if (!content.startsWith('---\n')) {
		return { frontmatter: null, body: content };
	}

	const end = content.indexOf('\n---\n', 4);
	if (end === -1) {
		return { frontmatter: null, body: content };
	}

	return {
		frontmatter: content.slice(4, end),
		body: content.slice(end + 5),
	};
}

/** Keep new group frontmatter and preserve existing note body when converting. */
export function composeGroupNote(renderedTemplate: string, preservedBody: string): string {
	const frontmatterMatch = renderedTemplate.match(/^---\n[\s\S]*?\n---\n/);
	if (!frontmatterMatch) {
		return renderedTemplate;
	}

	const { body: templateBody } = splitFrontmatter(renderedTemplate);
	const body = preservedBody.trim() || templateBody.trim();
	if (!body) {
		return frontmatterMatch[0];
	}

	return `${frontmatterMatch[0]}${body}\n`;
}
