import{FlightWorld,F}from'../../src/flight/world';
import{CareerLedger}from'../../src/flight/records';
import{flightTarget,flightChoice,flightGoal,flightOrders,type FlightRoute}from'./flight-driver';
/** Normal starts, input and earned assembly only. Ledger input comes from real World facts. */
export function flightRecordsRun(Runtime:typeof FlightWorld=FlightWorld,route:FlightRoute='electric',seed=1337,seconds=300,raw:unknown=null){const w=new Runtime(seed),ledger=new CareerLedger(raw);w.start(flightOrders[route][0]);ledger.beginRun();let aim={x:360,y:1040},state='';const history:unknown[]=[],upgrades:unknown[]=[],medals:unknown[]=[];let firstTrial:unknown;const max={enemies:0,hostile:0,loot:0,effects:0};
 for(let f=0;f<seconds*60&&w.phase!=='dead';f++){
  if(f%6===0){aim=flightTarget(w);const id=flightChoice(w,route);if(id){w.install(id);upgrades.push({time:w.time,id});}w.target=flightGoal(w,route);}
  w.step(F.step,aim.x,aim.y);w.drainEvents();for(const id of ledger.sync(w.careerFacts?.()??{kills:w.kills,bossKills:w.bossKills,score:w.score,keystoneWins:[]}))medals.push({id,time:w.time});
  const now=JSON.stringify(w.trial??null);if(now!==state){state=now;history.push({time:w.time,...w.trial,inventory:{...w.assembly.inventory},loot:w.loot.map(l=>({...l}))});if(w.trial?.completed&&!firstTrial)firstTrial={time:w.time,...w.trial};}
  max.enemies=Math.max(max.enemies,w.enemies.length);max.hostile=Math.max(max.hostile,w.bullets.filter(b=>b.hostile).length);max.loot=Math.max(max.loot,w.loot.length);max.effects=Math.max(max.effects,w.effects.length);
 }
 return{route,seed,requested:seconds,world:w.diagnostics(),career:ledger.data,history,firstTrial,upgrades,medals,max,method:'Normal earned run, virtual60Hz, omniscient2D test pointer; no HP, enemies or components injected'};
}
