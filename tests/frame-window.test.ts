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

it('repeated snapshots preserve rolling order through wraparound and clear', () => {
  const window = new FrameWindow(17), reference: number[] = [];
  for (let i = 0; i < 400; i++) {
    if (i === 213) { window.clear(); reference.length = 0; }
    const value = (i * 31 % 91) + (i % 5) * .125;
    window.add(value); reference.push(value); if (reference.length > 17) reference.shift();
    const sorted = [...reference].sort((a,b) => a-b);
    const expected = { frameSamples: sorted.length, sampleLimit: 17,
      frameSampleSeconds: sorted.reduce((sum,v)=>sum+v,0)/1000,
      p95: sorted[Math.ceil(sorted.length*.95)-1], p99: sorted[Math.ceil(sorted.length*.99)-1],
      over33msPercent: sorted.filter(v=>v>1000/30).length/sorted.length*100 };
    expect(window.snapshot()).toEqual(expected); expect(window.snapshot()).toEqual(expected);
  }
});
