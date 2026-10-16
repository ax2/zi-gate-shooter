import {it,expect} from 'vitest';
import {World} from '../src/core/world';import {timeline} from '../src/core/director';import {C} from '../src/core/config';import {advanceBody} from '../src/core/behavior';import {REBOUND,reboundState} from '../src/core/rebound-charger';import {dangerTimeline,safeRoute} from '../src/core/reachability';
function setup(x=140){const w=new World(1337,2),b=w.spawn('charger',x,360);b.pattern='rebound';b.lane=x<360?480:240;return {w,b};}
it('replaces exactly one already-visible charger per later chapter without changing roster stats or the first chapter',()=>{
 expect(timeline(1,1337).some(s=>s.pattern==='rebound')).toBe(false);
 for(let round=2;round<=12;round++)for(const seed of [1,713,1337]){const list=timeline(round,seed),variants=list.filter(s=>s.pattern==='rebound');expect(variants).toHaveLength(1);expect(variants[0]).toMatchObject({kind:'charger',drop:true,dropY:360});}
 expect(setup().b.maxHp).toBe(new World(1337,2).spawn('charger',140,360).maxHp);
});
it('has two full local charge windows and continuous mirrored movement with a real reversal',()=>{
 const traces=[];
 for(const x of [140,580]){const {b}=setup(x),trace=[],warnings=[];let wasWarning=false,shots=0;
 for(let i=0;i<200;i++){const px=b.x,py=b.y;advanceBody(b,C.step,'running',0,()=>shots++);const state=reboundState(b);if(b.warning>0&&!wasWarning)warnings.push({age:b.age,phase:state.phase});wasWarning=b.warning>0;expect(Math.abs(b.x-px)).toBeLessThanOrEqual(REBOUND.lateralSpeed*C.step+1e-8);expect(b.y-py).toBeCloseTo(state.speed*C.step);trace.push({age:b.age,x:b.x,y:b.y,phase:state.phase,warning:b.warning});}
 expect(shots).toBe(0);expect(warnings.map(w=>w.phase)).toEqual(['charge','turn']);expect(warnings[1].age-warnings[0].age).toBeCloseTo(REBOUND.firstWarning+REBOUND.firstDash);
 const dash=trace.find(t=>t.phase==='inward')!,turn=trace.find(t=>t.phase==='turn')!,back=trace.find(t=>t.phase==='return')!;expect(dash.age-warnings[0].age).toBeCloseTo(REBOUND.firstWarning);expect(back.age-warnings[1].age).toBeCloseTo(REBOUND.turnWarning);expect(Math.sign(turn.x-x)).toBe(x<360?1:-1);expect(trace.at(-1)!.x).toBeCloseTo(x);traces.push(trace);
 }
 for(let i=0;i<traces[0].length;i++){expect(traces[0][i].x+traces[1][i].x).toBeCloseTo(720);expect(traces[0][i].y).toBeCloseTo(traces[1][i].y);}
});
it('shares exactly the same motion in forecast, freezes with no steps and stops after real death',()=>{
 const {w,b}=setup();const predicted=dangerTimeline([b],[],3.5,{phase:'running',phaseTime:0,reaction:.45});expect(predicted.some(s=>s.length)).toBe(true);const before=JSON.stringify(b);dangerTimeline([b],[],3.5);expect(JSON.stringify(b)).toBe(before);
 for(const start of [68,140,360,580,652])expect(safeRoute(start,[b],[],4,{phase:'running',reaction:.45})).not.toBeNull();
 b.hp=1;w.bullets=[{id:99999,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:100,age:0,active:true,hostile:false}];w.step(C.step,68);expect(b.active).toBe(false);expect(w.kills).toBe(1);const dead=JSON.stringify(b);advanceBody(b,C.step,'running',0,()=>{throw Error('unexpected projectile');});expect(JSON.stringify(b)).toBe(dead);
});
