import{it,expect}from'vitest';import{arcFilaments,ARC_FILAMENT}from'../src/game/arc-filaments';import{chainArc}from'../src/game/combat-light';
it.each([['electric',false],['electric',true],['seeker',false],['seeker',true],['photon',false],['photon',true]]as const)('keeps settled endpoints and a bounded envelope, style=%s weak=%s',(style,weak)=>{
 for(const [x,y,tx,ty]of[[100,400,460,620],[600,900,150,300],[360,500,362,502],[10,240,700,240]])for(const age of[0,.13,.4,.8,.99]){
 const f=arcFilaments(x,y,tx,ty,.16*(1-age),.16,weak,style)!;expect(f.main.slice(0,2)).toEqual([x,y]);expect(f.main.slice(-2)).toEqual([tx,ty]);expect(f.main.length/2).toBeLessThanOrEqual(ARC_FILAMENT.segments+1);expect(f.forks.length).toBeLessThanOrEqual(weak?0:2);
 const dx=tx-x,dy=ty-y,l=Math.hypot(dx,dy);for(const path of[f.main,...(f.rail?[f.rail]:[])])for(let i=0;i<path.length;i+=2){const xx=path[i]-x,yy=path[i+1]-y,project=(xx*dx+yy*dy)/(l*l),offset=(-xx*dy+yy*dx)/l;expect(project).toBeGreaterThanOrEqual(-1e-8);expect(project).toBeLessThanOrEqual(1+1e-8);expect(Math.abs(offset)).toBeLessThanOrEqual(10+1e-8);}
 for(const fork of f.forks)for(let i=0;i<fork.length;i+=2){const xx=fork[i]-x,yy=fork[i+1]-y;expect((xx*dx+yy*dy)/(l*l)).toBeGreaterThanOrEqual(0);expect((xx*dx+yy*dy)/(l*l)).toBeLessThanOrEqual(1);expect(Math.abs((-xx*dy+yy*dx)/l)).toBeLessThan(37);}
 }
});
it('is deterministic, consumes no random stream, and changes only the current shape during decay',()=>{
 const random=Math.random;Math.random=()=>{throw Error('No randomness allowed');};try{const a=arcFilaments(100,400,460,620,.15,.16,false),b=arcFilaments(100,400,460,620,.15,.16,false),later=arcFilaments(100,400,460,620,.07,.16,false);expect(a).toEqual(b);expect(later!.main).not.toEqual(a!.main);expect(later!.main.slice(0,2)).toEqual(a!.main.slice(0,2));expect(later!.main.slice(-2)).toEqual(a!.main.slice(-2));}finally{Math.random=random;}
});
it('omits dead, degenerate and invalid links rather than inventing a hit',()=>{for(const args of[[100,400,100,400,.1,.16],[NaN,400,200,500,.1,.16],[100,400,200,500,0,.16],[100,400,200,500,.1,0],[100,400,Infinity,500,.1,.16]])expect(arcFilaments(...args as [number,number,number,number,number,number],false)).toBeNull();});
function record(){let state:Record<string,unknown>={globalAlpha:.37,globalCompositeOperation:'source-over',lineWidth:7},stack:Record<string,unknown>[]=[];const calls:{k:string;a:unknown[]}[]=[];const c=new Proxy({}, {get(_t,k){if(String(k)in state)return state[String(k)];return(...a:unknown[])=>{calls.push({k:String(k),a});if(k==='save')stack.push({...state});if(k==='restore'){expect(stack.length).toBeGreaterThan(0);state=stack.pop()!;}for(const n of a)if(typeof n==='number')expect(Number.isFinite(n)).toBe(true);};},set(_t,k,v){state[String(k)]=v;return true;}})as CanvasRenderingContext2D;return{c,calls,check(){expect(stack).toHaveLength(0);expect(state).toEqual({globalAlpha:.37,globalCompositeOperation:'source-over',lineWidth:7});}};}
it.each([[false,false],[false,true],[true,false]])('restores Canvas state, keeps finite strokes and lowers weak draw cost for photon=%s seeker=%s',(photon,seeker)=>{
 const a=record(),b=record();chainArc(a.c,100,400,460,620,.1,false,photon,seeker);chainArc(b.c,100,400,460,620,.1,true,photon,seeker);a.check();b.check();const strokes=(r:ReturnType<typeof record>)=>r.calls.filter(c=>c.k==='stroke').length;expect(strokes(a)).toBeLessThanOrEqual(13);expect(strokes(b)).toBeLessThan(strokes(a));expect(a.calls.some(c=>c.k==='clip')).toBe(true);expect(a.calls.some(c=>c.k==='fillRect')).toBe(false);
});
it('dead links perform no Canvas work',()=>{const r=record();chainArc(r.c,100,400,460,620,0,false);expect(r.calls).toHaveLength(0);r.check();});

it('distinguishes rough electric forks, tight seeking current and a paired optical filament',()=>{
 const args=[100,400,460,620,.1,.16,false]as const;
 const a=arcFilaments(...args,'electric')!,b=arcFilaments(...args,'seeker')!,c=arcFilaments(...args,'photon')!;
 expect(a.forks).toHaveLength(2);expect(b.forks).toHaveLength(1);expect(c.forks).toHaveLength(0);expect(a.rail).toBeNull();expect(b.rail).toBeNull();expect(c.rail?.slice(0,2)).toEqual([100,400]);expect(c.rail?.slice(-2)).toEqual([460,620]);expect(c.main).not.toEqual(a.main);expect(c.rail).not.toEqual(c.main);
 const weak=arcFilaments(100,400,460,620,.1,.16,true,'photon')!;expect(weak.rail).toBeNull();expect(weak.main.slice(0,2)).toEqual(c.main.slice(0,2));expect(weak.main.slice(-2)).toEqual(c.main.slice(-2));
});
