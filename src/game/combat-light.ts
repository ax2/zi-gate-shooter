import type { WeaponKind } from '../core/weapons';
import { weaponColors } from '../core/weapons';

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
  const color = weaponColors[kind], tail = kind === 'pierce' ? 86 : kind === 'scatter' ? 48 : 60;
  const width = kind === 'pierce' ? 5 : kind === 'scatter' ? 4 : 3;
  c.save(); c.translate(x, y); c.rotate(Math.atan2(vx, -vy)); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  if (!weak) glow(c, 0, 9, width * 2.2, 18, color, false);
  line(c, `${color}18`, width * 5, [0, tail, 0, -9]);
  line(c, `${color}66`, width * 2.2, [0, tail * .65, 0, -10]);
  line(c, color, width, [0, tail * .38, 0, -12]);
  line(c, '#fff9e8', Math.max(1.5, width * .5), [0, 11, 0, -13]);
  if (!weak) {
    const phase = time * 15 + x * .13;
    for (let i = 0; i < 3; i++) {
      const side = i % 2 ? -1 : 1, yy = 17 + i * 15 + Math.sin(phase + i) * 5;
      line(c, `${color}aa`, 1.3, [side * (5 + i * 2), yy, side * (7 + i * 2), yy + 6]);
    }
    if (kind === 'pierce') line(c, '#dfbaffaa', 1.4, [-6, 4, 6, 17, -5, 29, 4, 40, -3, 52]);
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
