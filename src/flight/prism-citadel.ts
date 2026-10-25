/** A moving finite-shield objective. Geometry is current physical position, never a predicted shot. */
export const citadelRules={relays:3,coreHP:260,shield:540,relayHP:50,coreRadius:48,relayRadius:24,orbitX:115,orbitY:72,rotation:.62,entrySpeed:140,hold:18,exitSpeed:195,interval:2.4,spread:.16,shotSpeed:245,warmup:1.5,score:40,coins:60,receipt:3.5}as const;
export interface CitadelEnemy{role:'core'|'relay';parent:number;index:number}
export interface CitadelState{nodes:number[];broken:number[];shieldStart:number;shieldRemoved:number;volleys:number;shots:number}
export function citadelPose(age:number){const entry=480/citadelRules.entrySpeed,t=Math.max(0,age-entry);return{x:360+Math.sin(t*.48)*125,y:age<entry?-180+age*citadelRules.entrySpeed:300+Math.sin(t*.7)*22+Math.max(0,age-citadelRules.hold)*citadelRules.exitSpeed};}
export function citadelRelayPose(core:{x:number;y:number;age:number},index:number){const angle=index*Math.PI*2/3+core.age*citadelRules.rotation;return{x:core.x+Math.cos(angle)*citadelRules.orbitX,y:core.y+Math.sin(angle)*citadelRules.orbitY};}
export function citadelMuzzle(at:{x:number;y:number},target:{x:number;y:number}){const angle=Math.atan2(target.y-at.y,target.x-at.x);return{x:at.x+Math.cos(angle)*24,y:at.y+Math.sin(angle)*24,angle};}
