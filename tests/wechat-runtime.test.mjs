import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { expect, it } from 'vitest';

// Observe the rendered player from the real bundle; do not expose or mutate World.
async function inputFixture() {
  const callbacks = {}; let nextFrame, clock = 1000, playerX;
  const context = new Proxy({}, { get: (_target, key) => (...args) => {
    if (key === 'drawImage' && args[7] === 160 && args[8] === 213) playerX = args[5] + 80;
  } });
  const wx = {
    createCanvas: () => ({ getContext: () => context }),
    createImage: () => { const image = { width: 768, height: 512 }; Object.defineProperty(image, 'src', { set() { queueMicrotask(() => image.onload?.()); } }); return image; },
    getWindowInfo: () => ({ windowWidth: 720, windowHeight: 1280, pixelRatio: 1 }),
    getStorageSync: () => null, setStorageSync() {}, setKeepScreenOn() {},
    onTouchStart: fn => callbacks.start = fn, onTouchMove: fn => callbacks.move = fn,
    onTouchEnd: fn => callbacks.end = fn, onTouchCancel: fn => callbacks.cancel = fn,
    onHide() {}, onShow() {},
    createInnerAudioContext: () => ({ play() {}, stop() {}, onEnded() {}, onError() {} }),
  };
  vm.runInNewContext(readFileSync('build/wechat/game.js', 'utf8'), {
    wx, requestAnimationFrame: fn => nextFrame = fn,
    Date: class extends Date { static now() { return clock; } }, console,
  });
  for (let i = 0; i < 12; i++) await Promise.resolve();
  const frames = count => { for (let i = 0; i < count; i++) { clock += 1000 / 60; nextFrame(clock); } };
  const touch = (callback, identifier, x, y = 1000) => callback({ changedTouches: [{ identifier, clientX: x, clientY: y }] });
  frames(1); touch(callbacks.start, 9, 360, 1041); touch(callbacks.end, 9, 360, 1041); frames(1);
  expect(playerX).toBe(360);
  touch(callbacks.start, 1, 360); touch(callbacks.move, 1, 650); frames(1);
  expect(playerX).toBeGreaterThan(360); expect(playerX).toBeLessThan(650);
  return { callbacks, touch, frames, x: () => playerX };
}

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
  expect(calls.some(([name, args]) => name === 'fillText' && args[0] === 'T1 单管')).toBe(true);
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
