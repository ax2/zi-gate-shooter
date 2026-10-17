import{it,expect}from'vitest';import{World}from'../src/core/world';import{C}from'../src/core/config';import{safeRoute}from'../src/core/reachability';import{writeFileSync}from'node:fs';
it('all boss teams and half-health cycles retain 450ms no-fire escape paths from three lanes',()=>{
 const results=[];for(const round of[1,2,3,4,5,6,8,9,10])for(const start of[68,360,652])for(const half of[false,true]){
  const w=new World(1337,round);w.phase='boss';w.player.x=w.player.px=start;(w as any).shoot=()=>{};const b=w.spawn('boss',360,C.bossY);b.bossVariant=(round-1)%3;b.attackCycle=[0,2,3][b.bossVariant!];if(half)b.hp=b.maxHp*.49;
  let path:number[]=[],planned=0,seen=0,failure:number|null=null;
  for(let f=0;f<1200;f++){
   if(f===0||f-planned>=60||seen!==w.escortSpawns){const route=safeRoute(w.player.x,w.bodies,w.bullets,6,{phase:w.phase,phaseTime:w.phaseTime,reaction:f===0||seen!==w.escortSpawns?.45:0});if(!route){failure=w.time;break;}path=route;planned=f;seen=w.escortSpawns;}
   w.step(C.step,path[Math.floor((f-planned)/6)]??w.player.x);w.drainEffects();
  }
  results.push({round,start,half,failure,time:w.time,hp:w.player.hp,kills:w.kills,damage:w.damageTaken,escorts:w.escortSpawns,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 writeFileSync('build/qa/Stage-220/boss-routes.json',JSON.stringify(results,null,2));for(const r of results){const label=JSON.stringify(r);expect(r.failure,label).toBeNull();expect(r.time,label).toBeCloseTo(20);expect(r.hp,label).toBe(3);expect(r.kills,label).toBe(0);expect(r.damage,label).toBe(0);expect(r.escorts,label).toBe(r.round===1?0:2);expect(r.peakBodies,label).toBeLessThanOrEqual(3);expect(r.peakBullets,label).toBeLessThanOrEqual(48);}
},180000);
it('locks each admitted escort once, counts accepted arrivals, and preserves launched shots after destruction',()=>{
 const w=new World(1337,2);w.phase='boss';w.player.x=w.player.px=360;(w as any).shoot=()=>{};w.spawn('boss',360,C.bossY);
 for(let i=0;i<14;i++)w.step(C.step,360);const gun=w.activeEscorts[0]!;expect(gun.pattern).toBe('lockshot');const locked=gun.lockX;expect(locked).toBe(360);expect(w.lockshotSpawns).toBe(1);
 for(let i=0;i<180&&(gun.lockAcceptedShots??0)<3;i++)w.step(C.step,68);expect(gun.lockX).toBe(locked);const bolts=w.bullets.filter(b=>b.hostile&&b.sourceId===gun.id);expect(bolts.length).toBeGreaterThan(0);expect(gun.lockAcceptedShots).toBe(3);
 const id=bolts[0].id;gun.hp=0;gun.active=false;w.step(C.step,68);expect(w.bullets.some(b=>b.id===id)).toBe(true);
});

it('uses a fixed boss-only ramp, preserves the solo boss and never reads player power',()=>{
 for(let round=1;round<=15;round++){
  const a=new World(1337,round),b=new World(1337,round);b.growth.bonus=999;b.growth.mastery=99;b.growth.stage=3;
  const hp=a.spawn('boss',360).maxHp;expect(b.spawn('boss',360).maxHp).toBe(hp);const depth=round-1,old=2250*(1+.6*depth+.09*depth*depth)*(1+Math.max(0,depth-5));expect(hp/old).toBeCloseTo([1,2,3,4,4,4,3,2,1.4][round-1]??1);
 }
});
