import {it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {existsSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CanvasRuntime} from '../src/game/canvas-runtime';
import {defaults} from '../src/ui/storage';
import {progressionTarget} from './helpers/progression-driver';
if(!existsSync('build/qa/Stage-212/baseline.mjs'))execFileSync(process.execPath,['tools/capture-stage212-baseline.mjs']);
const old=await import('../build/qa/Stage-212/baseline.mjs');
async function run(Runtime){
 let clock=0,next=()=>{},overflow=0,maxOverflow=0,draws=0;
 const hash=createHash('sha256'),effects=createHash('sha256'),save=defaults();save.openingWeapon='scatter';save.settings.sound=false;save.settings.shake=false;
 const c=new Proxy({}, {get(_t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});return (...a)=>{if(k==='drawImage'&&a[0]?.src==='assets/mounted-modules-v1.png'){
  draws++;const beyond=Math.max(0,-a[5],a[5]+a[7]-720);if(beyond>1e-8)overflow++;maxOverflow=Math.max(maxOverflow,beyond);
 }};},set(){return true;}});
 const r=new Runtime({canvas:{getContext:()=>c},width:390,height:844,dpr:1,menuBottom:0,image:async src=>({src,width:768,height:512}),read:()=>structuredClone(save),write(){},sound(){},silence(){},now:()=>clock,requestFrame:cb=>next=cb});
 await r.load();r.start();const drain=r.world.drainEffects.bind(r.world);r.world.drainEffects=()=>{const e=drain();effects.update(JSON.stringify(e));return e;};
 const action=a=>expect(r.activateControl(a),a).toBe(true);
 for(let f=0;f<600*60+200&&r.world.time<600-1e-8&&r.mode!=='result';f++){
  const w=r.world;
  if(r.mode==='choice'){const a=w.build.available(w.buildPoints),route=a.includes('ballistic')?'ballistic':a.includes('electric')?'electric':a[0];if(route)action('build:'+route);}
  if(r.mode==='branch')action('branch:'+(r.branchRoute==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'penetrator'):r.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):w.canRefinePhoton()?'photon-reach':'relay'));
  if(r.mode==='boss-reward')action('boss-claim:research');
  if(f%6===0&&r.mode==='playing'){
   const s=Math.min(390/720,844/1280),oy=(844-1280*s)/2;
   r.cancelTouch();r.touchStart(742,w.player.x*s,oy+900*s);r.touchMove(742,progressionTarget(w)*s,oy+900*s);
  }
  clock+=1000/60;next(clock);
  hash.update(JSON.stringify({mode:r.mode,world:w},(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v));
 }
 expect(r.world.time).toBeCloseTo(600,5);expect(r.world.activeWeapons).toHaveLength(5);expect(r.world.build.ammoFusion).toBe('fragment');
 return {time:r.world.time,hp:r.world.player.hp,score:r.world.score,weapons:r.world.activeWeapons,fusion:r.world.build.ammoFusion,draws,overflow,maxOverflow,worldHash:hash.digest('hex'),effectHash:effects.digest('hex')};
}
it('keeps a normal earned five-weapon dual-core run identical while bringing original module rectangles inside the screen',async()=>{
 const baseline=await run(old.CanvasRuntime),current=await run(CanvasRuntime);
 writeFileSync('build/qa/Stage-212/normal-comparison.json',JSON.stringify({baseline,current},null,2));
 expect(current.worldHash).toBe(baseline.worldHash);expect(current.effectHash).toBe(baseline.effectHash);
 expect(current.draws).toBe(baseline.draws);expect(current.draws).toBeGreaterThan(0);
 expect(baseline.overflow).toBeGreaterThan(0);expect(current.overflow).toBe(0);
},120000);
