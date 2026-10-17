import{it,expect}from'vitest';import{World,type Body}from'../src/core/world';import{C}from'../src/core/config';
function setup(){const w=new World();w.phase='boss';w.growth.mastery=2;w.chooseBuild('electric');w.chooseBuild('electric','capacitor');(w as any).shoot=()=>{};return w;}
function enemy(w:World,x=360,y=600){const b=w.spawn('armor',x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;}
function shot(w:World,b:Body,damage=10,kind:'arc'|'pulse'='arc',hops=0){w.bullets.push({id:900000+w.hits,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage,age:0,active:true,hostile:false,weaponKind:kind,chainHops:hops});w.step(C.step,68);return w.drainEffects();}
it('a direct arc kill recovers current cells plus the final hit, capped at two, without damaging the recipient',()=>{
 const w=setup(),a=enemy(w),b=enemy(w,470);shot(w,a);expect(a.capacitorHits).toBe(1);a.hp=1;const hp=b.hp,e=shot(w,a);expect(b.hp).toBe(hp);expect(b.capacitorHits).toBe(2);expect(w.capacitorTransfers).toBe(1);expect(w.capacitorRecovered).toBe(2);expect(w.capacitorBursts).toBe(0);expect(a.capacitorHits).toBe(0);expect(e.filter(e=>e.type==='capacitor-relay')).toHaveLength(1);
 shot(w,b);expect(b.hp).toBe(hp-30);expect(b.capacitorHits).toBe(0);expect(w.capacitorBursts).toBe(1);
});
it('a first-hit direct kill gives one cell; full recipients are skipped and nearest/id ordering applies',()=>{
 const w=setup(),a=enemy(w),full=enemy(w,370),b=enemy(w,420),tie=enemy(w,300);a.hp=1;full.capacitorHits=2;shot(w,a);expect(full.capacitorHits).toBe(2);expect(b.capacitorHits).toBe(1);expect(tie.capacitorHits).toBeUndefined();expect(w.capacitorRecovered).toBe(1);
});
it('transferred cells never explode by themselves and overflow adds only actual missing cells',()=>{
 const w=setup(),a=enemy(w),b=enemy(w,420);a.capacitorHits=2;a.hp=1;b.capacitorHits=1;shot(w,a);expect(b.capacitorHits).toBe(2);expect(w.capacitorRecovered).toBe(1);for(let i=0;i<90;i++){w.step(C.step,68);w.drainEffects();}expect(b.hp).toBe(1000);expect(w.capacitorBursts).toBe(0);
});
it('other weapons preserve earned cells and chained kills cannot create cells or auto-detonate',()=>{
 const w=setup(),a=enemy(w),b=enemy(w,420),c=enemy(w,500);a.hp=1;a.capacitorHits=2;shot(w,a,10,'pulse');expect(w.capacitorTransfers).toBe(1);expect(b.capacitorHits).toBe(2);b.hp=1;shot(w,c,10,'arc',1);expect(b.active).toBe(false);expect(w.capacitorTransfers).toBe(2);expect(c.capacitorHits).toBe(2);expect(c.hp).toBe(990);expect(w.capacitorBursts).toBe(0);shot(w,c);expect(c.hp).toBe(960);expect(w.capacitorBursts).toBe(1);
});
it('excludes rewards, closed shields, protected drops, off-strip bodies and entry bosses as recipients',()=>{
 const w=setup(),a=enemy(w);a.hp=1;w.spawn('crate',370,600);w.spawn('gate',380,600);const shield=w.spawn('guard',390,600);shield.timer=999;const drop=enemy(w,400);drop.dropGrace=5;enemy(w,410,220);const boss=w.spawn('boss',420,600);w.phase='running';(w as any).scheduled=[];shot(w,a);expect(w.capacitorTransfers).toBe(0);expect(shield.capacitorHits).toBeUndefined();expect(drop.capacitorHits).toBeUndefined();expect(boss.capacitorHits).toBeUndefined();
});
it('boss victory emits no transfer and a new run resets local counters',()=>{
 const w=setup(),boss=w.spawn('boss',360,600),b=enemy(w,420);boss.hp=1;shot(w,boss);expect(w.phase).toBe('recovery');expect(w.bossWins).toBe(1);expect(w.capacitorTransfers).toBe(0);expect(b.capacitorHits).toBeUndefined();const n=new World();expect(n.capacitorTransfers).toBe(0);expect(n.capacitorRecovered).toBe(0);expect(n.capacitorBursts).toBe(0);
});
it.each([[300,239],[1000,1025]])('never transfers across the combat strip even within range, source y%s and target y%s',(sourceY,targetY)=>{
 const w=setup(),a=enemy(w,360,sourceY),b=enemy(w,420,targetY);a.hp=1;shot(w,a);expect(w.capacitorTransfers).toBe(0);expect(b.capacitorHits).toBeUndefined();
});
it('uses the finite 220 range including the boundary, without banking a charge when no recipient is reachable',()=>{
 for(const dx of[220,221]){const w=setup(),a=enemy(w,300),b=enemy(w,300+dx);a.hp=1;shot(w,a);expect(w.capacitorTransfers).toBe(dx===220?1:0);expect(b.capacitorHits??0).toBe(dx===220?1:0);}
});
it('a previously charged closed shield can preserve its old cell but cannot create a new one on a blocked arc hit',()=>{
 const w=setup(),a=w.spawn('guard',360,600),b=enemy(w,450);a.speed=0;a.timer=999;a.capacitorHits=1;a.hp=1;shot(w,a);expect(b.capacitorHits).toBe(1);expect(w.capacitorRecovered).toBe(1);expect(w.capacitorBursts).toBe(0);
});
