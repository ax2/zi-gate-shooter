import{it,expect}from'vitest';
import{Assembly,parts,techById}from'../src/flight/technology';
import{salvageView,salvageChoices}from'../src/flight/salvage-view';
import{flightProfile,projectTechnology}from'../src/flight/profile';
import{flightChoiceHarness}from'./helpers/flight-choice-harness';

it('earned growth compares the actual cannon volley at unchanged calibration, not wallet size or total DPS',()=>{
 const a=new Assembly();Object.assign(a.inventory,{alloy:99,coil:99,lens:99});a.salvage=9;a.install('split');a.install('split');
 const before=JSON.stringify(a),p=flightProfile(a),v=salvageView(a);
 expect(v.volley).toBe(p.guns.count*p.guns.damage);expect(v.pickupVolleyPercent).toBe(Math.round((v.volley/(7*a.power('split'))-1)*100));
 expect(v.count).toBe(3);expect(v.collected).toBe(9);expect(JSON.stringify(a)).toBe(before);
 a.inventory.alloy=0;expect(salvageView(a)).toEqual(v);
});
it.each(['split','coil','laser'])('%s empty-wallet pictures show reachable recipes, never free equipment or missing ancestors',id=>{
 const a=new Assembly();a.installed.add(id);const before=JSON.stringify(a),ids=salvageChoices(a);
 expect(ids).toHaveLength(3);expect(ids.filter(key=>techById.get(key)!.component)).toHaveLength(2);
 for(const key of ids){expect(a.can(key)).toBe(false);expect(a.missing(key)).toHaveLength(0);expect(a.lockedBy(key)).toBeUndefined();}
 expect(JSON.stringify(a)).toBe(before);
});
it('manual entry is visibly available with zero materials and cannot pay for unavailable or unoffered cards',async()=>{
 const h=await flightChoiceHarness(),r=h.r;expect(r.activate('parts')).toBe(false);r.activate('start:split');
 expect(r.diagnostics().assemblyGuide.recipe?.id).toBe('hive');expect(h.controls.some(c=>c.action==='parts'&&c.label.includes('蜂巢副炮'))).toBe(true);
 const frozen=r.world.diagnostics(),timers=r.diagnostics().upgradeChoice;
 expect(r.activate('parts')).toBe(true);expect(r.mode).toBe('upgrade');expect(h.texts).toContain('拾取自动强化');
 expect(h.controls.some(c=>c.action.startsWith('upgrade-choice:'))).toBe(false);
 expect(r.activate('upgrade-choice:hive')).toBe(false);expect(r.activate('upgrade-choice:sun')).toBe(false);
 for(let i=0;i<60;i++)h.tick(false);r.hide();r.activate('weak');r.resize(1100,800,1);
 expect(r.world.diagnostics()).toEqual(frozen);r.key('Escape',true);expect(r.mode).toBe('playing');
 expect(r.diagnostics().upgradeChoice.seenParts).toBe(timers.seenParts);expect(r.diagnostics().upgradeChoice.nextOffer).toBe(timers.nextOffer);
});
it.each(['split','coil','laser'])('%s actual earned materials can be banked, reopened by picture and paid once without reducing collected growth',async starter=>{
 const h=await flightChoiceHarness(),r=h.r;r.activate('start:'+starter);expect(h.firstChoice()).toBe(true);r.activate('upgrade-bank');
 const frozen=r.world.diagnostics(),main=salvageView(r.world.assembly);expect(r.activate('parts')).toBe(true);
 const id=r.diagnostics().upgradeChoice.offers[0],a=r.world.assembly,cost={...a.cost(id)},wallet={...a.inventory},owned=[...a.installed],p=projectTechnology(a,id)!;
 expect(h.controls.some(c=>c.action==='upgrade-choice:'+id)).toBe(true);expect(r.world.diagnostics()).toEqual(frozen);
 expect(r.activate('upgrade-choice:'+id)).toBe(true);expect(r.mode).toBe('playing');expect(flightProfile(a)).toEqual(p.after);
 for(const part of parts)expect(a.inventory[part]).toBe(wallet[part]-(cost[part]??0));
 expect(owned.every(key=>a.has(key))).toBe(true);expect(salvageView(a)).toEqual(main);expect(r.world.time).toBe(frozen.time);
 expect(r.activate('upgrade-choice:'+id)).toBe(false);expect(new Set(h.controls.map(c=>c.action)).size).toBe(h.controls.length);
});
it('paused manual assembly and full-tree inspection return to pause; browsing cannot suppress the next automatic offer',async()=>{
 const h=await flightChoiceHarness(),r=h.r;r.activate('start:laser');r.activate('pause');const frozen=r.world.diagnostics(),offer=r.diagnostics().upgradeChoice.nextOffer;
 expect(r.activate('parts')).toBe(true);r.activate('upgrade-tree');expect(r.mode).toBe('tree');r.activate('close-tree');
 expect(r.mode).toBe('paused');expect(r.world.diagnostics()).toEqual(frozen);expect(r.diagnostics().upgradeChoice.nextOffer).toBe(offer);
 r.activate('parts');r.activate('upgrade-bank');expect(r.mode).toBe('paused');
 r.activate('home');expect(r.activate('parts')).toBe(false);r.activate('start:coil');
 expect(r.diagnostics().upgradeChoice.manual).toBe(false);expect(r.diagnostics().salvage.collected).toBe(0);
});
