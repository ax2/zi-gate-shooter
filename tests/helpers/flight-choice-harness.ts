import{FlightRuntime}from'../../src/flight/runtime';
import{flightCanvas}from'./flight-canvas';
import{flightTarget}from'./flight-driver';
import{chooseDefaultDestination}from'./flight-runtime-driver';
import type{CanvasControl}from'../../src/game/canvas-runtime';
/** Actual runtime and 60Hz, full-information pointer, no world or wallet injection. */
export async function flightChoiceHarness(seed=1337,autoAirspace=true){let clock=0,next=(_time:number)=>{},frame=0,aim={x:360,y:1040};let controls:readonly CanvasControl[]=[];const texts:string[]=[],sounds:{type:string;stage:number|undefined}[]=[];
 const r=new FlightRuntime({canvas:{width:390,height:693,getContext:()=>flightCanvas(texts)}as unknown as HTMLCanvasElement,image:async()=>({width:768,height:256})as HTMLImageElement,controls:c=>controls=c,sound:(type,stage)=>sounds.push({type,stage}),now:()=>clock,frame:f=>next=f,readBest:()=>0,writeBest(){},seed:()=>seed});r.resize(390,693,1);await r.load();r.draw();
 return{r,texts,sounds,get controls(){return controls;},tick(input=true,close=false){if(input&&r.mode==='playing'&&frame%6===0){const enemy=close?r.world.enemies.filter(e=>e.hp>0&&e.y>155&&e.y<950).sort((a,b)=>b.y-a.y)[0]:undefined;aim=flightTarget(r.world,enemy?{x:enemy.x,y:Math.min(1198,enemy.y+160)}:undefined);}if(input&&r.mode==='playing'){const s=r.diagnostics().viewport.scale;r.touchStart(1,0,0);r.touchMove(1,(aim.x-r.world.player.x)*s,(aim.y-r.world.player.y)*s);}texts.length=0;clock+=1000/60;next(clock);if(input&&autoAirspace)chooseDefaultDestination(r);frame++;},firstChoice(){for(let i=0;i<90*60&&r.mode==='playing';i++)this.tick();return r.mode==='upgrade';}};
}
