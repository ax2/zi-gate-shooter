import {it,expect} from 'vitest';
import {existsSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CanvasRuntime} from '../src/game/canvas-runtime';
import {defaults} from '../src/ui/storage';
import {C} from '../src/core/config';
import {progressionTarget} from './helpers/progression-driver';
if(!existsSync('build/qa/Stage-191/baseline.mjs'))execFileSync(process.execPath,['tools/capture-stage191-baseline.mjs']);
const {CanvasRuntime:Baseline}=await import('../build/qa/Stage-191/baseline.mjs');
const stringify=value=>JSON.stringify(value,(_k,v)=>v instanceof Map?[...v.entries()]:v instanceof Set?[...v.values()]:v);
it('normal rendered progression keeps the original simulation exact and actually displays new, tier and calibrated gains',async()=>{
 let clock=0;const slots=[];const save=defaults();save.settings.sound=false;save.settings.shake=false;
 for(const Runtime of [CanvasRuntime,Baseline]){
  const slot={text:[],next:()=>{}};
  const ctx=new Proxy({}, {get(_t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});return (...args)=>{if(k==='fillText')slot.text.push(String(args[0]));};},set(){return true;}});
  slot.runtime=new Runtime({canvas:{getContext:()=>ctx},width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}),read:()=>structuredClone(save),write(){},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{slot.next=cb;}});
  await slot.runtime.load();slot.runtime.start();slots.push(slot);
 }
 const r=slots[0].runtime,seen=new Set(),receipts=[],changes=[],pending=[];let aim=360,maxPending=0,framesUsed=0;
 const action=name=>{for(const s of slots)expect(s.runtime.activateControl(name),name).toBe(true);};
 for(let frame=0;frame<600*60+120&&r.world.time<600-1e-8&&r.world.phase!=='dead';frame++){
  framesUsed++;
  const w=r.world;
  if(r.mode==='choice'){
   const a=w.build.available(w.buildPoints),route=a.includes('optical')&&w.build.ranks.optical<3?'optical':a.includes('electric')&&(w.build.ranks.electric<3||w.build.refinements.electric<2)?'electric':a.find(t=>w.build.ranks[t]<3)??a[0];
   if(route)action('build:'+route);
  }
  if(r.mode==='branch')action('branch:'+(r.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):r.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':'ricochet'):w.canRefinePhoton()?'photon-reach':'relay'));
  if(r.mode==='boss-reward')action('boss-claim:'+(w.activeWeapons.includes('scatter')?'scatter':'research'));
  if(frame%6===0&&r.mode==='playing'){
   aim=progressionTarget(w);const scale=390/720,pad=(844-1280*scale)/2;
   for(const s of slots){const x=s.runtime.world.player.x;s.runtime.cancelTouch();s.runtime.touchStart(738,x*scale,pad+900*scale);s.runtime.touchMove(738,aim*scale,pad+900*scale);}
  }
  const before=w.activeWeapons.map(kind=>[kind,w.weaponStage(kind),w.weaponCalibration(kind)]);
  clock+=1000/60;for(const s of slots){s.text=[];s.next(clock);}
  expect(r.mode,`mode/${frame}`).toBe(slots[1].runtime.mode);
  expect(stringify(r.world),`physical/${frame}`).toBe(stringify(slots[1].runtime.world));
  const after=w.activeWeapons.map(kind=>[kind,w.weaponStage(kind),w.weaponCalibration(kind)]);
  for(const [kind,tier,calibration] of after){const old=before.find(v=>v[0]===kind);if(!old||old[1]!==tier||old[2]!==calibration){const item={kind,tier,calibration,time:w.time};changes.push(item);pending.push(item);}}
  if(frame%6===0){
   const d=r.diagnostics();maxPending=Math.max(maxPending,d.equipmentReceipts.length);const current=d.equipmentReceipt;
   if(current&&!current.hidden&&w.time<current.until){
    expect(slots[0].text).toContain(current.title);expect(slots[0].text).toContain(current.detail);
    const e=current.equipment,key=e.kind+':'+e.after.stage+':'+e.after.calibration;
    for(const change of pending)if(change.kind===e.kind&&change.tier<=e.after.stage&&change.calibration<=e.after.calibration&&!change.displayedAt)change.displayedAt=w.time;
    if(!seen.has(key)){seen.add(key);receipts.push({time:w.time,title:current.title,detail:current.detail,kind:e.kind,before:e.before,after:e.after});}
   }
  }
 }
 const unresolved=changes.filter(c=>!c.displayedAt),delays=changes.filter(c=>c.displayedAt).map(c=>c.displayedAt-c.time),result={seed:1337,opening:'scatter',seconds:r.world.time,hp:r.world.player.hp,round:r.world.round,callbackFrames:framesUsed,simulationSteps:Math.round(r.world.time/C.step),rendering:'mock Canvas; not pixel or performance evidence',physicalParity:true,maxPending,maxDisplayDelay:Math.max(...delays),receipts,changes,unresolved};
 writeFileSync('build/qa/Stage-191/normal-runtime.json',JSON.stringify(result,null,2));
 expect(r.world.time).toBeCloseTo(600,5);expect(r.world.player.hp).toBeGreaterThan(0);expect(maxPending).toBeLessThanOrEqual(5);
 expect(receipts.some(e=>!e.before)).toBe(true);expect(receipts.some(e=>e.before&&e.before.stage!==e.after.stage)).toBe(true);expect(receipts.some(e=>e.after.calibration>0)).toBe(true);
 expect(receipts.length).toBeGreaterThan(8);expect(unresolved.every(c=>r.world.time-c.time<30)).toBe(true);
},180000);
