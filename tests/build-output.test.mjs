import { afterEach, expect, test } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { prepareBuildOutput } from '../tools/prepare-build-output.mjs';

const run = promisify(execFile);
const tools = fileURLToPath(new URL('../tools/', import.meta.url));
const roots = [];
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'zi-gate-build-test-'));
  roots.push(root);
  for (const dir of ['src', 'public/assets', 'legal']) await mkdir(path.join(root, dir), { recursive: true });
  for (const name of ['android', 'wechat']) await writeFile(path.join(root, `src/${name}.ts`), 'globalThis.fixture = true;');
  await writeFile(path.join(root, 'public/assets/retained.txt'), 'current asset');
  await writeFile(path.join(root, 'public/assets/removed.txt'), 'old asset');
  await writeFile(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'fixture notice');
  await writeFile(path.join(root, 'legal/ANDROID_NOTICES.txt'), 'fixture native notice');
  await writeFile(path.join(root, 'legal/android-runtime.json'), '{}');
  return root;
}
afterEach(async () => {
  for (const root of roots.splice(0)) {
    if (path.dirname(root) !== tmpdir() || !path.basename(root).startsWith('zi-gate-build-test-')) throw new Error('Unexpected test root');
    await rm(root, { recursive: true, force: true });
  }
});

test('WeChat rebuild removes retired assets and foreign files while retaining configured AppID', async () => {
  const root = await fixture();
  const script = path.join(tools, 'build-wechat.mjs');
  const env = { ...process.env, WECHAT_APPID: 'wx-fixture-first' };
  await run(process.execPath, [script], { cwd: root, env });
  await rm(path.join(root, 'public/assets/removed.txt'));
  await writeFile(path.join(root, 'build/wechat/foreign.txt'), 'must not ship');
  await run(process.execPath, [script], { cwd: root, env: { ...env, WECHAT_APPID: '' } });
  await expect(readFile(path.join(root, 'build/wechat/assets/removed.txt'))).rejects.toMatchObject({ code: 'ENOENT' });
  await expect(readFile(path.join(root, 'build/wechat/foreign.txt'))).rejects.toMatchObject({ code: 'ENOENT' });
  expect(JSON.parse(await readFile(path.join(root, 'build/wechat/project.config.json'), 'utf8')).appid).toBe('wx-fixture-first');
  const manifest = JSON.parse(await readFile(path.join(root, 'build/wechat/BUILD_MANIFEST.json'), 'utf8'));
  expect(manifest.files.map(f => f.file).sort()).toEqual(['assets/retained.txt', 'game.js', 'game.json', 'project.config.json']);
  expect(manifest.deviceVerified).toBe(false);
});

test('Android web rebuild removes retired assets without dropping required notices', async () => {
  const root = await fixture();
  const script = path.join(tools, 'build-android-web.mjs');
  await run(process.execPath, [script], { cwd: root });
  await rm(path.join(root, 'public/assets/removed.txt'));
  await writeFile(path.join(root, 'build/android-web/foreign.txt'), 'must not ship');
  await run(process.execPath, [script], { cwd: root });
  for (const name of ['assets/removed.txt', 'foreign.txt']) {
    await expect(readFile(path.join(root, 'build/android-web', name))).rejects.toMatchObject({ code: 'ENOENT' });
  }
  expect(await readFile(path.join(root, 'build/android-web/legal/ANDROID_NOTICES.txt'), 'utf8')).toBe('fixture native notice');
  expect(await readFile(path.join(root, 'build/android-web/assets/retained.txt'), 'utf8')).toBe('current asset');
});

test('output cleanup refuses unknown names and redirected directories, preserving external files', async () => {
  const root = await fixture();
  await expect(prepareBuildOutput('../source', root)).rejects.toThrow('Unknown');
  await mkdir(path.join(root, 'build'));
  await symlink(path.join(root, 'public'), path.join(root, 'build/wechat'), process.platform === 'win32' ? 'junction' : 'dir');
  await expect(prepareBuildOutput('wechat', root)).rejects.toThrow('redirected');
  expect(await readFile(path.join(root, 'public/assets/retained.txt'), 'utf8')).toBe('current asset');
});
