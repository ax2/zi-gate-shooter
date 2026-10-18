import {createRenderFixture} from '../tests/helpers/render-fixture';
import {progressionTarget} from '../tests/helpers/progression-driver';
import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';
const path='./baseline.mjs',Old=(await import(path)).CanvasRuntime;
const serial=(v:unknown)=>JSON.stringify(v,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const rows=[];
for(const weak of [false,true]){
 const old=createRenderFixture(weak,undefined,undefined,Old),fresh=createRenderFixture(weak),slots=[old,fresh];
 for(const f of slots){await f.runtime.load();f.runtime.start();f.tick();}
 const action=(a:string)=>{for(const f of slots)assert.equal(f.runtime.activateControl(a),true,a);};
 action('contracts-live');action('contract:precision');action('resume');let frame=0;
 while(fresh.runtime.mode!=='contract-reward'&&frame<2400){
  const w=fresh.runtime.world;
  if(fresh.runtime.mode==='choice')action('build:ballistic');
  if(fresh.runtime.mode==='branch')action('branch:ricochet');
  if(frame%6===0){const x=progressionTarget(w);for(const f of slots){if(f.runtime.pointer!==739)f.runtime.touchStart(739,f.runtime.world.player.x,900);f.runtime.touchMove(739,x,900);}}
  for(const f of slots)f.tick();frame++;
  assert.equal(serial(old.runtime.world),serial(fresh.runtime.world));assert.equal(old.runtime.mode,fresh.runtime.mode);
 }
 assert.equal(fresh.runtime.mode,'contract-reward','Normal earned precision contract must succeed');
 const before=fresh.runtime.world.profileFor('scatter'),oldNotice=(old.runtime as any).notice;
 action('contract-claim:scatter');
 assert.equal(serial(old.runtime.world),serial(fresh.runtime.world));assert.equal(old.runtime.mode,fresh.runtime.mode);
 assert.equal((old.runtime as any).notice,'契约完成 · 选择强化奖励');assert.notEqual((fresh.runtime as any).notice,oldNotice);
 const after=fresh.runtime.world.profileFor('scatter');assert.ok(after.damage.reduce((a,b)=>a+b,0)*after.rate>before.damage.reduce((a,b)=>a+b,0)*before.rate);
 rows.push({weak,frames:frame,seconds:fresh.runtime.world.time,kills:fresh.runtime.world.kills,hp:fresh.runtime.world.player.hp,oldNotice,newNotice:(fresh.runtime as any).notice,oldText:old.calls.filter(c=>c.kind==='fillText').map(c=>c.args[0]),newText:fresh.calls.filter(c=>c.kind==='fillText').map(c=>c.args[0]),worldModeEqual:true,worldInjection:false});
}
writeFileSync('build/qa/Stage-248/earned-contract.json',JSON.stringify({method:'Normal menu controls, earned pickups/builds/kills, identical actual pointer inputs. Mock renderer, virtual clock and omniscient test operator; not human difficulty, browser visual acceptance or device performance.',rows},null,2));console.log(JSON.stringify(rows.map(({oldText,newText,...r})=>r)));
