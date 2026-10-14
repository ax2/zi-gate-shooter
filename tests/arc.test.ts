import {expect,it} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
function fire(w:World){w.bullets.push({id:9999,x:220,y:500,px:220,py:500,vx:0,vy:0,damage:20,age:0,active:true,hostile:false,weaponKind:'arc',chainHops:3});w.step(C.step,68);return w.drainEffects();}
it('chains once per enemy with decay across a line wider than one blast',()=>{
 const w=new World();const bodies=[220,340,460,580].map(x=>w.spawn('armor',x,500));
 const events=fire(w);[60,67,71.55,74.5075].forEach((hp,i)=>expect(bodies[i].hp).toBeCloseTo(hp));
 expect(events.filter(e=>e.type==='arc').map(e=>[e.x,e.targetX])).toEqual([[220,340],[340,460],[460,580]]);
});
it('a closed shield receives reduced chain damage and stops subsequent hops',()=>{
 const w=new World();w.spawn('armor',220,500);const guard=w.spawn('guard',340,500),rear=w.spawn('armor',460,500);
 const events=fire(w);expect(guard.hp).toBe(57.5);expect(rear.hp).toBe(80);expect(events.filter(e=>e.type==='arc')).toHaveLength(1);
});
it.each(['crate','gate','guard'] as const)('a direct %s does not start chain propagation',kind=>{
 const w=new World();w.spawn(kind,220,500);const rear=w.spawn('armor',340,500);
 expect(fire(w).some(e=>e.type==='arc')).toBe(false);expect(rear.hp).toBe(80);
});
it('ignores nearby rewards and targets above the active battlefield',()=>{
 const w=new World();const p=w.spawn('armor',220,280);p.speed=0;
 const hidden=w.spawn('armor',220,190);hidden.speed=0;
 const gate=w.spawn('gate',300,280),crate=w.spawn('crate',340,280);
 w.bullets.push({id:9999,x:220,y:280,px:220,py:280,vx:0,vy:0,damage:20,age:0,active:true,hostile:false,weaponKind:'arc',chainHops:3});
 const hp=crate.hp;w.step(C.step,68);expect(hidden.hp).toBe(80);expect(gate.energy).toBe(0);expect(crate.hp).toBe(hp);
});
