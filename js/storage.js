/**
 * HerLog Storage Module
 * Manages persistent storage for Personal Daily Life Logs & PIN security using localStorage
 */

const STORAGE_KEYS = {
  LOGS: 'herlog_logs_v1',
  PIN: 'herlog_pin_v2',
  SESSION_LOCKED: 'herlog_is_locked'
};

const DEFAULT_PIN = '261018';
const NOTES_BASE_URL = new URL('../notes/', document.currentScript.src);

// Helper to generate a realistic cryptographic hex digest
function generateHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const randomSuffix = Math.random().toString(16).substring(2, 10);
  return `0x${hex}${randomSuffix}`;
}

// Helper to count words
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Helper to format byte size
function formatBytes(str) {
  const bytes = new Blob([str || '']).size;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// Initial seed data with authentic daily life log entries
const SEED_LOGS = [
  {
    id: 'LOG-20250518-01',
    title: 'Morning Walk Along West Lake & Thoughts of Her',
    date: '2025-05-18',
    time: '07:15',
    content: `### Morning Intentions & Quiet Hours

Woke up at 5:45 AM before the city came alive. The lake was covered in a sheer layer of early morning mist, undisturbed except for a few gentle ripples from fishermen.

> "To live deliberately means choosing what to let into your mind before the day demands your attention."

### Observations
- Noticed the subtle shift in weather; late spring is bringing warmer breezes and blooming lotuses.
- Thought of her smile when we walked past the lakeside path last autumn.
- Decided to write down these small moments every morning.

### Daily Notes
1. Finish the quarterly notes.
2. Send her the playlist she liked.
3. Drink at least 2.5L of water and take an afternoon posture break.`,
    words: 118,
    size: '1.1 KB',
    hash: '0x4e9c71b128fa77b3df600b',
    updatedAt: '2025-05-18T07:15:00Z'
  },
  {
    id: 'LOG-20250517-02',
    title: 'Pour-Over Coffee & Sharing A Moment',
    date: '2025-05-17',
    time: '14:30',
    content: `### Coffee Notes & Sensory Experiment

Brewed a fresh batch of washed Ethiopian Yirgacheffe (Chelchele station) using the V60 dripper.

### Brewing Parameters
- **Dose:** 16g coffee
- **Water:** 250g at 92°C (1:15.6 ratio)
- **Grind Size:** Medium-fine (22 clicks on Comandante)
- **Total Drawdown Time:** 2 minutes 45 seconds

### Tasting Palette
- **Aroma:** Jasmine blossom, bergamot, and sweet peach.
- **Acidity:** Vibrant citric acidity, lemon zest finish.
- **Body:** Light, tea-like elegance.

She always prefers floral aromas in filter coffee. Next time she visits, I will brew this exact origin for her.`,
    words: 96,
    size: '0.9 KB',
    hash: '0x78ab091c62f401ea187c2b',
    updatedAt: '2025-05-17T14:30:00Z'
  },
  {
    id: 'LOG-20250516-03',
    title: 'Digital Minimalism & Evening Quietness',
    date: '2025-05-16',
    time: '21:40',
    content: `### Evening Quietness

Spent the evening auditing my digital clutter across phone and laptop.

### Changes Implemented
- Turned off all badge counters except messages from her and family.
- Moved social media icons off the home screen.
- Set up a clean desktop wallpaper of the beach we visited.

The silence afterwards felt surprisingly peaceful. Tomorrow will be a full deep-work experiment.`,
    words: 62,
    size: '0.6 KB',
    hash: '0x110fd49c5e3178bb09ac11',
    updatedAt: '2025-05-16T21:40:00Z'
  },
  {
    id: 'LOG-20250515-04',
    title: 'Reading Log: Quiet Lessons on Patience',
    date: '2025-05-15',
    time: '22:15',
    content: `### Late Night Reflections

Re-reading Marcus Aurelius tonight before sleep. One quote in particular stood out:

> "Nowhere can man find a quieter or more untroubled retreat than in his own soul."

She reminded me earlier this week that patience is not passive waiting, but active inner peace while things unfold.`,
    words: 52,
    size: '0.5 KB',
    hash: '0x8900ac9f7d23a2cb1e89ff',
    updatedAt: '2025-05-15T22:15:00Z'
  },
  {
    id: 'LOG-20250514-05',
    title: 'Evening Cycling & Sunset Observations',
    date: '2025-05-14',
    time: '18:50',
    content: `### 18km Ride Through the Green Belt

Took the road bike out around 6:00 PM. The sunset cast a dramatic violet and amber glow across the skyline.

Sent her a photo of the golden hour across the bridge. She replied instantly with a heart. Those small messages brighten the longest workdays.`,
    words: 51,
    size: '0.5 KB',
    hash: '0xcc9831ef55209ac741b002',
    updatedAt: '2025-05-14T18:50:00Z'
  },
  {
    id: 'LOG-20250512-06',
    title: 'Sunday Retrospective & Next Week Goals',
    date: '2025-05-12',
    time: '19:30',
    content: `### Sunday Evening Review

Review of priorities, creative outputs, and personal rhythms for the coming week.

### Highlights
- Great dinner conversation with her on Friday.
- Maintained morning meditation and workout routines.
- Planning our weekend trip next month.`,
    words: 39,
    size: '0.4 KB',
    hash: '0x5541098ef72bcda11094ea',
    updatedAt: '2025-05-12T19:30:00Z'
  }
];

class StorageService {
  constructor() {
    this.notesDirectory = null;
    this.folderLogs = [];
    this.noteFiles = new Map();
    this.publishedLogs = [];
    this.publishedStatus = 'loading';
    this.init();
  }

  init() {
    const storedPin = localStorage.getItem(STORAGE_KEYS.PIN);
    if (!/^\d{6}$/.test(storedPin || '')) {
      if (storedPin) console.warn('Stored PIN is not six digits; resetting to the new default PIN.');
      localStorage.setItem(STORAGE_KEYS.PIN, DEFAULT_PIN);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(SEED_LOGS));
    }
  }

  // PIN Operations
  getPin() {
    return localStorage.getItem(STORAGE_KEYS.PIN) || DEFAULT_PIN;
  }

  setPin(newPin) {
    if (/^\d{6}$/.test(newPin)) {
      localStorage.setItem(STORAGE_KEYS.PIN, newPin);
      return true;
    }
    return false;
  }

  verifyPin(inputPin) {
    const currentPin = this.getPin();
    return inputPin === currentPin;
  }

  resetPin() {
    localStorage.setItem(STORAGE_KEYS.PIN, DEFAULT_PIN);
    return DEFAULT_PIN;
  }

  // Log Operations
  parseMarkdown(name, source, modified) {
    const header = source.match(/^---\r?\nherlog: ([^\r\n]+)\r?\n---\r?\n/);
    let metadata = {};
    if (header) {
      try {
        metadata = JSON.parse(header[1]);
      } catch (error) {
        throw new Error(`Invalid HerLog metadata in "${name}": ${error.message}`);
      }
      if (!metadata || typeof metadata !== 'object' ||
          ['title', 'date', 'time', 'updatedAt'].some(key => typeof metadata[key] !== 'string')) {
        throw new Error(`Invalid HerLog metadata fields in "${name}".`);
      }
    }
    const content = header ? source.slice(header[0].length) : source;
    return {
      id: name,
      title: metadata.title || (content.match(/^# (.+)$/m) || [])[1] || name.slice(0, -3),
      date: metadata.date || modified.slice(0, 10),
      time: metadata.time || modified.slice(11, 16),
      updatedAt: metadata.updatedAt || modified,
      content,
      words: countWords(content),
      size: formatBytes(content),
      hash: generateHash(content)
    };
  }

  async loadPublishedNotes() {
    this.publishedStatus = 'loading';
    try {
      if (NOTES_BASE_URL.protocol === 'file:') {
        throw new Error('Automatic notes loading requires HTTP. Run start.bat or use the Vercel website.');
      }
      const response = await fetch(new URL('index.json', NOTES_BASE_URL), { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load notes/index.json (HTTP ${response.status}). Run npm run build and redeploy.`);
      const entries = await response.json();
      if (!Array.isArray(entries) || entries.some(entry =>
        !entry || typeof entry.file !== 'string' ||
        !/^[^/\\]+\.md$/i.test(entry.file) ||
        typeof entry.modifiedAt !== 'string' || !Number.isFinite(Date.parse(entry.modifiedAt))) ||
        new Set(entries.map(entry => entry.file)).size !== entries.length) {
        throw new Error('Invalid notes/index.json. Run npm run build to regenerate it.');
      }
      const logs = await Promise.all(entries.map(async entry => {
        const noteResponse = await fetch(new URL(encodeURIComponent(entry.file), NOTES_BASE_URL), { cache: 'no-store' });
        if (!noteResponse.ok) throw new Error(`Could not load note "${entry.file}" (HTTP ${noteResponse.status}).`);
        return this.parseMarkdown(entry.file, await noteResponse.text(), entry.modifiedAt);
      }));
      this.publishedLogs = logs;
      this.publishedStatus = 'ready';
    } catch (error) {
      this.publishedStatus = 'error';
      throw error;
    }
  }

  async selectNotesFolder() {
    if (!window.isSecureContext || !window.showDirectoryPicker) {
      throw new Error('Markdown folder access requires desktop Chrome or Edge on HTTPS or localhost.');
    }
    const directory = await window.showDirectoryPicker({ id: 'herlog-notes', mode: 'readwrite' });
    const { logs, files } = await this.readNotesFolder(directory);
    this.notesDirectory = directory;
    this.folderLogs = logs;
    this.noteFiles = files;
  }

  async ensureNotesFolder() {
    if (!this.notesDirectory) await this.selectNotesFolder();
    if (await this.notesDirectory.requestPermission({ mode: 'readwrite' }) !== 'granted') {
      throw new Error('Write permission is required for the notes folder.');
    }
  }

  async readNotesFolder(directory) {
    const logs = [];
    const files = new Map();
    for await (const [name, handle] of directory.entries()) {
      if (handle.kind !== 'file' || !name.toLowerCase().endsWith('.md')) continue;
      const file = await handle.getFile();
      const source = await file.text();
      const modified = new Date(file.lastModified).toISOString();
      logs.push(this.parseMarkdown(name, source, modified));
      files.set(name, { handle, source });
    }
    return { logs, files };
  }

  async refreshNotesFolder() {
    if (!this.notesDirectory) return this.loadPublishedNotes();
    const { logs, files } = await this.readNotesFolder(this.notesDirectory);
    this.folderLogs = logs;
    this.noteFiles = files;
  }

  getLogs() {
    if (this.notesDirectory) return [...this.folderLogs];
    return [...this.publishedLogs];
  }

  getLogById(id) {
    const logs = this.getLogs();
    return logs.find(log => log.id === id) || null;
  }

  async saveLog(logData) {
    if (logData.id && !this.notesDirectory) {
      throw new Error('Published notes are read-only. Select the local notes folder to edit files.');
    }
    await this.ensureNotesFolder();
    const logs = this.getLogs();
    const now = new Date();
    const dateStr = logData.date || now.toISOString().split('T')[0];
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const timeStr = logData.time ? logData.time.substring(0, 5) : `${hours}:${mins}`;
    const content = logData.content || '';
    const title = logData.title || 'Untitled Log';

    const words = countWords(content);
    const size = formatBytes(content);
    const hash = logData.hash || generateHash(title + content + dateStr + timeStr);

    let updatedLog;
    if (logData.id) {
      // Update existing
      const index = logs.findIndex(l => l.id === logData.id);
      if (index !== -1) {
        updatedLog = {
          ...logs[index],
          title,
          date: dateStr,
          time: timeStr,
          content,
          words,
          size,
          hash: generateHash(title + content + Date.now()),
          updatedAt: now.toISOString()
        };
        logs[index] = updatedLog;
      } else {
        updatedLog = {
          id: logData.id,
          title,
          date: dateStr,
          time: timeStr,
          content,
          words,
          size,
          hash,
          updatedAt: now.toISOString()
        };
        logs.unshift(updatedLog);
      }
    } else {
      // Create new log with structured ID
      const cleanDate = dateStr.replace(/-/g, '');
      const newId = `LOG-${cleanDate}-${crypto.randomUUID()}.md`;
      updatedLog = {
        id: newId,
        title,
        date: dateStr,
        time: timeStr,
        content,
        words,
        size,
        hash,
        updatedAt: now.toISOString()
      };
      logs.unshift(updatedLog);
    }

    const existing = this.noteFiles.get(updatedLog.id);
    if (!existing && logData.id) {
      // Browser-only logs are copied into a new, safe filename when saved.
      updatedLog.id = `LOG-${dateStr.replace(/-/g, '')}-${crypto.randomUUID()}.md`;
    } else if (existing && await (await existing.handle.getFile()).text() !== existing.source) {
      throw new Error('This note changed outside HerLog. Copy your edits, then refresh the folder before saving.');
    }
    const { title: savedTitle, date, time, updatedAt } = updatedLog;
    const source = `---\nherlog: ${JSON.stringify({ title: savedTitle, date, time, updatedAt })}\n---\n${content}`;
    const handle = existing ? existing.handle :
      await this.notesDirectory.getFileHandle(updatedLog.id, { create: true });
    const writable = await handle.createWritable();
    try {
      await writable.write(source);
      await writable.close();
    } catch (error) {
      try {
        await writable.abort();
      } catch (abortError) {
        console.error('Failed to abort note write:', abortError);
      }
      throw error;
    }
    this.folderLogs = logs;
    this.noteFiles.set(updatedLog.id, { handle, source });
    return updatedLog;
  }

  async deleteLogs(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    if (this.notesDirectory) {
      await this.ensureNotesFolder();
      let deleted = 0;
      for (const id of new Set(ids)) {
        const existing = this.noteFiles.get(id);
        if (!existing) throw new Error(`Note "${id}" is not in the selected folder. Refresh and try again.`);
        if (await (await existing.handle.getFile()).text() !== existing.source) {
          throw new Error(`Note "${id}" changed outside HerLog. Refresh before deleting.`);
        }
        await this.notesDirectory.removeEntry(id);
        this.noteFiles.delete(id);
        this.folderLogs = this.folderLogs.filter(log => log.id !== id);
        deleted++;
      }
      return deleted;
    }
    throw new Error('Published notes are read-only. Select the local notes folder to delete files.');
  }

  async deleteLog(id) {
    return (await this.deleteLogs([id])) > 0;
  }

  resetToDefaultLogs() {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(SEED_LOGS));
    return SEED_LOGS;
  }
}

// Export singleton
window.StorageService = new StorageService();
