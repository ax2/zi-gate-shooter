import {it,expect} from 'vitest';import {CanvasRuntime} from '../src/game/canvas-runtime';import {defaults} from '../src/ui/storage';import {C} from '../src/core/config';
it('a hidden earned receipt permits the actual new encounter notice, then resumes its own readable feedback',async()=>{
 let clock=1000,next=(_t:number)=>{};const text:string[]=[];
 const ctx=new Proxy({}, {get(_t,k){return (...args:unknown[])=>{if(k==='fillText')text.push(String(args[0]));};},set(){return true;}}) as CanvasRenderingContext2D;
 const r=new CanvasRuntime({canvas:{getContext:()=>ctx} as unknown as HTMLCanvasElement,width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}) as HTMLImageElement,read:defaults,write(){},sound(){},silence(){},now:()=>clock,requestFrame:f=>{next=f;}});await r.load();r.start();
 Object.assign(r.world,{scheduled:[{at:.3,kind:'sniper',x:540,pattern:'lockshot',drop:true,dropY:360,dropLabel:'斜射哨机',dropDetail:'入场锁位'}]});const p=r.world.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';p.speed=0;
 const frame=()=>{text.length=0;clock+=17;next(clock);};frame();expect(r.mode).toBe('choice');expect(r.activateControl('build:optical')).toBe(true);expect(r.mode).toBe('playing');
 while(r.world.time<.5)frame();expect(text).toContain('斜射哨机');expect(text.some(t=>t.startsWith('配件强化'))).toBe(false);
 const gun=r.world.bodies.find(b=>b.active&&b.pattern==='lockshot')!;while((gun.dropGrace??0)>0)frame();r.world.bullets.push({id:99999,x:gun.x,y:gun.y,px:gun.x,py:gun.y,vx:0,vy:0,damage:10000,age:0,active:true,hostile:false});frame();expect(gun.active).toBe(false);for(let i=0;i<6&&!text.includes('配件强化 · 聚焦镜组');i++)frame();
 expect(text.some(t=>t==='配件强化 · 聚焦镜组')).toBe(true);expect(r.world.supportProfile().laserUnlocked).toBe(true);
});
