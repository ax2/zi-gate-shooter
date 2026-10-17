import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';
import {browserImage} from '../../src/game/browser-image.ts';
import {createBrowserControls} from '../../src/game/browser-controls.ts';
import {defaults} from '../../src/ui/storage.ts';
import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const baseline=new URL(location.href).searchParams.get('version')==='baseline';
const Runtime=baseline?(await import('/build/qa/Stage-212/baseline.mjs')).CanvasRuntime:CanvasRuntime;
const canvas=document.querySelector('canvas'),status=document.querySelector('#status');
let clock=0,next=()=>{},frame=0,running=false,target=null,stage='menu',stored=defaults();
stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;
const c=canvas.getContext('2d'),draw=c.drawImage.bind(c);let mounts=[];
c.drawImage=(img,...args)=>{if(img.src?.endsWith('/mounted-modules-v1.png'))mounts.push({frame:args[0]/256+args[1]/256*3,x:args[4],y:args[5],width:args[6],height:args[7]});return draw(img,...args);};
const controls=createBrowserControls(canvas,name=>{action(name);if(name==='start')stage='run-started';report();});
const runtime=new Runtime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function action(a){if(!runtime.activateControl(a))throw Error('Rejected visible action '+a);}
function report(){status.textContent=`${baseline?'旧版':'新版'} / ${runtime.world.time.toFixed(2)}秒 / ${stage} / ${runtime.mode}`;for(const id of ['advance','left','right','weak'])document.querySelector('#'+id).disabled=running||runtime.mode!=='playing';}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),ox=(canvas.clientWidth-720*s)/2,oy=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==742)runtime.touchStart(742,ox+runtime.world.player.x*s,oy+900*s);runtime.touchMove(742,ox+x*s,oy+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a.includes('electric')?'electric':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'penetrator'):runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):w.canRefinePhoton()?'photon-reach':'relay'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(runtime.mode==='playing'&&(target!==null||frame%6===0))aim(target??progressionTarget(w));
 mounts=[];clock+=1000/60;next(clock);frame++;
 if(target!==null&&Math.abs(w.player.x-target)<.01||target===null&&w.time>=360||['error','result'].includes(runtime.mode)){running=false;stage=target===68?'left-edge':target===652?'right-edge':'grown';}report();
}
function pump(){if(!running)return;for(let i=0;i<360&&running;i++)step();if(running)requestAnimationFrame(pump);}
function go(x){target=x;running=true;report();requestAnimationFrame(pump);}
document.querySelector('#advance').onclick=()=>go(null);document.querySelector('#left').onclick=()=>go(68);document.querySelector('#right').onclick=()=>go(652);
document.querySelector('#weak').onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';mounts=[];runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__rigBoundaryEvidence',{value:()=>({fixture:true,baseline,virtualClock:true,isolatedMemorySave:true,worldInjection:false,stage,mounts:[...mounts],physical:JSON.parse(JSON.stringify(runtime.world,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v)),...runtime.diagnostics()})});
await runtime.load();report();
