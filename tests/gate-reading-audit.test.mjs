import {createHash} from 'node:crypto';import {CanvasRuntime as CurrentRuntime} from '../src/game/canvas-runtime';import {it,expect} from 'vitest';import {existsSync,writeFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {defaults} from '../src/ui/storage';import {progressionTarget} from './helpers/progression-driver';
if(!existsSync('build/qa/Stage-197/baseline.mjs'))execFileSync(process.execPath,['tools/capture-stage197-baseline.mjs']);const {CanvasRuntime}=await import('../build/qa/Stage-197/baseline.mjs');
async function run(Runtime,title){
 const hash=createHash('sha256');
 let clock=0,next=()=>{};let text=[];const c=new Proxy({}, {get(_t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});return (...a)=>{if(k==='fillText')text.push({text:String(a[0]),x:a[1],y:a[2]});};},set(){return true;}}),save=defaults();save.settings.sound=false;save.settings.shake=false;
 const r=new Runtime({canvas:{getContext:()=>c},width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}),read:()=>structuredClone(save),write(){},sound(){},silence(){},now:()=>clock,requestFrame:f=>next=f});await r.load();r.start();const receipts=new Map();let aim=360;
 const action=a=>expect(r.activateControl(a),a).toBe(true);
 for(let f=0;f<600*60+200&&r.world.time<600-1e-8&&r.mode!=='result';f++){
  const w=r.world;if(r.mode==='choice'){const a=w.build.available(w.buildPoints),route=a.includes('optical')&&w.build.ranks.optical<3?'optical':a.includes('electric')&&(w.build.ranks.electric<3||w.build.refinements.electric<2)?'electric':a.find(t=>w.build.ranks[t]<3)??a[0];if(route)action('build:'+route);}
  if(r.mode==='branch')action('branch:'+(r.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):r.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':'ricochet'):w.canRefinePhoton()?'photon-reach':'relay'));
  if(r.mode==='boss-reward')action('boss-claim:research');if(f%6===0&&r.mode==='playing'){aim=progressionTarget(w);const s=Math.min(390/720,844/1280),py=(844-1280*s)/2;r.cancelTouch();r.touchStart(739,w.player.x*s,py+900*s);r.touchMove(739,aim*s,py+900*s);}
  const before=w.time;clock+=1000/60;text=[];next(clock);const dt=w.time-before;hash.update(JSON.stringify({mode:r.mode,world:w},(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v));
  for(const receipt of r.gateFeedback.receipts){if(!receipts.has(receipt))receipts.set(receipt,{claimedAt:w.time,x:receipt.x,lines:receipt.lines,visible:0,hidden:0,lastAt:w.time});const record=receipts.get(receipt),height=receipt.lines.length>1?116:84,y=receipt.y-receipt.age*18;
   const printed=r.mode==='playing'&&text.some(t=>t.text===title&&Math.abs(t.x-receipt.x)<.01&&Math.abs(t.y-(y-height/2+20))<.01)&&receipt.lines.every((line,i)=>text.some(t=>t.text===line&&Math.abs(t.x-receipt.x)<.01&&Math.abs(t.y-(y-height/2+52+i*32))<.01));record[printed?'visible':'hidden']+=dt;record.lastAt=w.time;
  }
 }
 const data=[...receipts.values()];expect(r.world.time).toBeCloseTo(600,5);expect(data.length).toBeGreaterThan(10);return {time:r.world.time,hp:r.world.player.hp,round:r.world.round,worldHash:hash.digest('hex'),receipts:data,neverPrinted:data.filter(r=>r.visible<.01).length,underHalfSecond:data.filter(r=>r.visible<.5).length,method:'playing-only mock Canvas title/value calls; not actual pixels, attention or human reading evidence'};
}
it('compares 600 seconds of actual gate reading with identical full World and modes',async()=>{
 const baseline=await run(CanvasRuntime,'已领取'),candidate=await run(CurrentRuntime,'穿门已领取');writeFileSync('build/qa/Stage-197/reading-comparison.json',JSON.stringify({baseline,candidate},null,2));expect(candidate.worldHash).toBe(baseline.worldHash);expect(candidate.receipts.map(r=>[r.claimedAt,r.lines])).toEqual(baseline.receipts.map(r=>[r.claimedAt,r.lines]));expect(candidate.neverPrinted).toBeLessThan(baseline.neverPrinted);expect(candidate.underHalfSecond).toBeLessThan(baseline.underHalfSecond);
},120000);
