import {expect,it} from 'vitest';
import {World,type Body} from '../src/core/world';
import {C} from '../src/core/config';
import type {ElectricBranch} from '../src/core/build-tree';
function setup(branch:ElectricBranch='capacitor') {const w=new World();w.growth.mastery=2;w.chooseBuild('electric');w.chooseBuild('electric',branch);return w;}
function enemy(w:World,x=360,y=600,kind:'armor'|'guard'|'boss'='armor'){const b=w.spawn(kind,x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;}
function shot(w:World,b:Body,kind:'arc'|'scatter'='arc',damage=10,hops=0){w.bullets=[{id:999999,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage,age:0,active:true,hostile:false,weaponKind:kind,chainHops:hops}];w.step(C.step,68);return w.drainEffects();}
it('spends one immutable fork, preserves direct damage and all weapons, and keeps the final node',()=>{
 for(const branch of ['spread','capacitor','seeker'] as const){const w=new World();w.growth.mastery=3;w.chooseBuild('electric');const damage=w.profileFor('arc').damage;const owned=[...w.activeWeapons];
 expect(w.chooseBuild('electric',branch)).toBe(true);expect(w.build.spent).toBe(2);expect(w.build.electricBranch).toBe(branch);expect(w.profileFor('arc').damage).toEqual(damage);expect(w.activeWeapons).toEqual(owned);
 expect(w.profileFor('arc').chainHops).toBe(branch==='spread'?3:2);expect(w.chooseBuild('electric',branch==='spread'?'capacitor':'spread')).toBe(false);expect(w.build.spent).toBe(2);
 expect(w.chooseBuild('electric')).toBe(true);expect(w.build.ranks.electric).toBe(3);expect(w.build.electricBranch).toBe(branch);
 }
 const w=new World();w.growth.mastery=4;expect(w.chooseBuild('electric','capacitor')).toBe(false);w.chooseBuild('electric');expect(w.chooseBuild('electric','burn')).toBe(false);expect(w.build.spent).toBe(1);
});
it('capacitor needs three direct hits on the same surviving target and adds exact nonrecursive single damage',()=>{
 const w=setup(),a=enemy(w),b=enemy(w,450),gate=w.spawn('gate',500,650),crate=w.spawn('crate',550,650);
 shot(w,a);expect(a.capacitorHits).toBe(1);shot(w,b);shot(w,a);expect(a.capacitorHits).toBe(2);expect(b.capacitorHits).toBe(1);
 const events=shot(w,a);expect(a.hp).toBe(950);expect(b.hp).toBe(990);expect(a.capacitorHits).toBe(0);expect(w.capacitorBursts).toBe(1);expect(events.filter(e=>e.type==='capacitor')).toHaveLength(1);
 expect(gate.energy).toBe(0);expect(crate.hp).toBe(crate.maxHp);expect(w.fractureBursts).toBe(0);expect(w.build.spent).toBe(2);
 shot(w,a);expect(w.capacitorBursts).toBe(1);expect(a.capacitorHits).toBe(1);
});
it('chain victims and storm scatter do not accumulate direct-hit charge',()=>{
 const w=setup(),a=enemy(w),b=enemy(w,450);for(let i=0;i<3;i++)shot(w,a,'arc',10,2);
 expect(w.capacitorBursts).toBe(1);expect(b.capacitorHits).toBeUndefined();expect(b.hp).toBeCloseTo(1000-19.5);
 for(let i=0;i<3;i++)shot(w,b,'scatter',10,1);expect(b.capacitorHits).toBeUndefined();expect(w.capacitorBursts).toBe(1);
});
it('closed shields, rewards, off-strip and entry bosses never accumulate or detonate',()=>{
 for(const kind of ['guard','gate','crate','armor','boss'] as const){const w=setup();const b=kind==='gate'||kind==='crate'?w.spawn(kind,360,600):enemy(w,360,kind==='armor'?200:600,kind);b.speed=0;b.timer=999;b.hp=b.maxHp=1000;
 if(kind==='boss')w.phase='boss-entry';for(let i=0;i<4;i++)shot(w,b);expect(b.capacitorHits).toBeUndefined();expect(w.capacitorBursts).toBe(0);}
});
it('a lethal third direct hit gives only the original real death reward without a phantom discharge',()=>{
 const w=setup(),a=enemy(w);shot(w,a);shot(w,a);a.hp=1;const before=w.kills;const events=shot(w,a);expect(w.kills).toBe(before+1);expect(w.capacitorBursts).toBe(0);expect(events.filter(e=>e.type==='kill')).toHaveLength(1);
});
it('spread reaches an extra real enemy over a 200px gap while capacitor keeps the old chain',()=>{
 for(const branch of ['spread','capacitor'] as const){const w=setup(branch),targets=[100,300,500,600].map(x=>enemy(w,x));
 shot(w,targets[0],'arc',10,w.profileFor('arc').chainHops);expect(targets[2].hp).toBeLessThan(1000);expect(targets[3].hp).toBe(branch==='spread'?1000-10*.65**3:1000);expect(w.capacitorBursts).toBe(0);}
});

it('a real capacitor kill awards one elite death and normal charge without rewarding the buildup',()=>{
 const w=setup(),b=w.spawn('elite',360,600);b.hp=b.maxHp=35;b.speed=0;b.timer=999;
 shot(w,b);shot(w,b);expect(w.growth.energy).toBe(0);const events=shot(w,b);
 expect(w.capacitorBursts).toBe(1);expect(w.kills).toBe(1);expect(w.growth.energy).toBe(C.killCharge.elite);expect(events.filter(e=>e.type==='kill')).toHaveLength(1);
 shot(w,b);expect(w.kills).toBe(1);expect(w.growth.energy).toBe(C.killCharge.elite);
});


it('seeker skips a closer screen to hit a charging rear gun beyond ordinary range, then returns to 220',()=>{
 const w=setup('seeker'),front=enemy(w,150,760),screen=enemy(w,200,760);
 const rear=w.spawn('sniper',150,450);rear.hp=rear.maxHp=1000;rear.speed=0;rear.warning=1;rear.timer=10;
 const distant=enemy(w,150,190); // off strip is never a candidate
 const events=shot(w,front,'arc',10,w.profileFor('arc').chainHops);
 expect(front.hp).toBe(990);expect(rear.hp).toBeCloseTo(993.5);expect(screen.hp).toBe(1000);expect(distant.hp).toBe(1000);
 const jumps=events.filter(e=>e.type==='arc');expect(jumps).toHaveLength(1);expect(jumps[0].seeker).toBe(true);expect(jumps[0].targetY).toBe(rear.y);expect(w.seekerLinks).toBe(1);
 expect(w.capacitorBursts).toBe(0);expect(w.profileFor('arc').chainHops).toBe(2);
});
it('seeker prioritizes visible charging guns over idle guns and otherwise uses stable distance order',()=>{
 const w=setup('seeker'),front=enemy(w,360,700),idle=enemy(w,400,650),ready=enemy(w,600,520);ready.warning=1;ready.timer=10;
 let e=shot(w,front,'arc',10,1).find(e=>e.type==='arc');expect(e?.targetX).toBe(ready.x);
 ready.warning=0;e=shot(w,front,'arc',10,1).find(e=>e.type==='arc');expect(e?.targetX).toBe(idle.x);
});
it('seeker does not unlock storm scatter long jumps or reach reward targets, entry protection or out of range',()=>{
 for(const kind of ['gate','crate','armor'] as const){const w=setup('seeker'),front=enemy(w,150,750);const b=w.spawn(kind,150,450);b.speed=0;b.hp=b.maxHp=1000;b.timer=10;if(kind==='armor')b.dropGrace=.45;
 shot(w,front,'arc',10,1);expect(b.hp).toBe(1000);expect(b.energy).toBe(0);expect(w.seekerLinks).toBe(0);}
 const w=setup('seeker'),front=enemy(w,150,750),rear=enemy(w,150,400);shot(w,front,'arc',10,1);expect(rear.hp).toBe(1000);
 rear.y=450;rear.py=450;shot(w,front,'scatter',10,1);expect(rear.hp).toBe(1000);expect(w.seekerLinks).toBe(0);
});
it('a closed primary shield blocks seeker and an actual rear kill awards exactly the original reward',()=>{
 const w=setup('seeker'),shield=enemy(w,150,750,'guard'),rear=enemy(w,150,450);shot(w,shield,'arc',10,2);expect(rear.hp).toBe(1000);expect(w.seekerLinks).toBe(0);
 shield.active=false;const front=enemy(w,150,750);rear.hp=1;const before=w.growth.energy;const e=shot(w,front,'arc',10,1);expect(w.kills).toBe(1);expect(w.growth.energy-before).toBe(0);expect(e.filter(e=>e.type==='kill')).toHaveLength(1);expect(w.seekerLinks).toBe(1);
});
