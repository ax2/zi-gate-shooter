import{it,expect}from'vitest';import{createRenderFixture}from'./helpers/render-fixture';
it.each([false,true])('keeps actual boss tactical state visible while an upgrade receipt is active weak=%s',async weak=>{
 const f=createRenderFixture(weak);await f.runtime.load();f.runtime.start();const r=f.runtime as any,w=r.world;w.round=5;w.phase='boss';const b=w.spawn('boss',360,360);b.bossReserveAt=4;
 r.setBuildFeedback({title:'配件强化',detail:'激光伤害提升',until:100,combo:false});
 const check=(label:string)=>{const before=JSON.stringify(w);f.calls.length=0;r.render(0);expect(JSON.stringify(w)).toBe(before);expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('破甲 0/4 · 每段充能+20 · '+label))).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='配件强化')).toBe(true);};
 check('回援准备');b.bossReserveSpent=true;b.bossReserveSpawns=2;const troops=[w.spawn('sniper',160,320),w.spawn('sniper',560,320)];for(const t of troops)t.bossReserve=true;
 check('双哨回援×2');troops[0].active=false;check('双哨回援×1');troops[1].active=false;check('反扑结束');
});
