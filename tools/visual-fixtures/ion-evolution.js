import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';
import {createBrowserControls} from '../../src/game/browser-controls.ts';
import {browserImage} from '../../src/game/browser-image.ts';
import {defaults} from '../../src/ui/storage.ts';
import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),advance=document.querySelector('#advance'),weak=document.querySelector('#weak'),clockButton=document.querySelector('#clock');
let stored=defaults(),clock=0,next=()=>{},running=false,frame=0,stage='menu';const history=[];
stored.openingWeapon='pulse';stored.settings.sound=false;stored.settings.shake=false;
const controls=createBrowserControls(canvas,name=>{action(name);if(name==='start')freeze('run-started');else if(name.startsWith('branch:ion-'))freeze('evolution-selected');else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>{stored=JSON.parse(JSON.stringify(s));},sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>{next=cb;}});
function action(name){if(!runtime.activateControl(name))throw Error('Visible action rejected '+name);}
function snapshot(){return {stage,fixture:true,virtualClock:true,isolatedMemorySave:true,worldInjection:false,...runtime.diagnostics()};}
function report(){status.textContent=runtime.world.time.toFixed(2)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||runtime.mode!=='playing'||stage==='actual-hit';weak.disabled=running;clockButton.disabled=running||runtime.mode==='menu';}
function freeze(s){running=false;stage=s;history.push(JSON.parse(JSON.stringify(snapshot())));report();}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2,point=v=>[px+v*s,py+900*s];if(runtime.pointer!==736)runtime.touchStart(736,...point(runtime.world.player.x));runtime.touchMove(736,...point(x));}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){
  if(w.canRefineIon()){action('build:electric');freeze('evolution-choice');return;}
  const a=w.build.available(w.buildPoints),r=w.canRefineMagnetic()&&a.includes('electric')?'electric':a.includes('electric')&&(w.build.ranks.electric<3||w.build.refinements.electric<2)?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];if(r)action('build:'+r);
 }
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):runtime.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-quick':'ricochet'):w.canRefinePhoton()?'photon-reach':'relay'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w,'arc'));
 clock+=1000/60;next(clock);frame++;
 if(stage==='evolution-selected'&&(w.ionOrbs.some(p=>p.age>=.06)||w.ionSpears.some(p=>p.age>=.06))){freeze('projectile-flight');return;}
 if(stage==='projectile-flight'&&w.ionOrbHits+w.ionSpearHits>0){freeze('actual-hit');return;}
 if(w.time>600||['error','result'].includes(runtime.mode)){freeze('failed');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};
weak.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
clockButton.onclick=()=>{for(let i=0;i<60;i++){clock+=1000/60;next(clock);}report();};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__ionEvolutionEvidence',{value:()=>({history,current:snapshot()})});
await runtime.load();report();
