import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const query=new URL(location.href).searchParams,targetRound=Math.max(1,Number(query.get('round'))||1),canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),quality=document.querySelector('#quality'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',beat=0,visible=[];const history=[];stored.openingWeapon='scatter';stored.nextBattlePlan=0;stored.settings.sound=false;stored.settings.shake=false;
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start')freeze('正常开局');else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:(list,placement)=>{visible=list;controls.update(list,placement);},now:()=>clock,requestFrame:cb=>next=cb});
function snapshot(){const w=runtime.world;return{...runtime.diagnostics(),stage,beat,targetRound,fixture:true,worldInjection:false,virtual60Hz:true,omniscientPointer:true,isolatedMemorySave:true,achievements:structuredClone(runtime.save.achievements),physical:JSON.parse(JSON.stringify(w,(_k,v)=>v instanceof Set?[...v]:v instanceof Map?[...v]:v))};}
function report(){advance.disabled=running||runtime.mode!=='playing'||beat>=5;quality.disabled=running;status.textContent=runtime.world.time.toFixed(3)+'秒 / '+stage+' / '+runtime.mode;}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),ox=(canvas.clientWidth-720*s)/2,oy=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==789)runtime.touchStart(789,ox+runtime.world.player.x*s,oy+900*s);runtime.touchMove(789,ox+x*s,oy+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch'){const choices=visible.filter(b=>b.action.startsWith('branch:')),names=['fuse-fragment','storm-relay','fracture-line','ricochet','field-link','ion-orb','seeker','photon-reach','burn'],preferred=names.map(n=>choices.find(b=>b.action==='branch:'+n)).find(Boolean)??choices[0];if(preferred)action(preferred.action);}
 if(runtime.mode==='boss-reward'&&w.round<targetRound)action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w));
 clock+=1000/60;next(clock);frame++;
 const boss=w.bodies.find(b=>b.active&&b.kind==='boss'&&(b.bossVariant??0)===0),shots=w.bullets.filter(p=>p.hostile&&p.sourceId===boss?.id);
 if(w.round===targetRound){
  if(beat===0&&boss?.attack===0&&boss.warning>0){beat=1;freeze('双炮实际蓄能');return;}
  if(beat===1&&(boss?.weaveShots??0)>=2){beat=2;freeze('双炮第一拍实际发射');return;}
  if(beat===2&&(boss?.weaveShots??0)>=6){beat=3;freeze('三拍真实完成');return;}
  if(beat===3&&shots.some(p=>p.y>=800)){beat=4;freeze('交织实弹进入下半场');return;}
  if(runtime.mode==='boss-reward'){beat=5;freeze('首领战利品已出现');return;}
 }

 if(w.time>=900||['error','result'].includes(runtime.mode)){freeze('流程结束');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<120&&running;i++)step();if(running)setTimeout(pump,0);}
advance.onclick=()=>{running=true;report();setTimeout(pump,0);};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));Object.defineProperty(window,'__dangerDartEvidence',{value:()=>({history,current:snapshot()})});await runtime.load();report();
