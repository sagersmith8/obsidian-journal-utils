import type { TFile } from 'obsidian';

export type EntityKind = 'person' | 'group' | 'location';

export interface EntityEntry {
	kind: EntityKind;
	displayName: string;
	file: TFile;
	backlinkCount: number;
	path: string;
}

export interface GhostEntry {
	name: string;
	mentionCount: number;
}
