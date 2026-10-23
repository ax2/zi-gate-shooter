import{it,expect}from'vitest';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';import sharp from'sharp';
import{ImpactLedger,impactFrame,impactPoses,impactRules}from'../src/flight/impacts';
import{FlightWorld,F,type Enemy}from'../src/flight/world';
import{flightChoiceHarness}from'./helpers/flight-choice-harness';

it('the original impact atlas is alpha-preserved, cell-safe and exactly matches the runtime export record',async()=>{
 const source=await readFile('art/source/flight-impacts-v1.png'),asset=await readFile('public/assets/flight-impacts-v1.png'),record=JSON.parse(await readFile('art/flight-impacts-v1.json','utf8')),meta=await sharp(asset).metadata();
 expect(meta.width).toBe(768);expect(meta.height).toBe(512);expect(meta.hasAlpha).toBe(true);
 expect(createHash('sha256').update(source).digest('hex')).toBe(record.sourceSha256);expect(createHash('sha256').update(asset).digest('hex')).toBe(record.sha256);
 expect(record.frames).toHaveLength(6);expect(record.frames.every((f:{edge:number;visible:number})=>f.edge===0&&f.visible>0)).toBe(true);
});
it.each([['hive',0],['needles',1],['electrodes',2],['seekorb',2],['tracker',3],['starhive',4],['plasmacore',4],['blades',5],['bladewave',5]]as const)('%s real damage source chooses visual family%s', (source,frame)=>expect(impactFrame(source)).toBe(frame));
it('unknown, zero and nonfinite damage cannot create a hit; independent callers receive copies',()=>{
 const ledger=new ImpactLedger(),at={id:1,x:300,y:500};expect(ledger.hit(at,'enemy',20,false)).toBe(false);expect(ledger.hit(at,'guns',0,false)).toBe(false);expect(ledger.hit(at,'guns',NaN,false)).toBe(false);
 expect(ledger.hit(at,'guns',7,false)).toBe(true);const view=ledger.snapshot();view[0].x=999;expect(ledger.snapshot()[0].x).toBe(300);
});
it('rapid same-family contacts are bounded without extending age; lethal hit still gets its own visual and every frame expires',()=>{
 const l=new ImpactLedger(),at={id:1,x:300,y:500};l.hit(at,'coil',18,false);l.step(.04);expect(l.hit(at,'electrodes',17,false)).toBe(false);expect(l.snapshot()[0].age).toBe(.04);
 expect(l.hit(at,'coil',18,true)).toBe(true);for(let id=2;id<200;id++)l.hit({...at,id},'starhive',100000,false);
 expect(l.snapshot()).toHaveLength(impactRules.limit);expect(l.snapshot().every(e=>e.size<=impactRules.maxSize)).toBe(true);l.step(1);expect(l.snapshot()).toHaveLength(0);
});
it('reduced mode bounds detail but cannot mutate or lengthen the real records',()=>{
 const l=new ImpactLedger();for(let id=1;id<40;id++)l.hit({id,x:300,y:500},'tracker',28,false);l.step(.03);const before=l.snapshot(),normal=impactPoses(before,false),weak=impactPoses(before,true);
 expect(weak).toHaveLength(10);expect(normal).toHaveLength(24);expect(weak.every(p=>p.size<impactRules.maxSize&&p.alpha<1)).toBe(true);expect(l.snapshot()).toEqual(before);
});
it('simultaneous base-cannon flashes cannot wash out a real component hit on the same hull',()=>{
 const l=new ImpactLedger(),at={id:1,x:300,y:500};l.hit(at,'tracker',28,false);l.step(.04);l.hit(at,'guns',7,false);l.hit({...at,id:2},'guns',7,false);
 const before=l.snapshot(),poses=impactPoses(before,false);expect(poses).toHaveLength(2);expect(poses.find(p=>p.target===1)?.source).toBe('tracker');expect(poses.find(p=>p.target===2)?.source).toBe('guns');expect(l.snapshot()).toEqual(before);
});
function arena(){const w=new FlightWorld(1337);(w as any).spawnTimer=99999;return w;}
function foe(w:FlightWorld,extra:Partial<Enemy>={}){const e:Enemy={id:9000+w.enemies.length,kind:'sentry',x:360,y:900,px:360,py:900,hp:1000,maxHp:1000,r:28,age:2,timer:999,angle:0,seed:0,burn:0,burnTick:0,hit:0,...extra};w.enemies.push(e);return e;}
it('a missed beam, fully absorbed shield and corpse create no hull impact; real absorbed overflow records only positive hull damage',()=>{
 const w=arena(),e=foe(w,{shield:50,shieldMax:50});(w as any).beam({x:50,y:1000},{x:50,y:200},30,'tracker');expect(w.impacts.snapshot()).toHaveLength(0);
 (w as any).hit(e,20,'coil');expect(w.impacts.snapshot()).toHaveLength(0);(w as any).hit(e,40,'coil');expect(e.hp).toBe(990);expect(w.impacts.snapshot()).toHaveLength(1);expect(w.contribution.coil).toBe(10);
 e.hp=0;(w as any).hit(e,50,'blades');expect(w.impacts.snapshot()).toHaveLength(1);
});
it('a true swept projectile contact gives one source-oriented hit while keeping the actual damage and old spark',()=>{
 const w=arena(),e=foe(w,{y:970,py:970});(w as any).shotTimer=999;const b=(w as any).bullet(360,1010,0,-1200,17,false,'rail',3);b.damageSource='needles';
 for(let i=0;i<5;i++)w.step(F.step);const hits=w.impacts.snapshot().filter(i=>i.source==='needles');expect(hits).toHaveLength(1);expect(hits[0].angle).toBeCloseTo(0);expect(e.hp).toBe(983);expect(w.contribution.needles).toBe(17);expect(w.effects.some(e=>e.kind==='spark')).toBe(true);
});
it('visual saturation cannot consume physical effect slots, serial IDs or game RNG',()=>{
 const w=arena(),e=foe(w),before={serial:(w as any).serial,rng:(w as any).rng,effects:w.effects.length,bullets:w.bullets.length};
 for(let id=0;id<1000;id++)w.impacts.hit({...e,id},'hive',6,false);
 expect({serial:(w as any).serial,rng:(w as any).rng,effects:w.effects.length,bullets:w.bullets.length}).toEqual(before);expect(e.hp).toBe(1000);expect(w.impacts.snapshot()).toHaveLength(24);
});
it.each(['hive','needles','seekorb','electrodes','tracker','blades'])('normally collected/paid %s produces its own real impact then freezes across pause/weak/resize and resets on restart',async base=>{
 const h=await flightChoiceHarness(),r=h.r,column=['hive','needles','seekorb','electrodes','tracker','blades'].indexOf(base)>>1;r.activate('start:'+['split','coil','laser'][column]);expect(h.firstChoice()).toBe(true);expect(r.activate('upgrade-choice:'+base)).toBe(true);
 let found=false;for(let i=0;i<1800&&r.world.phase!=='dead';i++){if(r.mode==='upgrade')r.activate('upgrade-bank');h.tick(true,['electrodes','blades'].includes(base));if(r.world.impacts.snapshot().some(p=>p.source===base)){found=true;break;}}
 expect(found).toBe(true);r.activate('pause');const before=r.world.diagnostics();r.activate('weak');r.resize(1100,800,1);for(let i=0;i<120;i++)h.tick(false);expect(r.world.diagnostics()).toEqual(before);
 r.activate('home');r.activate('start:split');expect(r.world.impacts.snapshot()).toHaveLength(0);
});
