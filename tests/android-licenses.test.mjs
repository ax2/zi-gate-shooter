import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { renderInventory, verifyInventory } from '../tools/android-licenses.mjs';

const sha = text => createHash('sha256').update(text).digest('hex');
function graph() {
  const module = { coordinate: 'example:runtime:1.0', licenses: [{ name: 'Apache License 2.0', url: 'https://www.apache.org/licenses/LICENSE-2.0.txt' }],
    pomEvidence: [{ coordinate: 'example:runtime:1.0', text: 'upstream POM', sha256: sha('upstream POM') }],
    artifacts: [{ name: 'runtime.jar', sha256: 'a'.repeat(64), notices: [{ path: 'META-INF/NOTICE', text: 'upstream attribution', sha256: sha('upstream attribution') }] }] };
  const config = { projects: ['project :app', 'project :capacitor-android', 'project :capacitor-app', 'project :capacitor-cordova-android-plugins'], modules: [module] };
  return { schemaVersion: 1, configurations: { debugRuntimeClasspath: structuredClone(config), releaseRuntimeClasspath: structuredClone(config) } };
}

it('rejects unknown license, missing declarations, altered upstream evidence and unreviewed local libraries', () => {
  const unknown = graph(); unknown.configurations.debugRuntimeClasspath.modules[0].licenses[0].url = 'https://example.com/unknown';
  expect(() => renderInventory(unknown, [], [])).toThrow('Unreviewed license');
  const absent = graph(); absent.configurations.debugRuntimeClasspath.modules[0].licenses = [];
  expect(() => renderInventory(absent, [], [])).toThrow('Unreviewed license');
  const changed = graph(); changed.configurations.debugRuntimeClasspath.modules[0].artifacts[0].notices[0].text = 'wrong';
  expect(() => renderInventory(changed, [], [])).toThrow('Invalid embedded notice hash');
  const project = graph(); project.configurations.debugRuntimeClasspath.projects.push('project :new-sdk');
  expect(() => renderInventory(project, [], [])).toThrow('Unreviewed local runtime project');
});

it('fails distribution verification when a binary changes or a saved attribution is removed', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'gate-license-'));
  try {
    const files = renderInventory(graph(), [], []);
    for (const [path, bytes] of files) { await mkdir(dirname(join(folder, path)), { recursive: true }); await writeFile(join(folder, path), bytes); }
    await verifyInventory(files, folder);
    const changed = graph();
    for (const config of Object.values(changed.configurations)) config.modules[0].artifacts[0].sha256 = 'b'.repeat(64);
    await expect(verifyInventory(renderInventory(changed, [], []), folder)).rejects.toThrow('License evidence changed: android-runtime.json');
    const path = [...files.keys()].find(name => name.startsWith('embedded/'));
    await rm(join(folder, path));
    await expect(verifyInventory(files, folder)).rejects.toThrow('Missing license evidence: embedded/');
  } finally { await rm(folder, { recursive: true, force: true }); }
});
