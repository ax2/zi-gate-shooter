import { World } from '../src/core/world';
import { C } from '../src/core/config';
import { weaponNames, type WeaponKind } from '../src/core/weapons';

const rows = [];
for (const kind of ['drone', 'armor'] as const) {
  for (const layout of ['single', 'row', 'column'] as const) {
    for (const moving of [false, true]) {
      for (const weapon of Object.keys(weaponNames) as WeaponKind[]) {
        const w = new World(1337);
        (w as unknown as { scheduled: unknown[] }).scheduled = [];
        w.growth.stage = 3; w.weaponKind = weapon;
        const positions = layout === 'single' ? [[360, 500]] : layout === 'row'
          ? [[260, 500], [360, 500], [460, 500]] : [[360, 300], [360, 450], [360, 600]];
        const targets = positions.map(([x, y]) => {
          const b = w.spawn(kind, x, y);
          b.timer = 1000; // isolate coverage from enemy shooting; real HP and scrolling
          return b;
        });
        let firstKill: number | null = null;
        for (let tick = 0; tick < 360 && targets.some(t => t.active) && w.player.hp > 0; tick++) {
          w.step(C.step, moving ? 360 + Math.sin(w.time * 2) * 110 : 360);
          if (firstKill === null && w.kills) firstKill = +w.time.toFixed(3);
          w.drainEffects();
        }
        rows.push({ kind, layout, moving, weapon, kills: w.kills, count: targets.length,
          firstKill, clearTime: w.kills === targets.length ? +w.time.toFixed(3) : null,
          playerHp: w.player.hp });
      }
    }
  }
}
console.log(JSON.stringify({scope: 'isolated normal-HP scrolling targets, no enemy firing, scripted movement; not human play', rows}, null, 2));
