/** Neutral, non-solid recovery objects. Progress follows the simulation clock only. */
export const salvageRules={count:3,radius:105,hold:1.6,drift:18,duration:22,coins:8,bonus:48,receipt:3.5}as const;
export interface SalvageNode{x:number;y:number;held:number;captured:boolean;issued:boolean;capturedAt?:number;rewardId?:number}
export interface SalvageState{nodes:SalvageNode[]}
export function createSalvage(roll:number):SalvageState{const flip=roll<.5?-1:1;return{nodes:[[170,340],[550,490],[340,700]].map(([x,y],i)=>({x:360+(x-360)*flip+Math.sin((roll+i)*17)*30,y:y+Math.sin((roll+i)*23)*22,held:0,captured:false,issued:false}))};}
/** New overlap earns time. Leaving pauses progress; there is no hidden decay. */
export function advanceSalvage(state:SalvageState,dt:number,time:number,player:{x:number;y:number}){const captured:number[]=[];for(const[i,n]of state.nodes.entries()){if(n.captured)continue;n.y=Math.min(1155,n.y+salvageRules.drift*dt);if(Math.hypot(player.x-n.x,player.y-n.y)<=salvageRules.radius){n.held=Math.min(salvageRules.hold,n.held+dt);if(n.held>=salvageRules.hold-1e-9){n.held=salvageRules.hold;n.captured=true;n.capturedAt=time;captured.push(i);}}}return captured;}
