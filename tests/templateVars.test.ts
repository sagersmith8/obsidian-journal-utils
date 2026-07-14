import { describe, expect, it } from 'vitest';
import {
	DEFAULT_PERSON_TEMPLATE,
	slugifyTitle,
	substituteTemplateVars,
} from '../src/services/templateVars';

describe('substituteTemplateVars', () => {
	it('replaces known placeholders', () => {
		const result = substituteTemplateVars('Hello {{title}} on {{date}}', {
			title: 'Sean',
			date: '2026-07-14',
		});
		expect(result).toBe('Hello Sean on 2026-07-14');
	});

	it('leaves unknown placeholders empty', () => {
		expect(substituteTemplateVars('{{missing}}', {})).toBe('');
	});
});

describe('slugifyTitle', () => {
	it('lowercases and hyphenates', () => {
		expect(slugifyTitle('Sean Smith')).toBe('sean-smith');
	});
});

describe('DEFAULT_PERSON_TEMPLATE', () => {
	it('includes title and slug placeholders', () => {
		expect(DEFAULT_PERSON_TEMPLATE).toContain('{{title}}');
		expect(DEFAULT_PERSON_TEMPLATE).toContain('{{slug}}');
	});
});
