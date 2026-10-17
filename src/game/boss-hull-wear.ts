import type {Body} from '../core/world';
export function bossWearBand(b:Pick<Body,'hp'|'maxHp'>):0|1|2{
 if(!Number.isFinite(b.hp)||!Number.isFinite(b.maxHp)||b.maxHp<=0)return 0;
 return b.hp/b.maxHp<=.3?2:b.hp/b.maxHp<=.65?1:0;
}
const wounds=[
 [[-73,-24,1,-.32],[80,24,.8,.2],[8,-57,.75,.1],[-42,50,.6,1.3]],
 [[-120,-12,.9,-.3],[100,-28,.8,.3],[54,8,.7,-.4],[-55,-45,.6,.4]],
 [[-120,0,.8,.2],[53,51,1,-.2],[118,-6,.8,-.2],[-51,45,.8,.2]],
] as const;
/** Structural wear over the existing metal sprite, never a weakpoint or death frame.
 * Fixed geometry and simulated age: no particles, randomness or combat mutation. */
export function bossHullWear(c:CanvasRenderingContext2D,b:Pick<Body,'x'|'y'|'hp'|'maxHp'|'bossVariant'|'hit'|'age'>,weak:boolean){
 const band=bossWearBand(b);if(!band)return;
 const marks=wounds[b.bossVariant===1?1:b.bossVariant===2?2:0],flash=Math.max(0,Math.min(1,b.hit/.07));
 c.save();c.translate(b.x,b.y);c.globalCompositeOperation='source-over';
 for(let i=0;i<(band===1?2:4);i++){
  const [x,y,scale,angle]=marks[i];c.save();c.translate(x,y);c.rotate(angle);const size=scale*(band===2?1.3:1.1);c.scale(size,size);
  c.globalAlpha=.88;c.strokeStyle='#080d12';c.lineWidth=7;c.beginPath();c.moveTo(-20,-12);c.lineTo(17,12);c.stroke();
  c.fillStyle='#101820';c.strokeStyle='#526774';c.lineWidth=2;c.beginPath();c.moveTo(-15,-6);c.lineTo(-5,-10);c.lineTo(2,-5);c.lineTo(14,-8);c.lineTo(9,1);c.lineTo(16,5);c.lineTo(2,6);c.lineTo(-4,10);c.lineTo(-16,4);c.lineTo(-10,-1);c.closePath();c.fill();c.stroke();
  c.fillStyle='#7b8e9a';c.beginPath();c.moveTo(2,-5);c.lineTo(14,-8);c.lineTo(9,1);c.lineTo(6,0);c.closePath();c.fill();
  c.strokeStyle='#b5c4cb';c.lineWidth=1.5;c.beginPath();c.moveTo(2,-5);c.lineTo(14,-8);c.lineTo(9,1);c.stroke();
  c.strokeStyle='#36434d';c.beginPath();c.moveTo(-15,-6);c.lineTo(-5,-10);c.lineTo(2,-5);c.stroke();
  if(band===2){c.globalAlpha=.65;c.strokeStyle='#cf753a';c.lineWidth=1;c.beginPath();c.moveTo(-9,-1);c.lineTo(-1,1);c.lineTo(5,-2);c.stroke();}
  if(flash>0){c.globalAlpha=flash*.65;c.strokeStyle='#e4f3fa';c.lineWidth=1;c.beginPath();c.moveTo(-12,-2);c.lineTo(-19,-7);c.moveTo(10,3);c.lineTo(17,7);c.stroke();}
  c.restore();
  if(band===2&&i<2){
   c.save();c.fillStyle='#81919c';for(let j=0;j<(weak?1:2);j++){
    const t=(b.age*.65+j*.5+i*.23)%1;c.globalAlpha=(1-t)*.11;
    c.beginPath();c.arc(x+Math.sin(t*4+i)*5,y-12-t*28,4+t*7,0,Math.PI*2);c.fill();
   }c.restore();
  }
 }
 c.restore();
}
