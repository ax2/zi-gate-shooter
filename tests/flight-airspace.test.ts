import {it,expect} from 'vitest';
import {FlightWorld,F,type Enemy} from '../src/flight/world';
import {airspacePlan,airspaceFormation,maneuverPose,maneuverMuzzle} from '../src/flight/airspace';

// Isolated rule fixtures, not normal progression or human difficulty evidence.
const core=(w:FlightWorld)=>w as any;
function scene(sector=0){const w=new FlightWorld(1337);w.start('split');w.sector=sector;core(w).wave=1;core(w).spawnTimer=1e6;return w;}
function squad(w:FlightWorld){core(w).spawnWave();core(w).spawnTimer=1e6;return w.enemies.filter(e=>e.maneuver);}
it('three chapter families keep distinct maneuver rules, with nine named rotations before repeating',()=>{
 const plans=Array.from({length:9},(_,i)=>airspacePlan(i));expect(new Set(plans.map(p=>p.name)).size).toBe(9);expect(plans.map(p=>p.kind)).toEqual(['sweep','cross','orbit','sweep','cross','orbit','sweep','cross','orbit']);expect(airspacePlan(9)).toEqual(airspacePlan(0));
});
it.each(Array.from({length:9},(_,i)=>i))('sector%s enters continuously, crosses real two-dimensional space and eventually leaves',sector=>{
 for(const side of[-1,1]){const specs=airspaceFormation(sector,side);expect(specs).toHaveLength(3);const moving=specs.filter(s=>s.maneuver);expect(moving.length).toBeGreaterThan(0);
  for(const spec of moving){const m=spec.maneuver!,start=maneuverPose(m,0);expect(start.x).toBeCloseTo(spec.x);expect(start.y).toBe(spec.y);const before=maneuverPose(m,m.entryTime-1e-5),after=maneuverPose(m,m.entryTime+1e-5);expect(Math.hypot(after.x-before.x,after.y-before.y)).toBeLessThan(.01);const xs=[];for(let t=0;t<12;t+=.1){const p=maneuverPose(m,t);expect(Number.isFinite(p.x)&&Number.isFinite(p.y)).toBe(true);expect(p.x).toBeGreaterThanOrEqual(32);expect(p.x).toBeLessThanOrEqual(688);xs.push(p.x);}expect(Math.max(...xs)-Math.min(...xs)).toBeGreaterThan(150);expect(maneuverPose(m,30).y).toBeGreaterThan(1390);}
 }
});
it('a full roster postpones a whole formation without spending a wave, then admits exactly three ships',()=>{
 const w=scene();for(let i=0;i<F.enemyLimit-2;i++)core(w).spawn('drone',60,300);core(w).spawnWave();expect(w.enemies).toHaveLength(24);expect(core(w).wave).toBe(1);expect(w.airspaceFormations).toBe(0);expect(core(w).spawnTimer).toBe(.35);w.enemies.pop();core(w).spawnWave();expect(w.enemies).toHaveLength(26);expect(core(w).wave).toBe(2);expect(w.airspaceFormations).toBe(1);
});
it('one of each four wave slots is a replacement, never an extra same-frame wave',()=>{
 const w=scene();core(w).wave=0;const slots=[];for(let i=1;i<=10;i++){w.enemies=[];const before=w.airspaceFormations;core(w).spawnWave();if(w.airspaceFormations>before){slots.push(i);expect(w.enemies).toHaveLength(3);}}expect(slots).toEqual([2,6,10]);
});
it.each([[0,40,4],[1,10,4],[3,10,6],[3,40,7]])('sector%s at%s keeps%s physical slots instead of thinning later waves', (sector,time,count)=>{
 const w=scene(sector);w.sectorTime=time;squad(w);expect(w.enemies).toHaveLength(count);expect(w.airspaceFormations).toBe(1);expect(w.enemies.some(e=>e.maneuver)).toBe(true);
});
it.each([[0,3],[1,2],[2,6]]as const)('sector%s has a real distinct hostile burst of%s from its moving body', (sector,count)=>{
 const w=scene(sector),e=squad(w)[0];e.x=360;e.y=350;e.px=357;w.bullets=[];core(w).enemyShot(e);const shots=w.bullets.filter(b=>b.hostile),origin=maneuverMuzzle(e);expect(shots).toHaveLength(count);expect(shots.every(b=>b.sourceEnemy===e.id&&b.x===origin.x&&b.y===origin.y&&b.life===9)).toBe(true);expect(new Set(shots.map(b=>Math.atan2(b.vy,b.vx).toFixed(3))).size).toBe(count);expect(w.airspaceShots).toBe(count);
});
it.each([0,1,2])('sector%s first actual shot occurs after visible entry and a local warm-up',sector=>{
 const w=scene(sector),e=squad(w)[0];for(const key of['shotTimer','arcTimer','laserTimer','railTimer','empTimer','sunTimer'])core(w)[key]=1e6;let visible=-1,first=-1;
 for(let i=0;i<7*60;i++){w.step(F.step,45,1100);w.drainEvents();if(e.y>155&&visible<0)visible=w.time;if(w.bullets.some(b=>b.sourceEnemy===e.id)){first=w.time;break;}}
 expect(visible).toBeGreaterThan(0);expect(first-visible).toBeGreaterThan(.7);expect(first-visible).toBeLessThan(1.5);expect(e.y).toBeGreaterThan(155);
});
it('a moving intercept fighter actually fires during normal stepping, while an ordinary diver remains a contact attacker',()=>{
 const w=scene(1),e=squad(w)[0];e.age=e.maneuver!.entryTime+1;e.timer=0;core(w).shotTimer=1e6;w.step(F.step,45,1100);expect(w.bullets.filter(b=>b.sourceEnemy===e.id)).toHaveLength(2);
 const ordinary=scene(1);core(ordinary).shotTimer=1e6;const d=core(ordinary).spawn('diver',360,400)as Enemy;d.timer=0;ordinary.step(F.step,45,1100);expect(ordinary.bullets.filter(b=>b.hostile)).toHaveLength(0);
});
it('rotating and sweeping patterns change their actual next volley rather than drawing projected paths',()=>{
 for(const sector of[0,2]){const w=scene(sector),e=squad(w)[0];e.x=360;e.px=360;e.y=400;core(w).enemyShot(e);const first=w.bullets.map(b=>[b.vx,b.vy]);w.bullets=[];core(w).enemyShot(e);expect(w.bullets.map(b=>[b.vx,b.vy])).not.toEqual(first);expect(w.effects.some(f=>f.hostile)).toBe(false);}
});
it('only admitted rounds count and hostile capacity cannot be exceeded',()=>{
 const w=scene(),e=squad(w)[0];e.x=360;e.y=400;for(let i=0;i<F.hostileLimit-2;i++)core(w).bullet(40,300,0,100,1,true);core(w).enemyShot(e);expect(w.bullets.filter(b=>b.hostile)).toHaveLength(F.hostileLimit);expect(w.airspaceShots).toBe(2);core(w).enemyShot(e);expect(w.airspaceShots).toBe(2);
});
it('planned positions and HP do not read player firepower or remove old components',()=>{
 const a=scene(),b=scene();Object.assign(b.assembly.inventory,{alloy:100,coil:100,lens:100});b.install('coil');b.install('laser');const old=[...b.assembly.installed];const ea=squad(a),eb=squad(b);expect(eb.map(e=>[e.hp,e.x,e.y,e.maneuver])).toEqual(ea.map(e=>[e.hp,e.x,e.y,e.maneuver]));expect([...b.assembly.installed]).toEqual(old);
});
it('departed maneuver ships are removed and a delayed formation cannot block the flagship',()=>{
 const w=scene(2),members=squad(w);for(const e of members){e.age=30;e.timer=1e6;}w.step(F.step,45,1100);expect(w.enemies.some(e=>members.includes(e))).toBe(false);
 const full=scene();for(let i=0;i<F.enemyLimit;i++)core(full).spawn('drone',60,-80);core(full).spawnWave();full.sectorTime=60;full.step(F.step);expect(full.phase).toBe('running');full.enemies.pop();full.step(F.step);expect(full.phase).toBe('boss');expect(full.enemies.some(e=>e.kind==='boss')).toBe(true);
});
it('shooting maneuver ships uses the existing actual kill, score and physical-drop pipeline',()=>{
 const w=scene(),ships=squad(w);const wallet={...w.assembly.inventory};for(const e of ships){e.x=500;e.y=700;core(w).hit(e,1e6,'guns');}expect(w.kills).toBe(ships.length);expect(w.score).toBe(ships.length*80);expect(w.assembly.inventory).toEqual(wallet);expect(w.contribution.guns).toBeGreaterThan(0);expect(w.enemies.filter(e=>e.maneuver&&e.hp>0)).toHaveLength(0);
});
