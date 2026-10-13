import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { expect, it } from 'vitest';

// Observe the rendered player from the real bundle; do not expose or mutate World.
async function inputFixture(createAudio = () => ({ play() {}, stop() {}, onEnded() {}, onError() {}, destroy() {} }), move = true, save = null) {
  const callbacks = {}; let nextFrame, clock = 1000, playerX, labels = [];
  const context = new Proxy({}, { get: (_target, key) => (...args) => {
    // Ground contact shadow remains anchored to the real player while the
    // articulated sprite can use several draws with independent offsets.
    if (key === 'ellipse' && args[2] === 53 && args[3] === 30) playerX = args[0] - 5;
    if (key === 'fillText') labels.push(args[0]);
  } });
  const wx = {
    createCanvas: () => ({ getContext: () => context }),
    createImage: () => { const image = { width: 768, height: 512 }; Object.defineProperty(image, 'src', { set() { queueMicrotask(() => image.onload?.()); } }); return image; },
    getWindowInfo: () => ({ windowWidth: 720, windowHeight: 1280, pixelRatio: 1 }),
    getStorageSync: () => save, setStorageSync() {}, setKeepScreenOn() {},
    onTouchStart: fn => callbacks.start = fn, onTouchMove: fn => callbacks.move = fn,
    onTouchEnd: fn => callbacks.end = fn, onTouchCancel: fn => callbacks.cancel = fn,
    onHide: fn => callbacks.hide = fn, onShow: fn => callbacks.show = fn,
    createInnerAudioContext: createAudio,
  };
  vm.runInNewContext(readFileSync('build/wechat/game.js', 'utf8'), {
    wx, requestAnimationFrame: fn => nextFrame = fn,
    Date: class extends Date { static now() { return clock; } }, console,
  });
  for (let i = 0; i < 12; i++) await Promise.resolve();
  const frames = count => { for (let i = 0; i < count; i++) { labels = []; clock += 1000 / 60; nextFrame(clock); } };
  const touch = (callback, identifier, x, y = 1000) => callback({ changedTouches: [{ identifier, clientX: x, clientY: y }] });
  frames(1); touch(callbacks.start, 9, 360, 1041); touch(callbacks.end, 9, 360, 1041); frames(1);
  if (move) {
    expect(playerX).toBe(360);
    touch(callbacks.start, 1, 360); touch(callbacks.move, 1, 650); frames(1);
    expect(playerX).toBeGreaterThan(360); expect(playerX).toBeLessThan(650);
  }
  return { callbacks, touch, frames, x: () => playerX, labels: () => labels };
}

it('WeChat music loops separately from muted SFX and pauses for hide until explicit resume', async () => {
  const nodes = [];
  const f = await inputFixture(() => { const node = { play: () => node.plays++, pause: () => node.pauses++, stop() {}, destroy() {},
    onError() {}, onEnded() {}, plays: 0, pauses: 0 }; nodes.push(node); return node; }, false,
  { version: 1, best: 0, settings: { music: true, sound: false } });
  f.frames(20); expect(nodes).toHaveLength(1);
  expect(nodes[0].src).toBe('assets/audio/mechanical-pulse-v1.wav'); expect(nodes[0].loop).toBe(true);
  expect(nodes[0].plays).toBe(1); f.callbacks.hide(); expect(nodes[0].pauses).toBe(1);
  f.callbacks.show(); f.frames(10); expect(nodes[0].plays).toBe(1);
  f.touch(f.callbacks.start, 4, 360, 603); f.touch(f.callbacks.end, 4, 360, 603); f.frames(2);
  expect(nodes[0].plays).toBe(2); expect(nodes).toHaveLength(1);
});

it('WeChat music configuration failure releases the partial handle and retries outside battle state', async () => {
  let healthy = false, created = 0, destroyed = 0, plays = 0;
  const f = await inputFixture(() => { created++; return {
    set src(_value) { if (!healthy) throw Error('fixture music source rejected'); },
    play() { plays++; }, pause() {}, stop() {}, destroy() { destroyed++; }, onError() {}, onEnded() {},
  }; }, false, { version: 1, best: 0, settings: { music: true, sound: false } });
  f.frames(30); expect(created).toBe(1); expect(destroyed).toBe(1);
  expect(f.labels()).toContain('T1 速射炮'); expect(f.labels()).not.toContain('运行异常，请重新开始');
  healthy = true; f.frames(310); expect(created).toBe(2); expect(plays).toBe(1);
});

it.each(['create', 'configure', 'play'])('WeChat %s audio failure does not stop battle or retry every shot', async fault => {
  let attempts = 0, destroyed = 0, healthy = false, plays = 0;
  const factory = () => {
    attempts++;
    if (!healthy && fault === 'create') throw new Error('fixture audio unavailable');
    return { set src(_value) { if (!healthy && fault === 'configure') throw new Error('fixture source rejected'); },
      play() { if (!healthy && fault === 'play') throw new Error('fixture playback failed'); plays++; },
      stop() {}, destroy() { destroyed++; }, onEnded() {}, onError() {} };
  };
  const f = await inputFixture(factory, false);
  f.frames(30);
  expect(f.labels()).toContain('T1 速射炮');
  expect(f.labels()).not.toContain('运行异常，请重新开始');
  expect(attempts).toBe(1);
  expect(destroyed).toBe(fault === 'create' ? 0 : 1);
  healthy = true; f.frames(310);
  expect(plays).toBeGreaterThan(0);
  expect(f.labels()).toContain('T1 速射炮');
});

it('WeChat stop errors cannot abort hide, and asynchronous errors retire failed nodes', async () => {
  let failStop = true, destroyed = 0, errorCallback;
  const factory = () => ({ play() {}, stop() { if (failStop) throw new Error('fixture stop failed'); },
    destroy() { destroyed++; }, onEnded() {}, onError(fn) { errorCallback = fn; } });
  const f = await inputFixture(factory, false);
  expect(() => f.callbacks.hide()).not.toThrow(); f.frames(1);
  expect(f.labels()).toContain('继续战斗'); expect(destroyed).toBeGreaterThan(0);
  failStop = false; f.frames(310); f.callbacks.show();
  f.touch(f.callbacks.start, 4, 360, 603); f.touch(f.callbacks.end, 4, 360, 603); f.frames(12);
  const before = destroyed;
  const retiredError = errorCallback;
  expect(() => retiredError()).not.toThrow(); f.frames(12);
  expect(destroyed).toBeGreaterThan(before);
  expect(f.labels()).toContain('T1 速射炮');
  f.frames(310);
  expect(errorCallback).not.toBe(retiredError);
  const afterRecovery = destroyed;
  expect(() => retiredError()).not.toThrow(); f.frames(1);
  expect(destroyed).toBe(afterRecovery);
});

it('WeChat audio cleanup exceptions remain isolated from the game', async () => {
  const fail = () => { throw new Error('fixture cleanup unavailable'); };
  const f = await inputFixture(() => ({ play: fail, stop: fail, destroy: fail, onEnded() {}, onError() {} }), false);
  f.frames(30);
  expect(f.labels()).toContain('T1 速射炮');
  expect(() => f.callbacks.hide()).not.toThrow(); f.frames(1);
  expect(f.labels()).toContain('继续战斗');
});

it('WeChat secondary cancellation preserves the primary drag, while primary cancellation stops it', async () => {
  const { callbacks, touch, frames, x } = await inputFixture();
  const before = x();
  touch(callbacks.start, 2, 300); touch(callbacks.cancel, 2, 300);
  frames(3);
  expect(x()).toBeGreaterThan(before + 10);
  const primaryStillActive = x();
  touch(callbacks.move, 1, 640); frames(1);
  expect(x()).toBeGreaterThan(primaryStillActive);
  touch(callbacks.cancel, 1, 640);
  const cancelledAt = x(); frames(10);
  expect(x()).toBeCloseTo(cancelledAt, 8);
  touch(callbacks.move, 1, 68); frames(1);
  expect(x()).toBeCloseTo(cancelledAt, 8);
  touch(callbacks.start, 3, 400); touch(callbacks.move, 3, 500); frames(1);
  expect(x()).toBeGreaterThan(cancelledAt);
});

it.each([
  ['empty', { changedTouches: [] }],
  ['missing touches', {}],
  ['legacy callback', undefined],
])('WeChat cancellation with %s payload safely clears pending travel', async (_name, payload) => {
  const { callbacks, touch, frames, x } = await inputFixture();
  callbacks.cancel(payload); const stopped = x(); frames(10);
  expect(x()).toBeCloseTo(stopped, 8);
  touch(callbacks.move, 1, 68); frames(1);
  expect(x()).toBeCloseTo(stopped, 8);
});

it('the actual WeChat bundle boots and handles start/hide/resume without browser globals', async () => {
  const callbacks = {}, calls = []; let nextFrame, clock = 1000;
  let windowInfo = { windowWidth: 390, windowHeight: 844, pixelRatio: 3 };
  const context = new Proxy({}, { get: (_target, key) => (...args) => { calls.push([String(key), args]); } });
  const canvas = { width: 0, height: 0, getContext: () => context };
  const wx = {
    createCanvas: () => canvas,
    createImage: () => { const image = { width: 768, height: 512 }; Object.defineProperty(image, 'src', { set(value) { if (value.includes('runway')) { image.width = 720; image.height = 1260; } queueMicrotask(() => image.onload?.()); } }); return image; },
    getWindowInfo: () => windowInfo,
    onWindowResize: fn => callbacks.resize = fn,
    getMenuButtonBoundingClientRect: () => ({ bottom: 48 }), getStorageSync: () => null,
    setStorageSync: () => {}, setKeepScreenOn: () => {},
    onTouchStart: fn => callbacks.start = fn, onTouchMove: fn => callbacks.move = fn,
    onTouchEnd: fn => callbacks.end = fn, onTouchCancel: fn => callbacks.cancel = fn,
    onHide: fn => callbacks.hide = fn, onShow: fn => callbacks.show = fn,
    createInnerAudioContext: () => ({ play() {}, stop() {}, onEnded() {}, onError() {} }),
  };
  const sandbox = { wx, requestAnimationFrame: fn => nextFrame = fn, Date: class extends Date { static now() { return clock; } }, console };
  vm.runInNewContext(readFileSync('build/wechat/game.js', 'utf8'), sandbox);
  for (let i = 0; i < 12; i++) await Promise.resolve();
  expect(typeof nextFrame).toBe('function');
  const frame = () => { clock += 17; nextFrame(clock); };
  frame(); expect(calls.some(([name, args]) => name === 'fillText' && args[0] === '火力突围')).toBe(true);
  const touch = (fn, x, y) => fn({ changedTouches: [{ identifier: 1, clientX: x, clientY: y }] });
  touch(callbacks.start, 195, 638); touch(callbacks.end, 195, 638); frame();
  expect(calls.some(([name, args]) => name === 'fillText' && args[0] === 'T1 速射炮')).toBe(true);
  callbacks.hide(); frame();
  expect(calls.some(([name, args]) => name === 'fillText' && args[0] === '继续战斗')).toBe(true);
  callbacks.show(); callbacks.cancel();
  expect(canvas.width).toBe(780); expect(canvas.height).toBe(1688);
  // Resizing must update the backing bitmap and touch coordinates together.
  windowInfo = { windowWidth: 720, windowHeight: 1280, pixelRatio: 1 };
  callbacks.resize(); frame();
  expect(canvas.width).toBe(720); expect(canvas.height).toBe(1280);
  calls.length = 0;
  touch(callbacks.start, 360, 560); touch(callbacks.end, 360, 560); frame();
  expect(calls.some(([name, args]) => name === 'fillText' && args[0] === '继续战斗')).toBe(false);
  callbacks.hide(); calls.length = 0; frame();
  expect(calls.some(([name, args]) => name === 'fillText' && args[0] === '继续战斗')).toBe(true);
  expect('document' in sandbox).toBe(false); expect('window' in sandbox).toBe(false);
});
