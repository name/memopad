import { App, Modal, Notice, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, MemopadSettings, MemopadSettingTab } from "./settings";

export default class MemopadPlugin extends Plugin {
	settings: MemopadSettings;

	async onload() {
		await this.loadSettings();

		// Add command to open the capture modal
		this.addCommand({
			id: "open-capture-modal",
			name: "Capture thought",
			callback: () => {
				new CaptureModal(this.app, this).open();
			},
		});

		// Add settings tab
		this.addSettingTab(new MemopadSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<MemopadSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async appendToInbox(formattedEntry: string, isTask: boolean) {
		const filePath = this.settings.inboxFilePath;
		const timestamp = new Date().toISOString().slice(0, 10);

		const file = this.app.vault.getAbstractFileByPath(filePath);

		// Use checkbox for tasks, regular list item for others
		const entryLine = isTask ? `- [ ] ${formattedEntry}\n` : `- ${formattedEntry}\n`;

		if (!file) {
			// Create the file if it doesn't exist
			await this.app.vault.create(filePath, `# Memopad Inbox\n\n## ${timestamp}\n${entryLine}`);
		} else if (file instanceof TFile) {
			// Append to existing file
			const content = await this.app.vault.read(file);
			const dateHeader = `## ${timestamp}`;

			if (content.includes(dateHeader)) {
				// Add under existing date header
				const updatedContent = content.replace(dateHeader, `${dateHeader}\n${entryLine.trim()}`);
				await this.app.vault.modify(file, updatedContent);
			} else {
				// Add new date section at the end
				const updatedContent = `${content.trimEnd()}\n\n${dateHeader}\n${entryLine}`;
				await this.app.vault.modify(file, updatedContent);
			}
		}

		new Notice("Captured to memopad");
	}
}

class CaptureModal extends Modal {
	plugin: MemopadPlugin;
	inputEl: HTMLTextAreaElement;
	previewEl: HTMLDivElement;

	constructor(app: App, plugin: MemopadPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass("memopad-capture-modal");

		contentEl.createEl("h2", { text: "Capture thought" });

		// Input area
		this.inputEl = contentEl.createEl("textarea", {
			attr: {
				placeholder: 'Type naturally... "fix login bug tomorrow", "note: llm eval idea", "call mum"',
				rows: "3",
			},
		});
		this.inputEl.addClass("memopad-input");

		// Preview area
		const previewContainer = contentEl.createDiv({ cls: "memopad-preview-container" });
		previewContainer.createEl("label", { text: "Preview:" });
		this.previewEl = previewContainer.createDiv({ cls: "memopad-preview" });
		this.previewEl.setText("Start typing to see preview...");

		// Update preview on input
		this.inputEl.addEventListener("input", () => {
			this.updatePreview();
		});

		// Button container
		const buttonContainer = contentEl.createDiv({ cls: "memopad-buttons" });

		const captureBtn = buttonContainer.createEl("button", { text: "Capture", cls: "mod-cta" });
		captureBtn.addEventListener("click", () => {
			void this.capture();
		});

		const cancelBtn = buttonContainer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		// Handle Enter to submit (Shift+Enter for newline)
		this.inputEl.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				void this.capture();
			}
			if (e.key === "Escape") {
				this.close();
			}
		});

		// Focus input
		this.inputEl.focus();
	}

	updatePreview() {
		const input = this.inputEl.value.trim();
		if (!input) {
			this.previewEl.setText("Start typing to see preview...");
			return;
		}

		const { formatted, isTask } = this.parseInput(input);
		const prefix = isTask ? "- [ ] " : "- ";
		this.previewEl.setText(`${prefix}${formatted}`);
	}

	parseInput(input: string): { formatted: string; isTask: boolean } {
		const lowerInput = input.toLowerCase();
		const settings = this.plugin.settings;

		// Check for explicit type prefixes from settings
		for (const entryType of settings.entryTypes) {
			if (entryType === "task") continue; // Handle task separately

			if (lowerInput.startsWith(entryType + ":") || lowerInput.startsWith(entryType + " ")) {
				const regex = new RegExp(`^${entryType}:?\\s*`, "i");
				const content = input.replace(regex, "");
				return { formatted: `[${entryType}] ${content}`, isTask: false };
			}
		}

		// Check for explicit category prefix (e.g., "work: fix bug", "personal: call mum")
		for (const category of settings.categories) {
			if (lowerInput.startsWith(category.name + ":") || lowerInput.startsWith(category.name + " ")) {
				const regex = new RegExp(`^${category.name}:?\\s*`, "i");
				const content = input.replace(regex, "");
				return this.formatTaskWithCategory(content, category.name);
			}
		}

		// Check for explicit task prefix
		if (lowerInput.startsWith("task:") || lowerInput.startsWith("task ")) {
			const content = input.replace(/^task:?\s*/i, "");
			return this.formatTask(content);
		}

		// Heuristics for task detection using configurable keywords
		const startsWithTaskKeyword = settings.taskKeywords.some(
			(keyword) => lowerInput.startsWith(keyword + " ") || lowerInput.startsWith(keyword + ":"),
		);

		if (startsWithTaskKeyword) {
			return this.formatTask(input);
		}

		// Default to note
		return { formatted: `[note] ${input}`, isTask: false };
	}

	formatTaskWithCategory(input: string, category: string): { formatted: string; isTask: boolean } {
		const { dateStr, cleanedInput } = this.parseDate(input);
		return { formatted: `[task:${category}] ${cleanedInput}${dateStr}`, isTask: true };
	}

	formatTask(input: string): { formatted: string; isTask: boolean } {
		const lowerInput = input.toLowerCase();
		const settings = this.plugin.settings;

		// Detect category from configurable keywords
		let detectedCategory = settings.defaultCategory;

		for (const category of settings.categories) {
			const hasKeyword = category.keywords.some((keyword) => lowerInput.includes(keyword));
			if (hasKeyword) {
				detectedCategory = category.name;
				break;
			}
		}

		// Detect and parse date
		const { dateStr, cleanedInput } = this.parseDate(input);

		// Use colon separator to avoid markdown link interpretation
		return { formatted: `[task:${detectedCategory}] ${cleanedInput}${dateStr}`, isTask: true };
	}

	parseDate(input: string): { dateStr: string; cleanedInput: string } {
		const lowerInput = input.toLowerCase();
		let cleanedInput = input;

		const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Day name mapping (0 = Sunday, 1 = Monday, etc.)
		const dayNames: Record<string, number> = {
			sunday: 0,
			sun: 0,
			monday: 1,
			mon: 1,
			tuesday: 2,
			tue: 2,
			tues: 2,
			wednesday: 3,
			wed: 3,
			thursday: 4,
			thu: 4,
			thur: 4,
			thurs: 4,
			friday: 5,
			fri: 5,
			saturday: 6,
			sat: 6,
		};

		// Check for "today"
		if (/\btoday\b/i.test(lowerInput)) {
			cleanedInput = input.replace(/\s*\btoday\b\s*/gi, " ").trim();
			return { dateStr: ` 📅 ${formatDate(today)}`, cleanedInput };
		}

		// Check for "tomorrow"
		if (/\btomorrow\b/i.test(lowerInput)) {
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);
			cleanedInput = input.replace(/\s*\btomorrow\b\s*/gi, " ").trim();
			return { dateStr: ` 📅 ${formatDate(tomorrow)}`, cleanedInput };
		}

		// Check for "yesterday"
		if (/\byesterday\b/i.test(lowerInput)) {
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);
			cleanedInput = input.replace(/\s*\byesterday\b\s*/gi, " ").trim();
			return { dateStr: ` 📅 ${formatDate(yesterday)}`, cleanedInput };
		}

		// Check for "in N days/weeks/months"
		const inNPattern = /\bin\s+(\d+)\s+(day|days|week|weeks|month|months)\b/i;
		const inNMatch = lowerInput.match(inNPattern);
		if (inNMatch && inNMatch[1] && inNMatch[2]) {
			const amount = parseInt(inNMatch[1], 10);
			const unit = inNMatch[2].toLowerCase();
			const targetDate = new Date(today);

			if (unit.startsWith("day")) {
				targetDate.setDate(targetDate.getDate() + amount);
			} else if (unit.startsWith("week")) {
				targetDate.setDate(targetDate.getDate() + amount * 7);
			} else if (unit.startsWith("month")) {
				targetDate.setMonth(targetDate.getMonth() + amount);
			}

			cleanedInput = input.replace(inNPattern, " ").trim();
			return { dateStr: ` 📅 ${formatDate(targetDate)}`, cleanedInput };
		}

		// Check for "next <dayname>" (e.g., "next wednesday")
		const nextDayPattern =
			/\bnext\s+(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thur|thurs|friday|fri|saturday|sat)\b/i;
		const nextDayMatch = lowerInput.match(nextDayPattern);
		if (nextDayMatch && nextDayMatch[1]) {
			const targetDayName = nextDayMatch[1].toLowerCase();
			const targetDay = dayNames[targetDayName];
			if (targetDay !== undefined) {
				const targetDate = new Date(today);
				const currentDay = today.getDay();
				// "next X" means the upcoming X (same as standalone day name)
				let daysUntil = targetDay - currentDay;
				if (daysUntil <= 0) {
					daysUntil += 7;
				}
				targetDate.setDate(targetDate.getDate() + daysUntil);

				cleanedInput = input.replace(nextDayPattern, " ").trim();
				return { dateStr: ` 📅 ${formatDate(targetDate)}`, cleanedInput };
			}
		}

		// Check for "this <dayname>" (e.g., "this friday")
		const thisDayPattern =
			/\bthis\s+(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thur|thurs|friday|fri|saturday|sat)\b/i;
		const thisDayMatch = lowerInput.match(thisDayPattern);
		if (thisDayMatch && thisDayMatch[1]) {
			const targetDayName = thisDayMatch[1].toLowerCase();
			const targetDay = dayNames[targetDayName];
			if (targetDay !== undefined) {
				const targetDate = new Date(today);
				const currentDay = today.getDay();
				let daysUntil = targetDay - currentDay;
				if (daysUntil <= 0) {
					daysUntil += 7;
				}
				targetDate.setDate(targetDate.getDate() + daysUntil);

				cleanedInput = input.replace(thisDayPattern, " ").trim();
				return { dateStr: ` 📅 ${formatDate(targetDate)}`, cleanedInput };
			}
		}

		// Check for standalone day name (e.g., "tuesday", "on friday")
		const standaloneDayPattern =
			/\b(?:on\s+)?(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thur|thurs|friday|fri|saturday|sat)\b/i;
		const standaloneDayMatch = lowerInput.match(standaloneDayPattern);
		if (standaloneDayMatch && standaloneDayMatch[1]) {
			const targetDayName = standaloneDayMatch[1].toLowerCase();
			const targetDay = dayNames[targetDayName];
			if (targetDay !== undefined) {
				const targetDate = new Date(today);
				const currentDay = today.getDay();
				let daysUntil = targetDay - currentDay;
				// If the day is today or in the past this week, go to next week
				if (daysUntil <= 0) {
					daysUntil += 7;
				}
				targetDate.setDate(targetDate.getDate() + daysUntil);

				cleanedInput = input.replace(standaloneDayPattern, " ").trim();
				return { dateStr: ` 📅 ${formatDate(targetDate)}`, cleanedInput };
			}
		}

		// Check for "next week" (defaults to next Monday)
		if (/\bnext\s+week\b/i.test(lowerInput)) {
			const targetDate = new Date(today);
			const currentDay = today.getDay();
			const daysUntilMonday = ((1 - currentDay + 7) % 7) + 7; // Next week's Monday
			targetDate.setDate(targetDate.getDate() + daysUntilMonday);

			cleanedInput = input.replace(/\s*\bnext\s+week\b\s*/gi, " ").trim();
			return { dateStr: ` 📅 ${formatDate(targetDate)}`, cleanedInput };
		}

		// No date found
		return { dateStr: "", cleanedInput };
	}

	async capture() {
		const input = this.inputEl.value.trim();
		if (!input) {
			new Notice("Nothing to capture");
			return;
		}

		const { formatted, isTask } = this.parseInput(input);
		await this.plugin.appendToInbox(formatted, isTask);
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
