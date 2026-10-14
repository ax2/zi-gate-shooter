import { expect, it } from 'vitest';
import { browserImage } from '../src/game/browser-image';
it('does not expose the image until decode completes', async () => {
  let finish!: () => void;
  const image = { onload: null, onerror: null, src: '', decode: () => new Promise<void>(resolve => { finish = resolve; }) } as unknown as HTMLImageElement;
  let ready = false; const result = browserImage('enemy.png', () => image).then(value => { ready = true; return value; });
  image.onload!({} as Event); await Promise.resolve(); await Promise.resolve();
  expect(ready).toBe(false); expect(image.onload).toBeNull(); expect(image.onerror).toBeNull();
  finish(); expect(await result).toBe(image); expect(image.src).toBe('enemy.png');
});
it('rejects corrupt decoded assets and supports loaders without decode', async () => {
  const bad = { decode: () => Promise.reject(new Error('decode failed')) } as unknown as HTMLImageElement;
  const failure = browserImage('bad.png', () => bad); bad.onload!({} as Event);
  await expect(failure).rejects.toThrow('decode failed');
  const old = {} as HTMLImageElement;
  const fallback = browserImage('old.png', () => old); old.onload!({} as Event);
  expect(await fallback).toBe(old);
});
it('rejects network failures and removes callbacks', async () => {
  const image = {} as HTMLImageElement;
  const result = browserImage('missing.png', () => image); image.onerror!({} as Event);
  await expect(result).rejects.toThrow('Image load failed');
  expect(image.onload).toBeNull(); expect(image.onerror).toBeNull();
});
