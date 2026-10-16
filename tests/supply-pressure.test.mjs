import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';
class Traced extends World {late=[];crates=[];spawn(...args){const b=super.spawn(...args);if(this.roundTime>=47&&this.roundTime<=51){if(b.kind==='crate')this.crates.push({b,at:this.roundTime});if(b.kind==='sniper'||b.kind==='guard')this.late.push({b,at:this.roundTime});}return b;}}
it('records actual late-gun arrivals against the real supply crossing without kills or immunity',()=>{
 const records=[];const label=process.env.SUPPLY_AUDIT_LABEL??'after',after=label==='after';
 for(const round of [4,6,8])for(const start of after?[68,360,652]:[360]){
  const w=new Traced(1337,round);w.player.x=w.player.px=start;let path=[],planAt=0,seen=0;const shots=new Set(),arrivals=[],crossings=[];
  for(let frame=0;frame<100*60&&w.phase==='running';frame++){
   if(frame===0||frame-planAt>=60||seen!==w.dropSpawns){const reaction=frame===0||seen!==w.dropSpawns?.45:0;const route=safeRoute(w.player.x,w.bodies,w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction});expect(route,`R${round} x${start} t${w.time}`).not.toBeNull();path=route??[];planAt=frame;seen=w.dropSpawns;}
   w.step(C.step,path[Math.floor((frame-planAt)/6)]??w.player.x);w.drainEffects();
   for(const t of w.late)if(t.b.age>0)for(const bullet of w.bullets)if(bullet.hostile&&bullet.age<=C.step+1e-8&&Math.abs(bullet.px-t.b.x)<1e-6){const ys=t.b.kind==='sniper'?[0,45,90].map(d=>t.b.y+58-d):[t.b.y+t.b.height/2];if(ys.some(y=>Math.abs(y-bullet.py)<1e-6))shots.add(bullet.id);}
   for(const b of w.bullets)if(shots.has(b.id)&&b.py<C.playerY&&b.y>=C.playerY)arrivals.push({time:w.roundTime,x:b.x});
   for(const t of w.crates)if(t.b.py<C.playerY&&t.b.y>=C.playerY&&!crossings.some(c=>c.id===t.b.id))crossings.push({id:t.b.id,time:w.roundTime,x:t.b.x,row:t.b.row});
   w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp,`R${round} x${start} t${w.time}`).toBe(3);expect(w.kills).toBe(0);
  }
  const guns=w.late.filter(t=>t.b.age>0).map(t=>({kind:t.b.kind,pattern:t.b.pattern??null,at:t.at,age:t.b.age,x:t.b.x,maxHp:t.b.maxHp}));records.push({round,start,time:w.time,hp:w.player.hp,phase:w.phase,dropSpawns:w.dropSpawns,guns,arrivals,crossings});
  expect(w.phase).toBe('boss-entry');expect(crossings.length).toBeGreaterThanOrEqual(2);if(after){expect(guns.some(g=>g.pattern==='convoy')).toBe(true);expect(arrivals.some(a=>a.time<=crossings[0].time&&a.time>=crossings[0].time-1.2)).toBe(true);}
 }
 const dir='build/qa/Stage-167';mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/${label}-no-kill.json`,JSON.stringify(records,null,2));
},120000);
