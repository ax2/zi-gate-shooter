import {it,expect} from 'vitest';
import {World,type Body} from '../src/core/world';
import {C} from '../src/core/config';
import {bossFormationFor} from '../src/core/boss-formations';
function battle(round=4,start=360){const w=new World(1337,round);w.phase='boss';w.player.x=start;const b=w.spawn('boss',360,260);b.bossVariant=(round-1)%3;b.attackCycle=[0,2,3][b.bossVariant];return {w,b};}
function frames(w:World,n:number,x=w.player.x){for(let i=0;i<n;i++)w.step(C.step,x);}
let id=100000;
function hit(w:World,b:Body,damage=10000){w.bullets=[];w.bullets.push({id:id++,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage,age:0,active:true,hostile:false,weaponKind:'pulse'});w.step(C.step,68);return w.drainEffects();}
it('keeps the first three rounds unchanged and schedules three authored, bounded late formations',()=>{
 for(let r=1;r<=3;r++){expect(bossFormationFor(r)).toBeUndefined();const {w}=battle(r);frames(w,180,68);expect(w.escortSpawns).toBe(0);}
 expect([4,5,6].map(r=>bossFormationFor(r)?.id)).toEqual(['bulwark','pincer','crossfire']);
 expect(bossFormationFor(7)).toBe(bossFormationFor(4));
 for(let r=4;r<=6;r++)expect(bossFormationFor(r)!.groups.reduce((n,g)=>n+g.troops.length,0)).toBe(2);
});
it('never spawns escorts during boss entry and starts guard supply in live combat',()=>{
 const {w,b}=battle();w.phase='boss-entry';b.y=-150;frames(w,119);expect(w.escortSpawns).toBe(0);
 frames(w,20);expect(w.phase).toBe('boss');expect(w.escortSpawns).toBe(2);expect(w.bossShieldActive()).toBe(true);
});
it('a single 45% boss shield falls only after both guards are removed, with one real reward per kill',()=>{
 const {w,b}=battle();frames(w,180,68);w.drainEffects();expect(w.activeEscorts).toHaveLength(2);expect(w.bossShieldActive()).toBe(true);
 const hp=b.hp;hit(w,b,100);expect(hp-b.hp).toBeCloseTo(55);
 const guards=[...w.activeEscorts];hit(w,guards[0]);expect(w.growth.energy).toBe(15);expect(w.bossShieldActive()).toBe(true);
 const events=hit(w,guards[1]);expect(w.growth.energy).toBe(30);expect(w.escortKills).toBe(2);expect(w.bossShieldActive()).toBe(false);
 expect(events.filter(e=>e.type==='shield-down')).toHaveLength(1);
 const after=b.hp;hit(w,b,100);expect(after-b.hp).toBeCloseTo(100);
 hit(w,guards[1]);expect(w.escortKills).toBe(2);expect(w.growth.energy).toBe(30);
});
it('records a tactical win from actual escort kills and a flawless boss victory, with no remaining reinforcements',()=>{
 const {w,b}=battle();frames(w,180,68);for(const g of [...w.activeEscorts])hit(w,g);hit(w,b);
 expect(w.phase).toBe('recovery');expect(w.tacticalWins).toBe(1);expect(w.bodies).toHaveLength(0);const spawns=w.escortSpawns;
 frames(w,120);expect(w.escortSpawns).toBe(spawns);expect(w.activeEscorts).toHaveLength(0);
});
it('escaping guards never grant kill credit or a tactical win',()=>{
 const {w,b}=battle();frames(w,180,68);for(const g of w.activeEscorts)g.y=1344;frames(w,1);
 expect(w.bossShieldActive()).toBe(false);expect(w.escortKills).toBe(0);expect(w.growth.energy).toBe(0);
 hit(w,b);expect(w.tacticalWins).toBe(0);
});
it('boss healing cannot erase battle damage from a tactical achievement',()=>{
 const {w,b}=battle();frames(w,180,68);
 w.bullets.push({id:id++,x:w.player.x,y:C.playerY,px:w.player.x,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});frames(w,1);
 expect(w.damageTaken).toBe(1);for(const g of [...w.activeEscorts])hit(w,g);hit(w,b);
 expect(w.player.hp).toBe(3);expect(w.tacticalWins).toBe(0);
});
it('player death wins over a same-step boss kill and never spawns later groups',()=>{
 const {w,b}=battle(5);frames(w,30);w.player.hp=1;w.bullets=[];
 w.bullets.push({id:id++,x:w.player.x,y:C.playerY,px:w.player.x,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});
 w.bullets.push({id:id++,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:100000,age:0,active:true,hostile:false});
 frames(w,1);expect(w.phase).toBe('dead');expect(w.tacticalWins).toBe(0);const count=w.escortSpawns;
 frames(w,300);expect(w.escortSpawns).toBe(count);
});
it('respects the enemy budget and expires a blocked group rather than spawning it late',()=>{
 const {w}=battle();for(let i=0;i<25;i++){const a=w.spawn('drone',200,-1000);a.speed=0;}
 frames(w,240,68);expect(w.escortSpawns).toBe(0);
 for(const a of w.bodies)if(a.kind==='drone')a.active=false;frames(w,180,68);expect(w.escortSpawns).toBe(0);
});
it('rejects an unsafe group then retries on the actual clear field without assuming invulnerability',()=>{
 const {w}=battle();w.phaseTime=.19;w.player.invulnerable=2;
 for(const x of [68,180,290,400,510,620]){const wall=w.spawn('crate',x,C.playerY);wall.speed=0;}
 frames(w,1);expect(w.escortSpawns).toBe(0);expect(w.fallbackCount).toBeGreaterThan(0);
 for(const wall of [...w.bodies].filter(b=>b.active&&b.kind==='crate'))hit(w,wall);
 frames(w,40,68);expect(w.escortSpawns).toBe(2);
});
it.each([4,5,6])('round %s admits its two units and never replaces kills with endless reinforcements',round=>{
 const {w}=battle(round,68);frames(w,240,68);expect(w.escortSpawns).toBe(2);
 for(const g of [...w.activeEscorts])hit(w,g);frames(w,240,68);expect(w.escortSpawns).toBe(2);
 expect(w.peakBodies).toBeLessThanOrEqual(C.limits.enemies+C.limits.rewards);
});
it('supply guards use authored durability and a bounded hover while ordinary guards retain forward motion',()=>{
 const {w}=battle();frames(w,180,68);const guards=w.activeEscorts;expect(guards).toHaveLength(2);
 const ordinary=w.spawn('guard',620,180);const reference=ordinary.maxHp;
 for(const g of guards){expect(g.maxHp).toBeCloseTo(reference*3);expect(g.y).toBeCloseTo(440);}
 frames(w,60,68);expect(ordinary.y).toBeGreaterThan(180);
 frames(w,600,68);expect(guards.every(g=>g.y>440||!g.active)).toBe(true);
});
