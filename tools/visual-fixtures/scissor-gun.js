import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),quality=document.querySelector('#quality'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',beat=0,visible=[],targetId;const history=[];stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start')stage='正常开局';report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:(list,placement)=>{visible=list;controls.update(list,placement);},now:()=>clock,requestFrame:cb=>next=cb});
function snapshot(){const w=runtime.world;return{...runtime.diagnostics(),stage,beat,targetId,fixture:true,worldInjection:false,virtual60Hz:true,omniscientPointer:true,view:{width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio},policy:'正常成长，第二章炮出现后先瞄另一翼，双管发射后抢拆',isolatedMemorySave:true,scissorBullets:w.bullets.filter(b=>b.hostile&&b.sourceId===targetId).map(b=>({...b})),physical:JSON.parse(JSON.stringify(w,(_k,v)=>v instanceof Set?[...v]:v instanceof Map?[...v]:v))};}
function report(){advance.disabled=running||runtime.mode!=='playing'||beat>=5;quality.disabled=running;status.textContent=`${runtime.world.time.toFixed(3)}秒 / ${runtime.world.round}章 / ${stage} / ${runtime.mode}`;if(!running)document.querySelector('#evidence').textContent=JSON.stringify({history,current:snapshot()});}
function freeze(s){running=false;stage=s;history.push(snapshot());report();document.querySelector('#evidence').textContent=JSON.stringify({history,current:snapshot()});}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),ox=(canvas.clientWidth-720*s)/2,oy=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==789)runtime.touchStart(789,ox+runtime.world.player.x*s,oy+900*s);runtime.touchMove(789,ox+x*s,oy+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('optical')?'optical':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch'){const choices=visible.filter(b=>b.action.startsWith('branch:')),names=['fuse-fragment','storm-relay','fracture-line','ricochet','field-link','ion-orb','seeker','photon-reach','burn'],preferred=names.map(n=>choices.find(b=>b.action==='branch:'+n)).find(Boolean)??choices[0];if(preferred)action(preferred.action);}
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 const gun=w.bodies.find(b=>b.active&&b.pattern==='scissor');
 if(gun&&targetId===undefined)targetId=gun.id;
 const target=w.bodies.find(b=>b.active&&b.id===targetId);
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w,undefined,target?(beat<3?720-target.x:target.x):undefined));clock+=1000/60;next(clock);frame++;
 const current=w.bodies.find(b=>b.active&&b.id===targetId),shots=current?.scissorShots??0;
 if(beat===0&&current?.warning>0&&current.timer<.46){beat=1;freeze('真实剪刀炮蓄能');return;}
 if(targetId!==undefined&&!current&&beat<3){beat=5;freeze('重炮被提前击破，本次没有完整发射');return;}
 if(beat===1&&shots>=3){beat=2;freeze('左管实弹：交叉入场');return;}
 if(beat===2&&shots>=6){beat=3;freeze('右管接射：双线交叉');return;}
 if(beat===3&&w.bullets.some(p=>p.hostile&&p.sourceId===targetId&&p.y>=790)){beat=4;freeze('交叉实弹接近：已恢复抢拆瞄准');return;}
 if(beat===4&&!current){beat=5;freeze('重炮击破，已发实弹继续');return;}
 if(w.time>=600||['error','result'].includes(runtime.mode)){freeze('流程结束');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<120&&running;i++)step();if(running)setTimeout(pump,0);}
advance.onclick=()=>{running=true;report();setTimeout(pump,0);};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();document.querySelector('#evidence').textContent=JSON.stringify({history,current:snapshot()});};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));Object.defineProperty(window,'__scissorEvidence',{value:()=>({history,current:snapshot()})});document.querySelector('#phone').onclick=()=>{const phone=canvas.style.width!=='390px';canvas.style.width=phone?'390px':'100vw';canvas.style.height=phone?'693px':'calc(100vh - 82px)';canvas.style.margin='0 auto';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();document.querySelector('#evidence').textContent=JSON.stringify({history,current:snapshot()});};await runtime.load();report();
