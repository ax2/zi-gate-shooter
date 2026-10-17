import{it,expect}from'vitest';import{World}from'../src/core/world';import{aceRig}from'../src/game/ace-rig';
it.each(['fan','needle']as const)('%s hardware stays local and balanced, does not change the enemy and weak mode keeps the same metal silhouette',role=>{
 const w=new World(),b=w.spawn('elite',220,500);b.aceRole=role;b.age=3;b.aceFiredAt=2.95;b.warning=1;
 for(const rage of[false,true]){b.aceEnraged=rage;const before=JSON.stringify(b),counts=[];
  for(const weak of[false,true]){let depth=0;const calls:any[]=[];const c=new Proxy({}, {get(_t,k){return(...a:any[])=>{if(k==='save')depth++;if(k==='restore')depth--;for(const n of a)if(typeof n==='number')expect(Number.isFinite(n)).toBe(true);if(['moveTo','lineTo','fillRect'].includes(String(k))){expect(Math.abs(a[0])).toBeLessThan(90);expect(Math.abs(a[1])).toBeLessThan(100);}calls.push([k,...a]);};},set(){return true;}})as CanvasRenderingContext2D;
   aceRig(c,b,weak);expect(depth).toBe(0);expect(JSON.stringify(b)).toBe(before);counts.push(calls.filter(c=>c[0]==='fillRect').length);
  }expect(counts[1]).toBe(counts[0]);
 }
});
