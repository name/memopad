import { App, PluginSettingTab, Setting } from "obsidian";
import MemopadPlugin from "./main";

export interface CategoryConfig {
	name: string;
	keywords: string[];
}

export interface MemopadSettings {
	inboxFilePath: string;
	taskKeywords: string[];
	categories: CategoryConfig[];
	defaultCategory: string;
	entryTypes: string[];
}

export const DEFAULT_SETTINGS: MemopadSettings = {
	inboxFilePath: "Memopad.md",
	taskKeywords: [
		"fix",
		"call",
		"email",
		"send",
		"buy",
		"finish",
		"complete",
		"review",
		"check",
		"update",
		"create",
		"make",
		"write",
		"schedule",
		"book",
		"meet",
		"submit",
		"prepare",
		"clean",
		"organize",
	],
	categories: [
		{
			name: "work",
			keywords: ["jira", "meeting", "standup", "client", "deploy", "pr", "sprint", "ticket", "slack", "report"],
		},
		{
			name: "personal",
			keywords: ["home", "family", "gym", "doctor", "shopping", "groceries"],
		},
	],
	defaultCategory: "personal",
	entryTypes: ["note", "idea", "log", "task"],
};

export class MemopadSettingTab extends PluginSettingTab {
	plugin: MemopadPlugin;

	constructor(app: App, plugin: MemopadPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Inbox file path
		new Setting(containerEl)
			.setName("Inbox file path")
			.setDesc("Path to the file where captured entries will be appended.")
			.addText((text) =>
				text
					.setPlaceholder("Memopad.md")
					.setValue(this.plugin.settings.inboxFilePath)
					.onChange(async (value) => {
						this.plugin.settings.inboxFilePath = value || DEFAULT_SETTINGS.inboxFilePath;
						await this.plugin.saveSettings();
					}),
			);

		// Default category
		new Setting(containerEl)
			.setName("Default task category")
			.setDesc("Default category for tasks when no keywords match.")
			.addText((text) =>
				text
					.setPlaceholder("Personal")
					.setValue(this.plugin.settings.defaultCategory)
					.onChange(async (value) => {
						this.plugin.settings.defaultCategory = value || DEFAULT_SETTINGS.defaultCategory;
						await this.plugin.saveSettings();
					}),
			);

		// Task keywords section
		new Setting(containerEl).setName("Task keywords").setHeading();

		new Setting(containerEl)
			.setName("Keywords")
			.setDesc(
				"Comma-separated list of words that trigger task detection when they appear at the start of input.",
			)
			.addTextArea((text) =>
				text
					.setPlaceholder("Fix, call, email, send...")
					.setValue(this.plugin.settings.taskKeywords.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.taskKeywords = value
							.split(",")
							.map((k) => k.trim().toLowerCase())
							.filter((k) => k.length > 0);
						await this.plugin.saveSettings();
					}),
			);

		// Entry types section
		new Setting(containerEl).setName("Entry types").setHeading();

		new Setting(containerEl)
			.setName("Types")
			.setDesc("Comma-separated list of entry types (e.g., note, idea, log, task).")
			.addTextArea((text) =>
				text
					.setPlaceholder("Note, idea, log, task")
					.setValue(this.plugin.settings.entryTypes.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.entryTypes = value
							.split(",")
							.map((t) => t.trim().toLowerCase())
							.filter((t) => t.length > 0);
						await this.plugin.saveSettings();
					}),
			);

		// Categories section
		new Setting(containerEl).setName("Categories").setHeading();

		new Setting(containerEl).setDesc(
			"Categories are used to classify tasks. Each category has keywords that trigger automatic categorization.",
		);

		const categoriesContainer = containerEl.createDiv({ cls: "memopad-categories-container" });
		this.renderCategories(categoriesContainer);

		// Add category button
		new Setting(containerEl).addButton((button) =>
			button.setButtonText("Add category").onClick(() => {
				this.plugin.settings.categories.push({
					name: "new-category",
					keywords: [],
				});
				void this.plugin.saveSettings().then(() => {
					this.display();
				});
			}),
		);
	}

	renderCategories(container: HTMLElement): void {
		container.empty();

		this.plugin.settings.categories.forEach((category, index) => {
			const categoryDiv = container.createDiv({ cls: "memopad-category-item" });

			new Setting(categoryDiv)
				.setName(category.name)
				.addText((text) =>
					text
						.setPlaceholder("Category name")
						.setValue(category.name)
						.onChange(async (value) => {
							const cat = this.plugin.settings.categories[index];
							if (cat) {
								cat.name = value.toLowerCase().trim();
								await this.plugin.saveSettings();
							}
						}),
				)
				.addButton((button) =>
					button
						.setButtonText("Remove")
						.setWarning()
						.onClick(() => {
							this.plugin.settings.categories.splice(index, 1);
							void this.plugin.saveSettings().then(() => {
								this.display();
							});
						}),
				);

			new Setting(categoryDiv).setName("Keywords").addTextArea((text) =>
				text
					.setPlaceholder("Jira, meeting, client...")
					.setValue(category.keywords.join(", "))
					.onChange(async (value) => {
						const cat = this.plugin.settings.categories[index];
						if (cat) {
							cat.keywords = value
								.split(",")
								.map((k) => k.trim().toLowerCase())
								.filter((k) => k.length > 0);
							await this.plugin.saveSettings();
						}
					}),
			);
		});
	}
}
