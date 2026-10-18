import{it,expect}from'vitest';import{createRenderFixture}from'./helpers/render-fixture';
it.each([false,true])('uses the distinct atlas only for interceptors, with no baked all-port charge frame weak=%s',async weak=>{
 for(const pattern of[undefined,'intercept']as const)for(const mode of['charge','fired','offline']as const){
  const f=createRenderFixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;Object.assign(w,{scheduled:[]});w.bodies=[];const b=w.spawn('elite',360,360);b.pattern=pattern;b.warning=.6;if(mode==='fired')b.interceptFiredAt=-.03;if(mode==='offline')b.empRemaining=1;
  f.tick();const key=pattern?'interceptor-v2.png':'elite-v1.png',draws=f.calls.filter(c=>c.kind==='drawImage'&&String(c.args[0]?.src).endsWith('/'+key));expect(draws.length).toBeGreaterThan(0);
  if(pattern)expect(draws.every(c=>c.args[1]!==c.args[0].width/3)).toBe(true);
 }
});
