import{World}from'../src/core/world';import{runDefaultPressure}from'../tests/helpers/default-pressure-driver';import{writeFileSync}from'node:fs';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const path='./baseline.mjs',Old=(await import(path)).World;
const rows:any[]=[];const hash=(w:World)=>createHash('sha256').update(JSON.stringify(w,(k,v)=>k==='scheduled'?undefined:v instanceof Map?[...v]:v instanceof Set?[...v]:v)).digest('hex');
for(const route of['ballistic','electric','optical']as const)for(const side of['left','right']as const)for(const policy of['center','edge']as const){
 const pair:any[]=[];
 for(const Runtime of[Old,World]){let window:any=null;
  class Drive extends Runtime{step(dt:number,target:number){const active=this.round===3&&this.roundTime>=27&&this.roundTime<=34;
   if(active&&!window)window={start:this.time,startRoundTime:this.roundTime,beforeHashExcludingFutureSchedule:hash(this),hpBefore:this.player.hp,gatesBefore:this.gatesTaken,damageBefore:this.damageTaken,events:[]};
   const hp=this.player.hp;
   if(active)target=policy==='edge'&&this.roundTime>=30.9?(side==='left'?330:610):(side==='left'?222:498);
   super.step(dt,target);
   if(active&&window){if(this.player.hp<hp)window.events.push({time:this.time,roundTime:this.roundTime,cause:this.lastDamageCause});window.end=this.time;window.endRoundTime=this.roundTime;window.hpAfter=this.player.hp;window.gatesAfter=this.gatesTaken;window.damageAfter=this.damageTaken;window.playerX=this.player.x;}
  }}
  const end=runDefaultPressure(Drive as any,route,'safe',300);assert.ok(window&&window.endRoundTime>=33.99);pair.push({window,end:{hp:end.hp,time:end.time,pickups:end.pickups,gates:end.gates}});
 }
 assert.equal(pair[0].window.beforeHashExcludingFutureSchedule,pair[1].window.beforeHashExcludingFutureSchedule);rows.push({route,side,policy,before:pair[0],after:pair[1]});console.log(JSON.stringify({route,side,policy,before:pair[0].window,after:pair[1].window}));
}
writeFileSync('build/qa/Stage-241/gate-choice.json',JSON.stringify({method:'Normally earned default-plan builds; identical live public state at chapter3/27s except authored future schedule. Scripted center charge vs moving at30.9s to330/610 while still inside the selected gate. No World state injection. Not human reaction or difficulty signoff.',rows},null,2));
