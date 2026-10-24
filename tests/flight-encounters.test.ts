import {it,expect} from 'vitest';
import {FlightWorld,F,lootLife,type Enemy} from '../src/flight/world';
import {encounterTypes} from '../src/flight/encounters';
// Isolated combat fixtures below set entity state. Separate normal earned runs
// verify progression; these fixtures are not difficulty or reward-income evidence.
const mechanics=(w:FlightWorld)=>w as any;
function scene(sector=0,seed=1337){const w=new FlightWorld(seed);w.start('split');w.sector=sector;mechanics(w).spawnTimer=1e6;w.bullets=[];w.loot=[];w.effects=[];return w;}
function event(w:FlightWorld){w.sectorTime=18;mechanics(w).tryEncounter();expect(w.encounter?.outcome).toBe('active');return w.enemies.find(e=>e.id===w.encounter!.target)!;}
function hit(w:FlightWorld,e:Enemy,n:number){mechanics(w).hit(e,n,'guns');}
it.each([0,1,2])('sector%s event starts once, uses its own target/reward, and gives physical loot rather than free inventory',sector=>{
 const w=scene(sector);w.sectorTime=17.99;mechanics(w).tryEncounter();expect(w.encounter).toBeUndefined();const target=event(w),kind=(['arms','mines','shield']as const)[sector];expect(w.encounter!.kind).toBe(kind);const wallet={...w.assembly.inventory};target.x=511;target.y=730;hit(w,target,99999);expect(w.encounter!.outcome).toBe('won');expect(w.encountersWon).toBe(1);expect(w.assembly.inventory).toEqual(wallet);const reward=w.loot.find(l=>l.encounterReward===w.encounter!.id)!;expect(reward.part).toBe(encounterTypes[kind].part);expect(reward.amount).toBe(4);expect(reward.x).toBe(511);expect(reward.y).toBe(730);expect(lootLife(reward)).toBe(30);mechanics(w).tryEncounter();hit(w,target,99999);expect(w.encountersStarted).toBe(1);expect(w.encountersWon).toBe(1);w.player.x=reward.x;w.player.y=reward.y;w.step(F.step,w.player.x,w.player.y);expect(w.encounter!.claimed).toBe(true);expect(w.encounterHistory[0].claimed).toBe(true);expect(w.assembly.inventory[reward.part as 'alloy']).toBe(wallet[reward.part as 'alloy']+4);
});
it('event admission is atomic under entity pressure and a missed window cannot delay the flagship forever',()=>{
 const w=scene(2);for(let i=0;i<F.enemyLimit-2;i++)mechanics(w).spawn('drone',50+i*20,300);w.sectorTime=18;mechanics(w).tryEncounter();expect(w.encounter).toBeUndefined();expect(w.enemies).toHaveLength(24);w.enemies.pop();mechanics(w).tryEncounter();expect(w.enemies).toHaveLength(26);expect(w.encountersStarted).toBe(1);expect(w.enemies.filter(e=>e.protectedBy===w.encounter!.target)).toHaveLength(2);
 const missed=scene();missed.sectorTime=39;mechanics(missed).tryEncounter();expect(missed.encountersStarted).toBe(0);missed.sectorTime=60;missed.step(F.step);expect(missed.phase).toBe('boss');expect(missed.enemies.some(e=>e.kind==='boss')).toBe(true);
});
it('seeded encounter positions vary without creating fixed pickup lanes',()=>{
 const xs=[1337,9001,31,999].map(seed=>{const w=scene(0,seed);return event(w).x;});expect(new Set(xs).size).toBe(4);expect(xs.every(x=>x>=120&&x<=600)).toBe(true);
});
it('timeout releases escort shields and retreats the target without a bonus or restarting the same event',()=>{
 const w=scene(2),target=event(w);w.time=w.encounter!.started+27;mechanics(w).updateEncounter();expect(w.encounter!.outcome).toBe('escaped');expect(target.retreat).toBe(true);expect(w.enemies.filter(e=>(e.shield??0)>0)).toHaveLength(0);expect(w.encountersWon).toBe(0);expect(w.loot).toHaveLength(0);mechanics(w).tryEncounter();expect(w.encountersStarted).toBe(1);hit(w,target,99999);expect(w.encountersWon).toBe(0);expect(w.loot.some(l=>l.encounterReward!==undefined)).toBe(false);
});
it('an escaped target cannot leave protection attached to surviving escorts',()=>{
 const w=scene(2),target=event(w);target.y=1400;mechanics(w).updateEncounter();expect(w.encounter!.outcome).toBe('escaped');expect(w.enemies.every(e=>!e.protectedBy)).toBe(true);
});
it('finite shields absorb real damage, overflow reaches hull, and killing the source releases both escorts',()=>{
 const w=scene(2),target=event(w),escorts=w.enemies.filter(e=>e.protectedBy===target.id),a=escorts[0],hp=a.hp,shield=a.shield!;hit(w,a,20);expect(a.hp).toBe(hp);expect(a.shield).toBe(shield-20);expect(w.shieldDamage).toBe(20);expect(w.contribution.guns??0).toBe(0);hit(w,a,shield);expect(a.hp).toBe(hp-20);expect(a.shield).toBe(0);expect(w.contribution.guns).toBe(20);hit(w,target,99999);expect(escorts.every(e=>e.shield===0&&e.protectedBy===undefined)).toBe(true);expect(escorts.every(e=>e.hp>0)).toBe(true);
});
it('a saturated wrong-kind loot pool defers the promised bonus and issues it once a slot opens',()=>{
 const w=scene(),target=event(w);for(let i=0;i<F.lootLimit;i++)mechanics(w).addDrop(100+i,400,'repair');hit(w,target,99999);expect(w.encounter!.pending).toBeDefined();expect(w.encounter!.rewardId).toBeUndefined();w.loot.pop();mechanics(w).tryEncounterReward();expect(w.loot).toHaveLength(F.lootLimit);expect(w.encounter!.pending).toBeUndefined();const id=w.encounter!.rewardId;mechanics(w).tryEncounterReward();expect(w.encounter!.rewardId).toBe(id);expect(w.loot.filter(l=>l.encounterReward!==undefined)).toHaveLength(1);
});
it('a full same-kind pool merges and marks the actual physical bonus without an inventory credit',()=>{
 const w=scene(),target=event(w);for(let i=0;i<F.lootLimit;i++)mechanics(w).addDrop(100+i,500,'alloy');const first=w.loot[0];first.age=17;hit(w,target,99999);expect(w.loot).toHaveLength(F.lootLimit);expect(first.amount).toBeGreaterThanOrEqual(5);expect(first.encounterReward).toBe(w.encounter!.id);expect(first.age).toBe(0);expect(w.assembly.inventory.alloy).toBe(0);
});
it('expired bonus items touching the player do not collect or certify a claim',()=>{
 const w=scene(),target=event(w);target.x=360;target.y=800;hit(w,target,99999);const l=w.loot.find(l=>l.encounterReward!==undefined)!;l.age=30;w.player.x=l.x;w.player.y=l.y;const parts=w.partsCollected;w.step(F.step,w.player.x,w.player.y);expect(w.encounter!.claimed).toBe(false);expect(w.partsCollected).toBe(parts);
});
it('death closes an active event and prevents later hits or pending bonus emission',()=>{
 const w=scene(),target=event(w);w.player.hp=1;w.player.invulnerable=0;mechanics(w).hurt();expect(w.phase).toBe('dead');expect(w.encounter!.outcome).toBe('escaped');hit(w,target,99999);mechanics(w).tryEncounterReward();expect(w.encountersWon).toBe(0);expect(w.loot).toHaveLength(0);
});
it('the minelayer lays a three-mine fan within budget, with an actual arming interval',()=>{
 const w=scene(1),target=event(w);target.x=360;target.y=300;mechanics(w).enemyShot(target);const mines=w.enemies.filter(e=>e.kind==='mine');expect(mines).toHaveLength(3);expect(mines.map(e=>e.x)).toEqual([300,360,420]);expect(mines.every(e=>e.age===0)).toBe(true);expect(w.minesDeployed).toBe(3);while(w.enemies.length<F.enemyLimit-1)mechanics(w).spawn('drone',50,400);mechanics(w).enemyShot(target);expect(w.enemies).toHaveLength(F.enemyLimit-1);expect(w.minesDeployed).toBe(3);
});
it('unarmed mines cannot collide, while an armed fuse emits physical radial bullets through normal stepping',()=>{
 const w=scene(),m=mechanics(w).spawn('mine',360,800)as Enemy;w.player.x=360;w.player.y=800;w.player.invulnerable=0;m.age=.85;const hp=w.player.hp;w.step(F.step,360,800);expect(w.player.hp).toBe(hp);expect(m.hp).toBeGreaterThan(0);expect(w.bullets.filter(b=>b.hostile)).toHaveLength(0);m.age=4.5;m.x=500;m.y=500;w.step(F.step,360,800);const bullets=w.bullets.filter(b=>b.hostile);expect(bullets).toHaveLength(8);expect(new Set(bullets.map(b=>Math.atan2(b.vy,b.vx).toFixed(3))).size).toBe(8);expect(m.hp).toBe(0);
});
it('shooting a mine clears ordnance and chains actual damage without farming enemy-kill achievements or drops',()=>{
 const w=scene(),a=mechanics(w).spawn('mine',350,600)as Enemy,b=mechanics(w).spawn('mine',410,600)as Enemy,ship=mechanics(w).spawn('sentry',360,650)as Enemy;ship.hp=ship.maxHp=100;const hp=ship.hp;hit(w,a,20);expect(a.hp).toBeLessThanOrEqual(0);expect(b.hp).toBeLessThanOrEqual(0);expect(w.ordnanceCleared).toBe(2);expect(w.kills).toBe(0);expect(w.score).toBe(20);expect(ship.hp).toBe(hp-70);expect(w.contribution.mineblast).toBe(84);expect(w.loot).toHaveLength(0);
});
it('the same mine cannot explode or pay twice when later damage sources contact it',()=>{
 const w=scene(),m=mechanics(w).spawn('mine',360,600)as Enemy;hit(w,m,20);hit(w,m,20);expect(w.ordnanceCleared).toBe(1);expect(w.score).toBe(10);expect(w.contribution.guns).toBe(14);
});
it('encounter history stays bounded over endless sectors while totals remain accurate',()=>{
 const w=scene();for(let i=0;i<25;i++){w.sector=i;w.enemies=[];w.loot=[];event(w);for(const id of w.encounter!.convoy?.nodes??[w.encounter!.target])hit(w,w.enemies.find(e=>e.id===id)!,99999);}expect(w.encounterHistory).toHaveLength(12);expect(w.encounterHistory[0].id).toBe(14);expect(w.encountersStarted).toBe(25);expect(w.encountersWon).toBe(25);
});
it('the convoy keeps its shields and escorts physically in front of the moving source',()=>{
 const w=scene(2),target=event(w);for(let i=0;i<125;i++)w.step(F.step,360,1100);const escorts=w.enemies.filter(e=>e.protectedBy===target.id);expect(escorts).toHaveLength(2);for(const e of escorts){expect(e.y).toBeCloseTo(target.y+100);expect(e.x).toBeCloseTo(target.x+e.angle*145);expect(e.shield).toBeGreaterThan(0);}expect(target.y).toBeGreaterThan(165);
});
it('the first mine fan is laid inside visible combat space, never as an instant offscreen hazard',()=>{
 const w=scene(1),target=event(w);for(let i=0;i<180&&!w.minesDeployed;i++)w.step(F.step,50,1100);expect(w.minesDeployed).toBe(3);expect(target.y).toBeGreaterThan(190);expect(w.enemies.filter(e=>e.kind==='mine').every(e=>e.y>230&&e.age<.1)).toBe(true);
});
it('courier rounds come from three real muzzle positions and identify their actual firing source',()=>{
 const w=scene(),ship=event(w);ship.x=360;ship.y=350;w.bullets=[];mechanics(w).enemyShot(ship);const shots=w.bullets.filter(b=>b.hostile);expect(shots).toHaveLength(3);expect(shots.map(b=>b.x)).toEqual([334,360,386]);expect(shots.every(b=>b.y===404&&b.sourceEnemy===ship.id)).toBe(true);expect(new Set(shots.map(b=>b.vx.toFixed(3))).size).toBe(3);
});
