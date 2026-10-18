import type{Body}from'../core/world';import{C}from'../core/config';
/** Use occupied enemy art and local status only, never forecast flight paths. */
export function cratePanel(crate:Pick<Body,'x'|'y'>,hudBottom:number,bodies:readonly Body[]){
 const blocked=(y:number,height:number)=>bodies.some(b=>b.active&&b.kind in C.enemies&&Math.abs(crate.x-b.x)<118+Math.max(80,b.width*.84)&&y<b.y+Math.max(84,b.height*.68)&&y+height>b.y-Math.max(84,b.height*.68)-48);
 const normal=crate.y-158>=hudBottom?crate.y-158:Math.max(hudBottom,crate.y+70);
 if(!blocked(normal,100))return{y:normal,compact:false,opaque:true};
 const candidates=[crate.y-100,Math.max(hudBottom,crate.y+70)].filter(y=>y>=hudBottom);
 const clear=candidates.find(y=>!blocked(y,48));
 return{y:clear??candidates[0]??hudBottom,compact:true,opaque:clear!==undefined};
}
