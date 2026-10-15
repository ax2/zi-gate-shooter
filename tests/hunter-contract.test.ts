import {it,expect} from 'vitest';
import {World,type Body} from '../src/core/world';
import {advanceBody} from '../src/core/behavior';
import {Contract} from '../src/core/contracts';
import {C} from '../src/core/config';
function step(w:World,n=1){for(let i=0;i<n;i++)w.step(C.step,68);}
function prepare(){const w=new World();const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';w.step(C.step,360);w.drainEffects();return w;}
let id=100000;
function hit(w:World,b:Body){w.bullets=[];const y=Math.max(C.playerShotTop+1,b.y+b.height*.4);w.bullets.push({id:id++,x:b.x,y,px:b.x,py:y,vx:0,vy:0,damage:1000,age:0,active:true,hostile:false});step(w);return w.drainEffects();}
function target(w:World){return w.bodies.find(b=>b.active&&b.bountyRound===w.round)!;}
function secondTarget(w:World){for(let i=0;i<480&&!target(w);i++)step(w);step(w,60);return target(w);}
it('shows a tier prerequisite and accepts only a legal same-round choice',()=>{
 const low=new World();expect(low.canAcceptContract('precision')).toBe(true);expect(low.canAcceptContract('hunter')).toBe(false);expect(low.acceptContract('hunter')).toBe(false);
 const w=prepare();expect(w.canAcceptContract('hunter')).toBe(true);expect(w.acceptContract('hunter')).toBe(true);expect(w.acceptContract('precision')).toBe(false);
});
it('deduplicates only current bounty identities and requires marked kills rather than general kill totals',()=>{
 const c=new Contract('hunter',1,0,1,0);expect(c.targetKilled(1,2)).toBe(false);expect(c.targetKilled(1,1)).toBe(true);expect(c.targetKilled(1,1)).toBe(false);
 expect(c.update(1,1000,5,10,true)).toBe(false);expect(c.status).toBe('active');expect(c.targetKills).toBe(1);
 expect(c.targetKilled(2,1)).toBe(true);expect(c.update(.01,1000,5,10,true)).toBe(true);expect(c.status).toBe('won');expect(c.elapsed).toBeLessThan(30);
 expect(c.targetKilled(3,1)).toBe(false);expect(c.update(1,1000,5,10,true)).toBe(false);
 const ordinary=new Contract('hunter',1,0,1,0);ordinary.update(30,999,1,0,true);expect(ordinary.status).toBe('failed');
});
it('spawns two staggered marked elites, succeeds immediately on actual second death and settles one reward',()=>{
 const w=prepare();w.acceptContract('hunter');step(w,60);const first=target(w);expect(first.kind).toBe('elite');expect(w.contract!.reinforcements).toBe(1);
 hit(w,first);expect(w.contract!.targetKills).toBe(1);expect(w.contractReward).toBeUndefined();
 const second=secondTarget(w);expect(second.kind).toBe('elite');expect(w.contract!.reinforcements).toBe(2);hit(w,second);
 expect(w.contract!.targetKills).toBe(2);expect(w.contract!.status).toBe('won');expect(w.contract!.elapsed).toBeLessThan(30);
 expect(w.contractReward?.charge).toBe(150);expect(w.growth.energy).toBe(30);
 const before=w.profileFor('pulse');expect(w.claimContractReward('pulse')).toBe(true);expect(w.weaponStage('pulse')).toBe(3);
 expect(w.profileFor('pulse').damage.reduce((a,b)=>a+b,0)*w.profileFor('pulse').rate).toBeGreaterThan(before.damage.reduce((a,b)=>a+b,0)*before.rate);
 expect(w.claimContractReward('energy')).toBe(false);expect(w.contractReward).toBeUndefined();
});
it('rejects escapes and death on the same step as the last target kill without issuing a contract reward',()=>{
 const escaped=prepare();escaped.acceptContract('hunter');step(escaped);target(escaped).y=1344;step(escaped);
 expect(escaped.contract!.status).toBe('failed');expect(escaped.contract!.reason).toBe('悬赏目标已脱离');expect(escaped.contractReward).toBeUndefined();
 const w=prepare();w.acceptContract('hunter');step(w,60);hit(w,target(w));const second=secondTarget(w);w.player.hp=1;w.bullets=[];
 const y=second.y+second.height*.4;
 w.bullets.push({id:id++,x:second.x,y,px:second.x,py:y,vx:0,vy:0,damage:1000,age:0,active:true,hostile:false});
 w.bullets.push({id:id++,x:w.player.x,y:C.playerY,px:w.player.x,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});step(w);
 expect(w.phase).toBe('dead');expect(w.contract!.status).toBe('failed');expect(w.contractReward).toBeUndefined();
});
it('unsafe rejected candidates never become escaped targets and only retry after a bounded delay',()=>{
 const w=prepare();w.acceptContract('hunter');const trap=w.spawn('drone',360,C.playerY);trap.width=1200;trap.speed=0;w.player.invulnerable=2;
 step(w);expect(w.fallbackCount).toBeGreaterThan(0);expect(w.contract!.status).toBe('active');expect(w.contract!.reinforcements).toBe(0);
 expect(w.bodies.some(b=>b.bountyRound!==undefined)).toBe(false);const attempts=w.fallbackCount;step(w,10);expect(w.fallbackCount).toBe(attempts);
 step(w,30);expect(w.contract!.reinforcements).toBe(1);expect(w.contract!.status).toBe('active');
});
it('keeps enemy capacity and leaves deployed threats in the world on timeout',()=>{
 const w=prepare();w.acceptContract('hunter');for(let i=0;i<C.limits.enemies;i++){const b=w.spawn('drone',180,-1000);b.speed=0;}
 step(w);expect(w.contract!.reinforcements).toBe(0);
 for(const b of w.bodies)if(b.kind==='drone')b.active=false;step(w);expect(w.contract!.reinforcements).toBe(1);
 const deployed=target(w);w.contract!.elapsed=29.99;step(w);expect(w.contract!.status).toBe('failed');expect(deployed.active).toBe(true);
 expect(w.contractReward).toBeUndefined();expect(w.acceptContract('precision')).toBe(false);
});

it('bounty elites hold a visible combat position and later retreat while ordinary elites keep advancing',()=>{
 const w=new World(),b=w.spawn('elite',220,180),ordinary=w.spawn('elite',500,180);b.bountyRound=1;
 for(let i=0;i<300;i++){advanceBody(b,C.step,'running',0,()=>{});advanceBody(ordinary,C.step,'running',0,()=>{});}
 expect(b.y).toBe(500);expect(ordinary.y).toBeGreaterThan(500);
 for(let i=0;i<16*60;i++)advanceBody(b,C.step,'running',0,()=>{});expect(b.y).toBeGreaterThan(500);
});

it('does not issue a late reward when the final update crosses the deadline',()=>{
 const c=new Contract('hunter',1,0,1,0);c.targetKilled(1,1);c.targetKilled(2,1);c.update(30.1,2,1,0,true);
 expect(c.status).toBe('failed');
});
