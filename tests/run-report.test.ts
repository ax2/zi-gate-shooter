import {expect,it} from 'vitest';
import {World,type Body} from '../src/core/world';import {C} from '../src/core/config';import {runReport,nextRunGoal} from '../src/game/run-report';import {achievements} from '../src/core/achievements';
function tick(w:World,n=1){for(let i=0;i<n;i++){w.step(C.step,68);w.drainEffects();}}
function kill(w:World,b:Body){const y=b.y+b.height*.4;w.bullets=[{id:99999,x:b.x,y,px:b.x,py:y,vx:0,vy:0,damage:100000,age:0,active:true,hostile:false}];tick(w);}
it('counts real hunter success, actual claim and a later damaged contract once across rounds',()=>{
 const w=new World();w.spawn('pickup',360,C.playerY,2);tick(w);expect(w.acceptContract('hunter')).toBe(true);expect(w.acceptContract('precision')).toBe(false);tick(w,61);
 kill(w,w.bodies.find(b=>b.active&&b.bountyRound===w.round)!);tick(w,370);kill(w,w.bodies.find(b=>b.active&&b.bountyRound===w.round)!);
 expect(w.contractStats).toEqual({accepted:1,won:1,failed:0,claimed:0});tick(w,30);expect(w.contractStats.won).toBe(1);expect(w.claimContractReward('energy')).toBe(true);expect(w.claimContractReward('energy')).toBe(false);expect(w.contractStats.claimed).toBe(1);
 w.round=2;w.roundTime=0;w.phase='running';expect(w.acceptContract('precision')).toBe(true);w.bullets=[{id:99998,x:w.player.x,y:C.playerY,px:w.player.x,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true}];tick(w);expect(w.contractStats).toEqual({accepted:2,won:1,failed:1,claimed:1});tick(w,30);expect(w.contractStats.failed).toBe(1);
});
it('records a real boss victory once and excludes same-step player death',()=>{
 for(const fatal of [false,true]){const w=new World();w.phase='boss';w.player.x=w.player.px=68;const b=w.spawn('boss',360,C.bossY);b.hp=1;
 if(fatal){w.player.hp=1;w.bullets.push({id:99998,x:68,y:C.playerY,px:68,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});}
 const y=b.y;w.bullets.push({id:99999,x:b.x,y,px:b.x,py:y,vx:0,vy:0,damage:10,age:0,active:true,hostile:false});tick(w);expect(w.bossWins).toBe(fatal?0:1);tick(w,30);expect(w.bossWins).toBe(fatal?0:1);
 }
});
it('read-only report retains weapon tiers, selected branches and actual event counters without giving rewards',()=>{
 const w=new World();w.growth.mastery=3;w.chooseBuild('electric');w.chooseBuild('electric','capacitor');w.chooseBuild('optical');const before=JSON.stringify(w),known=['boss','specialist'];
 const r=runReport(w,['specialist'],known);expect(r.routes[1]).toContain('电容蓄爆');expect(r.weapons).toContain('电弧炮 T1');expect(r.fresh).toContain('专精工程师');expect(r.contracts).toBe('本局未接取契约 · 每轮可自选一次');expect(r.mechanics[0]).toBe('尚未触发派生能力');expect(JSON.stringify(w)).toBe(before);
 expect(new World().bossWins).toBe(0);expect(new World().contractStats).toEqual({accepted:0,won:0,failed:0,claimed:0});
});
it('suggests a real unmet objective and handles a fully unlocked archive',()=>{
 const w=new World();expect(nextRunGoal(w,[])).toContain('拾取装备');w.spawn('pickup',360,C.playerY,2);tick(w);expect(nextRunGoal(w,[])).toContain('首领终结者');expect(nextRunGoal(w,['boss'])).toContain('跨界试验');expect(nextRunGoal(w,achievements.map(a=>a.id))).toContain('最高分');
});
