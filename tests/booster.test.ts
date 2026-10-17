import{it,expect}from'vitest';import{BOOSTER}from'../src/core/booster';import{advanceProjectile}from'../src/core/bankshot';import{advanceBody}from'../src/core/behavior';import{World,type Bullet}from'../src/core/world';import{C}from'../src/core/config';import{dangerTimeline}from'../src/core/reachability';import{timeline}from'../src/core/director';
const baseline='../build/qa/Stage-237/baseline.mjs',old=await import(baseline);
const rocket=():Bullet=>({id:1,x:360,y:500,px:360,py:500,vx:50,vy:180,age:0,damage:1,hostile:true,active:true,boostAfter:BOOSTER.delay,boostFactor:BOOSTER.factor});
function ready(x=68){const w=new World();Object.assign(w,{scheduled:[]});(w as any).shoot=()=>{};w.player.x=w.player.px=x;return w;}
it.each([1/120,1/60,.1,1])('integrates the slow/fast course independently of step partition %s',dt=>{
 const b=rocket();for(let t=0;t<1-1e-8;t+=dt)advanceProjectile(b,Math.min(dt,1-t));expect(b.x).toBeCloseTo(447.5);expect(b.y).toBeCloseTo(815);expect(b.age).toBeCloseTo(1);expect(b.vx).toBe(200);expect(b.vy).toBe(720);expect(b.boostAfter).toBeUndefined();advanceProjectile(b,.25);expect(b.vx).toBe(200);expect(b.y).toBeCloseTo(995);
});
it('preserves each temporal segment across ignition, without mutating an unrelated round',()=>{
 const b=rocket();b.age=.7;const s=advanceProjectile(b,.1)!;expect(s).toHaveLength(2);expect(s[0].to).toBeCloseTo(.5);expect(s[1].from).toBeCloseTo(.5);expect(s[0].y1).toBeCloseTo(509);expect(b.y).toBeCloseTo(545);
 const plain=rocket();delete plain.boostAfter;delete plain.boostFactor;expect(advanceProjectile(plain,1)).toBeUndefined();expect(plain.x).toBe(410);expect(plain.y).toBe(680);
});
it('uses ignition timing in moving-player collision instead of a false whole-step chord',()=>{
 const w=ready(360),b=rocket();Object.assign(b,{x:380,px:380,y:960,py:960,vx:0,age:.7});w.bullets=[b];w.step(.2,496);expect(w.player.hp).toBe(3);expect(w.player.x).toBe(496);expect(b.y).toBeCloseTo(1077);expect(w.bankReflections??0).toBe(0);expect(w.drainEffects().some(e=>e.type==='bank-bounce')).toBe(false);
});
it('cannot tunnel through a stationary cockpit when the fast segment crosses it',()=>{
 const w=ready(360),b=rocket();Object.assign(b,{x:360,px:360,y:960,py:960,vx:0,age:.74});w.bullets=[b];w.step(.1,360);expect(w.player.hp).toBe(2);expect(w.damageTaken).toBe(1);expect(w.bankReflections??0).toBe(0);
});
it('forecasts newly emitted rockets and ignition without mutating the real emitter or projectile',()=>{
 const w=ready(),gun=w.spawn('armor',360,350);Object.assign(gun,{pattern:'booster',timer:BOOSTER.opening,shotScale:1.2});const before=JSON.stringify(w.bodies),future=dangerTimeline(w.bodies,[],4);expect(future.slice(0,35).some(row=>row.some(([lo,hi])=>lo<=167&&hi>=167))).toBe(true);expect(JSON.stringify(w.bodies)).toBe(before);
 const b=rocket();b.x=360;b.y=850;b.age=.7;const snapshot=JSON.stringify(b),reserved=dangerTimeline([], [b],.7);expect(reserved.some(row=>row.some(([lo,hi])=>lo<=400&&hi>=400))).toBe(true);expect(JSON.stringify(b)).toBe(snapshot);
});
it('retires after one attempted pair and never reloads another salvo',()=>{
 const w=ready(),b=w.spawn('armor',360,350);Object.assign(b,{pattern:'booster',timer:BOOSTER.opening});let shots=0;for(let i=0;i<600;i++)advanceBody(b,C.step,'running',0,()=>shots++);expect(shots).toBe(2);expect(b.boosterSpent).toBe(true);expect(b.y).toBeGreaterThan(1000);
});
it('advertises a full charge, then two separate accepted launch ports with a fixed speed scale',()=>{
 const w=ready(),b=w.spawn('armor',360,350);Object.assign(b,{pattern:'booster',timer:BOOSTER.opening,shotScale:1.2});const shots:{time:number;x:number;y:number;vx:number;vy:number}[]=[],warnings:number[]=[];let prior=0;
 for(let f=0;f<115;f++){advanceBody(b,C.step,'running',0,(x,y,vx=0,vy=280)=>shots.push({time:b.age,x,y,vx,vy}));if(b.warning&&!prior)warnings.push(b.age);prior=b.warning;}
 expect(shots).toHaveLength(2);expect(shots[0].time-warnings[0]).toBeCloseTo(BOOSTER.warning);expect(shots[1].time-shots[0].time).toBeCloseTo(.2333333333);expect(shots.map(s=>s.x)).toEqual([340,380]);expect(shots.map(s=>s.vx)).toEqual([-60,60]);expect(shots.every(s=>s.vy===216)).toBe(true);
});
it('EMP freezes the announced local charge but never freezes already fired rockets',()=>{
 const w=ready(),b=w.spawn('armor',360,350);Object.assign(b,{pattern:'booster',timer:.4,warning:.9,empRemaining:1});let n=0;for(let i=0;i<30;i++)advanceBody(b,C.step,'running',0,()=>n++);expect(n).toBe(0);expect(b.timer).toBe(.4);expect(b.warning).toBe(.9);const p=rocket();p.age=.74;advanceProjectile(p,.02);expect(p.boostAfter).toBeUndefined();
});
it('only accepted shots are tagged and counted, while killing the launcher retains fired rockets',()=>{
 const full=ready(),g=full.spawn('armor',360,350);Object.assign(g,{pattern:'booster',timer:0,warning:.9});for(let i=0;i<48;i++)full.bullets.push({...rocket(),id:100+i,x:620,y:500,boostAfter:undefined,boostFactor:undefined});full.step(C.step,68);expect(g.boosterShots??0).toBe(0);
 const w=ready(),b=w.spawn('armor',360,350);Object.assign(b,{pattern:'booster',timer:0,warning:.9,speed:0});w.step(C.step,68);const fired=w.bullets.find(s=>s.boostAfter!==undefined)!;expect(fired.sourceId).toBe(b.id);expect(b.boosterShots).toBe(1);b.hp=1;w.bullets.push({id:99999,x:360,y:350,px:360,py:350,vx:0,vy:0,age:0,damage:2,hostile:false,active:true});w.step(C.step,68);expect(b.active).toBe(false);for(let i=0;i<46;i++)w.step(C.step,68);expect(fired.boostAfter).toBeUndefined();expect(fired.vy).toBe(720);expect(w.bankReflections??0).toBe(0);
});
it('replaces only one ordinary corridor gun, with original roster, reward and durability in108 schedules',()=>{
 for(let r=1;r<=12;r++)for(const seed of[1,29,1337])for(const plan of[0,1,2]as const){const a=timeline(r,seed,plan),b=old.timeline(r,seed,plan),rockets=a.filter(s=>s.pattern==='booster');expect(rockets).toHaveLength((r-1)%3===0?1:0);expect(a).toHaveLength(b.length);const normalized=a.map(s=>s.pattern==='booster'?b.find((t:any)=>t.kind===s.kind&&t.x===s.x&&t.at===s.at):s);expect(normalized).toEqual(b);}
 const low=ready().spawn('armor',190,500),high=ready();high.growth.mastery=100;expect(high.spawn('armor',190,500).maxHp).toBe(low.maxHp);
});
it.each(['fan','bankshot']as const)('preserves complete public World frames for an original %s encounter',pattern=>{
 const worlds=[new old.World(),new World()];for(const w of worlds){Object.assign(w,{scheduled:[]});w.shoot=()=>{};w.player.x=68;const b=w.spawn('armor',210,380);Object.assign(b,{pattern,timer:.1,dropGrace:.45});}
 const stringify=(w:unknown)=>JSON.stringify(w,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
 for(let f=0;f<600;f++){for(const w of worlds){w.step(C.step,68);w.drainEffects();}expect(stringify(worlds[1])).toBe(stringify(worlds[0]));}
});
