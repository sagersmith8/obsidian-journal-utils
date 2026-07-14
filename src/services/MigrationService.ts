import { App, Notice, TFile } from 'obsidian';
import type { JournalUtilsSettings } from '../settings';
import { ensureFolderExists } from '../utils/vault';
import {
	buildMergedNoteContent,
	buildMigrationPlan,
	ensurePersonFrontmatter,
	isMigratablePeoplePath,
	type MigrationPlan,
	type PersonMigrationPlan,
} from './migrationPlan';

export interface MigrationResult {
	moved: number;
	merged: number;
	deleted: number;
	log: string[];
	errors: string[];
}

export class MigrationService {
	constructor(
		private app: App,
		private getSettings: () => JournalUtilsSettings,
	) {}

	buildPlan(): MigrationPlan {
		const settings = this.getSettings();
		const filePaths = this.app.vault
			.getMarkdownFiles()
			.filter((file) =>
				isMigratablePeoplePath(
					file.path,
					settings.peopleFolder,
					settings.groupsFolder,
				),
			)
			.map((file) => file.path);

		return buildMigrationPlan(filePaths, {
			peopleFolder: settings.peopleFolder,
			groupsFolder: settings.groupsFolder,
		});
	}

	async execute(plan: MigrationPlan): Promise<MigrationResult> {
		const result: MigrationResult = {
			moved: 0,
			merged: 0,
			deleted: 0,
			log: [],
			errors: [],
		};

		for (const person of plan.people) {
			try {
				await this.migratePerson(person, result);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Unknown error';
				result.errors.push(`${person.personKey}: ${message}`);
			}
		}

		return result;
	}

	private async migratePerson(
		person: PersonMigrationPlan,
		result: MigrationResult,
	): Promise<void> {
		const primaryFile = this.app.vault.getAbstractFileByPath(person.primaryPath);
		if (!(primaryFile instanceof TFile)) {
			throw new Error(`Primary note not found at ${person.primaryPath}`);
		}

		let content = await this.app.vault.read(primaryFile);

		if (person.subNotes.length > 0) {
			const subContents: { heading: string; content: string }[] = [];
			for (const subNote of person.subNotes) {
				const subFile = this.app.vault.getAbstractFileByPath(subNote.path);
				if (subFile instanceof TFile) {
					subContents.push({
						heading: subNote.heading,
						content: await this.app.vault.read(subFile),
					});
				}
			}
			content = buildMergedNoteContent(content, subContents);
			result.merged += person.subNotes.length;
			result.log.push(
				`Merged ${person.subNotes.length} sub-note(s) into ${person.personKey}`,
			);
		}

		if (person.updateFrontmatter) {
			content = ensurePersonFrontmatter(content, person.personKey);
		}

		await this.app.vault.modify(primaryFile, content);

		if (person.needsMove) {
			const folderPath = person.targetPath.slice(0, person.targetPath.lastIndexOf('/'));
			await ensureFolderExists(this.app, folderPath);
			await this.app.fileManager.renameFile(primaryFile, person.targetPath);
			result.moved += 1;
			result.log.push(`Moved ${person.primaryPath} → ${person.targetPath}`);
		}

		for (const subNote of person.subNotes) {
			const subFile = this.app.vault.getAbstractFileByPath(subNote.path);
			if (subFile instanceof TFile) {
				await this.app.vault.trash(subFile, true);
				result.deleted += 1;
				result.log.push(`Removed merged sub-note ${subNote.path}`);
			}
		}
	}
}
