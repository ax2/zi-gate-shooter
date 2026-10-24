import{it,expect}from'vitest';
import{weaponBlueprint}from'../src/flight/weapon-blueprint';
import{flightChoiceHarness}from'./helpers/flight-choice-harness';

it.each([
 ['hive',1,6],['hive',2,8],['hive',3,10],
 ['needles',1,3],['needles',2,5],['needles',3,7],
 ['seekorb',1,2],['seekorb',2,3],['seekorb',3,5],
]as const)('%s rank%s illustrates its real refitted count%s',(id,rank,count)=>{
 const m=weaponBlueprint(id,.08,rank)!;expect(m.shots).toHaveLength(count);expect(m.shots.every(p=>p.frame===(id==='hive'?1:id==='needles'?2:3))).toBe(true);
});
it('laser, orbital electrodes and blades remain different at each refit instead of sharing a generic fan',()=>{
 for(const[rank,counts]of[[1,[2,1,3]],[2,[3,2,4]],[3,[4,3,5]]]as const){
  const electrode=weaponBlueprint('electrodes',.08,rank)!,tracker=weaponBlueprint('tracker',.08,rank)!,blade=weaponBlueprint('blades',.08,rank)!;
  expect(electrode.mounts).toHaveLength(counts[0]);expect(electrode.beams.filter(b=>b.kind==='arc')).toHaveLength(counts[0]);
  expect(tracker.beams.filter(b=>b.kind==='laser')).toHaveLength(counts[1]);expect(blade.blades).toHaveLength(counts[2]);expect(blade.shots).toHaveLength(0);
 }
});
it('projectiles move and stop for reload, the orb curves, and the blades actually return before the next volley',()=>{
 const early=weaponBlueprint('seekorb',.12)!,late=weaponBlueprint('seekorb',.7)!;expect(early.shots).not.toEqual(late.shots);expect(weaponBlueprint('seekorb',1.3)!.shots).toHaveLength(0);
 expect(weaponBlueprint('hive',.9)!.shots).toHaveLength(0);expect(weaponBlueprint('tracker',.5)!.beams).toHaveLength(0);
 const outward=weaponBlueprint('bladewave',.275)!,back=weaponBlueprint('bladewave',.825)!;expect(outward.blades).toHaveLength(3);expect(back.blades).toHaveLength(3);
 expect(outward.blades[0].x).toBeCloseTo(back.blades[0].x);expect(Math.abs(outward.blades[0].angle-back.blades[0].angle)).toBeCloseTo(Math.PI);expect(weaponBlueprint('bladewave',1.2)!.blades).toHaveLength(0);
});
it('six evolved illustrations show their distinct attacks and delayed explosions without pretending the generic preview is live combat',()=>{
 expect(weaponBlueprint('starhive',.1)!.shots.map(p=>p.frame)).toEqual([4,4]);expect(weaponBlueprint('plasmacore',.1)!.shots.map(p=>p.frame)).toEqual([5]);
 expect(weaponBlueprint('starhive',.1)!.blasts).toHaveLength(0);expect(weaponBlueprint('starhive',.8)!.blasts).toHaveLength(2);expect(weaponBlueprint('plasmacore',.8)!.blasts).toHaveLength(1);
 expect(weaponBlueprint('thundernet',.1)!.beams[0]).toMatchObject({kind:'arc'});expect(weaponBlueprint('thundernet',.1)!.beams[0].points).toHaveLength(4);
 expect(weaponBlueprint('aurorawing',.1)!.beams).toHaveLength(2);expect(weaponBlueprint('huntprism',.1)!.beams).toHaveLength(3);expect(weaponBlueprint('bladewave',.1)!.blades).toHaveLength(3);
});
it('all twelve loops are deterministic and bounded, tolerate invalid input, and reject unrelated technology IDs',()=>{
 const ids=['hive','needles','seekorb','electrodes','tracker','blades','starhive','thundernet','plasmacore','aurorawing','huntprism','bladewave'];
 for(const id of ids)for(const t of[NaN,Infinity,-1,0,.12,.5,.8,2,10,10000]){
  const m=weaponBlueprint(id,t,NaN)!;expect(m).toEqual(weaponBlueprint(id,t,NaN));expect(m.interval).toBeGreaterThan(0);expect(m.shots.length).toBeLessThanOrEqual(10);expect(m.mounts.length).toBeLessThanOrEqual(7);
  for(const p of[...m.mounts,...m.shots,...m.blades,...m.blasts,...m.targets,...m.beams.flatMap(b=>b.points)])expect(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<150&&Math.abs(p.y)<150).toBe(true);
 }
 expect(weaponBlueprint('chassis',1)).toBeUndefined();expect(weaponBlueprint('missing',1)).toBeUndefined();expect(weaponBlueprint('toString',1)).toBeUndefined();
});
it('normal earned picture choice animates while the entire World stays frozen, and an actual payment still installs only the selected weapon',async()=>{
 const h=await flightChoiceHarness(),r=h.r;r.activate('start:split');expect(h.firstChoice()).toBe(true);const before=r.world.diagnostics(),wallet={...r.world.assembly.inventory};
 for(let f=0;f<120;f++)h.tick(false);expect(r.world.diagnostics()).toEqual(before);expect(h.texts).toContain('演示');expect(h.controls.filter(c=>c.action.startsWith('upgrade-choice:')).map(c=>c.action)).toContain('upgrade-choice:hive');
 expect(r.activate('upgrade-choice:hive')).toBe(true);expect(r.world.assembly.has('hive')).toBe(true);expect(r.world.assembly.has('needles')).toBe(false);expect(r.world.assembly.inventory.alloy).toBe(wallet.alloy-3);expect(r.world.assembly.salvage).toBe(before.mainGun.collected);
 r.activate('tree');r.activate('tree-page:2');const frozen=r.world.diagnostics();for(let f=0;f<60;f++)h.tick(false);expect(r.world.diagnostics()).toEqual(frozen);expect(h.texts).toContain('演示');
});
