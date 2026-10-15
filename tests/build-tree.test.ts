import { expect,it } from 'vitest';
import { World } from '../src/core/world';
it('requires earned breakthroughs and enforces the lightning combination prerequisite',()=>{
 const w=new World();expect(w.chooseBuild('ballistic')).toBe(false);
 w.growth.mastery=9;
 expect(w.chooseBuild('ballistic')).toBe(true);expect(w.activeWeapons).toContain('scatter');
 expect(w.weaponStage('pulse')).toBe(1);
 w.chooseBuild('ballistic');expect(w.chooseBuild('ballistic')).toBe(false);
 w.chooseBuild('electric');expect(w.chooseBuild('ballistic')).toBe(true);
 expect(w.profileFor('scatter').chainHops).toBe(1);
 expect(w.profileFor('arc').chainHops).toBe(2);
 expect(w.chooseBuild('ballistic')).toBe(true);expect(w.build.refinements.ballistic).toBe(1);
});
it('optical choices alter live support parameters without removing existing weapons',()=>{
 const w=new World();w.growth.mastery=1;
 w.chooseBuild('optical');expect(w.supportProfile().laserUnlocked).toBe(true);
 expect(w.supportProfile().laserDamage).toBeCloseTo(34.5);
 expect(w.chooseBuild('optical')).toBe(false);
 w.growth.mastery=3;w.chooseBuild('optical');w.chooseBuild('optical');
 expect(w.supportProfile().laserInterval).toBe(2.25);expect(w.supportProfile().laserTargets).toBe(6);
 expect(w.activeWeapons).toEqual(['pulse']);expect(new World().build.spent).toBe(0);
});
it('lets a completed route refine without forcing other routes and never lowers existing damage',()=>{
 const w=new World();w.growth.mastery=4;
 for(let i=0;i<3;i++)w.chooseBuild('optical');
 const before=w.supportProfile();expect(w.chooseBuild('optical')).toBe(true);
 expect(w.build.baseSpent).toBe(3);expect(w.build.spent).toBe(4);
 expect(w.supportProfile().laserDamage).toBeCloseTo(before.laserDamage*1.1);
 expect(w.build.ranks.ballistic).toBe(0);expect(w.chooseBuild('optical')).toBe(false);
 expect(w.supportProfile().laserInterval).toBe(before.laserInterval);
});
it('supports continued choices after all base nodes with bounded beam and shot counts',()=>{
 const w=new World();w.growth.mastery=309;
 for(const route of ['electric','electric','electric','ballistic','ballistic','ballistic','optical','optical','optical'] as const)w.chooseBuild(route);
 const bulletCount=w.profileFor('scatter').offsets.length,targets=w.supportProfile().laserTargets;
 for(let i=0;i<100;i++)for(const route of ['ballistic','electric','optical'] as const)expect(w.chooseBuild(route)).toBe(true);
 expect(w.build.spent).toBe(309);expect(w.chooseBuild('electric')).toBe(false);
 expect(w.profileFor('scatter').offsets.length).toBe(bulletCount);expect(w.supportProfile().laserTargets).toBe(targets);
 expect(Number.isFinite(w.supportProfile().laserDamage)).toBe(true);
 expect(new World().build.refinements).toEqual({ballistic:0,electric:0,optical:0});
});
