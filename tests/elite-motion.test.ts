import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {advanceBody} from '../src/core/behavior';
import {C} from '../src/core/config';
import {eliteFrame} from '../src/game/elite-motion';

it('tracks travel distance, gives actual warning priority and never advances an unchanged body',()=>{
 expect(eliteFrame({age:0,speed:90,warning:0})).toBe(0);
 expect(eliteFrame({age:49/90,speed:90,warning:0})).toBe(2);
 expect(eliteFrame({age:97/90,speed:90,warning:0})).toBe(0);
 expect(eliteFrame({age:49/144,speed:144,warning:0})).toBe(2);
 const state={age:.4,speed:90,warning:.6};
 for(let i=0;i<120;i++)expect(eliteFrame(state)).toBe(1);
 expect(state).toEqual({age:.4,speed:90,warning:.6});
});

it('prepares for the unchanged real 0.6-second warning and returns to travel on the actual shot',()=>{
 const b=new World().spawn('elite',100,-100);let shots=0,warningAt=0,shotAt=0,passedCutoff=false;
 const positions:number[][]=[];
 for(let i=0;i<480;i++){
  const before=shots;
  advanceBody(b,C.step,'running',0,(x,y)=>{shots++;positions.push([x,y]);if(!shotAt)shotAt=b.age;});
  if(b.warning>0){if(!warningAt)warningAt=b.age;expect(eliteFrame(b)).toBe(1);}
  if(shots>before){expect(b.warning).toBe(0);expect(eliteFrame(b)).not.toBe(1);}
  if(b.y>=600){passedCutoff=true;expect(b.warning).toBe(0);}
 }
 expect(warningAt).toBeCloseTo(2.4);expect(shotAt).toBeCloseTo(3);
 expect(shotAt-warningAt).toBeCloseTo(.6);expect(shots).toBe(2);
 expect(passedCutoff).toBe(true);expect(positions).toHaveLength(2);
 expect(positions[0][0]).toBe(100);expect(positions[0][1]).toBeCloseTo(238);
 expect(positions[1][0]).toBe(100);expect(positions[1][1]).toBeCloseTo(508);
});
