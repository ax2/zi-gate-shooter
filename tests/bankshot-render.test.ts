import{it,expect}from'vitest';import{bankshotMount}from'../src/game/bankshot-mount';import{hostileShot}from'../src/game/hostile-shot';
function context(){let depth=0,calls=0;const points:number[][]=[];const c=new Proxy({}, {get(_t,k){return(...args:number[])=>{calls++;if(k==='save')depth++;if(k==='restore')depth--;if(k==='moveTo'||k==='lineTo'||k==='fillRect'||k==='arc')points.push(args);};},set(){return true;}})as CanvasRenderingContext2D;return{c,points,depth:()=>depth,calls:()=>calls};}
it('launcher metalwork stays local, restores state and reduces detail on the weak setting',()=>{
 for(const age of [0,.4,.75,1.2,4])for(const warning of [0,.4]){const counts=[];for(const weak of [false,true]){const f=context();bankshotMount(f.c,{age,warning,timer:.2,bankFiredAt:.7},weak);expect(f.depth()).toBe(0);for(const point of f.points){expect(point.every(Number.isFinite)).toBe(true);expect(Math.abs(point[0])).toBeLessThanOrEqual(60);expect(Math.abs(point[1])).toBeLessThanOrEqual(60);}counts.push(f.calls());}expect(counts[1]).toBeLessThan(counts[0]);}
});
it('actual returning discs use a bounded steel rim and hot core, without projected trajectory lines',()=>{
 for(const remaining of [1,0]){const f=context();hostileShot(f.c,{x:360,y:500,vx:remaining?-286:286,vy:338,bankRemaining:remaining,age:2});expect(f.depth()).toBe(0);for(const p of f.points){expect(p.every(Number.isFinite)).toBe(true);expect(Math.abs(p[0])).toBeLessThanOrEqual(12);expect(Math.abs(p[1])).toBeLessThanOrEqual(12);}}
});
