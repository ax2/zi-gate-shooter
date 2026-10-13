import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('public/assets/audio', { recursive: true });
const sounds = { shot1: [275, 70, .065, .2], shot2: [340, 70, .075, .24], shot3: [405, 65, .09, .28], blast: [95, 22, .22, .4], hurt: [160, 35, .3, .3], upgrade: [360, 1100, .4, .26], reward: [600, 1000, .16, .2] };
for (let tier = 1; tier <= 3; tier++) {
  sounds[`shot-scatter${tier}`] = [(210 + tier * 65) * .85, 70, .08, .2 + tier * .02];
  sounds[`shot-pierce${tier}`] = [(210 + tier * 65) * .65, 35, .12, .2 + tier * .02];
}
for (const [key, [from, to, duration, volume]] of Object.entries(sounds)) {
  const rate = 22050, count = Math.ceil(rate * duration), buffer = Buffer.alloc(44 + count * 2);
  buffer.write('RIFF'); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVE', 8); buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36); buffer.writeUInt32LE(count * 2, 40);
  let phase = 0;
  for (let i = 0; i < count; i++) {
    const t = i / count, frequency = from * (to / from) ** t; phase += frequency * Math.PI * 2 / rate;
    const wave = Math.sin(phase) * .7 + Math.sin(phase * 2) * .2 + Math.sin(phase * 3) * .1;
    const envelope = Math.min(1, t * 50) * (1 - t) ** 2;
    buffer.writeInt16LE(Math.round(wave * envelope * volume * 32767), 44 + i * 2);
  }
  await writeFile(`public/assets/audio/${key}.wav`, buffer);
}
console.log(`Exported ${Object.keys(sounds).length} original procedural WAV sounds.`);
