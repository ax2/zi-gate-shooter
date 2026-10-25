import type{FlightWorld}from'./world';
const sourceMounts=[{x:216,y:570},{x:210,y:570},{x:202,y:570},{x:216,y:540},{x:210,y:540},{x:202,y:540}];
const sourceEmitters=[{x:216,y:152},{x:210,y:123},{x:202,y:80},{x:216,y:112},{x:210,y:110},{x:202,y:74}];
const mapped=(p:{x:number;y:number})=>({x:(53+p.x*149/418)/256,y:(16+p.y*224/627)/256});
/** Complete-cell original mechanical modules, three milestone silhouettes, never extra slots. */
export function mainWeaponAppearance(id:string,level:number){if(id!=='coil'&&id!=='laser'||!Number.isFinite(level)||level<1)return;const tier=level>=5?2:level>=3?1:0,frame=(id==='laser'?3:0)+tier;return{frame,tier,size:54,color:id==='coil'?'#c8a8ef':'#a7f6f2',mount:mapped(sourceMounts[frame]),emitter:mapped(sourceEmitters[frame])};}
/** An actual primary effect owns its flash; enemy support and combinations cannot impersonate it. */
export function mainWeaponActivity(world:FlightWorld,id:string){return world.effects.filter(e=>e.mainWeapon===id&&e.age>=0&&e.age<.13&&e.age<e.life&&!e.hostile&&e.points?.length===2).map(e=>({age:e.age,from:{...e.points![0]}}));}
