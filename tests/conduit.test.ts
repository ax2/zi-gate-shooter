import {hasRelayScreen,RELAY_SCREEN} from '../src/core/relay-screen';
import {it,expect} from 'vitest';import {World,type Body} from '../src/core/world';import {C} from '../src/core/config';import {CONDUIT} from '../src/core/conduit';import {guardClosed,advanceBody} from '../src/core/behavior';import {timeline} from '../src/core/director';import {awardAchievements,emptyAchievements} from '../src/core/achievements';
function setup(){const w=new World();Object.assign(w,{scheduled:[]});w.player.x=w.player.px=68;return w;}
function shot(w:World,b:Body,damage=100){w.bullets.push({id:99999,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage,age:0,active:true,hostile:false});w.step(C.step,68);return w.drainEffects();}
it('authors exactly one optional-target relay per later chapter without changing first-run or reward windows',()=>{
 expect(timeline(1,1337).some(s=>s.kind==='conduit')).toBe(false);
 for(const round of [2,3,4,8,12])for(const seed of [1,77,1337]){const list=timeline(round,seed),nodes=list.filter(s=>s.kind==='conduit');expect(nodes).toHaveLength(1);expect(nodes[0].at).toBe(hasRelayScreen(round)?RELAY_SCREEN.at+RELAY_SCREEN.relayDelay:44.5);expect(nodes[0].drop).toBe(true);expect(nodes[0].x).toBeGreaterThanOrEqual(180);expect(nodes[0].x).toBeLessThanOrEqual(540);expect(list.filter(s=>s.kind==='armory')).toHaveLength(2);expect(list.filter(s=>s.kind==='gates')).toHaveLength(4);}
 expect(new World(1,100).spawn('conduit',360,360).maxHp).toBe(48);
});
it('disables only real visible unprotected ranged enemies, opens the shield and counts actual charging interrupts',()=>{
 const w=setup(),node=w.spawn('conduit',360,560),guard=w.spawn('guard',300,440),sniper=w.spawn('sniper',480,360),armor=w.spawn('armor',360,400);guard.warning=.5;guard.timer=.5;guard.burst=1;sniper.warning=.5;sniper.timer=.5;
 const protectedEnemy=w.spawn('elite',500,500);protectedEnemy.dropGrace=.45;
 const untouched=[w.spawn('boss',360,360),w.spawn('charger',420,550),w.spawn('drone',500,500),w.spawn('crate',300,700),w.spawn('gate',420,700),protectedEnemy,w.spawn('sniper',68,250)];const before=untouched.map(b=>b.hp);
 const events=shot(w,node);expect(w.conduitBursts).toBe(1);expect(w.empTargets).toBe(3);expect(w.conduitTacticalWins).toBe(1);expect(w.kills).toBe(1);expect(w.score).toBe(35);expect(w.growth.energy).toBe(0);expect(events.filter(e=>e.type==='emp')).toHaveLength(1);
 for(const b of [guard,sniper,armor]){expect(b.empRemaining).toBe(CONDUIT.duration);expect(b.warning).toBe(0);expect(b.hp).toBe(b.maxHp);}expect(guardClosed(guard)).toBe(false);
 untouched.forEach((b,i)=>{expect(b.empRemaining).toBeUndefined();expect(b.hp).toBe(before[i]);});
 const hp=guard.hp;shot(w,guard,10);expect(guard.hp).toBe(hp-10);expect(w.conduitBursts).toBe(1);
});
it('never clears already-fired hostile bullets, then allows the interrupted sniper to charge and fire again',()=>{
 const w=setup(),node=w.spawn('conduit',360,560),sniper=w.spawn('sniper',420,320);sniper.warning=.8;sniper.timer=.8;
 w.bullets.push({id:887,x:652,y:700,px:652,py:700,vx:0,vy:280,damage:1,age:0,active:true,hostile:true});shot(w,node);
 for(let i=0;i<80;i++){w.step(C.step,68);w.drainEffects();}expect(w.bullets.filter(b=>b.hostile).map(b=>b.id)).toEqual([887]);expect(sniper.empRemaining).toBeGreaterThan(0);
 for(let i=0;i<180;i++){w.step(C.step,68);w.drainEffects();}expect(w.bullets.some(b=>b.hostile&&b.id!==887)).toBe(true);expect(sniper.empRemaining).toBe(0);
});
it('protection, off-strip shots, escapes and contact destruction cannot farm a discharge or reward',()=>{
 const w=setup(),node=w.spawn('conduit',360,560);node.dropGrace=.45;shot(w,node);expect(node.hp).toBe(48);expect(w.conduitBursts).toBe(0);expect(w.score).toBe(0);
 for(let i=0;i<28;i++)w.step(C.step,68);shot(w,node);expect(w.conduitBursts).toBe(1);shot(w,node);expect(w.conduitBursts).toBe(1);expect(w.kills).toBe(1);
 const off=setup(),hidden=off.spawn('conduit',360,200);shot(off,hidden);expect(hidden.hp).toBe(48);expect(off.conduitBursts).toBe(0);
 const crash=setup();crash.spawn('conduit',68,C.playerY);crash.step(C.step,68);expect(crash.player.hp).toBe(2);expect(crash.conduitBursts).toBe(0);expect(crash.kills).toBe(0);
 const escaped=setup();escaped.spawn('conduit',360,1400);escaped.step(C.step,68);expect(escaped.conduitBursts).toBe(0);
});
it('does not damage or recursively detonate another conduit, and does not award timing achievement for idle targets',()=>{
 const w=setup(),a=w.spawn('conduit',360,560),b=w.spawn('conduit',480,560);w.spawn('armor',360,400);shot(w,a);expect(b.hp).toBe(48);expect(w.conduitBursts).toBe(1);expect(w.conduitTacticalWins).toBe(0);
 const save=emptyAchievements(),ranks={ballistic:0,electric:0,optical:0};expect(awardAchievements(save,ranks,1,0,0,w.conduitTacticalWins).some(a=>a.id==='disruptor')).toBe(false);
 expect(awardAchievements(save,ranks,1,0,0,1).map(a=>a.id)).toContain('disruptor');expect(awardAchievements(save,ranks,1,0,0,1)).toHaveLength(0);
});
it('shares finite hover, exit and attack suppression with prediction while keeping body motion dangerous',()=>{
 const w=setup(),node=w.spawn('conduit',360,360);let shots=0;for(let i=0;i<Math.floor((CONDUIT.holdSeconds-.2)/C.step);i++)advanceBody(node,C.step,'running',0,()=>shots++);expect(node.y).toBeCloseTo(CONDUIT.hoverY,0);expect(shots).toBe(0);
 for(let i=0;i<120;i++)advanceBody(node,C.step,'running',0,()=>shots++);expect(node.y).toBeGreaterThan(CONDUIT.hoverY);expect(shots).toBe(0);
 const guard=w.spawn('guard',360,400);guard.empRemaining=1;guard.timer=0;const y=guard.y;for(let i=0;i<30;i++)advanceBody(guard,C.step,'running',0,()=>shots++);expect(guard.y).toBeGreaterThan(y);expect(shots).toBe(0);expect(guard.empRemaining).toBeGreaterThan(0);
});
