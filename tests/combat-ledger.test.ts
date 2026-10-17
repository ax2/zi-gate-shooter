import{it,expect}from'vitest';
import{CombatLedger}from'../src/core/combat-ledger';
import{World}from'../src/core/world';
import{C}from'../src/core/config';
import{combatContribution}from'../src/game/combat-contribution';

it('caps damage at removed HP, counts final blows once and returns independent snapshots',()=>{
 const ledger=new CombatLedger();ledger.record('scatter',100,80);ledger.record('storm',80,-50);ledger.record('storm',0,-50);ledger.record('arc',3,3);ledger.record('arc',NaN,0);
 expect(ledger.snapshot()).toEqual([{source:'scatter',damage:20,contacts:1,kills:0},{source:'storm',damage:80,contacts:1,kills:1}]);
 ledger.snapshot()[0].damage=999;expect(ledger.snapshot()[0].damage).toBe(20);expect(new CombatLedger().snapshot()).toEqual([]);
});
function setup(){const w=new World();(w as any).scheduled=[];w.player.x=w.player.px=68;return w;}
let id=206000;
function fire(w:World,x=360,damage=10,kind:'pulse'|'scatter'|'pierce'='pulse',hops=0){w.bullets=[{id:id++,x,y:600,px:x,py:600,vx:0,vy:0,damage,age:0,active:true,hostile:false,weaponKind:kind,chainHops:hops}];w.step(C.step,68);return w.drainEffects();}
function enemy(w:World,x=360,hp=1000){const b=w.spawn('armor',x,600);b.hp=b.maxHp=hp;b.timer=999;b.speed=0;return b;}
it('real bullet collisions ignore crate/gate/protection and cap an enemy overkill to its remaining HP',()=>{
 for(const kind of ['crate','gate']as const){const w=setup(),b=w.spawn(kind,360,600);b.speed=0;fire(w);expect(w.combatContributions()).toEqual([]);}
 const w=setup(),b=enemy(w,360,3);b.dropGrace=2;fire(w);expect(w.combatContributions()).toEqual([]);b.dropGrace=0;fire(w,360,100);expect(w.combatContributions()).toEqual([{source:'pulse',damage:3,contacts:1,kills:1}]);fire(w,360,100);expect(w.combatContributions()[0].kills).toBe(1);
});
it.each([undefined,0]as const)('actual closed guard variant %s contributes only the HP removed',shieldTurn=>{
 const w=setup(),b=w.spawn('guard',360,600);b.shieldTurn=shieldTurn;b.age=0;b.timer=999;b.speed=0;fire(w,360,10);const damage=shieldTurn===undefined?5:2;expect(b.hp).toBe(64-damage);expect(w.combatContributions()[0].damage).toBe(damage);
});
it('derived storm jump is separate from its parent pellet, without duplicating damage',()=>{
 const w=setup(),a=enemy(w),b=enemy(w,450);w.build.ranks.ballistic=3;w.build.ranks.electric=1;fire(w,360,10,'scatter',1);
 expect(a.hp).toBe(990);expect(b.hp).toBe(993.5);expect(w.combatContributions()).toEqual([{source:'scatter',damage:10,contacts:1,kills:0},{source:'storm',damage:6.5,contacts:1,kills:0}]);
 const report=combatContribution(w);expect(report.total).toBe(16.5);expect(report.rows.reduce((s,r)=>s+r.share,0)).toBeCloseTo(1);expect(report.rows.map(r=>r.name)).toContain('雷暴霰射');
});
it('real fracture kill-wave credits the parent kill and derived rear damage separately',()=>{
 const w=setup();w.build.ranks.ballistic=3;w.build.fractureAugment='fracture-line';(w as any).weaponStages.set('pierce',2);(w as any).weaponStages.set('blast',2);
 const a=enemy(w,360,3),rear=enemy(w);rear.y=rear.py=450;fire(w,360,10,'pierce');
 expect(a.active).toBe(false);expect(rear.hp).toBe(992.5);expect(w.combatContributions().find(r=>r.source==='pierce')).toMatchObject({damage:3,kills:1});expect(w.combatContributions().find(r=>r.source==='fracture')).toMatchObject({damage:7.5,contacts:1});
});
it('actual laser is not attributed to cosmetic pulse identity; reports are read-only and new World resets',()=>{
 const w=setup(),b=enemy(w,68);w.build.ranks.optical=1;w.step(C.step,68);expect(b.hp).toBeLessThan(1000);expect(w.combatContributions().find(r=>r.source==='laser')?.damage).toBeGreaterThan(0);
 const before=JSON.stringify(w),saved=w.combatContributions();combatContribution(w);expect(JSON.stringify(w)).toBe(before);expect(w.combatContributions()).toEqual(saved);expect(new World().combatContributions()).toEqual([]);
});
