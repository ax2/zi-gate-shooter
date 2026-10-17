import {C} from '../../src/core/config.ts';
import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';
import {createBrowserControls} from '../../src/game/browser-controls.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const params=new URL(location.href).searchParams,version=params.get('version')==='baseline'?'baseline':'current';let observed=['pulse','scatter','pierce','blast','arc'].includes(params.get('weapon'))?params.get('weapon'):'scatter';
const preferredRoute=['optical','ballistic','electric'].includes(params.get('route'))?params.get('route'):'optical';
const Runtime=version==='baseline'?(await import('/build/qa/Stage-193/baseline-browser.mjs')).CanvasRuntime:CanvasRuntime;
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),advance=document.querySelector('#advance'),weak=document.querySelector('#weak'),weaponSelect=document.querySelector('#weapon'),versionSelect=document.querySelector('#version'),timeInput=document.querySelector('#time');
let stored=defaults(),clock=0,next=()=>{},running=false,frame=0,stage='menu',cosmeticSeed=12345;const history=[];let trackedBurst=null;stored.openingWeapon=observed==='pulse'?'scatter':observed;stored.settings.sound=false;stored.settings.shake=false;
weaponSelect.value=observed;versionSelect.value=version;
function cosmetic(f){const previous=Math.random;Math.random=()=>{cosmeticSeed=(Math.imul(cosmeticSeed,1664525)+1013904223)>>>0;return cosmeticSeed/4294967296;};try{return f();}finally{Math.random=previous;}}
const controls=createBrowserControls(canvas,name=>{action(name);if(name==='start')freeze('run-started');else report();});
const runtime=new Runtime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>{stored=JSON.parse(JSON.stringify(s));},sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>{next=cb;}});
function action(name){cosmetic(()=>{if(!runtime.activateControl(name))throw Error('Visible action rejected '+name);});}
// Baseline observer reads its existing cosmetic pool only; it never alters effects or World.
function marks(){return runtime.diagnostics().weaponImpacts??runtime.impacts.filter(h=>!h.opticalBand).map(h=>({...h}));}
function snapshot(){return {stage,version,observed,preferredRoute,fixture:true,virtualClock:true,isolatedMemorySave:true,worldInjection:false,cosmeticRandomSeeded:true,baselineObserverOnly:true,...runtime.diagnostics(),weaponImpacts:marks(),blastMarks:runtime.blasts.map(e=>({...e,age:1-e.life/e.total}))};}
function report(){status.textContent=runtime.world.time.toFixed(4)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||!['playing','choice','branch','boss-reward'].includes(runtime.mode);weak.disabled=running;weaponSelect.disabled=versionSelect.disabled=timeInput.disabled=running||runtime.mode!=='menu';}
function freeze(s){running=false;stage=s;history.push(JSON.parse(JSON.stringify(snapshot())));report();}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2,point=v=>[px+v*s,py+900*s];if(runtime.pointer!==739)runtime.touchStart(739,...point(runtime.world.player.x));runtime.touchMove(739,...point(x));}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes(preferredRoute)&&w.build.ranks[preferredRoute]<3?preferredRoute:a.includes('electric')&&w.build.ranks.electric<3?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):runtime.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':'ricochet'):w.canRefinePhoton()?'photon-reach':'relay'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w,observed));clock+=1000/60;cosmetic(()=>next(clock));frame++;
 const fixed=Number(timeInput.value),hits=marks();
 if(fixed>0&&w.time>=fixed-1e-8){freeze('fixed-checkpoint');return;}
 if(!fixed&&params.get('mode')==='detonation'){
  if(!trackedBurst&&w.time>Math.max(16,Number(params.get('after'))||16)&&w.activeWeapons.includes(observed)&&(params.get('hazards')!=='1'||w.bullets.some(b=>b.active&&b.hostile))){
   trackedBurst=runtime.blasts.find(e=>1-e.life/e.total<.12&&!e.ion&&!e.electric&&e.y>=C.playerShotTop+100&&e.y<C.playerY-100);
   if(trackedBurst){freeze('detonation-hot');return;}
  }
  if(trackedBurst){const age=1-trackedBurst.life/trackedBurst.total;
   if(stage==='detonation-hot'&&age>=.25){freeze('detonation-edge');return;}
   if(stage==='detonation-edge'&&age>=.65){freeze('detonation-embers');return;}
  }
 }
 if(!fixed&&params.get('mode')!=='detonation'&&params.get('mode')!=='mixed'&&stage==='run-started'&&hits.some(h=>h.kind===observed&&h.y>=C.playerShotTop+80&&h.y<=C.playerY-80&&(h.total??.14)-h.life>=.055&&h.life>.035)){freeze('actual-impact');return;}
 if(!fixed&&(stage==='actual-impact'||params.get('mode')==='mixed')&&hits.some((h,i)=>h.life>.035&&h.y>=C.playerShotTop+80&&h.y<=C.playerY-80&&hits.filter((g,j)=>g.life>.035&&j!==i&&g.kind!==h.kind&&Math.hypot(h.x-g.x,h.y-g.y)<28).length>=2)){freeze('mixed-impact');return;}
 if(w.time>300||['error','result'].includes(runtime.mode)){freeze('finished');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};weak.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
weaponSelect.onchange=()=>{observed=weaponSelect.value;action('opening-menu');action('opening:'+(observed==='pulse'?'scatter':observed));action('opening-back');report();};versionSelect.onchange=()=>{const url=new URL(location.href);url.searchParams.set('version',versionSelect.value);url.searchParams.set('weapon',weaponSelect.value);location.href=url.href;};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__weaponImpactEvidence',{value:()=>({history,current:snapshot(),physical:JSON.parse(JSON.stringify(runtime.world,(_key,v)=>v instanceof Map?[...v.entries()]:v instanceof Set?[...v.values()]:v))})});await runtime.load();report();
