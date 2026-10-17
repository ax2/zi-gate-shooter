import {it,expect} from 'vitest';import {timeline} from '../src/core/director';import {World} from '../src/core/world';import {C} from '../src/core/config';import {SUPPLY_CONVOY,hasSupplyConvoy} from '../src/core/supply-convoy';import {advanceBody,guardClosed} from '../src/core/behavior';
it('adds an alternating later-chapter encounter by replacing one gun and widening only its supply row',()=>{
 for(let round=1;round<=18;round++)for(const seed of [1,713,1337]){const list=timeline(round,seed),guards=list.filter(s=>s.pattern==='convoy'&&s.at===SUPPLY_CONVOY.guardAt),rows=list.filter(s=>s.convoy);expect(guards).toHaveLength(hasSupplyConvoy(round)?1:0);expect(list.filter(s=>s.pattern==='convoy'&&s.at!==SUPPLY_CONVOY.guardAt)).toHaveLength(round===1?1:0);expect(rows).toHaveLength(guards.length);if(guards.length){expect(guards[0]).toMatchObject({kind:'guard',at:49,x:360,drop:true,dropY:550});expect(rows[0]).toMatchObject({kind:'armory',at:48});expect(list.filter(s=>s.pattern==='relocate')).toHaveLength(1);}expect(list.filter(s=>s.kind==='armory')).toHaveLength(2);}
});
it('holds a normal shield guard through the supply window, opens its real weak point, then leaves',()=>{
 const w=new World(1337,4),b=w.spawn('guard',360,550);b.pattern='convoy';const shots:Array<{age:number;x:number;y:number;vx:number;vy:number}>=[];
 for(let i=0;i<330;i++){advanceBody(b,C.step,'running',0,(x,y,vx=0,vy=280)=>shots.push({age:b.age,x,y,vx,vy}));if(i<329)expect(b.y).toBe(550);if(b.age<1.5-1e-6)expect(guardClosed(b)).toBe(true);if(b.age>1.6&&b.age<3.0)expect(guardClosed(b)).toBe(false);}
 expect(shots.slice(0,3).map(s=>s.vx)).toEqual([-91,0,91]);expect(shots[0].age).toBeCloseTo(2.3);for(let i=0;i<60;i++)advanceBody(b,C.step,'running',0,()=>{});expect(b.y).toBeGreaterThan(650);
});
it('keeps physical crate and full original parameter panels clear of the guard silhouette',()=>{
 for(const x of SUPPLY_CONVOY.lanes){expect(Math.abs(x-360)-(118+80)).toBeGreaterThanOrEqual(12);expect(Math.abs(x-360)-(74+80)).toBeGreaterThan(0);expect(x-118).toBeGreaterThanOrEqual(0);expect(x+118).toBeLessThanOrEqual(C.width);}
});
