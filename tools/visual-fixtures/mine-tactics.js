import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const query=new URL(location.href).searchParams,targetRound=Math.max(4,Math.min(6,Number(query.get('round'))||5)),canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),quality=document.querySelector('#quality'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',beat=0,visible=[],carrier=null;const history=[];stored.openingWeapon='scatter';stored.nextBattlePlan=0;stored.settings.sound=false;stored.settings.shake=false;
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start')freeze('正常开局');else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:(list,placement)=>{visible=list;controls.update(list,placement);},now:()=>clock,requestFrame:cb=>next=cb});
function snapshot(){const w=runtime.world;return{...runtime.diagnostics(),stage,beat,targetRound,carrier:carrier?{...carrier}:null,fixture:true,worldInjection:false,virtual60Hz:true,omniscientPointer:true,isolatedMemorySave:true,achievements:structuredClone(runtime.save.achievements),physical:JSON.parse(JSON.stringify(w,(_k,v)=>v instanceof Set?[...v]:v instanceof Map?[...v]:v))};}
function report(){advance.disabled=running||runtime.mode!=='playing'||beat>=4;quality.disabled=running;status.textContent=runtime.world.time.toFixed(3)+'秒 / '+stage+' / '+runtime.mode;}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),ox=(canvas.clientWidth-720*s)/2,oy=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==789)runtime.touchStart(789,ox+runtime.world.player.x*s,oy+900*s);runtime.touchMove(789,ox+x*s,oy+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch'){const choices=visible.filter(b=>b.action.startsWith('branch:')),names=['fuse-fragment','storm-relay','fracture-line','ricochet','field-link','ion-orb','seeker','photon-reach','burn'],preferred=names.map(n=>choices.find(b=>b.action==='branch:'+n)).find(Boolean)??choices[0];if(preferred)action(preferred.action);}
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w));
 clock+=1000/60;next(clock);frame++;
 const gun=w.bodies.find(b=>b.active&&b.pattern==='minelayer');if(w.round===targetRound&&gun&&!carrier)carrier={id:gun.id,seen:w.time};
 if(w.round===targetRound&&carrier){
  const mines=w.bullets.filter(b=>b.hostile&&b.mine&&b.sourceId===carrier.id);
  if(beat===0&&gun&&gun.warning>0){beat=1;freeze('载具真实蓄能');return;}
  const earned=targetRound===5?w.minePreemptWins>0:w.mineCounterWins>0;
  if(earned){beat=4;freeze('战术奖励与成就已结算');return;}
  if(beat===1&&mines.length){beat=2;freeze('实际双雷 · 继续射击避让');return;}
  if(beat===2&&w.pendingMineCounter){beat=3;freeze('载具已破 · 仍需无伤避双雷');return;}
  if(beat===1&&!gun&&!mines.length){beat=4;freeze('载具预拆 · 查看实际战术记录');return;}
 }
 if(w.time>=950||['error','result'].includes(runtime.mode)){freeze('流程结束');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<120&&running;i++)step();if(running)setTimeout(pump,0);}
advance.onclick=()=>{running=true;report();setTimeout(pump,0);};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));Object.defineProperty(window,'__mineTacticEvidence',{value:()=>({history,current:snapshot()})});await runtime.load();report();
