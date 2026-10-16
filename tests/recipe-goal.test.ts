import {it,expect,vi} from 'vitest';
import {World} from '../src/core/world';import {C} from '../src/core/config';
import {recipeIds,parseRecipeGoal,recipeStatus,recipePerformance,recipeSupplyMatch,recipeRouteHint} from '../src/core/recipe-goal';
import {defaults,loadSave,writeSave} from '../src/ui/storage';import {parseSave} from '../src/game/canvas-runtime';
import type {WeaponKind} from '../src/core/weapons';
function collect(w:World,kind:WeaponKind,stage=2){const p=w.spawn('pickup',w.player.x,C.playerY,stage);p.weaponKind=kind;w.step(C.step,w.player.x);w.drainEffects();return p;}
it('matches authoritative unlock rules across node/refinement combinations without mutating World',()=>{
 const w=new World();collect(w,'arc');
 for(let ballistic=0;ballistic<=3;ballistic++)for(let electric=0;electric<=3;electric++)for(let optical=0;optical<=3;optical++)for(const refined of [0,1]){
  Object.assign(w.build.ranks,{ballistic,electric,optical});w.build.refinements.optical=refined;
  const before=JSON.stringify(w),ready=Object.fromEntries(recipeIds.map(id=>[id,recipeStatus(w,id).ready]));
  expect(ready).toEqual({storm:ballistic>=3&&electric>=1,prism:w.supportProfile().prism,photon:w.laserChainUnlocked(),fracture:w.fractureUnlocked(),ion:electric>=3});expect(JSON.stringify(w)).toBe(before);
 }
});
it('marks only actual missing equipment improvements, never assumes a broken box is collected',()=>{
 const w=new World();collect(w,'pierce');
 const needed=w.spawn('crate',500,400,2);needed.weaponKind='blast';const duplicate=w.spawn('crate',220,400,2);duplicate.weaponKind='pierce';
 const before=JSON.stringify(w);expect(recipeSupplyMatch(w,'fracture',needed)).toBe(true);expect(recipeSupplyMatch(w,'fracture',duplicate)).toBe(false);expect(recipeSupplyMatch(w,'prism',needed)).toBe(false);expect(JSON.stringify(w)).toBe(before);
 needed.hp=1;w.bullets.push({id:9999,x:500,y:440,px:500,py:440,vx:0,vy:-1200,damage:20,age:0,active:true,hostile:false});w.step(C.step,68);w.drainEffects();
 const dropped=w.bodies.find(b=>b.active&&b.kind==='pickup'&&b.weaponKind==='blast')!;expect(dropped).toBeDefined();expect(recipeSupplyMatch(w,'fracture',dropped)).toBe(true);expect(recipeStatus(w,'fracture').ready).toBe(false);expect(w.activeWeapons).not.toContain('blast');
 collect(w,'blast');expect(recipeStatus(w,'fracture').ready).toBe(true);expect(recipeSupplyMatch(w,'fracture',dropped)).toBe(false);
});
it('recognizes a useful owned T1 refit and rejects an unowned refit or same-tier ordinary duplicate',()=>{
 const w=new World();collect(w,'arc',1);const b=w.spawn('crate',360,400,1);b.weaponKind='arc';
 expect(recipeSupplyMatch(w,'photon',b)).toBe(false);b.refit=true;expect(recipeSupplyMatch(w,'photon',b)).toBe(true);b.weaponKind='blast';expect(recipeSupplyMatch(w,'fracture',b)).toBe(false);
});
it('separates optical nodes from refinement and gear, and does not recommend a locked ballistic node',()=>{
 const w=new World();w.growth.mastery=20;collect(w,'arc');w.build.ranks.optical=2;
 const before=JSON.stringify(w),node=recipeRouteHint(w,'photon','optical');expect(node?.advances).toBe(true);expect(node?.text).toContain('2/3→3/3');expect(node?.text).not.toContain('本次完成');expect(JSON.stringify(w)).toBe(before);
 w.build.ranks.optical=3;expect(recipeRouteHint(w,'photon','optical')?.text).toContain('本次完成构筑');w.chooseBuild('optical');expect(recipeStatus(w,'photon').ready).toBe(true);expect(recipeRouteHint(w,'photon','optical')?.advances).toBe(false);
 w.build.ranks.ballistic=2;w.build.ranks.electric=0;expect(recipeRouteHint(w,'storm','ballistic')).toBeNull();expect(recipeRouteHint(w,'storm','electric')?.advances).toBe(true);
});
it('round-trips a validated preference through both save readers without changing legacy progress',()=>{
 for(const id of recipeIds)expect(parseSave({...defaults(),best:123,recipeGoal:id}).recipeGoal).toBe(id);
 for(const invalid of ['constructor','__proto__','unknown',{},17]){expect(parseRecipeGoal(invalid)).toBeNull();expect(parseSave({...defaults(),recipeGoal:invalid}).recipeGoal).toBeNull();}
 let stored='';vi.stubGlobal('localStorage',{getItem:()=>stored,setItem:(_key:string,value:string)=>{stored=value;}});
 try{const save=defaults();save.best=567;save.achievements.unlocked=['core-breaker'];save.recipeGoal='fracture';expect(writeSave(save)).toBe(true);expect(loadSave()).toEqual(save);stored=JSON.stringify({version:1,best:567});expect(loadSave().recipeGoal).toBeNull();expect(loadSave().best).toBe(567);}finally{vi.unstubAllGlobals();}
});


it('distinguishes a ready circuit from an actual six-hit discharge and stays read-only',()=>{
 const w=new World();w.growth.mastery=3;for(let i=0;i<3;i++)w.chooseBuild('electric');
 const b=w.spawn('armor',360,600);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;
 expect(recipePerformance(w,'ion')).toMatchObject({ready:true,count:0,label:'已就绪 · 未触发'});
 for(let i=0;i<6;i++){w.bullets=[{id:99999,x:360,y:600,px:360,py:600,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'arc'}];w.step(C.step,68);w.drainEffects();if(i<5)expect(recipePerformance(w,'ion').count).toBe(0);}
 expect(w.ionBursts).toBe(1);const before=JSON.stringify(w);expect(recipePerformance(w,'ion')).toMatchObject({ready:true,count:1,label:'放电1次'});expect(recipePerformance(w,'prism').label).toBe('未成形');expect(JSON.stringify(w)).toBe(before);
});
it('labels different simulation measures without combining chain hits and focus activations into one trigger total',()=>{
 const w=new World();collect(w,'arc',2);w.growth.mastery=12;
 for(let i=0;i<4;i++)w.chooseBuild('optical');w.chooseBuild('ballistic');w.chooseBuild('electric');w.chooseBuild('ballistic');w.chooseBuild('ballistic');
 collect(w,'pierce',2);collect(w,'blast',2);
 // Counter mapping/format boundary fixture, not an earned-run claim.
 w.stormLinks=12;w.prismHits=25;w.fractureBursts=3;w.laserArcHits=8;w.laserFocusHits=2;
 expect(recipePerformance(w,'storm').label).toBe('跳伤12次');expect(recipePerformance(w,'prism').label).toBe('侧束命中25');expect(recipePerformance(w,'fracture').label).toBe('引爆3次');expect(recipePerformance(w,'photon').label).toBe('链8/聚2');
 w.laserArcHits=1e8;w.laserFocusHits=12000;expect(recipePerformance(w,'photon').label).toBe('链1亿/聚1.2万');
});
