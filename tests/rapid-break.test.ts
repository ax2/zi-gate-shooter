import {it,expect} from 'vitest';
import {RapidBreak,RAPID_BREAK} from '../src/core/rapid-break';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {runReport} from '../src/game/run-report';
it('pays threshold differences once and caps a single burst bonus at50',()=>{
 const r=new RapidBreak(),d=Array.from({length:14},()=>r.kill(1));
 expect(d).toEqual([0,0,10,0,0,15,0,0,25,0,0,0,0,0]);expect(r.totalBonus).toBe(50);expect(r.best).toBe(14);expect(r.chains).toBe(1);
});
it('uses a fixed inclusive first-kill window rather than sliding time',()=>{
 const r=new RapidBreak();r.kill(0);r.kill(.7);expect(r.kill(.8)).toBe(10);expect(r.kill(.81)).toBe(0);expect(r.kill(1.4)).toBe(0);expect(r.kill(1.61)).toBe(10);expect(r.totalBonus).toBe(20);expect(r.chains).toBe(2);expect(r.best).toBe(3);
});
it('does not keep the scoring window alive through its longer reading time',()=>{
 const r=new RapidBreak();r.kill(1);r.kill(1);r.kill(1);expect(r.readout(1.89)?.count).toBe(3);expect(r.readout(1.91)).toBeNull();r.kill(1.85);expect(r.totalBonus).toBe(10);expect(r.readout(1.85)?.count).toBe(3);
});
function ready(){const w=new World();Object.assign(w,{scheduled:[]});(w as any).shoot=()=>{};w.player.x=w.player.px=68;return w;}
function shot(w:World,x:number,y:number,id:number){w.bullets.push({id,x,y,px:x,py:y,vx:0,vy:0,damage:1e5,age:0,hostile:false,active:true,weaponKind:'pulse'});}
it('counts actual enemy deaths once, excluding gate, crate and repeated overkill bullets',()=>{
 const w=ready();for(const x of[240,360,480]){const b=w.spawn('drone',x,500);b.speed=0;shot(w,x,500,10000+x);shot(w,x,500,20000+x);}
 const crate=w.spawn('crate',600,500);crate.speed=0;shot(w,600,500,30000);const gate=w.spawn('gate',360,700);gate.speed=0;shot(w,360,700,30001);
 w.step(C.step,68);expect(w.kills).toBe(3);expect(w.cratesBroken).toBe(1);expect(w.rapidBreak.best).toBe(3);expect(w.rapidBreak.totalBonus).toBe(10);expect(w.score).toBe(3*C.enemies.drone.score+10);
 for(let i=0;i<60;i++)w.step(C.step,68);expect(w.rapidBreak.totalBonus).toBe(10);
});
it('does not treat boss kills or cleanup as a rapid-break candidate',()=>{
 const w=ready();w.phase='boss';const b=w.spawn('boss',360,C.bossY);b.hp=1;shot(w,360,b.y,40000);w.step(C.step,68);expect(w.rapidBreak.best).toBe(0);expect(w.rapidBreak.totalBonus).toBe(0);expect(w.kills).toBe(1);expect(w.score).toBe(C.enemies.boss.score);
});
it('reports bonus already included in score without mutating rewards; restart has no carryover',()=>{
 const w=ready();for(let i=0;i<9;i++)w.score+=w.rapidBreak.kill(1);const before=JSON.stringify(w);expect(runReport(w,[],[]).rapid).toBe('最高9连破 · 连破奖分 +50（已计总分）');expect(JSON.stringify(w)).toBe(before);expect(new World().rapidBreak).toEqual(new RapidBreak());expect(RAPID_BREAK.window).toBe(.8);
});
