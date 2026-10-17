import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {recipeIds,recipeStatus} from '../src/core/recipe-goal';import {supplyCombinations,supplyCombinationLabel,supplyCombinationClear} from '../src/game/supply-combinations';import type {WeaponKind} from '../src/core/weapons';
const kinds:WeaponKind[]=['pulse','scatter','pierce','blast','arc'];
function collect(w:World,k:WeaponKind,tier:number,refit=false){const b=w.spawn('pickup',360,C.playerY,tier);b.weaponKind=k;b.refit=refit;w.step(C.step,360);w.drainEffects();return b;}
const serialize=(v:unknown)=>JSON.stringify(v,(_k,x)=>x instanceof Map?[...x]:x instanceof Set?[...x]:x);
it('projects newly completed real combinations for every weapon, tier and refit against actual pickup settlement',()=>{
 for(const kind of kinds)for(const owned of [0,1,2,3])for(const stage of [1,2,3])for(const refit of [false,true])for(const layout of [0,1,2]){
 const w=new World();Object.assign(w,{scheduled:[]});w.phase='recovery';for(const k of kinds)if(k!==kind)collect(w,k,2);if(owned)collect(w,kind,owned);
 // Controlled inventory / prerequisite matrix, never normal-flow evidence.
 if(layout===1)w.build.ranks.electric=2;if(layout===2){w.build.ranks.optical=3;w.build.refinements.optical=1;}
 const b=w.spawn('pickup',360,C.playerY,stage);b.weaponKind=kind;b.refit=refit;const before=serialize(w),ready=recipeIds.filter(id=>recipeStatus(w,id).ready),predicted=supplyCombinations(w,b).map(c=>c.id);expect(serialize(w)).toBe(before);
 w.step(C.step,360);w.drainEffects();const actual=recipeIds.filter(id=>!ready.includes(id)&&recipeStatus(w,id).ready);expect(predicted,JSON.stringify({kind,owned,stage,refit,layout})).toEqual(actual);
 }
});
it('shows multiple combinations and goal ordering without pretending an unspent skill is already installed',()=>{
 const w=new World();Object.assign(w,{scheduled:[]});collect(w,'pierce',2);w.build.ranks.electric=2;const b=w.spawn('crate',498,400,2);b.weaponKind='blast';const before=serialize(w);
 expect(supplyCombinations(w,b).map(c=>c.id)).toEqual(['fracture','magnetic']);expect(supplyCombinationLabel(supplyCombinations(w,b,'magnetic'))).toBe('拾取成形·磁暴榴弹+1');expect(serialize(w)).toBe(before);w.build.ranks.electric=1;w.growth.mastery=100;expect(supplyCombinations(w,b).map(c=>c.id)).toEqual(['fracture']);b.active=false;expect(supplyCombinations(w,b)).toEqual([]);expect(supplyCombinationLabel([])).toBeNull();
});
it('actual crate break keeps the preview on the drop without activating anything until collection, and the exclusive alternative is lost',()=>{
 const w=new World();Object.assign(w,{scheduled:[]});collect(w,'pierce',2);const box=w.spawn('crate',498,700,2);box.weaponKind='blast';box.row=7;const other=w.spawn('crate',222,700,2);other.weaponKind='scatter';other.row=7;
 expect(supplyCombinations(w,box).map(c=>c.id)).toEqual(['fracture']);w.bullets.push({id:90000,x:498,y:700,px:498,py:700,vx:0,vy:0,damage:9999,age:0,active:true,hostile:false});w.step(C.step,68);w.drainEffects();const drop=w.bodies.find(b=>b.active&&b.kind==='pickup'&&b.weaponKind==='blast')!;expect(drop).toBeDefined();expect(w.fractureUnlocked()).toBe(false);expect(supplyCombinations(w,drop).map(c=>c.id)).toEqual(['fracture']);expect(other.active).toBe(true);
 drop.x=w.player.x;drop.y=C.playerY;w.step(C.step,w.player.x);expect(w.fractureUnlocked()).toBe(true);expect(other.active).toBe(false);expect(w.activeWeapons).toContain('pulse');expect(w.activeWeapons).toContain('pierce');expect(supplyCombinations(w,other)).toEqual([]);
});
it('optional pickup line yields to actual bodies and enemy shots, while ignoring friendly shots',()=>{
 const w=new World();Object.assign(w,{scheduled:[]});expect(supplyCombinationClear(w,360,800,232)).toBe(true);expect(supplyCombinationClear(w,360,800,232,{top:740,bottom:780})).toBe(false);expect(supplyCombinationClear(w,360,800,232,{top:200,bottom:300})).toBe(true);const b=w.spawn('drone',360,720);expect(supplyCombinationClear(w,360,800,232)).toBe(false);b.active=false;w.bullets.push({id:90000,x:470,y:750,px:470,py:750,vx:0,vy:280,damage:1,age:0,active:true,hostile:true});expect(supplyCombinationClear(w,360,800,232)).toBe(false);w.bullets[0].hostile=false;expect(supplyCombinationClear(w,360,800,232)).toBe(true);
});
