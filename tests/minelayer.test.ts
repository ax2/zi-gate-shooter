import{it,expect}from'vitest';import{World,type Body}from'../src/core/world';import{C}from'../src/core/config';import{timeline}from'../src/core/director';import{MINELAYER,minelayerMuzzles}from'../src/core/minelayer';import{hostileContactShape}from'../src/core/hostile-shape';import{dangerTimeline,safeRoute}from'../src/core/reachability';
function setup(round=4){const w=new World(1337,round);const slot=timeline(round,1337).find(s=>s.pattern==='minelayer')!;Object.assign(w,{scheduled:[{...slot,at:0}],secondChance:true,shoot(){}});w.player.x=w.player.px=68;return w;}
function frames(w:World,n=1,x=68){for(let i=0;i<n;i++)w.step(C.step,x);}
let id=970000;
function hit(w:World,b:Body){w.bullets.push({id:id++,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,age:0,damage:100000,hostile:false,active:true});frames(w);}
it('introduces only one finite mine carrier after the intro, preserving all old reward times/counts and closing group sizes',()=>{
 for(let r=1;r<=12;r++)for(const seed of[1,29,1337])for(const p of[0,1,2]as const){const rows=timeline(r,seed,p),mine=rows.filter(s=>s.pattern==='minelayer');expect(mine).toHaveLength(r>=4?1:0);if(r>=4){expect(mine[0].kind).toBe('armor');expect(mine[0].at).toBe(r%3===1?44.5:35);expect(mine[0].dropY).toBe(r%3===1?300:350);}expect(rows.filter(s=>s.kind==='armory').map(s=>s.at)).toEqual(r===1?[16,46.5]:[16,48]);expect(rows.filter(s=>s.kind==='gates').map(s=>s.at)).toEqual(r===1?[20,27,35,58]:[20,27,39,58]);expect(rows.filter(s=>s.closing)).toHaveLength(r%3===1?4:3);}
});
it('uses authored triple armour HP independent of player bonus and a visible charge before exactly two physical mines',()=>{
 const snapshots=[];for(const bonus of[0,1000]){const w=setup();w.growth.bonus=bonus;frames(w);const b=w.bodies.find(b=>b.pattern==='minelayer')!;snapshots.push(b.maxHp);expect(b.hp).toBeGreaterThan(500);frames(w,46);expect(w.bullets.filter(b=>b.mine)).toHaveLength(0);expect(b.warning).toBeGreaterThan(0);frames(w,10);const mines=w.bullets.filter(b=>b.mine);expect(mines).toHaveLength(2);expect(b.mineShots).toBe(2);expect(b.mineFiredAt).toBeDefined();expect(mines.every(p=>p.hostile&&p.sourceId===b.id)).toBe(true);expect(mines.map(p=>Math.sign(p.vx))).toEqual([-1,1]);frames(w,160);expect(b.mineShots).toBe(2);}
 expect(snapshots[0]).toBe(snapshots[1]);
});
it('real pre-emption stops mine deployment, but a later kill never deletes already launched ordnance',()=>{
 const a=setup();frames(a,31);const carrier=a.bodies.find(b=>b.pattern==='minelayer')!;hit(a,carrier);frames(a,40);expect(a.bullets.filter(b=>b.mine)).toHaveLength(0);
 const b=setup();frames(b,57);const gun=b.bodies.find(b=>b.pattern==='minelayer')!,ids=b.bullets.filter(p=>p.mine).map(p=>p.id);hit(b,gun);frames(b,30);expect(b.bullets.filter(p=>p.mine).map(p=>p.id)).toEqual(ids);expect(gun.active).toBe(false);
});
it('EMP freezes the real windup and rejected hostile budget never produces fake launch counts or recoil',()=>{
 const w=setup();frames(w,15);const b=w.bodies.find(b=>b.pattern==='minelayer')!;b.empRemaining=1;const timer=b.timer;frames(w,59);expect(b.timer).toBeCloseTo(timer);expect(b.mineShots??0).toBe(0);frames(w,50);expect(b.mineShots).toBe(2);
 const u=setup();frames(u);for(let i=0;i<C.limits.hostile;i++)u.bullets.push({id:id++,x:100,y:200,px:100,py:200,vx:0,vy:0,age:0,damage:1,hostile:true,active:true});frames(u,57);const carrier=u.bodies.find(b=>b.pattern==='minelayer')!;expect(carrier.mineShots??0).toBe(0);expect(carrier.mineFiredAt).toBeUndefined();expect(u.bullets.filter(b=>b.hostile)).toHaveLength(C.limits.hostile);
});
it.each([{mine:true,x:55,hp:2},{mine:true,x:57,hp:3},{mine:false,x:28,hp:3},{mine:false,x:26,hp:2}])('continuous collision respects current footprint $mine at offset$x',({mine,x,hp})=>{
 const w=new World(1337);Object.assign(w,{scheduled:[],secondChance:true,shoot(){}});w.player.x=w.player.px=360;w.bullets.push({id:id++,x:360+x,y:C.playerY,px:360+x,py:C.playerY,vx:0,vy:0,age:0,damage:1,hostile:true,active:true,...(mine?{mine:true}:{})});frames(w,1,360);expect(w.player.hp).toBe(hp);expect(hostileContactShape({mine})).toEqual(mine?{x:56,y:56}:{x:27,y:31});if(hp===2)expect(w.damageTaken).toBe(1);
});
it('forecast shares the wide emitted shape and scaled velocity, does not mutate live state, and covers real crossings along a safe path',()=>{
 const w=setup();frames(w);const before=JSON.stringify(w.bodies),hazards=dangerTimeline(w.bodies,[],7,{phase:'running'});expect(JSON.stringify(w.bodies)).toBe(before);const path=safeRoute(68,w.bodies,[],7,{phase:'running',reaction:.45});expect(path).not.toBeNull();let crossings=0;
 for(let f=0;f<420;f++){frames(w,1,path![Math.floor(f/6)]??w.player.x);for(const p of w.bullets.filter(b=>b.mine)){if(Math.min(p.py,p.y)-56<=C.playerY&&Math.max(p.py,p.y)+56>=C.playerY){const slab=hazards[Math.floor(f/6)];expect(slab.some(([lo,hi])=>lo<=p.x-56&&hi>=p.x+56)).toBe(true);crossings++;}}}
 expect(crossings).toBeGreaterThan(0);expect(w.player.hp).toBe(3);expect(w.damageTaken).toBe(0);expect(w.kills).toBe(0);expect(w.bullets.length).toBeLessThanOrEqual(C.limits.hostile);
});
it('muzzle geometry is stable and left-right symmetric, with no sampled player trajectory',()=>{expect(minelayerMuzzles({x:360,y:350})).toEqual([{x:320,y:374,vx:-55,vy:180},{x:400,y:374,vx:55,vy:180}]);expect(MINELAYER.radius).toBe(36);});
it('wide mines use the swept player path, not only its clear endpoints',()=>{const w=new World(1337);Object.assign(w,{scheduled:[],secondChance:true,shoot(){}});w.player.x=w.player.px=200;w.bullets.push({id:id++,x:268,y:C.playerY,px:268,py:C.playerY,vx:0,vy:0,age:0,damage:1,hostile:true,active:true,mine:true});w.step(.2,336);expect(w.player.x).toBe(336);expect(w.player.hp).toBe(2);expect(w.damageTaken).toBe(1);expect(w.drainEffects().some(e=>e.type==='mine-burst')).toBe(true);});
