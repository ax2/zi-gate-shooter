// Explicit visual fixture, excluded from all production entry graphs.
// Supplies renderer events and overlap geometry; does not prove ordinary-play reachability.
import { CanvasRuntime } from '../src/game/canvas-runtime';
import { defaults } from '../src/ui/storage';
const weak = new URLSearchParams(location.search).has('weak');
document.body.style.cssText = 'margin:0;background:#07111b;color:white;font:14px sans-serif';
const heading = document.createElement('div');
heading.textContent = `渲染夹具 · ${weak ? '弱' : '标准'}档 · 非正常游玩截图`;
heading.style.cssText = 'position:fixed;top:0;height:32px;width:100%;text-align:center;line-height:32px;z-index:2';
const canvas = document.createElement('canvas'); canvas.style.cssText = 'position:fixed;top:32px;width:100%;height:calc(100% - 32px)';
document.body.append(heading, canvas);
let clock = 0, frame: FrameRequestCallback = () => {};
const save = defaults(); save.settings.effects = weak ? 'weak' : 'standard';
const runtime = new CanvasRuntime({ canvas, width: innerWidth, height: innerHeight - 32, dpr: devicePixelRatio,
  menuBottom: 0, read: () => save, write() {}, sound() {}, silence() {}, now: () => clock,
  requestFrame: callback => { frame = callback; },
  image: src => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = `/build/android-web/${src}`; }) });
await runtime.load(); runtime.start();
runtime.world.spawn('gate', 360, 500);
const charger = runtime.world.spawn('charger', 120, 380); charger.warning = 0.8;
runtime.world.bullets.push({ id: 9999, x: 270, y: 620, px: 270, py: 620, vx: 0, vy: 0, damage: 1, age: 0, active: true, hostile: true });
for (const [x, y] of [[340, 480], [440, 540], [270, 620], [420, 720]]) runtime.world.emit('kill', x, y);
for (let i = 0; i < 8; i++) { clock += 1000 / 60; frame(clock); }
// Hold this rendered instant without a pause overlay or further simulation.
