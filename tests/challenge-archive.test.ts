import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {awardAchievements,emptyAchievements,parseAchievements,trackAchievement,achievementGroups,achievements} from '../src/core/achievements';import {nextRunGoal,runReport} from '../src/game/run-report';
function setup(){const w=new World();const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';w.step(C.step,360);w.drainEffects();return w;}
function hurt(w:World){w.bullets=[{id:99999,x:w.player.x,y:C.playerY,px:w.player.x,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true}];w.step(C.step,68);w.drainEffects();}
function kill(w:World,b:World['bodies'][number]){w.bullets=[{id:99998,x:b.x,y:Math.max(250,b.y),px:b.x,py:Math.max(250,b.y),vx:0,vy:0,damage:10000,age:0,active:true,hostile:false}];w.step(C.step,68);w.drainEffects();}
it.each([[false,false],[true,false],[false,true]] as const)('only actual success records ace mastery, flawless means damage since acceptance (before=%s after=%s)',(before,after)=>{
 const w=setup();if(before)hurt(w);expect(w.acceptContract('hunter',undefined,'crossfire')).toBe(true);for(let i=0;i<61;i++)w.step(C.step,68);if(after)hurt(w);
 for(const b of w.bodies.filter(b=>b.bountyRound===w.round))kill(w,b);
 expect(w.contract!.status).toBe('won');expect(w.aceWins).toBe(1);expect(w.flawlessAceWins).toBe(after?0:1);
 const s=emptyAchievements();const evidence={aceWins:w.aceWins,flawlessAceWins:w.flawlessAceWins};const fresh=awardAchievements(s,w.build.ranks,1,0,0,0,0,evidence).map(a=>a.id);expect(fresh).toContain('ace');expect(fresh.includes('flawless-ace')).toBe(!after);expect(awardAchievements(s,w.build.ranks,1,0,0,0,0,evidence)).toEqual([]);
});
it.each(['death','escape','timeout'] as const)('failed %s ace hunts cannot create mastery or badges',failure=>{
 const w=setup();w.acceptContract('hunter',undefined,'crossfire');for(let i=0;i<61;i++)w.step(C.step,68);const targets=w.bodies.filter(b=>b.bountyRound===w.round);kill(w,targets[0]);
 if(failure==='escape'){targets[1].y=1344;w.step(C.step,68);}else if(failure==='timeout'){w.contract!.elapsed=29.999;kill(w,targets[1]);}else{w.player.hp=1;const b=targets[1];w.bullets=[{id:99997,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:10000,age:0,active:true,hostile:false},{id:99999,x:w.player.x,y:C.playerY,px:w.player.x,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true}];w.step(C.step,68);}
 expect(w.contract!.status).toBe('failed');expect(w.aceWins).toBe(0);expect(w.flawlessAceWins).toBe(0);expect(w.contractReward).toBeUndefined();
});
it('preserves old saves, canonicalizes distinct certifications and never infers missing historical proof kinds',()=>{
 const old=parseAchievements({kills:123,bosses:4,unlocked:['proof','boss'],tracked:'fake'});expect(old.unlocked).toEqual(['boss','proof']);expect(old.certifiedBuilds).toEqual([]);expect(old.tracked).toBeNull();
 const valid=parseAchievements({kills:12,bosses:1,unlocked:['boss','boss','fake'],certifiedBuilds:['ion','ion','fake','photon'],tracked:'ace'});expect(valid.certifiedBuilds).toEqual(['photon','ion']);expect(valid.tracked).toBe('ace');expect(valid.unlocked).toEqual(['boss']);
});
it('three distinct supplied proof identities survive cross-run serialization and repeated kinds cannot complete the set',()=>{
 let s=emptyAchievements();const ranks={ballistic:0,electric:0,optical:0};
 for(const kind of ['storm','storm','ion'] as const){awardAchievements(s,ranks,1,0,0,0,1,{certifiedBuilds:[kind]});s=parseAchievements(JSON.parse(JSON.stringify(s)));}
 expect(s.certifiedBuilds).toHaveLength(2);expect(s.unlocked).not.toContain('versatile');const fresh=awardAchievements(s,ranks,1,0,0,0,1,{certifiedBuilds:['photon']});expect(fresh.map(a=>a.id)).toEqual(['versatile']);expect(parseAchievements(s).certifiedBuilds).toHaveLength(3);
});
it('tracking is a reversible local preference, respects actual completion, and never mutates combat or grants power',()=>{
 const w=new World(),s=emptyAchievements(),before=JSON.stringify(w);expect(trackAchievement(s,'ace')).toBe(true);expect(nextRunGoal(w,[],s.tracked)).toContain('双线王牌');expect(runReport(w,[],[],s.tracked).next).toContain('王牌猎手');expect(trackAchievement(s,'fake')).toBe(false);s.unlocked.push('ace');expect(trackAchievement(s,'ace')).toBe(false);expect(nextRunGoal(w,s.unlocked,s.tracked)).toContain('已达成');expect(JSON.stringify(w)).toBe(before);
 const grouped=Object.values(achievementGroups).flatMap(g=>[...g.ids]);expect(new Set(grouped).size).toBe(achievements.length);expect(grouped.length).toBe(achievements.length);
});
