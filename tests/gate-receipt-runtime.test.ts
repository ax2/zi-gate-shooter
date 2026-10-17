import {it,expect} from 'vitest';
import {CanvasRuntime} from '../src/game/canvas-runtime';
import {defaults} from '../src/ui/storage';
import {C} from '../src/core/config';
it('actual crossing grants once while the deferred receipt survives pause and clears on restart',async()=>{
 let clock=0,next=(_t:number)=>{};const text:string[]=[],ctx=new Proxy({}, {get(_t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});return (...a:unknown[])=>{if(k==='fillText')text.push(String(a[0]));};},set(){return true;}}) as CanvasRenderingContext2D;
 const r=new CanvasRuntime({canvas:{getContext:()=>ctx} as unknown as HTMLCanvasElement,width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}) as HTMLImageElement,read:defaults,write(){},sound(){},silence(){},now:()=>clock,requestFrame:f=>next=f});await r.load();r.start();Object.assign(r.world,{scheduled:[]});
 const frame=()=>{text.length=0;clock+=1000/60;next(clock);};
 // Controlled collision/occlusion fixture, not normal-flow or visual proof.
 const gate=r.world.spawn('gate',360,C.playerY-1);gate.energy=144;const blocker=r.world.spawn('drone',360,844);blocker.speed=0;blocker.hp=999999;
 for(let i=0;i<10&&gate.active;i++)frame();expect(gate.active).toBe(false);const bonus=r.world.growth.bonus;expect(bonus).toBeGreaterThan(0);expect(r.diagnostics().gateReceiptDetails).toHaveLength(1);expect(text).not.toContain('穿门已领取');
 const before=r.diagnostics().gateReceiptDetails[0];r.pause();for(let i=0;i<120;i++)frame();expect(r.diagnostics().gateReceiptDetails[0].age).toBe(before.age);expect(r.diagnostics().gateReceiptDetails[0].elapsed).toBe(before.elapsed);expect(text).not.toContain('穿门已领取');
 expect(r.activateControl('resume')).toBe(true);blocker.active=false;for(let i=0;i<10;i++)frame();expect(text).toContain('穿门已领取');expect(r.world.growth.bonus).toBe(bonus);
 r.start();expect(r.diagnostics().gateReceiptDetails).toHaveLength(0);
});
