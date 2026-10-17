import{it,expect}from'vitest';import{earlyReinforcements}from'../src/core/early-reinforcements';import{timeline,Random}from'../src/core/director';import{battleIndex}from'../src/core/battle-plan';import{World}from'../src/core/world';import{chapterAssaults}from'../src/core/chapter-assaults';import{C}from'../src/core/config';import{enemyHealthScale}from'../src/core/difficulty';
const path='../build/qa/Stage-233/baseline.mjs',old=await import(path);
it('preserves early reserves and other authored enemies/rewards in108 schedules, with chapter assaults checked separately',()=>{
 for(let round=1;round<=12;round++)for(const seed of[1,29,1337])for(const plan of[0,1,2]as const){const list=timeline(round,seed,plan),mirror=round>1&&new Random(seed).next()>.5;
 const strip=(items:any[],own:any[])=>{const rest=items.filter(s=>!s.earlyReserve);for(const s of own){const i=rest.findIndex(t=>JSON.stringify(t)===JSON.stringify(s));expect(i).toBeGreaterThanOrEqual(0);rest.splice(i,1);}return rest;};const v=battleIndex(round,plan);expect(strip(list,chapterAssaults(round,mirror,v))).toEqual(strip(old.timeline(round,seed,plan),old.chapterAssaults(round,mirror,v)));expect(list.filter(s=>s.earlyReserve)).toEqual(earlyReinforcements(round,mirror,battleIndex(round,plan)).sort((a,b)=>a.at-b.at));if(round===1)expect(list).toEqual(old.timeline(round,seed,plan));
 }
});
it.each([2,3,4,5,6,7])('authors six protected, staggered units and mirrors all actual lanes in round%s',r=>{
 for(const v of[0,1,2]){const a=earlyReinforcements(r,false,v);expect(a).toHaveLength(6);expect(a.filter(s=>s.dropLabel)).toHaveLength(1);expect(a.every(s=>s.earlyReserve&&s.drop&&s.at>=2.6&&s.at<5.5)).toBe(true);expect(new Set(a.map(s=>s.at)).size).toBe(6);expect(earlyReinforcements(r,true,v)).toEqual(a.map(s=>({...s,x:720-s.x,lane:s.lane===undefined?undefined:720-s.lane})));}
});
it('gives corridors a rebound threat, flanks short cuts, and heavy chapters real stationary/moving guns',()=>{
 expect(earlyReinforcements(4,false,0).filter(s=>s.pattern==='rebound')).toHaveLength(1);const side=earlyReinforcements(2,false,0).filter(s=>s.kind==='charger');expect(side).toHaveLength(2);expect(side.map(s=>s.lane)).toEqual([280,440]);expect(earlyReinforcements(3,false,0).filter(s=>s.kind==='armor').map(s=>s.pattern)).toEqual(['fan','sweep']);
});
it.each([2,3,4])('actual admission keeps ordinary durability, one announcement, real firing and zero grants in round%s',round=>{
 const w=new World(1337,round);Object.assign(w,{scheduled:earlyReinforcements(round,false,0)});(w as any).shoot=()=>{};w.player.x=w.player.px=652;let notices=0,observed=false,shots=0;const seen=new Set<number>();
 for(let i=0;i<7*60;i++){w.step(C.step,652);const events=w.drainEffects();notices+=events.filter(e=>e.type==='drop-wave').length;for(const b of w.bodies)if(!seen.has(b.id)){seen.add(b.id);expect(b.maxHp).toBe(C.enemies[b.kind as keyof typeof C.enemies].hp*enemyHealthScale(b.kind as keyof typeof C.enemies,round));if((b.dropGrace??0)>0)observed=true;}shots=Math.max(shots,w.bullets.filter(b=>b.hostile).length);}
 expect(w.dropSpawns).toBe(6);expect(observed).toBe(true);expect(notices).toBe(1);expect(w.kills).toBe(0);expect(w.pickups).toBe(0);expect(w.gatesTaken).toBe(0);if(round===3)expect(shots).toBeGreaterThan(0);
});

it('a late moving reserve starts its first real salvo after an already admitted opening gun',()=>{
 const w=new World(1337,3);Object.assign(w,{scheduled:[]});(w as any).shoot=()=>{};w.player.x=w.player.px=68;
 const specs=[earlyReinforcements(3,false,0).find(s=>s.pattern==='sweep')!,{kind:'armor' as const,x:240,dropY:350,opening:.1,pattern:'fan' as const,lane:240}];
 const guns=specs.map(s=>{const b=w.spawn('armor',s.x,s.dropY);Object.assign(b,{pattern:s.pattern,lane:s.lane??s.x,timer:s.opening,dropGrace:.45});return b;});const first=new Map<number,number>();
 for(let f=0;f<3*60;f++){w.step(C.step,68);w.drainEffects();for(const p of w.bullets)if(p.hostile&&p.sourceId&&!first.has(p.sourceId))first.set(p.sourceId,w.time);}
 expect(first.has(guns[0].id)).toBe(true);expect(first.has(guns[1].id)).toBe(true);expect(first.get(guns[0].id)!-first.get(guns[1].id)!).toBeGreaterThanOrEqual(.85);
});
