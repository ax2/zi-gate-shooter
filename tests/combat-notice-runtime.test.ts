import{it,expect}from'vitest';import{CanvasRuntime}from'../src/game/canvas-runtime';import{defaults}from'../src/ui/storage';
async function setup(){let clock=1000;const text:string[]=[];const ctx=new Proxy({}, {get(_t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});return(...a:unknown[])=>{if(k==='fillText')text.push(String(a[0]));};},set(){return true;}})as CanvasRenderingContext2D;
 const r=new CanvasRuntime({canvas:{getContext:()=>ctx}as unknown as HTMLCanvasElement,width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512})as HTMLImageElement,read:defaults,write(){},sound(){},silence(){},now:()=>clock,requestFrame(){}});await r.load();r.start();Object.assign(r.world,{scheduled:[]});
 return{r,text,render(){text.length=0;r.resize(390,844,1);},advance(ms:number){clock+=ms;},notify(){(r as any).notify('增援到达',1195,'留意实际实弹');}};
}
it('actual renderer relocates a notice above a passing module; both blocked areas hide it and expiry never restarts',async()=>{
 const h=await setup(),{r}=h;h.notify();const p=r.world.spawn('pickup',360,1200,2);h.render();expect(h.text).toContain('增援到达');expect(r.diagnostics().combatNotice?.y).toBe(277);expect(h.text).not.toContain('拾取 T2');
 const a=r.world.spawn('drone',360,300);const before=JSON.stringify(r.world);h.render();expect(h.text).not.toContain('增援到达');expect(r.diagnostics().combatNotice).toBeNull();expect(JSON.stringify(r.world)).toBe(before);h.advance(1000);a.active=false;h.render();expect(h.text).toContain('增援到达');h.advance(1201);p.active=false;h.render();expect(r.diagnostics().combatNotice).toBeNull();expect(h.text).not.toContain('增援到达');
});
it('renders the urgent module without granting it, removes stale advice, and clears notices on restart',async()=>{
 const h=await setup(),{r}=h,p=r.world.spawn('pickup',120,900,2);h.render();expect(h.text).toContain('快拾取 T2');expect(r.world.pickups).toBe(0);p.y=1076.001;h.render();expect(h.text.some(t=>t.includes('拾取 T2'))).toBe(false);h.notify();h.render();expect(r.diagnostics().combatNotice).not.toBeNull();r.start();h.render();expect(r.diagnostics().combatNotice).toBeNull();
});
it('hides tactical notices during pause without exposing a new time window on resume',async()=>{
 const h=await setup();h.notify();h.render();expect(h.r.diagnostics().combatNotice).not.toBeNull();h.r.pause();h.advance(3000);h.render();expect(h.r.diagnostics().combatNotice).toBeNull();expect(h.r.activateControl('resume')).toBe(true);h.render();expect(h.r.diagnostics().combatNotice).toBeNull();
});

it('an earned badge yields to a real projectile and keeps time for reading after the area clears',async()=>{
 const h=await setup(),{r}=h;Object.assign(r,{achievementToast:'测试勋章',achievementUntil:4});
 const b={id:999,x:360,y:1190,px:360,py:1190,vx:0,vy:0,age:0,damage:1,active:true,hostile:true};r.world.bullets.push(b);h.render();expect(h.text).not.toContain('成就达成 · 测试勋章');r.world.time=3.5;h.render();expect((r as any).achievementUntil).toBeGreaterThanOrEqual(6.5);b.active=false;h.render();expect(h.text).toContain('成就达成 · 测试勋章');
});
