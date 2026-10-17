export const COMBAT_COPY_WIDTH=560;
export type CopyMeasure=(text:string,size:number,bold:boolean)=>number;
export interface CombatCopy {titleFont:number;titleWidth:number;detailFont:number;lines:string[];widths:number[]}
/** Two balanced lines inside the existing panel. Prefer phrase boundaries;
 * retain every character and every number, without ellipsis or horizontal scaling. */
export function combatCopy(title:string,detail:string,bottom:boolean,measure:CopyMeasure):CombatCopy{
 const width=COMBAT_COPY_WIDTH,base=bottom?28:30;
 const titleFont=Math.min(base,base*width/Math.max(width,measure(title,base,true)));
 const single=bottom?22:23;
 if(!detail||measure(detail,single,false)<=width)return{titleFont,titleWidth:measure(title,titleFont,true),detailFont:single,lines:detail?[detail]:[],widths:detail?[measure(detail,single,false)]:[]};
 const chars=Array.from(detail);
 for(let font=single;font>=1;font--){
  let best:{lines:string[];widths:number[];cost:number}|undefined;
  for(let i=1;i<chars.length;i++){
   const a=chars.slice(0,i).join(''),b=chars.slice(i).join(''),wa=measure(a,font,false),wb=measure(b,font,false);
   if(Math.max(wa,wb)>width)continue;
   const boundary=/[ ·，；]/u.test(chars[i-1])&&!/[ ·，；]/u.test(chars[i]);
   const cost=Math.abs(wa-wb)+(boundary?0:width*2);
   if(!best||cost<best.cost)best={lines:[a,b],widths:[wa,wb],cost};
  }
  if(best)return{titleFont,titleWidth:measure(title,titleFont,true),detailFont:font,lines:best.lines,widths:best.widths};
 }
 // Pathological non-game copy still remains complete and bounded.
 const at=Math.max(1,Math.floor(chars.length/2)),lines=[chars.slice(0,at).join(''),chars.slice(at).join('')];
 const font=width/Math.max(1,...lines.map(s=>measure(s,1,false)));
 return{titleFont,titleWidth:measure(title,titleFont,true),detailFont:font,lines,widths:lines.map(s=>measure(s,font,false))};
}
