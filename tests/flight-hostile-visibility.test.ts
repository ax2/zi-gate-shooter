import{it,expect}from'vitest';
import{FlightRuntime}from'../src/flight/runtime';
import{flightCanvas}from'./helpers/flight-canvas';

// Isolated overlapping-round render fixture, not normal-earned gameplay evidence.
it.each([false,true])('all overlapping hostile centers remain above every projectile shell, weak=%s',weak=>{
 const base=flightCanvas([]),circles:{x:number;y:number;r:number;color:string}[]=[];
 const ctx=new Proxy(base,{get(t,k){if(k==='arc')return(x:number,y:number,r:number)=>circles.push({x,y,r,color:t.fillStyle as string});return Reflect.get(t,k);},set(t,k,v){return Reflect.set(t,k,v);}});
 const r=new FlightRuntime({canvas:{width:720,height:1280,getContext:()=>ctx}as unknown as HTMLCanvasElement,image:async()=>({width:720,height:1080})as HTMLImageElement,controls(){},sound(){},now:()=>0,frame(){},readBest:()=>0,writeBest(){}});
 r.weak=weak;r.world.phase='dead';
 const round={id:1,x:532,y:316,px:531,py:313,vx:99,vy:172,damage:1,hostile:true,style:'orb' as const,r:9,age:1/60,life:4.5,bounce:0,pierce:0,hits:new Set<number>(),explosive:false};
 r.world.bullets.push({...round},{...round,id:2,x:529,vx:-99},{...round,id:3,x:532,y:310,vy:-172},{...round,id:4,x:400,y:500,hostile:false});
 const before=structuredClone(r.world.bullets);
 (r as unknown as{combat:()=>void}).combat();
 const centers=r.world.bullets.filter(b=>b.hostile).map(b=>({x:b.x,y:b.y,r:3,color:'#b1ffea'}));
 expect(circles.slice(-centers.length)).toEqual(centers);
 expect(circles.slice(0,-centers.length).some(c=>c.r>9&&c.color==='#07121c')).toBe(true);
 expect(r.world.bullets).toEqual(before);
});
