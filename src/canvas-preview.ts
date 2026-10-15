import { CanvasRuntime, parseSave } from './game/canvas-runtime';
import { GameAudio } from './game/audio';
import { LoopMusic, browserMusicHandle } from './game/music';
import { createLicenseViewer } from './game/license-viewer';
import { bindBrowserKeyboard } from './game/browser-keyboard';
import { browserImage } from './game/browser-image';
import licenseText from '../legal/ANDROID_NOTICES.txt?raw';

const canvas = document.createElement('canvas');
const supports = (property: string, value: string) => typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports(property, value);
const hasEnv = supports('padding-top', 'env(safe-area-inset-top)');
const inset = (side: string) => `var(--safe-area-inset-${side},${hasEnv ? `env(safe-area-inset-${side},0px)` : '0px'})`;
const viewportHeight = supports('height', '100dvh') ? '100dvh' : '100vh';
canvas.style.cssText = `display:block;position:fixed;left:${inset('left')};top:${inset('top')};width:calc(100vw - ${inset('left')} - ${inset('right')});height:calc(${viewportHeight} - ${inset('top')} - ${inset('bottom')});touch-action:none`;
document.body.style.cssText = 'margin:0;background:#0a1119;overflow:hidden'; document.body.append(canvas);
const audio = new GameAudio();
const music = new LoopMusic(browserMusicHandle, () => performance.now());
const viewport = () => canvas.getBoundingClientRect();
const bounds = viewport();
export const licenses = createLicenseViewer(licenseText, () => runtime.hide());
export const runtime = new CanvasRuntime({
  canvas, width: bounds.width, height: bounds.height, dpr: devicePixelRatio, menuBottom: 0,
  image: browserImage,
  read: () => { try { return parseSave(JSON.parse(localStorage.getItem('zi-gate-shooter-v1') ?? 'null')); } catch { return parseSave(null); } },
  write: value => { try { localStorage.setItem('zi-gate-shooter-v1', JSON.stringify(value)); } catch { /* In-memory fallback. */ } },
  sound: (type, stage, weapon) => audio.event(type, stage, weapon), silence: () => audio.stop(),
  music: playing => music.setPlaying(playing),
  frameContext:()=>({hidden:document.hidden,focused:document.hasFocus()}),
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
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas);
window.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); if (!licenses.close()) runtime.back(); } });
bindBrowserKeyboard(window, runtime, () => { void audio.unlock(); });
// Only read-only diagnostics are exposed; no debug rewards or automatic victories.
Object.defineProperty(window, '__gateDiagnostics', { value: () => runtime.diagnostics() });
void runtime.load();
