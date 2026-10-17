import{it,expect}from'vitest';import{gateAtCrossing}from'../src/core/gate-contact';import{World}from'../src/core/world';import{C}from'../src/core/config';
const pair=[{id:1,x:222,width:240},{id:2,x:498,width:240}];
it('uses only the20px cockpit radius and preserves half-open edge ownership',()=>{
 expect(gateAtCrossing(pair,81.999)).toBeUndefined();expect(gateAtCrossing(pair,82)).toBe(pair[0]);expect(gateAtCrossing(pair,637.999)).toBe(pair[1]);expect(gateAtCrossing(pair,638)).toBeUndefined();expect(gateAtCrossing(pair,68)).toBeUndefined();expect(gateAtCrossing(pair,652)).toBeUndefined();
 const single=[{id:3,x:360,width:264}];expect(gateAtCrossing(single,214)).toBe(single[0]);expect(gateAtCrossing(single,207.999)).toBeUndefined();expect(gateAtCrossing(single,512)).toBeUndefined();
});
it('chooses the nearer gate across the4px lip overlap, with stable id ties independent of array order',()=>{
 for(const p of[pair,[...pair].reverse()]){expect(gateAtCrossing(p,359)).toBe(pair[0]);expect(gateAtCrossing(p,360)).toBe(pair[0]);expect(gateAtCrossing(p,361)).toBe(pair[1]);}
});
function ready(x:number){const w=new World();Object.assign(w,{scheduled:[]});(w as any).shoot=()=>{};w.player.x=w.player.px=x;return w;}
function gate(w:World,x=360,width=264,energy=144,row=77){const b=w.spawn('gate',x,C.playerY-1);Object.assign(b,{width,energy,row});return b;}
it.each([1/120,1/60,1/30])('grants only when actually crossing, once, and preserves mixed overflow at step%s',dt=>{
 const w=ready(214);w.growth.bonus=95;const b=gate(w);b.y=b.py=C.playerY-10;w.step(dt,214);expect(w.gatesTaken).toBe(0);expect(w.growth.bonus).toBe(95);
 b.y=b.py=C.playerY-1;w.step(dt,214);expect(w.gatesTaken).toBe(1);expect(w.growth.bonus).toBe(100);expect(w.growth.energy).toBe(25);expect(w.drainEffects().filter(e=>e.type==='gate-taken')).toHaveLength(1);
 for(let i=0;i<5;i++)w.step(dt,214);expect(w.gatesTaken).toBe(1);expect(w.growth.energy).toBe(25);
});
it.each([[359,30,0],[360,30,0],[361,0,60],[627.6667,0,60],[652,0,0]])('settles at most one pair member at cockpit x%s',(x,power,energy)=>{
 const w=ready(x),a=gate(w,222,240),b=gate(w,498,240);b.rewardKind='energy';w.step(C.step,x);expect(w.growth.bonus).toBe(power);expect(w.growth.energy).toBe(energy);expect(w.gatesTaken).toBe(power||energy?1:0);expect(a.active||b.active).toBe(false);
});
it.each([[202,214,0],[214,202,1]])('uses interpolated crossing position rather than the final pointer position %s→%s',(start,end,expected)=>{
 const w=ready(start);gate(w);w.step(C.step,end);expect(w.gatesTaken).toBe(expected);
});
it('a same-step lethal contact takes priority and cannot earn a posthumous gate reward',()=>{
 const w=ready(214);w.player.hp=1;gate(w);w.bullets.push({id:99999,x:214,y:C.playerY,px:214,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});w.step(C.step,214);expect(w.player.hp).toBe(0);expect(w.gatesTaken).toBe(0);expect(w.growth.bonus).toBe(0);expect(w.drainEffects().some(e=>e.type==='gate-taken')).toBe(false);
});
it('touching decorative gun reach outside the cockpit gives no reward, even for a fully charged gate',()=>{
 const w=ready(195);gate(w);w.step(C.step,195);expect(w.gatesTaken).toBe(0);expect(w.growth.bonus).toBe(0);
});
