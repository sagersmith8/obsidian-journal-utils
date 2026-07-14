import { App, TFile } from 'obsidian';
import {
	DEFAULT_PERSON_TEMPLATE,
	slugifyTitle,
	substituteTemplateVars,
} from './templateVars';

export class TemplateService {
	constructor(private app: App) {}

	async render(templatePath: string, vars: Record<string, string>): Promise<string> {
		const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
		let content = DEFAULT_PERSON_TEMPLATE;

		if (templateFile instanceof TFile) {
			content = await this.app.vault.read(templateFile);
		}

		return substituteTemplateVars(content, vars);
	}

	buildPersonVars(title: string): Record<string, string> {
		return {
			title,
			slug: slugifyTitle(title),
			date: new Date().toISOString().slice(0, 10),
		};
	}
}
