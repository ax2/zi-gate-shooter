import {C} from '../core/config';import {STORM_REFINEMENT} from '../core/storm-refinement';
/** Actual accumulated direct contacts, never a future enemy trajectory. */
export function stormMarks(c:CanvasRenderingContext2D,x:number,y:number,width:number,hits:number){
 c.save();c.beginPath();c.rect(0,C.playerShotTop,C.width,C.playerY-C.playerShotTop);c.clip();
 c.translate(x-width*.58,y-24);c.lineWidth=1;
 for(let i=0;i<STORM_REFINEMENT.hits;i++){c.fillStyle=i<hits?'#a6ffe2':'#20323c';c.strokeStyle=i<hits?'#ffe1a0':'#768e99';c.fillRect(-5,i*8,6,5);c.strokeRect(-5,i*8,6,5);}
 c.restore();
}
