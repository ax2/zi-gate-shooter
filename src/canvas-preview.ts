import { CanvasRuntime, parseSave } from './game/canvas-runtime';
import { GameAudio } from './game/audio';
import { createLicenseViewer } from './game/license-viewer';
import licenseText from '../legal/ANDROID_NOTICES.txt?raw';

const canvas = document.createElement('canvas');
const inset = (side: string) => `var(--safe-area-inset-${side},env(safe-area-inset-${side},0px))`;
canvas.style.cssText = `display:block;position:fixed;left:${inset('left')};top:${inset('top')};width:calc(100vw - ${inset('left')} - ${inset('right')});height:calc(100dvh - ${inset('top')} - ${inset('bottom')});touch-action:none`;
document.body.style.cssText = 'margin:0;background:#0a1119;overflow:hidden'; document.body.append(canvas);
const audio = new GameAudio();
const viewport = () => canvas.getBoundingClientRect();
const bounds = viewport();
export const licenses = createLicenseViewer(licenseText, () => runtime.hide());
export const runtime = new CanvasRuntime({
  canvas, width: bounds.width, height: bounds.height, dpr: devicePixelRatio, menuBottom: 0,
  image: src => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }),
  read: () => { try { return parseSave(JSON.parse(localStorage.getItem('zi-gate-shooter-v1') ?? 'null')); } catch { return parseSave(null); } },
  write: value => { try { localStorage.setItem('zi-gate-shooter-v1', JSON.stringify(value)); } catch { /* In-memory fallback. */ } },
  sound: (type, stage) => audio.event(type, stage), silence: () => audio.stop(),
  now: () => performance.now(), requestFrame: callback => requestAnimationFrame(callback),
  openLicenses: () => licenses.open(),
});
canvas.addEventListener('pointerdown', e => { const r = viewport(); canvas.setPointerCapture(e.pointerId); void audio.unlock(); runtime.touchStart(e.pointerId, e.clientX - r.left, e.clientY - r.top); });
canvas.addEventListener('pointermove', e => { const r = viewport(); runtime.touchMove(e.pointerId, e.clientX - r.left, e.clientY - r.top); });
canvas.addEventListener('pointerup', e => { const r = viewport(); runtime.touchEnd(e.pointerId, e.clientX - r.left, e.clientY - r.top); });
canvas.addEventListener('pointercancel', e => runtime.cancelTouch(e.pointerId));
canvas.addEventListener('lostpointercapture', e => runtime.cancelTouch(e.pointerId));
document.addEventListener('visibilitychange', () => document.hidden ? runtime.hide() : runtime.show());
window.addEventListener('blur', () => runtime.hide());
const resize = () => { const r = viewport(); runtime.resize(r.width, r.height, devicePixelRatio); };
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(canvas);
window.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); if (!licenses.close()) runtime.back(); } });
// Only read-only diagnostics are exposed; no debug rewards or automatic victories.
Object.defineProperty(window, '__gateDiagnostics', { value: () => runtime.diagnostics() });
void runtime.load();
