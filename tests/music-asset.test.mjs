import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
it('exports a non-clipping mono PCM loop with quiet sample boundaries', () => {
  const data = readFileSync('public/assets/audio/mechanical-pulse-v1.wav');
  expect(data.toString('ascii', 0, 4)).toBe('RIFF'); expect(data.readUInt16LE(22)).toBe(1);
  expect(data.readUInt32LE(24)).toBe(22050); expect(data.readUInt16LE(34)).toBe(16);
  expect((data.length - 44) / 2 / 22050).toBe(16);
  let maximum = 0, squares = 0;
  for (let i = 44; i < data.length; i += 2) { const sample = data.readInt16LE(i); maximum = Math.max(maximum, Math.abs(sample)); squares += sample ** 2; }
  expect(maximum).toBeLessThan(30000); expect(Math.sqrt(squares / ((data.length - 44) / 2))).toBeGreaterThan(1000);
  expect(data.readInt16LE(44)).toBe(0); expect(data.readInt16LE(data.length - 2)).toBe(0);
});
