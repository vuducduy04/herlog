import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildNotesIndex } from '../build-notes.mjs';

test('indexes Markdown files without changing their content', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'herlog-index-'));
  try {
    await writeFile(join(directory, 'b note #1.md'), '# Example\n\nBody');
    await writeFile(join(directory, 'a.MD'), '# Uppercase extension');
    await writeFile(join(directory, '.gitkeep'), '');
    await writeFile(join(directory, 'ignored.txt'), 'Not Markdown');
    await mkdir(join(directory, 'nested.md'));
    const notes = await buildNotesIndex(directory);
    assert.deepEqual(notes.map(note => note.file), ['a.MD', 'b note #1.md']);
    assert.ok(notes.every(note => Number.isFinite(Date.parse(note.modifiedAt))));
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'index.json'), 'utf8')), notes);
    assert.equal(await readFile(join(directory, 'b note #1.md'), 'utf8'), '# Example\n\nBody');
    await unlink(join(directory, 'a.MD'));
    await unlink(join(directory, 'b note #1.md'));
    assert.deepEqual(await buildNotesIndex(directory), []);
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'index.json'), 'utf8')), []);
  } finally {
    await rm(directory, { recursive: true });
  }
});

test('reports a missing notes folder instead of generating an empty index', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'herlog-missing-index-'));
  try {
    await assert.rejects(buildNotesIndex(join(directory, 'missing')), { code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true });
  }
});
