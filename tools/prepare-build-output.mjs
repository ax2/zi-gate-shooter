import { lstat, mkdir, realpath, rm } from 'node:fs/promises';
import path from 'node:path';

// Only these generated directories may be removed. Never accept arbitrary paths.
export async function prepareBuildOutput(name, projectRoot = process.cwd()) {
  if (!['wechat', 'android-web'].includes(name)) throw new Error('Unknown generated output');
  const root = await realpath(projectRoot);
  const build = path.join(root, 'build');
  await mkdir(build, { recursive: true });
  if (await realpath(build) !== build) throw new Error('Refusing redirected build directory');
  const output = path.join(build, name);
  try {
    const info = await lstat(output);
    if (info.isSymbolicLink() || await realpath(output) !== output) {
      throw new Error('Refusing redirected output directory');
    }
    if (!info.isDirectory()) throw new Error('Expected generated output directory');
    await rm(output, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(output);
  return output;
}
