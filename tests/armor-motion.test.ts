import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {advanceBody} from '../src/core/behavior';
import {C} from '../src/core/config';
import {armorFrame} from '../src/game/armor-motion';

it('tracks travel distance, gives actual warning priority and never advances an unchanged body',()=>{
 expect(armorFrame({age:0,speed:110,warning:0})).toBe(0);
 expect(armorFrame({age:15/110,speed:110,warning:0})).toBe(2);
 expect(armorFrame({age:29/110,speed:110,warning:0})).toBe(0);
 expect(armorFrame({age:15/176,speed:176,warning:0})).toBe(2);
 const state={age:.4,speed:110,warning:.6};
 for(let i=0;i<120;i++)expect(armorFrame(state)).toBe(1);
 expect(state).toEqual({age:.4,speed:110,warning:.6});
});

it('prepares for the unchanged real 0.6-second warning and returns to travel on the actual shot',()=>{
 const b=new World().spawn('armor',100,-100);let shots=0,warningAt=0,shotAt=0;
 for(let i=0;i<420;i++){
  const before=shots;
  advanceBody(b,C.step,'running',0,()=>{shots++;if(!shotAt)shotAt=b.age;});
  if(b.warning>0){if(!warningAt)warningAt=b.age;expect(armorFrame(b)).toBe(1);}
  if(shots>before){expect(b.warning).toBe(0);expect(armorFrame(b)).not.toBe(1);}
  if(b.y>=600)expect(b.warning).toBe(0);
 }
 expect(warningAt).toBeCloseTo(2.4);expect(shotAt).toBeCloseTo(3);
 expect(shotAt-warningAt).toBeCloseTo(.6);expect(shots).toBe(2);
});
