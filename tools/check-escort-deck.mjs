import {build} from 'esbuild';import {writeFileSync} from 'node:fs';import assert from 'node:assert/strict';
// Unit harness for our own fixture controller, never a browser driver. This
// synthetic DOM/canvas cannot provide pixels, browser health or visual signoff.
const buttons=Object.fromEntries(['advance','step','quality','status'].map(id=>[id,{disabled:false,textContent:''}]));
const props={font:'20px sans-serif'},stack=[];
const ctx=new Proxy(props,{get(t,k){if(k in t)return t[k];if(k==='save')return()=>stack.push({...t});if(k==='restore')return()=>Object.assign(t,stack.pop());if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});if(k==='measureText')return s=>({width:Array.from(String(s)).length*20});return()=>{};}});
const canvas={clientWidth:390,clientHeight:754,width:390,height:754,getContext:()=>ctx};
const callbacks=[],events={};globalThis.document={querySelector:s=>s==='canvas'?canvas:buttons[s.slice(1)]};globalThis.window={addEventListener:(n,f)=>events[n]=f};
globalThis.innerWidth=390;globalThis.innerHeight=844;globalThis.devicePixelRatio=1;globalThis.location={href:'http://fixture.invalid/tools/visual-fixtures/escort-deck.html'};globalThis.requestAnimationFrame=f=>callbacks.push(f);
await build({entryPoints:['tools/visual-fixtures/escort-deck.js'],bundle:true,platform:'node',format:'esm',outfile:'build/qa/Stage-250/fixture-controller.mjs',plugins:[{name:'synthetic-fixture-platform',setup(b){
 b.onLoad({filter:/[\\/]browser-image\.ts$/},()=>({contents:'export async function browserImage(src){return {src,width:768,height:256}}',loader:'js'}));
 b.onLoad({filter:/[\\/]browser-controls\.ts$/},()=>({contents:'export function createBrowserControls(_canvas,activate){globalThis.fixtureActivate=activate;return {update(controls){globalThis.fixtureControls=controls;}}}',loader:'js'}));
}}]});
await import('../build/qa/Stage-250/fixture-controller.mjs');
const evidence=()=>window.__escortDeckEvidence(),history=[];
function record(label){const e=evidence();history.push({label,current:e.current,physical:e.physical});console.log(JSON.stringify({label,stage:e.current.stage,mode:e.current.mode,time:e.physical.time,round:e.physical.round,escorts:e.current.escorts.length}));return e;}
function click(action){assert.ok(globalThis.fixtureControls.some(c=>c.action===action),'visible fixture control '+action);globalThis.fixtureActivate(action);}
function advance(){assert.equal(buttons.advance.disabled,false);buttons.advance.onclick();let n=0;while(callbacks.length&&n++<1000)callbacks.shift()();assert.ok(n<1000,'bounded fixture progression');return record('advance');}
record('menu');click('start');let e=advance();assert.equal(e.current.stage,'正常无伤契约完成');assert.equal(e.current.mode,'contract-reward');
click('contract-claim:'+e.current.activeWeapons[0]);e=record('claimed');assert.equal(e.current.mode,'playing');assert.equal(e.physical.contractStats.claimed,1);
e=advance();assert.equal(e.current.stage,'重装护炮初现');assert.ok(e.current.escorts.some(b=>b.kind==='guard'));assert.ok(e.current.escorts.some(b=>b.kind==='armor'));
const frozen=JSON.stringify(e.physical);buttons.quality.onclick();assert.equal(JSON.stringify(evidence().physical),frozen);record('weak');buttons.quality.onclick();
canvas.clientWidth=1440;canvas.clientHeight=810;globalThis.innerWidth=1440;globalThis.innerHeight=900;events.resize();assert.equal(JSON.stringify(evidence().physical),frozen);record('desktop');
canvas.clientWidth=390;canvas.clientHeight=754;globalThis.innerWidth=390;globalThis.innerHeight=844;events.resize();
e=advance();assert.equal(e.current.stage,'护炮实弹接近');assert.ok(e.physical.bullets.some(b=>b.active&&b.hostile));
e=advance();assert.equal(e.current.stage,'第二护炮组');e=advance();assert.equal(e.current.mode,'boss-reward');click('boss-claim:research');e=record('boss-claimed');assert.equal(e.physical.bossWins,3);assert.equal(e.current.mode,'choice');
writeFileSync('build/qa/Stage-250/fixture-controller.json',JSON.stringify({method:'Own fixture executed in a synthetic DOM/canvas with real CanvasRuntime, normal control/pointer inputs and earned progression. No actual browser, pixels or real-device performance. No World state injection.',history},null,2));
