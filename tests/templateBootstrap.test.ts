import { describe, expect, it } from 'vitest';
import { DEFAULT_PERSON_TEMPLATE } from '../src/services/templateVars';

describe('default templates', () => {
	it('person template includes type person placeholder fields', () => {
		expect(DEFAULT_PERSON_TEMPLATE).toContain('type: person');
		expect(DEFAULT_PERSON_TEMPLATE).toContain('{{title}}');
	});
});
