import{it,expect}from'vitest';
import{createRenderFixture}from'./helpers/render-fixture';
import{CanvasRuntime,parseSave}from'../src/game/canvas-runtime';
import{battlePlans,battlePlansInfo,battleBrief,nextBattlePlan}from'../src/core/battle-plan';
import{World}from'../src/core/world';
const physical=(w:World)=>JSON.stringify(w,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
it.each(battlePlans)('selects plan %s through visible controls, saves and latches the next real run only',async plan=>{
 let saved:unknown;const f=createRenderFixture(false,undefined,s=>saved=structuredClone(s)),r=f.runtime;await r.load();f.tick();const initial=physical(r.world);
 expect(r.activateControl('battle-plan:'+plan)).toBe(false);expect(r.activateControl('battle-plan-menu')).toBe(true);
 for(let i=0;i<120;i++)f.tick();expect(physical(r.world)).toBe(initial);expect(r.activateControl('battle-plan:'+plan)).toBe(true);
 expect(r.save.nextBattlePlan).toBe(plan);expect(parseSave(saved).nextBattlePlan).toBe(plan);expect(physical(r.world)).toBe(initial);
 expect(r.back()).toBe('stay');f.tick();expect(r.mode).toBe('menu');expect(r.activateControl('start')).toBe(true);
 expect(r.world.battlePlan).toBe(plan);expect(physical(r.world)).toBe(physical(new World(1337,1,'scatter',plan)));
 expect(r.save.nextBattlePlan).toBe(nextBattlePlan(plan));expect(r.world.activeWeapons).toEqual(['pulse']);expect(r.world.growth.bonus).toBe(0);
 expect(r.activateControl('battle-plan-menu')).toBe(false);expect(r.activateControl('battle-plan:0')).toBe(false);expect(r.world.battlePlan).toBe(plan);
});
it.each([false,true])('shows three honest chapter previews in weak=%s with no battle mutation',async weak=>{
 const f=createRenderFixture(weak),r=f.runtime;await r.load();f.tick();const before=physical(r.world);r.activateControl('battle-plan-menu');f.tick();
 const text=f.calls.filter(c=>c.kind==='fillText').map(c=>String(c.args[0]));
 for(const plan of battlePlans){expect(text).toContain(battlePlansInfo[plan].name);expect(text).toContain('侧翼 · '+battleBrief(2,plan));expect(text).toContain('重装 · '+battleBrief(3,plan));}
 expect(text).toContain('首章教学相同 · 后续循环继续变阵');expect(text).toContain('下局自动轮换战况，也可再次预定');
 expect(physical(r.world)).toBe(before);expect(r.activateControl('start')).toBe(false);expect(r.activateControl('battle-plan-back')).toBe(true);expect(r.mode).toBe('menu');
});
it('keeps reservation and recipe controls in disjoint generous hit areas',async()=>{
 const f=createRenderFixture(),r=f.runtime;await r.load();f.tick();r.touchStart(19,504,810);r.touchEnd(19,504,810);expect(r.mode).toBe('battle-plan');f.tick();r.back();f.tick();
 r.touchStart(20,216,810);r.touchEnd(20,216,810);expect(r.mode).toBe('combos');
});
it('retains the chosen plan on actual reload and lets a later selection override the automatic suggestion',async()=>{
 let stored:unknown;const f=createRenderFixture(false,undefined,s=>stored=structuredClone(s));await f.runtime.load();f.tick();f.runtime.activateControl('battle-plan-menu');f.runtime.activateControl('battle-plan:2');
 let clock=0,next:FrameRequestCallback=()=>{};const context=new Proxy({},{get:(_target,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})as CanvasRenderingContext2D;
 const r=new CanvasRuntime({canvas:{getContext:()=>context}as unknown as HTMLCanvasElement,width:720,height:1280,dpr:1,menuBottom:0,image:async()=>({width:768,height:512})as HTMLImageElement,read:()=>parseSave(stored),write:s=>stored=structuredClone(s),sound(){},silence(){},now:()=>clock,requestFrame:cb=>next=cb});
 await r.load();clock+=17;next(clock);expect(r.save.nextBattlePlan).toBe(2);r.activateControl('battle-plan-menu');r.activateControl('battle-plan:1');r.activateControl('battle-plan-back');r.activateControl('start');expect(r.world.battlePlan).toBe(1);expect(r.save.nextBattlePlan).toBe(2);r.pause();expect(r.activateControl('battle-plan:0')).toBe(false);expect(r.world.battlePlan).toBe(1);expect(r.world.time).toBe(0);
});
