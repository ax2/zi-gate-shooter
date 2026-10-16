import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {advanceBody} from '../src/core/behavior';
it.each(['armor','elite','guard'] as const)('%s starts a complete visible charge and then fires on its original opening schedule',kind=>{
 const b=new World().spawn(kind,360),samples:{time:number;y:number}[]=[];let warning:null|{time:number;y:number}=null;
 for(let i=0;i<6*60;i++){advanceBody(b,C.step,'running',0,()=>samples.push({time:b.age,y:b.y}));if(!warning&&b.warning>0)warning={time:b.age,y:b.y};}
 mkdirSync('build/qa/Stage-159/entry',{recursive:true});writeFileSync(`build/qa/Stage-159/entry/${kind}.json`,JSON.stringify({kind,warning,shots:samples},null,2));
 const half=kind==='guard'?80:kind==='elite'?136*1.36/2:102*1.38/2;expect(warning).not.toBeNull();expect(warning!.y-half).toBeGreaterThanOrEqual(C.playerShotTop);expect(samples.length).toBeGreaterThan(0);expect(samples[0].time-warning!.time).toBeCloseTo(kind==='guard'?.8:.6);expect(samples[0].time).toBeCloseTo(kind==='guard'?2.3:kind==='elite'?1.8:2.1);
});
it.each(['armor','elite','guard'] as const)('%s already in the field keeps its original immediate charge',kind=>{
 const b=new World().spawn(kind,360,320);b.timer=0;advanceBody(b,C.step,'running',0,()=>{throw Error('unwarned shot');});
 expect(b.deploying).toBe(false);expect(b.y).toBeCloseTo(320+b.speed*C.step);expect(b.warning).toBe(kind==='guard'?.8:.6);
});
it('a distant top arrival never shoots in deployment and still gives a complete charge afterwards',()=>{
 const b=new World().spawn('armor',360,-1200);let warningAt=0,shotAt=0;
 for(let i=0;i<240;i++){advanceBody(b,C.step,'running',0,()=>{if(!shotAt)shotAt=b.age;expect(b.deploying).toBe(false);});if(b.warning>0&&!warningAt)warningAt=b.age;}
 expect(warningAt).toBeGreaterThan(3);expect(shotAt-warningAt).toBeCloseTo(.6);
});
it('EMP pauses the attack clock during deployment without teleporting or granting invulnerability',()=>{
 const w=new World(),b=w.spawn('guard',360);b.empRemaining=1;
 for(let i=0;i<30;i++)advanceBody(b,C.step,'running',0,()=>{throw Error('disabled emitter');});
 expect(b.y).toBeCloseTo(160);expect(b.timer).toBe(1.5);expect(b.hp).toBe(b.maxHp);expect(b.warning).toBe(0);
});
it.each(['armor','elite','guard'] as const)('a lethal actual laser cancels an unlaunched %s attack and preserves prior enemy bullets',kind=>{
 const w=new World();w.growth.mastery=1;w.chooseBuild('optical');const b=w.spawn(kind,360,400);b.hp=1;b.speed=0;b.timer=0;b.warning=kind==='guard'?.8:.6;if(kind==='guard')b.burst=1;
 const old={id:99999,x:600,y:700,px:600,py:700,vx:0,vy:280,damage:1,age:0,active:true,hostile:true};w.bullets.push(old);w.step(C.step,68);w.drainEffects();expect(w.kills).toBe(1);expect(w.bullets.filter(b=>b.hostile)).toHaveLength(1);expect(old.active).toBe(true);expect(old.y).toBeGreaterThan(700);
});
it('a visible deploying armor can be hit and killed by an actual laser',()=>{
 const w=new World();w.growth.mastery=1;w.chooseBuild('optical');const b=w.spawn('armor',360);b.y=300;b.hp=1;
 w.step(C.step,360);expect(w.kills).toBe(1);expect(b.active).toBe(false);expect(w.bullets.some(b=>b.hostile)).toBe(false);
});
