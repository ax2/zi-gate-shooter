import{it,expect}from'vitest';
import{Assembly,techById,parts}from'../src/flight/technology';
import{assemblyGuide,materialCells}from'../src/flight/assembly-guide';
import{upgradeChoices}from'../src/flight/upgrades';
import{flightChoiceHarness}from'./helpers/flight-choice-harness';
import{flightProfile}from'../src/flight/profile';

it.each(['split','coil','laser'])('%s shows real material sockets then the same affordable card as the prompt, without spending',starter=>{
 const a=new Assembly();a.installed.add(starter);const part=parts[techById.get(starter)!.column];
 for(const count of[0,1,2,3,9]){a.inventory[part]=count;const before=JSON.stringify(a),g=assemblyGuide(a,undefined,{part,amount:1,until:10,repaired:0});
  expect(g.recipe).toBeDefined();for(const c of g.recipe!.cost){expect(c.have).toBe(a.inventory[c.part]);expect(c.missing).toBe(Math.max(0,c.need-c.have));expect(c.filled).toBe(Math.min(c.need,c.have));}
  if(count>=3)expect(g.offers).toEqual(upgradeChoices(a,undefined,{part,amount:1,until:10,repaired:0}));
  expect(g.recipe!.id).toBe(g.offers[0]);expect(g.recipe!.ready).toBe(a.can(g.recipe!.id));expect(JSON.stringify(a)).toBe(before);
 }
});
it('installed pictures contain only real equipment and cannot mutate the Assembly; locked recipes stay excluded',()=>{
 const a=new Assembly();for(const id of['split','hive','coil'])a.installed.add(id);a.calibrated.hive=2;
 const g=assemblyGuide(a,'needles');expect(g.installed).toEqual([['split','hive'],['coil'],[]]);expect(g.total).toBe(3);
 expect(g.offers).not.toContain('needles');expect(g.recipe?.id).not.toBe('needles');g.installed[0].pop();expect(a.has('hive')).toBe(true);
});
it('a foreign material points at a reachable recipe that actually uses it; a tracked recipe remains visible beside affordable alternatives',()=>{
 const a=new Assembly();a.installed.add('split');a.inventory.coil=1;
 const receipt={part:'coil' as const,amount:1,until:10,repaired:0};
 expect(assemblyGuide(a,undefined,receipt).recipe?.id).toBe('coil');
 a.inventory.coil=2;const g=assemblyGuide(a,'needles',receipt);
 expect(g.recipe?.id).toBe('needles');expect(g.recipe?.ready).toBe(false);expect(g.offers).toContain('coil');
 expect(g.recipe?.cost).toEqual([{part:'alloy',need:3,have:0,filled:0,missing:3}]);
});
it('compressed late-recipe cells cannot look full when only half of twelve parts were collected',()=>{
 expect(materialCells(2,3)).toEqual([true,true,false]);expect(materialCells(6,12)).toEqual([true,true,true,false,false,false]);
 expect(materialCells(11,12).every(Boolean)).toBe(false);expect(materialCells(12,12).every(Boolean)).toBe(true);expect(materialCells(50,12)).toHaveLength(6);
});
it.each([['split','hive'],['split','needles'],['coil','seekorb'],['coil','electrodes'],['laser','tracker'],['laser','blades']])('%s can select %s before collecting, then earn/pay once through pictures with old attacks retained',async(starter,component)=>{
 const h=await flightChoiceHarness(),r=h.r;r.activate('start:'+starter);const frozen=r.world.diagnostics();
 r.activate('parts');expect(h.controls.some(c=>c.action==='upgrade-track:'+component)).toBe(true);
 expect(r.activate('upgrade-track:sun')).toBe(false);expect(r.activate('upgrade-track:'+component)).toBe(true);expect(r.mode).toBe('playing');
 expect(r.world.target).toBe(component);const after=r.world.diagnostics();expect({...after,target:frozen.target}).toEqual(frozen);
 expect(r.diagnostics().assemblyGuide.recipe?.id).toBe(component);expect(r.diagnostics().assemblyGuide.recipe?.ready).toBe(false);
 expect(h.firstChoice()).toBe(true);expect(r.diagnostics().upgradeChoice.offers[0]).toBe(component);
 const a=r.world.assembly,before=flightProfile(a),time=r.world.time,wallet={...a.inventory},cost={...a.cost(component)};
 expect(r.activate('upgrade-choice:'+component)).toBe(true);expect(r.world.time).toBe(time);expect(a.has(starter)).toBe(true);expect(a.has(component)).toBe(true);
 for(const p of parts)expect(a.inventory[p]).toBe(wallet[p]-(cost[p]??0));expect(flightProfile(a).guns).toEqual(before.guns);
 expect(r.diagnostics().assemblyGuide.installed.flat()).toContain(component);expect(r.activate('upgrade-choice:'+component)).toBe(false);
});
it('an earned pickup opens the picture page directly; browsing freezes the world and never pays',async()=>{
 const h=await flightChoiceHarness(),r=h.r;r.activate('start:split');expect(h.firstChoice()).toBe(true);r.activate('upgrade-bank');
 const guide=r.diagnostics().assemblyGuide,before=r.world.diagnostics();expect(r.activate('pickup-inspect')).toBe(true);expect(r.mode).toBe('upgrade');
 expect(r.diagnostics().upgradeChoice.offers).toEqual(guide.offers);expect(r.world.diagnostics()).toEqual(before);
 expect(h.controls.some(c=>c.action==='upgrade-choice:'+guide.recipe!.id)).toBe(true);r.key('Escape',true);expect(r.mode).toBe('playing');expect(r.world.diagnostics()).toEqual(before);
});
it('tracking while paused returns to pause and resets on restart; armor is never a crafting link',async()=>{
 const h=await flightChoiceHarness(),r=h.r;r.activate('start:coil');r.activate('pause');r.activate('parts');
 const before=r.world.diagnostics();expect(r.activate('upgrade-track:electrodes')).toBe(true);expect(r.mode).toBe('paused');expect(r.world.assembly.inventory).toEqual(before.inventory);
 r.activate('home');r.activate('start:laser');expect(r.world.target).toBeUndefined();expect(r.diagnostics().assemblyGuide.installed.flat()).toEqual(['laser']);
 r.world.pickupReceipt={part:'armor',amount:1,until:10,repaired:0};expect(r.activate('pickup-inspect')).toBe(false);
});
