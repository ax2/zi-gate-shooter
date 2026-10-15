import { ESCORT } from './boss-formations';
import type { Body, Phase } from './world';
import { C, clamp } from './config';
export type EnemyShot = (x: number, y: number, vx?: number, vy?: number) => void;
export const guardClosed = (b: Pick<Body, 'kind' | 'burst'>) => b.kind === 'guard' && b.burst === 0;

export function fanWarningVelocities(b: Body) {
  if (b.kind === 'guard') return [-70, 0, 70];
  return b.kind === 'elite' ? b.burst ? [-50, 0, 50] : [-100, -50, 0, 50, 100] : [-100, 0, 100];
}

export function bossWarningLanes(b: Body) {
  if (b.attack === 3) return [80, 150, 220, 290, 360, 430, 500, 570, 640].filter(x => Math.abs(x - b.lane) >= 110);
  if (b.attack === 2) return [200, 520];
  return b.attack ? b.burst ? [360] : [b.lane, 360] : [b.lane];
}

/** Chapters have different pressure/recovery phrases, not one shared playlist. */
export function bossAttackForCycle(variant: number | undefined, cycle: number) {
  if (variant === 1) return [2, 1, 2, 0][((cycle - 2) % 4 + 4) % 4];
  if (variant === 2) return [3, 0, 3, 1][((cycle - 3) % 4 + 4) % 4];
  return cycle % 2;
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
        if (b.attack === 3) {
          for (const x of bossWarningLanes(b)) for (let i = 0; i < 2; i++) shot(x, b.y + 90 - i * 75, 0, 280);
        } else for (let i = 0; i < 3; i++) shot(360, b.y + 90 - i * 60, 0, 300);
        finish();
      } else if (b.warning <= 0) {
        b.warning = 1.35; b.timer = 1.35;
        // Advance only after an attack finishes, so delayed warnings cannot
        // accidentally repeat/skip a pattern. B alternates left/right sweep.
        b.attack = bossAttackForCycle(b.bossVariant, b.attackCycle);
        b.lane = b.attack === 3 ? [140, 360, 580][Math.floor(b.attackCycle / 4) % 3]
          : b.attack ? Math.floor(b.attackCycle / 2) % 2 ? 520 : 200
          : [200, 360, 520][Math.floor(b.attackCycle / 2) % 3];
      } else {
        if (b.attack === 3) {
          for (const x of bossWarningLanes(b)) for (let i = 0; i < 2; i++) shot(x, b.y + 90 - i * 75, 0, 280);
          // Only the third chapter locks twice. Advertise the adjacent new gap
          // before the second volley; never move an already-fired projectile.
          b.lane = b.lane === 360 ? 580 : 360;
          b.burst = 1; b.warning = 1.8; b.timer = 1.8;
        } else if (b.attack === 2) {
          for (const x of [200, 520]) for (let i = 0; i < 4; i++) shot(x, b.y + 90 - i * 50, 0, 300);
          finish();
        } else if (!b.attack) {
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
  } else if (b.kind === 'guard') {
    if(b.escort&&b.age<ESCORT.holdSeconds){if(b.y<ESCORT.hoverY)b.y=Math.min(ESCORT.hoverY,b.y+b.speed*dt);}
    else b.y += b.speed * dt;
    if (b.y >= 650) { b.warning = 0; b.burst = 0; }
    else if (b.y > 0 && b.timer <= 1e-9) {
      if (!b.burst) { b.burst = 1; b.warning = 0.8; b.timer = 0.8; }
      else if (b.burst === 1) {
        for (const vx of fanWarningVelocities(b)) shot(b.x, b.y + b.height / 2, vx, 280);
        b.warning = 0; b.burst = 2; b.timer = 0.8;
      } else { b.burst = 0; b.timer = 2.4; }
    }
  } else if (b.kind === 'sniper') {
    // A short-lived firing position: kill during charge or leave its fixed lane.
    // Leaving after ten seconds prevents an unkillable off-axis stall at boss entry.
    if (b.age >= 10) { b.warning = 0; b.y += 220 * dt; }
    else if (b.y < 320) { b.y = Math.min(320, b.y + b.speed * dt); b.timer = 0.6; }
    else if (b.timer <= 1e-9) {
      if (b.warning <= 0) { b.warning = 1.2; b.timer = 1.2; }
      else {
        for (let i = 0; i < 3; i++) shot(b.x, b.y + 58 - i * 45, 0, 620);
        b.warning = 0; b.timer = 2.4;
      }
    }
  } else if (b.kind === 'charger') {
    if (b.age > C.chargerBehavior.warningAge && b.age < C.chargerBehavior.dashAge) b.warning = C.chargerBehavior.dashAge - b.age;
    if (b.age >= C.chargerBehavior.dashAge) {
      b.warning = 0; b.speed = C.chargerBehavior.dashSpeed;
      if (b.pattern === 'flank') b.x += clamp(b.lane - b.x, -240 * dt, 240 * dt);
    }
    b.y += b.speed * dt;
  } else {
    if (b.kind === 'drone' && b.pattern === 'weave') b.x = clamp(b.lane + Math.sin(b.age * 2) * 70, C.minX, C.maxX);
    b.y += b.speed * dt;
    if ((b.kind === 'armor' || b.kind === 'elite') && b.y > 0 && b.y < 600) {
      if (b.timer <= 1e-9) {
        if (b.warning <= 0) { b.warning = 0.6; b.timer = 0.6; }
        else {
          if (b.pattern === 'fan') for (const vx of b.kind === 'elite' && b.burst ? [-50, 0, 50] : [-100, 0, 100]) shot(b.x, b.y + b.height / 2, vx, 280);
          else shot(b.x, b.y + b.height / 2);
          if (b.kind === 'elite' && b.pattern === 'fan' && !b.burst) {
            b.burst = 1; b.warning = 0.6; b.timer = 0.6;
          } else {
            b.burst = 0; b.warning = 0; b.timer = b.pattern === 'fan' ? 3.2 : 2.4;
          }
        }
      }
    } else if (b.y >= 600) { b.warning = 0; b.burst = 0; }
  }
}
