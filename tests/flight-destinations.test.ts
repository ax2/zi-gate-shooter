import{it,expect}from'vitest';
import{FlightWorld,F}from'../src/flight/world';
import{destinationOptions,destinationView,patternIndex}from'../src/flight/destinations';
import{flightChoiceHarness}from'./helpers/flight-choice-harness';
import{partInfo}from'../src/flight/technology';

it('each battle offers two other themes and theme revisits retain the actual loop variant',()=>{
 for(let previous=0;previous<3;previous++){const ids=destinationOptions(previous);expect(ids).toHaveLength(2);expect(ids).not.toContain(previous);for(const id of ids){const d=destinationView(7,id)!;expect(d.family).toBe(id);expect(d.pattern.variant).toBe(2);expect(patternIndex(7,id)).toBe(6+id);}}
 expect(destinationView(1,9)).toBeUndefined();
});
function boundary(){const w=new FlightWorld(1337);w.sector=1;w.bossKills=1;return w;}
it('selection only works once at a real intermission boundary, cannot return to the last family, and never spends or awards inventory',()=>{
 const w=new FlightWorld(1337);expect(w.nextDestination).toBeUndefined();expect(w.chooseDestination(1)).toBe(false);
 w.sector=1;w.bossKills=1;w.assembly.inventory.coil=7;const wallet={...w.assembly.inventory};
 expect(w.nextDestination?.options).toEqual([1,2]);expect(w.chooseDestination(0)).toBe(false);expect(w.chooseDestination(NaN)).toBe(false);expect(w.chooseDestination(2)).toBe(true);
 expect(w.sector).toBe(1);expect(w.family).toBe(2);expect(w.patternSector).toBe(2);expect(w.nextDestination).toBeUndefined();expect(w.chooseDestination(1)).toBe(false);expect(w.assembly.inventory).toEqual(wallet);expect(w.partsCollected).toBe(0);
 const late=boundary();late.step(F.step);expect(late.nextDestination).toBeUndefined();expect(late.chooseDestination(2)).toBe(false);
});
it.each([1,2])('family%s changes actual encounter/squad/elite/boss kinds, while HP still uses battle index1',family=>{
 const w=boundary();expect(w.chooseDestination(family)).toBe(true);const core=w as any;
 w.sectorTime=18;core.tryEncounter();expect(w.encounter?.kind).toBe(family===1?'mines':'shield');
 w.enemies=[];w.sectorTime=12;expect(core.trySquadWave()).toBe(true);expect(w.squad?.kind).toBe(family===1?'column':'wheel');expect(w.enemies[0].maxHp).toBeCloseTo((family===1?90:105)*1.4);
 w.enemies=[];w.sectorTime=33;core.wave=3;expect(core.tryRaiderWave()).toBe(true);expect(w.enemies.find(e=>e.raider)?.raider?.kind).toBe(family===1?'splitter':'lattice');
 w.enemies=[];w.phase='boss';core.beginBoss();const boss=w.enemies.find(e=>e.kind==='boss')!;expect(boss.maxHp).toBe(2400*1.4);expect(w.enemies.filter(e=>e.bossPart).every(e=>e.bossPart!.kind===(family===1?'lens':'minepod'))).toBe(true);
 core.hit(boss,1700,'guns');expect(w.bossCorePhase?.kind).toBe(family===1?'crossbeam':'minefield');
});
it('choosing a material family only sets real target loot; its four-part reward must still be killed and collected',()=>{
 const w=boundary();w.chooseDestination(2);w.sectorTime=18;const core=w as any;core.tryEncounter();const e=w.enemies.find(e=>e.id===w.encounter!.target)!;e.x=e.px=360;e.y=e.py=500;
 expect(w.assembly.inventory.lens).toBe(0);expect(w.encountersWon).toBe(0);core.hit(e,100000,'guns');const reward=w.loot.find(l=>l.encounterReward===w.encounter!.id)!;
 expect(reward.part).toBe('lens');expect(reward.amount).toBe(4);expect(w.assembly.inventory.lens).toBe(0);expect(w.encounter?.claimed).toBe(false);
 for(let i=0;i<160&&!w.encounter?.claimed&&w.phase!=='dead';i++)w.step(F.step,reward.x,reward.y);
 expect(w.encounter?.claimed).toBe(true);expect(w.assembly.inventory.lens).toBeGreaterThanOrEqual(4);
});
it('a rematched theme cannot reset difficulty, consecutive restriction follows the chosen theme, and history is bounded/copy-safe',()=>{
 const w=boundary();expect(w.chooseDestination(2)).toBe(true);const core=w as any;
 for(let sector=2;sector<=17;sector++){core.previousFamily=w.family;w.sector=sector;w.bossKills=sector;w.sectorTime=0;const previous=w.family,options=w.nextDestination!.options;expect(options).not.toContain(previous);expect(w.chooseDestination(options[0])).toBe(true);}
 const d=w.diagnostics();expect(d.airspaceRoute.history).toHaveLength(12);const latest={...d.airspaceRoute.history.at(-1)!};d.airspaceRoute.history[0].family=99;expect(w.diagnostics().airspaceRoute.history[0].family).not.toBe(99);
 const e=core.spawn('drone',300,100);expect(e.maxHp).toBeCloseTo(16*(1+17*.4));expect(latest.sector).toBe(17);
});
async function normalExit(){const h=await flightChoiceHarness(1337,false),r=h.r;r.activate('start:split');expect(h.firstChoice()).toBe(true);expect(r.activate('upgrade-choice:hive')).toBe(true);
 for(let f=0;f<180*60&&r.mode!=='sector'&&r.world.phase!=='dead';f++){
  if(r.mode==='upgrade')r.activate('upgrade-bank');const a=r.world.assembly,id=!a.has('starhive')?a.nextStep('starhive'):undefined;
  if(r.mode==='playing'&&id&&a.can(id)){r.activate('tree');r.activate('select:'+id);expect(r.activate('assemble')).toBe(true);r.activate('close-tree');}h.tick();
 }
 expect(r.mode).toBe('sector');expect(r.world.bossKills).toBe(1);return h;
}
it('normal boss defeat opens exactly two pictured destinations; page/blur/weak/resize/input freeze the world until a valid pictured selection',async()=>{
 const h=await normalExit(),r=h.r,w=r.world,choice=w.nextDestination!,frozen=w.diagnostics(),wallet={...w.assembly.inventory},owned=[...w.assembly.installed];
 expect(h.controls.filter(c=>c.action.startsWith('sector-choice:')).map(c=>c.action)).toEqual(choice.options.map(id=>'sector-choice:'+id));for(const id of choice.options){const d=destinationView(w.sector,id)!;expect(h.controls.find(c=>c.action==='sector-choice:'+id)?.label).toContain(partInfo[d.part].name+'4份');}
 expect(h.controls.some(c=>c.action==='pause')).toBe(true);r.key('Escape',true);expect(r.mode).toBe('paused');expect(r.activate('resume')).toBe(true);expect(r.mode).toBe('sector');expect(r.activate('parts')).toBe(false);expect(r.activate('tree')).toBe(false);expect(r.activate('sector-choice:')).toBe(false);expect(r.activate('sector-choice:0')).toBe(false);r.key('w',true);r.touchStart(1,0,0);r.touchMove(1,200,200);r.hide();r.activate('weak');r.resize(1100,800,1);for(let i=0;i<120;i++)h.tick(false);expect(w.diagnostics()).toEqual(frozen);
 expect(r.activate('sector-choice:2')).toBe(true);expect(r.mode).toBe('playing');expect(w.family).toBe(2);expect(w.sector).toBe(1);expect(w.time).toBe(frozen.time);expect(w.player).toEqual(frozen.player);expect(w.assembly.inventory).toEqual(wallet);expect([...w.assembly.installed]).toEqual(owned);expect(w.assembly.salvage).toBe(frozen.mainGun.collected);expect(w.target).toBe(frozen.target);expect(r.activate('sector-choice:1')).toBe(false);
 r.activate('pause');r.activate('home');r.activate('start:coil');expect(r.world.family).toBe(0);expect(r.world.diagnostics().airspaceRoute.history).toHaveLength(0);
});
it.each([1,2])('normal pictured family%s changes the next real battle and exposes its actual action target',async family=>{
 const h=await normalExit(),r=h.r,w=r.world;expect(r.activate('sector-choice:'+family)).toBe(true);
 for(let f=0;f<38*60&&w.phase!=='dead'&&w.encounter?.sector!==1;f++){if(r.mode==='upgrade')r.activate('upgrade-bank');h.tick();}
 expect(w.player.hp).toBeGreaterThan(0);expect(w.encounter?.sector).toBe(1);expect(w.encounter?.kind).toBe(family===1?'mines':'shield');expect(w.squad?.kind).toBe(family===1?'column':'wheel');expect(w.diagnostics().airspaceRoute.history[0].family).toBe(family);
});
