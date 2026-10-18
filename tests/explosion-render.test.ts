import { expect, it } from 'vitest';
import { parseSave } from '../src/game/canvas-runtime';
import {createRenderFixture as fixture} from './helpers/render-fixture';
import { type Save } from '../src/ui/storage';
import { World } from '../src/core/world';
import { C } from '../src/core/config';
import {achievements,achievementGroups} from '../src/core/achievements';

it.each([false,true])('support beam expires, freezes on pause, and clears on restart (weak=%s)', async weak => {
  const f=fixture(weak); await f.runtime.load(); f.runtime.start();
  f.runtime.world.growth.mastery=3; f.tick();
  expect(f.runtime.diagnostics().supportBeams).toBe(1);
  f.runtime.pause(); for(let i=0;i<30;i++)f.tick();
  expect(f.runtime.diagnostics().supportBeams).toBe(1);
  f.runtime.start(); expect(f.runtime.diagnostics().supportBeams).toBe(0);
  f.runtime.world.growth.mastery=3;f.tick();
  for(let i=0;i<30;i++)f.tick();
  expect(f.runtime.diagnostics().supportBeams).toBe(0);
});

// Existing visual checks continue via real earned choices, never by suppressing the popup.
function resolveResearch(f:ReturnType<typeof fixture>,reference?:World){
 while(f.runtime.mode==='choice'){
  const fork=f.runtime.world.build.ranks.optical===1,refine=f.runtime.world.canRefinePhoton();
  expect(f.runtime.activateControl('build:optical')).toBe(true);
  if(fork)expect(f.runtime.activateControl('branch:burn')).toBe(true);
  if(refine)expect(f.runtime.activateControl('branch:photon-reach')).toBe(true);
  if(reference)expect(reference.chooseBuild('optical',fork?'burn':refine?'photon-reach':undefined)).toBe(true);
 }
}
function expectVisibleCombatCopy(f:ReturnType<typeof fixture>,title:string,detail?:string){
 const copy=f.runtime.diagnostics().combatCopy;expect(copy).not.toBeNull();if(!copy)throw new Error('Missing visible combat copy');
 expect(copy.title).toBe(title);if(detail)expect(copy.lines.join('')).toBe(detail);
 expect(copy.bounds.top).toBeGreaterThanOrEqual(190);expect(copy.bounds.bottom).toBeLessThanOrEqual(1280);
 for(const row of copy.rows){expect(row.width).toBeLessThanOrEqual(560);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]===row.text&&c.args[2]===row.y)).toBe(true);}
 return copy;
}
const blasts = (f: ReturnType<typeof fixture>) => f.calls.filter(c => c.kind === 'drawImage' && (c.args[0].src.endsWith('explosion-v1.png')||c.args[0].src.endsWith('boss-reactor-v1.png')));

it('retains a completed target receipt through several pending upgrades until combat resumes',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.activateControl('combos-menu');f.runtime.activateControl('recipe-goal:ion');f.runtime.activateControl('combos-back');f.runtime.start();
 const w=f.runtime.world;w.growth.mastery=4;w.chooseBuild('electric');w.chooseBuild('electric');
 const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';f.tick();expect(f.runtime.mode).toBe('choice');
 expect(f.runtime.activateControl('build:electric')).toBe(true);expect(f.runtime.mode).toBe('choice');expect(f.runtime.diagnostics().recipeGoal?.ready).toBe(true);
 expect(f.runtime.activateControl('build:ballistic')).toBe(true);expect(f.runtime.activateControl('build:optical')).toBe(true);expect(f.runtime.mode).toBe('playing');
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='目标成形 · 离子风暴')).toBe(true);
});

it('target supply guidance yields to actual interceptor warnings and live projectiles in the help area',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.activateControl('combos-menu');f.runtime.activateControl('recipe-goal:fracture');f.runtime.activateControl('combos-back');f.runtime.start();
 const b=f.runtime.world.spawn('crate',500,600,2);b.weaponKind='blast';f.tick();expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='目标补给 · 裂甲爆破')).toBe(true);
 const elite=f.runtime.world.spawn('elite',360,400);elite.pattern='intercept';elite.warning=.75;elite.timer=.75;f.tick();
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='截击翼炮：留意两侧实弹')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='目标补给 · 裂甲爆破')).toBe(false);
 f.runtime.world.bullets.push({id:99999,x:360,y:1180,px:360,py:1180,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});f.tick();expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='截击翼炮：留意两侧实弹')).toBe(false);expect(f.calls.some(c=>c.kind==='fillRect'&&c.color==='#ffead7')).toBe(true);
});

it('selects/cancels a remembered goal from menu and pause without advancing or granting anything',async()=>{
 const writes:Save[]=[];const f=fixture(false,undefined,save=>writes.push(JSON.parse(JSON.stringify(save))));await f.runtime.load();
 const world=f.runtime.world,before=JSON.stringify(world);expect(f.runtime.activateControl('combos-menu')).toBe(true);
 for(const id of ['storm','prism','photon','fracture','ion'])expect(f.runtime.activateControl('recipe-goal:'+id)).toBe(true);
 expect(f.runtime.save.recipeGoal).toBe('ion');expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='离子风暴')).toBe(true);expect(JSON.stringify(world)).toBe(before);
 expect(f.runtime.back()).toBe('stay');f.tick();expect(f.runtime.mode).toBe('menu');expect(parseSave(writes.at(-1)).recipeGoal).toBe('ion');
 expect(f.runtime.activateControl('start')).toBe(true);f.tick();expect(f.runtime.activateControl('pause')).toBe(true);expect(f.runtime.activateControl('loadout')).toBe(true);expect(f.runtime.activateControl('combos')).toBe(true);
 const current=f.runtime.world,time=current.time,snapshot=JSON.stringify(current);expect(f.runtime.activateControl('recipe-goal:ion')).toBe(true);expect(f.runtime.save.recipeGoal).toBeNull();expect(f.runtime.activateControl('recipe-goal:photon')).toBe(true);
 for(let i=0;i<60;i++)f.tick();expect(current.time).toBe(time);expect(JSON.stringify(current)).toBe(snapshot);expect(f.runtime.activateControl('combos-back')).toBe(true);expect(f.runtime.mode).toBe('loadout');
});
it('marks the missing crate and pickup, keeps its original role, and reports completion only after real collection',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.activateControl('combos-menu');f.runtime.activateControl('recipe-goal:fracture');f.runtime.activateControl('combos-back');f.runtime.start();
 const w=f.runtime.world;const a=w.spawn('pickup',360,C.playerY,2);a.weaponKind='pierce';f.tick();resolveResearch(f);expect(f.runtime.diagnostics().recipeGoal?.ready).toBe(false);
 const wanted=w.spawn('crate',500,600,2);wanted.weaponKind='blast';const other=w.spawn('crate',220,600,2);other.weaponKind='pierce';f.tick();
 expect(f.calls.filter(c=>c.kind==='fillText'&&c.args[0]==='目标')).toHaveLength(1);expect(f.calls.some(c=>c.kind==='strokeRect'&&c.args[0]===382&&c.stroke==='#ffe19a')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='拾取成形·裂甲爆破')).toBe(true);expect(w.activeWeapons).not.toContain('blast');
 const pickup=w.spawn('pickup',360,C.playerY-80,2);pickup.weaponKind='blast';f.tick();expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='目标·快拾取叠加爆裂炮')).toBe(true);expect(f.runtime.diagnostics().recipeGoal?.ready).toBe(false);
 pickup.y=C.playerY;f.tick();expect(w.fractureUnlocked()).toBe(true);expect(f.runtime.diagnostics().recipeGoal?.ready).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='目标成形 · 裂甲爆破')).toBe(true);expect(w.activeWeapons).toContain('pulse');
 f.runtime.start();expect(f.runtime.save.recipeGoal).toBe('fracture');expect(f.runtime.diagnostics().recipeGoal?.ready).toBe(false);
});
it('shows the exact needed upgrade while preserving the original numerical comparison',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.activateControl('combos-menu');f.runtime.activateControl('recipe-goal:prism');f.runtime.activateControl('combos-back');f.runtime.start();
 const p=f.runtime.world.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';f.tick();expect(f.runtime.mode).toBe('choice');
 expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('光学路线 0/3→1/3'))).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('新增激光'))).toBe(true);expect(f.calls.filter(c=>c.kind==='fillText'&&c.args[0]==='目标所需')).toHaveLength(2);
});

it.each([false,true])('interceptor wing/core cues follow actual guns, pause with the world and remain below real hostile bullets (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();f.runtime.touchStart(91,68,900);
 const b=f.runtime.world.spawn('elite',360,360);b.pattern='intercept';b.timer=.15;b.dropGrace=.45;
 for(let i=0;i<10;i++)f.tick();
 expect(f.calls.some(c=>c.kind==='arc'&&c.args[0]===308&&Math.abs(Number(c.args[1])-b.y-b.height/2)<1e-6)).toBe(true);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='截击·翼炮蓄能')).toBe(true);
 const label=f.calls.find(c=>c.kind==='fillText'&&c.args[0]==='截击·翼炮蓄能');expect(Number(label!.args[2])+11).toBeLessThan(b.y-b.height*.68);
 const before=JSON.stringify(f.runtime.diagnostics().interceptors);f.runtime.pause();for(let i=0;i<30;i++)f.tick();expect(JSON.stringify(f.runtime.diagnostics().interceptors)).toBe(before);expect(f.runtime.activateControl('resume')).toBe(true);
 for(let i=0;i<120;i++)f.tick();
 expect(b.interceptWingShots).toBe(2);expect(b.interceptCoreShots).toBe(3);
 const cue=f.calls.reduce((last,c,i)=>c.kind==='stroke'&&c.stroke==='#ff947b'?i:last,-1),hostile=f.calls.reduce((last,c,i)=>c.kind==='fill'&&c.color==='#ff7756'?i:last,-1);
 expect(cue).toBeGreaterThan(0);expect(hostile).toBeGreaterThan(cue);f.runtime.start();expect(f.runtime.diagnostics().interceptors).toEqual([]);
});

it.each([false,true])('evolved optical effects share impact budgets, stay beneath hazards, freeze, expire and reset (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.growth.mastery=4;for(let i=0;i<3;i++)w.chooseBuild('optical');w.chooseBuild('ballistic');
 for(const side of [-1,0,1])for(const y of [700,640,580,520,460,400]){const x=360+side*(42+138*(924-y)/684),b=w.spawn('armor',x,y);b.hp=b.maxHp=10000;b.speed=0;b.timer=999;}
 w.bullets=[{id:99999,x:600,y:800,px:600,py:800,vx:0,vy:0,damage:1,age:0,active:true,hostile:true}];f.tick();
 expect(f.runtime.diagnostics().laserBands).toEqual([3,3,3]);expect(f.runtime.diagnostics().opticalImpacts).toBeGreaterThan(0);expect(f.runtime.diagnostics().opticalImpacts).toBeLessThanOrEqual(weak?4:12);
 expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#62dfff'&&c.lineWidth!>=11&&c.lineWidth!<=12)).toBe(true);expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#c89aff'&&c.lineWidth===3.5)).toBe(true);
 const crown=f.calls.reduce((last,c,i)=>c.kind==='stroke'&&c.stroke==='#85eaff'?i:last,-1),hostile=f.calls.reduce((last,c,i)=>c.kind==='fill'&&c.color==='#ff7756'?i:last,-1);expect(crown).toBeGreaterThan(0);expect(hostile).toBeGreaterThan(crown);
 const count=f.runtime.diagnostics().opticalImpacts;f.runtime.pause();for(let i=0;i<30;i++)f.tick();expect(f.runtime.diagnostics().opticalImpacts).toBe(count);expect(f.runtime.activateControl('resume')).toBe(true);for(let i=0;i<24;i++)f.tick();expect(f.runtime.diagnostics().opticalImpacts).toBe(0);f.runtime.start();expect(f.runtime.diagnostics().opticalImpacts).toBe(0);
});

it('shows every achievement once across readable pages and keeps the footer clear of the return control',async()=>{
 const f=fixture();await f.runtime.load();expect(f.runtime.activateControl('achievements')).toBe(true);const seen=new Set<string>();
 for(const group of Object.keys(achievementGroups)){
  f.calls.length=0;expect(f.runtime.activateControl('achievement-group:'+group)).toBe(true);
  while(true){
   for(const a of achievements){const row=f.calls.find(c=>c.kind==='fillText'&&c.args[0]===a.detail);if(row){expect(seen.has(a.id)).toBe(false);seen.add(a.id);expect(row.args[2]-12).toBeGreaterThan(310);expect(row.args[2]+12).toBeLessThan(995);}}
   const footer=f.calls.find(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('记录保存在本机'))!,button=(f.runtime as any).buttons.find((b:any)=>b.action==='achievements-back');expect(footer.args[2]-11).toBeGreaterThan(button.y+button.h);
   f.calls.length=0;if(!f.runtime.activateControl('achievement-page:next'))break;
  }
 }
 expect(seen.size).toBe(achievements.length);
});

it('tracks a visible tactical goal through the menu and a fresh run without changing combat, and can clear it',async()=>{
 const f=fixture();await f.runtime.load();expect(f.runtime.activateControl('achievements')).toBe(true);expect(f.runtime.activateControl('track:ace')).toBe(false);expect(f.runtime.activateControl('achievement-group:tactics')).toBe(true);
 const before=JSON.stringify(f.runtime.world);expect(f.runtime.activateControl('track:ace')).toBe(true);expect(f.runtime.save.achievements.tracked).toBe('ace');expect(JSON.stringify(f.runtime.world)).toBe(before);
 expect(f.runtime.activateControl('achievements-back')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('下局目标 · 王牌猎手'))).toBe(true);
 expect(f.runtime.activateControl('start')).toBe(true);expect(f.runtime.save.achievements.tracked).toBe('ace');expect(f.runtime.world.growth.bonus).toBe(0);expect(f.runtime.world.aceWins).toBe(0);
 expect(f.runtime.activateControl('pause')).toBe(true);expect(f.runtime.activateControl('home')).toBe(true);expect(f.runtime.activateControl('achievements')).toBe(true);expect(f.runtime.activateControl('track-clear')).toBe(true);expect(f.runtime.save.achievements.tracked).toBeNull();
});
it('writes a second actual certification even when it earns no new badge, and reloads that record',async()=>{
 const writes:Save[]=[];const f=fixture(false,undefined,save=>writes.push(JSON.parse(JSON.stringify(save))));await f.runtime.load();f.runtime.save.achievements.unlocked=['proof','specialist'];f.runtime.save.achievements.certifiedBuilds=['storm'];f.runtime.start();
 const w=f.runtime.world;w.growth.mastery=3;for(let i=0;i<3;i++)w.chooseBuild('electric');expect(w.acceptContract('research','ion')).toBe(true);w.phase='boss';w.player.x=w.player.px=68;f.runtime.touchStart(731,68,900);
 const a=w.spawn('armor',360,600),b=w.spawn('armor',460,600);for(const body of [a,b]){body.hp=body.maxHp=10000;body.speed=0;body.timer=999;}
 writes.length=0;
 for(let group=0;group<3&&w.contract!.status==='active';group++){
  for(let i=0;i<6&&w.contract!.status==='active';i++){w.bullets=[{id:99990+i,x:a.x,y:a.y,px:a.x,py:a.y,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'arc'}];f.tick();}
  if(w.contract!.status==='active')for(let i=0;i<50;i++)f.tick();
 }
 expect(w.contract!.status).toBe('won');expect([...w.certifiedBuilds]).toEqual(['ion']);expect(f.runtime.diagnostics().runAchievements).toEqual([]);expect(writes.length).toBeGreaterThan(0);expect(parseSave(writes.at(-1)).achievements.certifiedBuilds).toEqual(['storm','ion']);
});

it('browses hunter risk without spending, freezes it on acceptance, and awards the extra point only through a visible claim',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;const pickup=w.spawn('pickup',360,C.playerY,2);pickup.weaponKind='pulse';f.tick();resolveResearch(f);const research=w.researchPoints;
 expect(f.runtime.activateControl('contracts-live')).toBe(true);expect(f.runtime.activateControl('hunt-next')).toBe(true);expect(w.contract).toBeUndefined();expect(w.researchPoints).toBe(research);
 expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('幸存者暴走'))).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('＋研发1点'))).toBe(true);
 expect(f.runtime.activateControl('contract:hunter')).toBe(true);expect(w.contract!.hunt).toBe('crossfire');expect(f.runtime.activateControl('hunt-next')).toBe(false);expect(f.runtime.activateControl('resume')).toBe(true);f.tick();
 const targets=w.bodies.filter(b=>b.bountyRound===w.round);expect(targets).toHaveLength(2);
 expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('配件强化')&&c.args[2]===1208)).toBe(true);
 expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('成就达成'))).toBe(false);
 for(const [i,b] of targets.entries()){w.bullets=[{id:99990+i,x:b.x,y:250,px:b.x,py:250,vx:0,vy:0,damage:10000,age:0,active:true,hostile:false}];f.tick();}
 expect(f.runtime.mode).toBe('contract-reward');expect(w.researchPoints).toBe(research);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('额外研发+1同时领取'))).toBe(true);
 expect(f.runtime.activateControl('contract-claim:pulse')).toBe(true);expect(w.researchPoints).toBe(research+1);expect(f.runtime.mode).toBe('choice');expect(f.runtime.activateControl('contract-claim:pulse')).toBe(false);expect(w.researchPoints).toBe(research+1);
});

it.each([false,true])('real photon damage has bounded visible light, freezes on pause, expires and clears on restart (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;
 w.growth.mastery=4;for(let i=0;i<4;i++)w.chooseBuild('optical');w.phase='recovery';const pickup=w.spawn('pickup',360,C.playerY,2);pickup.weaponKind='arc';f.tick();resolveResearch(f);w.phase='boss';
 for(const x of [360,500,590]){const b=w.spawn('armor',x,700);b.hp=b.maxHp=10000;b.speed=0;b.timer=999;}
 f.tick();expect(w.laserArcHits).toBe(2);expect(f.runtime.diagnostics().laserArcBeams).toBe(2);expect(f.runtime.diagnostics().arcs).toBeLessThanOrEqual(12);
 expect(f.calls.some(c=>c.kind==='stroke'&&c.composite==='lighter')).toBe(true);
 f.runtime.pause();for(let i=0;i<30;i++)f.tick();expect(f.runtime.diagnostics().laserArcBeams).toBe(2);
 expect(f.runtime.activateControl('resume')).toBe(true);for(let i=0;i<20;i++)f.tick();expect(f.runtime.diagnostics().laserArcBeams).toBe(0);
 f.runtime.start();expect(f.runtime.diagnostics().laserArcBeams).toBe(0);expect(f.runtime.world.laserChainReady).toBe(false);
});
it.each([false,true])('actual solo discharge draws finite rings and preserves its distinct counter through menus (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;
 w.growth.mastery=4;for(let i=0;i<4;i++)w.chooseBuild('optical');w.phase='recovery';const pickup=w.spawn('pickup',360,C.playerY,2);pickup.weaponKind='arc';f.tick();resolveResearch(f);w.phase='boss';
 const a=w.spawn('armor',360,600);a.hp=a.maxHp=10000;a.speed=0;a.timer=999;f.tick();expect(w.laserFocusHits).toBe(1);expect(w.laserArcHits).toBe(0);expect(f.runtime.diagnostics().laserFocusBeams).toBe(1);expect(f.runtime.diagnostics().laserArcBeams).toBe(0);
 expect(f.calls.some(c=>c.kind==='ellipse'&&c.composite==='lighter'&&c.stroke==='#83eaff')).toBe(true);
 f.runtime.pause();for(let i=0;i<30;i++)f.tick();expect(f.runtime.diagnostics().laserFocusBeams).toBe(1);
 expect(f.runtime.activateControl('loadout')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('聚能80%'))).toBe(true);
 expect(f.runtime.activateControl('combos')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('聚能 1次'))).toBe(true);
 expect(f.runtime.activateControl('combos-back')).toBe(true);expect(f.runtime.activateControl('loadout-back')).toBe(true);expect(f.runtime.activateControl('resume')).toBe(true);for(let i=0;i<24;i++)f.tick();expect(f.runtime.diagnostics().laserFocusBeams).toBe(0);
 f.runtime.start();expect(f.runtime.world.laserFocusHits).toBe(0);expect(f.runtime.diagnostics().laserFocusBeams).toBe(0);
});

it('publishes the actual round projectile pressure in the bottom receipt',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;
 w.phase='recovery';w.phaseTime=3.99;f.tick();expect(w.round).toBe(2);
 const detail=f.calls.find(c=>c.kind==='fillText'&&String(c.args[0]).includes('敌弹+10% · 留意实弹'));
 expect(detail).toBeDefined();expectVisibleCombatCopy(f,'第 2 轮 · 侧翼夹击','双翼穿插 · 敌弹+10% · 留意实弹');expect(f.runtime.diagnostics().enemyProjectileScale).toBe(1.1);
});

it.each([false,true])('labels refit boxes distinctly and updates their live calibration after another earned pickup (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.phase='boss';w.weaponKind='scatter';w.growth.stage=3;w.growth.mastery=1;w.chooseBuild('electric');
 const refit=w.spawn('crate',222,400,3);refit.weaponKind='scatter';refit.refit=true;refit.speed=0;
 const expansion=w.spawn('crate',498,400,3);expansion.weaponKind='blast';expansion.speed=0;f.tick();
 const text=(s:string)=>f.calls.some(c=>c.kind==='fillText'&&c.args[0]===s);
 expect(text('精校 霰射炮')).toBe(true);expect(text('单轮直伤 31.9 → 47.9')).toBe(true);expect(text('叠加 爆裂炮 T3')).toBe(true);
 const p=w.spawn('pickup',360,C.playerY,3);p.weaponKind='scatter';p.refit=true;p.speed=0;f.tick();
 expect(w.refitsClaimed).toBe(1);expect(text('单轮直伤 47.9 → 63.8')).toBe(true);
 expect(w.activeWeapons).toEqual(['scatter','arc']);
});

it.each([false,true])('renders real sentry relocation with local thrust and freezes it on pause (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();f.runtime.world.phase='boss';
 const b=f.runtime.world.spawn('sniper',220,360);b.pattern='relocate';
 f.runtime.touchStart(1,360,1100);f.runtime.touchMove(1,652,1100);
 for(let i=0;i<240;i++)f.tick();
 expect(b.sentryVolleys).toBe(1);expect(b.x).toBeGreaterThan(220);expect(b.x).toBeLessThan(360);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='换位中')).toBe(true);
 expect(f.calls.some(c=>c.kind==='rotate'&&Math.abs(c.args[0])===.07)).toBe(true);
 expect(f.calls.some(c=>c.kind==='quadraticCurveTo')).toBe(true);
 const x=b.x,age=b.age;f.runtime.pause();for(let i=0;i<30;i++)f.tick();expect(b.x).toBe(x);expect(b.age).toBe(age);
 f.runtime.start();f.tick();expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='换位中')).toBe(false);
});

it('retains the interruption reason after the transient notice expires and replaces it for a manual pause', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  f.runtime.hide(); for (let i = 0; i < 180; i++) f.tick();
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '切换至后台，已暂停' && c.args[2] === 490)).toBe(true);
  f.runtime.show(); f.runtime.touchStart(1, 360, 603); f.runtime.touchEnd(1, 360, 603);
  f.runtime.pause(); f.tick();
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '准备好了，再继续突围。' && c.args[2] === 490)).toBe(true);
});

it('freezes actual muzzle origins with recoil during pause and clears them on a weapon change', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  f.runtime.world.weaponKind = 'pierce'; f.runtime.world.growth.stage = 3;
  f.tick(); f.tick();
  const origins = () => f.calls.filter(c => c.kind === 'translate' && [338, 382].includes(c.args[0]) && c.args[1] > 900).map(c => c.args);
  const before = origins(); expect(before).toHaveLength(2);
  expect(before[0][1]).toBeGreaterThan(C.playerY - 99);
  f.runtime.pause();
  for (let i = 0; i < 30; i++) { f.tick(); expect(origins()).toEqual(before); }
  f.runtime.world.weaponKind = 'scatter'; f.tick(); expect(origins()).toHaveLength(0);
});

it.each([1,2,3])('selects scatter tier %s artwork and switches back without changing growth', async stage => {
 const f=fixture();await f.runtime.load();f.runtime.start();f.runtime.world.growth.stage=stage;f.runtime.world.weaponKind='scatter';f.tick();
 const art=f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('scatter-player-v1.png'));
 expect(art).toHaveLength(3);
 for(const call of art){expect(call.args[1]).toBeGreaterThanOrEqual((stage-1)*192);expect(call.args[1]+call.args[3]).toBeLessThanOrEqual(stage*192);}
 f.runtime.world.weaponKind='pierce';f.tick();
 expect(f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('scatter-player-v1.png'))).toHaveLength(0);
 expect(f.runtime.world.growth.stage).toBe(stage);
});

it.each([1,2,3])('uses matching rail-cannon frame and projectile origins at tier %s', async stage => {
 const f=fixture();await f.runtime.load();f.runtime.start();f.runtime.world.growth.stage=stage;f.runtime.world.weaponKind='pierce';f.tick();
 const art=f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('pierce-player-v2.png'));
 expect(art).toHaveLength(3);
 for(const call of art){expect(call.args[1]).toBeGreaterThanOrEqual((stage-1)*192);expect(call.args[1]+call.args[3]).toBeLessThanOrEqual(stage*192);}
 expect(f.runtime.world.bullets.map(b=>b.px)).toEqual(stage===1?[360]:[338,382]);
 expect(f.runtime.world.bullets.every(b=>b.py===C.playerY-[76,82,99][stage-1])).toBe(true);
});

it.each([180, 280, 400])('keeps the complete entering weapon choice label below HUD at y=%s', async y => {
  const f=fixture();await f.runtime.load();f.runtime.start();f.runtime.world.phase='boss';
  const b=f.runtime.world.spawn('crate',222,y,2);b.weaponKind='scatter';b.speed=0;
  f.tick();
  const title=f.calls.find(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('叠加 霰射炮'));
  expect(title).toBeDefined();
  expect(Number(title!.args[2])-13).toBeGreaterThan(28+162);
  expect(y<358?Number(title!.args[2])>y+55:Number(title!.args[2])<y-55).toBe(true);
});

it.each([false,true])('bounds localized impacts and freezes and clears their lifetime (weak=%s)', async weak => {
 const f=fixture(weak);await f.runtime.load();f.runtime.start();
 for(let i=0;i<20;i++)f.runtime.world.effects.push({type:'impact',x:i*35,y:400,weaponKind:'pierce'});
 f.runtime.world.effects.push({type:'impact',x:0,y:400,weaponKind:'scatter'});
 f.tick();
 const visual=f.runtime as unknown as {impacts:{kind:string;life:number}[]};
 expect(visual.impacts.length).toBe(weak?4:12);expect(visual.impacts.filter(h=>h.kind==='pierce')).toHaveLength((weak?4:12)-1);expect(visual.impacts.filter(h=>h.kind==='scatter')).toHaveLength(1);
 f.runtime.pause();const frozen=JSON.stringify(visual.impacts);for(let i=0;i<20;i++)f.tick();
 expect(JSON.stringify(visual.impacts)).toBe(frozen);
 f.runtime.start();expect(visual.impacts).toHaveLength(0);
});

it('limits redundant high-refresh draws without slowing fixed-step gameplay', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  let renders = 0;
  for (let i = 0; i < 240; i++) {
    f.tick(1000 / 240);
    if (f.calls.some(c => c.kind === 'drawImage')) renders++;
  }
  expect(renders).toBeGreaterThanOrEqual(59); expect(renders).toBeLessThanOrEqual(62);
  expect(f.runtime.diagnostics().drawCount).toBe(renders);
  expect(f.runtime.diagnostics().callbackCount).toBe(240);
  expect(f.runtime.world.time).toBeCloseTo(1, 6);
  f.runtime.pause(); f.tick(1);
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '暂停')).toBe(true);
  expect(f.runtime.diagnostics().callbackCount).toBe(240);
  f.runtime.start();
  expect(f.runtime.diagnostics().drawCount).toBe(0);
  expect(f.runtime.diagnostics().callbackCount).toBe(0);
});

it('keeps ground travel continuous across speed changes, freezes on pause and resets on restart', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  const offset = () => f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('runway.jpg')).at(-1)!.args[2] as number;
  f.runtime.world.time = 85;
  f.tick(); const first = offset();
  // Round four uses the same runway but a faster scroll speed.
  f.runtime.world.round = 4;
  const speed = f.runtime.world.scrollSpeed;
  f.tick(); expect(offset() - first).toBeCloseTo(C.step * speed);
  const frozen = offset(); f.runtime.pause();
  for (let i = 0; i < 10; i++) { f.tick(); expect(offset()).toBe(frozen); }
  f.runtime.start(); f.tick(); expect(offset()).toBeCloseTo(C.step * f.runtime.world.scrollSpeed);
});

it.each([[2, 'cooling-corridor-v2.jpg'], [3, 'armored-corridor-v1.jpg']] as const)('uses chapter %s environment and keeps paused world state intact', async (round, asset) => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  f.runtime.world.round = round; f.runtime.world.time = 17; f.runtime.pause();
  const before = JSON.stringify(f.runtime.world);
  f.tick();
  const ground = () => f.calls.filter(c => c.kind === 'drawImage' && /runway|cooling-corridor|armored-corridor/.test(c.args[0].src));
  expect(ground().length).toBeGreaterThan(0);
  expect(ground().every(c => c.args[0].src.endsWith(asset))).toBe(true);
  expect(JSON.stringify(f.runtime.world)).toBe(before);
  f.runtime.start(); f.tick();
  expect(ground().every(c => c.args[0].src.endsWith('runway.jpg'))).toBe(true);
});

it.each([false,true])('keeps cooling machinery below actual combat and freezes its rotor pose on pause weak=%s',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();f.runtime.world.round=2;f.runtime.world.time=17;const b=f.runtime.world.spawn('drone',360,500);f.tick();
 const machinery=()=>f.calls.findIndex(c=>c.kind==='rect'&&c.args[2]===49),enemy=()=>f.calls.findIndex(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('drone-v1.png'));
 expect(machinery()).toBeGreaterThan(0);expect(enemy()).toBeGreaterThan(machinery());expect(b.active).toBe(true);
 const rotorPose=()=>f.calls.filter(c=>c.kind==='rotate').slice(0,6*(1+(weak?8:12))).map(c=>c.args[0]);const pose=rotorPose(),before=JSON.stringify(f.runtime.world),ground=f.runtime.diagnostics().sectorGround;
 f.runtime.pause();for(let i=0;i<20;i++){f.tick();expect(JSON.stringify(f.runtime.world)).toBe(before);expect(rotorPose()).toEqual(pose);expect(f.runtime.diagnostics().sectorGround).toEqual(ground);}
});

it.each([false,true])('ties boss preparation to real A/B warnings, freezes the second beat and preserves World (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const reference=new World(1337);
 const setup=(w:World)=>{w.time=w.roundTime=80;w.phase='boss';w.player.x=68;return w.spawn('boss',360,C.bossY);};
 const body=setup(f.runtime.world),baseline=setup(reference);
 f.runtime.touchStart(1,360,1100);f.runtime.touchMove(1,68,1100);
 const draws=()=>f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('boss-v1.png'));
 const frames=new Set<number>();let paused=false,finishedB=false;
 for(let i=0;i<620;i++){
  const previousCycle=body.attackCycle;body.hit=baseline.hit=.07;f.tick();reference.step(C.step,68);reference.drainEffects();
  expect(body).toEqual(baseline);expect(f.runtime.world.bullets).toEqual(reference.bullets);
  expect(f.runtime.world.player).toEqual(reference.player);expect(f.runtime.world.growth).toEqual(reference.growth);
  expect(f.runtime.world.score).toBe(reference.score);expect(f.runtime.world.phase).toBe(reference.phase);
  const ds=draws();expect(ds).toHaveLength(2);expect(ds[0].args.slice(1)).toEqual(ds[1].args.slice(1));
  expect(ds[0].args.slice(2,5)).toEqual([0,256,256]);frames.add(ds[0].args[1]);
  expect(ds[0].args[1]).toBe(body.warning>0?256:0);expect(ds[0].args[1]).toBeLessThan(512);
  expect(ds[1].composite).toBe('lighter');expect(ds[1].alpha).toBeLessThanOrEqual(weak?.18:.48);
  expect(f.calls.findIndex(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('重装首领'))).toBeGreaterThan(f.calls.indexOf(ds[1]));
  if(body.warning>0)expect(f.calls.findIndex(c=>c.kind==='fill'&&c.color==='#ffe4aa')).toBeGreaterThan(f.calls.indexOf(ds[1]));
  if(body.burst&&!paused){
   const frozen={...body},bullets=JSON.stringify(f.runtime.world.bullets),pose=ds.map(c=>c.args.slice(1));
   f.runtime.pause();for(let j=0;j<30;j++)f.tick();expect(body).toEqual(frozen);
   expect(JSON.stringify(f.runtime.world.bullets)).toBe(bullets);expect(draws().map(c=>c.args.slice(1))).toEqual(pose);
   f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);expect(f.runtime.mode).toBe('playing');
   f.runtime.touchStart(1,360,1100);f.runtime.touchMove(1,68,1100);paused=true;
  }
  if(previousCycle<2&&body.attackCycle===2){expect(body.warning).toBe(0);finishedB=true;}
 }
 expect(frames).toEqual(new Set([0,256]));expect(paused).toBe(true);expect(finishedB).toBe(true);
 f.runtime.start();f.tick();expect(draws()).toHaveLength(0);
});

it.each([false,true])('draws elite travel/preparation with matching hit, upper warning and frozen pause (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const reference=new World(1337);
 const body=f.runtime.world.spawn('elite',100,-100),baseline=reference.spawn('elite',100,-100);
 const frames=new Set<number>();let paused=false;
 const draws=()=>f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('elite-v1.png'));
 for(let i=0;i<200;i++){
  body.hit=baseline.hit=.07;f.tick();reference.step(C.step,360);reference.drainEffects();
  expect(body).toEqual(baseline);expect(f.runtime.world.player).toEqual(reference.player);
  expect(f.runtime.world.growth).toEqual(reference.growth);expect(f.runtime.world.bullets).toEqual(reference.bullets);
  expect(f.runtime.world.score).toBe(reference.score);
  const ds=draws();expect(ds).toHaveLength(2);expect(ds[0].args.slice(1)).toEqual(ds[1].args.slice(1));
  expect(ds[0].args.slice(2,5)).toEqual([0,256,256]);frames.add(ds[0].args[1]);
  expect(ds[1].composite).toBe('lighter');expect(ds[1].alpha).toBeLessThanOrEqual(weak?.18:.48);
  expect(f.calls.some(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('units.png')&&c.args[1]===384&&c.args[2]===256)).toBe(false);
  if(body.warning>0){
   expect(ds[0].args[1]).toBe(256);
   expect(f.calls.findIndex(c=>c.kind==='fill'&&c.color==='#ffe4aa')).toBeGreaterThan(f.calls.indexOf(ds[1]));
   if(!paused){
    const frozen={...body},pose=ds.map(c=>c.args.slice(1));f.runtime.pause();for(let j=0;j<30;j++)f.tick();
    expect(body).toEqual(frozen);expect(draws().map(c=>c.args.slice(1))).toEqual(pose);
    f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);expect(f.runtime.mode).toBe('playing');paused=true;
   }
  }
 }
 expect(frames).toEqual(new Set([0,256,512]));expect(paused).toBe(true);
 f.runtime.start();f.tick();expect(draws()).toHaveLength(0);
});

it.each([false,true])('draws armor travel/preparation with matching hit, upper warning and frozen pause (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const reference=new World(1337);
 const body=f.runtime.world.spawn('armor',100,-100),baseline=reference.spawn('armor',100,-100);
 const frames=new Set<number>();let paused=false;
 const draws=()=>f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('armor-v1.png'));
 for(let i=0;i<200;i++){
  body.hit=baseline.hit=.07;f.tick();reference.step(C.step,360);reference.drainEffects();
  expect(body).toEqual(baseline);expect(f.runtime.world.player).toEqual(reference.player);
  expect(f.runtime.world.growth).toEqual(reference.growth);expect(f.runtime.world.bullets).toEqual(reference.bullets);
  expect(f.runtime.world.score).toBe(reference.score);
  const ds=draws();expect(ds).toHaveLength(2);expect(ds[0].args.slice(1)).toEqual(ds[1].args.slice(1));
  expect(ds[0].args.slice(2,5)).toEqual([0,256,256]);frames.add(ds[0].args[1]);
  expect(ds[1].composite).toBe('lighter');expect(ds[1].alpha).toBeLessThanOrEqual(weak?.18:.48);
  expect(f.calls.some(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('units.png')&&c.args[1]===192&&c.args[2]===256)).toBe(false);
  if(body.warning>0){
   expect(ds[0].args[1]).toBe(256);
   expect(f.calls.findIndex(c=>c.kind==='fill'&&c.color==='#ffe4aa')).toBeGreaterThan(f.calls.indexOf(ds[1]));
   if(!paused){
    const frozen={...body},pose=ds.map(c=>c.args.slice(1));f.runtime.pause();for(let j=0;j<30;j++)f.tick();
    expect(body).toEqual(frozen);expect(draws().map(c=>c.args.slice(1))).toEqual(pose);
    f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);expect(f.runtime.mode).toBe('playing');paused=true;
   }
  }
 }
 expect(frames).toEqual(new Set([0,256,512]));expect(paused).toBe(true);
 f.runtime.start();f.tick();expect(draws()).toHaveLength(0);
});

it.each([false,true])('uses real charger states for poses, preserves danger above the art and freezes windup (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const reference=new World(1337);
 const body=f.runtime.world.spawn('charger',100,0),baseline=reference.spawn('charger',100,0);
 const frames=new Set<number>();let pausedWindup=false;
 const draws=()=>f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('charger-v1.png'));
 for(let step=0;step<180;step++){
  body.hit=baseline.hit=.07;f.tick();reference.step(C.step,360);reference.drainEffects();
  expect(body).toEqual(baseline);expect(f.runtime.world.player).toEqual(reference.player);
  expect(f.runtime.world.growth).toEqual(reference.growth);expect(f.runtime.world.score).toBe(reference.score);
  const ds=draws();expect(ds).toHaveLength(2);expect(ds[0].args.slice(1)).toEqual(ds[1].args.slice(1));
  expect(ds[0].args.slice(2,5)).toEqual([0,256,256]);frames.add(ds[0].args[1]);
  expect(ds[1].composite).toBe('lighter');expect(ds[1].alpha).toBeLessThanOrEqual(weak?.18:.48);
  if(body.warning>0){
   expect(ds[0].args[1]).toBe(256);
   const lastArt=f.calls.indexOf(ds[1]);
   expect(f.calls.findIndex(c=>c.kind==='fill'&&c.color==='#ffe4aa')).toBeGreaterThan(lastArt);
   if(!pausedWindup){
    const frozen={...body},pose=ds.map(c=>c.args.slice(1));f.runtime.pause();for(let i=0;i<30;i++)f.tick();
    expect(body).toEqual(frozen);expect(draws().map(c=>c.args.slice(1))).toEqual(pose);
    f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);expect(f.runtime.mode).toBe('playing');pausedWindup=true;
   }
  }
 }
 expect(frames).toEqual(new Set([0,256,512]));expect(pausedWindup).toBe(true);
 f.runtime.start();f.tick();expect(draws()).toHaveLength(0);
});

it.each([false, true])('animates a real drone without changing simulation; hit overlay and pause use the same pose (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const reference = new World(1337);
  const drone = f.runtime.world.spawn('drone', 100, 320);
  const baseline = reference.spawn('drone', 100, 320);
  const frames = new Set<number>();
  const draws = () => f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('drone-v1.png'));
  for (let i = 0; i < 36; i++) {
    drone.hit = baseline.hit = 0.07;
    f.tick(); reference.step(C.step,360); reference.drainEffects();
    expect(f.runtime.world.player).toEqual(reference.player);
    expect(f.runtime.world.growth).toEqual(reference.growth);
    expect(drone).toEqual(baseline);
    const ds=draws(); expect(ds).toHaveLength(2);
    expect(ds[0].args.slice(1)).toEqual(ds[1].args.slice(1));
    expect(ds[0].args.slice(2,5)).toEqual([0,256,256]);
    expect(ds[1].composite).toBe('lighter');
    expect(ds[1].alpha).toBeLessThanOrEqual(weak?.18:.48);
    frames.add(ds[0].args[1]);
  }
  expect(frames).toEqual(new Set([0,256,512]));
  const before=draws().map(c=>c.args.slice(1));
  f.runtime.pause(); for(let i=0;i<30;i++)f.tick();
  expect(draws().map(c=>c.args.slice(1))).toEqual(before);
  expect(drone.age).toBeCloseTo(.6);
  f.runtime.start(); f.tick(); expect(draws()).toHaveLength(0);
});

it('guides real crate and gate progression with matching earned research choices', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  const reference = new World(); const seen = new Set<string>();
  f.runtime.touchStart(1, 360, 1100); f.runtime.touchMove(1, 240, 1100);
  for (let i = 0; i < 2050; i++) {
    f.tick(); reference.step(C.step, 240); reference.drainEffects();resolveResearch(f,reference);
    expect(f.runtime.world.growth).toEqual(reference.growth);
    expect(f.runtime.world.player).toEqual(reference.player);
    expect(f.runtime.world.pickups).toBe(reference.pickups);
    expect(f.runtime.world.gatesTaken).toBe(reference.gatesTaken);
    for (const call of f.calls) if (call.kind === 'fillText') seen.add(call.args[0]);
    if (f.runtime.world.pickups > 0) expect(f.calls.some(c => c.args[0] === '装备已掉落，移到它下方')).toBe(false);
  }
  expect(reference.pickups).toBe(2); expect(reference.gatesTaken).toBe(2);
  expect(reference.weaponKind).toBe('scatter');
  expect(seen).toContain('对准一箱，增加火力能力');
  expect(seen).toContain('靠近领取，叠加新火力');
  // Named T2 opening supplies now use the owned/new-weapon guidance above.
  // The original anonymous-crate tutorial remains separately tested by context-guide.
  expect(seen).toContain('持续射击，把门的奖励打高');
  expect(seen).toContain('穿过才领取 · 同排只领一扇 · 满充能可提速');
});

it.each([false, true])('omits help beneath a live projectile and restores it when the text area clears (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  // Off-path target and danger layout intentionally supplied for rendering coverage.
  f.runtime.world.spawn('crate', 240, 600);
  const danger={id:9999,x:360,y:1180,px:360,py:1180,vx:0,vy:0,damage:1,age:0,active:true,hostile:true};f.runtime.world.bullets.push(danger);
  f.tick();
  expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='对准装备箱持续射击')).toBe(false);
  expect(f.calls.some(c=>c.kind==='fillRect'&&c.color==='#ffead7')).toBe(true);
  danger.active=false;f.tick();
  const help = f.calls.findIndex(c => c.kind === 'fillText' && c.args[0] === '对准装备箱持续射击');
  expect(help).toBeGreaterThan(0);
  expect(f.calls.some(c=>c.kind==='fillRect'&&c.color==='#ffead7')).toBe(false);
  expect(f.calls.findIndex(c => c.kind === 'fillText' && c.args[0].startsWith?.('T2 装备'))).toBeGreaterThan(help);
  expect(f.calls.filter(c => c.kind === 'fillText' && c.args[2] === 277)).toHaveLength(0);
  f.runtime.pause(); for (let i = 0; i < 30; i++) f.tick();
  expect(f.calls.some(c => c.args[0] === '对准装备箱持续射击')).toBe(false);
  f.runtime.start(); f.tick();
  expect(f.calls.some(c => c.args[0] === '对准装备箱持续射击')).toBe(false);
});

it('temporarily omits optional help when a passing body occupies its text area', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  f.runtime.world.spawn('crate', 240, 600);
  const passing = f.runtime.world.spawn('drone', 480, 1200);
  f.tick(); expect(f.calls.some(c => c.args[0] === '对准装备箱持续射击')).toBe(false);
  passing.active = false; f.tick();
  expect(f.calls.some(c => c.args[0] === '对准装备箱持续射击')).toBe(true);
});

it.each([false, true])('a real threshold hit pulses the final number and freezes it on pause (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const gate = f.runtime.world.spawn('gate', 360, 600); gate.row = 1; gate.energy = 20; f.tick();
  f.runtime.world.bullets.push({ id: 9999, x: gate.x, y: gate.y, px: gate.x, py: gate.y, vx: 0, vy: 0, damage: 4, age: 0, active: true, hostile: false });
  f.tick(); f.tick();
  const number = () => f.calls.find(c => c.kind === 'fillText' && c.args[0] === '+15%');
  const fontSize = () => Number(number()?.font?.match(/([\d.]+)px/)?.[1]);
  expect(gate.energy).toBe(24); expect(fontSize()).toBeGreaterThan(50);
  expect(fontSize()).toBeLessThanOrEqual(weak ? 51.5 : 54);
  expect(f.runtime.world.growth.bonus).toBe(0); expect(f.runtime.world.gatesTaken).toBe(0);
  f.runtime.pause(); f.tick(); const frozen = number();
  for (let i = 0; i < 30; i++) f.tick(); expect(number()).toEqual(frozen);
  f.runtime.touchStart(1, 360, 603); f.runtime.touchEnd(1, 360, 603);
  for (let i = 0; i < 9; i++) f.tick(); expect(fontSize()).toBe(50);
});

it.each([false, true])('crossing mutually exclusive gates shows one complete mixed receipt without covering danger (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const reference = new World();
  const setup = (w: World) => {
    w.player.x = 222; w.growth.bonus = 95;
    for (const x of [222, 498]) { const g = w.spawn('gate', x, 1023); g.row = 1; g.energy = 144; }
    w.bullets.push({ id: 9999, x: 222, y: 840, px: 222, py: 840, vx: 0, vy: 0, damage: 1, age: 0, active: true, hostile: true });
  };
  setup(reference); setup(f.runtime.world); f.runtime.cancelTouch();
  f.tick(); reference.step(C.step, 222); reference.drainEffects();
  expect(f.runtime.world.growth).toEqual(reference.growth); expect(f.runtime.world.growth.bonus).toBe(100);
  expect(f.runtime.world.growth.energy).toBe(25); expect(f.runtime.world.gatesTaken).toBe(1);
  // The real hostile bolt overlaps the receipt. Preserve the earned reward,
  // but defer optional text until that danger leaves the reading area.
  expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='穿门已领取')).toBe(false);
  expect(f.runtime.diagnostics().gateReceipts).toBe(1);
  for(const w of [reference,f.runtime.world])w.bullets.find(b=>b.id===9999)!.x=68;
  f.tick();reference.step(C.step,222);reference.drainEffects();
  const taken = f.calls.filter(c => c.kind === 'fillText' && c.args[0] === '穿门已领取');
  expect(taken).toHaveLength(1);
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '火力 +5%')).toBe(true);
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '充能 +25')).toBe(true);
  const danger = f.calls.findIndex(c => c.kind === 'fillRect' && c.color === '#ffead7');
  expect(danger).toBeGreaterThan(f.calls.lastIndexOf(taken[0]));
  f.runtime.pause(); f.tick(); const before = f.calls.filter(c => c.kind === 'fillText' && c.args[0] === '穿门已领取');
  for (let i = 0; i < 30; i++) f.tick();
  expect(f.calls.filter(c => c.kind === 'fillText' && c.args[0] === '穿门已领取')).toEqual(before);
  f.runtime.touchStart(1, 360, 603); f.runtime.touchEnd(1, 360, 603);
  for (let i = 0; i < 100; i++) { f.tick(); reference.step(C.step, 222); reference.drainEffects(); }
  expect(f.runtime.world.growth).toEqual(reference.growth); expect(f.runtime.world.gatesTaken).toBe(1);
  expect(f.runtime.diagnostics().gateReceipts).toBe(0);
  f.runtime.world.emit('gate-taken', 222, 1024, '储能已满', 240); f.tick();
  f.runtime.pause(); f.tick(); f.runtime.touchStart(1, 360, 823); f.runtime.touchEnd(1, 360, 823); f.tick();
  expect(f.runtime.diagnostics().gateReceipts).toBe(0);
  f.runtime.start(); f.tick(); expect(f.runtime.diagnostics().gateReceipts).toBe(0);
});

it('omits optional receipts behind live enemies and reward labels', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  f.runtime.world.spawn('armor', 360, 844);
  f.runtime.world.emit('gate-taken', 360, 1024, '火力 +20%', 264);
  f.tick(); expect(f.runtime.diagnostics().gateReceipts).toBe(1);
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '已领取')).toBe(false);
  expect(f.runtime.world.bodies.some(b => b.kind === 'armor')).toBe(true);
});

it.each([false, true])('a real crate break reveals equipment above smoke without granting it early (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const reference = new World();
  const setup = (w: World) => {
    const b = w.spawn('crate', 360, 650, 2); b.hp = 4;
    w.bullets.push({ id: 9999, x: 360, y: 650, px: 360, py: 650, vx: 0, vy: 0, damage: 4, age: 0, active: true, hostile: false });
  };
  setup(reference); setup(f.runtime.world);
  f.tick(); reference.step(C.step, 360); reference.drainEffects();
  expect(f.runtime.world.growth.stage).toBe(1); expect(f.runtime.world.pickups).toBe(0);
  expect(f.runtime.world.bodies.some(b => b.kind === 'pickup')).toBe(true);
  expect(f.runtime.diagnostics().crateFragments).toBe(6);
  const pickup = f.calls.findIndex(c => c.kind === 'drawImage' && c.args[0].src.endsWith('props.png') && c.args[7] === 65);
  expect(pickup).toBeGreaterThan(f.calls.lastIndexOf(blasts(f).at(-1)!));
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '装备已掉落，移到它下方')).toBe(true);
  expect(f.calls.some(c => c.kind === 'fillText' && c.args[0] === '靠近领取')).toBe(false);
  f.runtime.pause(); f.tick(); const fragments = f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('crate-v1.png')).map(c => ({ ...c }));
  for (let i = 0; i < 20; i++) f.tick();
  expect(f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('crate-v1.png'))).toEqual(fragments);
  f.runtime.touchStart(1, 360, 603); f.runtime.touchEnd(1, 360, 603);
  for (let i = 0; i < 160; i++) {
    f.tick(); reference.step(C.step, 360); reference.drainEffects();resolveResearch(f,reference);
    expect(f.runtime.world.growth).toEqual(reference.growth); expect(f.runtime.world.bodies).toEqual(reference.bodies);
    expect(f.runtime.world.pickups).toBe(reference.pickups);
  }
  expect(f.runtime.world.pickups).toBe(1); expect(f.runtime.world.growth.stage).toBe(2);
  expect(f.runtime.diagnostics().crateFragments).toBe(0);
  for (let i = 0; i < 10; i++) f.runtime.world.emit('crate-break', 360, 600);
  f.tick(); expect(f.runtime.diagnostics().crateFragments).toBeLessThanOrEqual(9);
  f.runtime.pause(); f.tick(); f.runtime.touchStart(1, 360, 823); f.runtime.touchEnd(1, 360, 823);
  f.tick(); expect(f.runtime.mode).toBe('menu'); expect(f.runtime.diagnostics().crateFragments).toBe(0);
  f.runtime.start(); f.tick(); expect(f.runtime.diagnostics().crateFragments).toBe(0);
});

it('plays every atlas cell, freezes on pause, and retires completed effects', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  // Explicit renderer fixture: an event supplied to the real frame loop, not a normal-play result.
  f.runtime.world.emit('kill', 360, 600);
  const cells = new Set<string>();
  for (let i = 0; i < 29; i++) {
    f.tick(); for (const call of blasts(f)) {
      expect(call.args.slice(3, 5)).toEqual([256, 256]);
      cells.add(`${call.args[1]},${call.args[2]}`);
    }
    if (i === 4) {
      const cell = blasts(f)[0].args.slice(1, 3);
      f.runtime.pause(); for (let p = 0; p < 10; p++) { f.tick(); expect(blasts(f)[0].args.slice(1, 3)).toEqual(cell); }
      f.runtime.touchStart(1, 360, 560); f.runtime.touchEnd(1, 360, 560);
    }
  }
  expect(cells.size).toBe(9); expect(blasts(f)).toHaveLength(0);
});

it.each([false, true])('uses real hit timers for local flashes, freezes on pause and preserves simulation (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const reference = new World();
  const setup = (world: World) => {
    for (const [i, kind] of (['drone', 'charger', 'armor', 'elite', 'boss', 'crate', 'gate'] as const).entries()) {
      const b = world.spawn(kind, 100 + i * 70, 400); b.hit = 0.07;
    }
    world.player.invulnerable = 1;
  };
  setup(f.runtime.world); setup(reference);
  f.tick(); reference.step(C.step, 360); reference.drainEffects();
  const flashes = () => f.calls.filter(c => c.kind === 'drawImage' && c.composite === 'lighter');
  expect(flashes()).toHaveLength(9); // Six sprite flashes and three player pieces; gate uses local conduits.
  expect(flashes().every(c => c.alpha > 0 && c.alpha <= (weak ? 0.18 : 0.48))).toBe(true);
  // The final number panel must remain opaque and use normal compositing.
  const label = f.calls.find(c => c.kind === 'fillText' && /^\+\d+%$/.test(c.args[0]));
  expect(label?.composite).toBe('source-over'); expect(label?.alpha).toBe(1);
  const before = flashes().map(c => c.alpha);
  f.runtime.pause(); for (let i = 0; i < 20; i++) f.tick();
  expect(flashes().map(c => c.alpha)).toEqual(before);
  f.runtime.touchStart(1, 360, 603); f.runtime.touchEnd(1, 360, 603);
  for (let i = 0; i < 60; i++) {
    f.tick(); reference.step(C.step, 360); reference.drainEffects();resolveResearch(f,reference);
    expect(f.runtime.world.bodies).toEqual(reference.bodies);
    expect(f.runtime.world.player).toEqual(reference.player);
    expect(f.runtime.world.score).toBe(reference.score);
    if (i === 6) expect(flashes()).toHaveLength(0);
  }
  f.runtime.start(); f.tick(); expect(flashes()).toHaveLength(0);
});

it.each([false, true])('keeps hostile cores and gate numbers above capped explosions (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  f.runtime.world.spawn('gate', 360, 600);
  f.runtime.world.bullets.push({ id: 9999, x: 360, y: 600, px: 360, py: 600, vx: 0, vy: 0,
    damage: 1, age: 0, active: true, hostile: true });
  for (let i = 0; i < 8; i++) f.runtime.world.emit('kill', 360, 600);
  f.tick(); expect(blasts(f)).toHaveLength(4);
  const finalBlast = f.calls.lastIndexOf(blasts(f).at(-1)!);
  const hostileCore = f.calls.findIndex(c => c.kind === 'fillRect' && c.color === '#ffead7');
  const gateNumber = f.calls.findIndex(c => c.kind === 'fillText' && /^\+\d+%$/.test(c.args[0]));
  expect(hostileCore).toBeGreaterThan(finalBlast); expect(gateNumber).toBeGreaterThan(finalBlast);
  expect(hostileCore).toBeGreaterThan(gateNumber);
  expect(blasts(f)[0].alpha).toBeLessThanOrEqual(weak ? 0.5 : 0.9);
  expect(f.runtime.world.player.hp).toBe(3);
  const lastLight = f.calls.reduce((last, c, i) => c.composite === 'lighter' ? i : last, -1);
  expect(hostileCore).toBeGreaterThan(lastLight); expect(gateNumber).toBeGreaterThan(lastLight);
  expect(f.runtime.diagnostics().particles).toBeLessThanOrEqual(weak ? 50 : 160);
  const visual = f.runtime as unknown as { particles: unknown[]; blasts: unknown[] };
  f.runtime.pause(); const frozen = JSON.stringify([visual.particles, visual.blasts]);
  for (let i = 0; i < 20; i++) f.tick();
  expect(JSON.stringify([visual.particles, visual.blasts])).toBe(frozen);
  f.runtime.start(); expect(visual.particles).toHaveLength(0); expect(visual.blasts).toHaveLength(0);
});

function bossKillFixture(world: World) {
  world.time = 80; world.roundTime = 80;
  world.phase = 'boss'; world.player.hp = 2;
  const boss = world.spawn('boss',360,C.bossY); boss.hp = 4;
  world.bullets.push({ id: 9999, x: 360, y: 270, px: 360, py: 270, vx: 0, vy: 0,
    damage: 4, age: 0, active: true, hostile: false });
}

it.each([false, true])('a real boss kill presents distinct beats and matches rule recovery after explicit loot selection (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const reference = new World(); bossKillFixture(reference); bossKillFixture(f.runtime.world);
  const locations = new Set<string>(); let peak = 0;
  for (let i = 0; i < 250; i++) {
    f.tick(); reference.step(C.step, 360); reference.drainEffects();
    if (i === 0) expectVisibleCombatCopy(f,'首领击破 · 充能+50','装甲恢复+1 · 充能 50/100');
    expect(f.runtime.world.phase).toBe(reference.phase);
    expect(f.runtime.world.round).toBe(reference.round);
    expect(f.runtime.world.player.hp).toBe(reference.player.hp);
    expect(f.runtime.world.score).toBe(reference.score);
    peak = Math.max(peak, blasts(f).length);
    for (const b of blasts(f)) locations.add(`${Math.round(b.args[5] + b.args[7] / 2)},${Math.round(b.args[6] + b.args[8] / 2)}`);
    const fragments = f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('boss-v1.png') && c.args[1] >= 512 && c.args[2] === 0 && c.args[3] < 100);
    expect(fragments.length).toBe(i < 80 ? 3 : 0);
    if(i===0){
      expect(fragments.map(c=>c.args[1])).toEqual([512,593.92,686.08]);
      expect(fragments.every(c=>c.args[4]===256)).toBe(true);
      expect(fragments.reduce((sum,c)=>sum+c.args[3],0)).toBeCloseTo(256);
      expect(fragments.reduce((sum,c)=>sum+c.args[7],0)).toBeCloseTo(360);
    }
    if (i === 8) expect(blasts(f).length).toBe(1);
    if (i === 12) expect(blasts(f).length).toBe(2);
    if (i === 24) expect(blasts(f).length).toBe(3);
    if (i > 78) expect(blasts(f)).toHaveLength(0);
    if(f.runtime.mode==='boss-reward'){
      expect(f.runtime.world.phaseTime).toBeGreaterThanOrEqual(C.bossLootReveal);
      expect(f.runtime.activateControl('boss-claim:pulse')).toBe(true);expect(reference.claimBossReward('pulse')).toBe(true);
    }
  }
  expect(locations.size).toBe(4); expect(peak).toBeLessThanOrEqual(4);
  expect(f.runtime.world.score).toBe(C.enemies.boss.score);
  expect(f.runtime.world.player.hp).toBe(3); expect(f.runtime.world.round).toBe(2);
});

it.each([1, 2, 3])('animates the three player pieces from real drag input without changing World (T%s)', async stage => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  f.runtime.world.growth.stage = stage;
  const reference = new World(); reference.growth.stage = stage;
  f.runtime.touchStart(1, 360, 1100); f.runtime.touchMove(1, 600, 1100);
  const legY = new Set<number>();
  for (let i = 0; i < 120; i++) {
    f.tick(); reference.step(C.step, 600); reference.drainEffects();
    expect(f.runtime.world.player).toEqual(reference.player);
    expect(f.runtime.world.bullets).toEqual(reference.bullets);
    expect(f.runtime.world.growth).toEqual(reference.growth);
    const legs = f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('units.png') && c.args[2] === 160 && c.args[3] === 96);
    expect(legs).toHaveLength(2);
    expect(legs.map(c => c.args[1])).toEqual([(stage - 1) * 192, (stage - 1) * 192 + 96]);
    legY.add(Number(legs[0].args[6].toFixed(3)));
  }
  expect(legY.size).toBeGreaterThan(10);
  const playerPieces = () => f.calls.filter(c => c.kind === 'drawImage' && c.args[0].src.endsWith('units.png') && (c.args[2] === 160 || c.args[4] === 176)).map(c => c.args.slice(1));
  const lastLivePose = playerPieces();
  f.runtime.touchEnd(1, 600, 1100);
  f.runtime.pause(); f.tick();
  expect(playerPieces()).toEqual(lastLivePose); // Includes firing recoil, not just the legs.
  const before = f.calls.filter(c => c.kind === 'drawImage' && c.args[2] === 160).map(c => c.args.slice(1));
  for (let i = 0; i < 30; i++) f.tick();
  expect(f.calls.filter(c => c.kind === 'drawImage' && c.args[2] === 160).map(c => c.args.slice(1))).toEqual(before);
});

it('freezes the boss sequence during pause and discards it on restart', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start(); bossKillFixture(f.runtime.world); f.tick();
  const before = f.runtime.diagnostics().bossDestructionAge;
  f.runtime.pause(); for (let i = 0; i < 40; i++) f.tick();
  expect(f.runtime.diagnostics().bossDestructionAge).toBe(before);
  expect(blasts(f)).toHaveLength(1);
  f.runtime.start(); f.tick(); expect(f.runtime.diagnostics().bossDestructionAge).toBeNull();
  expect(blasts(f)).toHaveLength(0); expect(f.runtime.world.score).toBe(0);
});

it('makes room within the four-blast budget and clears pending boss beats on returning home', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  for (let i = 0; i < 8; i++) f.runtime.world.emit('kill', 200, 600);
  bossKillFixture(f.runtime.world); f.tick(); expect(blasts(f)).toHaveLength(4);
  expect(blasts(f).some(b => Math.round(b.args[5] + b.args[7] / 2) === 248)).toBe(true);
  f.runtime.pause(); f.tick(); f.runtime.touchStart(1, 360, 780); f.runtime.touchEnd(1, 360, 780);
  for (let i = 0; i < 90; i++) f.tick();
  expect(f.runtime.mode).toBe('menu'); expect(f.runtime.diagnostics().bossDestructionAge).toBeNull();
  expect(blasts(f)).toHaveLength(0);
});

it.each([[false,1],[true,1],[false,2],[true,2]] as const)('keeps chapter artwork through preparation and death (weak=%s variant=%s)',async (weak,variant)=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();f.runtime.world.phase='boss';
 const b=f.runtime.world.spawn('boss',360,C.bossY);b.bossVariant=variant;b.attackCycle=variant===1?2:3;b.timer=0;
 f.tick();f.tick();
 const art=()=>f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith(variant===1?'boss-flanker-v1.png':'boss-bastion-v1.png'));
 expect(art().some(c=>c.args[1]===256)).toBe(true);
 expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).startsWith(variant===1?'双翼压制者':'封锁堡垒'))).toBe(true);
 b.hp=4;f.runtime.world.bullets.push({id:9999,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:4,age:0,active:true,hostile:false});
 f.tick();expect(f.runtime.world.phase).toBe('recovery');
 expect(art().filter(c=>c.args[1]>=512)).toHaveLength(3);
 expect(f.calls.some(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('boss-v1.png'))).toBe(false);
 f.runtime.pause();const frozen=art().map(c=>c.args.slice(1));f.tick();expect(art().map(c=>c.args.slice(1))).toEqual(frozen);
});

it('shows the sentry charge pose and readable warning before its fast shot',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const b=f.runtime.world.spawn('sniper',220,320);b.timer=0;
 f.tick();f.tick();
 expect(f.calls.some(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('sniper-v1.png')&&c.args[1]===256)).toBe(true);
 expect(f.calls.some(c=>c.kind==='fill'&&c.color==='#ffe4aa')).toBe(true);
 expect(f.runtime.world.bullets.some(b=>b.hostile)).toBe(false);
});

it('bounds arc links, freezes them during pause and clears them on restart',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();
 for(let i=0;i<20;i++)f.runtime.world.effects.push({type:'arc',x:200,y:400,targetX:320,targetY:500});
 f.tick();const links=()=> (f.runtime as any).arcs;
 expect(links()).toHaveLength(12);const frozen=structuredClone(links());
 f.runtime.pause();for(let i=0;i<30;i++)f.tick();expect(links()).toEqual(frozen);
 f.runtime.start();expect(links()).toHaveLength(0);
});

it('shows a brief weapon briefing after real pickup, yields to danger and resets on restart', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  const pickup = f.runtime.world.spawn('pickup', 360, 1024, 2); pickup.weaponKind = 'arc';
  f.tick();resolveResearch(f);
  const briefing = () => f.calls.some(c => c.kind === 'fillText' && String(c.args[0]).includes('最多追加2次跳电'));
  expect(f.runtime.world.weaponKind).toBe('arc'); expect(briefing()).toBe(true);
  const sniper = f.runtime.world.spawn('sniper', 200, 320); sniper.warning = 1; sniper.timer = 1;
  f.tick(); expect(briefing()).toBe(false);
  sniper.active = false; f.tick(); expect(briefing()).toBe(true);
  f.runtime.pause(); for (let i = 0; i < 360; i++) f.tick();
  f.runtime.touchStart(1, 360, 603); f.runtime.touchEnd(1, 360, 603); f.tick();
  expect(briefing()).toBe(true);
  for (let i = 0; i < 310; i++) f.tick();
  expect(briefing()).toBe(false);
  f.runtime.start(); f.tick(); expect(briefing()).toBe(false);
});

it.each([false, true])('shows overload wake only during active overload and freezes it on pause (weak=%s)', async weak => {
  const f = fixture(weak); await f.runtime.load(); f.runtime.start();
  const wake = () => f.calls.filter(c => c.kind === 'fill' && c.color === '#0c151b');
  const geometry=()=>f.calls.filter(c=>['moveTo','lineTo','stroke'].includes(c.kind)&&c.stroke==='#ffc478').map(c=>[c.kind,c.args]);
  f.tick(); expect(wake()).toHaveLength(0);
  f.runtime.world.growth.overload = 6; f.tick(); expect(wake()).toHaveLength(2);expect(f.calls.filter(c=>c.kind==='fillRect'&&c.color==='#2a3a42')).toHaveLength(weak?4:6);
  const before=geometry();f.runtime.pause();
  f.tick();expect(geometry()).toEqual(before);
  f.runtime.world.growth.overload = 0; f.tick(); expect(wake()).toHaveLength(0);
  f.runtime.start(); f.tick(); expect(wake()).toHaveLength(0);
});

it('lets players inspect a frozen battlefield without resuming or moving, then explicitly continue', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start();
  f.runtime.world.spawn('sniper', 200, 320).timer = 0;
  f.tick(); f.runtime.pause(); f.tick();
  f.runtime.touchStart(1,360,933); f.runtime.touchEnd(1,360,933); f.tick();
  expect(f.calls.some(c=>c.kind==='fillText' && c.args[0]==='战场已冻结 · 看清危险再继续')).toBe(true);
  const frozen = JSON.stringify(f.runtime.world);
  f.runtime.touchStart(2, 150, 500); f.runtime.touchMove(2,600,500); f.runtime.touchEnd(2,600,500);
  for(let i=0;i<120;i++) f.tick();
  expect(JSON.stringify(f.runtime.world)).toBe(frozen);
  expect(f.runtime.mode).toBe('paused');
  f.runtime.back(); f.tick();
  expect(f.calls.some(c=>c.kind==='fillText' && c.args[0]==='暂停')).toBe(true);
  f.runtime.touchStart(1,360,933);f.runtime.touchEnd(1,360,933);f.tick();
  f.runtime.touchStart(1,360,1113);f.runtime.touchEnd(1,360,1113);f.tick();
  expect(f.runtime.mode).toBe('playing');
  expect(JSON.stringify(f.runtime.world)).not.toBe(frozen);
});

it('repaints resized pause previews immediately and maps buttons to the new viewport without advancing time', async () => {
  const f = fixture(); await f.runtime.load(); f.runtime.start(); f.tick();
  f.runtime.pause(); f.tick();
  f.runtime.touchStart(1,360,933);f.runtime.touchEnd(1,360,933);f.tick();
  const frozen=JSON.stringify(f.runtime.world);
  f.calls.length=0;
  f.runtime.resize(1280,720,1);
  expect(f.calls.some(c=>c.kind==='drawImage')).toBe(true);
  expect(f.calls.some(c=>c.kind==='fillText' && c.args[0]==='战场已冻结 · 看清危险再继续')).toBe(true);
  expect(JSON.stringify(f.runtime.world)).toBe(frozen);
  // 720/1280 scale with horizontal centering: center button is x=640.
  f.runtime.touchStart(1,640,1113*720/1280);f.runtime.touchEnd(1,640,1113*720/1280);
  expect(f.runtime.mode).toBe('playing');
  expect(JSON.stringify(f.runtime.world)).toBe(frozen);
  f.tick();expect(f.runtime.world.time).toBeGreaterThan(JSON.parse(frozen).time);
});



it('breakthrough freezes combat for a route choice and resumes only after choosing',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();
 f.runtime.world.growth.energy=100;f.tick();
 expect(f.runtime.mode).toBe('choice');
 const time=f.runtime.world.time;for(let i=0;i<30;i++)f.tick();expect(f.runtime.world.time).toBe(time);
 expect(f.runtime.back()).toBe('stay');expect(f.runtime.mode).toBe('choice');
 f.runtime.touchStart(1,360,410);f.runtime.touchEnd(1,360,410);
 expect(f.runtime.world.build.ranks.ballistic).toBe(1);expect(f.runtime.world.activeWeapons).toContain('scatter');
 expect(f.runtime.mode).toBe('playing');f.tick();expect(f.runtime.world.time).toBeGreaterThan(time);
});
it('tree overview preserves pending choices and never spends points or resumes combat',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();
 f.runtime.world.growth.energy=100;f.tick();
 f.runtime.touchStart(1,360,1093);f.runtime.touchEnd(1,360,1093);f.tick();
 expect(f.runtime.mode).toBe('tree');
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='雷暴霰射')).toBe(true);
 const before=JSON.stringify(f.runtime.world);
 for(let i=0;i<30;i++)f.tick();
 expect(JSON.stringify(f.runtime.world)).toBe(before);
 f.runtime.hide();f.runtime.show();expect(f.runtime.mode).toBe('tree');
 f.runtime.back();f.tick();expect(f.runtime.mode).toBe('choice');
 expect(f.runtime.world.build.spent).toBe(0);
 f.runtime.touchStart(1,360,410);f.runtime.touchEnd(1,360,410);f.tick();
 expect(f.runtime.world.build.spent).toBe(1);expect(f.runtime.mode).toBe('playing');
 f.runtime.pause();f.tick();
 f.runtime.touchStart(1,360,1043);f.runtime.touchEnd(1,360,1043);f.tick();
 expect(f.runtime.mode).toBe('loadout');
 f.runtime.touchStart(1,200,1073);f.runtime.touchEnd(1,200,1073);f.tick();
 expect(f.runtime.mode).toBe('tree');
 f.runtime.touchStart(1,360,1143);f.runtime.touchEnd(1,360,1143);f.tick();
 expect(f.runtime.mode).toBe('loadout');expect(f.runtime.world.build.spent).toBe(1);
});
it('route achievements unlock through real choice actions and survive a new run',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();
 for(let i=0;i<3;i++){
  f.runtime.world.growth.energy=100;f.tick();
  expect(f.runtime.mode).toBe('choice');
  f.runtime.touchStart(1,360,640);f.runtime.touchEnd(1,360,640);f.tick();
  if(i===1){expect(f.runtime.mode).toBe('branch');expect(f.runtime.activateControl('branch:spread')).toBe(true);}
 }
 expect(f.runtime.save.achievements.unlocked).toContain('specialist');
 f.runtime.start();expect(f.runtime.world.build.spent).toBe(0);
 expect(f.runtime.save.achievements.unlocked).toContain('specialist');
});
it('choice receipt names new power, remains through pause and clears on restart',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();
 f.runtime.world.growth.energy=100;f.tick();
 f.runtime.touchStart(1,360,410);f.runtime.touchEnd(1,360,410);f.tick();
 const receipt=()=>f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='配件强化 · 霰射机构');
 expect(receipt()).toBe(true);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='新增T1霰射 · 每轮3发 · 直伤12.1')).toBe(true);
 f.runtime.pause();for(let i=0;i<300;i++)f.tick();
 f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);f.tick();expect(receipt()).toBe(true);
 f.runtime.start();f.tick();expect(receipt()).toBe(false);
});
it('explicitly names a newly completed prism combination after the final choice',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();
 f.runtime.world.growth.mastery=3;
 for(let i=0;i<3;i++)f.runtime.world.chooseBuild('optical');
 f.runtime.world.growth.energy=100;f.tick();
 f.runtime.touchStart(1,360,410);f.runtime.touchEnd(1,360,410);f.tick();
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='组合完成 · 棱镜激光')).toBe(true);
 expect(f.runtime.world.supportProfile().prism).toBe(true);
});
it('keeps boss status above the HUD background and separate from the charge line',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();f.runtime.world.phase='boss';
 f.runtime.world.spawn('boss',360,C.bossY);f.tick();
 const label=f.calls.findIndex(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('重装首领'));
 const charge=f.calls.findIndex(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('充能 0/100'));
 const background=f.calls.findIndex(c=>c.kind==='fillRect'&&c.args[0]===0&&c.args[1]===0&&c.args[2]===720&&c.color==='#08131be8');
 expect(label).toBeGreaterThan(background);expect(label).toBeGreaterThan(charge);
 expect(f.calls[label].args[2]-f.calls[charge].args[2]).toBeGreaterThanOrEqual(28);
});
it('shows retained weapon mounts, freezes independent recoil and inspects the same World without granting power',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();f.runtime.world.phase='boss';
 for(const kind of ['scatter','pierce'] as const){const p=f.runtime.world.spawn('pickup',360,1024,2);p.weaponKind=kind;p.speed=0;}
 f.tick();expect(f.runtime.activateControl('build:ballistic')).toBe(true);f.tick();
 const modules=()=>f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('mounted-modules-v1.png'));
 expect(modules()).toHaveLength(2);
 expect(modules().map(c=>c.args[1])).toEqual([0,256]);
 const positions=new Set();
 for(let i=0;i<16;i++){f.tick();positions.add(modules().map(c=>c.args[6]).join(','));}
 expect(positions.size).toBeGreaterThan(2);
 f.runtime.pause();f.tick();const frozen=JSON.stringify(f.runtime.world),poses=modules().map(c=>c.args.slice(1));
 for(let i=0;i<30;i++)f.tick();expect(JSON.stringify(f.runtime.world)).toBe(frozen);
 expect(modules().map(c=>c.args.slice(1))).toEqual(poses);
 f.runtime.touchStart(1,360,1043);f.runtime.touchEnd(1,360,1043);f.tick();
 f.runtime.touchStart(1,570,165);f.runtime.touchEnd(1,570,165);f.tick();expect(f.runtime.mode).toBe('rig');
 expect(modules()).toHaveLength(2);expect(JSON.stringify(f.runtime.world)).toBe(frozen);
 expect(f.runtime.back()).toBe('stay');expect(f.runtime.mode).toBe('loadout');
 f.runtime.start();f.tick();expect(modules()).toHaveLength(0);
});
it('offers a contract directly from combat and freezes until explicitly continuing',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();f.tick();
 f.runtime.touchStart(1,585,228);f.runtime.touchEnd(1,585,228);f.tick();expect(f.runtime.mode).toBe('contracts');
 const time=f.runtime.world.time;for(let i=0;i<30;i++)f.tick();expect(f.runtime.world.time).toBe(time);
 f.runtime.touchStart(1,360,400);f.runtime.touchEnd(1,360,400);f.tick();expect(f.runtime.world.contract?.status).toBe('active');
 f.runtime.touchStart(1,360,1123);f.runtime.touchEnd(1,360,1123);expect(f.runtime.mode).toBe('playing');
 expect(f.runtime.world.time).toBe(time);
});
it('contract reward selection pauses, grants one targeted upgrade and only resumes after claiming',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();f.runtime.world.acceptContract('precision');
 f.runtime.world.contract!.elapsed=29.99;f.runtime.world.kills=15;f.tick();
 expect(f.runtime.mode).toBe('contract-reward');const frozen=JSON.stringify(f.runtime.world);
 for(let i=0;i<30;i++)f.tick();expect(JSON.stringify(f.runtime.world)).toBe(frozen);
 expect(f.runtime.back()).toBe('stay');expect(f.runtime.mode).toBe('contract-reward');
 f.runtime.touchStart(1,360,465);f.runtime.touchEnd(1,360,465);
 expect(f.runtime.world.weaponStage('pulse')).toBe(2);expect(f.runtime.world.contractReward).toBeUndefined();
 expect(f.runtime.mode).toBe('playing');
});
it('a contract charge reward enters the real skill choice before combat resumes',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();f.runtime.world.acceptContract('precision');
 f.runtime.world.contract!.elapsed=29.99;f.runtime.world.kills=15;f.tick();
 f.runtime.touchStart(1,360,345);f.runtime.touchEnd(1,360,345);
 expect(f.runtime.world.growth.mastery).toBe(1);expect(f.runtime.mode).toBe('choice');
});
it('guides the selected reward weapon rather than the unchanged main gun',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();f.runtime.world.growth.mastery=1;f.runtime.world.chooseBuild('ballistic');
 f.runtime.world.acceptContract('precision');f.runtime.world.contract!.elapsed=29.99;f.runtime.world.kills=15;f.tick();
 f.runtime.touchStart(1,360,590);f.runtime.touchEnd(1,360,590);f.tick();
 expect(f.runtime.world.weaponKind).toBe('pulse');expect(f.runtime.world.weaponStage('scatter')).toBe(2);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='霰射炮 · T2')).toBe(true);
});
it('separates frame scheduling gaps from callback work without advancing simulation and bounds evidence',async()=>{
 const f=fixture(false,()=>({hidden:false,focused:true}));await f.runtime.load();f.runtime.start();f.tick();
 const before=f.runtime.world.time;
 for(let i=0;i<14;i++){
  f.tick(1000);expect(f.runtime.mode).toBe('paused');
  expect(f.runtime.world.time).toBe(before);
  if(i<13){f.runtime.touchStart(1,360,603);f.runtime.touchEnd(1,360,603);}
 }
 const state=f.runtime.diagnostics();expect(state.interruptedFrames).toHaveLength(12);
 expect(state.interruptedFrames[0]).toMatchObject({gapMs:1000,previousCallbackWorkMs:0,hidden:false,focused:true});
 expect(state.callbackWork.maxMs).toBe(0);
 state.interruptedFrames[0].gapMs=0;expect(f.runtime.diagnostics().interruptedFrames[0].gapMs).toBe(1000);
 f.runtime.start();expect(f.runtime.diagnostics().interruptedFrames).toHaveLength(0);
 expect(f.runtime.diagnostics().callbackWork.frameSamples).toBe(0);
});
it('a failed browser context probe cannot turn a safe interruption into a game error',async()=>{
 const f=fixture(false,()=>{throw Error('probe unavailable');});await f.runtime.load();f.runtime.start();f.tick(1000);
 expect(f.runtime.mode).toBe('paused');expect(f.runtime.world.time).toBe(0);
 expect(f.runtime.diagnostics().interruptedFrames).toHaveLength(1);
});
it('combination bursts keep a reserved readable explosion within the existing cap and recipe browsing freezes World',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();
 for(let i=0;i<7;i++)f.runtime.world.emit(i<4?'blast':'fracture',360+i*5,600,undefined,120);
 f.tick();expect(f.runtime.diagnostics().blasts).toBe(4);
 expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#a2d7e8')).toBe(true);
 expect(f.runtime.activateControl('pause')).toBe(true);expect(f.runtime.activateControl('loadout')).toBe(true);
 const w=f.runtime.world,time=w.time;
 expect(f.runtime.activateControl('combos')).toBe(true);expect(f.runtime.mode).toBe('combos');
 for(let i=0;i<60;i++)f.tick();expect(w.time).toBe(time);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='裂甲爆破')).toBe(true);
 expect(f.runtime.back()).toBe('stay');expect(f.runtime.mode).toBe('loadout');
});
it('earns fracture engineering from repeated actual projectile bursts and announces the pickup combination',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;
 for(const kind of ['blast','pierce'] as const){const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind=kind;f.tick();resolveResearch(f);}
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='组合完成 · 裂甲爆破')).toBe(true);
 const target=w.spawn('armor',360,600);target.hp=target.maxHp=10000;target.speed=0;target.timer=999;
 for(let i=0;i<600;i++)f.tick();
 expect(w.fractureBursts).toBeGreaterThanOrEqual(10);
 expect(f.runtime.save.achievements.unlocked).toContain('fracture');
});
it('optical branch browsing spends no point, remains frozen, and commits one explicit choice',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;
 w.growth.mastery=1;w.chooseBuild('optical');w.growth.energy=100;f.tick();
 expect(f.runtime.mode).toBe('choice');expect(f.runtime.activateControl('build:optical')).toBe(true);
 expect(f.runtime.mode).toBe('branch');const time=w.time;expect(w.build.spent).toBe(1);
 for(let i=0;i<30;i++)f.tick();expect(w.time).toBe(time);expect(w.build.opticalBranch).toBeUndefined();
 expect(f.runtime.activateControl('branch-back')).toBe(true);expect(w.build.spent).toBe(1);
 expect(f.runtime.activateControl('build:optical')).toBe(true);
 expect(f.runtime.activateControl('branch:relay')).toBe(true);expect(f.runtime.mode).toBe('playing');
 expect(w.build.spent).toBe(2);expect(w.build.opticalBranch).toBe('relay');
 expect(f.runtime.activateControl('branch:burn')).toBe(false);expect(w.build.spent).toBe(2);
 expect(f.runtime.diagnostics().opticalBranch).toBe('relay');
});
it('late boss shield remains below clear HUD labels and the expanded achievement catalogue fits',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.round=4;w.phase='boss';w.player.x=68;w.spawn('boss',360,C.bossY);
 for(let i=0;i<180;i++)f.tick();expect(w.bossShieldActive()).toBe(true);
 const shield=f.calls.findIndex(c=>c.kind==='stroke'&&c.stroke==='#8ce8ff');
 const label=f.calls.findIndex(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('重装首领'));
 expect(shield).toBeGreaterThanOrEqual(0);expect(label).toBeGreaterThan(shield);
 expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('屏障45%'))).toBe(true);
 expect(f.runtime.activateControl('pause')).toBe(true);expect(f.runtime.activateControl('home')).toBe(true);
 expect(f.runtime.activateControl('achievements')).toBe(true);
 expect(f.runtime.activateControl('achievement-group:tactics')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='战术拆解')).toBe(true);
});
it('locks the hunter before tier2 and enters a real immediate reward after both marked deaths',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();f.tick();
 expect(f.runtime.activateControl('contracts-live')).toBe(true);expect(f.runtime.activateControl('contract:hunter')).toBe(false);
 expect(f.runtime.activateControl('contracts-back')).toBe(true);expect(f.runtime.activateControl('resume')).toBe(true);
 const w=f.runtime.world,p=w.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';f.tick();resolveResearch(f);
 expect(f.runtime.activateControl('contracts-live')).toBe(true);expect(f.runtime.activateControl('contract:hunter')).toBe(true);
 expect(f.runtime.activateControl('resume')).toBe(true);for(let i=0;i<430;i++)f.tick();
 expect(w.contract!.reinforcements).toBe(2);expect(w.contract!.targetKills).toBe(0);
 for(const b of w.bodies.filter(b=>b.active&&b.bountyRound===w.round)){
  const y=b.y+b.height*.4;w.bullets.push({id:90000+b.id,x:b.x,y,px:b.x,py:y,vx:0,vy:0,damage:1000,age:0,active:true,hostile:false});
 }
 f.tick();expect(f.runtime.mode).toBe('contract-reward');expect(w.contract!.targetKills).toBe(2);expect(w.contract!.elapsed).toBeLessThan(30);
 expect(f.runtime.activateControl('contract-claim:pulse')).toBe(true);expect(w.weaponStage('pulse')).toBe(3);expect(f.runtime.mode).toBe('playing');
});

it('electric fork requires explicit choice, does not spend while browsing, and retains other mounted weapons',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.growth.mastery=1;w.chooseBuild('electric');w.growth.energy=100;f.tick();
 const owned=[...w.activeWeapons];expect(f.runtime.activateControl('build:electric')).toBe(true);expect(f.runtime.mode).toBe('branch');const time=w.time;
 for(let i=0;i<30;i++)f.tick();expect(w.time).toBe(time);expect(w.build.spent).toBe(1);expect(w.build.electricBranch).toBeUndefined();
 expect(f.runtime.activateControl('branch:burn')).toBe(false);expect(f.runtime.activateControl('branch-back')).toBe(true);expect(w.build.spent).toBe(1);
 expect(f.runtime.activateControl('build:electric')).toBe(true);expect(f.runtime.activateControl('branch:capacitor')).toBe(true);expect(f.runtime.mode).toBe('playing');
 expect(w.build.electricBranch).toBe('capacitor');expect(w.build.spent).toBe(2);expect(w.activeWeapons).toEqual(owned);expect(f.runtime.diagnostics().electricBranch).toBe('capacitor');expect(f.runtime.activateControl('branch:spread')).toBe(false);
});
it.each([false,true])('electrical discharge stays bounded and distinct from orange blast atlas (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const runtime=f.runtime as any;
 for(let i=0;i<20;i++)runtime.effect({type:'capacitor',x:360,y:600,size:70,weaponKind:'arc'});expect(runtime.blasts).toHaveLength(4);expect(runtime.particles.length).toBeLessThanOrEqual(weak?50:160);
 f.tick();expect(blasts(f)).toHaveLength(0);expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#a99aff')).toBe(true);
 for(let i=0;i<30;i++)f.tick();expect(runtime.blasts).toHaveLength(0);
});

it('ballistic branch browsing is frozen and preserves points until an explicit choice',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.growth.mastery=1;w.chooseBuild('ballistic');w.growth.energy=100;f.tick();const owned=[...w.activeWeapons];
 expect(f.runtime.activateControl('build:ballistic')).toBe(true);expect(f.runtime.mode).toBe('branch');const time=w.time;for(let i=0;i<30;i++)f.tick();expect(w.time).toBe(time);expect(w.build.spent).toBe(1);
 expect(f.runtime.activateControl('branch:spread')).toBe(false);expect(f.runtime.activateControl('branch-back')).toBe(true);expect(w.build.ballisticBranch).toBeUndefined();
 expect(f.runtime.activateControl('build:ballistic')).toBe(true);expect(f.runtime.activateControl('branch:fragment')).toBe(true);expect(f.runtime.mode).toBe('playing');expect(w.activeWeapons).toEqual(owned);expect(w.build.spent).toBe(2);expect(f.runtime.diagnostics().ballisticBranch).toBe('fragment');expect(f.runtime.activateControl('branch:penetrator')).toBe(false);
});

it.each([false,true])('fragment bursts share the existing bounded atlas budget without extra bullets (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const runtime=f.runtime as any;const bullets=f.runtime.world.bullets.length;
 for(let i=0;i<40;i++)runtime.effect({type:'scatter-burst',x:360,y:600,size:140,weaponKind:'scatter'});expect(runtime.blasts).toHaveLength(4);expect(runtime.particles.length).toBeLessThanOrEqual(weak?50:160);expect(f.runtime.world.bullets.length).toBe(bullets);
 f.tick();expect(blasts(f)).toHaveLength(4);for(let i=0;i<30;i++)f.tick();expect(runtime.blasts).toHaveLength(0);
});

it('a real equipment research point pauses for a real choice without granting global charge power',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.spawn('pickup',360,C.playerY,2);f.tick();
 expect(f.runtime.mode).toBe('choice');expect(w.researchPoints).toBe(1);expect(w.growth.mastery??0).toBe(0);expect(w.growth.energy).toBe(0);expect(w.growth.overload).toBe(0);const time=w.time;
 for(let i=0;i<60;i++)f.tick();expect(w.time).toBe(time);expect(f.runtime.back()).toBe('stay');expect(f.runtime.activateControl('tree')).toBe(true);expect(f.runtime.activateControl('tree-back')).toBe(true);expect(w.build.spent).toBe(0);
 expect(f.runtime.activateControl('build:ballistic')).toBe(true);expect(f.runtime.mode).toBe('playing');expect(w.build.spent).toBe(1);expect(w.activeWeapons).toContain('scatter');expect(w.weaponStage('pulse')).toBe(2);expect(w.growth.mastery??0).toBe(0);
 const a=w.spawn('pickup',360,C.playerY,2);a.row=99;a.weaponKind='pierce';f.tick();expect(f.runtime.mode).toBe('choice');expect(w.researchPoints).toBe(2);expect(f.runtime.activateControl('build:ballistic')).toBe(true);expect(f.runtime.mode).toBe('branch');expect(f.runtime.activateControl('branch:fragment')).toBe(true);expect(f.runtime.mode).toBe('playing');expect(w.build.ballisticBranch).toBe('fragment');
 expect(f.runtime.diagnostics().unspentBuildPoints).toBe(0);expect(f.runtime.diagnostics().researchPoints).toBe(2);f.runtime.start();expect(f.runtime.world.researchPoints).toBe(0);
});

it('keeps live-boss upgrade receipts below danger and defers achievements without losing them',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.phase='boss';w.player.x=68;w.spawn('boss',360,C.bossY);w.growth.energy=100;f.tick();
 expect(f.runtime.mode).toBe('choice');expect(f.runtime.activateControl('build:optical')).toBe(true);const runtime=f.runtime as any;
 runtime.achievementToast='测试成就';runtime.achievementUntil=w.time+4;f.tick();
 const title=f.calls.find(c=>c.kind==='fillText'&&c.args[0]==='配件强化 · 聚焦镜组');expect(title?.args[2]).toBe(1208);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='成就达成 · 测试成就')).toBe(false);expect(runtime.achievementUntil).toBeGreaterThan(w.time+6);
 for(let i=0;i<250;i++)f.tick();
 // Live boss bullets can now defer the reading window; clear only the unit
 // fixture danger, then wait for the preserved receipt and achievement.
 w.bullets=[];for(const b of w.bodies){if(b.kind==='boss'){b.empRemaining=100;b.hp=1e6;}else b.active=false;}
 let achievementRead=false;
 for(let i=0;i<250;i++){w.bullets=[];f.tick();achievementRead ||= f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='成就达成 · 测试成就');}
 expect(achievementRead).toBe(true);
 runtime.effect({type:'reward',x:360,y:500,text:'测试战斗回执',detail:'奖励仍清楚可见'});f.tick();expectVisibleCombatCopy(f,'测试战斗回执','奖励仍清楚可见');expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='成就达成 · 测试成就')).toBe(false);
});

it('real death shows earned build and new achievements, returns without mutation, and restarts cleanly',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;
 for(let i=0;i<3;i++){w.growth.energy=100;f.tick();expect(f.runtime.activateControl('build:optical')).toBe(true);if(i===1)expect(f.runtime.activateControl('branch:burn')).toBe(true);}
 expect(f.runtime.save.achievements.unlocked).toContain('specialist');w.player.hp=1;w.bullets=[{id:99999,x:360,y:C.playerY,px:360,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true}];f.tick();
 expect(f.runtime.mode).toBe('result');expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='本局战绩')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('新成就 1 · 专精工程师'))).toBe(true);
 expect(f.runtime.activateControl('resume')).toBe(false);const frozen=JSON.stringify(w),best=f.runtime.save.best;
 expect(f.runtime.activateControl('achievements')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='本局新达成')).toBe(true);for(let i=0;i<30;i++)f.tick();expect(JSON.stringify(w)).toBe(frozen);
 expect(f.runtime.activateControl('achievements-back')).toBe(true);expect(f.runtime.mode).toBe('result');expect(f.runtime.save.best).toBe(best);expect(f.runtime.activateControl('achievements')).toBe(true);expect(f.runtime.back()).toBe('stay');expect(f.runtime.mode).toBe('result');
 f.tick();expect(f.runtime.activateControl('start')).toBe(true);expect(f.runtime.world.bossWins).toBe(0);expect(f.runtime.diagnostics().runAchievements).toEqual([]);expect(f.runtime.save.achievements.unlocked).toContain('specialist');
});

it('celebrates only a strictly improved score and clears the per-run record flag on restart',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();
 for(const [index,score] of [70,70].entries()){const w=f.runtime.world;w.score=score;w.player.hp=1;w.bullets=[{id:99999,x:360,y:C.playerY,px:360,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true}];f.tick();expect(f.runtime.mode).toBe('result');const first=index===0;expect(f.runtime.diagnostics().runNewBest).toBe(first);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]===(first?'刷新最高分 70':'最高分 70'))).toBe(true);expect(f.runtime.activateControl('start')).toBe(true);expect(f.runtime.diagnostics().runNewBest).toBe(false);}
});

it.each([false,true])('draws a visible local arrival shield beneath enemy bullets and keeps its burst budgets (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;const b=w.spawn('drone',360,360);b.dropGrace=.45;b.speed=0;
 w.bullets.push({id:99999,x:360,y:360,px:360,py:360,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});f.tick();
 const ring=f.calls.findIndex(c=>c.kind==='stroke'&&(c.stroke==='#b6d2ff'||c.stroke==='#8bffe3')),enemy=f.calls.findIndex(c=>c.kind==='fill'&&c.color==='#ff7756');expect(ring).toBeGreaterThanOrEqual(0);expect(enemy).toBeGreaterThan(ring);
 for(let i=0;i<40;i++)(f.runtime as any).effect({type:'drop-impact',x:360,y:360});expect((f.runtime as any).particles.length).toBeLessThanOrEqual(weak?50:160);
});

it.each([false,true])('renders earned EMP and open shields below hostile bullets and gate numbers, freezes and resets bounded effects (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;Object.assign(w,{scheduled:[]});
 const node=w.spawn('conduit',360,560),guard=w.spawn('guard',220,440),sniper=w.spawn('sniper',480,360),gate=w.spawn('gate',360,850);
 guard.warning=.5;guard.timer=.5;guard.burst=1;sniper.warning=.5;sniper.timer=.5;f.tick();
 expect(f.calls.some(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('conduit-v1.png'))).toBe(true);
 w.bullets.push({id:99999,x:node.x,y:node.y,px:node.x,py:node.y,vx:0,vy:0,damage:100,age:0,active:true,hostile:false},{id:99998,x:600,y:600,px:600,py:600,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});
 f.tick();for(let i=0;i<10;i++)f.tick();expect(w.conduitBursts).toBe(1);expect(w.conduitTacticalWins).toBe(1);expect(f.runtime.diagnostics().runAchievements).toContain('disruptor');expect(f.runtime.diagnostics().offlineEnemies).toBe(2);
 expect(f.calls.some(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('guard-v1.png')&&c.args[1]>0)).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='停火')).toBe(true);
 const light=f.calls.reduce((last,c,i)=>c.composite==='lighter'?i:last,-1),hostile=f.calls.findIndex(c=>c.kind==='fill'&&c.color==='#ff7756'),number=f.calls.findIndex(c=>c.kind==='fillText'&&c.args[2]===gate.y+8);
 expect(light).toBeGreaterThanOrEqual(0);expect(hostile).toBeGreaterThan(light);expect(number).toBeGreaterThan(light);
 for(let i=0;i<30;i++)(f.runtime as any).effect({type:'emp',x:360,y:560,size:300});expect(f.runtime.diagnostics().empWaves).toBe(2);expect(f.runtime.diagnostics().particles).toBeLessThanOrEqual(weak?50:160);
 f.runtime.pause();const frozen=JSON.stringify((f.runtime as any).empWaves),time=w.time;for(let i=0;i<30;i++)f.tick();expect(JSON.stringify((f.runtime as any).empWaves)).toBe(frozen);expect(w.time).toBe(time);f.runtime.start();expect(f.runtime.diagnostics().empWaves).toBe(0);
});

it('keeps tactical achievement descriptions above the footer and return control',async()=>{
 const f=fixture();await f.runtime.load();f.tick();f.calls.length=0;expect(f.runtime.activateControl('achievements')).toBe(true);
 expect(f.runtime.activateControl('achievement-group:tactics')).toBe(true);const row=f.calls.find(c=>c.kind==='fillText'&&c.args[0]==='一次中继爆破中断两台正在蓄能的敌机');expect(row).toBeDefined();expect(row!.args[2]).toBeLessThan(1040);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='断电时机')).toBe(true);
});

it.each([false,true])('actual ion discharge stays bounded, behind hazards and labels, freezes and resets (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.phase='boss';w.player.x=w.player.px=68;w.growth.mastery=3;
 for(let i=0;i<3;i++)w.chooseBuild('electric');
 const target=w.spawn('armor',360,700);target.hp=target.maxHp=1000;target.speed=0;target.timer=999;
 const gate=w.spawn('gate',500,850);gate.speed=0;
 for(let i=0;i<6;i++){
  w.bullets=[{id:99999,x:target.x,y:target.y,px:target.x,py:target.y,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'arc'},
   {id:99998,x:650,y:600,px:650,py:600,vx:0,vy:100,damage:1,age:0,active:true,hostile:true}];f.tick();
 }
 expect(w.ionBursts).toBe(1);expect(f.runtime.diagnostics().ionHits).toBe(1);
 expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#7dffd9')).toBe(true);
 expect(f.calls.some(c=>c.kind==='rect'&&c.args[1]===C.playerShotTop&&c.args[3]===C.playerY-C.playerShotTop)).toBe(true);
 const light=f.calls.reduce((last,c,i)=>c.composite==='lighter'?i:last,-1),danger=f.calls.findIndex(c=>c.kind==='fill'&&c.color==='#ff7756'),label=f.calls.findIndex(c=>c.kind==='fillText'&&c.args[2]===gate.y+8);
 expect(danger).toBeGreaterThan(light);expect(label).toBeGreaterThan(light);
 const time=w.time;f.runtime.pause();const before=JSON.stringify((f.runtime as any).blasts);for(let i=0;i<20;i++)f.tick();expect(w.time).toBe(time);expect(JSON.stringify((f.runtime as any).blasts)).toBe(before);
 f.runtime.start();expect(f.runtime.diagnostics().ionBursts).toBe(0);expect(f.runtime.diagnostics().blasts).toBe(0);
});

it('browses four contract cards and switches earned proof targets without spending or accepting',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.growth.mastery=6;
 for(let i=0;i<3;i++)w.chooseBuild('electric');for(let i=0;i<3;i++)w.chooseBuild('ballistic');f.tick();
 expect(f.runtime.activateControl('contracts-live')).toBe(true);const before=JSON.stringify(w);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='构筑检验')).toBe(true);
 expect(f.runtime.activateControl('proof-next')).toBe(true);expect(JSON.stringify(w)).toBe(before);
 expect(f.runtime.activateControl('contract:research')).toBe(true);expect(w.contract!.proof!.kind).toBe('storm');
 expect(f.runtime.activateControl('proof-next')).toBe(false);expect(w.proofWins).toBe(0);expect(f.runtime.diagnostics().runAchievements).not.toContain('proof');
 expect(f.runtime.activateControl('resume')).toBe(true);w.phase='boss';w.player.x=w.player.px=68;
 const a=w.spawn('armor',360,600),b=w.spawn('armor',470,600);for(const enemy of [a,b]){enemy.hp=enemy.maxHp=10000;enemy.speed=0;enemy.timer=999;}
 for(let i=0;i<18&&w.contract!.status==='active';i++){w.bullets=[{id:99999,x:a.x,y:a.y,px:a.x,py:a.y,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'scatter',chainHops:1}];f.tick();}
 expect(w.contract!.status).toBe('won');expect(f.runtime.mode).toBe('contract-reward');expect(f.runtime.diagnostics().runAchievements).toContain('proof');
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='雷暴霰射 · 检验通过')).toBe(true);
 expect(f.runtime.activateControl('contract-claim:scatter')).toBe(true);expect(w.contractStats.claimed).toBe(1);expect(w.proofWins).toBe(1);
});
it('keeps the proof achievement readable in its build group',async()=>{
 const f=fixture();await f.runtime.load();f.tick();expect(f.runtime.activateControl('achievements')).toBe(true);
 expect(f.runtime.activateControl('achievement-group:build')).toBe(true);const line=f.calls.find(c=>c.kind==='fillText'&&c.args[0]==='主动接取并完成一次构筑检验');expect(line).toBeDefined();expect(line!.args[2]+11).toBeLessThan(1029);
});

it('cycles from the displayed fallback when the previous proof preference is unavailable',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.growth.mastery=7;
 w.chooseBuild('ballistic');w.chooseBuild('ballistic');w.chooseBuild('electric');w.chooseBuild('ballistic');for(let i=0;i<3;i++)w.chooseBuild('optical');f.tick();
 expect(w.availableProofs()).toEqual(['storm','prism']);expect(f.runtime.activateControl('contracts-live')).toBe(true);
 for(const control of (f.runtime as any).buttons.filter((c:any)=>c.action==='proof-next'||c.action==='contract:research'))expect(control.h*390/720).toBeGreaterThanOrEqual(44);
 expect(f.runtime.activateControl('proof-next')).toBe(true);
 expect(f.runtime.activateControl('contract:research')).toBe(true);expect(w.contract!.proof!.kind).toBe('prism');
});

it.each([false,true])('half-health boss shows physical twin charge, a truthful status and bounded enemy fire (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.phase='boss';w.player.x=w.player.px=68;
 const b=w.spawn('boss',360,C.bossY);b.hp=b.maxHp*.49;f.tick();expect(b.counterfire).toBe(true);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='首领过热 · 双炮反击')).toBe(true);
 for(let i=0;i<20;i++)f.tick();expect(b.attack).toBe(4);expect(b.warning).toBeGreaterThan(0);
 for(const x of [b.x-96,b.x+96])expect(f.calls.some(c=>c.kind==='arc'&&Math.abs(c.args[0]-x)<.001&&c.args[1]===b.y+110)).toBe(true);
 expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('重装首领·过热'))).toBe(true);
 const radius=()=>f.calls.find(c=>c.kind==='arc'&&Math.abs(c.args[0]-(b.x-96))<.001&&c.args[1]===b.y+110)?.args[2];const early=radius();
 for(let i=0;i<20;i++)f.tick();expect(radius()).toBeGreaterThan(early);
 for(let i=0;i<40;i++)f.tick();expect(b.counterVolleys).toBe(1);expect(w.bullets.filter(b=>b.hostile).length).toBe(6);
 const low=f.calls.reduce((last,c,i)=>c.composite==='lighter'?i:last,-1),danger=f.calls.findIndex(c=>c.kind==='fill'&&c.color==='#ff7756');expect(danger).toBeGreaterThan(low);
 f.runtime.pause();const age=b.age;for(let i=0;i<20;i++)f.tick();expect(b.age).toBe(age);f.runtime.start();expect(f.runtime.diagnostics().bossCounterfire).toBe(false);
});


it.each([false,true])('moves earned upgrade feedback away from crates and real bullets, waits without losing reading time (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;
 w.growth.energy=100;f.tick();expect(f.runtime.mode).toBe('choice');
 const crate=w.spawn('crate',360,300,2);crate.weaponKind='pierce';
 expect(f.runtime.activateControl('build:optical')).toBe(true);
 const title=()=>f.calls.find(c=>c.kind==='fillText'&&c.args[0]==='配件强化 · 聚焦镜组');
 expect(title()).toBeUndefined();
 expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('穿甲'))).toBe(true);
 const bullet={id:99999,x:360,y:1200,px:360,py:1200,vx:0,vy:0,damage:1,age:0,active:true,hostile:true};w.bullets.push(bullet);
 f.tick();expect(title()).toBeUndefined();expect(f.calls.some(c=>c.kind==='fillRect'&&c.color==='#ffead7')).toBe(true);
 const r=f.runtime as any;const oldUntil=r.buildFeedback.until;w.time+=5;f.calls.length=0;r.renderFrame(0);
 expect(title()).toBeUndefined();expect(r.buildFeedback.until).toBeCloseTo(oldUntil+5);
 bullet.active=false;for(const b of w.bodies)b.active=false;f.calls.length=0;r.renderFrame(0);expect(title()?.args[2]).toBe(272);
 w.time+=4.1;f.calls.length=0;r.renderFrame(0);expect(title()).toBeUndefined();
 // An already expired receipt must never be revived by a later blocked area.
 crate.active=true;bullet.active=true;r.renderFrame(0);w.time+=6;r.renderFrame(0);bullet.active=false;crate.active=false;f.calls.length=0;r.renderFrame(0);expect(title()).toBeUndefined();
});


it('offers a real third electric tactic without spending on browse and retains old weapons after selection',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.growth.mastery=1;w.chooseBuild('electric');w.growth.energy=100;f.tick();
 const owned=[...w.activeWeapons],before=w.build.spent;
 expect(f.runtime.activateControl('build:electric')).toBe(true);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='雷电改造 · 三选一')).toBe(true);
 for(const name of ['连锁扩散','电容蓄爆','猎隼电桥'])expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]===name)).toBe(true);
 expect(w.build.spent).toBe(before);expect(f.runtime.activateControl('branch-back')).toBe(true);expect(w.build.electricBranch).toBeUndefined();
 f.runtime.activateControl('build:electric');expect(f.runtime.activateControl('branch:seeker')).toBe(true);expect(w.build.electricBranch).toBe('seeker');expect(w.activeWeapons).toEqual(owned);expect(w.build.spent).toBe(before+1);expect(f.runtime.mode).toBe('playing');expect(f.runtime.activateControl('branch:capacitor')).toBe(false);
 f.runtime.pause();f.tick();expect(f.runtime.activateControl('loadout')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('· 猎隼'))).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('首跳340'))).toBe(true);
});
it.each([false,true])('actual seeker arcs retain a distinct narrow hit trace, freeze on pause and respect the existing pool (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const r=f.runtime as any;
 for(let i=0;i<20;i++)r.effect({type:'arc',x:200,y:700,targetX:430,targetY:480,seeker:true});f.tick();
 expect(r.arcs).toHaveLength(12);expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#ffda92')).toBe(true);expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#fff0c5')).toBe(true);expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#ffc76020')).toBe(!weak);
 const before=structuredClone(r.arcs);f.runtime.pause();for(let i=0;i<60;i++)f.tick();expect(r.arcs).toEqual(before);f.runtime.start();expect(r.arcs).toHaveLength(0);
});


it('shows real per-recipe battle records with a separate ready-but-unused state without advancing the run',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.growth.mastery=3;for(let i=0;i<3;i++)w.chooseBuild('electric');
 const b=w.spawn('armor',360,600);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;
 for(let i=0;i<6;i++){w.bullets=[{id:99999,x:360,y:600,px:360,py:600,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'arc'}];w.step(C.step,68);w.drainEffects();}
 f.runtime.pause();f.tick();expect(f.runtime.activateControl('loadout')).toBe(true);expect(f.runtime.activateControl('combos')).toBe(true);
 const before=JSON.stringify(w);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='放电1次')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='未成形')).toBe(true);for(let i=0;i<60;i++)f.tick();expect(JSON.stringify(w)).toBe(before);
 f.runtime.activateControl('combos-back');f.runtime.start();f.runtime.pause();f.tick();expect(f.runtime.activateControl('loadout')).toBe(true);expect(f.runtime.activateControl('combos')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='放电1次')).toBe(false);
});


it('renders actual seeker hits in a real death report instead of silently merging them into chain totals',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.growth.mastery=2;w.chooseBuild('electric');w.chooseBuild('electric','seeker');
 for(const [kind,x,y] of [['armor',150,750],['sniper',150,450]] as const){const b=w.spawn(kind,x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;}
 w.bullets=[{id:99999,x:150,y:750,px:150,py:750,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'arc',chainHops:1}];f.tick();expect(w.seekerLinks).toBe(1);
 w.player.hp=1;w.bullets=[{id:99998,x:w.player.x,y:C.playerY,px:w.player.x,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true}];f.tick();expect(f.runtime.mode).toBe('result');expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('猎隼 1'))).toBe(true);
});


it.each([false,true])('rebound intent is local, uses original detailed charge pose, and freezes with the paused world (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const b=f.runtime.world.spawn('charger',220,600);b.pattern='rebound';b.lane=480;b.reboundOrigin=140;b.age=1.9;f.tick();
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='折返·再蓄能')).toBe(true);expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#ffb59b')).toBe(true);
 const draw=f.calls.find(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('charger-v1.png'));expect(draw?.args[1]).toBe(256);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='折返冲锋：看清第二次转向')).toBe(true);
 f.runtime.pause();f.tick();const age=b.age,x=b.x,y=b.y;for(let i=0;i<30;i++)f.tick();expect([b.age,b.x,b.y]).toEqual([age,x,y]);f.runtime.start();f.tick();expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='折返·再蓄能')).toBe(false);
});


it('keeps pickup names inside the viewport and legible over fire while actual hostile bullets stay above the label',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world,p=w.spawn('pickup',68,600,2);p.weaponKind='arc';
 w.bullets.push({id:99999,x:128,y:548,px:128,py:548,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});f.tick();
 const plate=f.calls.findIndex(c=>c.kind==='fillRect'&&c.color==='#0b1723f7'),label=f.calls.findIndex(c=>c.kind==='fillText'&&c.args[0]==='拾取叠加电弧炮'),bullet=f.calls.findIndex(c=>c.kind==='fillRect'&&c.color==='#ffead7');
 expect(plate).toBeGreaterThanOrEqual(0);expect(label).toBeGreaterThan(plate);expect(bullet).toBeGreaterThan(label);expect(f.calls[plate].args[0]).toBe(12);expect(f.calls[plate].args[2]).toBe(232);expect(f.calls[label].args[1]).toBe(128);
 const enemy=w.spawn('drone',128,550);enemy.hp=enemy.maxHp=1000;enemy.speed=0;f.tick();expect(f.calls.some(c=>c.kind==='fillRect'&&c.color==='#0b1723f7')).toBe(false);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='拾取叠加电弧炮')).toBe(true);
});


it('routes an actual calibration pickup through readable combat receipts instead of covering a charging enemy',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;Object.assign(w,{scheduled:[]});
 w.spawn('pickup',360,C.playerY,2);f.tick();resolveResearch(f);
 const install=w.spawn('pickup',360,C.playerY,3);install.weaponKind='scatter';f.tick();
 // Let the earlier research notice finish before isolating the charger guide.
 for(let i=0;i<600;i++)f.tick();
 const enemy=w.spawn('charger',500,320);enemy.pattern='rebound';enemy.reboundOrigin=500;enemy.lane=240;enemy.age=.5;enemy.hp=enemy.maxHp=1000;
 const refit=w.spawn('pickup',360,C.playerY,3);refit.weaponKind='scatter';refit.refit=true;f.tick();
 expect(w.refitsClaimed).toBe(1);expect(w.weaponCalibration('scatter')).toBe(1);expect(f.runtime.mode).toBe('playing');
 // An unread installation merges the later calibration into its actual final
 // parameters; it must not pretend the installation was already acknowledged.
 const receipt=()=>f.calls.find(c=>c.kind==='fillText'&&c.args[0]==='新增霰射炮 T3 · 7发/轮');expect(receipt()).toBeUndefined();expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='折返冲锋：看清第二次转向')).toBe(true);
 enemy.active=false;for(let i=0;i<240&&!receipt();i++)f.tick();expect(receipt()).toBeDefined();expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='领取时常态全弹直伤/秒 0 → 174')).toBe(true);
});
it.each([false,true])('selects the earned third ballistic fork and draws only actual bounded golden bounces (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.spawn('pickup',360,C.playerY,2);f.tick();
 expect(f.runtime.activateControl('build:ballistic')).toBe(true);f.tick();const offer=w.spawn('pickup',360,C.playerY,2);offer.row=99;offer.weaponKind='pierce';f.tick();expect(f.runtime.activateControl('build:ballistic')).toBe(true);f.tick();
 expect(f.runtime.mode).toBe('branch');for(const name of ['贯穿弹芯','爆破弹芯','跳弹弹芯'])expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]===name)).toBe(true);
 expect(f.runtime.activateControl('branch:ricochet')).toBe(true);f.tick();expect(w.build.ballisticBranch).toBe('ricochet');expect(w.build.spent).toBe(2);
 w.player.x=w.player.px=68;const a=w.spawn('armor',360,600),b=w.spawn('armor',560,600);for(const body of [a,b]){body.hp=body.maxHp=1000;body.speed=0;body.timer=999;}
 for(let i=0;i<25;i++)w.bullets.push({id:900000+i,x:360,y:600,px:360,py:600,vx:0,vy:0,damage:1,age:0,active:true,hostile:false,weaponKind:'scatter'});
 f.tick();expect(w.scatterRicochets).toBe(25);expect(f.runtime.diagnostics().ricochetTraces).toBeLessThanOrEqual(16);expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#ffc35b')).toBe(true);expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#efad3244')).toBe(!weak);
 const count=f.runtime.diagnostics().ricochetTraces;f.runtime.pause();for(let i=0;i<20;i++)f.tick();expect(f.runtime.diagnostics().ricochetTraces).toBe(count);
 (w as unknown as {shoot:()=>void}).shoot=()=>{};expect(f.runtime.activateControl('resume')).toBe(true);for(let i=0;i<120;i++){f.tick();expect(f.runtime.diagnostics().ricochetTraces).toBeLessThanOrEqual(16);}expect(f.runtime.diagnostics().ricochetTraces).toBe(0);f.runtime.start();f.tick();expect(f.runtime.diagnostics().ricochetTraces).toBe(0);
});
it.each([false,true])('renders the authored eight-slice gate, uses real tier energy and keeps numbers and hostile cores above it (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.player.x=w.player.px=68;const gate=w.spawn('gate',360,600);gate.speed=0;f.tick();
 const pieces=()=>f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('gate-frame-v1.png'));
 expect(pieces()).toHaveLength(8);expect(pieces().every(c=>c.composite==='source-over')).toBe(true);expect(f.calls.some(c=>c.kind==='fillRect'&&c.color==='#68e8ff')).toBe(false);
 w.bullets.push({id:900001,x:360,y:600,px:360,py:600,vx:0,vy:0,damage:28,age:0,active:true,hostile:false});f.tick();
 expect(gate.energy).toBe(28);expect(w.gatesTaken).toBe(0);expect(w.growth.bonus).toBe(0);expect(f.calls.filter(c=>c.kind==='fillRect'&&c.color==='#68e8ff')).toHaveLength(4);expect(f.calls.some(c=>c.kind==='stroke'&&c.stroke==='#68e8ff'&&c.composite==='lighter')).toBe(true);
 const x=pieces()[0].args[5];f.tick();expect(pieces()[0].args[5]).toBeLessThan(x);
 const body=w.spawn('armor',360,600);body.hp=body.maxHp=1000;body.speed=0;body.timer=999;
 w.bullets.push({id:900002,x:360,y:610,px:360,py:610,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});f.tick();
 const frame=f.calls.findIndex(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('gate-frame-v1.png')),enemy=f.calls.findIndex(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('armor-v1.png')),number=f.calls.findIndex(c=>c.kind==='fillText'&&c.args[0]==='+15%'),shot=f.calls.findIndex(c=>c.kind==='fillRect'&&c.color==='#ffead7');
 expect(frame).toBeLessThan(enemy);expect(number).toBeGreaterThan(enemy);expect(shot).toBeGreaterThan(number);expect(f.calls.some(c=>c.kind==='fillRect'&&c.color==='#071927f5')).toBe(false);
 f.runtime.pause();f.tick();const before=pieces().map(c=>c.args.slice(1));for(let i=0;i<20;i++)f.tick();expect(pieces().map(c=>c.args.slice(1))).toEqual(before);
});
it('fits two native reward lines inside the extended physical gate without changing reward geometry',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.growth.bonus=95;const gate=w.spawn('gate',360,600);gate.energy=144;gate.speed=0;const size=[gate.width,gate.height];f.tick();
 const pieces=f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('gate-frame-v1.png'));expect(pieces).toHaveLength(8);expect(Math.min(...pieces.map(c=>c.args[6]))).toBe(488);expect(Math.max(...pieces.map(c=>c.args[6]+c.args[8]))).toBe(712);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='+5%')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='充能 +25')).toBe(true);expect([gate.width,gate.height]).toEqual(size);expect(w.growth.bonus).toBe(95);expect(w.gatesTaken).toBe(0);
});
it.each([false,true])('keeps paired gate borders distinct even during a real tier pulse and preserves the exclusive row (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.player.x=w.player.px=68;
 const gates=[222,498].map(x=>{const b=w.spawn('gate',x,600);b.row=77;b.speed=0;return b;});f.tick();w.bullets.push({id:900009,x:222,y:600,px:222,py:600,vx:0,vy:0,damage:28,age:0,active:true,hostile:false});f.tick();f.tick();
 const pieces=f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('gate-frame-v1.png'));expect(pieces).toHaveLength(16);
 const left=pieces.slice(0,8),right=pieces.slice(8);expect(Math.max(...left.map(c=>c.args[5]+c.args[7]))).toBeLessThan(Math.min(...right.map(c=>c.args[5])));
 const panels=f.calls.filter(c=>c.kind==='fillRect'&&c.color==='#071927f5');expect(panels).toHaveLength(2);expect(panels.every(c=>c.args[2]===180)).toBe(true);expect(w.gatesTaken).toBe(0);expect(gates.every(g=>g.active&&g.width===240&&g.row===77)).toBe(true);
});
it('offers the earned ricochet validation and renders both event and batch requirements without granting an achievement',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.spawn('pickup',360,C.playerY,2);f.tick();expect(f.runtime.activateControl('build:ballistic')).toBe(true);
 const offer=w.spawn('pickup',360,C.playerY,2);offer.weaponKind='pierce';offer.row=999;f.tick();expect(f.runtime.activateControl('build:ballistic')).toBe(true);expect(f.runtime.activateControl('branch:ricochet')).toBe(true);
 expect(f.runtime.activateControl('contracts-live')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('跳弹侧击 · 30秒跳弹12次 · 命中2批精英'))).toBe(true);
 expect(f.runtime.activateControl('contract:research')).toBe(true);expect(w.contract!.proof!.kind).toBe('ricochet');expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('跳弹侧击 0/12 · 批次0/2'))).toBe(true);const time=w.time;for(let i=0;i<30;i++)f.tick();expect(w.time).toBe(time);expect(w.contract!.elapsed).toBe(0);expect(f.runtime.save.achievements.unlocked).not.toContain('bank-shot');expect(f.runtime.activateControl('resume')).toBe(true);
});


it('paginates tactical medals, refuses hidden targets, reopens on the tracked page, persists and clears without touching combat',async()=>{
 let persisted:Save|undefined;const f=fixture(false,undefined,s=>{persisted=JSON.parse(JSON.stringify(s));});await f.runtime.load();const before=JSON.stringify(f.runtime.world);
 expect(f.runtime.activateControl('achievements')).toBe(true);expect(f.runtime.activateControl('achievement-group:tactics')).toBe(true);
 expect(f.runtime.activateControl('track:bait-counter')).toBe(false);expect(f.runtime.activateControl('achievement-page:previous')).toBe(false);
 const pages=Math.ceil(achievementGroups.tactics.ids.length/4);expect(pages).toBe(3);
 expect(f.runtime.activateControl('achievement-page:next')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]===`2/${pages}页`)).toBe(true);
 expect(f.runtime.activateControl('track:bait-counter')).toBe(true);expect(persisted?.achievements.tracked).toBe('bait-counter');expect(JSON.stringify(f.runtime.world)).toBe(before);
 expect(f.runtime.activateControl('track:wall-cutter')).toBe(false);expect(f.runtime.activateControl('achievement-page:next')).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]===`3/${pages}页`)).toBe(true);expect(f.runtime.activateControl('achievement-page:next')).toBe(false);expect(f.runtime.activateControl('achievements-back')).toBe(true);expect(f.runtime.activateControl('achievements')).toBe(true);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='诱射反击')).toBe(true);expect(f.runtime.activateControl('track-clear')).toBe(true);expect(persisted?.achievements.tracked).toBeNull();
});

it('keeps actual three-pass progress on the existing emitter label independently of bottom guidance',async()=>{
 const f=fixture();await f.runtime.load();f.runtime.activateControl('achievements');f.runtime.activateControl('achievement-group:tactics');f.runtime.activateControl('achievement-page:next');expect(f.runtime.activateControl('track:bait-counter')).toBe(true);f.runtime.activateControl('achievements-back');f.runtime.start();
 // Controlled encounter placement for rendering only; bolts and pass events remain real.
 const w=f.runtime.world;Object.assign(w,{scheduled:[]});const b=w.spawn('sniper',540,360);Object.assign(b,{pattern:'lockshot',lockX:360,lockDamageStart:0,timer:.1,dropGrace:.45});f.runtime.touchStart(735,360,900);f.runtime.touchMove(735,68,900);
 for(let i=0;i<180&&(b.lockPassed??0)<3;i++)f.tick();expect(b.lockAcceptedShots).toBe(3);expect(b.lockPassed).toBe(3);expect(w.lockBaitWins).toBe(0);
 for(let i=0;i<3&&!f.calls.some(c=>c.args[0]==='诱射 3/3 · 可反击');i++)f.tick();expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='诱射 3/3 · 可反击')).toBe(true);
});

it.each([false,true])('shows actual fire-control source count, separated column labels and truthful shutdown without a future trajectory (weak=%s)',async weak=>{
 const f=fixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.player.x=w.player.px=68;f.runtime.touchStart(735,68,900);Object.assign(w,{roundTime:55.5,scheduled:[{at:55.5,kind:'armor',x:440,drop:true,dropY:550,pattern:'fire-control'},{at:55.5,kind:'armor',x:440,drop:true,dropY:350,pattern:'fire-control'},{at:55.5,kind:'conduit',x:210,drop:true,dropY:450,pattern:'fire-control'}]});f.tick();f.tick();
 expect(f.runtime.diagnostics().fireControlUnits).toHaveLength(3);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='火控中继 · 增幅2台')).toBe(true);const label=f.calls.find(c=>c.kind==='fillText'&&c.args[0]==='增幅·扇射');expect(label?.args[1]).toBe(440);expect(f.calls.filter(c=>c.kind==='fillText'&&c.args[0]==='增幅·扇射').map(c=>c.args[2]).sort((a,b)=>a-b)).toEqual([263,463]);
 for(let i=0;i<65;i++)f.tick();const relay=w.bodies.find(b=>b.active&&b.kind==='conduit')!;w.bullets.push({id:900000,x:relay.x,y:relay.y,px:relay.x,py:relay.y,vx:0,vy:0,damage:100000,age:0,active:true,hostile:false});f.tick();f.tick();expect(w.lastFireControlBreak?.affected).toBe(2);for(let i=0;i<6&&!f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='火控·停火');i++)f.tick(17);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='火控·停火'),JSON.stringify({mode:f.runtime.mode,units:f.runtime.diagnostics().fireControlUnits,text:f.calls.filter(c=>c.kind==='fillText').map(c=>c.args[0])})).toBe(true);expect(f.runtime.diagnostics().fireControlUnits.every((b:any)=>b.kind!=='armor'||b.source===undefined)).toBe(true);
});
