/** Optional early side components. Base weapons and their timing stay intact. */
export const componentPairs=[['hive','needles'],['seekorb','electrodes'],['tracker','blades']];
export const componentIds=componentPairs.flat();
export const componentRules={hive:{interval:1.1,damage:6,speed:780},needles:{interval:1.5,damage:17,speed:1400,pierce:3},seekorb:{interval:1.6,damage:14,speed:280,turn:2.8,life:4,range:520,chainDamage:7,chainRange:220},electrodes:{interval:1.1,damage:17,range:240,radius:78,intercept:90},tracker:{interval:1.2,damage:28,range:850},blades:{interval:.5,damage:24,radius:230}}as const;
export function electrodePorts(at:{x:number;y:number},time:number){return[-1,1].map(side=>{const angle=time*1.8+(side<0?Math.PI:0);return{x:at.x+Math.cos(angle)*componentRules.electrodes.radius,y:at.y+Math.sin(angle)*componentRules.electrodes.radius*.6};});}
export function bladeEnds(at:{x:number;y:number},time:number){return[0,1,2].map(i=>({x:at.x+Math.cos(time*2.4+i*Math.PI*2/3)*componentRules.blades.radius,y:at.y+Math.sin(time*2.4+i*Math.PI*2/3)*componentRules.blades.radius}));}
