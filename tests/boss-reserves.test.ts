import{it,expect}from'vitest';
import{World,type Body}from'../src/core/world';import{C}from'../src/core/config';
import{BOSS_RESERVES,bossReserveFor}from'../src/core/boss-reserves';
let id=80000;
function setup(round=4){const w=new World(1337,round);Object.assign(w,{phase:'boss',phaseTime:4,escortGroup:9,scheduled:[],shoot(){}});w.player.x=w.player.px=68;const b=w.spawn('boss',360,360);b.hp=b.maxHp=1000;return{w,b};}
function frames(w:World,n:number){for(let i=0;i<n;i++)w.step(C.step,68);}
function hit(w:World,b:Body,damage:number){w.bullets.push({id:id++,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage,active:true,hostile:false,age:0});frames(w,1);}
it.each([4,5,6])('round %s half-health triggers the chapter-specific finite wave through real contacts',round=>{
 const{w,b}=setup(round);hit(w,b,501);expect(b.bossReserveAt).toBeCloseTo(4+C.step+BOSS_RESERVES.delay);expect(w.escortSpawns).toBe(0);
 frames(w,71);expect(w.escortSpawns).toBe(0);frames(w,2);expect(w.activeEscorts.map(g=>g.kind)).toEqual(bossReserveFor(round)!.troops.map(t=>t.kind));expect(b.bossReserveSpawns).toBe(2);
 hit(w,b,100);frames(w,50);expect(w.escortSpawns).toBe(2);expect(w.drainEffects().filter(e=>e.type==='boss-reserve'&&e.text?.includes('半血反扑'))).toHaveLength(1);
});
it.each([1,2,3])('round %s has no half-health reserve',round=>{const{w,b}=setup(round);hit(w,b,501);frames(w,120);expect(b.bossReserveAt).toBeUndefined();expect(w.escortSpawns).toBe(0);});
it('lethal hits and a boss killed during the delay never summon a post-victory wave',()=>{
 for(const pending of[false,true]){const{w,b}=setup();if(pending)hit(w,b,501);hit(w,b,10000);frames(w,180);expect(w.phase).toBe('recovery');expect(w.escortSpawns).toBe(0);expect(w.bossWins).toBe(1);}
});
it('cannot farm repeated reserves by healing or repeated damage',()=>{const{w,b}=setup();hit(w,b,501);frames(w,80);const at=b.bossReserveAt;Object.assign(b,JSON.parse(JSON.stringify(b)));b.hp=900;hit(w,b,500);frames(w,150);expect(b.bossReserveAt).toBe(at);expect(w.escortSpawns).toBe(2);});
it('budget refusal expires rather than silently queueing an arbitrarily late attack',()=>{const{w,b}=setup();hit(w,b,501);for(let i=0;i<25;i++){const d=w.spawn('drone',360,-2000);d.speed=0;}frames(w,300);expect(b.bossReserveSpent).toBe(true);expect(w.escortSpawns).toBe(0);for(const d of w.bodies)if(d.kind==='drone')d.active=false;frames(w,90);expect(w.escortSpawns).toBe(0);});
it('a currently unsafe wave is rejected even while the player is invulnerable',()=>{const{w,b}=setup();hit(w,b,501);for(const x of[68,180,290,400,510,620]){const a=w.spawn('crate',x,C.playerY);a.speed=0;}w.player.invulnerable=5;frames(w,90);expect(w.escortSpawns).toBe(0);expect(w.fallbackCount).toBeGreaterThan(0);for(const a of w.bodies)if(a.kind==='crate')a.active=false;frames(w,31);expect(w.escortSpawns).toBe(2);});
it('shield mitigation is applied before the half-health trigger',()=>{const{w,b}=setup();const g=w.spawn('guard',220,480);g.escort=true;hit(w,b,600);expect(b.hp).toBeCloseTo(670);expect(b.bossReserveAt).toBeUndefined();hit(w,b,350);expect(b.hp).toBeLessThan(500);expect(b.bossReserveAt).toBeDefined();});
it('tactical victory includes the actually admitted reserves and never treats an escaped reserve as killed',()=>{
 for(const escape of[false,true]){const w=new World(1337,4);Object.assign(w,{phase:'boss',shoot(){}});w.player.x=w.player.px=68;const b=w.spawn('boss',360,360);frames(w,30);expect(w.activeEscorts).toHaveLength(2);for(const g of [...w.activeEscorts])hit(w,g,100000);hit(w,b,b.maxHp*.6);frames(w,110);expect(w.activeEscorts).toHaveLength(2);for(const g of [...w.activeEscorts])if(escape)g.active=false;else hit(w,g,100000);hit(w,b,1000000);expect(w.bossWins).toBe(1);expect(w.tacticalWins).toBe(escape?0:1);}
});
