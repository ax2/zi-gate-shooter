export const C = {
  width: 720, height: 1280, playerY: 1024, minX: 68, maxX: 652,
  playerRadius: 20, moveSpeed: 680, scrollSpeed: 150, pickupRadius: 52,
  step: 1 / 60, bulletSpeed: 1200, bulletLife: 1.2, playerShotTop: 240, invulnerability: 1,
  thresholds: [0, 24, 56, 96, 144], rewards: [10, 15, 20, 25, 30],
  energyGateMultiplier: 2,
  chargerBehavior: { warningAge: 1.8, dashAge: 2.6, dashSpeed: 380 },
  weapon: [
    { rate: 8, offsets: [0], damage: [4] },
    { rate: 6, offsets: [-12, 12], damage: [4, 4] },
    { rate: 6, offsets: [-24, -12, 12, 24], damage: [2, 4, 4, 2] },
  ],
  enemies: {
    drone: { hp: 12, score: 10, width: 56, height: 60, speed: 170 },
    charger: { hp: 24, score: 20, width: 62, height: 78, speed: 170 },
    armor: { hp: 80, score: 50, width: 86, height: 102, speed: 110 },
    elite: { hp: 200, score: 150, width: 118, height: 136, speed: 90 },
    boss: { hp: 900, score: 1000, width: 300, height: 220, speed: 0 },
  },
  limits: { bullets: 80, hostile: 48, enemies: 26, rewards: 6 },
} as const;
export type EnemyKind = keyof typeof C.enemies;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
