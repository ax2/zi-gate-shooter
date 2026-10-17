import {it,expect} from 'vitest';import {World,type Body} from '../src/core/world';import {C} from '../src/core/config';import {advanceBody} from '../src/core/behavior';import {LOCKSHOT,lockshotProfile} from '../src/core/lockshot';import {timeline} from '../src/core/director';import {lockshotMount} from '../src/game/lockshot-mount';import {hostileShot} from '../src/game/hostile-shot';import {contextGuide} from '../src/game/context-guide';
function setup(lock=true){const w=new World(1337,2);Object.assign(w,{scheduled:[]});w.player.x=w.player.px=360;const b=w.spawn('sniper',540,360);b.timer=LOCKSHOT.opening;if(lock){b.pattern='lockshot';b.lockX=360;b.dropGrace=.45;}return {w,b};}
function tick(w:World,x=68,n=1){for(let i=0;i<n;i++){w.step(C.step,x);w.drainEffects();}}
function destroy(w:World,b:Body){w.bullets.push({id:99999,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:10000,age:0,active:true,hostile:false});tick(w);}
it('retains the original gun, supplies and moving sentry alongside rotating pursuit tactics',()=>{
 for(let r=1;r<=18;r++)for(const seed of[1337,9001]){
  const list=timeline(r,seed),sector=(r-1)%3,v=Math.floor((r-1)/3)%3,guns=list.filter(s=>s.pattern==='lockshot'&&!s.closing);
  const expected=r===1?1:sector===1?[3,7,4][v]:sector===0&&v===2?3:0;
  expect(guns).toHaveLength(expected);
  if(r===1||sector===1)expect(guns.find(s=>s.at===(r===1?51:23))).toMatchObject({kind:'sniper',at:r===1?51:23,drop:true,dropY:360});
  if(r>1&&sector===1)expect(guns.filter(s=>s.at<2).map(s=>s.at)).toEqual(v===2?[1.7]:[.5,1.7]);
  expect(list.filter(s=>s.kind==='armory').map(s=>s.at)).toEqual([16,r===1?46.5:48]);
  expect(list.filter(s=>s.pattern==='relocate')).toHaveLength(r<=1?0:sector===1&&v===2?4:1);
 }
});
it('fires three fixed-speed angled shots at one admitted point, then leaves instead of relocking',()=>{
 const {b}=setup(),shots:Array<{x:number;y:number;vx:number;vy:number;age:number}>=[];
 for(let i=0;i<240;i++)advanceBody(b,C.step,'running',0,(x,y,vx=0,vy=280)=>shots.push({x,y,vx,vy,age:b.age}));
 expect(shots).toHaveLength(3);for(const s of shots){expect(Math.hypot(s.vx,s.vy)).toBeCloseTo(LOCKSHOT.speed*1.1);expect(s.x+s.vx*(C.playerY-s.y)/s.vy).toBeCloseTo(360);}
 expect(shots[0].age).toBeCloseTo(1.1);expect(shots[1].age-shots[0].age).toBeGreaterThanOrEqual(.12-1e-8);expect(b.y).toBeGreaterThan(360);expect(b.lockX).toBe(360);
});
it('punishes an idle off-axis observer while a move away from the admitted position avoids the actual bolts',()=>{
 const results=[];for(const mode of ['old','idle','move']){const {w}=setup(mode!=='old');for(let i=0;i<180;i++)tick(w,mode==='move'&&i>20?68:360);results.push(w.player.hp);}
 expect(results).toEqual([3,2,3]);
});
for(const afterShot of [false,true])it('destroying '+(afterShot?'a firing':'a charging')+' emitter stops remaining bolts without deleting old bullets',()=>{
 const {w,b}=setup();if(afterShot){while(w.lockshotShots<1)tick(w);}else tick(w,68,40);const old=w.bullets.find(p=>p.hostile&&p.sourceId===b.id)?.id;destroy(w,b);expect(b.active).toBe(false);if(old)expect(w.bullets.some(p=>p.id===old&&p.active)).toBe(true);tick(w,68,60);expect(w.lockshotShots).toBe(afterShot?1:0);
});
it('EMP interrupts a partial burst, preserves launched bolts and its target, and recharges before only the two remaining shots',()=>{
 const {w,b}=setup();while(w.lockshotShots<1)tick(w);const old=w.bullets.find(p=>p.hostile&&p.sourceId===b.id)!.id;const relay=w.spawn('conduit',540,500);destroy(w,relay);expect(b.empRemaining).toBeGreaterThan(1.4);expect(w.bullets.some(p=>p.id===old&&p.active)).toBe(true);expect(b.lockShots).toBe(1);expect(b.lockX).toBe(360);tick(w,68,90);expect(w.lockshotShots).toBe(1);tick(w,68,180);expect(w.lockshotShots).toBe(3);expect(b.lockShots).toBe(3);expect(b.lockX).toBe(360);
});
it('counts accepted shots only and has no firing pose when the existing hostile budget rejects a burst',()=>{
 const {w,b}=setup();for(let i=0;i<C.limits.hostile;i++)w.bullets.push({id:80000+i,x:-30,y:400,px:-30,py:400,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});tick(w,68,100);expect(b.lockShots).toBe(3);expect(w.lockshotShots).toBe(0);expect(b.lockFiredAt).toBeUndefined();expect(w.bullets.filter(p=>p.hostile)).toHaveLength(C.limits.hostile);
});
it('presents the admitted lock and real shutdown as read-only contextual guidance',()=>{const {w,b}=setup();const before=JSON.stringify(w);expect(contextGuide(w).title).toContain('入场锁位');expect(JSON.stringify(w)).toBe(before);b.empRemaining=1;expect(contextGuide(w).title).toContain('已发子弹仍危险');b.lockShots=3;expect(contextGuide(w).title).not.toContain('入场锁位');});
it('keeps the muzzle on the swivel axis, normalizes the original speed and never changes body state',()=>{for(const target of [68,360,652]){const {b}=setup();b.lockX=target;const before=JSON.stringify(b),p=lockshotProfile(b);expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(620);expect(Math.hypot(p.x-b.x,p.y-b.y-20)).toBeCloseTo(48);expect(JSON.stringify(b)).toBe(before);}});
it('bounds local hardware/flash, keeps canvas state and directs real hostile markers using velocity',()=>{
 const {b}=setup();b.age=1.11;b.lockFiredAt=1.1;const counts=[];for(const weak of [false,true]){let depth=0,calls=0;const rotations:number[]=[];const c=new Proxy({}, {get(_t,k){return (...args:unknown[])=>{calls++;if(k==='save')depth++;if(k==='restore')depth--;if(k==='rotate')rotations.push(Number(args[0]));if(k==='moveTo'||k==='lineTo'){expect(Math.abs(Number(args[0]))).toBeLessThanOrEqual(13);expect(Math.abs(Number(args[1]))).toBeLessThanOrEqual(61);}for(const a of args)if(typeof a==='number')expect(Number.isFinite(a)).toBe(true);};},set(){return true;}}) as CanvasRenderingContext2D;lockshotMount(c,b,weak);expect(depth).toBe(0);expect(rotations[0]).toBeGreaterThan(0);counts.push(calls);const p={x:300,y:500,vx:-300,vy:500},before=JSON.stringify(p);hostileShot(c,p);expect(depth).toBe(0);expect(rotations[1]).toBeCloseTo(-Math.atan2(-300,500));expect(JSON.stringify(p)).toBe(before);}expect(counts[1]).toBeLessThan(counts[0]);
});

it('leaves after the fixed hold deadline even if repeated shutdown prevented every shot, and stops offering attack guidance',()=>{const {w,b}=setup();b.empRemaining=20;tick(w,68,625);expect(b.y).toBeGreaterThan(360);expect(b.warning).toBe(0);expect(w.lockshotShots).toBe(0);expect(contextGuide(w).title).not.toContain('入场锁位');expect(b.lockX).toBe(360);});
