import {it,expect} from 'vitest';import {timeline,SWARM} from '../src/core/director';import {World,type Bullet} from '../src/core/world';import {C} from '../src/core/config';
function bullet(x=360,y=360,kind:'pulse'|'arc'|'scatter'='pulse'):Bullet{return {id:99999,x,y,px:x,py:y,vx:0,vy:0,age:0,damage:100,active:true,hostile:false,weaponKind:kind,chainHops:kind==='arc'?5:0,splashRadius:kind==='scatter'?140:0,hitBodies:[],remainingTargets:2};}
it('keeps chapter one intact and authors finite dense, alternating and column packs inside open outer roads',()=>{
 expect(timeline(1,1337).filter(s=>s.drop)).toHaveLength(0);
 for(const [round,count] of [[2,11],[3,6],[4,15]] as const){for(const seed of [1,77,1337]){const list=timeline(round,seed),drops=list.filter(s=>s.drop);expect(drops).toHaveLength(count);expect(drops.filter(s=>s.dropNotice)).toHaveLength(1);expect(drops.every(s=>s.kind==='drone'&&s.x>=180&&s.x<=540&&s.at>=32&&s.at<=36.4)).toBe(true);expect(list.filter(s=>s.kind==='armory')).toHaveLength(2);expect(list.filter(s=>s.kind==='gates')).toHaveLength(4);}}
});
it.each(['pulse','arc','scatter'] as const)('%s is absorbed without damage, derived procs or rewards during visible arrival protection',kind=>{
 const w=new World();w.player.x=68;const b=w.spawn('drone',360,360),near=w.spawn('drone',420,360);b.speed=near.speed=0;b.dropGrace=SWARM.grace;near.hp=1000;w.bullets=[bullet(360,360,kind)];w.step(C.step,68);
 expect(b.hp).toBe(12);expect(near.hp).toBe(1000);expect(w.bullets.some(b=>b.id===99999)).toBe(false);expect(w.kills).toBe(0);expect(w.arcLinks).toBe(0);expect(w.scatterBursts).toBe(0);expect(w.scatterSplashHits).toBe(0);expect(w.growth.energy).toBe(0);expect(w.drainEffects().some(e=>e.type==='drop-impact')).toBe(true);
 for(let i=0;i<28;i++)w.step(C.step,68);w.bullets=[bullet()];w.step(C.step,68);expect(w.kills).toBe(1);expect(w.dropKills).toBe(1);expect(w.score).toBe(C.enemies.drone.score);
});
it('a real laser stops at arrival shielding and cannot pass through it or apply burning',()=>{
 const w=new World();w.player.x=360;w.growth.mastery=2;w.chooseBuild('optical');w.chooseBuild('optical','burn');const b=w.spawn('drone',360,600),rear=w.spawn('armor',360,400);b.dropGrace=.45;b.speed=rear.speed=0;rear.hp=1000;
 w.step(C.step,360);expect(b.hp).toBe(12);expect(b.burnTicks).toBeUndefined();expect(rear.hp).toBe(1000);expect(w.burnHits).toBe(0);
});
it('actual secondary arc damage counts once and does not count protected enemies as injured',()=>{
 const w=new World();w.player.x=68;const a=w.spawn('armor',360,360),b=w.spawn('armor',420,360),c=w.spawn('armor',480,360);a.speed=b.speed=c.speed=0;a.hp=b.hp=c.hp=1000;c.dropGrace=.45;const shot=bullet(360,360,'arc');shot.damage=10;w.bullets=[shot];w.step(C.step,68);
 expect(w.arcLinks).toBe(1);expect(b.hp).toBe(993.5);expect(c.hp).toBe(1000);expect(new World().arcLinks).toBe(0);
});
