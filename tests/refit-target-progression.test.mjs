import {it,expect} from 'vitest';import {writeFileSync} from 'node:fs';
import {CanvasRuntime} from '../src/game/canvas-runtime';import {defaults} from '../src/ui/storage';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('two real menu plans produce distinct future supply and earned upgrades without granting equipment',async()=>{
 const results=[];
 for(const focus of ['pulse','scatter']){
  let clock=0,next=()=>{};const text=[];const c=new Proxy({}, {get(_t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});return (...a)=>{if(k==='fillText')text.push(String(a[0]));};},set(){return true;}});
  const save=defaults();save.settings.sound=false;save.settings.shake=false;
  const r=new CanvasRuntime({canvas:{getContext:()=>c},width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}),read:()=>structuredClone(save),write(){},sound(){},silence(){},now:()=>clock,requestFrame:f=>next=f});await r.load();r.start();let selected=false,from,selectedAt=0,aim=360,last=0;const offers=[],claims=[],rows=new Set();
  const action=a=>expect(r.activateControl(a),a).toBe(true);
  for(let frame=0;frame<300*60+200&&r.world.time<300-1e-8&&r.mode!=='result';frame++){
   const w=r.world;
   if(!selected&&r.mode==='playing'&&w.time>20&&w.activeWeapons.includes(focus)){
    from={tier:w.weaponStage(focus),calibration:w.weaponCalibration(focus)};selectedAt=w.time;
    for(const a of ['pause','loadout','refit-plan','refit-focus:'+focus,'refit-plan-back','loadout-back','resume'])action(a);
    expect(w.time).toBe(selectedAt);selected=true;
   }
   if(r.mode==='choice'){const a=w.build.available(w.buildPoints),route=a.includes('optical')&&w.build.ranks.optical<3?'optical':a.includes('electric')&&(w.build.ranks.electric<3||w.build.refinements.electric<2)?'electric':a.find(t=>w.build.ranks[t]<3)??a[0];if(route)action('build:'+route);}
   if(r.mode==='branch')action('branch:'+(r.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):r.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':'ricochet'):w.canRefinePhoton()?'photon-reach':'relay'));
   if(r.mode==='boss-reward')action('boss-claim:research');
   if(frame%6===0&&r.mode==='playing'){aim=progressionTarget(w,selected?focus:undefined);const scale=Math.min(390/720,844/1280),pad=(844-1280*scale)/2;r.cancelTouch();r.touchStart(739,w.player.x*scale,pad+900*scale);r.touchMove(739,aim*scale,pad+900*scale);}
   clock+=1000/60;text.length=0;next(clock);
   for(const b of w.bodies)if(b.active&&b.kind==='crate'&&b.directedRefit&&!rows.has(b.row)){rows.add(b.row);expect(b.weaponKind).toBe(focus);offers.push({time:w.time,round:w.round,kind:b.weaponKind,stage:b.stage,row:b.row});}
   if(w.refitsClaimed>last){last=w.refitsClaimed;const p=w.lastEquipmentPickup;claims.push({time:w.time,kind:p.kind,refit:p.refit,row:p.row,tier:w.weaponStage(p.kind),calibration:w.weaponCalibration(p.kind)});}
  }
  const w=r.world;results.push({focus,selectedAt,from,time:w.time,round:w.round,hp:w.player.hp,offers,claims,weapons:w.activeWeapons,tiers:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponStage(k)])),calibrations:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponCalibration(k)])),rendering:'mock Canvas; normal controls and actual World, not pixel or human difficulty evidence'});
  expect(selected).toBe(true);expect(w.time).toBeCloseTo(300,5);expect(w.player.hp).toBeGreaterThan(0);expect(offers.length).toBeGreaterThanOrEqual(2);expect(claims.some(c=>c.kind===focus)).toBe(true);expect(w.weaponStage(focus)+w.weaponCalibration(focus)).toBeGreaterThan(from.tier+from.calibration);expect(w.activeWeapons).toContain('pulse');expect(w.activeWeapons).toContain('scatter');
 }
 writeFileSync('build/qa/Stage-194/targeted-runs.json',JSON.stringify(results,null,2));expect(results[0].offers[0].kind).not.toBe(results[1].offers[0].kind);
},180000);
