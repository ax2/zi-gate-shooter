import {it,expect} from 'vitest';
import {World,type Body} from '../src/core/world';
import {C} from '../src/core/config';
import {ION_STORM} from '../src/core/ion-storm';
function setup(rank=3){const w=new World();w.phase='boss';w.player.x=w.player.px=68;w.growth.mastery=rank;for(let i=0;i<rank;i++)w.chooseBuild('electric');return w;}
function enemy(w:World,x=360,kind:'armor'|'guard'|'elite'='armor'){const b=w.spawn(kind,x,600);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;}
function shot(w:World,b:Body,hops=0,damage=10){w.bullets=[{id:99999,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage,age:0,active:true,hostile:false,weaponKind:'arc',chainHops:hops}];w.step(C.step,68);return w.drainEffects();}
it('third node adds an actual bounded area discharge and retains existing guns and jump damage',()=>{
 const w=setup(),a=enemy(w),b=enemy(w,460),far=enemy(w,600),gate=w.spawn('gate',490,620),crate=w.spawn('crate',450,630);
 for(let i=0;i<5;i++)shot(w,a);expect(w.ionCharge).toBe(5);expect(w.ionBursts).toBe(0);
 const events=shot(w,a);expect(w.ionBursts).toBe(1);expect(w.ionCharge).toBe(0);expect(w.ionHits).toBe(2);
 expect(a.hp).toBe(928);expect(b.hp).toBe(988);expect(far.hp).toBe(1000);expect(gate.energy).toBe(0);expect(crate.hp).toBe(crate.maxHp);
 expect(events.filter(e=>e.type==='ion-storm')).toHaveLength(1);expect(w.activeWeapons).toEqual(['pulse','arc']);expect(w.build.ranks.electric).toBe(3);
 const low=setup(2),target=enemy(low);for(let i=0;i<12;i++)shot(low,target);expect(low.ionBursts).toBe(0);expect(low.ionCharge).toBe(0);
});
it('real chain damage charges the storm, blocked shields and derived discharge do not recurse',()=>{
 const w=setup(),a=enemy(w,260),b=enemy(w,360),c=enemy(w,460);const shield=enemy(w,560,'guard');
 for(let i=0;i<2;i++)shot(w,a,3);
 expect(w.arcLinks).toBeGreaterThanOrEqual(4);expect(w.ionBursts).toBe(1);expect(w.ionCharge).toBe(0);expect(w.ionHits).toBeGreaterThan(0);
 expect(shield.capacitorHits).toBeUndefined();expect(shield.hp).toBeGreaterThan(980);expect(b.hp).toBeLessThan(984);expect(c.hp).toBeLessThan(987.2);
});
it('closed shields, entry immunity and reward contacts never fill the circuit',()=>{
 for(const kind of ['guard','gate','crate','armor'] as const){
  const w=setup();const b=kind==='guard'||kind==='armor'?enemy(w,360,kind):w.spawn(kind,360,600);b.hp=b.maxHp=1000;b.speed=0;
  if(kind==='armor')b.dropGrace=1;
  for(let i=0;i<8;i++)shot(w,b);expect(w.ionCharge).toBe(0);expect(w.ionBursts).toBe(0);
 }
});
it('a real storm kill grants normal elite rewards once and never charges crates or gates',()=>{
 const w=setup(),a=enemy(w),elite=enemy(w,450,'elite');for(let i=0;i<5;i++)shot(w,a);elite.hp=11;
 const events=shot(w,a);expect(w.kills).toBe(1);expect(w.ionHits).toBe(2);expect(w.growth.energy).toBe(C.killCharge.elite);
 expect(events.filter(e=>e.type==='kill')).toHaveLength(1);shot(w,a);expect(w.kills).toBe(1);expect(w.growth.energy).toBe(C.killCharge.elite);
});
it('same-frame contacts cannot bypass cooldown, stored charge waits for a new real impact',()=>{
 const w=setup(),a=enemy(w);for(let i=0;i<24;i++)shot(w,a);
 expect(w.ionBursts).toBe(1);expect(w.ionCharge).toBe(ION_STORM.hits);
 for(let i=0;i<50;i++){w.step(C.step,68);w.drainEffects();}expect(w.ionBursts).toBe(1);
 shot(w,a);expect(w.ionBursts).toBe(2);expect(w.ionCharge).toBe(0);
 expect(new World().ionCharge).toBe(0);expect(new World().ionBursts).toBe(0);
});
it('a lethal impact holds a full circuit when no eligible target remains',()=>{
 const w=setup(),a=enemy(w);for(let i=0;i<5;i++)shot(w,a);a.hp=1;shot(w,a);
 expect(w.ionCharge).toBe(6);expect(w.ionBursts).toBe(0);
 const b=enemy(w);shot(w,b);expect(w.ionBursts).toBe(1);expect(w.ionHits).toBe(1);expect(w.ionCharge).toBe(0);
});
it('a boss killed by the discharge ends it before cleared escorts can award phantom deaths',()=>{
 const w=setup(),a=enemy(w);for(let i=0;i<5;i++)shot(w,a);
 const boss=w.spawn('boss',400,600);boss.hp=11;boss.timer=999;const escort=enemy(w,450,'elite');escort.hp=11;
 shot(w,a);expect(w.bossWins).toBe(1);expect(w.kills).toBe(1);expect(escort.hp).toBe(11);expect(w.phase).toBe('recovery');
 expect(w.ionHits).toBe(2);expect(w.growth.energy).toBe(C.killCharge.boss);
});
