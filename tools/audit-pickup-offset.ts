import{World}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'../tests/helpers/progression-driver';import{writeFileSync}from'node:fs';
const file='./baseline.mjs',old=(await import(file)).World;const results=[];
for(const Runtime of[old,World]){const w=new Runtime(1337,1,'scatter'),samples:any[]=[];let pickup:any=null,hold:number|undefined;for(let f=0;f<16*60;f++){
 if(!pickup)pickup=w.bodies.find((b:any)=>b.active&&b.kind==='pickup'&&b.weaponKind==='scatter'&&b.y>=700)??null;
 if(pickup&&hold===undefined)hold=Math.min(C.maxX,pickup.x+90);
 const available=w.build.available(w.buildPoints),route=available.includes('electric')?'electric':available[0];if(route)w.chooseBuild(route);
 w.step(C.step,hold??progressionTarget(w));w.drainEffects();if(pickup&&(f%6===0||w.lastEquipmentPickup?.id===pickup.id))samples.push({time:w.time,playerX:w.player.x,x:pickup.x,y:pickup.y,active:pickup.active,pickups:w.pickups,last:w.lastEquipmentPickup??null});
 }results.push({baseline:Runtime===old,time:w.time,hp:w.player.hp,pickups:w.pickups,stage:w.growth.stage,activeWeapons:w.activeWeapons,cratesBroken:w.cratesBroken,hold,samples});}
writeFileSync('build/qa/Stage-244/normal-offset.json',JSON.stringify({method:'Normal earned first crate and loot; from y700 hold90px to its right, no World injection;virtual60Hz,not human or device performance',results},null,2));console.log(JSON.stringify(results.map(({samples,...r})=>r)));
