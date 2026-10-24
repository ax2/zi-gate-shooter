import{it,expect}from'vitest';
import{mainGunState,mainGunPorts,mainGunActivity,mainPickupLabel,mainNextLabel}from'../src/flight/pickup-growth';
import{FlightWorld,F,type Enemy}from'../src/flight/world';
import{flightProfile,projectTechnology}from'../src/flight/profile';
import{flightChoiceHarness}from'./helpers/flight-choice-harness';

it.each([[0,1,1,3],[3,2,2,9],[9,3,3,24],[24,4,4,60],[60,5,5,120],[120,5,6,180],[180,5,7,240],[1000,5,20,1020]])('%s collected gives %s real ports / rank%s and an honest next threshold%s',(parts,count,rank,next)=>{
 const s=mainGunState(parts);expect(s).toMatchObject({count,rank,next,remaining:next-parts});expect(mainGunPorts(s.count)).toHaveLength(count);expect(s.progress).toBeCloseTo(parts===1000?2/3:0);expect(s.progress).toBeGreaterThanOrEqual(0);expect(s.progress).toBeLessThan(1);
});
it('collection never lowers an existing cannon and repeated growth adds base coefficient rather than secretly multiplying all weapon DPS',()=>{
 let old=mainGunState(0);for(let n=1;n<=1000;n++){const s=mainGunState(n);expect(s.count).toBeGreaterThanOrEqual(old.count);expect(s.count).toBeLessThanOrEqual(5);expect(s.rank).toBeGreaterThanOrEqual(old.rank);expect(s.damageFactor).toBeGreaterThan(old.damageFactor);old=s;}
 expect(mainGunState(120).damageFactor-mainGunState(119).damageFactor).toBeCloseTo(.12+.05*Math.log2(121/120));
 expect(mainGunState(NaN).collected).toBe(0);expect(mainGunState(Infinity).collected).toBe(0);expect(mainGunState(-8).collected).toBe(0);expect(mainGunState(23.9).count).toBe(3);
 expect(mainNextLabel(mainGunState(23))).toBe('再拾 1 份 → 4路');expect(mainNextLabel(mainGunState(119))).toBe('再拾 1 份 → Lv6');
});
function arena(){const w=new FlightWorld(1337);for(const key of['spawnTimer','shotTimer','arcTimer','laserTimer','railTimer','empTimer','sunTimer'])(w as any)[key]=100000;return w;}
function collect(w:FlightWorld,n:number){(w as any).addDrop(w.player.x,w.player.y,'coil',n);w.step(F.step);}
function shoot(w:FlightWorld){w.bullets=[];(w as any).shotTimer=0;w.step(F.step);return w.bullets.filter(b=>b.style==='pulse');}
it.each([24,60,120,180])('%s real collected material yields its actual volley damage and source ports, preserving old equipment and wallet',n=>{
 const w=arena();w.start('split');collect(w,n);const p=flightProfile(w.assembly),b=shoot(w);expect(b).toHaveLength(p.guns.count);expect(b.map(b=>b.port)).toEqual(b.map((_,i)=>i));expect(b.map(b=>b.x)).toEqual(mainGunPorts(p.guns.count).map(x=>w.player.x+x));
 const e:Enemy={id:90000,kind:'sentry',x:360,y:900,px:360,py:900,hp:10000,maxHp:10000,r:45,age:2,timer:100000,angle:0,seed:0,burn:0,burnTick:0,hit:0};w.enemies.push(e);for(let f=0;f<6;f++)w.step(F.step);expect(10000-e.hp).toBeCloseTo(p.guns.count*p.guns.damage);expect(w.contribution.guns).toBeCloseTo(p.guns.count*p.guns.damage);expect(w.assembly.has('split')).toBe(true);expect(w.assembly.inventory.coil).toBe(n);
});
it('the periodic rank awards exactly once for a real crossing, repeated frames/expired loot/repairs cannot fabricate it and spending cannot revoke it',()=>{
 const w=arena();w.start('coil');collect(w,119);w.drainEvents();const before=flightProfile(w.assembly);collect(w,1);const after=flightProfile(w.assembly);expect(after.main.rank).toBe(6);expect(after.guns.damage).toBeGreaterThan(before.guns.damage);expect(w.drainEvents().filter(e=>e.type==='upgrade')).toHaveLength(1);
 for(let f=0;f<60;f++)w.step(F.step);expect(w.drainEvents().filter(e=>e.type==='upgrade')).toHaveLength(0);const stable=flightProfile(w.assembly);expect(w.install('coil')).toBe(true);expect(w.assembly.salvage).toBe(120);expect(flightProfile(w.assembly).main).toEqual(stable.main);expect(w.assembly.installed.size).toBe(1);expect(projectTechnology(w.assembly,'seekorb')?.before.main).toEqual(stable.main);
 (w as any).addDrop(w.player.x,w.player.y,'repair',1);w.step(F.step);expect(w.assembly.salvage).toBe(120);
});
it('a saturated projectile budget never invents flashes or extra rounds for blocked ports',()=>{
 const w=arena();collect(w,60);for(let n=0;n<F.bulletLimit-2;n++)(w as any).bullet(300,500,0,-1,1,false,'wing');(w as any).shotTimer=0;w.step(F.step);
 const actual=w.bullets.filter(b=>b.style==='pulse'),poses=mainGunActivity(5,w.bullets);expect(actual).toHaveLength(2);expect(actual.map(b=>b.port)).toEqual([0,1]);expect(poses.filter(p=>p.firing).map(p=>p.port)).toEqual([0,1]);expect(w.bullets.length).toBe(F.bulletLimit);
});
it('rounded-equal microscopic gains remain positive and explicit while real barrel/rank changes keep their identities',()=>{
 expect(mainPickupLabel({beforeCount:3,afterCount:3,beforeDamage:9.58,afterDamage:9.58003})).toContain('每发 +0.00003');
 expect(mainPickupLabel({beforeCount:3,afterCount:4,beforeDamage:8,afterDamage:8.1})).toBe('主炮 3→4路');
 expect(mainPickupLabel({beforeCount:5,afterCount:5,beforeRank:5,afterRank:6,beforeDamage:10,afterDamage:10.85})).toContain('Lv5→6');
 expect(mainPickupLabel({beforeCount:5,afterCount:5,beforeDamage:10,afterDamage:10})).toContain('回收已记录');
});
it('normal earned play reaches fourth/fifth real guns and routes sound stages correctly, with freeze and restart keeping the same rule',async()=>{
 const h=await flightChoiceHarness(),r=h.r;r.activate('start:split');expect(h.firstChoice()).toBe(true);r.activate('upgrade-choice:hive');
 for(let f=0;f<180*60&&r.world.phase!=='dead'&&!h.sounds.some(e=>e.type==='fire'&&e.stage===5);f++){if(r.mode==='upgrade')r.activate('upgrade-bank');h.tick();}
 expect(r.world.player.hp).toBeGreaterThan(0);expect(r.world.assembly.salvage).toBeGreaterThanOrEqual(60);expect(h.sounds.some(e=>e.type==='fire'&&e.stage===4)).toBe(true);expect(h.sounds.some(e=>e.type==='fire'&&e.stage===5)).toBe(true);expect(h.sounds.filter(e=>e.type==='fire').every(e=>e.stage!==undefined&&e.stage>=1&&e.stage<=5)).toBe(true);
 r.activate('pause');const before=r.world.diagnostics();r.activate('weak');r.resize(1100,800,1);for(let f=0;f<120;f++)h.tick(false);expect(r.world.diagnostics()).toEqual(before);r.activate('home');r.activate('start:coil');expect(r.world.diagnostics().mainGun).toMatchObject({rank:1,count:1,collected:0,next:3});
});
