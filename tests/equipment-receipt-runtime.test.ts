import {it,expect} from 'vitest';
import {CanvasRuntime} from '../src/game/canvas-runtime';
import {defaults} from '../src/ui/storage';
import {C} from '../src/core/config';
async function setup(){
 let clock=1000,next=(_t:number)=>{};const text:string[]=[];
 const ctx=new Proxy({}, {get(_t,k){if(k==='measureText')return(s:string)=>({width:s.length*20});if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});return (...args:unknown[])=>{if(k==='fillText')text.push(String(args[0]));};},set(){return true;}}) as CanvasRenderingContext2D;
 const r=new CanvasRuntime({canvas:{getContext:()=>ctx} as unknown as HTMLCanvasElement,width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}) as HTMLImageElement,read:defaults,write(){},sound(){},silence(){},now:()=>clock,requestFrame:f=>{next=f;}});await r.load();r.start();Object.assign(r.world,{scheduled:[]});
 return {r,text,frame(){text.length=0;clock+=1000/60;next(clock);},advance(n:number){for(let i=0;i<n;i++){text.length=0;clock+=1000/60;next(clock);}}};
}
it('first real pickup retains its actual upgrade receipt across the simultaneous research choice and skill feedback',async()=>{
 const h=await setup(),{r}=h,p=r.world.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';h.frame();
 expect(r.mode).toBe('choice');expect(r.diagnostics().equipmentReceipts).toHaveLength(1);expect(chooseTechnology(r,'optical')).toBe(true);expect(r.mode).toBe('playing');
 expect(h.text.some(t=>t==='配件强化 · 聚焦镜组')).toBe(true);let seen=false;
 for(let i=0;i<600;i++){h.frame();if(h.text.some(t=>t.startsWith('速射炮 T1→T2'))){seen=true;break;}}
 expect(seen).toBe(true);expect(h.text.some(t=>t.startsWith('领取时常态全弹直伤/秒'))).toBe(true);expect(r.diagnostics().equipmentReceipt?.equipment?.after.stage).toBe(2);
});
it('a current equipment receipt merges a rapid second upgrade and survives pause, while restart clears it',async()=>{
 const h=await setup(),{r}=h;r.world.phase='recovery';const p=r.world.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';h.frame();chooseTechnology(r,'optical');h.advance(250);
 const p2=r.world.spawn('pickup',360,C.playerY,3);p2.weaponKind='pulse';h.frame();expect(r.diagnostics().equipmentReceipt?.equipment?.before?.stage).toBe(1);expect(r.diagnostics().equipmentReceipt?.equipment?.after.stage).toBe(3);
 const {hidden:_hidden,...before}=r.diagnostics().equipmentReceipt!,time=r.world.time;r.pause();h.advance(180);expect(r.world.time).toBe(time);const {hidden:_afterHidden,...after}=r.diagnostics().equipmentReceipt!;expect(after).toEqual(before);
 r.start();expect(r.diagnostics().equipmentReceipt).toBeNull();expect(r.diagnostics().equipmentReceipts).toHaveLength(0);
});
it('a new module shows zero-to-owned firepower even when a research message arrives in the same step',async()=>{
 const h=await setup(),{r}=h,p=r.world.spawn('pickup',360,C.playerY,2);p.weaponKind='scatter';h.frame();expect(r.mode).toBe('choice');chooseTechnology(r,'optical');let seen=false;
 for(let i=0;i<600;i++){h.frame();if(h.text.some(t=>t.startsWith('新增霰射炮 T2'))){seen=true;break;}}
 expect(seen).toBe(true);expect(h.text.some(t=>t.startsWith('领取时常态全弹直伤/秒 0 →'))).toBe(true);expect(r.world.activeWeapons).toEqual(['pulse','scatter']);
});

it('actual boss and contract equipment claims enqueue the chosen component exactly once',async()=>{
 for(const source of ['boss','contract']){
  const h=await setup(),{r}=h;
  if(source==='boss'){
   r.world.phase='boss';const b=r.world.spawn('boss',360,C.bossY);b.hp=1;
   r.world.bullets.push({id:99999,x:360,y:C.bossY,px:360,py:C.bossY,vx:0,vy:0,damage:10,age:0,active:true,hostile:false});h.frame();h.advance(145);expect(r.mode).toBe('boss-reward');
  }else{
   expect(r.world.acceptContract('precision')).toBe(true);r.world.contract!.elapsed=29.99;r.world.kills=15;h.frame();expect(r.mode).toBe('contract-reward');
  }
  expect(r.activateControl(source+'-claim:pulse')).toBe(true);expect(r.activateControl(source+'-claim:pulse')).toBe(false);
  const receipt=r.diagnostics().equipmentReceipt;expect(receipt?.equipment?.before?.stage).toBe(1);expect(receipt?.equipment?.after.stage).toBe(2);expect(r.world.weaponStage('pulse')).toBe(2);
 }
});

it('a real encounter notice temporarily wins the reading area, then the equipment receipt resumes with time left',async()=>{
 const h=await setup(),{r}=h,p=r.world.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';h.frame();chooseTechnology(r,'optical');
 for(let i=0;i<300&&!r.diagnostics().equipmentReceipt;i++)h.frame();expect(r.diagnostics().equipmentReceipt).not.toBeNull();
 const title=r.diagnostics().equipmentReceipt!.title;
 Object.assign(r.world,{scheduled:[{at:r.world.roundTime+.1,kind:'sniper',x:620,pattern:'lockshot',drop:true,dropY:700,dropLabel:'危机入场',dropDetail:'看清实际弹幕'}]});
 for(let i=0;i<15&&!h.text.includes('危机入场');i++)h.frame();expect(h.text).toContain('危机入场');expect(h.text).not.toContain(title);expect(r.diagnostics().equipmentReceipt?.hidden).toBe(true);
 let resumed=false;for(let i=0;i<300;i++){h.frame();if(h.text.includes(title)){resumed=true;break;}}expect(resumed).toBe(true);expect(r.diagnostics().equipmentReceipt!.until-r.world.time).toBeGreaterThan(0);
});

it('upgrade pulse waits through real menu reading and pause, then expires on resumed simulation time',async()=>{
 const h=await setup(),{r}=h,p=r.world.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';h.frame();expect(r.mode).toBe('choice');expect(r.diagnostics().upgradePulseRemaining).toBeCloseTo(.45);
 const time=r.world.time;h.advance(180);expect(r.world.time).toBe(time);expect(r.diagnostics().upgradePulseRemaining).toBeCloseTo(.45);
 expect(chooseTechnology(r,'optical')).toBe(true);h.frame();expect(r.diagnostics().upgradePulseRemaining).toBeGreaterThan(.4);const remaining=r.diagnostics().upgradePulseRemaining;r.pause();h.advance(180);expect(r.diagnostics().upgradePulseRemaining).toBe(remaining);
 expect(r.activateControl('resume')).toBe(true);h.advance(30);expect(r.diagnostics().upgradePulseRemaining).toBe(0);
});

function chooseTechnology(r:import('../src/game/canvas-runtime').CanvasRuntime,route:'ballistic'|'optical'){return r.activateControl('tech-choice:'+route)&&r.activateControl('tech-unlock:'+route+':'+r.world.build.ranks[route]);}
