import { readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function buildNotesIndex(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const names = entries
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map(entry => entry.name)
    .sort();
  const notes = await Promise.all(names.map(async file => ({
    file,
    modifiedAt: (await stat(join(directory, file))).mtime.toISOString()
  })));
  await writeFile(join(directory, 'index.json'), `${JSON.stringify(notes, null, 2)}\n`, 'utf8');
  return notes;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const notes = await buildNotesIndex(join(dirname(fileURLToPath(import.meta.url)), 'notes'));
  console.log(`Indexed ${notes.length} Markdown notes in notes/index.json`);
}
