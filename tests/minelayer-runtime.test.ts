import{it,expect}from'vitest';import{createRenderFixture}from'./helpers/render-fixture';import{combatPanelClear}from'../src/game/build-receipt';
it.each([false,true])('renders original carrier/mine cells after effects and reserves the whole mine envelope for readable panels (weak=%s)',async weak=>{
 const f=createRenderFixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;Object.assign(w,{scheduled:[],secondChance:true,shoot(){}});const carrier=w.spawn('armor',360,350);carrier.pattern='minelayer';carrier.timer=.1;
 w.bullets.push({id:990000,x:30,y:300,px:30,py:300,vx:0,vy:0,age:0,damage:1,hostile:true,active:true,mine:true});f.tick();expect(combatPanelClear(w,{left:58,right:80,top:240,bottom:344})).toBe(false);
 const calls=f.calls.filter(c=>c.kind==='drawImage'&&c.args[0]?.src?.includes('minelayer-v1.png'));expect(calls.some(c=>c.args[2]===0)).toBe(true);expect(calls.some(c=>c.args[2]===256)).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('布雷'))).toBe(true);
});
