import{it,expect}from'vitest';
import{World,type Body}from'../src/core/world';import{C}from'../src/core/config';
import{closingAssault,closingBrief,closingDurability,CLOSING_CLEAR_CHARGE}from'../src/core/closing-assault';
import{timeline}from'../src/core/director';import{battleIndex,type BattlePlan}from'../src/core/battle-plan';
const baselinePath='../build/qa/Stage-256/baseline.mjs',before=await import(baselinePath);
let shotId=980000;
function setup(round=1,plan:BattlePlan=0){const w=new World(1337,round,undefined,plan);Object.assign(w,{scheduled:closingAssault(round,false,plan),secondChance:true,shoot(){}});w.roundTime=67.99;w.player.x=w.player.px=652;return w;}
function frames(w:World,n=1){for(let i=0;i<n;i++)w.step(C.step,652);}
function hit(w:World,b:Body,damage=100000){w.bullets.push({id:shotId++,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage,active:true,hostile:false,age:0});frames(w);}
it('keeps all non-closing events and old counts across 108 authored schedules, with exact mirrored deployment',()=>{
 for(let r=1;r<=12;r++)for(const seed of[1,29,1337])for(const p of[0,1,2]as const){const a=timeline(r,seed,p),b=before.timeline(r,seed,p);expect(a.filter(s=>!s.closing)).toEqual(b.filter((s:any)=>!s.closing));expect(a.filter(s=>s.closing)).toHaveLength((r-1)%3===0?4:3);}
 for(let r=1;r<=9;r++)for(const p of[0,1,2]as const){const a=closingAssault(r,false,p),b=closingAssault(r,true,p);expect(b.map(s=>({...s,x:720-s.x,lane:s.lane===undefined?undefined:720-s.lane}))).toEqual(a);}
 expect(closingAssault(1,false,0)).toEqual(closingAssault(1,false,2));
});
it('contains nine genuinely different movement/attack formations and labels follow battleIndex, never an independent random roll',()=>{
 const signatures=new Set<string>(),titles=new Set<string>();
 for(const r of[4,5,6])for(const p of[0,1,2]as const){signatures.add(JSON.stringify(closingAssault(r,false,p).map(s=>[s.kind,s.x,s.dropY,s.pattern,s.lane,!!s.forkshot])));titles.add(closingBrief(r,p).title);}
 expect(signatures.size).toBe(9);expect(titles.size).toBe(9);
 for(const r of[4,5,6])for(const p of[0,1,2]as const)if(battleIndex(r,p)===2&&r%3===2)expect(closingAssault(r,false,p)[0].forkshot).toBe(true);
});
it.each([0,1,2]as const)('plan%s admits every complete variant from a clear road, with fixed HP independent of player damage',p=>{
 for(const r of[2,3,4,5,6]){const pairs=[];for(const bonus of[0,1000]){const w=setup(r,p);w.growth.bonus=bonus;frames(w);expect(w.closingStatus.total).toBe(r%3===1?4:3);expect(w.closingStatus.kills).toBe(0);pairs.push(w.bodies.filter(b=>b.active).map(b=>[b.kind,b.hp,b.maxHp]));}expect(pairs[0]).toEqual(pairs[1]);const raw=new World(1337,r);for(const [kind,hp]of pairs[0])expect(hp).toBe(raw.spawn(kind as any,200,350).hp*closingDurability(r,kind as any));}
});
it('rejected deployment creates no bonus target state, and retry only counts the admitted IDs',()=>{
 const w=setup();const admit=(w as any).admit.bind(w);(w as any).admit=(b:Body)=>{b.active=false;return false;};frames(w);expect(w.closingStatus.total).toBe(0);expect(w.closingClears).toBe(0);(w as any).admit=admit;frames(w);expect(w.closingStatus.total).toBe(4);expect(w.dropSpawns).toBe(4);
});
it('real contacts award exactly40 only for all admitted kills, with normal score and no bonus on an unrelated kill',()=>{
 const w=setup();frames(w,29);const targets=[...w.bodies.filter(b=>b.active)];const extra=w.spawn('drone',100,300);hit(w,extra);expect(w.closingStatus.kills).toBe(0);expect(w.growth.energy).toBe(0);
 for(const b of targets.slice(0,-1)){hit(w,b);expect(w.closingClears).toBe(0);expect(w.growth.energy).toBe(0);}
 hit(w,targets.at(-1)!);expect(w.closingStatus).toEqual({round:1,total:4,kills:4,rewarded:true});expect(w.growth.energy).toBe(CLOSING_CLEAR_CHARGE);expect(w.closingClears).toBe(1);expect(w.kills).toBe(5);expect(w.drainEffects().filter(e=>e.type==='closing-clear')).toHaveLength(1);frames(w,100);expect(w.growth.energy).toBe(40);expect(w.closingClears).toBe(1);
});
it('a missed body cannot be replaced by another kill or leaving the screen, and boss entry is not blocked',()=>{
 const w=setup();frames(w,29);const targets=[...w.bodies.filter(b=>b.active)];targets[0].y=1343;
 frames(w);for(const b of targets.slice(1))hit(w,b);frames(w,100);expect(w.closingStatus.kills).toBe(3);expect(w.closingClears).toBe(0);expect(w.growth.energy).toBe(0);expect(w.phase).toBe('boss-entry');
});
it('the reward uses existing overflow mastery and does not replace weapons; next chapter resets target IDs',()=>{
 const w=setup();frames(w,29);w.growth.energy=80;const weapons=[...w.activeWeapons];for(const b of [...w.bodies.filter(b=>b.active)])hit(w,b);expect(w.growth.energy).toBe(20);expect(w.growth.mastery).toBe(1);expect(w.growth.overload).toBeGreaterThan(0);expect(w.activeWeapons).toEqual(weapons);
 for(const b of w.bodies)b.active=false;w.phase='recovery';w.phaseTime=3.99;frames(w);expect(w.round).toBe(2);expect(w.closingStatus).toEqual({round:2,total:0,kills:0,rewarded:false});expect(w.closingClears).toBe(1);
});
it('native forkshot, moving guns, reflected rounds and accelerating rockets are actually activated by the admitted variants',()=>{
 const seen=new Set<string>();for(const r of[4,5,6])for(const p of[0,1,2]as const){const w=setup(r,p);frames(w);const units=[...w.bodies.filter(b=>b.active)],start=new Map(units.map(b=>[b.id,b.x]));frames(w,100);for(const b of units){if(b.pattern==='relocate'&&b.x!==start.get(b.id))seen.add('relocate');if(b.pattern==='sweep'&&b.x!==start.get(b.id))seen.add('sweep');if(b.forkshot&&(b.lockShots??0)>0)seen.add('forkshot');}for(const b of w.bullets.filter(b=>b.hostile)){if(b.bankRemaining!==undefined)seen.add('bankshot');if(b.boostAfter!==undefined)seen.add('booster');}}
 expect([...seen].sort()).toEqual(['bankshot','booster','forkshot','relocate','sweep']);
});
