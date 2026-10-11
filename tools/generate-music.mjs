import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Original deterministic composition and synthesis. No samples or downloaded music.
const rate = 22050, bpm = 120, beat = 60 / bpm, seconds = 32 * beat;
const count = Math.round(rate * seconds), mix = new Float64Array(count);
let seed = 0x291b2026;
const noise = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 2147483648 - 1; };
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
function add(start, duration, signal) {
  const first = Math.round(start * rate), length = Math.round(duration * rate);
  for (let i = 0; i < length; i++) mix[(first + i) % count] += signal(i / rate, i / length);
}
const roots = [38, 34, 41, 36]; // D minor / B-flat / F / C, two bars per chord.
for (let step = 0; step < 64; step++) {
  const chord = Math.floor(step / 16), root = roots[chord], start = step * beat / 2;
  const interval = [12, 19, 15, 19, 24, 19, 15, 22][step % 8];
  const minor = chord === 0;
  const note = root + interval + (!minor && [15, 22].includes(interval) ? 1 : 0);
  add(start, 0.32, (t, p) => {
    const phase = Math.PI * 2 * hz(note) * t;
    return (Math.sin(phase) + 0.25 * Math.sin(phase * 2) + 0.1 * Math.sin(phase * 3)) * Math.min(1, p * 32) * (1 - p) ** 3 * 0.12;
  });
  // Sub-bass on beats, a little space on the last upbeat of each bar.
  if (step % 2 === 0) add(start, 0.44, (t, p) =>
    (Math.sin(Math.PI * 2 * hz(root) * t) + 0.22 * Math.sin(Math.PI * 4 * hz(root) * t)) * Math.min(1, p * 24) * (1 - p) ** 1.5 * 0.18);
  let previous = 0;
  add(start, step % 2 ? 0.045 : 0.07, (_t, p) => { const n = noise(), high = n - previous; previous = n; return high * (1 - p) ** 4 * 0.035; });
}
for (let b = 0; b < 32; b++) {
  if (b % 4 === 0 || b % 4 === 2 || b % 8 === 7) add(b * beat, 0.22, (t, p) => {
    const phase = Math.PI * 2 * (42 * t + 88 * 0.025 * (1 - Math.exp(-t / 0.025)));
    return Math.sin(phase) * Math.min(1, p * 60) * (1 - p) ** 2.6 * 0.4;
  });
  if (b % 2 === 1) add(b * beat, 0.14, (t, p) =>
    (noise() * 0.65 + Math.sin(Math.PI * 2 * 185 * t) * 0.35) * Math.min(1, p * 80) * (1 - p) ** 3 * 0.15);
}
// Short circular echo is part of the composition; boundaries get a 5ms safety ramp.
const delay = Math.round(rate * beat * 0.75), dry = mix.slice();
for (let i = 0; i < count; i++) mix[i] += dry[(i + count - delay) % count] * 0.12;
let peak = 0;
for (let i = 0; i < count; i++) {
  mix[i] = Math.tanh(mix[i] * 1.1) * Math.min(1, i / (rate * 0.005), (count - 1 - i) / (rate * 0.005));
  peak = Math.max(peak, Math.abs(mix[i]));
}
const buffer = Buffer.alloc(44 + count * 2);
buffer.write('RIFF'); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVE', 8);
buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
buffer.write('data', 36); buffer.writeUInt32LE(count * 2, 40);
let squares = 0, maximum = 0;
for (let i = 0; i < count; i++) {
  const sample = Math.round(mix[i] / peak * 0.62 * 32767);
  squares += (sample / 32768) ** 2; maximum = Math.max(maximum, Math.abs(sample));
  buffer.writeInt16LE(sample, 44 + i * 2);
}
await mkdir('public/assets/audio', { recursive: true }); await mkdir('build/art', { recursive: true });
await writeFile('public/assets/audio/mechanical-pulse-v1.wav', buffer);
await writeFile('build/art/mechanical-pulse-v1.json', JSON.stringify({ source: 'tools/generate-music.mjs', bpm, seconds, bars: 8,
  rate, channels: 1, bits: 16, bytes: buffer.length, pcmBytes: count * 2, peak: maximum / 32768, rms: Math.sqrt(squares / count),
  firstSample: buffer.readInt16LE(44), lastSample: buffer.readInt16LE(buffer.length - 2),
  sha256: createHash('sha256').update(buffer).digest('hex'), humanListeningApproved: false }, null, 2));
console.log(`Exported original 8-bar / ${seconds}s music loop, ${buffer.length} bytes; listening approval pending.`);
