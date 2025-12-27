# Memopad

A quick capture plugin for Obsidian that standardizes your thoughts into a single inbox file.

Dump thoughts from anywhere; the plugin auto-formats them as tasks, notes, ideas, or logs with proper metadata. No folders, no complexity—just one `Memopad.md` file that's easy to process later with Tasks, Dataview, or manual review.

<p align="center">
  <video src="https://github.com/user-attachments/assets/ab805955-933f-4ede-b700-2684e76aceaf" width="600" controls></video>
</p>

## Features

- **Universal capture modal** — Open from anywhere with a hotkey
- **Smart formatting** — Automatically detects entry types and categories
- **Live preview** — See exactly how your entry will be saved before submitting
- **Natural date parsing** — Write "tomorrow" or "next tuesday" and get proper dates
- **Checkbox tasks** — Tasks are saved with `- [ ]` markdown for compatibility with task plugins
- **Configurable categories** — Add your own categories with keyword detection
- **Single inbox file** — All entries go to one file, organized by date

## Installation

1. Open **Settings → Community plugins**
2. Select **Browse** and search for "Memopad"
3. Select **Install**, then **Enable**

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder called `memopad` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into the `memopad` folder
4. Enable the plugin in **Settings → Community plugins**

## Usage

### Opening the capture modal

- Use the command palette: **Memopad: Capture thought**
- Or assign a hotkey in **Settings → Hotkeys** (search for "Memopad")

### Entry types

Type naturally and Memopad will format your entry:

| You type | Memopad saves |
|----------|---------------|
| `fix login bug tomorrow` | `- [ ] [task:personal] fix login bug 📅 2025-12-28` |
| `note: interesting article about AI` | `- [note] interesting article about AI` |
| `idea: plugin for daily quotes` | `- [idea] plugin for daily quotes` |
| `log: finished the report` | `- [log] finished the report` |
| `work: review PR for auth service` | `- [ ] [task:work] review PR for auth service` |

### Explicit prefixes

Start your input with a type or category to override auto-detection:

- `note:` — Create a note entry
- `idea:` — Create an idea entry
- `log:` — Create a log entry
- `task:` — Create a task entry
- `work:` — Create a work task (or any custom category name)
- `personal:` — Create a personal task

### Task detection

Memopad automatically detects tasks when your input starts with action words:

> fix, call, email, send, buy, finish, complete, review, check, update, create, make, write, schedule, book, meet, submit, prepare, clean, organize

These keywords are configurable in settings.

### Category detection

Tasks are automatically categorized based on keywords in your input:

| Keywords detected | Category |
|-------------------|----------|
| jira, meeting, standup, client, deploy, pr, sprint, ticket, slack, report | `work` |
| home, family, gym, doctor, shopping, groceries | `personal` |

Categories and their keywords are fully configurable in settings.

### Natural date parsing

Memopad understands relative dates and converts them to `📅 YYYY-MM-DD` format:

| You write | Result |
|-----------|--------|
| `today` | Today's date |
| `tomorrow` | Tomorrow's date |
| `yesterday` | Yesterday's date |
| `tuesday` | Next Tuesday |
| `next friday` | The upcoming Friday |
| `this wednesday` | This week's Wednesday |
| `next week` | Next Monday |
| `in 3 days` | 3 days from now |
| `in 2 weeks` | 14 days from now |
| `in 1 month` | 1 month from now |

**Example:** `call dentist next tuesday` → `- [ ] [task:personal] call dentist 📅 2025-12-30`

## Output format

Entries are saved to `Memopad.md` (configurable) organized by date:

```markdown
# Memopad Inbox

## 2025-12-27
- [ ] [task:work] review PR for auth service 📅 2025-12-30
- [ ] [task:personal] call mum tomorrow 📅 2025-12-28
- [note] interesting article about AI agents
- [idea] plugin for daily quotes

## 2025-12-26
- [log] finished quarterly report
- [ ] [task:work] deploy hotfix 📅 2025-12-27
```

## Settings

### General

- **Inbox file path** — Where to save captured entries (default: `Memopad.md`)
- **Default category** — Fallback category for tasks when no keywords match (default: `personal`)

### Task keywords

Comma-separated list of words that trigger task detection when they appear at the start of your input.

### Entry types

Comma-separated list of entry types (e.g., `note, idea, log, task`).

### Categories

Add, edit, or remove categories. Each category has:
- **Name** — Used in the output format `[task:name]` and as an explicit prefix
- **Keywords** — Words that trigger this category when found in your input

## Tips

- **Quick capture:** Assign a global hotkey like `Ctrl+Shift+M` for instant access
- **Process later:** Use Obsidian's Tasks plugin or Dataview to query your Memopad entries
- **Keep it simple:** Don't overthink—just dump thoughts and let Memopad format them

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Capture and close |
| `Shift+Enter` | New line |
| `Escape` | Cancel and close |

## License

0BSD
