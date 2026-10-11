import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const digest = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const safeCoordinate = /^[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+$/;
const apacheUrl = /^https?:\/\/(www\.)?apache\.org\/licenses\/LICENSE-2\.0(?:\.txt|\.html)?\/?$/;

/** Deterministic evidence and distribution texts from the actual Gradle graph. */
export function renderInventory(report, upstream, packages) {
  if (report.schemaVersion !== 1) throw new Error('Unsupported runtime inventory schema');
  const files = new Map();
  const put = (path, contents) => {
    const bytes = Buffer.from(contents);
    if (files.has(path) && !files.get(path).equals(bytes)) throw new Error(`Conflicting evidence: ${path}`);
    files.set(path, bytes);
  };
  const configurations = {};
  const combined = new Map();
  for (const config of ['debugRuntimeClasspath', 'releaseRuntimeClasspath']) {
    const graph = report.configurations[config];
    if (!graph?.modules?.length) throw new Error(`Empty/missing graph: ${config}`);
    const projects = ['project :app', 'project :capacitor-android', 'project :capacitor-app', 'project :capacitor-cordova-android-plugins'];
    if (json([...graph.projects].sort()) !== json(projects.sort())) throw new Error('Unreviewed local runtime project');
    const seen = new Set();
    configurations[config] = { projects: graph.projects, modules: graph.modules.map(module => {
      if (!safeCoordinate.test(module.coordinate) || seen.has(module.coordinate)) throw new Error('Invalid/duplicate module coordinate');
      seen.add(module.coordinate);
      if (!module.licenses.length || module.licenses.some(item => !apacheUrl.test(item.url))) throw new Error(`Unreviewed license: ${module.coordinate}`);
      const pomEvidence = module.pomEvidence.map(pom => {
        if (!safeCoordinate.test(pom.coordinate) || digest(pom.text) !== pom.sha256) throw new Error('Invalid POM evidence');
        const path = `poms/${pom.coordinate.replaceAll(':', '--')}.pom`;
        put(path, pom.text);
        return { coordinate: pom.coordinate, path, sha256: pom.sha256 };
      });
      if (pomEvidence[0]?.coordinate !== module.coordinate) throw new Error('POM evidence does not match module');
      const artifacts = module.artifacts.map(artifact => {
        if (!/^[a-f0-9]{64}$/.test(artifact.sha256)) throw new Error('Invalid binary artifact hash');
        return { name: artifact.name, sha256: artifact.sha256, notices: artifact.notices.map(notice => {
          if (digest(notice.text) !== notice.sha256) throw new Error('Invalid embedded notice hash');
          const path = `embedded/${notice.sha256}.txt`;
          put(path, notice.text);
          return { archivePath: notice.path, path, sha256: notice.sha256 };
        }) };
      });
      const entry = { coordinate: module.coordinate, spdx: 'Apache-2.0', licenses: module.licenses, pomEvidence, artifacts };
      if (combined.has(module.coordinate) && json(combined.get(module.coordinate)) !== json(entry)) throw new Error('Debug/release evidence conflicts');
      combined.set(module.coordinate, entry);
      return entry;
    }) };
  }
  const upstreamEvidence = upstream.map(item => {
    if (!/^[A-Za-z0-9_.-]+$/.test(item.file) || !item.url.startsWith('https://')) throw new Error('Invalid upstream source');
    put(`upstream/${item.file}`, item.bytes);
    return { file: item.file, url: item.url, sha256: digest(item.bytes) };
  });
  const npm = packages.map(item => {
    const path = `npm/${item.name.replaceAll('/', '--').replace('@', '')}-${item.version}-LICENSE.txt`;
    put(path, item.bytes);
    return { name: item.name, version: item.version, spdx: 'MIT', path, sha256: digest(item.bytes) };
  });
  const modules = [...combined.values()].sort((a, b) => a.coordinate.localeCompare(b.coordinate, 'en'));
  const overview = [
    'Android distributed runtime: open source acknowledgements',
    'Generated from resolved debug/release runtime graphs. Includes metadata-only coordinates; excludes SDK/platform, build tools and tests.',
    'A coordinate is not a claim that every file or class in that library is packaged.',
    '',
    ...modules.map(item => `${item.coordinate} | ${item.spdx}${item.artifacts.length ? '' : ' | metadata only'}`),
    ...npm.map(item => `${item.name}@${item.version} | ${item.spdx}`),
    '', 'Unmodified upstream license and notice texts follow.',
  ];
  const texts = [...files.entries()].filter(([path]) => !path.endsWith('.pom')).sort(([a], [b]) => a.localeCompare(b, 'en'));
  for (const [path, contents] of texts) overview.push('', `========== ${path} ==========`, contents.toString('utf8'));
  put('ANDROID_NOTICES.txt', overview.join('\n') + '\n');
  put('android-runtime.json', json({ schemaVersion: 1, configurations, npm, upstream: upstreamEvidence }));
  return files;
}

export async function verifyInventory(files, root) {
  for (const [path, expected] of files) {
    let actual;
    try { actual = await readFile(resolve(root, path)); } catch { throw new Error(`Missing license evidence: ${path}`); }
    if (!actual.equals(expected)) throw new Error(`License evidence changed: ${path}; review upstream changes and run licenses:refresh explicitly`);
  }
}

async function main() {
  const report = JSON.parse(await readFile('build/android-licenses/resolved.json', 'utf8'));
  const sources = JSON.parse(await readFile('legal/upstream/sources.json', 'utf8'));
  const upstream = await Promise.all(sources.map(async item => ({ ...item, bytes: await readFile(`legal/upstream/${item.file}`) })));
  const packages = await Promise.all(['@capacitor/core', '@capacitor/android', '@capacitor/app'].map(async name => {
    const pkg = JSON.parse(await readFile(`node_modules/${name}/package.json`, 'utf8'));
    if (pkg.license !== 'MIT') throw new Error(`Unreviewed npm license: ${name}`);
    return { name, version: pkg.version, bytes: await readFile(`node_modules/${name}/LICENSE`) };
  }));
  const files = renderInventory(report, upstream, packages);
  if (process.argv.includes('--refresh')) {
    for (const [path, contents] of files) { await mkdir(dirname(`legal/${path}`), { recursive: true }); await writeFile(`legal/${path}`, contents); }
    console.log('License evidence refreshed: review the complete Git diff before distributing.');
  } else await verifyInventory(files, 'legal');
  console.log(`Android runtime license evidence verified: ${report.configurations.debugRuntimeClasspath.modules.length} debug / ${report.configurations.releaseRuntimeClasspath.modules.length} release coordinates.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
