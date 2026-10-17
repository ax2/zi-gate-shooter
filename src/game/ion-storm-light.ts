import type {IonAugment} from '../core/ion-storm';
import {C} from '../core/config';
export function ionChargeLight(c:CanvasRenderingContext2D,x:number,y:number,hits:number,augment?:IonAugment){
  c.save();c.translate(x,y);c.lineWidth=3;
  for(let i=0;i<6;i++){c.strokeStyle=i<hits?'#b3ffe2':'#263d45';c.beginPath();c.arc(0,0,25,-Math.PI+i*Math.PI/3,-Math.PI+(i+.65)*Math.PI/3);c.stroke();}
  if(augment){
    c.fillStyle='#162f3c';c.strokeStyle='#b3e8ed';c.lineWidth=2;
    for(const side of [-1,1]){
      c.beginPath();c.moveTo(side*22,18);c.lineTo(side*36,10);c.lineTo(side*34,-20);c.lineTo(side*24,-30);c.closePath();c.fill();c.stroke();
      c.strokeStyle=augment==='ion-orb'?'#a1ffe5':'#bdd6ff';c.beginPath();c.moveTo(side*29,4);c.lineTo(side*(augment==='ion-orb'?29:38),-22);c.stroke();
    }
  }
  c.restore();
}
/** A brief central strike opens into conducting side arcs and a broken corona. */
export function ionStormLight(c:CanvasRenderingContext2D,x:number,y:number,radius:number,age:number,weak:boolean){
  if(age<0||age>=1)return;
  c.save();c.beginPath();c.rect(0,C.playerShotTop,C.width,C.playerY-C.playerShotTop);c.clip();
  c.translate(x,y);c.globalCompositeOperation='source-over';c.globalAlpha=(1-age)*(weak?.65:.9);c.lineCap='round';
  const r=radius*(.25+.75*age);
  for(let layer=0;layer<(weak?1:3);layer++){
    const size=r*(1-layer*.18),turn=age*(layer%2?-2:2)+layer;
    c.strokeStyle=layer===1?'#b6f6ff':'#7dffd9';c.lineWidth=layer===0&&!weak?4:1.5;
    for(let sector=0;sector<3;sector++){
      const start=turn+sector*Math.PI*2/3;c.beginPath();
      for(let j=0;j<=10;j++){
        const a=start+j*.13,rr=size*(j%2?.95:1.04),px=Math.cos(a)*rr,py=Math.sin(a)*rr;
        if(j===0)c.moveTo(px,py);else c.lineTo(px,py);
      }c.stroke();
    }
  }
  // Only the initial strike crosses the machine. Sustained current follows the corona sides.
  const core=Math.max(0,1-age/.16);
  if(core>0){
    c.save();c.globalCompositeOperation='lighter';c.globalAlpha*=core;c.strokeStyle='#f0fffa';c.lineWidth=weak?1.5:3;
    c.beginPath();c.moveTo(-9,-32*(1-age));c.lineTo(8,-12);c.lineTo(-7,7);c.lineTo(11,29*(1-age));c.stroke();c.restore();
  }
  if(age>0){
    c.save();c.globalCompositeOperation='source-over';c.globalAlpha*=(1-core);
    for(const side of [-1,1]){
      c.beginPath();c.moveTo(side*r*.65,-r*.48);c.lineTo(side*r*.46,-r*.15);c.lineTo(side*r*.61,r*.1);c.lineTo(side*r*.5,r*.46);
      c.strokeStyle='#183d40';c.lineWidth=weak?3:5;c.stroke();
      c.strokeStyle=side<0?'#7dffd9':'#b6f6ff';c.lineWidth=weak?1:1.5;c.stroke();
    }
    c.restore();
  }
  if(!weak)for(let i=0;i<8;i++){
    const a=i*Math.PI/4+age,inner=r*.68,outer=Math.min(radius,r+14);
    c.strokeStyle=i%2?'#b6f6ff':'#82ffc0';c.lineWidth=1.5;c.beginPath();
    c.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);c.lineTo(Math.cos(a+.08)*r,Math.sin(a+.08)*r);
    c.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);c.stroke();
  }
  c.restore();
}
