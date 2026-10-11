import { CanvasRuntime, parseSave } from './game/canvas-runtime';
import { GameAudio } from './game/audio';

const canvas = document.createElement('canvas');
canvas.style.cssText = 'display:block;width:100vw;height:100dvh;touch-action:none';
document.body.style.cssText = 'margin:0;background:#0a1119;overflow:hidden'; document.body.append(canvas);
const audio = new GameAudio();
const runtime = new CanvasRuntime({
  canvas, width: innerWidth, height: innerHeight, dpr: devicePixelRatio, menuBottom: 0,
  image: src => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }),
  read: () => { try { return parseSave(JSON.parse(localStorage.getItem('zi-gate-shooter-v1') ?? 'null')); } catch { return parseSave(null); } },
  write: value => { try { localStorage.setItem('zi-gate-shooter-v1', JSON.stringify(value)); } catch { /* In-memory fallback. */ } },
  sound: (type, stage) => audio.event(type, stage), silence: () => audio.stop(),
  now: () => performance.now(), requestFrame: callback => requestAnimationFrame(callback),
});
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); void audio.unlock(); runtime.touchStart(e.pointerId, e.clientX, e.clientY); });
canvas.addEventListener('pointermove', e => runtime.touchMove(e.pointerId, e.clientX, e.clientY));
canvas.addEventListener('pointerup', e => runtime.touchEnd(e.pointerId, e.clientX, e.clientY));
canvas.addEventListener('pointercancel', () => runtime.cancelTouch());
document.addEventListener('visibilitychange', () => document.hidden ? runtime.hide() : runtime.show());
window.addEventListener('blur', () => runtime.hide());
window.addEventListener('resize', () => runtime.resize(innerWidth, innerHeight, devicePixelRatio));
window.addEventListener('keydown', e => { if (e.key === 'Escape') runtime.pause(); });
// Only read-only diagnostics are exposed; no debug rewards or automatic victories.
Object.defineProperty(window, '__gateDiagnostics', { value: () => runtime.diagnostics() });
void runtime.load();
