import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {buildPreview} from '../src/game/build-preview';
import {routes,type BuildBranch} from '../src/core/build-tree';

const snapshot=(w:World)=>JSON.stringify(w,(_key,value)=>value instanceof Map?[...value]:value instanceof Set?[...value]:value);
it('never changes the run, rewards, pending events or RNG while inspecting every choice',()=>{
  const w=new World(713);w.growth.mastery=12;w.step(1/60,224);
  const before=snapshot(w);
  for(let i=0;i<60;i++)for(const route of routes)buildPreview(w,route);
  expect(snapshot(w)).toBe(before);
  const unearned=new World();expect(buildPreview(unearned,'optical').valid).toBe(false);
});
it('matches the actual next combat profiles for all routes, forks, tiers and continued refinements',()=>{
  for(const stage of [1,2,3])for(const route of routes)for(const branch of (route==='ballistic'?['penetrator','fragment']:route==='electric'?['spread','capacitor']:['burn','relay']) as BuildBranch[]){
    const w=new World();w.growth.stage=stage;w.growth.mastery=30;
    // Unit setup includes an already owned high-tier arc/scatter, not a playable-run claim.
    w.weaponKind=route==='electric'?'arc':'scatter';
    if(route==='ballistic')w.chooseBuild('electric');
    for(let node=0;node<6;node++){
      const preview=buildPreview(w,route,node===1?branch:undefined);
      const before=snapshot(w);expect(preview.valid).toBe(true);expect(snapshot(w)).toBe(before);
      expect(w.chooseBuild(route,node===1?branch:undefined)).toBe(true);
      if(route!=='optical')expect(w.profileFor(route==='electric'?'arc':'scatter')).toEqual(preview.after);
      expect(w.supportProfile()).toEqual(preview.laserAfter);
      expect(w.weaponStage(w.weaponKind)).toBe(stage);
    }
  }
});
it('distinguishes adding a T1 gun from strengthening an owned T3 gun and excludes overload',()=>{
  const w=new World();w.growth.stage=3;w.growth.mastery=1;w.growth.bonus=40;w.growth.overload=6;
  expect(buildPreview(w,'ballistic').gain).toBe('新增T1霰射 · 每轮3发 · 直伤16.5');
  w.weaponKind='scatter';
  expect(buildPreview(w,'ballistic').gain).toBe('霰射每轮直伤 43.5 → 47.9');
  expect(buildPreview(w,'ballistic').stage).toBe(3);
  expect(buildPreview(w,'optical').gain).toBe('新增激光 · 3秒/束 · 直伤51.8');
});
it('shows only common fork gains and actionable missing combination nodes',()=>{
  const w=new World();w.growth.mastery=10;
  expect(buildPreview(w,'electric').plan).toBe('雷暴还需：弹道3点');
  w.chooseBuild('ballistic');
  expect(buildPreview(w,'ballistic').plan).toBe('雷暴还需：弹道1点 ＋ 雷电1点');
  w.chooseBuild('ballistic','fragment');
  const locked=buildPreview(w,'ballistic');expect(locked.valid).toBe(false);expect(locked.plan).toContain('先选导电线圈');
  expect(buildPreview(w,'electric').plan).toBe('雷暴还需：弹道1点');
  w.chooseBuild('electric');
  expect(buildPreview(w,'ballistic').plan).toContain('本次组合：雷暴霰射');
  expect(buildPreview(w,'electric').gain).toBe('跳电范围 160 → 220 · 选扩散/蓄爆');
  expect(w.build.electricBranch).toBeUndefined();
  for(let i=0;i<3;i++)w.chooseBuild('optical');
  expect(buildPreview(w,'ballistic').plan).toContain('雷暴霰射');
  const pure=new World();pure.growth.mastery=5;for(let i=0;i<3;i++)pure.chooseBuild('optical');
  expect(buildPreview(pure,'ballistic').plan).toContain('本次组合：棱镜激光');
  expect(buildPreview(pure,'optical').plan).toBe('电光还需：电弧炮T2');
});
it('includes existing calibration and does not round the accelerated laser interval away',()=>{
  const w=new World();w.weaponKind='scatter';w.growth.stage=3;w.growth.mastery=1;w.growth.bonus=40;
  Object.assign(w,{calibrations:new Map([['scatter',2]])});
  expect(buildPreview(w,'ballistic').gain).toBe('霰射每轮直伤 87 → 95.7');
  const laser=new World();laser.growth.mastery=8;laser.chooseBuild('optical');
  expect(buildPreview(laser,'optical').gain).toBe('激光间隔 1.8 → 1.35秒');
});
