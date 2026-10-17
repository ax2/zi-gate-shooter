import {it,expect} from 'vitest';import {writeFileSync} from 'node:fs';import {CanvasRuntime} from '../src/game/canvas-runtime';import {defaults} from '../src/ui/storage';import {progressionTarget} from './helpers/progression-driver';
it('normal six-hundred-second Runtime play remains viable with retimed rewards across two battle orders',async()=>{
 const results=[];
 for(const plan of [0,1]){
  let clock=0,next=()=>{};const c=new Proxy({}, {get(_t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});return ()=>{};},set(){return true;}}),save=defaults();save.nextBattlePlan=plan;save.settings.sound=false;save.settings.shake=false;
  const r=new CanvasRuntime({canvas:{getContext:()=>c},width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}),read:()=>structuredClone(save),write(){},sound(){},silence(){},now:()=>clock,requestFrame:f=>next=f});await r.load();r.start();const seen=new Set(),guns=[],bolts=[],bulletIds=new Set();let aim=360;
  const action=a=>expect(r.activateControl(a),a).toBe(true);
  for(let f=0;f<600*60+200&&r.world.time<600-1e-8&&r.mode!=='result';f++){
   const w=r.world;
   if(r.mode==='choice'){const a=w.build.available(w.buildPoints),route=a.includes('optical')&&w.build.ranks.optical<3?'optical':a.includes('electric')&&(w.build.ranks.electric<3||w.build.refinements.electric<2)?'electric':a.find(t=>w.build.ranks[t]<3)??a[0];if(route)action('build:'+route);}
   if(r.mode==='branch')action('branch:'+(r.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):r.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':'ricochet'):w.canRefinePhoton()?'photon-reach':'relay'));
   if(r.mode==='boss-reward')action('boss-claim:research');
   for(const b of w.bodies)if(b.active&&b.forkshot&&!seen.has(b.id)){seen.add(b.id);guns.push({b,time:w.time,round:w.round});}
   if(f%6===0&&r.mode==='playing'){
    aim=progressionTarget(w);
    const scale=Math.min(390/720,844/1280),pad=(844-1280*scale)/2;r.cancelTouch();r.touchStart(739,w.player.x*scale,pad+900*scale);r.touchMove(739,aim*scale,pad+900*scale);
   }
   clock+=1000/60;next(clock);
   for(const p of w.bullets)if(p.hostile&&p.sourceId&&seen.has(p.sourceId)&&!bulletIds.has(p.id)){bulletIds.add(p.id);bolts.push({time:w.time,id:p.id,source:p.sourceId,x:p.x,y:p.y,vx:p.vx,vy:p.vy});}
  }
  const w=r.world;results.push({plan,time:w.time,hp:w.player.hp,round:w.round,preempt:w.lockPreemptWins,bait:w.lockBaitWins,guns:guns.map(g=>({id:g.b.id,time:g.time,round:g.round,shots:g.b.lockAcceptedShots??0,attempted:g.b.lockShots??0,passed:g.b.lockPassed??0,hp:g.b.hp,lockX:g.b.lockX,age:g.b.age})),bolts,peakBodies:w.peakBodies,peakBullets:w.peakBullets,fallbacks:w.fallbackCount,rendering:'mock Canvas; normal controls/actual World; automated full knowledge, not human difficulty or pixel evidence'});
 }
 writeFileSync('build/qa/Stage-196/runtime-runs.json',JSON.stringify(results,null,2));
 for(const r of results){expect(r.time).toBeCloseTo(600,5);expect(r.hp).toBeGreaterThan(0);expect(r.guns.length).toBeGreaterThan(0);expect(r.peakBodies).toBeLessThanOrEqual(32);}
 expect(results.every(r=>r.hp>0&&r.round>=7)).toBe(true);
},180000);
