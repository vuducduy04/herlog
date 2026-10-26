# HerLog — Sovereign Daily Life Log Keeper

A distraction-free personal daily life log keeper with a soft, romantic pastel theme: blush pink, warm white, rose accents, and butter-yellow highlights across the lock screen, dashboard, editor, dialogs, and notifications.

Theme colors are shared CSS variables in `css/styles.css`, used by both Tailwind utilities and custom Markdown styles. Dark rose/plum text keeps the light surfaces readable.

The theme toggle immediately to the left of **Lock Vault** shows the current theme: **Light mode** with a sun icon or **Dark mode** with a moon icon. Clicking it switches every window, Markdown preview, dialog, notification, and native date/time picker between the pastel light theme and a matching plum-and-rose dark palette with soft pink text and muted gold accents. Light mode is the default. Your choice is saved per browser in `localStorage` and restored before the page is styled, including on the lock screen. If the browser blocks saving the preference, the theme still changes for the current visit and a warning is shown.

---

## Architecture & 3-Window Workflow

### Window 1: Lock Screen
- **6-Number PIN Authentication:** Discrete 6-segment PIN display with live focus cursor, glowing status indicators, and subtle shake animation on error.
- **Default Passkey:** `261018`. Existing stored PINs that are not exactly six digits, including previous eight-digit PINs, are reset to this default on startup with a console warning. Existing valid six-digit custom PINs are preserved.
- **Physical & Mobile Keyboard Support:** Use your numpad/keyboard (0–9, Backspace, Enter), or tap the PIN slots to open the mobile numeric keyboard. Each digit keypress enters one digit; Backspace removes one digit.
- **Quick Access:** Hardware Key / Biometrics enclave simulation.
- **Redirection:** Clicking `njoy.ur.life` immediately redirects to [https://www.instagram.com/njoy.ur.life/](https://www.instagram.com/njoy.ur.life/).

---

### Window 2: Main Menu & Dashboard
- **3/4 Screen Width Dashboard (Left Region):**
  - Displays all created daily logs in a structured ledger.
  - Shows timestamps, category tags, log title, excerpt preview, word count, file size, and SHA signature digests.
  - **Live Search:** Instant filtering across titles, excerpts, categories, and hashes.
  - **Category Filter:** Filter by Reflection, Lifestyle, Mindfulness, Reading, Health, and Personal entries.
  - **Date Sort Toggle:** Ascending or Descending order.
  - **Click-to-Edit:** Clicking any log row immediately loads that log into **Window 3** for inspection and modification.
- **1/4 Screen Width Control Panel (Right Region):**
  - **Default Notes Folder:** Automatically reads published Markdown files from the project's `notes/` directory without a folder picker. Published notes are read-only.
  - **Local Editing:** Select a local folder and grant read/write access to create, update, or delete Markdown files on your computer.
  - **Button 1 ("New Log"):** Pastel-pink action button (`Ctrl+N`) that immediately creates an untitled `.md` file in the selected folder and opens it for editing.
  - **Button 2 ("Select Log"):** Activates selection mode. Allows multi-selecting logs via individual checkboxes or "Mark All".
  - **Batch Delete:** When logs are selected, a prominent *"Delete Selected"* button appears with confirmation modal to safely and permanently delete chosen records.
  - **Vault Statistics:** Live total log and word count metrics.
  - **PIN Storage API:** Accepts exactly six digits, including leading zeroes.
  - **Lock Vault:** Return to the Lock Screen with a single click.

---

### Window 3: Log Window (Editor & Reader)
- **Top Bar:**
  - **Log Date:** Dates are displayed and entered as `yy/mm/dd` (for example, `26/10/25`), with a calendar picker available. Two-digit years retain the current note's century; use the calendar to select a different century.
  - **Timestamp (HH:MM:SS):** Precision time input with a **"Current"** button to instantly sync to the current second.
  - **Category Tagging:** Assign categories to each log entry.
  - **Title Input:** Clear header for the daily reflection.
  - **Action Buttons:**
    - `Save Log`: Writes the title, date, time, and Markdown content to the note's file and updates word count.
    - `Discard`: Warns if changes are unsaved, and returns to the Dashboard.
    - `Delete`: Directly delete the active log if modifying an existing entry.
- **Writing Space & Markdown Engine:**
  - **Formatting Toolbar:** Bold (`**`), Italic (`*`), Heading (`###`), Monospace (`\``), Codeblock (```` ``` ````), List (`-`), Quote (`>`), and `+STAMP` (inserts the current date as `yy/mm/dd` and time as `HH:MM`).
  - **3 View Modes:**
    1. **Raw Editor:** Full-width code/markdown authoring canvas.
    2. **Dual Pane:** Split-view with markdown editor on the left and live rendered preview on the right.
    3. **Rendered View:** Clean, distraction-free reading typography.
  - **Real-Time Counters:** Live word and character tracking.

---

## Quick Start

### Automatic project notes on Vercel
The website automatically reads Markdown files from `notes/` over HTTP/HTTPS. No folder selection is needed to read published notes, including on other devices.

Vercel uses the included `vercel.json` to run `npm run build`. The build scans top-level `.md` files (case-insensitive) and generates `notes/index.json`, which lists their filenames and modification times. Markdown content is loaded directly from those files; it is not copied into browser storage. No npm dependencies are required.

1. Add or edit Markdown files in the project's `notes` folder.
2. Commit and push the files to the GitHub branch connected to Vercel.
3. Vercel regenerates the index and deploys the updated files.
4. Open the website on any device. **Refresh** reloads the published index and notes.

For local HTTP preview, install Node.js 20 or newer and run `npm run build` before starting the Python server. Regenerate the index after adding or deleting Markdown files. Editing an existing file's body is available on Refresh without rebuilding, but rebuilding also updates the index's modification timestamps.

Missing indexes, missing note files, and invalid metadata show an error rather than falling back to sample or old browser-only logs. An empty published folder shows an empty dashboard. A failed refresh retains the previous successfully loaded notes and displays an error.

### Saving notes as Markdown files
1. Open HerLog in desktop Chrome or Edge, preferably at `http://localhost:8000` or an HTTPS URL.
2. Unlock the dashboard and click **Select Local Folder for Editing**. Choose this project's `notes` folder and grant read/write permission. **New Log** also prompts for a folder if none is connected.
3. Click **New Log** to create a real `.md` file immediately. Edit it and click **Save Log** to write changes to that same file.
4. Commit and push the files in `notes` using Git when ready.

Folder access uses the browser's File System Access API. It is not supported in Firefox, Safari, or most mobile browsers. There is no silent browser-storage fallback for file writes: unsupported browsers, denied permissions, and write failures show an error.

Select the local folder again after each reload if you want to edit; otherwise the app returns to reading published `notes/` automatically. Existing `.md` files are loaded from the selected local folder, including ordinary Markdown files created outside HerLog. **Refresh** reloads external changes. If a file changed externally since loading, saving or deleting is blocked until you refresh; copy any unsaved edits before refreshing.

Files use stable, unique filenames such as `LOG-20261026-<uuid>.md`. HerLog metadata is stored as a JSON-valued `herlog` field in YAML front matter, followed by the Markdown body. Ordinary Markdown files are read without removing their content.

Dashboard dates, editor dates, and newly inserted timestamps use `yy/mm/dd`. Internal dates and file metadata remain ISO `yyyy-mm-dd` for unambiguous sorting and compatibility with existing notes. Existing note content and filenames are not rewritten.

**New Log creates a file before editing.** Discarding subsequent unsaved edits leaves that initial file on disk; use Delete to remove it. Delete and batch delete permanently remove files from the connected folder. A failed batch operation can leave some files already deleted; refresh to inspect the remaining notes.

Old browser-only logs remain in `localStorage` but are not shown or automatically exported. The default source is now the published notes folder, not browser storage or sample notes.

**Git/Vercel limitations:** Published notes are read-only. Save, Delete, and editing controls are disabled until a local folder is selected. Selecting a local folder grants access only on your current device and does not commit, push, or sync changes; commit and push to publish them. Vercel cannot write into your local Git checkout. Published Markdown files and their index may be publicly downloadable; the PIN screen does not encrypt or protect those files.

### Option 1: Direct in Browser
Direct `file://` access cannot automatically fetch published notes and shows an error. Use the local server or Vercel instead. Chrome/Edge can still use local folder selection for editing where the browser permits it.

### Option 2: Local Web Server
Run `npm run build`, then run [`start.bat`](file:///D:/Personal%20projects/HerLog/start.bat) or start Python server from terminal:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

### Storage regression tests
Run `npm test` for index-generation tests. Open `http://localhost:8000/tests/storage.html` in Chrome or Edge for published-loading tests and local file lifecycle/failure-path tests. The page uses mocked HTTP responses and an isolated browser-managed directory, which it removes afterward. It never selects or writes into your project notes folder.

---

## File Structure
- `index.html` — Main Single Page Application structure for Windows 1, 2, and 3, plus modals.
- `css/styles.css` — Shared pastel theme palette, animations, and Markdown typography styles.
- `js/storage.js` — Markdown folder persistence, legacy browser logs, sample daily life logs, and PIN management.
- `js/app.js` — Application controllers, state transitions, selection modes, and Markdown parsing.
- `notes/` — Default published Markdown source; also select this local folder when editing files for Git.
- `notes/index.json` — Generated file list; rebuilt automatically on Vercel and by `npm run build` locally.
- `build-notes.mjs` — Dependency-free notes-index generator.
- `vercel.json` — Static deployment and build configuration.
- `tests/storage.html` — Browser-run storage regression tests using an isolated browser-managed test directory, not your notes folder.
- `start.bat` — One-click launcher for Windows.
