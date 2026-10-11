import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {advanceBody} from '../src/core/behavior';
import {C} from '../src/core/config';
import {chargerFrame} from '../src/game/charger-motion';

it('uses the actual warning and dash transition with unchanged baseline timings and speed',()=>{
 const b=new World().spawn('charger',100,0),seen=new Set<number>();
 let firstWarning=0,firstDash=0;
 for(let step=0;step<180;step++){
  const y=b.y;advanceBody(b,C.step,'running',0,()=>{throw Error('Charger must not shoot');});
  const frame=chargerFrame(b);seen.add(frame);
  if(frame===1&&!firstWarning)firstWarning=b.age;
  if(frame===2&&!firstDash)firstDash=b.age;
  if(frame===1){expect(b.warning).toBeGreaterThan(0);expect(b.speed).toBe(170);}
  if(frame===2){expect(b.warning).toBe(0);expect(b.speed).toBe(380);expect(b.y-y).toBeCloseTo(380/60);}
 }
 expect(seen).toEqual(new Set([0,1,2]));
 expect(firstWarning).toBeGreaterThanOrEqual(1.8);expect(firstWarning).toBeLessThanOrEqual(1.8+C.step+1e-9);
 expect(firstDash).toBeGreaterThanOrEqual(2.6);expect(firstDash).toBeLessThanOrEqual(2.6+C.step+1e-9);
});
it('does not confuse later-round cruise speed with a dash, or elapsed wall time with actual state',()=>{
 for(let speed=170;speed<=272;speed+=17)expect(chargerFrame({speed,warning:0})).toBe(0);
 expect(chargerFrame({speed:272,warning:.2})).toBe(1);
 const state={speed:170,warning:.4};for(let i=0;i<120;i++)expect(chargerFrame(state)).toBe(1);
 expect(state).toEqual({speed:170,warning:.4});
});
