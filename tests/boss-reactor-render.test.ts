import{it,expect}from'vitest';import{createRenderFixture}from'./helpers/render-fixture';import{C}from'../src/core/config';
it.each([false,true])('uses all six reactor cells inside the shared four-blast budget, beneath projectiles and HUD weak=%s',async weak=>{
 const f=createRenderFixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.phase='boss';const boss=w.spawn('boss',360,C.bossY);boss.hp=4;w.bullets.push({id:9999,x:360,y:360,px:360,py:360,vx:0,vy:0,damage:4,age:0,active:true,hostile:false});f.tick();
 const cells=new Set<string>();let foregroundChecked=false;
 // A harmless edge shot probes rendering order; it is not an actual leftover
 // from normal boss victory, which intentionally clears hostile bullets.
 w.bullets.push({id:9998,x:690,y:900,px:690,py:900,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});
 for(let i=0;i<90;i++){f.tick();const reactor=f.calls.filter(c=>c.kind==='drawImage'&&c.args[0].src.endsWith('boss-reactor-v1.png'));for(const c of reactor){cells.add(c.args[1]+':'+c.args[2]);expect(c.args.slice(3,5)).toEqual([256,256]);expect(c.args.slice(7,9)).toEqual([400,400]);expect(c.alpha).toBeLessThanOrEqual(weak?.55:.9);}
  expect((f.runtime as any).blasts.length).toBeLessThanOrEqual(4);
  if(reactor.length){const at=f.calls.indexOf(reactor[0]),shot=f.calls.findIndex(c=>c.kind==='translate'&&c.args[0]===690&&c.args[1]===900),hud=f.calls.findIndex(c=>c.kind==='fillText'&&c.args[0]==='分数');expect(shot).toBeGreaterThan(at);expect(hud).toBeGreaterThan(at);foregroundChecked=true;}
 }
 expect(cells).toEqual(new Set(['0:0','256:0','512:0','0:256','256:256','512:256']));expect(foregroundChecked).toBe(true);expect(w.bossWins).toBe(1);expect(w.player.hp).toBe(3);expect(f.runtime.diagnostics().bossDestructionAge).toBeNull();
});
