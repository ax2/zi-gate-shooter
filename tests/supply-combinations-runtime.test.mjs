import {supplyCombinations,supplyCombinationLabel} from '../src/game/supply-combinations';
import {createHash} from 'node:crypto';import {CanvasRuntime as CurrentRuntime} from '../src/game/canvas-runtime';import {it,expect} from 'vitest';import {existsSync,writeFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {defaults} from '../src/ui/storage';import {progressionTarget} from './helpers/progression-driver';
if(!existsSync('build/qa/Stage-199/baseline.mjs'))execFileSync(process.execPath,['tools/capture-stage199-baseline.mjs']);const {CanvasRuntime}=await import('../build/qa/Stage-199/baseline.mjs');
async function run(Runtime,title){
 const hash=createHash('sha256');
 let clock=0,next=()=>{};let text=[];const c=new Proxy({}, {get(_t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});return (...a)=>{if(k==='fillText')text.push({text:String(a[0]),x:a[1],y:a[2]});};},set(){return true;}}),save=defaults();save.openingWeapon='pierce';save.settings.sound=false;save.settings.shake=false;
 const r=new Runtime({canvas:{getContext:()=>c},width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}),read:()=>structuredClone(save),write(){},sound(){},silence(){},now:()=>clock,requestFrame:f=>next=f});await r.load();r.start();const printed=[];let comboRead=0;let firstFracture=null;let aim=360;
 const action=a=>expect(r.activateControl(a),a).toBe(true);
 for(let f=0;f<600*60+200&&r.world.time<600-1e-8&&r.mode!=='result';f++){
  const w=r.world;if(r.mode==='choice'){const a=w.build.available(w.buildPoints),route=a.includes('optical')&&w.build.ranks.optical<3?'optical':a.includes('electric')&&(w.build.ranks.electric<3||w.build.refinements.electric<2)?'electric':a.find(t=>w.build.ranks[t]<3)??a[0];if(route)action('build:'+route);}
  if(r.mode==='branch')action('branch:'+(r.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):r.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':'ricochet'):w.canRefinePhoton()?'photon-reach':'relay'));
  if(r.mode==='boss-reward')action('boss-claim:research');if(f%6===0&&r.mode==='playing'){aim=progressionTarget(w,'blast');const s=Math.min(390/720,844/1280),py=(844-1280*s)/2;r.cancelTouch();r.touchStart(739,w.player.x*s,py+900*s);r.touchMove(739,aim*s,py+900*s);}
  clock+=1000/60;text=[];next(clock);if(r.mode==='playing'&&text.some(t=>t.text==='组合完成 · 裂甲爆破'))comboRead+=1/60;hash.update(JSON.stringify({mode:r.mode,world:w},(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v));
  for(const b of w.bodies)if(b.active&&(b.kind==='crate'||b.kind==='pickup')){
   const combinations=supplyCombinations(w,b);if(combinations.length&&text.some(t=>t.text===supplyCombinationLabel(combinations)))printed.push({time:w.time,id:b.id,kind:b.kind,weapon:b.weaponKind,combinations:combinations.map(c=>c.id)});
  }
  if(!firstFracture&&w.fractureUnlocked())firstFracture={time:w.time,pickups:w.pickups,weapons:w.activeWeapons};

 }
 expect(r.world.time).toBeCloseTo(600,5);return {time:r.world.time,hp:r.world.player.hp,round:r.world.round,worldHash:hash.digest('hex'),comboRead,firstFracture,printed:printed.filter((r,i,a)=>i===0||a[i-1].id!==r.id||a[i-1].kind!==r.kind)};
}
it('keeps full combat and actual rewards identical while showing a first-minute combination choice',async()=>{
 const baseline=await run(CanvasRuntime,'baseline'),candidate=await run(CurrentRuntime,'current');writeFileSync('build/qa/Stage-199/normal-comparison.json',JSON.stringify({baseline,candidate},null,2));expect(candidate.worldHash).toBe(baseline.worldHash);expect(candidate.firstFracture).toEqual(baseline.firstFracture);expect(candidate.firstFracture.time).toBeLessThan(60);expect(candidate.printed.some(p=>p.kind==='crate'&&p.time<30&&p.combinations.includes('fracture'))).toBe(true);expect(candidate.printed.some(p=>p.kind==='pickup'&&p.time<candidate.firstFracture.time)).toBe(true);expect(baseline.printed).toEqual([]);expect(candidate.comboRead).toBeGreaterThan(2);expect(candidate.comboRead).toBeGreaterThan(baseline.comboRead);
},120000);
