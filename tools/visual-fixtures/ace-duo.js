import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{browserImage}from'../../src/game/browser-image.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';import{aceAim}from'../../tests/helpers/ace-driver.ts';
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),weak=document.querySelector('#weak'),order=document.querySelector('#first'),status=document.querySelector('#status');
order.value=new URL(location.href).searchParams.get('first')==='needle'?'needle':'fan';
let clock=0,next=()=>{},frame=0,running=false,stage='menu',stored=defaults();const history=[],guns=new Map();stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;
const controls=createBrowserControls(canvas,a=>{action(a);if(a==='start')stage='run-started';if(a==='contract:hunter')stage='duo-selected';report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function action(a){if(!runtime.activateControl(a))throw Error('Rejected visible action '+a);}
function report(){status.textContent=`${runtime.world.time.toFixed(2)}秒 / ${stage} / ${runtime.mode}`;advance.disabled=running||['hunt-ready','reward-ready'].includes(stage)||!['playing','choice','branch','boss-reward'].includes(runtime.mode);weak.disabled=running;order.disabled=running||!!runtime.world.contract;}
function snapshot(){return{stage,first:order.value,fixture:true,virtualClock:true,isolatedMemorySave:true,worldInjection:false,guns:[...guns.values()].map(b=>({id:b.id,role:b.aceRole,active:b.active,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,shots:b.bountyShots??0,rage:b.aceEnraged??false,rageShots:b.aceRageShots??0})),...runtime.diagnostics()};}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),ox=(canvas.clientWidth-720*s)/2,oy=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==743)runtime.touchStart(743,ox+runtime.world.player.x*s,oy+900*s);runtime.touchMove(743,ox+x*s,oy+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints);if(a.includes('optical'))action('build:optical');}
 if(runtime.mode==='branch')action('branch:'+(w.canRefinePhoton()?'photon-reach':'burn'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(w.contract?.status==='active'?aceAim(w,order.value):progressionTarget(w));clock+=1000/60;next(clock);frame++;
 for(const b of w.bodies)if(b.aceRole)guns.set(b.id,b);
 const alive=[...guns.values()].filter(b=>b.active),survivor=alive[0];
 if(stage==='run-started'&&w.round>=2&&w.activeWeapons.some(k=>w.weaponStage(k)>=3)&&w.canAcceptContract('hunter',undefined,'crossfire')){freeze('hunt-ready');return;}
 if(stage==='duo-selected'&&alive.length===2&&alive.every(b=>b.age>=1.6)&&alive.some(b=>b.warning>0)){freeze('duo-charge');return;}
 if(stage==='duo-charge'&&w.contract?.targetKills===1){freeze('partner-down');return;}
 if(stage==='partner-down'&&survivor?.aceEnraged&&survivor.warning>0){freeze('revenge-charge');return;}
 if(stage==='revenge-charge'&&(survivor?.aceRageShots??0)>=5){freeze('revenge-fired');return;}
 if(runtime.mode==='contract-reward'){freeze('reward-ready');return;}
 if(w.time>210||['result','error'].includes(runtime.mode)||w.contract?.status==='failed'){freeze('failed');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<360&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};weak.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__aceDuoEvidence',{value:()=>({history,current:snapshot(),saved:structuredClone(stored),physical:JSON.parse(JSON.stringify(runtime.world,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v))})});await runtime.load();report();
