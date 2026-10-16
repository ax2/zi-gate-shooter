import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {timeline} from '../src/core/director';import {advanceBody} from '../src/core/behavior';import {driftOffset,driftVelocity,hasDriftSupply} from '../src/core/drift-supply';import {driftCarrier} from '../src/game/drift-carrier';
it('changes only the first side-chapter armory pattern, preserving supply times and enemy roster',()=>{
 for(let r=1;r<=18;r++)for(const seed of [1,713,1337])for(const plan of [0,1,2] as const){const list=timeline(r,seed,plan),rows=list.filter(s=>s.pattern==='drift-supply');expect(rows).toHaveLength(hasDriftSupply(r)?1:0);if(rows.length)expect(rows[0]).toMatchObject({kind:'armory',at:16});expect(list.filter(s=>s.kind==='armory').map(s=>s.at)).toEqual([16,48]);expect(list.filter(s=>s.pattern==='relocate')).toHaveLength(r>1?1:0);}
});
it('smoothly reaches both real extremes then settles with bounded velocity and intact choice spacing',()=>{
 expect(driftOffset(0)).toBe(0);expect(driftOffset(.6)).toBe(70);expect(driftOffset(1.8)).toBe(-70);expect(driftOffset(3)).toBe(0);expect(driftOffset(100)).toBe(0);
 for(const age of [0,.6,1.8,3])expect(Math.abs(driftVelocity(age))).toBeLessThan(5);
 const w=new World();const a=w.spawn('crate',222,180),b=w.spawn('crate',498,180);a.pattern=b.pattern='drift-supply';
 for(let i=0;i<240;i++){for(const c of [a,b])advanceBody(c,C.step,'running',0,()=>{});expect(b.x-a.x).toBeCloseTo(276);expect(a.x-118).toBeGreaterThan(0);expect(b.x+118).toBeLessThan(C.width);expect(Math.abs(a.x-222)).toBeLessThanOrEqual(70);expect(Math.abs(driftVelocity(a.age))).toBeLessThanOrEqual(176);}
 expect(a.x).toBe(222);expect(b.x).toBe(498);expect(a.y).toBeCloseTo(180+4*C.scrollSpeed);
});
it('sweeps into the moving box, drops at its actual position and only upgrades on picking one exclusive row',()=>{
 const w=new World();Object.assign(w,{scheduled:[]});w.player.x=w.player.px=68;const a=w.spawn('crate',222,1000,2),b=w.spawn('crate',498,1000,2);a.pattern=b.pattern='drift-supply';a.age=b.age=.3;a.x=222+driftOffset(.3);b.x=498+driftOffset(.3);a.weaponKind='arc';b.weaponKind='blast';a.row=b.row=99;
 const oldX=a.x;w.bullets=[{id:99999,x:oldX-a.width/2-2.9,y:1000,px:oldX-a.width/2-2.9,py:1000,vx:0,vy:0,damage:1000,age:0,active:true,hostile:false,weaponKind:'pulse'}];w.step(C.step,68);
 expect(a.active).toBe(false);const p=w.bodies.find(c=>c.active&&c.kind==='pickup'&&c.row===99)!;expect(p).toBeDefined();expect(p.x).toBe(a.x);expect(p.pattern).toBeUndefined();expect(w.activeWeapons).toEqual(['pulse']);
 for(let i=0;i<30&&p.active;i++)w.step(C.step,p.x);expect(p.active).toBe(false);expect(w.activeWeapons).toContain('arc');expect(w.activeWeapons).toContain('pulse');expect(w.weaponStage('arc')).toBe(2);expect(b.active).toBe(false);expect(w.pickups).toBe(1);expect(w.lastEquipmentPickup?.id).toBe(p.id);expect(w.lastEquipmentPickup?.kind).toBe('arc');
});
it('the local carrier preserves canvas state, has bounded geometry and weak effects draw less',()=>{
 const counts=[];for(const weak of [false,true]){let depth=0,calls=0;const c=new Proxy({}, {get(_t,k){return (...args:unknown[])=>{calls++;if(k==='save')depth++;if(k==='restore')depth--;if(k==='moveTo'||k==='lineTo'){expect(Math.abs(Number(args[0]))).toBeLessThanOrEqual(90);expect(Number(args[1])).toBeGreaterThanOrEqual(0);expect(Number(args[1])).toBeLessThanOrEqual(57);}for(const a of args)if(typeof a==='number')expect(Number.isFinite(a)).toBe(true);};},set(){return true;}}) as CanvasRenderingContext2D;driftCarrier(c,360,500,.3,weak);expect(depth).toBe(0);counts.push(calls);}expect(counts[1]).toBeLessThan(counts[0]);
});

it('transport cover blocks damage briefly without changing original box durability or carrying protection into its pickup',()=>{const w=new World();Object.assign(w,{scheduled:[]});w.player.x=w.player.px=68;const b=w.spawn('crate',222,500,3);b.pattern='drift-supply';b.dropGrace=.45;b.weaponKind='blast';const hp=b.hp;
 for(let i=0;i<28&&b.active;i++){w.bullets=[{id:99800+i,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:1000,age:0,active:true,hostile:false}];w.step(C.step,68);if(i<26)expect(b.hp).toBe(hp);}
 expect(hp).toBe(112);expect(b.active).toBe(false);const p=w.bodies.find(b=>b.kind==='pickup')!;expect(p.pattern).toBeUndefined();expect(p.dropGrace).toBeUndefined();expect(w.activeWeapons).toEqual(['pulse']);});
