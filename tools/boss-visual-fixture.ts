// Controlled lethal-hit/render fixture. Never imported by production entries.
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { defaults } from '../src/ui/storage';
const weak = new URLSearchParams(location.search).has('weak');
document.body.style.cssText = 'margin:0;background:#07111b;color:white;font:13px sans-serif';
const heading = document.createElement('div');
heading.style.cssText = 'position:fixed;top:0;height:28px;width:100%;text-align:center;line-height:28px';
heading.textContent = `首领击破夹具 · ${weak ? '弱' : '标准'}档 · 非正常局`;
const buttons = document.createElement('div'); buttons.style.cssText = 'position:fixed;top:28px;height:32px;width:100%;text-align:center;z-index:2';
const canvas = document.createElement('canvas'); canvas.style.cssText = 'position:fixed;top:64px;width:100%;height:calc(100% - 64px)';
document.body.append(heading, buttons, canvas);
const images = new Map<string, HTMLImageElement>();
let generation = 0;
async function show(seconds: number) {
  const mine = ++generation;
  let clock = 0, frame: FrameRequestCallback = () => {};
  const save = defaults(); save.settings.effects = weak ? 'weak' : 'standard';
  const runtime = new CanvasRuntime({ canvas, width: innerWidth, height: innerHeight - 64, dpr: devicePixelRatio,
    menuBottom: 0, read: () => save, write() {}, sound() {}, silence() {}, now: () => clock,
    requestFrame: callback => { frame = callback; },
    image: async src => { if (images.has(src)) return images.get(src)!;
      const image = await new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = `/build/android-web/${src}`; });
      images.set(src, image); return image;
    } });
  await runtime.load(); if (mine !== generation) return; runtime.start();
  runtime.world.time = 80; runtime.world.roundTime = 80;
  runtime.world.phase = 'boss'; runtime.world.player.hp = 2;
  const boss = runtime.world.spawn('boss', 360, 260); boss.hp = 4;
  runtime.world.bullets.push({ id: 9999, x: 360, y: 270, px: 360, py: 270, vx: 0, vy: 0, damage: 4, age: 0, active: true, hostile: false });
  for (let i = 0; i < Math.round(seconds * 60); i++) { clock += 1000 / 60; frame(clock); }
  heading.textContent = `击破后 ${seconds.toFixed(2)}s · ${weak ? '弱' : '标准'}档 · 渲染夹具`;
}
for (const seconds of [0.2, 0.5, 0.9, 1.5]) {
  const button = document.createElement('button'); button.textContent = `${seconds.toFixed(1)}秒`;
  button.style.cssText = 'margin:0 4px;padding:4px 10px;background:#233c50;color:white;border:1px solid #6ecfea';
  button.onclick = () => { void show(seconds); }; buttons.append(button);
}
await show(0.2);
