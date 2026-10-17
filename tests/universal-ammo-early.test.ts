import{it,expect}from'vitest';import{writeFileSync}from'node:fs';import{World}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'./helpers/progression-driver';import{safeRoute}from'../src/core/reachability';
it('earning the second point through ordinary new equipment makes each new ammo interaction observable in the first minute',()=>{
 const rows=[];for(const [opening,branch,watch,metric]of [['pierce','fragment','pierce','splashHits'],['blast','penetrator','blast','pierces'],['blast','ricochet','pulse','ricochets']]as const){const w=new World(1337,1,opening);let aim=360,selected:number|undefined,first:number|undefined;
  for(let f=0;f<90*60&&w.player.hp>0;f++){const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a[0];if(r){const fork=r==='ballistic'&&w.build.ranks.ballistic===1;w.chooseBuild(r,fork?branch:undefined);if(fork)selected=w.time;}if(f%6===0)aim=progressionTarget(w,w.build.ranks.ballistic<2?undefined:opening);w.step(C.step,aim);w.drainEffects();if(selected!==undefined&&(w.ballisticReactions().find(r=>r.kind===watch)?.[metric]??0)>0){first=w.time;break;}}
  rows.push({opening,branch,watch,selected,first,hp:w.player.hp,weapons:w.activeWeapons,reactions:w.ballisticReactions()});
 }
 writeFileSync('build/qa/Stage-208/early-mechanics.json',JSON.stringify(rows,null,2));for(const row of rows){expect(row.selected).toBeLessThan(30);expect(row.first).toBeLessThan(40);expect(row.hp).toBe(3);}
});
for(const seed of [1,77,1337])for(const start of [68,360,652])it(`new first-chapter armour retains a complete no-kill route seed${seed} x${start}`,()=>{
 const w=new World(seed);w.player.x=w.player.px=start;const known=new Set<number>();let path:number[]=[],planned=-999;
 for(let f=0;f<100*60&&w.phase==='running';f++){const fresh=w.bodies.some(b=>b.active&&b.kind in C.enemies&&!known.has(b.id));for(const b of w.bodies)if(b.active&&b.kind in C.enemies)known.add(b.id);if(f-planned>=60||fresh){path=safeRoute(w.player.x,w.bodies,w.bullets,7,{phase:w.phase,phaseTime:w.phaseTime,reaction:f===0||fresh?.45:0})??[];expect(path.length,`t=${w.time}`).toBeGreaterThan(0);planned=f;}w.step(C.step,path[Math.floor((f-planned)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp,`t=${w.time}`).toBe(3);}
 writeFileSync(`build/qa/Stage-208/early-route-${seed}-${start}.json`,JSON.stringify({seed,start,hp:w.player.hp,kills:w.kills,phase:w.phase,time:w.time,peakBodies:w.peakBodies,peakBullets:w.peakBullets}));expect(w.kills).toBe(0);expect(w.phase).toBe('boss-entry');
},120000);
