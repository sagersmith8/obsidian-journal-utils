import { App, TFile } from 'obsidian';
import {
	DEFAULT_LOCATION_TEMPLATE,
	DEFAULT_PERSON_TEMPLATE,
	slugifyTitle,
	substituteTemplateVars,
} from './templateVars';

export class TemplateService {
	constructor(private app: App) {}

	async render(
		templatePath: string,
		vars: Record<string, string>,
		defaultTemplate: string = DEFAULT_PERSON_TEMPLATE,
	): Promise<string> {
		const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
		let content = defaultTemplate;

		if (templateFile instanceof TFile) {
			content = await this.app.vault.read(templateFile);
		}

		return substituteTemplateVars(content, vars);
	}

	buildEntityVars(title: string): Record<string, string> {
		return {
			title,
			slug: slugifyTitle(title),
			date: new Date().toISOString().slice(0, 10),
		};
	}

	buildPersonVars(title: string): Record<string, string> {
		return this.buildEntityVars(title);
	}

	buildLocationVars(title: string): Record<string, string> {
		return this.buildEntityVars(title);
	}
}
