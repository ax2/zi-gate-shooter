import{flightCanvas}from'./helpers/flight-canvas';
import{bankUpgrade}from'./helpers/flight-runtime-driver';
import {it,expect} from 'vitest';
import {FlightRuntime} from '../src/flight/runtime';
import {flightTarget,flightChoice} from './helpers/flight-driver';
import type {CanvasControl} from '../src/game/canvas-runtime';

async function setup(){
 let clock=0,next=(_time:number)=>{},controls:readonly CanvasControl[]=[],texts:string[]=[];
 const ctx=flightCanvas(texts);
 const r=new FlightRuntime({canvas:{width:390,height:693,getContext:()=>ctx}as unknown as HTMLCanvasElement,image:async()=>({width:768,height:256})as HTMLImageElement,controls:c=>controls=c,sound(){},now:()=>clock,frame:f=>next=f,readBest:()=>0,writeBest(){},seed:()=>1337});r.resize(390,693,1);await r.load();r.draw();
 const frame=()=>{clock+=1000/60;next(clock);bankUpgrade(r);};
 return {r,get controls(){return controls;},get texts(){return texts;},advance(n:number){for(let i=0;i<n;i++)frame();},earn(required=3){r.activate('start:split');let target={x:360,y:1040};for(let i=0;i<3600&&(!r.world.assembly.can('bounce')||r.world.assembly.inventory.alloy<required)&&r.mode==='playing';i++){if(i%6===0)target=flightTarget(r.world);const s=r.diagnostics().viewport.scale;r.touchStart(1,0,0);r.touchMove(1,(target.x-r.world.player.x)*s,(target.y-r.world.player.y)*s);frame();}expect(r.world.assembly.can('bounce')).toBe(true);expect(r.world.assembly.inventory.alloy).toBeGreaterThanOrEqual(required);}};
}
const state=(r:FlightRuntime)=>JSON.stringify(r.world,(_key,value)=>value instanceof Set?[...value]:value instanceof Map?[...value]:value);
it('earned preview is read-only across tabs, weak effects and frames; confirming spends once and keeps old guns',async()=>{
 const h=await setup(),r=h.r;h.earn();r.activate('tree');r.activate('select:bounce');const before=state(r),alloy=r.world.assembly.inventory.alloy;
 expect(r.activate('rig-preview')).toBe(true);expect(r.mode).toBe('rig');expect(h.controls.some(c=>c.action==='rig-assemble')).toBe(true);expect(h.controls.some(c=>c.action==='assemble')).toBe(false);
 for(const type of[0,1,2])expect(r.activate('rig-family:'+type)).toBe(true);expect(r.activate('rig-family:9')).toBe(false);r.activate('weak');h.advance(120);expect(state(r)).toBe(before);
 expect(r.activate('rig-assemble')).toBe(true);expect(r.mode).toBe('tree');expect(r.world.assembly.inventory.alloy).toBe(alloy-3);expect(r.world.assembly.has('bounce')).toBe(true);expect(r.world.assembly.has('split')).toBe(true);const installed=state(r);expect(r.activate('rig-assemble')).toBe(false);expect(state(r)).toBe(installed);expect(r.diagnostics().upgrade?.id).toBe('bounce');expect(r.diagnostics().upgrade?.receipt).toContain('跳击60%');
});
it('future paths and empty wallets show no confirm and cannot bypass predecessors or generate upgrade feedback',async()=>{
 const h=await setup(),r=h.r;r.activate('start:split');r.activate('tree');r.activate('select:sun');const before=state(r),last=r.diagnostics().upgrade;
 r.activate('rig-preview');expect(h.texts.some(t=>t.startsWith('完整路径预览 · 需'))).toBe(true);expect(h.controls.some(c=>c.action==='rig-assemble')).toBe(false);expect(r.activate('rig-assemble')).toBe(false);expect(state(r)).toBe(before);expect(r.diagnostics().upgrade).toEqual(last);r.activate('rig-path');expect(r.selected).toBe('sun');r.activate('select:bounce');r.activate('rig-preview');expect(r.activate('rig-assemble')).toBe(false);expect(state(r)).toBe(before);
});
it('current loadout is reachable from HUD and pause, freezes time, clears movement and returns to its source',async()=>{
 const h=await setup(),r=h.r;r.activate('start:coil');r.key('w',true);h.advance(5);expect(h.controls.some(c=>c.action==='rig')).toBe(true);r.activate('rig');const before=state(r);h.advance(120);expect(state(r)).toBe(before);expect(r.activate('rig-assemble')).toBe(false);r.key('Escape',true);expect(r.mode).toBe('playing');const y=r.world.player.y;h.advance(5);expect(r.world.player.y).toBeCloseTo(y);r.activate('pause');r.activate('rig');r.activate('rig-tree');expect(r.mode).toBe('tree');r.activate('close-tree');expect(r.mode).toBe('paused');r.activate('rig');r.activate('close-rig');expect(r.mode).toBe('paused');
});
it('result loadout is read-only and a fresh run replaces all old upgrade receipt data',async()=>{
 const h=await setup(),r=h.r;r.activate('start:split');h.advance(2000);expect(r.mode).toBe('result');const before=state(r);expect(r.activate('rig')).toBe(true);expect(r.activate('rig-tree')).toBe(false);expect(r.activate('rig-assemble')).toBe(false);expect(h.controls.some(c=>c.action==='rig-tree')).toBe(false);h.advance(120);expect(state(r)).toBe(before);r.key('Escape',true);expect(r.mode).toBe('result');r.activate('start:laser');expect(r.diagnostics().upgrade?.id).toBe('laser');expect(r.diagnostics().upgrade?.count).toBe(1);expect(r.diagnostics().upgrade?.started).toBe(0);
});
it('calibration preview uses actual earned cost and confirms the displayed damage coefficient',async()=>{
 const h=await setup(),r=h.r;h.earn(4);r.activate('tree');r.activate('select:split');const before=state(r),alloy=r.world.assembly.inventory.alloy,damage=r.diagnostics().firepower.guns.damage;r.activate('rig-preview');expect(state(r)).toBe(before);expect(h.controls.some(c=>c.label==='确认精校')).toBe(true);expect(r.activate('rig-assemble')).toBe(true);expect(r.world.assembly.inventory.alloy).toBe(alloy-4);expect(r.diagnostics().firepower.guns.damage).toBeCloseTo(damage*1.2);expect(r.diagnostics().upgrade?.receipt).toContain('100% → 120%');expect(r.world.assembly.installed.size).toBe(1);
});
it('an earned terminal specialization blocks competing preview installation without mutating combat',async()=>{
 const h=await setup(),r=h.r;r.activate('start:coil');let target={x:360,y:1040};for(let f=0;f<180*60&&!r.world.assembly.has('tempest')&&r.mode==='playing';f++){
  if(f%6===0){const id=flightChoice(r.world,'electric');if(id){r.activate('tree');r.activate('select:'+id);r.activate('assemble');r.activate('close-tree');}target=flightTarget(r.world);}
  const s=r.diagnostics().viewport.scale;r.touchStart(1,0,0);r.touchMove(1,(target.x-r.world.player.x)*s,(target.y-r.world.player.y)*s);h.advance(1);
 }
 expect(r.world.assembly.keystone).toBe('tempest');r.activate('tree');r.activate('select:sun');const before=state(r);r.activate('rig-preview');expect(h.texts).toContain('本局已选择其他终极专精');expect(h.controls.some(c=>c.action==='rig-assemble')).toBe(false);expect(r.activate('rig-assemble')).toBe(false);expect(state(r)).toBe(before);
});
it('the advance picture page exposes all six routes and predecessor navigation returns to the real basic graph',async()=>{
 const h=await setup(),r=h.r;r.activate('start:coil');r.activate('tree');const before=state(r);expect(r.activate('tree-page:1')).toBe(true);expect(r.diagnostics().treePage).toBe(1);expect(h.controls.filter(c=>c.action.startsWith('select:'))).toHaveLength(9);expect(new Set(h.controls.map(c=>c.action)).size).toBe(h.controls.length);r.activate('select:reversefield');r.activate('rig-preview');expect(h.texts.some(t=>t.startsWith('完整路径预览'))).toBe(true);expect(r.activate('rig-assemble')).toBe(false);expect(state(r)).toBe(before);r.activate('close-rig');r.activate('parent:tempest');expect(r.diagnostics().treePage).toBe(0);expect(r.selected).toBe('tempest');expect(h.controls.filter(c=>c.action.startsWith('select:'))).toHaveLength(18);expect(state(r)).toBe(before);expect(r.activate('tree-page:5')).toBe(false);
});
