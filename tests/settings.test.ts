import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, mergeSettings } from '../src/settings';

describe('mergeSettings', () => {
	it('defaults mentionTrackingEnabled to true', () => {
		expect(mergeSettings(null).mentionTrackingEnabled).toBe(true);
		expect(DEFAULT_SETTINGS.mentionTrackingEnabled).toBe(true);
	});
});
