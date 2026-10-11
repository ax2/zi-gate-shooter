import {it,expect} from 'vitest';
import {droneFrame} from '../src/game/drone-motion';

it('moves through both wing extremes with neutral between, and wraps without a discontinuous extreme jump',()=>{
  expect([0,.124,.125,.249,.25,.374,.375,.499,.5].map(droneFrame)).toEqual([1,1,2,2,1,1,0,0,1]);
  expect(droneFrame(10000)).toBe(1);
});
it('is independent of render sampling, freezes at the same simulation age and restarts neutral',()=>{
  const sample=droneFrame(.375);
  for(let i=0;i<120;i++)expect(droneFrame(.375)).toBe(sample);
  expect(droneFrame(0)).toBe(1);
  for(const bad of [-1,NaN,Infinity])expect(droneFrame(bad)).toBe(1);
});
