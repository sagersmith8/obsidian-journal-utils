export const DEFAULT_PERSON_TEMPLATE = `---
tags:
  - people/{{slug}}
type: person
photo:
---
# {{title}}
`;

export const DEFAULT_LOCATION_TEMPLATE = `---
tags:
  - location
type: location
photo:
---
# {{title}}
`;

export const DEFAULT_GROUP_TEMPLATE = `---
tags:
  - people/group
type: group
{{members}}
photo:
---
# {{title}}
`;

export function slugifyTitle(title: string): string {
	return title
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
}

/** YAML block for group member wikilinks in frontmatter. */
export function formatMembersYamlBlock(memberNames: string[]): string {
	if (memberNames.length === 0) {
		return 'members:';
	}

	const lines = memberNames.map((name) => `  - "[[${name}]]"`);
	return `members:\n${lines.join('\n')}`;
}

/** Replace {{key}} placeholders in template content. */
export function substituteTemplateVars(
	content: string,
	vars: Record<string, string>,
): string {
	return content.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => vars[key] ?? '');
}
