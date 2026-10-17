import{C}from'./config';
/** At the row's crossing time only, use the cockpit collision circle.
 * Decorative guns do not extend reach. Overlapping lips still choose one gate. */
export function gateAtCrossing<T extends{id:number;x:number;width:number}>(gates:readonly T[],x:number):T|undefined{
 let chosen:T|undefined,distance=Infinity;
 for(const gate of gates){
  if(x<gate.x-gate.width/2-C.playerRadius||x>=gate.x+gate.width/2+C.playerRadius)continue;
  const next=Math.abs(x-gate.x);
  if(next<distance||next===distance&&gate.id<(chosen?.id??Infinity)){chosen=gate;distance=next;}
 }
 return chosen;
}
