import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';import {enemyHealthScale} from '../src/core/difficulty';
for(const round of [7,8,9,10,11,12])for(const start of [68,360,652])for(const half of [false,true])it(`keeps mixed boss round ${round} x${start} ${half?'half-counter':'full'} escapable without kills`,()=>{
 const w=new World(1337,round);w.phase='boss';w.player.x=w.player.px=start;const boss=w.spawn('boss',360,C.bossY);boss.bossVariant=(round-1)%3;boss.attackCycle=[0,2,3][boss.bossVariant];if(half)boss.hp=boss.maxHp*.5;
 let path:number[]=[],planned=0,seen=0,emitted=0;const arrived=new Set<number>();
 for(let frame=0;frame<20*60;frame++){
  if(frame===0||frame-planned>=60||seen!==w.escortSpawns){const reaction=frame===0||seen!==w.escortSpawns?.45:0;const route=safeRoute(w.player.x,w.bodies,w.bullets,6,{phase:w.phase,phaseTime:w.phaseTime,reaction});expect(route,`t=${w.time}, phase=${w.phaseTime}`).not.toBeNull();path=route??[];planned=frame;seen=w.escortSpawns;}
  const ids=new Set(w.bullets.filter(b=>b.hostile).map(b=>b.id));w.step(C.step,path[Math.floor((frame-planned)/6)]??w.player.x);w.drainEffects();emitted+=w.bullets.filter(b=>b.hostile&&!ids.has(b.id)).length;for(const b of w.bullets)if(b.hostile&&b.y>=C.playerY-40)arrived.add(b.id);w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp,`t=${w.time}`).toBe(3);
 }
 expect(w.kills).toBe(0);expect(w.escortSpawns).toBe(2);expect(emitted).toBeGreaterThan(0);expect(arrived.size).toBeGreaterThan(0);expect(w.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);expect(w.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);
 mkdirSync('build/qa/Stage-171/routes',{recursive:true});writeFileSync(`build/qa/Stage-171/routes/${round}-${start}-${half}.json`,JSON.stringify({round,start,half,time:w.time,hp:w.player.hp,kills:w.kills,formation:w.bossFormation?.id,spawns:w.escortSpawns,emitted,arrived:arrived.size,counterVolleys:boss.counterVolleys??0,fallbacks:w.fallbackCount,peakBodies:w.peakBodies,peakBullets:w.peakBullets},null,2));
},60000);
it('preserves early boss durability and every ordinary enemy curve, using only fixed late round durability',()=>{
 for(let r=1;r<=6;r++){const d=r-1;expect(enemyHealthScale('boss',r)).toBeCloseTo(1+.6*d+.09*d*d);}
 for(let r=7;r<=18;r++){const d=r-1;expect(enemyHealthScale('boss',r)).toBeCloseTo((1+.6*d+.09*d*d)*(r-5));const a=new World(1337,r),b=new World(1337,r);b.growth.bonus=100;b.growth.mastery=100;expect(a.spawn('boss',360,C.bossY).maxHp).toBe(b.spawn('boss',360,C.bossY).maxHp);for(const kind of ['sniper','guard','armor','elite'] as const)expect(enemyHealthScale(kind,r)).toBeCloseTo(1+.4*d+.06*d*d);}
});
