import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { expect, it } from 'vitest';

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
