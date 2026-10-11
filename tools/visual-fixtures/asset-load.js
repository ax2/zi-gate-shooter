import { CanvasRuntime } from '/src/game/canvas-runtime.ts';
import { defaults } from '/src/ui/storage.ts';
const canvas = document.querySelector('canvas');
let attempt = 0;
const runtime = new CanvasRuntime({
  canvas, width: innerWidth, height: innerHeight, dpr: devicePixelRatio, menuBottom: 0,
  image: src => {
    if (src.endsWith('units.png')) attempt++;
    if (attempt === 1 && src.endsWith('runway.jpg')) return new Promise(() => {});
    return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = `/${src}`; });
  },
  read: defaults, write: () => {}, sound: () => {}, silence: () => {},
  now: () => performance.now(), requestFrame: callback => requestAnimationFrame(callback),
});
const coords = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); runtime.touchStart(e.pointerId, ...coords(e)); });
canvas.addEventListener('pointerup', e => runtime.touchEnd(e.pointerId, ...coords(e)));
canvas.addEventListener('pointercancel', e => runtime.cancelTouch(e.pointerId));
document.addEventListener('visibilitychange', () => document.hidden ? runtime.hide() : runtime.show());
window.addEventListener('resize', () => runtime.resize(innerWidth, innerHeight, devicePixelRatio));
Object.defineProperty(window, '__gateDiagnostics', { value: () => ({ ...runtime.diagnostics(), fixtureAttempt: attempt }) });
void runtime.load();
