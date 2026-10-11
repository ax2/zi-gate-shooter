import type { Body, Phase } from './world';
import { C } from './config';
export type EnemyShot = (x: number, y: number, vx?: number, vy?: number) => void;

export function bossWarningLanes(b: Body) {
  return b.attack ? b.burst ? [360] : [b.lane, 360] : [b.lane];
}

/** Shared by the live simulation and conservative no-kill route forecast. */
export function advanceBody(b: Body, dt: number, phase: Phase, phaseTime: number, shot: EnemyShot) {
  b.age += dt; b.hit = Math.max(0, b.hit - dt);
  if (b.kind === 'boss' && phase !== 'boss') return;
  b.timer -= dt;
  if (b.kind === 'boss') {
    b.x = 360 + Math.sin(phaseTime * 0.4) * 65;
    if (b.timer <= 1e-9) {
      const finish = () => {
        b.warning = 0; b.burst = 0; b.attackCycle++;
        b.timer = phaseTime > 35 ? 3.5 : 2.8;
      };
      if (b.burst) {
        for (let i = 0; i < 3; i++) shot(360, b.y + 90 - i * 60, 0, 300);
        finish();
      } else if (b.warning <= 0) {
        b.warning = 1.35; b.timer = 1.35;
        // Advance only after an attack finishes, so delayed warnings cannot
        // accidentally repeat/skip a pattern. B alternates left/right sweep.
        b.attack = b.attackCycle % 2;
        b.lane = b.attack ? Math.floor(b.attackCycle / 2) % 2 ? 520 : 200
          : [200, 360, 520][Math.floor(b.attackCycle / 2) % 3];
      } else {
        if (!b.attack) {
          for (let i = 0; i < 5; i++) shot(b.lane, b.y + 90 - i * 45, 0, 320);
          finish();
        } else {
          for (let i = 0; i < 3; i++) shot(b.lane, b.y + 90 - i * 60, 0, 300);
          // Both lanes were advertised for 1.35s. Keep the second lane visible
          // through the actual 350ms separation; the other outer lane is safe.
          b.burst = 1; b.warning = 0.35; b.timer = 0.35;
        }
      }
    }
  } else if (b.kind === 'charger') {
    if (b.age > C.chargerBehavior.warningAge && b.age < C.chargerBehavior.dashAge) b.warning = C.chargerBehavior.dashAge - b.age;
    if (b.age >= C.chargerBehavior.dashAge) { b.warning = 0; b.speed = C.chargerBehavior.dashSpeed; }
    b.y += b.speed * dt;
  } else {
    b.y += b.speed * dt;
    if ((b.kind === 'armor' || b.kind === 'elite') && b.y > 0 && b.y < 600) {
      if (b.timer <= 1e-9) {
        if (b.warning <= 0) { b.warning = 0.6; b.timer = 0.6; }
        else { shot(b.x, b.y + b.height / 2); b.warning = 0; b.timer = 2.4; }
      }
    } else if (b.y >= 600) b.warning = 0;
  }
}
