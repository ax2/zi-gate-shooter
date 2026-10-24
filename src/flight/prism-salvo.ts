/** A real three-pulse attack, never a future trajectory or a tracking beam. */
export interface PrismSalvo{index:number;aim:number;turn:number}
export const prismSalvoRules={pulses:3,step:.34,gap:.34,cycle:4.2,life:.22,width:10,reach:1400}as const;
export function prismSalvo(variant:number,side:number,aim:number):PrismSalvo|undefined{
 if(variant<=0)return;
 return{index:0,aim:Math.max(.42,Math.min(Math.PI-.42,aim)),turn:(variant===1?1:-1)*(side<0?-1:1)};
}
export const prismPulseAngle=(s:PrismSalvo)=>s.aim+(s.index-1)*prismSalvoRules.step*s.turn;
export const prismMuzzle=(at:{x:number;y:number},angle:number)=>({x:at.x+Math.cos(angle)*20,y:at.y+32+Math.sin(angle)*20});
export function prismPulse(s:PrismSalvo,at:{x:number;y:number}){
 const angle=prismPulseAngle(s),from=prismMuzzle(at,angle);
 return{angle,from,end:{x:from.x+Math.cos(angle)*prismSalvoRules.reach,y:from.y+Math.sin(angle)*prismSalvoRules.reach}};
}
