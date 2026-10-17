import type {World} from '../core/world';
import {combatPanelClear} from './build-receipt';

/** Short-lived tactical information yields to the actual battlefield. */
export function combatNoticePosition(w:World,preferredY:number,detail:boolean){
 const locked=w.bodies.some(b=>b.active&&(b.kind==='boss'||b.bountyRound!==undefined));
 const candidates=locked?[1208]:preferredY===1195?[1208,277]:preferredY===277?[277,1208]:[preferredY];
 for(const y of candidates){
  const top=y-31,bottom=top+(detail?(y===1208?94:104):62);
  if(combatPanelClear(w,{left:58,right:662,top,bottom}))return {y,top,bottom};
 }
 return null;
}
