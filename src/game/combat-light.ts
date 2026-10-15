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

export function chainArc(c: CanvasRenderingContext2D, x:number,y:number,tx:number,ty:number,life:number,weak:boolean) {
  const dx=tx-x,dy=ty-y,length=Math.max(1,Math.hypot(dx,dy)),points=[x,y];
  for(let i=1;i<8;i++){const bend=(i%2?1:-1)*7;points.push(x+dx*i/8-dy/length*bend,y+dy*i/8+dx/length*bend);}
  points.push(tx,ty);c.save();c.globalCompositeOperation='lighter';
  c.globalAlpha=Math.max(0,life/.16)*(weak?.65:1);
  if(!weak)line(c,'#80ff8028',10,points);
  line(c,'#9fffad',weak?2:3,points);line(c,'#f5ffed',1,points);c.restore();
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

/** Brief localized impact: scatter spreads sideways, piercing exits along its axis. */
export function impactLight(c: CanvasRenderingContext2D, x: number, y: number, kind: WeaponKind, age: number, weak: boolean) {
  const p = Math.max(0, Math.min(1, age)), fade = (1 - p) ** 2;
  c.save(); c.translate(x, y); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade * (weak ? .45 : .85);
  const color = weaponColors[kind], reach = 12 + p * (kind === 'scatter' ? 44 : 28);
  if (kind === 'pierce') {
    line(c, color, 4, [0, 22 * (1-p), 0, -reach * 1.6]);
    line(c, '#fff2ff', 1.5, [-12, -5, 0, 1, 12, -5]);
  } else {
    for (const side of [-1, 1]) {
      line(c, color, 2.5, [side * 6, 0, side * reach, -reach * .4]);
      if (!weak) line(c, '#fff4d4', 1.2, [side * 7, 3, side * reach * .75, reach * .45]);
    }
  }
  c.restore();
}
