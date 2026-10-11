import { CanvasRuntime, parseSave } from './game/canvas-runtime';
import type { Save } from './ui/storage';
import { LoopMusic } from './game/music';

interface Touch { identifier: number; clientX: number; clientY: number }
interface TouchEvent { changedTouches: Touch[] }
interface InnerAudio { src: string; volume: number; loop: boolean; play(): void; pause(): void; stop(): void; destroy(): void; onEnded(callback: () => void): void; onError(callback: () => void): void }
interface WindowInfo { windowWidth: number; windowHeight: number; pixelRatio: number }
declare const wx: {
  createCanvas(): HTMLCanvasElement; createImage(): HTMLImageElement;
  getWindowInfo?: () => WindowInfo; getSystemInfoSync(): WindowInfo;
  getMenuButtonBoundingClientRect?: () => { bottom: number };
  getStorageSync(key: string): unknown; setStorageSync(key: string, value: Save): void;
  onTouchStart(callback: (e: TouchEvent) => void): void; onTouchMove(callback: (e: TouchEvent) => void): void;
  onTouchEnd(callback: (e: TouchEvent) => void): void; onTouchCancel(callback: (e?: TouchEvent) => void): void;
  onHide(callback: () => void): void; onShow(callback: () => void): void;
  onWindowResize?: (callback: () => void) => void;
  createInnerAudioContext(): InnerAudio; setKeepScreenOn(options: { keepScreenOn: boolean }): void;
};

const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
const canvas = wx.createCanvas();
const music = new LoopMusic(() => {
  const node = wx.createInnerAudioContext();
  try {
    node.src = 'assets/audio/mechanical-pulse-v1.wav'; node.loop = true; node.volume = 0.18;
    return { play: () => node.play(), pause: () => node.pause(), destroy: () => node.destroy(), onError: callback => node.onError(callback) };
  } catch { try { node.destroy(); } catch { /* Partial allocation. */ } throw new Error('Music unavailable'); }
}, () => Date.now());
const audio = new Map<string, InnerAudio[]>();
const busy = new Set<InnerAudio>();
let lastShot = 0;
let retryAudioAt = 0;
const failAudio = () => {
  // Detach first: late callbacks from retired nodes must not disable a new pool.
  const retired: InnerAudio[] = [];
  for (const pool of audio.values()) retired.push(...pool);
  audio.clear(); busy.clear(); retryAudioAt = Date.now() + 5000;
  for (const node of retired) {
    try { node.stop(); } catch { /* Platform audio is unavailable. */ }
    try { node.destroy(); } catch { /* Already retired or unavailable. */ }
  }
};
const silence = () => {
  let failed = false;
  for (const pool of audio.values()) for (const node of pool) {
    try { node.stop(); } catch { failed = true; }
  }
  busy.clear();
  if (failed) failAudio();
};
const sound = (type: string, stage: number) => {
  if (Date.now() < retryAudioAt) return;
  const key = type === 'fire' ? `shot${stage}` : type === 'upgrade' || type === 'overload' ? 'upgrade'
    : type === 'kill' || type === 'crate-break' || type === 'boss-kill' ? 'blast'
      : type === 'hurt' || type === 'death' ? 'hurt' : type === 'gate-level' || type === 'gate-taken' || type === 'pickup' ? 'reward' : '';
  if (!key) return;
  if (type === 'fire') { if (Date.now() - lastShot < 100) return; lastShot = Date.now(); }
  try {
    let pool = audio.get(key); if (!pool) { pool = []; audio.set(key, pool); }
    let node = pool.find(item => !busy.has(item));
    if (!node && pool.length < 2 && busy.size < 12) {
      node = wx.createInnerAudioContext(); pool.push(node);
      node.src = `assets/audio/${key}.wav`; node.volume = type === 'fire' ? 0.35 : 0.55;
      const created = node;
      node.onEnded(() => busy.delete(created));
      node.onError(() => { if (audio.get(key)?.includes(created)) failAudio(); });
    }
    if (node && Date.now() >= retryAudioAt) { busy.add(node); node.play(); }
  } catch {
    failAudio();
  }
};
const runtime = new CanvasRuntime({
  canvas, width: info.windowWidth, height: info.windowHeight, dpr: info.pixelRatio,
  menuBottom: wx.getMenuButtonBoundingClientRect?.().bottom ?? 0,
  image: src => new Promise((resolve, reject) => { const image = wx.createImage(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }),
  read: () => { try { return parseSave(wx.getStorageSync('zi-gate-shooter-v1')); } catch { return parseSave(null); } },
  write: value => { try { wx.setStorageSync('zi-gate-shooter-v1', value); } catch { /* Continue in memory. */ } },
  sound, silence,
  music: playing => music.setPlaying(playing),
  now: () => Date.now(), requestFrame: callback => requestAnimationFrame(callback),
});
wx.onTouchStart(e => { for (const t of e.changedTouches) runtime.touchStart(t.identifier, t.clientX, t.clientY); });
wx.onTouchMove(e => { for (const t of e.changedTouches) runtime.touchMove(t.identifier, t.clientX, t.clientY); });
wx.onTouchEnd(e => { for (const t of e.changedTouches) runtime.touchEnd(t.identifier, t.clientX, t.clientY); });
wx.onTouchCancel(e => {
  if (!e?.changedTouches?.length) { runtime.cancelTouch(); return; }
  for (const t of e.changedTouches) runtime.cancelTouch(t.identifier);
});
wx.onHide(() => runtime.hide()); wx.onShow(() => runtime.show());
wx.onWindowResize?.(() => { const next = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync(); runtime.resize(next.windowWidth, next.windowHeight, next.pixelRatio, wx.getMenuButtonBoundingClientRect?.().bottom ?? 0); });
wx.setKeepScreenOn({ keepScreenOn: true });
void runtime.load();
