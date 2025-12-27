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

		containerEl.createEl("h2", { text: "Memopad settings" });

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
			.setName("Default category")
			.setDesc("Default category for tasks when no keywords match.")
			.addText((text) =>
				text
					.setPlaceholder("personal")
					.setValue(this.plugin.settings.defaultCategory)
					.onChange(async (value) => {
						this.plugin.settings.defaultCategory = value || DEFAULT_SETTINGS.defaultCategory;
						await this.plugin.saveSettings();
					}),
			);

		// Task keywords section
		containerEl.createEl("h3", { text: "Task keywords" });
		containerEl.createEl("p", {
			text: "Words that trigger task detection when they appear at the start of input.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("Task keywords")
			.setDesc("Comma-separated list of keywords.")
			.addTextArea((text) =>
				text
					.setPlaceholder("fix, call, email, send...")
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
		containerEl.createEl("h3", { text: "Entry types" });

		new Setting(containerEl)
			.setName("Entry types")
			.setDesc("Comma-separated list of entry types (e.g., note, idea, log, task).")
			.addTextArea((text) =>
				text
					.setPlaceholder("note, idea, log, task")
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
		containerEl.createEl("h3", { text: "Categories" });
		containerEl.createEl("p", {
			text: "Categories are used to classify tasks. Each category has keywords that trigger automatic categorization.",
			cls: "setting-item-description",
		});

		const categoriesContainer = containerEl.createDiv({ cls: "memopad-categories-container" });
		this.renderCategories(categoriesContainer);

		// Add category button
		new Setting(containerEl).addButton((button) =>
			button.setButtonText("Add category").onClick(async () => {
				this.plugin.settings.categories.push({
					name: "new-category",
					keywords: [],
				});
				await this.plugin.saveSettings();
				this.display();
			}),
		);
	}

	renderCategories(container: HTMLElement): void {
		container.empty();

		this.plugin.settings.categories.forEach((category, index) => {
			const categoryDiv = container.createDiv({ cls: "memopad-category-item" });

			new Setting(categoryDiv)
				.setName(`Category: ${category.name}`)
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
						.onClick(async () => {
							this.plugin.settings.categories.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						}),
				);

			new Setting(categoryDiv).setName("Keywords").addTextArea((text) =>
				text
					.setPlaceholder("jira, meeting, client...")
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
