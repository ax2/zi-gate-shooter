import { expect, it } from 'vitest';
import { FrameWindow } from '../src/game/frame-window';

it('keeps only the latest bounded samples and reports nearest-rank quantiles', () => {
  const window = new FrameWindow(100);
  for (let i = 1; i <= 200; i++) window.add(i);
  expect(window.snapshot()).toEqual({ frameSamples: 100, sampleLimit: 100, frameSampleSeconds: 15.05, p95: 195, p99: 199, over33msPercent: 100 });
});

it('new runs and invalid values cannot contaminate the next window', () => {
  const window = new FrameWindow(5);
  window.add(1000); window.clear();
  window.add(NaN); window.add(Infinity); window.add(-1);
  expect(window.snapshot().frameSamples).toBe(0);
  window.add(16); window.add(17);
  expect(window.snapshot()).toEqual({ frameSamples: 2, sampleLimit: 5, frameSampleSeconds: .033, p95: 17, p99: 17, over33msPercent: 0 });
});
