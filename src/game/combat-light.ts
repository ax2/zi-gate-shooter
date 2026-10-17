import {C} from '../core/config';
import type { WeaponKind } from '../core/weapons';
import { weaponColors } from '../core/weapons';

/** Draw behind the player: finite overload energy, never a hitbox or projectile. */
export function overloadWake(c: CanvasRenderingContext2D, x: number, y: number, time: number, remaining: number, weak: boolean) {
  if (remaining <= 0) return;
  const fade = Math.min(1, remaining / 0.6);
  c.save(); c.translate(x, y); c.globalCompositeOperation = 'lighter';
  c.globalAlpha = fade * (weak ? 0.45 : 0.7);
  for (const side of [-1, 1]) {
    const length = 38 + Math.sin(time * 18 + side) * 8;
    const points = [side * 72, -12, side * 78, 24, side * 66, 24 + length];
    if (!weak) line(c, '#ffbd4e28', 16, points);
    line(c, '#ffcc76', weak ? 2 : 4, points);
    if (!weak) {
      line(c, '#fff7d6', 1.5, [side * 72, -10, side * 77, 20, side * 70, 41]);
      const flow = (time * 2.8 + (side + 1) * 0.25) % 1;
      c.globalAlpha = fade * (1 - flow) * 0.6;
      line(c, '#ffd58c', 2, [side * (87 + flow * 5), 10 + flow * 45, side * (87 + flow * 5), 22 + flow * 45]);
      c.globalAlpha = fade * 0.7;
    }
  }
  c.restore();
}

/** Finite shot-driven coil discharge, localized to the mechanical muzzle. */
export function coilDischarge(c: CanvasRenderingContext2D, x: number, y: number, life: number, stage: number, weak: boolean) {
  if (life <= 0) return;
  const age = 1 - Math.min(1, life);
  c.save(); c.translate(x, y); c.globalCompositeOperation = 'lighter';
  c.globalAlpha = life * (weak ? 0.55 : 0.8);
  const count = weak ? 1 : Math.max(1, Math.min(3, stage));
  for (let i = 0; i < count; i++) {
    const radius = 9 + age * 23 + i * 5;
    c.strokeStyle = i % 2 ? '#e9ffe6' : '#9fffad'; c.lineWidth = weak ? 1.5 : 2;
    c.beginPath(); c.ellipse(0, -i * 10 - age * 18, radius, radius * 0.32, 0, age * 3 + i, age * 3 + i + Math.PI * 1.65); c.stroke();
  }
  if (!weak) for (const side of [-1, 1]) {
    line(c, '#dbffd7', 1.5, [side * 17, 12, side * (23 + age * 8), 3, side * 15, -6, side * 21, -17]);
  }
  c.restore();
}

export function chainArc(c: CanvasRenderingContext2D, x:number,y:number,tx:number,ty:number,life:number,weak:boolean,photon=false,seeker=false) {
  const dx=tx-x,dy=ty-y,length=Math.max(1,Math.hypot(dx,dy)),points=[x,y];
  for(let i=1;i<8;i++){const bend=(i%2?1:-1)*7;points.push(x+dx*i/8-dy/length*bend,y+dy*i/8+dx/length*bend);}
  points.push(tx,ty);c.save();c.globalCompositeOperation='lighter';
  c.globalAlpha=Math.max(0,life/(photon?.24:.16))*(weak?.65:1);
  if(!weak)line(c,photon?'#b5a8ff33':seeker?'#ffc76028':'#80ff8028',photon?12:10,points);
  line(c,photon?'#83eaff':seeker?'#ffda92':'#9fffad',weak?2:photon?4:3,points);line(c,photon?'#fff1ff':'#f5ffed',photon?1.5:1,points);
  if(seeker){c.strokeStyle='#fff0c5';c.lineWidth=weak?1:2;for(const side of [-1,1]){c.beginPath();c.moveTo(tx+side*12,ty-8);c.lineTo(tx+side*6,ty);c.lineTo(tx+side*12,ty+8);c.stroke();}}
  if(photon){const r=6+(1-life/.24)*8;c.strokeStyle='#d8bdff';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.closePath();c.stroke();}
  c.restore();
}

/** Actual single-target discharge, drawn only after damage has settled. */
export function focusDischarge(c:CanvasRenderingContext2D,x:number,y:number,life:number,weak:boolean){
  const t=Math.max(0,Math.min(1,1-life/.32)),r=44+t*40;
  c.save();c.translate(x,y);c.globalCompositeOperation='lighter';c.globalAlpha=(1-t)*(weak?.7:1);
  if(!weak){c.strokeStyle='#a9a0ff55';c.lineWidth=8;c.beginPath();c.ellipse(0,0,r,r*.65,-.35,0,Math.PI*2);c.stroke();}
  c.strokeStyle='#83eaff';c.lineWidth=weak?1.5:3;c.beginPath();c.ellipse(0,0,r,r*.65,-.35,0,Math.PI*2);c.stroke();
  line(c,'#fff2ff',weak?1:2,[0,-42*(1-t),8,-12,0,0,-7,12,0,42*(1-t)]);
  if(!weak)for(let i=0;i<4;i++){const a=i*Math.PI/2+.4+t*.4;line(c,'#d3c2ff',2,[Math.cos(a)*(r+5),Math.sin(a)*(r+5),Math.cos(a)*(r+18),Math.sin(a)*(r+18)]);}
  c.restore();
}

// Local additive light only: no fullscreen flash, shadowBlur, filters or extra textures.
function line(c: CanvasRenderingContext2D, color: string, width: number, points: number[]) {
  c.strokeStyle = color; c.lineWidth = width; c.beginPath();
  c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.stroke();
}
function glow(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, weak: boolean) {
  for (const [scale, alpha] of (weak ? [[1.3, .1], [1, .24]] : [[2.4, .025], [1.8, .05], [1.3, .1], [1, .24]])) {
    c.globalAlpha = alpha; c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx * scale, ry * scale, 0, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}
export function energyShot(c: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number, kind: WeaponKind, time: number, weak: boolean) {
  const color = weaponColors[kind], tail = kind === 'blast' ? 28 : kind === 'pierce' ? 86 : kind === 'scatter' ? 48 : 60;
  const width = kind === 'blast' ? 9 : kind === 'pierce' ? 5 : kind === 'scatter' ? 4 : 3;
  c.save(); c.translate(x, y); c.rotate(Math.atan2(vx, -vy)); c.globalCompositeOperation = 'screen'; c.lineCap = 'round';
  if (!weak) glow(c, 0, 9, width * 2.2, 18, color, false);
  line(c, `${color}18`, width * 5, [0, tail, 0, -9]);
  line(c, `${color}66`, width * 2.2, [0, tail * .65, 0, -10]);
  line(c, `${color}99`, width, [0, tail * .38, 0, -12]);
  if(kind==='arc'){
    // The discharge follows the real projectile velocity, trailing behind it.
    // It does not point to a predicted impact or a future enemy shot.
    const sway=Math.sin(time*32+x*.1)*3;
    const path=[0,-10,4+sway,6,-5,22,5-sway,38,-3,56,0,74];
    if(!weak)line(c,'#82ffa344',8,path);
    line(c,'#a2ff9cbb',weak?2:3,path);line(c,'#edffda',1.2,path);
  }
  c.globalCompositeOperation = 'screen';
  if (!weak) {
    const phase = time * 15 + x * .13;
    for (let i = 0; i < 3; i++) {
      const side = i % 2 ? -1 : 1, yy = 17 + i * 15 + Math.sin(phase + i) * 5;
      line(c, `${color}aa`, 1.3, [side * (5 + i * 2), yy, side * (7 + i * 2), yy + 6]);
    }
    if (kind === 'pierce') line(c, `${color}aa`, 1.4, [-6, 4, 6, 17, -5, 29, 4, 40, -3, 52]);
  }
  c.restore();
}
/** Foreground pass after all additive projectile wakes and support beams. */
export function projectileBody(c: CanvasRenderingContext2D, x:number,y:number,vx:number,vy:number,kind:WeaponKind){
  const color=weaponColors[kind],width=kind==='blast'?9:kind==='pierce'?5:kind==='scatter'?4:3;
  c.save();c.translate(x,y);c.rotate(Math.atan2(vx,-vy));c.lineCap='round';
  // Opaque colored silhouettes retain weapon identity when additive wakes overlap.
  c.globalCompositeOperation = 'source-over';
  if (kind === 'blast') {
    c.fillStyle='#74431a';c.strokeStyle=color;c.lineWidth=2;
    c.beginPath();c.moveTo(0,-15);c.lineTo(7,-5);c.lineTo(5,13);c.lineTo(-5,13);c.lineTo(-7,-5);c.closePath();c.fill();c.stroke();
    line(c,'#ffe1a0',2,[0,-9,0,4]);
  } else if (kind === 'arc') {
    c.fillStyle='#163e28';c.strokeStyle=color;c.lineWidth=2;
    c.beginPath();c.ellipse(0,0,7,12,0,0,Math.PI*2);c.fill();c.stroke();
    line(c,'#d7ffba',1.5,[2,-8,-3,0,3,1,-2,8]);
  } else {
    line(c,color,width+1,[0,10,0,-12]);
    line(c,kind==='pierce'?'#e7d7ff':kind==='scatter'?'#ffd69a':'#bceeff',1,[0,3,0,-12]);
  }
  c.restore();
}
export function muzzleLight(c: CanvasRenderingContext2D, x: number, y: number, kind: WeaponKind, phase: number, weak: boolean) {
  const color = weaponColors[kind], length = (kind === 'scatter' ? 62 : 48) * (.7 + phase * .3);
  c.save(); c.translate(x, y); c.globalCompositeOperation = 'lighter';
  glow(c, 0, -8, kind === 'scatter' ? 5 : 8, 16, color, weak);
  c.globalAlpha = .3 + phase * .35; c.fillStyle = color;
  c.beginPath(); c.moveTo(-4, 4); c.lineTo(-6, -16); c.lineTo(-2, -12); c.lineTo(0, -length); c.lineTo(2, -15); c.lineTo(6, -23); c.lineTo(4, 4); c.closePath(); c.fill();
  line(c, '#fffde9', 3, [0, 2, 0, -length * .55]);
  if (!weak && kind !== 'scatter') { line(c, `${color}99`, 2, [-16, -5, 16, -5]); line(c, '#fff3cc', 1, [-7, -5, 7, -5]); }
  c.restore();
}
export function detonationLight(c: CanvasRenderingContext2D, x: number, y: number, size: number, age: number, weak: boolean) {
  const p = Math.min(1, Math.max(0, age)), fade = (1 - p) ** 1.5, radius = size * (.22 + Math.sqrt(p) * 1.1);
  if (fade <= 0) return;
  c.save(); c.translate(x, y); c.globalCompositeOperation = 'lighter';
  if (p < .32) {
    glow(c, 0, 0, size * (1 - p) * .3, size * (1 - p) * .25, '#ffad42', weak);
    c.globalAlpha = (1 - p / .32) * (weak ? .35 : .8); c.fillStyle = '#fff3ce';
    c.beginPath(); c.ellipse(0, 0, size * .2, size * .13, 0, 0, Math.PI * 2); c.fill();
    line(c, '#ffd788', 2, [-size * .8, 0, size * .8, 0]);
  }
  c.globalAlpha = fade * (weak ? .4 : .8); c.strokeStyle = '#ffb84c'; c.lineWidth = 2.5;
  c.beginPath(); c.ellipse(0, 0, radius, radius * .64, 0, 0, Math.PI * 2); c.stroke();
  if (!weak) {
    c.globalAlpha = fade * .6;
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 + .21, pts: number[] = [];
      for (let j = 0; j < 5; j++) { const t = a + j * .13, r = radius * (.75 + (j % 2) * .18); pts.push(Math.cos(t) * r, Math.sin(t) * r); }
      line(c, i % 2 ? '#ffcf85' : '#bcecff', 1.6, pts);
    }
  }
  c.restore();
}
export function sparkLight(c: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number, color: string, fade: number, weak: boolean) {
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, fade); c.lineCap = 'round';
  const pts = [x, y, x - vx * .045, y - vy * .045];
  if (!weak) line(c, `${color}30`, 7, pts);
  line(c, color, 2.5, pts); line(c, '#fff3d6', 1, [x, y, x - vx * .016, y - vy * .016]);
  c.restore();
}

/** Local material response to settled damage; never a new hit, AOE or projected trajectory. */
export function impactLight(c:CanvasRenderingContext2D,x:number,y:number,kind:WeaponKind,age:number,weak:boolean){
  if(age<0||age>=1)return;
  const p=age,fade=(1-p)**1.6,color=weaponColors[kind];
  c.save();c.beginPath();c.rect(0,C.playerShotTop,C.width,C.playerY-C.playerShotTop);c.clip();c.translate(x,y);
  c.globalAlpha=fade*(weak?.65:.9);c.lineCap='round';
  if(kind==='scatter'){
    // Hot spall: dark forged faces keep each chip visible inside overlapping light.
    for(let i=0;i<(weak?3:5);i++){
      const a=-Math.PI*.88+i*Math.PI*.19,d=8+(1-(1-p)**2)*(30+i%2*14);
      impactChip(c,Math.cos(a)*d,Math.sin(a)*d*.7,a+p*(i%2?3:-3),color,weak?3.5:6,Math.sqrt(fade)*(weak?.7:.95));
    }
    c.globalCompositeOperation='lighter';
    line(c,'#fff1c3',weak?1.5:2.5,[-7,-2,0,-7,7,-2]);
    if(!weak)for(const side of [-1,1])line(c,color,1.5,[side*9,4,side*(18+p*26),9+p*12]);
  }else if(kind==='pierce'){
    c.globalCompositeOperation='lighter';
    const end=18+p*38;
    line(c,color,weak?2:3,[0,14*(1-p),0,-end]);
    line(c,'#fff0ff',1.2,[-3,5,2,-10,0,-end*.78]);
    for(const side of [-1,1]){
      line(c,color,weak?1:1.5,[side*5,1,side*(12+p*17),-10-p*12]);
      if(!weak)impactChip(c,side*(10+p*18),-p*14,side*p*2,'#d5b4ff',4.5,Math.sqrt(fade)*.85);
    }
  }else if(kind==='arc'){
    c.globalCompositeOperation='lighter';
    for(let i=0;i<(weak?2:3);i++){
      const a=i*Math.PI*2/3+.25,r=15+p*23;
      const path=[0,0,Math.cos(a-.2)*r*.42,Math.sin(a-.2)*r*.42,Math.cos(a+.16)*r*.7,Math.sin(a+.16)*r*.7,Math.cos(a)*r,Math.sin(a)*r];
      if(!weak)line(c,'#90ffbd2c',5,path);
      line(c,color,weak?1.5:2,path);line(c,'#efffe3',.8,path.slice(0,6));
    }
    c.strokeStyle='#d3ffdc';c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,4,7,.4,0,Math.PI*2);c.stroke();
  }else if(kind==='blast'){
    const r=10+p*35;
    c.globalCompositeOperation='lighter';c.strokeStyle=color;c.lineWidth=weak?1.5:2.5;
    for(let i=0;i<(weak?3:6);i++){const a=i*Math.PI*2/(weak?3:6);c.beginPath();c.ellipse(0,0,r,r*.62,0,a,a+.65);c.stroke();}
    if(!weak)for(let i=0;i<3;i++){const a=i*Math.PI*2/3+.5;impactChip(c,Math.cos(a)*r*.7,Math.sin(a)*r*.55,a+p*2,'#ffc382',4.5,Math.sqrt(fade)*.9);}
    line(c,'#fff3c5',weak?2:3,[-5,0,0,-5,5,0]);
  }else{
    c.globalCompositeOperation='lighter';
    line(c,'#ecfcff',weak?2:3,[0,5,0,-10*(1-p)]);
    for(const side of [-1,1]){
      const r=9+p*23;line(c,color,1.5,[side*4,0,side*r,-r*.6]);
      if(!weak)line(c,'#ffdd9d',1,[side*(r*.6),5,side*(r+7),12+p*9]);
    }
  }
  c.restore();
}
function impactChip(c:CanvasRenderingContext2D,x:number,y:number,angle:number,color:string,size:number,opacity:number){
  c.save();c.translate(x,y);c.rotate(angle);c.globalCompositeOperation='source-over';c.globalAlpha=opacity;
  c.fillStyle='#334854';c.strokeStyle=color;c.lineWidth=1;
  c.beginPath();c.moveTo(-size,-size*.45);c.lineTo(size*.6,-size*.7);c.lineTo(size*1.4,size*.25);c.lineTo(-size*.4,size*.65);c.closePath();c.fill();c.stroke();
  line(c,'#b9c8ce',.8,[-size*.6,-size*.25,size*.6,size*.1]);
  c.restore();
}
