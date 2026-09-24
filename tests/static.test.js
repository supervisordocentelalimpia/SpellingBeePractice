import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);

async function exists(relative) {
  try { await access(path.join(root, relative), constants.F_OK); return true; } catch { return false; }
}

test('required GitHub Pages files exist', async () => {
  for (const file of ['index.html', 'css/app.css', 'js/app.js', 'README.md', 'GITHUB_SETUP_STEP_BY_STEP.md']) {
    assert.equal(await exists(file), true, `${file} should exist`);
  }
});

test('index references only existing local app entry assets', async () => {
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /href="\.\/css\/app\.css"/);
  assert.match(html, /src="\.\/js\/app\.js"/);
  assert.equal(await exists('css/app.css'), true);
  assert.equal(await exists('js/app.js'), true);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test('runtime source contains no backend deployment or secret configuration', async () => {
  const files = [
    'index.html', 'css/app.css', 'js/app.js',
    'js/controllers/AppController.js', 'js/controllers/GameController.js',
    'js/controllers/SpeechController.js', 'js/controllers/SpellingController.js'
  ];
  const text = (await Promise.all(files.map((file) => readFile(path.join(root, file), 'utf8')))).join('\n');
  assert.doesNotMatch(text, /vercel|azure|speech[_-]?key|api[_-]?key|subscription[_-]?key/i);
  assert.doesNotMatch(text, /fetch\s*\(/i);
});

test('package has no runtime dependencies', async () => {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
});
