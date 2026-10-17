import{it,expect}from'vitest';import{World,type Bullet}from'../src/core/world';import{C}from'../src/core/config';import{BANKSHOT,advanceProjectile,hasBankshot}from'../src/core/bankshot';import{advanceBody}from'../src/core/behavior';import{dangerTimeline}from'../src/core/reachability';
const bullet=(x:number,vx:number):Bullet=>({id:207000,x,y:500,px:x,py:500,vx,vy:260,age:0,damage:1,hostile:true,active:true,bankRemaining:1});
it('reflects once at the exact wall contact and preserves original-step timing and mirrored geometry',()=>{
 const a=bullet(38,-220),b=bullet(682,220);const sa=advanceProjectile(a,C.step)!,sb=advanceProjectile(b,C.step)!;expect(sa).toHaveLength(2);expect(sa[0].to).toBeCloseTo((2/220)/C.step);expect(sa[0].x1).toBe(36);expect(sb[0].x1).toBe(684);expect(a.x+b.x).toBeCloseTo(720);expect(a.vx).toBe(220);expect(a.bankRemaining).toBe(0);expect(a.y).toBeCloseTo(500+260*C.step);expect(a.age).toBe(C.step);
 advanceProjectile(a,4);expect(a.bankRemaining).toBe(0);expect(a.x).toBeGreaterThan(684);expect(a.vx).toBe(220);
});
it('ordinary and friendly projectiles retain their exact linear integration',()=>{
 for(const hostile of [true,false]){const b=bullet(360,-200);b.hostile=hostile;if(hostile)delete b.bankRemaining;expect(advanceProjectile(b,C.step)).toBeUndefined();expect(b.x).toBe(360-200*C.step);expect(b.y).toBe(500+260*C.step);}
});
it.each([68,100])('a reflected segment hits a player moving toward %s when the chord misses, without double damage',target=>{
 const w=new World();(w as any).scheduled=[];w.player.x=w.player.px=68;const b=bullet(100,-9000);b.y=b.py=980;b.vy=2400;w.bullets=[b];w.step(C.step,target);expect(w.player.hp).toBe(2);expect(w.damageTaken).toBe(1);expect(w.bankReflections).toBe(1);expect(w.lastBankReflection?.x).toBe(36);expect(w.bullets.find(p=>p.id===b.id)).toBeUndefined();
});
it('does not manufacture a chord hit while the physical reflected arc passes the player line elsewhere',()=>{
 const w=new World();(w as any).scheduled=[];w.player.x=w.player.px=110;const b=bullet(100,-9000);b.y=b.py=960;b.vy=8000;w.bullets=[b];w.step(C.step,110);expect(w.player.hp).toBe(3);expect(w.damageTaken).toBe(0);expect(w.bankReflections).toBe(1);
});
it('forecast reserves both physical segments without mutating live state',()=>{
 const b=bullet(100,-9000);b.y=b.py=980;b.vy=2400;const before=JSON.stringify(b),forecast=dangerTimeline([], [b],.1);expect(forecast[0].some(([lo,hi])=>lo<=68&&hi>=68)).toBe(true);expect(JSON.stringify(b)).toBe(before);
 const w=new World(),gun=w.spawn('armor',210,380);Object.assign(gun,{pattern:'bankshot',timer:BANKSHOT.opening,dropGrace:.45,shotScale:1.3});const state=JSON.stringify(w.bodies);const future=dangerTimeline(w.bodies,[],4);expect(future.some(row=>row.some(([lo,hi])=>lo<364&&hi>364))).toBe(true);expect(JSON.stringify(w.bodies)).toBe(state);
});
it('EMP delays local charge, then the fixed outward emission resumes and killed sources retain fired bolts',()=>{
 const w=new World();(w as any).scheduled=[];w.player.x=w.player.px=68;const gun=w.spawn('armor',210,380);Object.assign(gun,{pattern:'bankshot',timer:0,empRemaining:1});const shots:number[][]=[];for(let i=0;i<30;i++)advanceBody(gun,C.step,'running',0,(...s)=>shots.push(s as number[]));expect(shots).toHaveLength(0);
 gun.empRemaining=0;for(let i=0;i<50;i++)advanceBody(gun,C.step,'running',0,(...s)=>shots.push(s as number[]));expect(shots[0]).toEqual([210,431,-220,260]);
 gun.timer=0;gun.warning=.1;w.step(C.step,68);const id=w.bullets.find(b=>b.bankRemaining===1)?.id;expect(id).toBeDefined();gun.active=false;w.step(C.step,68);expect(w.bullets.some(b=>b.id===id)).toBe(true);
});
it('enables only authored later corridor rounds',()=>{expect([1,2,3,4,5,6,7,10,13].filter(hasBankshot)).toEqual([4,7,10,13]);});
