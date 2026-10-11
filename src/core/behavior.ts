import type { Body, Phase } from './world';
export type EnemyShot = (x: number, y: number, vx?: number, vy?: number) => void;

/** Shared by the live simulation and conservative no-kill route forecast. */
export function advanceBody(b: Body, dt: number, phase: Phase, phaseTime: number, shot: EnemyShot) {
  b.age += dt; b.hit = Math.max(0, b.hit - dt); b.timer -= dt;
  if (b.kind === 'boss') {
    if (phase !== 'boss') return;
    b.x = 360 + Math.sin(phaseTime * 0.4) * 65;
    if (b.timer <= 0) {
      if (b.warning <= 0) {
        b.warning = 1.35; b.timer = 1.35;
        b.attack = Math.floor(phaseTime / 3.5) % 2;
        b.lane = [200, 360, 520][Math.floor(phaseTime / 4) % 3];
      } else {
        if (!b.attack) for (let i = 0; i < 5; i++) shot(b.lane, b.y + 90 - i * 45, 0, 320);
        else for (const x of [200, 360]) for (let i = 0; i < 3; i++) shot(x, b.y + 90 - i * 60, 0, 300);
        b.warning = 0; b.timer = phaseTime > 35 ? 3.5 : 2.8;
      }
    }
  } else if (b.kind === 'charger') {
    if (b.age > 1.8 && b.age < 2.6) b.warning = 2.6 - b.age;
    if (b.age >= 2.6) { b.warning = 0; b.speed = 380; }
    b.y += b.speed * dt;
  } else {
    b.y += b.speed * dt;
    if ((b.kind === 'armor' || b.kind === 'elite') && b.y > 0 && b.y < 600) {
      if (b.timer <= 0) {
        if (b.warning <= 0) { b.warning = 0.6; b.timer = 0.6; }
        else { shot(b.x, b.y + b.height / 2); b.warning = 0; b.timer = 2.4; }
      }
    } else if (b.y >= 600) b.warning = 0;
  }
}
