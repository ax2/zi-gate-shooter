// src/game/impact-admission.ts
function trimImpactBudget(markers, weak) {
  const cap = weak ? 4 : 12;
  while (markers.length > cap) {
    const i = markers.findIndex((h) => !h.opticalBand);
    markers.splice(i < 0 ? 0 : i, 1);
  }
}
function admitWeaponImpact(markers, x, y, kind, weak) {
  trimImpactBudget(markers, weak);
  if (markers.some((h) => !h.opticalBand && h.kind === kind && Math.hypot(h.x - x, h.y - y) < 28)) return false;
  const total = weak ? 0.14 : 0.18, next = { x, y, kind, life: total, total }, cap = weak ? 4 : 12;
  if (markers.length < cap) {
    markers.push(next);
    return true;
  }
  let index = -1;
  for (let i = 0; i < markers.length; i++) {
    const h = markers[i];
    if (h.opticalBand) continue;
    const old = markers[index];
    if (index < 0 || h.kind === kind && old.kind !== kind || h.kind === kind === (old.kind === kind) && h.life / (h.total ?? 0.14) < old.life / (old.total ?? 0.14)) index = i;
  }
  if (index < 0) return false;
  markers[index] = next;
  return true;
}

// src/core/config.ts
var C = {
  width: 720,
  height: 1280,
  playerY: 1024,
  bossY: 360,
  bossLootReveal: 2.2,
  minX: 68,
  maxX: 652,
  playerRadius: 20,
  moveSpeed: 680,
  scrollSpeed: 150,
  pickupRadius: 52,
  // Keep 0.45s reaction after the first rendered frame plus one 0.1s forecast bucket.
  spawnSafetyReaction: 0.55,
  step: 1 / 60,
  bulletSpeed: 1200,
  bulletLife: 1.2,
  playerShotTop: 240,
  invulnerability: 1,
  thresholds: [0, 24, 56, 96, 144],
  rewards: [10, 15, 20, 25, 30],
  energyGateMultiplier: 2,
  killCharge: { elite: 15, boss: 50 },
  chargerBehavior: { warningAge: 1.8, dashAge: 2.6, dashSpeed: 380 },
  shooterEntry: { stationY: 344, speed: 480 },
  weapon: [
    { rate: 8, offsets: [0], damage: [4] },
    { rate: 6, offsets: [-12, 12], damage: [4, 4] },
    { rate: 6, offsets: [-24, -12, 12, 24], damage: [2, 4, 4, 2] }
  ],
  enemies: {
    drone: { hp: 12, score: 10, width: 56, height: 60, speed: 170 },
    sniper: { hp: 44, score: 35, width: 80, height: 88, speed: 170 },
    guard: { hp: 64, score: 60, width: 100, height: 108, speed: 100 },
    conduit: { hp: 48, score: 35, width: 88, height: 96, speed: 105 },
    charger: { hp: 24, score: 20, width: 62, height: 78, speed: 170 },
    armor: { hp: 80, score: 50, width: 86, height: 102, speed: 110 },
    elite: { hp: 200, score: 150, width: 118, height: 136, speed: 90 },
    boss: { hp: 2250, score: 1e3, width: 300, height: 220, speed: 0 }
  },
  limits: { bullets: 80, hostile: 48, enemies: 26, rewards: 6 }
};
var clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// src/core/rewards.ts
var permanentPower = (g) => g.bonus + (g.mastery ?? 0) * 10;
function gateValue(energy, kind = "power") {
  let rank = 0;
  for (let i = 0; i < C.thresholds.length; i++) if (energy >= C.thresholds[i]) rank = i;
  return C.rewards[rank] * (kind === "energy" ? C.energyGateMultiplier : 1);
}
function previewReward(g, nominal, kind) {
  const power = kind === "power" ? Math.min(nominal, 100 - g.bonus) : 0;
  const energy = nominal - power;
  return { power, energy, wasted: nominal - power - energy };
}
function gateRewardLabel(value) {
  return [value.power ? `\u706B\u529B +${value.power}%` : "", value.energy ? `\u5145\u80FD +${value.energy}` : ""].filter(Boolean).join(" \xB7 ") || "\u50A8\u80FD\u5DF2\u6EE1";
}
function activateOverload(g) {
  if (g.energy >= 100) {
    const levels = Math.floor(g.energy / 100);
    g.mastery = (g.mastery ?? 0) + levels;
    g.energy %= 100;
    g.overload = 6;
    return true;
  }
  return false;
}
function grantGate(g, nominal, kind) {
  const value = previewReward(g, nominal, kind);
  g.bonus = clamp(g.bonus + value.power, 0, 100);
  g.energy += value.energy;
  const activated = activateOverload(g);
  return { ...value, activated };
}
function grantEquipment(g, stage) {
  if (stage > g.stage) {
    g.stage = stage;
    return { upgraded: true, activated: false };
  }
  g.energy += 30;
  return { upgraded: false, activated: activateOverload(g) };
}

// src/core/weapons.ts
var weaponNames = { pulse: "\u901F\u5C04\u70AE", scatter: "\u9730\u5C04\u70AE", pierce: "\u7A7F\u7532\u70AE", blast: "\u7206\u88C2\u70AE", arc: "\u7535\u5F27\u70AE" };
var weaponColors = { pulse: "#83e5ff", scatter: "#ffd28b", pierce: "#d5b4ff", blast: "#ffb46d", arc: "#a2ff9c" };
var ARC_SHOT = { speed: 3600, aimWidth: 180, maxSlope: 0.45, minLead: 80 };
function weaponProfile(kind, stage) {
  const tier = Math.max(0, Math.min(2, stage - 1));
  if (kind === "arc") return { rate: 2.5, offsets: [0], damage: [[16], [22], [28]][tier], vx: [0], targets: 1, muzzleY: [80, 96, 99][tier], chainHops: tier + 1 };
  if (kind === "blast") return { rate: [2, 2.5, 3][tier], offsets: [0], damage: [[16], [24], [32]][tier], vx: [0], targets: 1, muzzleY: [92, 94, 100][tier], splashRadius: [90, 110, 130][tier] };
  if (kind === "scatter") {
    const offsets = tier === 0 ? [-12, 0, 12] : tier === 1 ? [-24, -12, 0, 12, 24] : [-36, -24, -12, 0, 12, 24, 36];
    const [center, inner, outer] = [[4, 3, 2], [5, 4, 3], [7, 5, 3]][tier];
    return {
      rate: tier === 2 ? 4 : 5,
      offsets,
      damage: offsets.map((_, i) => i === Math.floor(offsets.length / 2) ? center : Math.abs(i - Math.floor(offsets.length / 2)) === 1 ? inner : outer),
      vx: offsets.map((_, i) => (i - Math.floor(offsets.length / 2)) * (tier === 2 ? 75 : 110)),
      targets: 1
    };
  }
  if (kind === "pierce") {
    const offsets = tier === 0 ? [0] : [-22, 22];
    return { rate: tier === 2 ? 4 : 5, offsets, muzzleY: [76, 82, 99][tier], damage: offsets.map(() => [6, 5, 8][tier]), vx: offsets.map(() => 0), targets: tier === 2 ? 3 : 2 };
  }
  const normal = C.weapon[tier];
  return { ...normal, vx: normal.offsets.map(() => 0), targets: 1 };
}

// src/game/equipment-receipt.ts
function captureEquipment(w) {
  const power = 1 + permanentPower(w.growth) / 100;
  return new Map(w.activeWeapons.map((kind) => {
    const p = w.profileFor(kind);
    return [kind, {
      stage: w.weaponStage(kind),
      calibration: w.weaponCalibration(kind),
      pellets: p.offsets.length,
      targets: p.targets,
      radius: p.splashRadius ?? 0,
      hops: p.chainHops ?? 0,
      rate: p.rate,
      direct: p.damage.reduce((sum, n) => sum + n, 0) * p.rate * power
    }];
  }));
}
function equipmentChanges(before, w) {
  return [...captureEquipment(w)].flatMap(([kind, after]) => {
    const old = before.get(kind);
    return !old || old.stage !== after.stage || old.calibration !== after.calibration ? [{ kind, before: old, after }] : [];
  });
}
var number = (n) => n >= 1e8 ? `${+(n / 1e8).toFixed(1)}\u4EBF` : n >= 1e4 ? `${+(n / 1e4).toFixed(1)}\u4E07` : String(+n.toFixed(1));
function equipmentReceipt(change) {
  const { kind, before: a, after: b } = change, name = weaponNames[kind];
  const mechanics = kind === "arc" ? `\u8DF3\u7535${a ? number(a.hops) + "\u2192" : ""}${b.hops}\u6B21` : kind === "blast" ? `\u8303\u56F4${a ? number(a.radius) + "\u2192" : ""}${b.radius}` : a && a.pellets === b.pellets && a.targets !== b.targets ? `\u8D2F\u7A7F${a.targets}\u2192${b.targets}\u654C` : `${a && a.pellets !== b.pellets ? a.pellets + "\u2192" : ""}${b.pellets}\u53D1/\u8F6E`;
  const title = !a ? `\u65B0\u589E${name} T${b.stage} \xB7 ${mechanics}` : a.stage !== b.stage ? `${name} T${a.stage}\u2192T${b.stage} \xB7 ${mechanics}` : `${name} \u7CBE\u6821${a.calibration}\u2192${b.calibration}`;
  return { title, detail: `\u9886\u53D6\u65F6\u5E38\u6001\u5168\u5F39\u76F4\u4F24/\u79D2 ${number(a?.direct ?? 0)} \u2192 ${number(b.direct)}` };
}
var EquipmentReceiptQueue = class {
  items = [];
  get pending() {
    return this.items;
  }
  clear() {
    this.items = [];
  }
  push(change) {
    const found = this.items.find((item) => item.kind === change.kind);
    if (found) {
      found.after = { ...change.after };
      found.remaining = 3.2;
    } else if (this.items.length < 5) this.items.push({ remaining: 3.2, kind: change.kind, before: change.before ? { ...change.before } : void 0, after: { ...change.after } });
  }
  interrupt(change, remaining = 3.2) {
    const next = this.items.find((item) => item.kind === change.kind);
    this.items = this.items.filter((item) => item.kind !== change.kind);
    this.items.unshift({ remaining: next ? 3.2 : remaining, kind: change.kind, before: change.before ? { ...change.before } : void 0, after: { ...next?.after ?? change.after } });
    this.items = this.items.slice(0, 5);
  }
  take() {
    return this.items.shift();
  }
};

// src/core/ion-storm.ts
var ION_STORM = { hits: 6, radius: 140, damage: 1.2, cooldown: 0.8 };
var ionAugments = {
  "ion-orb": { name: "\u5DE1\u822A\u96F7\u6838", detail: "\u524D\u79FB\u96F7\u6838 \xB7 \u4E09\u62CD100\u8303\u56F4 \xB7 \u6BCF\u62CD2\u654C\u540435%", role: "\u6CBF\u7EB5\u5411\u6765\u654C\u6301\u7EED\u653E\u7535" },
  "ion-spear": { name: "\u5206\u5C94\u96F7\u77DB", detail: "\u53CC\u7FFC\u5BFB\u654C\u96F7\u77DB \xB7 \u6BCF\u77DB\u8D2F\u7A7F2\u654C\u540475%", role: "\u4FA7\u7FFC\u4F18\u5148 \xB7 \u65E0\u4FA7\u654C\u65F6\u5355\u77DB\u56DE\u51FB\u539F\u76EE\u6807" }
};
var isIonAugment = (v) => v === "ion-orb" || v === "ion-spear";
var ION_ORB = { speed: 260, life: 1, pulses: [0.1, 0.45, 0.8], radius: 100, targets: 2, damage: 0.35, limit: 2 };
var ION_SPEAR = { speed: 1e3, aimRange: 400, life: 0.65, targets: 2, damage: 0.75, limit: 4 };

// src/game/ion-evolution-light.ts
function ionEvolutionLight(c, orbs, spears, weak) {
  if (!orbs.length && !spears.length) return;
  c.save();
  c.beginPath();
  c.rect(0, C.playerShotTop, C.width, C.playerY - C.playerShotTop);
  c.clip();
  for (const p of orbs) {
    if (!p.active) continue;
    c.save();
    c.translate(p.x, p.y);
    c.globalAlpha = 0.28;
    c.strokeStyle = "#8df6e4";
    c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = p.age * 3 + i * Math.PI * 2 / 3;
      c.beginPath();
      c.arc(0, 0, ION_ORB.radius, a, a + 1);
      c.stroke();
    }
    c.globalAlpha = 1;
    c.fillStyle = "#112832";
    c.strokeStyle = "#92c8d5";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -28);
    c.lineTo(22, -13);
    c.lineTo(22, 13);
    c.lineTo(0, 28);
    c.lineTo(-22, 13);
    c.lineTo(-22, -13);
    c.closePath();
    c.fill();
    c.stroke();
    c.globalCompositeOperation = "lighter";
    const beat = 1 - Math.min(1, Math.abs(p.age - [0.1, 0.45, 0.8][Math.max(0, p.pulses - 1)]) * 7);
    c.strokeStyle = "#88ffe4";
    c.lineWidth = weak ? 2 : 3;
    c.beginPath();
    c.arc(0, 0, 12 + beat * 4, p.age * 9, p.age * 9 + Math.PI * 1.7);
    c.stroke();
    c.fillStyle = "#e1fff6";
    c.fillRect(-2, -4, 4, 8);
    if (!weak) for (let i = 0; i < 4; i++) {
      const a = p.age * 5 + i * Math.PI / 2;
      c.strokeStyle = i % 2 ? "#aaa3ff" : "#83f5ff";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(Math.cos(a) * 19, Math.sin(a) * 19);
      c.lineTo(Math.cos(a + 0.12) * 29, Math.sin(a + 0.12) * 29);
      c.lineTo(Math.cos(a) * 35, Math.sin(a) * 35);
      c.stroke();
    }
    c.restore();
  }
  for (const p of spears) {
    if (!p.active) continue;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(Math.atan2(p.vx, -p.vy));
    c.globalCompositeOperation = "lighter";
    const trail = c.createLinearGradient(0, 0, 0, 48);
    trail.addColorStop(0, "#a4bfff");
    trail.addColorStop(1, "#667cff00");
    c.strokeStyle = trail;
    c.lineWidth = weak ? 3 : 6;
    c.beginPath();
    c.moveTo(0, 2);
    c.lineTo(0, 48);
    c.stroke();
    c.fillStyle = "#e3fcff";
    c.beginPath();
    c.moveTo(0, -17);
    c.lineTo(5, 3);
    c.lineTo(0, 10);
    c.lineTo(-5, 3);
    c.closePath();
    c.fill();
    c.strokeStyle = "#91c8ff";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-8, 10);
    c.lineTo(-5, -5);
    c.moveTo(8, 10);
    c.lineTo(5, -5);
    c.stroke();
    c.restore();
  }
  c.restore();
}

// src/core/fire-control.ts
var FIRE_CONTROL = { at: 55.5, hold: 4.5, opening: 0.15, warning: 1, boostedRecovery: 1.1, recovery: 3.2, durability: 6, relayDurability: 3, radius: 320, gunX: 440, gunYs: [550, 350], relayX: 210, relayY: 450, screenX: 620 };
var fireControlHolding = (b) => b.pattern === "fire-control" && b.age < FIRE_CONTROL.hold;
function fireControlSource(b, bodies) {
  if (!b.active || b.kind !== "armor" || b.pattern !== "fire-control" || b.controlGroup === void 0) return void 0;
  return bodies.find((s) => s.active && s.hp > 0 && s.kind === "conduit" && s.pattern === "fire-control" && s.controlGroup === b.controlGroup && !(s.empRemaining ?? 0) && Math.hypot(s.x - b.x, s.y - b.y) <= FIRE_CONTROL.radius);
}

// src/game/fire-control-rig.ts
function controlReceiver(c, age, linked, offline, weak) {
  c.save();
  c.lineJoin = "round";
  for (const side of [-1, 1]) {
    c.save();
    c.scale(side, 1);
    c.fillStyle = "#182b35";
    c.strokeStyle = "#7e9297";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(45, -16);
    c.lineTo(59, -23);
    c.lineTo(69, -12);
    c.lineTo(68, 24);
    c.lineTo(55, 32);
    c.lineTo(46, 23);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#aa7043";
    c.fillRect(52, -9, 9, 24);
    c.strokeStyle = "#e0b88c";
    c.lineWidth = 1;
    for (let i = 0; i < (weak ? 2 : 5); i++) {
      const y = -6 + i * (weak ? 14 : 5);
      c.beginPath();
      c.moveTo(52, y);
      c.lineTo(61, y - 2);
      c.stroke();
    }
    c.strokeStyle = "#7a8d91";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(56, -21);
    c.lineTo(56, -38);
    c.lineTo(64, -43);
    c.stroke();
    c.fillStyle = offline ? "#87e6f1" : linked ? "#ffcc78" : "#4b626e";
    c.globalAlpha = linked && !offline ? 0.7 + 0.25 * Math.sin(age * 8) ** 2 : 1;
    c.fillRect(55, -19, 7, 5);
    c.restore();
  }
  c.restore();
}
function controlTransmitter(c, age, links, weak) {
  c.save();
  c.lineJoin = "round";
  for (const [i, side] of [-1, 1].entries()) {
    c.save();
    c.scale(side, 1);
    c.strokeStyle = "#758990";
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(53, 22);
    c.lineTo(73, 13);
    c.lineTo(80, -9);
    c.stroke();
    c.strokeStyle = "#344e5b";
    c.lineWidth = 3;
    c.stroke();
    c.fillStyle = "#172a36";
    c.strokeStyle = "#9cacaa";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(61, -27);
    c.lineTo(77, -41);
    c.lineTo(92, -29);
    c.lineTo(91, -8);
    c.lineTo(77, 4);
    c.lineTo(62, -9);
    c.closePath();
    c.fill();
    c.stroke();
    c.strokeStyle = "#b78350";
    c.lineWidth = weak ? 2 : 3;
    c.beginPath();
    c.moveTo(67, -24);
    c.lineTo(77, -32);
    c.lineTo(86, -24);
    c.lineTo(84, -13);
    c.lineTo(77, -6);
    c.lineTo(68, -13);
    c.closePath();
    c.stroke();
    if (!weak) {
      c.strokeStyle = "#526f7f";
      c.lineWidth = 1;
      for (const y of [-23, -17]) {
        c.beginPath();
        c.moveTo(70, y);
        c.lineTo(84, y);
        c.stroke();
      }
    }
    c.fillStyle = links > i ? "#ffd18b" : "#4d6370";
    c.globalAlpha = links > i ? 0.65 + 0.3 * Math.sin(age * 7 + i) ** 2 : 1;
    c.fillRect(74, -22, 6, 8);
    c.restore();
  }
  c.restore();
}

// src/core/lockshot.ts
var LOCKSHOT = { at: 23, y: 360, opening: 0.1, warning: 1, spacing: 0.12, shots: 3, speed: 620, pivot: 20, barrel: 48, hold: 10, exitSpeed: 220 };
var FORKSHOT = { spread: 160, warning: 0.55, recovery: 0.1 };
function forkshotTargets(lockX) {
  const first = Math.min(C.maxX, Math.max(C.minX, lockX)), center = Math.min(C.maxX - FORKSHOT.spread, Math.max(C.minX + FORKSHOT.spread, first));
  return [first, ...[center - FORKSHOT.spread, center + FORKSHOT.spread].map((x) => Math.abs(x - first) < FORKSHOT.spread / 2 ? center : x)];
}
var lockshotLeaving = (b) => (b.lockShots ?? 0) >= LOCKSHOT.shots || b.age >= LOCKSHOT.hold;
function lockshotProfile(b) {
  const aim = b.forkshot ? forkshotTargets(b.lockX ?? b.lane)[Math.min(2, b.lockShots ?? 0)] : b.lockX ?? b.lane;
  const dx = aim - b.x, dy = C.playerY - (b.y + LOCKSHOT.pivot), length = Math.hypot(dx, dy) || 1;
  const ux = dx / length, uy = dy / length;
  return { x: b.x + ux * LOCKSHOT.barrel, y: b.y + LOCKSHOT.pivot + uy * LOCKSHOT.barrel, ux, uy, vx: ux * LOCKSHOT.speed, vy: uy * LOCKSHOT.speed };
}

// src/game/lockshot-goal.ts
function lockshotGoal(w, id) {
  if (id !== "preempt-gun" && id !== "bait-counter") return null;
  const bait = id === "bait-counter", title = bait ? "\u6280\u5DE7\u76EE\u6807 \xB7 \u8BF1\u5C04\u53CD\u51FB" : "\u6280\u5DE7\u76EE\u6807 \xB7 \u5148\u5236\u62C6\u70AE";
  const b = w.bodies.find((b2) => b2.active && b2.pattern === "lockshot" && b2.y < C.playerY - b2.height / 2);
  if (!b) return { kind: "move", title, detail: "\u7B2C\u4E8C\u8F6E\u8D77\u4FA7\u7FFC\u7AE0 \xB7 \u7559\u610F\u659C\u5C04\u54E8\u673A" };
  let detail;
  if (!bait) detail = (b.lockAcceptedShots ?? 0) > 0 ? "\u5DF2\u53D1\u5C04 \xB7 \u4E0B\u4E2A\u54E8\u673A\u518D\u8BD5" : (b.dropGrace ?? 0) > 0 ? "\u7B49\u5F85\u62A4\u76D6\u6253\u5F00\uFF0C\u518D\u84C4\u80FD\u62A2\u5148\u62C6\u70AE" : b.warning > 0 ? "\u6B63\u5728\u84C4\u80FD \xB7 \u5BF9\u51C6\u70AE\u673A\u62A2\u5148\u51FB\u6BC1" : "\u7B49\u5F85\u84C4\u80FD \xB7 \u9996\u53D1\u524D\u5BF9\u51C6\u51FB\u6BC1";
  else if (b.lockDamageStart !== w.damageTaken) detail = "\u672C\u6B21\u5DF2\u53D7\u4F24 \xB7 \u4E0B\u4E2A\u54E8\u673A\u518D\u8BD5";
  else if ((b.lockPassed ?? 0) >= LOCKSHOT.shots) detail = "\u5DF2\u907F\u8FC73/3 \xB7 \u73B0\u5728\u5BF9\u51C6\u540C\u673A\u53CD\u51FB";
  else if ((b.empRemaining ?? 0) > 0) detail = "\u505C\u706B\u4E2D \xB7 \u65E7\u5F39\u4ECD\u5371\u9669\uFF0C\u7B49\u5F85\u5269\u4F59\u53D1\u5C04";
  else detail = `\u5DF2\u907F\u8FC7${b.lockPassed ?? 0}/3 \xB7 \u5148\u9519\u5F00\u70AE\u673A\uFF0C\u5F85\u5B9E\u5F39\u901A\u8FC7`;
  return { kind: "enemy", title, detail };
}
function lockshotTargetLabel(w, b, id) {
  if (b.pattern !== "lockshot") return null;
  if (id === "bait-counter") return b.lockDamageStart !== w.damageTaken ? "\u8BF1\u5C04 \xB7 \u53D7\u4F24\u5931\u6548" : (b.lockPassed ?? 0) >= LOCKSHOT.shots ? "\u8BF1\u5C04 3/3 \xB7 \u53EF\u53CD\u51FB" : `\u8BF1\u5C04 \xB7 \u907F\u5F39${b.lockPassed ?? 0}/3`;
  if (id === "preempt-gun") return (b.lockAcceptedShots ?? 0) > 0 ? "\u5148\u5236 \xB7 \u4E0B\u673A\u518D\u8BD5" : (b.dropGrace ?? 0) > 0 ? "\u5148\u5236 \xB7 \u7B49\u5F85\u5F00\u76D6" : b.warning > 0 ? "\u5148\u5236 \xB7 \u73B0\u5728\u62C6\u70AE" : "\u5148\u5236 \xB7 \u7B49\u5F85\u84C4\u80FD";
  return null;
}

// src/game/lockshot-mount.ts
function lockshotMount(c, b, weak) {
  const p = lockshotProfile(b);
  const elapsed = b.age - (b.lockFiredAt ?? -Infinity), recoil = elapsed >= 0 && elapsed < 0.09 ? 5 * (1 - elapsed / 0.09) : 0;
  const stowed = lockshotLeaving(b) && recoil === 0;
  c.save();
  c.translate(b.x, b.y + LOCKSHOT.pivot);
  if (b.forkshot) {
    c.fillStyle = "#253a45";
    c.strokeStyle = "#0b1721";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-28, -12);
    c.lineTo(28, -12);
    c.lineTo(23, 14);
    c.lineTo(-23, 14);
    c.closePath();
    c.fill();
    c.stroke();
    for (let i = 0; i < 3; i++) {
      const x = -17 + i * 17;
      c.fillStyle = "#718892";
      c.fillRect(x - 5, -9, 10, 17);
      c.fillStyle = (b.lockAcceptedShots ?? 0) > i ? "#243740" : "#d9af77";
      c.fillRect(x - 3, -6, 6, 10);
      c.strokeStyle = "#c1cbd0";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x - 4, -9);
      c.lineTo(x + 4, -9);
      c.stroke();
    }
  }
  c.rotate(stowed ? 0 : recoil > 0 && b.lockFiredAngle !== void 0 ? -b.lockFiredAngle : -Math.atan2(p.ux, p.uy));
  c.fillStyle = "#253a45";
  c.strokeStyle = "#0c171f";
  c.lineWidth = 3;
  c.beginPath();
  c.arc(0, 0, 13, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.strokeStyle = "#78919b";
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(0, 0, 10, 0.2, Math.PI - 0.2);
  c.stroke();
  c.fillStyle = "#3d5360";
  c.strokeStyle = "#0c171f";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-9, 1);
  c.lineTo(-7, 31 - recoil);
  c.lineTo(-10, 39 - recoil);
  c.lineTo(-6, 48 - recoil);
  c.lineTo(6, 48 - recoil);
  c.lineTo(10, 39 - recoil);
  c.lineTo(7, 31 - recoil);
  c.lineTo(9, 1);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = "#6a8490";
  c.beginPath();
  c.moveTo(-7, 3);
  c.lineTo(-4, 5);
  c.lineTo(-3, 30 - recoil);
  c.lineTo(-7, 35 - recoil);
  c.closePath();
  c.fill();
  c.fillStyle = "#b79663";
  for (const y of [10, 18, 26]) c.fillRect(-2, y - recoil * 0.4, 8, 2);
  c.strokeStyle = "#20323c";
  c.lineWidth = 2;
  for (const x of [-5, 5]) {
    c.fillStyle = "#bac9cb";
    c.beginPath();
    c.arc(x, 37 - recoil, 2, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#14212a";
  c.beginPath();
  c.arc(0, 43 - recoil, 4, 0, Math.PI * 2);
  c.fill();
  if (b.warning > 0) {
    c.strokeStyle = "#ffca89";
    c.lineWidth = weak ? 2 : 3;
    c.globalAlpha = 0.7;
    c.beginPath();
    c.arc(0, 48, 9 + Math.sin(b.age * 22) * 2, 0, Math.PI * 2);
    c.stroke();
  }
  if (recoil > 0) {
    c.strokeStyle = "#fff0cf";
    c.lineWidth = 2;
    c.globalAlpha = recoil / 5;
    for (let i = 0; i < (weak ? 3 : 6); i++) {
      const a = i * Math.PI / 3;
      c.beginPath();
      c.moveTo(Math.cos(a) * 5, 48 + Math.sin(a) * 5);
      c.lineTo(Math.cos(a) * 13, 48 + Math.sin(a) * 13);
      c.stroke();
    }
  }
  c.restore();
}

// src/game/hostile-shot.ts
function hostileShot(c, b) {
  c.save();
  c.translate(b.x, b.y);
  c.rotate(-Math.atan2(b.vx, b.vy));
  c.fillStyle = "#ff7756";
  c.strokeStyle = "#1a171d";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-8, -7);
  c.lineTo(8, -7);
  c.lineTo(0, 12);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = "#ffead7";
  c.fillRect(-2, -5, 4, 8);
  c.restore();
}

// src/core/drift-supply.ts
var DRIFT_SUPPLY = { at: 16, shift: 70, turn1: 0.6, turn2: 1.8, settle: 3, opening: 0.45 };
var hasDriftSupply = (round) => round > 1 && (round - 1) % 3 === 1;
var ease = (t) => t * t * (3 - 2 * t);
function driftOffset(age) {
  if (!Number.isFinite(age) || age <= 0 || age >= DRIFT_SUPPLY.settle) return 0;
  if (age < DRIFT_SUPPLY.turn1) return DRIFT_SUPPLY.shift * ease(age / DRIFT_SUPPLY.turn1);
  if (age < DRIFT_SUPPLY.turn2) return DRIFT_SUPPLY.shift * (1 - 2 * ease((age - DRIFT_SUPPLY.turn1) / (DRIFT_SUPPLY.turn2 - DRIFT_SUPPLY.turn1)));
  return DRIFT_SUPPLY.shift * (ease((age - DRIFT_SUPPLY.turn2) / (DRIFT_SUPPLY.settle - DRIFT_SUPPLY.turn2)) - 1);
}
var driftVelocity = (age) => (driftOffset(age + 1 / 120) - driftOffset(age - 1 / 120)) * 60;

// src/game/drift-carrier.ts
function driftCarrier(c, x, y, age, weak) {
  c.save();
  c.translate(x, y);
  c.strokeStyle = "#a1becb";
  c.lineWidth = 2;
  c.fillStyle = "#314654";
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 43, 27);
    c.lineTo(side * 66, 40);
    c.lineTo(side * 69, 57);
    c.lineTo(side * 39, 54);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = "#b4c8d0";
    c.fillRect(side * 55 - 2, 43, 4, 7);
    c.fillStyle = "#314654";
  }
  const velocity = driftVelocity(age), power = Math.min(1, Math.abs(velocity) / 175);
  if (power > 0.02) {
    const side = -Math.sign(velocity);
    c.fillStyle = "#9defff";
    c.globalAlpha = weak ? 0.5 : 0.85;
    c.beginPath();
    c.moveTo(side * 66, 43);
    c.lineTo(side * (72 + (weak ? 9 : 18) * power), 48);
    c.lineTo(side * 66, 52);
    c.closePath();
    c.fill();
    if (!weak) {
      c.strokeStyle = "#dcfaff";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(side * 66, 47);
      c.lineTo(side * (74 + 10 * power), 48);
      c.stroke();
    }
  }
  c.restore();
}

// src/core/combos.ts
var FRACTURE = { hits: 3, direct: 2, splash: 0.75, radius: 120, cooldown: 0.35 };
var FRACTURE_LINE = { range: 320, width: 240, targets: 2, damage: 0.75 };
var fractureAugments = {
  "fracture-quick": { name: "\u53CC\u51FB\u7834\u6838", detail: "\u540C\u654C3\u6B21\u21922\u6B21\u5F15\u7206 \xB7 \u539F\u7206\u7834\u4E0E\u51B7\u5374\u4FDD\u7559", role: "\u6301\u7EED\u7784\u51C6\u91CD\u88C5\u4E0E\u9996\u9886\uFF0C\u66F4\u5FEB\u7834\u6838" },
  "fracture-line": { name: "\u8D2F\u901A\u51B2\u51FB", detail: "\u4E09\u51FB\u7206\u7834\u4FDD\u7559 \xB7 \u7A7F\u7532\u51FB\u7834\u4E5F\u7A7F\u9707", role: "\u51FB\u7834\u524D\u6392\uFF0C\u628A\u51B2\u51FB\u9001\u5411\u540E\u6392" }
};
var isFractureAugment = (v) => v === "fracture-quick" || v === "fracture-line";
var fractureProfile = (augment) => ({ ...FRACTURE, hits: augment === "fracture-quick" ? 2 : 3 });

// src/core/laser-chain.ts
var LASER_CHAIN = { hops: 2, range: 220, decay: 0.8, focus: 0.8 };
var photonAugments = {
  "photon-reach": { name: "\u8FDC\u94FE\u77E9\u9635", detail: "\u8DF3\u8DDD220\u2192300 \xB7 \u4E24\u8DF3\u2192\u4E09\u8DF3", role: "\u501F\u524D\u6392\u547D\u4E2D\uFF0C\u628A\u5149\u94FE\u9001\u5230\u5206\u6563\u654C\u7FA4" },
  "photon-focus": { name: "\u805A\u7126\u589E\u5E45", detail: "\u5B64\u7ACB\u805A\u80FD80%\u2192140% \xB7 \u539F\u4E24\u8DF3\u4FDD\u7559", role: "\u6301\u7EED\u7784\u51C6\u5B64\u7ACB\u7CBE\u82F1\u4E0E\u9996\u9886" }
};
var isPhotonAugment = (v) => v === "photon-reach" || v === "photon-focus";
function laserChainProfile(augment) {
  return { ...LASER_CHAIN, hops: augment === "photon-reach" ? 3 : LASER_CHAIN.hops, range: augment === "photon-reach" ? 300 : LASER_CHAIN.range, focus: augment === "photon-focus" ? 1.4 : LASER_CHAIN.focus };
}
function canLaserChain(build, arcStage) {
  return build.ranks.optical >= 3 && build.refinements.optical >= 1 && arcStage >= 2;
}

// src/core/battery.ts
var BATTERY = { at: 44.5, delay: 1.1, relayDelay: 1.1, y: 420, relayY: 560, hold: 4, opening: 0.1, secondOpening: 0.5, durability: 3 };
var batteryHolding = (b) => b.kind === "armor" && b.pattern === "battery" && b.age < BATTERY.hold;

// src/game/battery-mount.ts
function batteryMount(c, warning, offline, weak) {
  c.save();
  c.lineJoin = "round";
  for (const side of [-1, 1]) {
    c.fillStyle = "#263741";
    c.strokeStyle = "#b3bdba";
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(side * 31, 17);
    c.lineTo(side * 53, 31);
    c.lineTo(side * 59, 54);
    c.lineTo(side * 42, 56);
    c.lineTo(side * 40, 37);
    c.lineTo(side * 28, 30);
    c.closePath();
    c.fill();
    c.stroke();
    c.strokeStyle = "#687e89";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(side * 40, 55);
    c.lineTo(side * 62, 55);
    c.stroke();
    c.strokeStyle = offline ? "#77e7f5" : warning > 0 ? "#ffc579" : "#ad8a4e";
    c.lineWidth = weak ? 2 : 3;
    c.beginPath();
    c.moveTo(side * 36, 29);
    c.lineTo(side * 47, 38);
    c.lineTo(side * 49, 48);
    c.stroke();
  }
  c.restore();
}

// src/core/magnetic-field.ts
var MAGNETIC = { radius: 150, life: 1.2, pulses: [0.1, 0.5, 0.9], damage: 0.35, cooldown: 0.55, limit: 3 };
var MAGNETIC_REFINEMENT = { wideRadius: 240, wideDamage: 0.5, linkRange: 420 };

// src/core/build-tree.ts
var ballisticBranches = {
  penetrator: { name: "\u8D2F\u7A7F\u5F39\u82AF", detail: "\u9730\u5C04\u603B\u4F24\u5BB3+30% \xB7 \u6BCF\u9897\u8D2F\u7A7F2\u654C", role: "\u7784\u51C6\u7EB5\u5411\u654C\u5217\uFF0C\u6253\u7A7F\u524D\u6392" },
  fragment: { name: "\u7206\u7834\u5F39\u82AF", detail: "\u9730\u5C04\u603B\u4F24\u5BB3+30% \xB7 140\u8303\u56F450%\u6E85\u5C04", role: "\u7784\u51C6\u7D27\u51D1\u654C\u7FA4\uFF0C\u6269\u6563\u6E05\u573A" },
  ricochet: { name: "\u8DF3\u5F39\u5F39\u82AF", detail: "\u9730\u5C04\u603B\u4F24\u5BB3+30% \xB7 280\u8303\u56F455%\u8DF3\u5F39", role: "\u501F\u524D\u6392\u547D\u4E2D\uFF0C\u6253\u51FB\u5206\u6563\u4FA7\u7FFC" }
};
var BALLISTIC_FORK = { targets: 2, radius: 140, splash: 0.5 };
var RICOCHET = { range: 280, minSide: 80, damage: 0.55 };
var magneticAugments = {
  "field-wide": { name: "\u5E7F\u57DF\u78C1\u573A", detail: `\u539F\u4E09\u62CD\u4FDD\u7559 \xB7 \u534A\u5F84${MAGNETIC.radius}\u2192${MAGNETIC_REFINEMENT.wideRadius} \xB7 \u6BCF\u62CD${MAGNETIC_REFINEMENT.wideDamage * 100}%`, role: "\u6269\u5927\u6301\u7EED\u8986\u76D6\uFF0C\u8FCE\u63A5\u4FA7\u7FFC\u6765\u654C" },
  "field-link": { name: "\u5206\u6D41\u7535\u6865", detail: "\u539F\u4E09\u62CD\u4FDD\u7559 \xB7 \u6BCF\u62CD\u8FFD\u52A0\u4E00\u6B21\u573A\u5916\u8DF3\u51FB", role: `${MAGNETIC.radius}\u5916\u81F3${MAGNETIC_REFINEMENT.linkRange}\u5185\uFF0C\u4F18\u5148\u5F53\u524D\u84C4\u80FD\u5C04\u624B` }
};
var isMagneticAugment = (value) => value === "field-wide" || value === "field-link";
var SEEKER_BRIDGE = { range: 340 };
var electricBranches = {
  seeker: { name: "\u730E\u96BC\u7535\u6865", detail: "\u9996\u8DF3\u8303\u56F4340 \xB7 \u4F18\u5148\u84C4\u80FD\u5C04\u624B", role: "\u501F\u524D\u6392\u76EE\u6807\uFF0C\u8DF3\u51FB\u540E\u6392\u706B\u529B\u70B9" },
  spread: { name: "\u8FDE\u9501\u6269\u6563", detail: "\u8DF3\u7535\u8303\u56F4220 \xB7 \u989D\u5916\u591A\u8DF3\u4E00\u6B21", role: "\u4F18\u5148\u8FDE\u901A\u7FA4\u654C\uFF0C\u6269\u5927\u6E05\u573A\u8303\u56F4" },
  capacitor: { name: "\u7535\u5BB9\u84C4\u7206", detail: "\u8DF3\u7535\u8303\u56F4220 \xB7 \u540C\u654C3\u6B21\u76F4\u51FB\u8FFD\u52A0200%", role: "\u6301\u7EED\u7784\u51C6\u7CBE\u82F1\u4E0E\u9996\u9886\uFF0C\u5355\u4F53\u653E\u7535" }
};
var ELECTRIC_FORK = { hits: 3, damage: 2 };
var opticalBranches = {
  burn: { name: "\u707C\u70ED\u900F\u955C", detail: "\u95F4\u9694-25% \xB7 \u707C\u70E73\xD725% /0.3\u79D2", role: "\u5BF9\u91CD\u88C5\u4E0E\u9996\u9886\u6301\u7EED\u65BD\u538B" },
  relay: { name: "\u5206\u5149\u955C\u7EC4", detail: "\u95F4\u9694-25% \xB7 \u4FA7\u675F65%\u4F24\u5BB3 /\u6A2A\u8DDD180", role: "\u5BF9\u4FA7\u7FFC\u654C\u4EBA\u6269\u5927\u8986\u76D6" }
};
var OPTICAL_FORK = { burnTicks: 3, burnInterval: 0.3, burnDamage: 0.25, relayRange: 180, relayDamage: 0.65 };
var routes = ["ballistic", "electric", "optical"];
var tree = {
  ballistic: [
    { name: "\u9730\u5C04\u673A\u6784", detail: "\u5B89\u88C5T1\u9730\u5C04 \xB7 \u9730\u5C04\u4F24\u5BB3+10%" },
    { name: "\u91CD\u578B\u5F39\u82AF \xB7 \u9009\u62E9\u5206\u652F", detail: "\u603B\u4F24\u5BB3+30% \xB7 \u8D2F\u7A7F/\u7206\u7834/\u8DF3\u5F39" },
    { name: "\u96F7\u66B4\u9730\u5C04", detail: "\u9730\u5C04\u547D\u4E2D\u8FFD\u52A0\u4E00\u6B21\u8DF3\u7535 \xB7 \u9700\u96F7\u7535\u8DEF\u7EBF" }
  ],
  electric: [
    { name: "\u5BFC\u7535\u7EBF\u5708", detail: "\u5B89\u88C5T1\u7535\u5F27 \xB7 \u7535\u5F27\u591A\u8DF3\u4E00\u6B21" },
    { name: "\u8FDC\u8DDD\u7535\u6865 \xB7 \u9009\u62E9\u5206\u652F", detail: "\u8303\u56F4160\u2192220 \xB7 \u6269\u6563/\u84C4\u7206/\u730E\u96BC" },
    { name: "\u79BB\u5B50\u98CE\u66B4", detail: "\u4FDD\u755980%\u8DF3\u4F24 \xB7 \u6BCF6\u6B21\u6709\u6548\u7535\u51FB\u8303\u56F4\u653E\u7535" }
  ],
  optical: [
    { name: "\u805A\u7126\u955C\u7EC4", detail: "\u7ACB\u5373\u89E3\u9501\u6FC0\u5149 \xB7 \u6FC0\u5149\u4F24\u5BB3+15%" },
    { name: "\u5FAA\u73AF\u51B7\u5374 \xB7 \u9009\u62E9\u5206\u652F", detail: "\u95F4\u9694-25% \xB7 \u4E8C\u9009\u4E00\uFF1A\u707C\u70E7/\u5206\u5149" },
    { name: "\u6DF1\u7A7F\u5149\u675F", detail: "\u8D2F\u7A7F+2 \xB7 \u8FD8\u53EF\u7EC4\u5408\u68F1\u955C/\u7535\u5149\u8FDE\u9501" }
  ]
};
var BuildTree = class {
  ionAugment;
  fractureAugment;
  photonAugment;
  magneticAugment;
  ballisticBranch;
  opticalBranch;
  electricBranch;
  node(route, index, branch = route === "ballistic" ? this.ballisticBranch : route === "electric" ? this.electricBranch : this.opticalBranch) {
    if (route === "ballistic" && index === 1 && (branch === "penetrator" || branch === "fragment" || branch === "ricochet")) return ballisticBranches[branch];
    if (route === "electric" && index === 1 && (branch === "spread" || branch === "capacitor" || branch === "seeker")) return electricBranches[branch];
    return route === "optical" && index === 1 && (branch === "burn" || branch === "relay") ? opticalBranches[branch] : tree[route][index];
  }
  ranks = { ballistic: 0, electric: 0, optical: 0 };
  refinements = { ballistic: 0, electric: 0, optical: 0 };
  get baseSpent() {
    return Object.values(this.ranks).reduce((a, b) => a + b, 0);
  }
  get spent() {
    return this.baseSpent + Object.values(this.refinements).reduce((a, b) => a + b, 0);
  }
  next(route) {
    if (this.ranks[route] < 3) return this.node(route, this.ranks[route]);
    if (route === "optical" && this.refinements.optical === 0) return { name: "\u5149\u5B66\u7CBE\u8C031 \xB7 \u8FDE\u9501\u84DD\u56FE", detail: "\u4F24\u5BB3\u7CFB\u6570100%\u2192110% \xB7 \u914DT2\u7535\u5F27\u53EF\u7EC4\u5408" };
    const n = this.refinements[route], label = { ballistic: "\u5F39\u9053\u6B66\u5668", electric: "\u7535\u5F27\u70AE", optical: "\u6FC0\u5149\u4E0E\u68F1\u955C" }[route];
    return { name: `${label}\u7CBE\u8C03 ${n + 1}`, detail: `\u4F24\u5BB3\u7CFB\u6570 ${100 + n * 10}% \u2192 ${110 + n * 10}%` };
  }
  available(earned) {
    if (earned <= this.spent) return [];
    return routes.filter((r) => !(r === "ballistic" && this.ranks[r] === 2 && this.ranks.electric === 0));
  }
  choose(route, earned, branch) {
    if (!this.available(earned).includes(route)) return false;
    if (isIonAugment(branch)) {
      if (route !== "electric" || this.ranks.electric < 3 || this.refinements.electric < 2 || this.ionAugment) return false;
      this.ionAugment = branch;
    } else if (isFractureAugment(branch)) {
      if (route !== "ballistic" || this.ranks.ballistic < 3 || this.fractureAugment) return false;
      this.fractureAugment = branch;
    } else if (isPhotonAugment(branch)) {
      if (route !== "optical" || this.ranks.optical < 3 || this.refinements.optical < 1 || this.photonAugment) return false;
      this.photonAugment = branch;
    } else if (isMagneticAugment(branch)) {
      if (route !== "electric" || this.ranks.electric < 3 || this.magneticAugment) return false;
      this.magneticAugment = branch;
    } else if (branch !== void 0 && !(this.ranks[route] === 1 && (route === "ballistic" && (branch === "penetrator" || branch === "fragment" || branch === "ricochet") || route === "optical" && (branch === "burn" || branch === "relay") || route === "electric" && (branch === "spread" || branch === "capacitor" || branch === "seeker")))) return false;
    if (route === "ballistic" && this.ranks.ballistic === 1) {
      if (this.ballisticBranch) return false;
      this.ballisticBranch = branch === "ricochet" ? "ricochet" : branch === "fragment" ? "fragment" : "penetrator";
    }
    if (route === "electric" && this.ranks.electric === 1) {
      if (this.electricBranch) return false;
      this.electricBranch = branch === "seeker" ? "seeker" : branch === "capacitor" ? "capacitor" : "spread";
    }
    if (route === "optical" && this.ranks.optical === 1) {
      if (this.opticalBranch) return false;
      this.opticalBranch = branch === "relay" ? "relay" : "burn";
    }
    if (this.ranks[route] < 3) this.ranks[route]++;
    else this.refinements[route]++;
    return true;
  }
};

// src/core/support-profile.ts
function laserVisualBand(mastery = 0, opticalRank = 0) {
  return mastery >= 8 || opticalRank >= 3 ? 3 : opticalRank >= 2 ? 2 : 1;
}
function supportProfile(mastery = 0) {
  return {
    laserUnlocked: mastery >= 3,
    laserInterval: mastery >= 8 ? 1.8 : 3,
    laserDamage: 30,
    laserTargets: 4,
    refractionTargets: mastery >= 12 ? 2 : mastery >= 5 ? 1 : 0,
    refractionRange: 180,
    refractionDamage: 0.6
  };
}
function supportMilestone(mastery) {
  return { 3: "\u6FC0\u5149\u89E3\u9501", 5: "\u6298\u5C04\u89E3\u9501", 8: "\u6025\u901F\u6FC0\u5149\u8FDB\u5316", 12: "\u53CC\u91CD\u6298\u5C04\u8FDB\u5316" }[mastery];
}

// src/core/build-profile.ts
function builtWeapon(kind, stage, calibration, build) {
  const p = weaponProfile(kind, stage), rank = build.ranks;
  const refinement = 1 + 0.1 * build.refinements[kind === "arc" ? "electric" : "ballistic"];
  return {
    ...p,
    targets: kind === "scatter" && build.ballisticBranch === "penetrator" ? BALLISTIC_FORK.targets : p.targets,
    splashRadius: kind === "scatter" && build.ballisticBranch === "fragment" ? BALLISTIC_FORK.radius : p.splashRadius,
    damage: p.damage.map((n) => n * (1 + 0.5 * calibration) * refinement * (kind === "scatter" ? rank.ballistic >= 2 ? 1.3 : rank.ballistic >= 1 ? 1.1 : 1 : 1)),
    chainHops: kind === "arc" ? (p.chainHops ?? 0) + (rank.electric >= 1 ? 1 : 0) + (build.electricBranch === "spread" ? 1 : 0) : kind === "scatter" && rank.ballistic >= 3 ? 1 : p.chainHops
  };
}
function builtSupport(mastery, build) {
  const p = supportProfile(mastery), rank = build.ranks.optical;
  return {
    ...p,
    laserUnlocked: p.laserUnlocked || rank > 0,
    laserDamage: p.laserDamage * (rank > 0 ? 1.15 : 1) * (1 + 0.1 * build.refinements.optical),
    laserInterval: p.laserInterval * (rank >= 2 ? 0.75 : 1),
    laserTargets: p.laserTargets + (rank >= 3 ? 2 : 0),
    prism: rank >= 3 && build.ranks.ballistic >= 1
  };
}

// src/core/recipe-goal.ts
var recipes = {
  storm: { name: "\u96F7\u66B4\u9730\u5C04", effect: "\u9730\u5F39\u547D\u4E2D\u540E\u8FFD\u52A0\u4E00\u6B21\u8DF3\u7535", hint: "\u8FD1\u8DDD\u805A\u5F39\u4E0E\u5BC6\u96C6\u654C\u7FA4", color: "#b4ffb5" },
  prism: { name: "\u68F1\u955C\u6FC0\u5149", effect: "\u4E3B\u675F\u4FDD\u7559 \xB7 \u4E24\u4FA7\u5404\u8FFD\u52A045%\u4F24\u5BB3", hint: "\u6A2A\u79FB\u5BF9\u9F50\u4FA7\u675F\uFF0C\u6269\u5927\u6E05\u573A\u8986\u76D6", color: "#d7b1ff" },
  photon: { name: "\u7535\u5149\u8FDE\u9501", effect: "\u5168\u6B66\u5668\u76F4\u51FB \xB7 \u7FA4\u654C\u8DF3\u94FE / \u5355\u4F53\u805A\u80FD", hint: `${LASER_CHAIN.hops}\u8DF3${LASER_CHAIN.range}\u8303\u56F4 \xB7 \u8DF3\u4F2480%/64% \xB7 \u805A\u80FD80%`, color: "#a7e7ff" },
  fracture: { name: "\u88C2\u7532\u7206\u7834", effect: `\u540C\u654C${FRACTURE.hits}\u6B21\u7A7F\u7532\u547D\u4E2D\uFF1A\u989D\u5916${FRACTURE.direct * 100}%\u7206\u7834`, hint: `\u90BB\u654C${FRACTURE.splash * 100}% \xB7 \u8303\u56F4${FRACTURE.radius} \xB7 \u51B7\u5374${FRACTURE.cooldown}\u79D2`, color: "#ffca8b" },
  ion: { name: "\u79BB\u5B50\u98CE\u66B4", effect: `${ION_STORM.hits}\u6B21\u6709\u6548\u7535\u51FB\u5F15\u53D1\u8303\u56F4\u653E\u7535`, hint: `\u8303\u56F4${ION_STORM.radius} \xB7 ${ION_STORM.damage * 100}%\u4F24\u5BB3 \xB7 \u96F7\u7535\u7B2C\u4E09\u8282\u70B9`, color: "#96eaff" },
  magnetic: { name: "\u78C1\u66B4\u69B4\u5F39", effect: "\u7206\u88C2\u547D\u4E2D\u7559\u4E0B\u4E09\u62CD\u7535\u573A\uFF0C\u4F24\u5BB3\u540E\u7EED\u6765\u654C", hint: `${MAGNETIC.life}\u79D2 \xB7 \u8303\u56F4${MAGNETIC.radius} \xB7 \u6BCF\u62CD${MAGNETIC.damage * 100}% \xB7 \u6700\u591A3\u573A`, color: "#b3f3ff" }
};
var recipeIds = Object.keys(recipes);
function parseRecipeGoal(value) {
  return typeof value === "string" && Object.hasOwn(recipes, value) ? value : null;
}
var routeNames = { ballistic: "\u5F39\u9053", electric: "\u96F7\u7535", optical: "\u5149\u5B66" };
function recipeStatus(w, id) {
  const requirements = [];
  const route = (r, target) => requirements.push({ kind: "route", route: r, current: w.build.ranks[r], target, label: `${routeNames[r]}\u8DEF\u7EBF` });
  const weapon = (kind) => requirements.push({ kind: "weapon", weapon: kind, current: w.activeWeapons.includes(kind) ? w.weaponStage(kind) : 0, target: 2, label: weaponNames[kind] });
  if (id === "storm") {
    route("ballistic", 3);
    route("electric", 1);
  } else if (id === "prism") {
    route("optical", 3);
    route("ballistic", 1);
  } else if (id === "photon") {
    route("optical", 3);
    requirements.push({ kind: "refinement", route: "optical", current: w.build.refinements.optical, target: 1, label: "\u5149\u5B66\u7CBE\u8C03" });
    weapon("arc");
  } else if (id === "fracture") {
    weapon("pierce");
    weapon("blast");
  } else if (id === "magnetic") {
    weapon("blast");
    route("electric", 2);
  } else route("electric", 3);
  const missing = requirements.filter((r) => r.current < r.target);
  const need = missing.map((r) => r.kind === "weapon" ? r.current ? `${r.label}T${r.current}\u2192T${r.target}` : `\u83B7\u5F97${r.label}T${r.target}` : r.kind === "refinement" ? `${r.label}${r.target - r.current}\u6B21` : `${routeNames[r.route]}\u8FD8\u9700${r.target - r.current}\u70B9`).join(" \uFF0B ");
  const progress = requirements.map((r) => r.kind === "weapon" ? `${r.label} ${r.current ? "T" + r.current : "\u672A\u6301\u6709"}/T${r.target}` : `${r.label} ${Math.min(r.current, r.target)}/${r.target}`).join(" \uFF0B ");
  return { id, ...recipes[id], ...id === "ion" && w.build.ionAugment ? { hint: ionAugments[w.build.ionAugment].detail } : {}, ...id === "fracture" && w.build.fractureAugment ? { effect: `\u540C\u654C${fractureProfile(w.build.fractureAugment).hits}\u6B21\u7A7F\u7532\u547D\u4E2D\uFF1A\u989D\u5916200%\u7206\u7834`, hint: fractureAugments[w.build.fractureAugment].name + (w.build.fractureAugment === "fracture-line" ? " \xB7 \u51FB\u7834\u4E5F\u7A7F\u9707320/\u5BBD240/2\u654C75%" : " \xB7 \u539F\u6E85\u5C04\u4E0E0.35\u79D2\u51B7\u5374\u4FDD\u7559") } : {}, ...id === "magnetic" && w.build.magneticAugment ? { hint: magneticAugments[w.build.magneticAugment].detail } : {}, requirements, missing, ready: missing.length === 0, need, progress };
}
function recipeSupplyMatch(w, id, b) {
  if (!id || !b.active || !["crate", "pickup"].includes(b.kind) || !b.weaponKind) return false;
  const requirement = recipeStatus(w, id).missing.find((r) => r.kind === "weapon" && r.weapon === b.weaponKind);
  if (!requirement) return false;
  return b.refit ? requirement.current > 0 : b.stage > requirement.current;
}
function recipeRouteHint(w, id, route) {
  if (!id || !w.build.available(w.buildPoints).includes(route)) return null;
  const status = recipeStatus(w, id);
  if (status.ready) return { text: `\u76EE\u6807\xB7${status.name}\u5DF2\u6210\u5F62 \xB7 \u7EE7\u7EED\u5F3A\u5316`, advances: false };
  const affected = status.missing.find((r) => r.route === route && (r.kind === "route" ? w.build.ranks[route] < 3 : r.kind === "refinement" && w.build.ranks[route] >= 3));
  if (!affected) return { text: `\u76EE\u6807\u8FD8\u9700\uFF1A${status.need}`, advances: false };
  const completes = status.requirements.every((r) => r.current + (r === affected ? 1 : 0) >= r.target);
  return { text: completes ? `\u76EE\u6807\xB7${status.name}\uFF1A\u672C\u6B21\u5B8C\u6210\u6784\u7B51` : `\u76EE\u6807\xB7${status.name}\uFF1A${affected.label} ${affected.current}/${affected.target}\u2192${affected.current + 1}/${affected.target}`, advances: true };
}
function recipePerformance(w, id) {
  const ready = recipeStatus(w, id).ready;
  const count = id === "storm" ? w.stormLinks : id === "prism" ? w.prismHits : id === "photon" ? w.laserArcHits + w.laserFocusHits : id === "fracture" ? w.fractureBursts + w.fractureWaveHits : id === "magnetic" ? w.magneticHits + w.magneticLinkHits : w.ionBursts;
  const n = (v) => v >= 1e8 ? `${+(v / 1e8).toFixed(1)}\u4EBF` : v >= 1e4 ? `${+(v / 1e4).toFixed(1)}\u4E07` : `${v}`;
  const measured = id === "storm" ? `\u8DF3\u4F24${n(w.stormLinks)}\u6B21` : id === "prism" ? `\u4FA7\u675F\u547D\u4E2D${n(w.prismHits)}` : id === "photon" ? `\u94FE${n(w.laserArcHits)}/\u805A${n(w.laserFocusHits)}` : id === "fracture" ? w.build.fractureAugment === "fracture-line" ? `\u7206${n(w.fractureBursts)}/\u7A7F${n(w.fractureWaveHits)}` : `\u5F15\u7206${n(w.fractureBursts)}\u6B21` : id === "magnetic" ? `\u573A${n(w.magneticHits)}/${w.build.magneticAugment === "field-wide" ? "\u6269" + n(w.magneticWideHits) : "\u6865" + n(w.magneticLinkHits)}` : `\u653E\u7535${n(w.ionBursts)}${w.build.ionAugment ? " / " + (w.build.ionAugment === "ion-orb" ? "\u6838" + n(w.ionOrbHits) : "\u77DB" + n(w.ionSpearHits)) : "\u6B21"}`;
  return { ready, count, label: !ready ? "\u672A\u6210\u5F62" : count === 0 ? "\u5DF2\u5C31\u7EEA \xB7 \u672A\u89E6\u53D1" : measured };
}

// src/game/weapon-dossier.ts
var dossierWeapons = ["pulse", "scatter", "pierce", "blast", "arc"];
var weaponDossier = {
  pulse: { asset: "units.png", role: "\u6301\u7EED\u901F\u5C04 \xB7 \u96C6\u4E2D\u706B\u529B", strength: "\u5BF9\u51C6\u5355\u4E2A\u76EE\u6807\uFF0C\u8FDE\u7EED\u547D\u4E2D\u5FEB\u901F\u6E05\u7406\u3002", tradeoff: "\u5F39\u9053\u96C6\u4E2D\uFF0C\u6A2A\u6392\u654C\u4EBA\u9700\u8981\u79FB\u52A8\u7784\u51C6\u3002" },
  scatter: { asset: "scatter-player-v1.png", role: "\u8FD1\u8DDD\u805A\u5F39 \xB7 \u6247\u9762\u8986\u76D6", strength: "\u4E8C\u3001\u4E09\u9636\u9760\u8FD1\u76EE\u6807\u65F6\uFF0C\u591A\u9897\u5F39\u4E38\u96C6\u4E2D\u547D\u4E2D\u3002", tradeoff: "\u8FDC\u5904\u5F39\u4E38\u5206\u6563\uFF1B\u9760\u8FD1\u65F6\u4ECD\u8981\u907F\u5F00\u78B0\u649E\u3002" },
  pierce: { asset: "pierce-player-v2.png", role: "\u7EB5\u5217\u8D2F\u7A7F \xB7 \u4E00\u7EBF\u7A81\u7834", strength: "\u5BF9\u51C6\u7EB5\u5217\uFF0C\u4E09\u9636\u53EF\u8FDE\u7EED\u8D2F\u7A7F\u4E09\u4E2A\u654C\u4EBA\u3002", tradeoff: "\u95ED\u76FE\u76FE\u536B\u3001\u7BB1\u5B50\u548C\u6570\u5B57\u95E8\u4F1A\u622A\u4F4F\u5F39\u4E38\u3002" },
  blast: { asset: "blast-player-v1.png", role: "\u91CD\u70AE\u76F4\u51FB \xB7 \u5BC6\u96C6\u7206\u7834", strength: "\u547D\u4E2D\u654C\u4EBA\u540E\u7206\u70B8\uFF0C\u6CE2\u53CA\u9644\u8FD1\u654C\u4EBA\u3002", tradeoff: "\u5F00\u706B\u8F83\u6162\uFF1B\u6253\u7BB1\u5B50\u6216\u95E8\u4E0D\u4F1A\u89E6\u53D1\u7206\u70B8\u3002" },
  arc: { asset: "arc-player-v1.png", role: "\u524D\u65B9\u7D22\u654C \xB7 \u90BB\u654C\u63A5\u529B", strength: "\u9AD8\u901F\u7535\u5F39\u51FA\u819B\u65F6\u504F\u5411\u524D\u65B9\u8FD1\u654C\uFF0C\u547D\u4E2D\u518D\u8DF3\u7535\u3002", tradeoff: "\u6709\u9650\u504F\u8F6C\u3001\u4E0D\u8FFD\u8E2A\uFF1B\u7784\u51C6\u7BB1\u95E8\u65F6\u76F4\u5C04\uFF0C\u95ED\u76FE\u622A\u65AD\u7535\u94FE\u3002" }
};

// src/game/equipment-preview.ts
var number2 = (n) => n >= 1e8 ? `${+(n / 1e8).toFixed(1)}\u4EBF` : n >= 1e4 ? `${+(n / 1e4).toFixed(1)}\u4E07` : String(+n.toFixed(1));
function equipmentPreview(w, kind) {
  if (!w.activeWeapons.includes(kind)) return null;
  const stage = w.weaponStage(kind), calibration = w.weaponCalibration(kind), toTier = Math.min(3, stage + 1), toCalibration = calibration + Number(stage >= 3);
  const before = w.profileFor(kind), after = builtWeapon(kind, toTier, toCalibration, w.build), power = 1 + permanentPower(w.growth) / 100;
  const direct = (p) => p.damage.reduce((sum, n) => sum + n, 0) * p.rate * power;
  const view = { build: w.build, activeWeapons: w.activeWeapons, weaponStage: (k) => k === kind ? toTier : w.weaponStage(k) };
  const combinations = recipeIds.filter((id) => !recipeStatus(w, id).ready && recipeStatus(view, id).ready).map((id) => recipeStatus(view, id).name);
  const rate = before.rate === after.rate ? `${number2(after.rate)}\u8F6E/\u79D2` : `${number2(before.rate)}\u2192${number2(after.rate)}\u8F6E/\u79D2`;
  const mechanics = before.offsets.length !== after.offsets.length ? `\u6BCF\u8F6E${before.offsets.length}\u2192${after.offsets.length}\u53D1` : before.targets !== after.targets ? `\u8D2F\u7A7F${before.targets}\u2192${after.targets}\u654C` : before.splashRadius !== after.splashRadius ? `\u7206\u70B8\u8303\u56F4${before.splashRadius}\u2192${after.splashRadius}` : before.chainHops !== after.chainHops ? `\u8DF3\u7535${before.chainHops}\u2192${after.chainHops}\u6B21` : weaponDossier[kind].role.split(" \xB7 ")[0];
  return {
    kind,
    toTier,
    toCalibration,
    before,
    after,
    directBefore: direct(before),
    directAfter: direct(after),
    combinations,
    title: stage < 3 ? `${weaponNames[kind]} T${stage} \u2192 T${toTier}` : `${weaponNames[kind]} \xB7 \u4E13\u5C5E\u7CBE\u6821${toCalibration}`,
    detail: `\u5168\u5F39\u76F4\u4F24/\u79D2 ${number2(direct(before))} \u2192 ${number2(direct(after))}`,
    hint: combinations.length ? `\u65B0\u7EC4\u5408\uFF1A${combinations.join(" / ")}` : `${mechanics} \xB7 ${rate}`,
    color: weaponColors[kind]
  };
}

// src/core/calibration-visual.ts
var calibrationVisualBand = (n = 0) => !Number.isFinite(n) || n < 1 ? 0 : n >= 6 ? 3 : n >= 3 ? 2 : 1;

// src/game/calibration-light.ts
var turn = Math.PI * 2;
function path(c, points, width, color) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.stroke();
}
function calibrationShot(c, x, y, vx, vy, kind, band, age, weak) {
  if (!band) return;
  const color = weaponColors[kind], edge = 5 + band * 2;
  c.save();
  c.translate(x, y);
  c.rotate(Math.atan2(vx, -vy));
  c.globalCompositeOperation = "screen";
  c.globalAlpha = weak ? 0.5 : 0.72;
  c.lineCap = "round";
  if (kind === "pulse") for (let i = 0; i < (weak ? 1 : band); i++) {
    const yy = 8 + i * 10;
    path(c, [-edge, yy + 5, 0, yy, edge, yy + 5], weak ? 1 : 1.5, color);
  }
  else if (kind === "scatter") for (const side of [-1, 1]) path(c, [side * 4, 3, side * (9 + band * 2), 18, side * 5, 13], weak ? 1 : 1.5, color);
  else if (kind === "pierce") for (const side of [-1, 1]) {
    const e = 4 + band;
    path(c, [side * 3, -13, side * e, -6, side * e, 32 + band * 7, side * 3, 39 + band * 7], weak ? 1 : 1.6, color);
    if (!weak && band >= 2) {
      const yy = 6 + age * 7 % 1 * 26;
      path(c, [side * e, yy, side * e, yy + 7], 2, "#f6e6ff");
    }
  }
  else if (kind === "blast") {
    c.strokeStyle = color;
    c.lineWidth = weak ? 1 : 1.7;
    c.beginPath();
    c.ellipse(0, 2, 8 + band * 2, 10 + band * 3, 0, 0, turn);
    c.stroke();
    if (!weak) {
      const e = 12 + band * 2;
      path(c, [0, -13, e, 2, 0, 17, -e, 2, 0, -13], 1.3, "#ffdb9b");
    }
  } else {
    for (const side of [-1, 1]) {
      path(c, [0, -8, side * edge, 6, side * (edge - 3), 20, side * edge, 34], weak ? 1 : 1.5, color);
      if (!weak && band >= 2) path(c, [side * edge, 26, side * (edge - 4), 40, 0, 50], 1, "#d6ffb8");
    }
    if (band >= 2) {
      c.strokeStyle = "#d6ffb8";
      c.lineWidth = 1;
      for (let i = 0; i < (weak ? 1 : band - 1); i++) {
        c.beginPath();
        c.ellipse(0, 10 + i * 15, edge * 0.85, 2.5, 0, 0, turn);
        c.stroke();
      }
    }
  }
  if (!weak) path(c, [-2, -12, 2, -12], 1.4, "#f7fff3");
  c.restore();
}
function calibrationMount(c, x, y, size, kind, band, pulse, weak) {
  if (!band) return;
  const color = weaponColors[kind], e = 16 + band * 2;
  c.save();
  c.translate(x, y);
  c.scale(size / 100, size / 100);
  c.lineJoin = "round";
  c.lineCap = "round";
  const shape = (side) => kind === "scatter" ? [side * 12, 16, side * 29, 5, side * 34, -14] : kind === "pierce" ? [side * e, 17, side * e, -27, side * (e - 6), -32] : kind === "arc" ? [side * e, 16, side * (e - 4), 2, side * e, -12, side * (e - 4), -22] : kind === "blast" ? [side * 12, 14, side * 25, 8, side * 25, -8, side * 12, -14] : [side * e, 16, side * e, -9, side * (e - 7), -15];
  for (const side of [-1, 1]) {
    path(c, shape(side), 9, "#101a23");
    path(c, shape(side), 6, "#485d68");
    path(c, shape(side), 1.4, "#d4e1db");
  }
  c.globalCompositeOperation = "screen";
  c.globalAlpha = (weak ? 0.4 : 0.55) + Math.max(0, Math.min(1, pulse)) * 0.3;
  for (const side of [-1, 1]) for (let i = 0; i < band; i++) {
    const yy = 12 - i * 8;
    path(c, [side * (e - 3), yy + 2, side * (e + 3), yy - 1], weak ? 1.7 : 2.2, color);
  }
  if (!weak && pulse > 0) {
    c.globalAlpha = pulse * 0.65;
    for (const side of [-1, 1]) path(c, [side * (e + 4), -5, side * (e + 8), -11 - band * 2], 1.4, color);
  }
  c.restore();
}

// src/core/opening-plan.ts
var openingWeapons = ["scatter", "pierce", "blast", "arc"];
function isOpeningWeapon(value) {
  return openingWeapons.some((kind) => kind === value);
}
var openingHints = { scatter: "\u5F39\u9053\u8DEF\u7EBF\uFF1A\u8D2F\u7A7F / \u7206\u7834 / \u8DF3\u5F39", pierce: "T2\u7206\u88C2 \u2192 \u88C2\u7532\u7206\u7834", blast: "\u96F7\u7535\u4E8C\u9636 \u2192 \u78C1\u66B4\u69B4\u5F39", arc: "\u5149\u5B66\u4E09\u9636\uFF0B\u7CBE\u8C03 \u2192 \u7535\u5149\u8FDE\u9501" };

// src/core/battle-plan.ts
var nextBattlePlan = (value) => (value + 1) % 3;
var battleIndex = (round, plan = 0) => round <= 1 ? 0 : (Math.floor((Math.max(1, round) - 1) / 3) + plan) % 3;
var names = [["\u96C6\u7FA4\u7A81\u88AD", "\u54E8\u673A\u62A4\u822A", "\u53CC\u7EBF\u5939\u51FB"], ["\u53CC\u7FFC\u7A7F\u63D2", "\u4EA4\u9519\u54E8\u9635", "\u730E\u88AD\u7EB5\u6DF1"], ["\u91CD\u88C5\u6DF7\u7F16", "\u7EB5\u5217\u63A8\u8FDB", "\u9519\u4F4D\u91CD\u7532"]];
var battleBrief = (round, plan = 0) => round <= 1 ? "\u521D\u59CB\u7A81\u56F4" : names[(Math.max(1, Math.floor(round)) - 1) % 3][battleIndex(round, plan)];
var sideBattlePreview = (plan) => `${battleBrief(2, plan)} \xB7 ${["\u8F7B\u673A\u4E0E\u51B2\u950B", "\u53CC\u54E8\u4EA4\u66FF", "\u7CBE\u82F1\u4E0E\u51B2\u950B"][plan]}`;

// src/game/boss-destruction.ts
var BOSS_VISUAL = { width: 360, height: 280, offsetY: 0 };
var BossDestruction = class _BossDestruction {
  constructor(x, y, variant = 0) {
    this.x = x;
    this.y = y;
    this.variant = variant;
  }
  x;
  y;
  variant;
  age = 0;
  next = 0;
  static lifetime = 1.35;
  static bursts = [
    { at: 0, x: -112, y: 90, size: 85 },
    { at: 0.16, x: 112, y: 90, size: 85 },
    { at: 0.34, x: 0, y: -25, size: 92 },
    { at: 0.56, x: 0, y: 25, size: 140 }
  ];
  advance(dt) {
    this.age += Math.max(0, dt);
    const due = [];
    while (this.next < _BossDestruction.bursts.length && _BossDestruction.bursts[this.next].at <= this.age) {
      const burst = _BossDestruction.bursts[this.next++];
      due.push({ x: this.x + burst.x, y: this.y + burst.y, size: burst.size });
    }
    return due;
  }
  get finished() {
    return this.age >= _BossDestruction.lifetime;
  }
  get pieces() {
    const t = Math.max(0, this.age - 0.12);
    const alpha = Math.max(0, 1 - Math.max(0, this.age - 0.35) / (_BossDestruction.lifetime - 0.35));
    return [
      { from: 0, width: 0.32, dx: -85 * t, dy: 48 * t, angle: -0.35 * t, alpha },
      { from: 0.32, width: 0.36, dx: 0, dy: 30 * t, angle: 0.04 * t, alpha },
      { from: 0.68, width: 0.32, dx: 85 * t, dy: 48 * t, angle: 0.35 * t, alpha }
    ];
  }
};

// src/game/gate-machine.ts
function pairedGate(gate, bodies) {
  return gate.row > 0 && bodies.some((b) => b !== gate && b.active && b.kind === "gate" && b.row === gate.row);
}
function gatePanelBlocked(gate, bodies, mixed) {
  return bodies.some((b) => b.active && b.kind in C.enemies && Math.abs(b.x - gate.x) < gate.width / 2 + Math.max(80, b.kind === "boss" ? BOSS_VISUAL.width / 2 : b.width * 0.84) && Math.abs(b.y + (b.kind === "boss" ? BOSS_VISUAL.offsetY : 0) - gate.y) < (mixed ? 82 : 54) + Math.max(84, b.kind === "boss" ? BOSS_VISUAL.height / 2 : b.height * 0.84) + 40);
}
function gateMachine(c, image, b, mixed, pulse, weak, paired = false) {
  const impact = clamp(b.hit / 0.07, 0, 1), kick = Math.sin(clamp(pulse, 0, 1) * Math.PI) * (weak ? 0.6 : 1.7);
  const width = b.width + (paired ? 8 : 72) + kick * 2, height = paired ? mixed ? 208 : 152 : mixed ? 224 : 168, left2 = b.x - width / 2, top = b.y - height / 2;
  const sx = [0, image.width * 0.17, image.width * 0.83, image.width], sy = [0, image.height * 0.18, image.height * 0.82, image.height];
  const capX = paired ? 32 : 42, capY = paired ? 18 : 24;
  const dx = [left2, left2 + capX, left2 + width - capX, left2 + width], dy = [top, top + capY, top + height - capY, top + height];
  c.save();
  c.fillStyle = "#0005";
  c.beginPath();
  c.ellipse(b.x + 4, b.y + height * 0.32, width * 0.42, 13, 0, 0, Math.PI * 2);
  c.fill();
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) if (row !== 1 || col !== 1) c.drawImage(image, sx[col], sy[row], sx[col + 1] - sx[col], sy[row + 1] - sy[row], dx[col], dy[row], dx[col + 1] - dx[col], dy[row + 1] - dy[row]);
  const charge = clamp(b.energy / C.thresholds[C.thresholds.length - 1], 0, 1), color = b.rewardKind === "power" ? "#68e8ff" : "#ffd28a";
  for (const side of [-1, 1]) {
    const x = b.x + side * (width / 2 - (paired ? 15 : 20));
    c.fillStyle = "#091820";
    c.fillRect(x - 3.5, b.y - 44, 7, 88);
    for (let cell = 0; cell < 8; cell++) {
      c.fillStyle = charge > cell / 8 ? color : "#34434a";
      c.fillRect(x - 2, b.y + 35 - cell * 10, 4, 7);
    }
    if (impact > 0 || pulse > 0) {
      c.save();
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = (weak ? 0.35 : 0.65) * Math.max(impact, pulse);
      c.strokeStyle = color;
      c.lineWidth = weak ? 1.5 : 2.5;
      c.beginPath();
      c.moveTo(x, b.y - 48);
      c.lineTo(x, b.y + 48);
      c.stroke();
      if (!weak && pulse > 0) {
        c.lineWidth = 1.5;
        for (const end of [-1, 1]) {
          const y = b.y + end * (height / 2 - 14);
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x - side * (8 + kick * 3), y - end * 6);
          c.stroke();
        }
      }
      c.restore();
    }
  }
  c.restore();
}

// src/game/magnetic-light.ts
function magneticLight(c, f, weak) {
  const fade = Math.min(1, f.age / 0.05, (MAGNETIC.life - f.age) / 0.25), r = f.radius ?? MAGNETIC.radius;
  const beat = Math.max(0, ...MAGNETIC.pulses.map((t) => 1 - Math.abs(f.age - t) / 0.16));
  c.save();
  c.beginPath();
  c.rect(0, C.playerShotTop, C.width, C.playerY - C.playerShotTop);
  c.clip();
  c.translate(f.x, f.y);
  c.globalAlpha = fade * (weak ? 0.42 : 0.72);
  const glow2 = c.createRadialGradient(0, 0, 12, 0, 0, r);
  glow2.addColorStop(0, "#74e5ff12");
  glow2.addColorStop(0.65, "#59bfff09");
  glow2.addColorStop(1, "#59bfff00");
  c.fillStyle = glow2;
  c.fillRect(-r, -r, r * 2, r * 2);
  c.lineWidth = weak ? 1.5 : 2;
  c.strokeStyle = "#60b9cf";
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + 0.04 * f.age;
    c.beginPath();
    c.arc(0, 0, r - 5, a + 0.06, a + 0.73);
    c.stroke();
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.fillStyle = "#d3c992";
    c.fillRect(-7, -2, 10, 4);
    c.restore();
  }
  c.strokeStyle = "#b8f9ff";
  c.globalAlpha *= 0.45 + 0.55 * beat;
  const count = weak ? 3 : 6;
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count + f.id * 0.7 + f.age * 0.35;
    c.beginPath();
    for (let j = 0; j < 6; j++) {
      const d = (25 + j * 21) * r / MAGNETIC.radius, angle = a + Math.sin(j * 3 + f.id + Math.floor(f.age * 18)) * 0.13;
      const x = Math.cos(angle) * d, y = Math.sin(angle) * d;
      j ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
  }
  c.beginPath();
  c.arc(0, 0, 22 + beat * 20, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

// src/core/sweeper.ts
var SWEEPER = { speed: 240, upperY: 400, lowerY: 560, centerY: 800, opening: 0.1 };
function sweeperDirection(b) {
  return (b.kind === "drone" || b.kind === "armor" || b.kind === "elite") && b.pattern === "sweep" ? Math.sign(b.lane - b.x) : 0;
}

// src/game/sweeper-light.ts
function sweeperLight(c, direction, age, weak, edge = 25) {
  if (!direction) return;
  c.save();
  c.globalCompositeOperation = "lighter";
  for (const y of [-20, 0, 20]) {
    const length = (weak ? 12 : 20) + Math.sin(age * 35 + y) ** 2 * 8;
    c.globalAlpha = weak ? 0.45 : 0.75;
    c.fillStyle = "#61cfff";
    c.beginPath();
    c.moveTo(-direction * edge, y - 4);
    c.lineTo(-direction * (edge + 9 + length), y + Math.sin(age * 40) * 2);
    c.lineTo(-direction * edge, y + 4);
    c.fill();
    c.globalAlpha = weak ? 0.7 : 1;
    c.strokeStyle = "#e8fdff";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-direction * edge, y);
    c.lineTo(-direction * (edge + 13), y);
    c.stroke();
  }
  c.restore();
}

// src/game/ricochet-light.ts
function ricochetLight(c, x, y, tx, ty, life, weak) {
  if (life <= 0) return;
  const alpha = Math.min(1, life / 0.1), age = 0.2 - life, dx = tx - x, dy = ty - y, length = Math.hypot(dx, dy);
  if (length < 1) return;
  const nx = -dy / length, ny = dx / length;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = alpha;
  c.lineCap = "round";
  const segment2 = (width, color) => {
    c.lineWidth = width;
    c.strokeStyle = color;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(tx, ty);
    c.stroke();
  };
  if (!weak) segment2(9, "#efad3244");
  segment2(weak ? 2 : 3, "#ffc35b");
  segment2(1, "#fff2c6");
  c.strokeStyle = "#ffe3a4";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, y + 18);
  c.lineTo(x, y);
  c.lineTo(x + dx / length * 22, y + dy / length * 22);
  c.stroke();
  for (const [px, py] of [[x, y], [tx, ty]]) {
    const reach = 7 + age * 48;
    c.strokeStyle = "#ffe2a0";
    c.lineWidth = weak ? 1 : 1.5;
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(px + nx * side * 3, py + ny * side * 3);
      c.lineTo(px + nx * side * reach - dx / length * reach * 0.5, py + ny * side * reach - dy / length * reach * 0.5);
      c.stroke();
    }
  }
  if (!weak) {
    c.strokeStyle = "#fff5d3";
    c.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) {
      const t = Math.min(1, age * 4 + i * 0.3), px = x + dx * t, py = y + dy * t;
      c.beginPath();
      c.moveTo(px - nx * 3, py - ny * 3);
      c.lineTo(px + dx / length * 9, py + dy / length * 9);
      c.lineTo(px + nx * 3, py + ny * 3);
      c.stroke();
    }
  }
  c.restore();
}

// src/core/rebound-charger.ts
var REBOUND = { lead: 0.35, firstWarning: 0.7, firstDash: 0.65, turnWarning: 0.65, approach: 100, turnSpeed: 80, dashSpeed: 380, lateralSpeed: 260 };
function reboundState(b) {
  const firstAt = REBOUND.lead + REBOUND.firstWarning, turnAt = firstAt + REBOUND.firstDash, returnAt = turnAt + REBOUND.turnWarning;
  const phase = b.age < REBOUND.lead - 1e-9 ? "approach" : b.age < firstAt - 1e-9 ? "charge" : b.age < turnAt - 1e-9 ? "inward" : b.age < returnAt - 1e-9 ? "turn" : "return";
  const dashing = phase === "inward" || phase === "return", origin = b.reboundOrigin ?? b.x;
  return {
    phase,
    dashing,
    warning: phase === "charge" ? firstAt - b.age : phase === "turn" ? returnAt - b.age : 0,
    speed: dashing ? REBOUND.dashSpeed : phase === "turn" ? REBOUND.turnSpeed : REBOUND.approach,
    destination: phase === "return" ? origin : b.lane,
    direction: Math.sign(b.lane - origin) * (phase === "turn" || phase === "return" ? -1 : 1)
  };
}

// src/game/rebound-light.ts
function reboundLight(c, b, weak) {
  if (!b.active) return;
  const state = reboundState(b), turn3 = state.phase === "turn";
  c.save();
  c.translate(b.x, b.y);
  c.globalCompositeOperation = "lighter";
  c.strokeStyle = turn3 ? "#ffb59b" : "#a7edff";
  c.lineWidth = weak ? 1 : 2;
  c.globalAlpha = 0.65;
  if (b.warning > 0) {
    for (let i = 0; i < (turn3 ? 2 : 1); i++) {
      c.beginPath();
      c.ellipse(0, 0, 43 + i * 8, 49 + i * 7, 0, 0, Math.PI * 2);
      c.stroke();
    }
  }
  const d = state.direction;
  if (d) {
    c.beginPath();
    c.moveTo(d * 34, -8);
    c.lineTo(d * 44, 0);
    c.lineTo(d * 34, 8);
    c.stroke();
  }
  if (state.dashing) {
    c.strokeStyle = "#a7edff";
    c.lineWidth = weak ? 2 : 4;
    for (const x of [-18, 18]) {
      c.beginPath();
      c.moveTo(x, 35);
      c.lineTo(x - d * 8, weak ? 52 : 65);
      c.stroke();
    }
  }
  c.restore();
}

// src/game/build-receipt.ts
function buildReceiptPosition(w, preferBottom = false) {
  const lockedBottom = w.bodies.some((b) => b.active && (b.kind === "boss" || b.bountyRound !== void 0));
  const candidates = lockedBottom ? [1180] : preferBottom ? [1180, 240] : [240, 1180];
  for (const top of candidates) {
    const bottom = top + (top === 1180 ? 88 : 104);
    const blockedBody = w.bodies.some((b) => {
      if (!b.active) return false;
      const boss = b.kind === "boss";
      const y = b.y + (boss ? BOSS_VISUAL.offsetY : 0);
      const halfWidth = boss ? BOSS_VISUAL.width / 2 : Math.max(80, b.width * 0.84);
      const halfHeight = boss ? BOSS_VISUAL.height / 2 : Math.max(84, b.height * 0.8);
      return b.x + halfWidth + 20 >= 58 && b.x - halfWidth - 20 <= 662 && y + halfHeight + 70 >= top && y - halfHeight - 70 <= bottom;
    });
    const blockedBullet = w.bullets.some((b) => b.active && b.hostile && b.x + 14 >= 58 && b.x - 14 <= 662 && b.y + 18 >= top && b.y - 18 <= bottom);
    if (!blockedBody && !blockedBullet) return top;
  }
  return null;
}

// src/core/interceptor.ts
var INTERCEPTOR = { opening: 0.15, wingWarning: 0.75, coreWarning: 0.65, between: 0.25, recovery: 1.8, wingOffset: 52, wingVx: 90, wingVy: 320, coreVy: 360, coreSpacing: 0.15 };
function interceptorMuzzles(b) {
  const y = b.y + b.height / 2;
  return b.burst ? [{ x: b.x, y }] : [-1, 1].map((side) => ({ x: b.x + side * INTERCEPTOR.wingOffset, y }));
}

// src/game/interceptor-light.ts
function interceptorLight(c, b, weak) {
  if ((b.empRemaining ?? 0) > 0) return;
  const elapsed = b.age - (b.interceptFiredAt ?? -10), flash = elapsed >= 0 && elapsed < 0.16;
  const charging = b.warning > 0;
  if (!charging && !flash) return;
  const beat = flash ? b.interceptFireBeat ?? 0 : b.burst;
  const mounts = interceptorMuzzles({ ...b, burst: beat });
  const progress = flash ? 1 - elapsed / 0.16 : 1 - Math.max(0, b.timer) / (beat ? INTERCEPTOR.coreWarning : INTERCEPTOR.wingWarning);
  c.save();
  c.globalCompositeOperation = "lighter";
  for (const m of mounts) {
    const radius = flash ? 12 + progress * 10 : 7 + progress * 6;
    if (!weak) {
      c.globalAlpha = flash ? 0.4 * progress : 0.12 + progress * 0.15;
      c.fillStyle = beat ? "#ff705d" : "#ffc56c";
      c.beginPath();
      c.arc(m.x, m.y, radius + 7, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = flash ? progress : 0.6 + progress * 0.3;
    c.strokeStyle = beat ? "#ff947b" : "#ffe1a7";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(m.x, m.y, radius, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = "#fff3d3";
    c.beginPath();
    c.arc(m.x, m.y, flash ? 4 : 2 + progress * 2, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// src/core/boss-counter.ts
var BOSS_COUNTER = { health: 0.5, lead: 0.15, warning: 1.1, recovery: 1.8, vy: 480, vx: [-180, 0, 180] };
function counterCharge(b) {
  return b.attack === 4 && b.warning > 0 ? Math.max(0, Math.min(1, 1 - b.timer / BOSS_COUNTER.warning)) : 0;
}
function counterMuzzles(b) {
  const [x, y] = b.bossVariant === 1 ? [120, 90] : b.bossVariant === 2 ? [76, 76] : [96, 110];
  return [{ x: b.x - x, y: b.y + y }, { x: b.x + x, y: b.y + y }];
}
function counterAttack(variant, cycle) {
  const phrase = variant === 1 ? [2, 4, 1, 4] : variant === 2 ? [3, 4, 3, 0] : [4, 0, 4, 1];
  return phrase[(cycle % 4 + 4) % 4];
}

// src/game/boss-heat-light.ts
function bossHeatLight(c, b, weak) {
  c.save();
  c.globalCompositeOperation = "lighter";
  const heat = 0.65 + 0.15 * Math.sin(b.age * 13), charging = b.attack === 4 && b.warning > 0;
  const charge = counterCharge(b);
  const flash = b.counterShotAge === void 0 ? 0 : Math.max(0, 1 - (b.age - b.counterShotAge) / 0.16);
  const color = b.bossVariant === 1 ? "#9aefff" : "#ffc284", coreY = b.y + (b.bossVariant === 1 ? -14 : b.bossVariant === 2 ? -52 : -2);
  c.globalAlpha = weak ? 0.55 : 0.8;
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(b.x, coreY, 17, 0, Math.PI * 2);
  c.stroke();
  for (const muzzle of counterMuzzles(b)) {
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.globalAlpha = heat * (weak ? 0.45 : 0.75);
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(muzzle.x - 9, muzzle.y - 37 + i * 6);
      c.lineTo(muzzle.x + 9, muzzle.y - 39 + i * 6);
      c.stroke();
    }
    if (charging || flash > 0) {
      c.globalAlpha = Math.min(1, 0.3 + charge * 0.65 + flash);
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(muzzle.x, muzzle.y, 8 + charge * 8 + flash * 9, -b.age * 4, Math.PI * 1.6 - b.age * 4);
      c.stroke();
      c.fillStyle = "#fff4d8";
      c.beginPath();
      c.arc(muzzle.x, muzzle.y, 2 + charge * 2 + flash * 3, 0, Math.PI * 2);
      c.fill();
    }
    if (!weak) {
      c.globalAlpha = 0.25 + charge * 0.2 + flash * 0.3;
      c.strokeStyle = color;
      c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const t = (b.age * 2 + i / 3) % 1, side = i % 2 ? 1 : -1;
        c.beginPath();
        c.moveTo(muzzle.x + side * 12, muzzle.y - 28 - t * 8);
        c.lineTo(muzzle.x + side * (15 + t * 12), muzzle.y - 36 - t * 23);
        c.stroke();
      }
    }
  }
  c.restore();
}

// src/core/build-proof.ts
var buildProofs = {
  storm: { name: "\u96F7\u66B4\u9730\u5C04", goal: 18, unit: "\u8DF3\u7535", detail: "30\u79D2\u8DF3\u753518\u6B21 \xB7 \u7784\u51C6\u7D27\u7FA4" },
  prism: { name: "\u68F1\u955C\u6FC0\u5149", goal: 6, unit: "\u4FA7\u675F", detail: "30\u79D2\u4FA7\u675F\u547D\u4E2D6\u6B21 \xB7 \u5BF9\u9F50\u4FA7\u7FFC" },
  fracture: { name: "\u88C2\u7532\u7206\u7834", goal: 4, unit: "\u5F15\u7206", detail: "30\u79D2\u5F15\u72064\u6B21 \xB7 \u96C6\u4E2D\u7A7F\u7532" },
  photon: { name: "\u7535\u5149\u8FDE\u9501", goal: 4, unit: "\u8DF3\u4F24", detail: "30\u79D2\u5149\u94FE\u8DF3\u4F244\u6B21 \xB7 \u7784\u51C6\u9635\u5FC3" },
  ricochet: { name: "\u8DF3\u5F39\u4FA7\u51FB", goal: 12, groups: 2, unit: "\u4FA7\u51FB", detail: "30\u79D2\u8DF3\u5F3912\u6B21 \xB7 \u547D\u4E2D2\u6279\u7CBE\u82F1" },
  ion: { name: "\u79BB\u5B50\u98CE\u66B4", goal: 6, unit: "\u547D\u4E2D", detail: "30\u79D2\u653E\u7535\u547D\u4E2D6\u6B21 \xB7 \u7784\u51C6\u9635\u5FC3" },
  magnetic: { name: "\u78C1\u66B4\u7CBE\u7814", goal: 6, groups: 2, unit: "\u6709\u6548\u547D\u4E2D", detail: "30\u79D2\u7CBE\u7814\u547D\u4E2D6\u6B21 \xB7 \u547D\u4E2D2\u6279\u5F3A\u5316\u7CBE\u82F1" }
};
function requiredProofGroups(kind) {
  const proof = buildProofs[kind];
  return "groups" in proof ? proof.groups : 0;
}
var MAGNETIC_PROOF = { durability: 2 };
var PROOF_WAVES = { groups: 6, spacing: 5, retry: 0.5 };
function proofFormation(kind) {
  if (kind === "magnetic") return [{ kind: "elite", x: 220, y: 380, pattern: "fan" }, { kind: "elite", x: 430, y: 380, pattern: "fan" }];
  if (kind === "ricochet") return [{ kind: "elite", x: 230, y: 380, pattern: "fan" }, { kind: "elite", x: 490, y: 380, pattern: "fan" }];
  if (kind === "prism") return [{ kind: "armor", x: 215, y: 420 }, { kind: "elite", x: 360, y: 420 }, { kind: "armor", x: 505, y: 420 }];
  if (kind === "fracture") return [{ kind: "elite", x: 360, y: 500 }, { kind: "armor", x: 360, y: 330 }, { kind: "drone", x: 520, y: 420 }];
  return [{ kind: "elite", x: 360, y: 500 }, { kind: "armor", x: 250, y: 430 }, { kind: "armor", x: 470, y: 430 }];
}

// src/game/ion-storm-light.ts
function ionChargeLight(c, x, y, hits, augment) {
  c.save();
  c.translate(x, y);
  c.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    c.strokeStyle = i < hits ? "#b3ffe2" : "#263d45";
    c.beginPath();
    c.arc(0, 0, 25, -Math.PI + i * Math.PI / 3, -Math.PI + (i + 0.65) * Math.PI / 3);
    c.stroke();
  }
  if (augment) {
    c.fillStyle = "#162f3c";
    c.strokeStyle = "#b3e8ed";
    c.lineWidth = 2;
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(side * 22, 18);
      c.lineTo(side * 36, 10);
      c.lineTo(side * 34, -20);
      c.lineTo(side * 24, -30);
      c.closePath();
      c.fill();
      c.stroke();
      c.strokeStyle = augment === "ion-orb" ? "#a1ffe5" : "#bdd6ff";
      c.beginPath();
      c.moveTo(side * 29, 4);
      c.lineTo(side * (augment === "ion-orb" ? 29 : 38), -22);
      c.stroke();
    }
  }
  c.restore();
}
function ionStormLight(c, x, y, radius, age, weak) {
  if (age < 0 || age >= 1) return;
  c.save();
  c.beginPath();
  c.rect(0, C.playerShotTop, C.width, C.playerY - C.playerShotTop);
  c.clip();
  c.translate(x, y);
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = (1 - age) * (weak ? 0.65 : 0.9);
  c.lineCap = "round";
  const r = radius * (0.25 + 0.75 * age);
  for (let layer = 0; layer < (weak ? 1 : 3); layer++) {
    const size = r * (1 - layer * 0.18), turn3 = age * (layer % 2 ? -2 : 2) + layer;
    c.strokeStyle = layer === 1 ? "#eaffff" : "#7dffd9";
    c.lineWidth = layer === 0 && !weak ? 4 : 1.5;
    for (let sector = 0; sector < 3; sector++) {
      const start = turn3 + sector * Math.PI * 2 / 3;
      c.beginPath();
      for (let j = 0; j <= 10; j++) {
        const a = start + j * 0.13, rr = size * (j % 2 ? 0.95 : 1.04), px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        if (j === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
    }
  }
  c.strokeStyle = "#f0fffa";
  c.lineWidth = weak ? 1.5 : 3;
  c.beginPath();
  c.moveTo(-9, -32 * (1 - age));
  c.lineTo(8, -12);
  c.lineTo(-7, 7);
  c.lineTo(11, 29 * (1 - age));
  c.stroke();
  if (!weak) for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + age, inner = r * 0.68, outer = Math.min(radius, r + 14);
    c.strokeStyle = i % 2 ? "#b6f6ff" : "#82ffc0";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    c.lineTo(Math.cos(a + 0.08) * r, Math.sin(a + 0.08) * r);
    c.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    c.stroke();
  }
  c.restore();
}

// src/game/drop-light.ts
function dropLight(c, x, y, remaining, weak) {
  if (remaining <= 0) return;
  const f = Math.min(1, remaining), r = 32 + (1 - f) * 16;
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = Math.min(1, f * 3) * (weak ? 0.55 : 0.8);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + (1 - f) * 0.5;
    c.strokeStyle = i % 2 ? "#b6d2ff" : "#8bffe3";
    c.lineWidth = weak ? 2 : 3;
    c.beginPath();
    c.arc(0, 0, r, a, a + 0.9);
    c.stroke();
  }
  c.strokeStyle = "#d8fbff";
  c.lineWidth = 1.5;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 22, -55 * f - 20);
    c.lineTo(side * 28, -28);
    c.lineTo(side * 20, -12);
    c.stroke();
  }
  c.restore();
}

// src/core/projectile-pressure.ts
function enemyProjectileScale(round) {
  return 1 + Math.min(3, Math.max(0, Math.floor(round) - 1)) * 0.1;
}

// src/game/refit-label.ts
function refitLabel(w, kind) {
  const stage = w.weaponStage(kind), calibration = w.weaponCalibration(kind);
  if (stage < 3) return `T${stage} \u2192 T${stage + 1}`;
  const power = 1 + permanentPower(w.growth) / 100;
  const number4 = (value) => value >= 1e3 ? `${+(value / 1e3).toFixed(1)}k` : String(+value.toFixed(1));
  const before = w.profileFor(kind).damage.reduce((n, d) => n + d, 0) * power;
  const after = builtWeapon(kind, stage, calibration + 1, w.build).damage.reduce((n, d) => n + d, 0) * power;
  return `\u5355\u8F6E\u76F4\u4F24 ${number4(before)} \u2192 ${number4(after)}`;
}

// src/core/mobile-sentry.ts
var MOBILE_SENTRY = { distance: 140, speed: 200, moveUntil: 1.2, deploySeconds: 0.9 };
function sentryDestination(b) {
  if (b.kind !== "sniper" || b.pattern !== "relocate" || b.warning > 0 || b.age >= 10 || b.y < 320) return void 0;
  const volleys = b.sentryVolleys ?? 0;
  if (volleys === 0 ? b.age >= MOBILE_SENTRY.deploySeconds : b.timer <= MOBILE_SENTRY.moveUntil) return void 0;
  return b.lane + (volleys % 2 === 0 ? (b.lane >= 360 ? -1 : 1) * MOBILE_SENTRY.distance : 0);
}
function sentryDirection(b) {
  const x = sentryDestination(b);
  return x === void 0 || Math.abs(x - b.x) < 0.5 ? 0 : Math.sign(x - b.x);
}

// src/game/sentry-thrust.ts
function sentryThrust(c, direction, age, weak) {
  if (!direction) return;
  c.save();
  c.globalCompositeOperation = "lighter";
  const x = -direction * 56, tail = x - direction * (20 + Math.sin(age * 45) * 4);
  c.globalAlpha = 0.5;
  c.fillStyle = "#83dcff";
  c.beginPath();
  c.moveTo(x, -12);
  c.quadraticCurveTo(tail, -4, tail - direction * 8, 0);
  c.quadraticCurveTo(tail, 4, x, 12);
  c.closePath();
  c.fill();
  c.globalAlpha = 0.85;
  c.strokeStyle = "#e0f9ff";
  c.lineWidth = 2;
  for (let i = 0; i < (weak ? 1 : 3); i++) {
    const y = (i - 1) * 6;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(tail, y + Math.sin(age * 32 + i) * 2);
    c.stroke();
  }
  c.restore();
}

// src/game/build-preview.ts
var number3 = (value) => String(+value.toFixed(1));
function combinationPlan(build, route, was, arcStage) {
  const linked = canLaserChain(build, arcStage), wasLinked = canLaserChain(was, arcStage);
  if (linked && !wasLinked) return "\u672C\u6B21\u7EC4\u5408\uFF1A\u7535\u5149\u8FDE\u9501 \xB7 \u7FA4\u654C\u8DF3\u94FE / \u5355\u4F53\u805A\u80FD";
  if (route === "optical" && build.refinements.optical >= 1) return linked ? "\u7535\u5149\u8FDE\u9501\u5DF2\u751F\u6548 \xB7 \u8DF3\u94FE\u4E0E\u805A\u80FD\u81EA\u52A8\u5207\u6362 \xB7 \u539F\u706B\u529B\u4FDD\u7559" : "\u7535\u5149\u8FD8\u9700\uFF1A\u7535\u5F27\u70AET2";
  const r = build.ranks;
  if (r.optical >= 3 && r.ballistic >= 1 && !(was.ranks.optical >= 3 && was.ranks.ballistic >= 1)) return "\u672C\u6B21\u7EC4\u5408\uFF1A\u68F1\u955C\u6FC0\u5149 \xB7 \u4E24\u4FA7\u5404\u8FFD\u52A045%";
  if (r.ballistic >= 3 && r.electric >= 1 && was.ranks.ballistic < 3) return "\u672C\u6B21\u7EC4\u5408\uFF1A\u96F7\u66B4\u9730\u5C04 \xB7 \u9730\u5F39\u8FFD\u52A0\u8DF3\u7535";
  if (route === "optical") {
    if (r.optical >= 3 && r.ballistic >= 1) return "\u68F1\u955C\u6FC0\u5149\u5DF2\u751F\u6548 \xB7 \u4E3B\u675F\u4E0E\u53CC\u4FA7\u675F\u4FDD\u7559";
    return `\u68F1\u955C\u8FD8\u9700\uFF1A${[r.optical < 3 ? `\u5149\u5B66${3 - r.optical}\u70B9` : "", r.ballistic < 1 ? "\u5F39\u90531\u70B9" : ""].filter(Boolean).join(" \uFF0B ")}`;
  }
  if (r.ballistic >= 3 && r.electric >= 1) return "\u96F7\u66B4\u9730\u5C04\u5DF2\u751F\u6548 \xB7 \u5DF2\u6709\u8DF3\u7535\u4FDD\u7559";
  return `\u96F7\u66B4\u8FD8\u9700\uFF1A${[r.ballistic < 3 ? `\u5F39\u9053${3 - r.ballistic}\u70B9` : "", r.electric < 1 ? "\u96F7\u75351\u70B9" : ""].filter(Boolean).join(" \uFF0B ")}`;
}
function buildPreview(world, route, branch) {
  const current = world.build, projected = new BuildTree();
  Object.assign(projected.ranks, current.ranks);
  Object.assign(projected.refinements, current.refinements);
  projected.magneticAugment = current.magneticAugment;
  projected.ballisticBranch = current.ballisticBranch;
  projected.electricBranch = current.electricBranch;
  projected.opticalBranch = current.opticalBranch;
  projected.photonAugment = current.photonAugment;
  projected.fractureAugment = current.fractureAugment;
  projected.ionAugment = current.ionAugment;
  const valid = (!isIonAugment(branch) || world.canRefineIon()) && (!isFractureAugment(branch) || world.canRefineFracture()) && (!isPhotonAugment(branch) || world.canRefinePhoton()) && (!isMagneticAugment(branch) || world.canRefineMagnetic()) && projected.choose(route, world.buildPoints, branch);
  const rank = current.ranks[route], kind = route === "ballistic" ? "scatter" : "arc";
  const owned = world.activeWeapons.includes(kind), stage = owned ? world.weaponStage(kind) : 1, calibration = owned ? world.weaponCalibration(kind) : 0;
  const before = builtWeapon(kind, stage, calibration, current), after = builtWeapon(kind, stage, calibration, projected);
  const laserBefore = builtSupport(world.growth.mastery, current), laserAfter = builtSupport(world.growth.mastery, projected);
  const power = 1 + permanentPower(world.growth) / 100;
  const volley = (p) => number3(p.damage.reduce((sum, d) => sum + d, 0) * power);
  let gain = "";
  if (!valid) gain = "\u524D\u7F6E\u672A\u6EE1\u8DB3 \xB7 \u5F53\u524D\u706B\u529B\u4FDD\u6301";
  else if (route === "ballistic") {
    gain = rank >= 3 ? `\u5F39\u9053\u4F24\u5BB3\u7CFB\u6570 ${100 + current.refinements.ballistic * 10}% \u2192 ${110 + current.refinements.ballistic * 10}%` : rank === 2 ? "\u9730\u5F39\u547D\u4E2D\u540E\u8FFD\u52A01\u6B21\u8DF3\u7535" : !owned ? `\u65B0\u589ET1\u9730\u5C04 \xB7 \u6BCF\u8F6E${after.offsets.length}\u53D1 \xB7 \u76F4\u4F24${volley(after)}` : `\u9730\u5C04\u6BCF\u8F6E\u76F4\u4F24 ${volley(before)} \u2192 ${volley(after)}`;
  } else if (route === "electric") {
    gain = rank >= 3 ? `\u7535\u5F27\u76F4\u51FB\u4F24\u5BB3 ${volley(before)} \u2192 ${volley(after)}` : rank === 2 ? "\u8DF3\u4F2465%\u219280% \xB7 6\u6B21\u7535\u51FB\u5F15\u53D1140\u8303\u56F4\u653E\u7535" : rank === 1 ? branch === "seeker" ? "\u5E38\u89C4\u8DF3\u8DDD220 \xB7 \u9996\u8DF3340 \xB7 \u4F18\u5148\u84C4\u80FD\u5C04\u624B" : "\u8DF3\u7535\u8303\u56F4 160 \u2192 220 \xB7 \u9009\u6269\u6563/\u84C4\u7206/\u730E\u96BC" : !owned ? `\u65B0\u589ET1\u7535\u5F27 \xB7 \u76F4\u4F24${volley(after)} \xB7 \u8DF3\u7535${after.chainHops}\u6B21` : `\u7535\u5F27\u8FFD\u52A0\u8DF3\u7535 ${before.chainHops} \u2192 ${after.chainHops}\u6B21`;
  } else {
    gain = rank >= 3 || rank === 0 && laserBefore.laserUnlocked ? `\u6FC0\u5149\u5355\u675F\u76F4\u4F24 ${number3(laserBefore.laserDamage * power)} \u2192 ${number3(laserAfter.laserDamage * power)}` : rank === 0 ? `\u65B0\u589E\u6FC0\u5149 \xB7 ${laserAfter.laserInterval}\u79D2/\u675F \xB7 \u76F4\u4F24${number3(laserAfter.laserDamage * power)}` : rank === 1 ? `\u6FC0\u5149\u95F4\u9694 ${laserBefore.laserInterval} \u2192 ${laserAfter.laserInterval}\u79D2` : `\u6FC0\u5149\u8D2F\u7A7F ${laserBefore.laserTargets} \u2192 ${laserAfter.laserTargets}\u654C`;
  }
  if (valid && isIonAugment(branch)) gain += " \xB7 " + ionAugments[branch].name;
  if (valid && isMagneticAugment(branch)) gain = `\u7535\u5F27\u76F4\u51FB ${volley(before)} \u2192 ${volley(after)} \xB7 ${magneticAugments[branch].name}`;
  if (valid && isPhotonAugment(branch)) gain += " \xB7 " + photonAugments[branch].name;
  if (valid && isFractureAugment(branch)) gain += " \xB7 " + fractureAugments[branch].name;
  if (valid && route === "ballistic" && (isFractureAugment(branch) || !branch && world.canRefineFracture())) return { gain, plan: isFractureAugment(branch) ? fractureAugments[branch].detail : "\u88C2\u7532\u7CBE\u7814\u4E8C\u9009\u4E00\uFF1A\u53CC\u51FB\u7834\u6838 / \u8D2F\u901A\u51B2\u51FB \xB7 \u539F\u706B\u529B\u4FDD\u7559", valid, stage, before, after, laserBefore, laserAfter };
  return {
    gain,
    plan: valid && isIonAugment(branch) ? ionAugments[branch].detail : valid && !branch && route === "electric" && world.canRefineIon() ? "\u79BB\u5B50\u7CBE\u7814\u4E8C\u9009\u4E00\uFF1A\u5DE1\u822A\u96F7\u6838 / \u5206\u5C94\u96F7\u77DB \xB7 \u539F\u653E\u7535\u4FDD\u7559" : valid && !branch && route === "optical" && world.canRefinePhoton() ? "\u7CBE\u7814\u4E8C\u9009\u4E00\uFF1A\u8FDC\u94FE\u6E05\u7FA4 / \u5B64\u7ACB\u805A\u80FD \xB7 \u539F\u706B\u529B\u4FDD\u7559" : valid && isPhotonAugment(branch) ? photonAugments[branch].detail : valid && !branch && route === "electric" && world.canRefineMagnetic() ? "\u7CBE\u7814\u4E8C\u9009\u4E00\uFF1A\u5E7F\u57DF\u8986\u76D6 / \u573A\u5916\u5206\u6D41 \xB7 \u539F\u4E09\u62CD\u4FDD\u7559" : valid && isMagneticAugment(branch) ? magneticAugments[branch].detail : valid ? combinationPlan(projected, route, current, world.activeWeapons.includes("arc") ? world.weaponStage("arc") : 0) : isPhotonAugment(branch) ? "\u524D\u7F6E\u672A\u6EE1\u8DB3 \xB7 \u539F\u706B\u529B\u4FDD\u7559" : "\u5148\u9009\u5BFC\u7535\u7EBF\u5708\uFF0C\u518D\u89E3\u9501\u96F7\u66B4\u9730\u5C04",
    valid,
    stage,
    before,
    after,
    laserBefore,
    laserAfter
  };
}

// src/game/emp-light.ts
function empWave(c, x, y, radius, age, weak) {
  const p = Math.min(1, Math.max(0, age));
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < (weak ? 1 : 3); i++) {
    const r = radius * Math.max(0, p - i * 0.13);
    if (r < 1) continue;
    c.globalAlpha = (1 - p) ** 1.5 * (weak ? 0.45 : 0.65);
    c.strokeStyle = i % 2 ? "#c5fff0" : "#70e5ff";
    c.lineWidth = weak ? 2 : 3;
    for (let j = 0; j < 6; j++) {
      const a = j * Math.PI / 3 + p * 0.3;
      c.beginPath();
      c.arc(0, 0, r, a, a + 0.72);
      c.stroke();
    }
  }
  c.restore();
}
function offlineLight(c, x, y, width, remaining) {
  if (remaining <= 0) return;
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = "lighter";
  c.strokeStyle = "#a8f4ff";
  c.globalAlpha = 0.5 + 0.2 * Math.sin(remaining * 24);
  c.lineWidth = 2;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * width * 0.4, -17);
    c.lineTo(side * (width * 0.4 + 7), -7);
    c.lineTo(side * (width * 0.4 - 3), 2);
    c.lineTo(side * (width * 0.4 + 5), 15);
    c.stroke();
  }
  c.restore();
}

// src/core/achievements.ts
var achievements = [
  { id: "hunter", name: "\u767E\u673A\u7834\u9635", detail: "\u7D2F\u8BA1\u51FB\u6BC1100\u67B6\u654C\u673A" },
  { id: "boss", name: "\u9996\u9886\u7EC8\u7ED3\u8005", detail: "\u9996\u6B21\u51FB\u6BC1\u9996\u9886" },
  { id: "specialist", name: "\u4E13\u7CBE\u5DE5\u7A0B\u5E08", detail: "\u524D\u4E09\u4E2A\u5347\u7EA7\u70B9\u5168\u90E8\u6295\u5165\u540C\u4E00\u8DEF\u7EBF" },
  { id: "hybrid", name: "\u8DE8\u754C\u8BD5\u9A8C", detail: "\u524D\u4E09\u4E2A\u5347\u7EA7\u70B9\u5206\u522B\u6295\u5165\u4E09\u6761\u8DEF\u7EBF" },
  { id: "storm", name: "\u96F7\u66B4\u8BBE\u8BA1\u5E08", detail: "\u7EC4\u5408\u5BFC\u7535\u7EBF\u5708\u4E0E\u96F7\u66B4\u9730\u5C04" },
  { id: "fracture", name: "\u88C2\u7532\u5DE5\u7A0B\u5E08", detail: "\u5355\u5C40\u89E6\u53D110\u6B21\u88C2\u7532\u7206\u7834" },
  { id: "arsenal", name: "\u79FB\u52A8\u519B\u68B0\u5E93", detail: "\u5355\u5C40\u540C\u65F6\u6301\u6709\u4E94\u79CD\u6B66\u5668" },
  { id: "tactician", name: "\u6218\u672F\u62C6\u89E3", detail: "\u7F16\u961F\u5168\u7834\u4E14\u65E0\u4F24\u51FB\u8D25\u9996\u9886" },
  { id: "disruptor", name: "\u65AD\u7535\u65F6\u673A", detail: "\u4E00\u6B21\u4E2D\u7EE7\u7206\u7834\u4E2D\u65AD\u4E24\u53F0\u6B63\u5728\u84C4\u80FD\u7684\u654C\u673A" },
  { id: "proof", name: "\u5B9E\u6218\u5DE5\u7A0B\u5E08", detail: "\u4E3B\u52A8\u63A5\u53D6\u5E76\u5B8C\u6210\u4E00\u6B21\u6784\u7B51\u68C0\u9A8C" },
  { id: "ace", name: "\u738B\u724C\u730E\u624B", detail: "\u4E3B\u52A8\u63A5\u53D6\u53CC\u7EBF\u738B\u724C\u5E76\u51FB\u7834\u4E24\u540D\u76EE\u6807" },
  { id: "flawless-ace", name: "\u4EA4\u706B\u96F6\u4F24", detail: "\u63A5\u53D6\u540E\u4E0D\u53D7\u4F24\uFF0C\u5B8C\u6210\u53CC\u7EBF\u738B\u724C" },
  { id: "versatile", name: "\u6784\u7B51\u5168\u624D", detail: "\u5B8C\u62103\u79CD\u4E0D\u540C\u6784\u7B51\u68C0\u9A8C\uFF0C\u53EF\u8DE8\u5C40" },
  { id: "bank-shot", name: "\u6298\u5F39\u9AD8\u624B", detail: "\u4E3B\u52A8\u901A\u8FC7\u8DF3\u5F39\u4FA7\u51FB\u68C0\u9A8C\uFF1A12\u6B21\u8DF3\u5F39\u3001\u547D\u4E2D2\u6279\u7CBE\u82F1" },
  { id: "magnetic-master", name: "\u78C1\u66B4\u53CC\u4FEE", detail: "\u5E7F\u57DF\u4E0E\u5206\u6D41\u5404\u901A\u8FC7\u4E00\u6B21\u78C1\u66B4\u68C0\u9A8C\uFF0C\u53EF\u8DE8\u5C40" },
  { id: "core-breaker", name: "\u65AD\u6838\u8005", detail: "\u7FFC\u70AE\u53D1\u5C04\u540E\u3001\u6838\u5FC3\u8FDE\u5C04\u524D\u51FB\u6BC1\u622A\u51FB\u7CBE\u82F1" },
  { id: "preempt-gun", name: "\u5148\u5236\u62C6\u70AE", detail: "\u659C\u5C04\u54E8\u673A\u84C4\u80FD\u65F6\uFF0C\u5728\u9996\u53D1\u524D\u5C06\u5176\u51FB\u6BC1" },
  { id: "bait-counter", name: "\u8BF1\u5C04\u53CD\u51FB", detail: "\u65E0\u4F24\u907F\u5B8C\u659C\u5C04\u4E09\u8FDE\uFF0C\u518D\u51FB\u6BC1\u540C\u4E00\u54E8\u673A" }
];
var achievementGroups = { growth: { name: "\u6210\u957F", ids: ["hunter", "boss", "arsenal", "fracture"] }, build: { name: "\u6784\u7B51", ids: ["specialist", "hybrid", "storm", "proof", "versatile", "magnetic-master"] }, tactics: { name: "\u6218\u672F", ids: ["tactician", "disruptor", "ace", "flawless-ace", "bank-shot", "core-breaker", "preempt-gun", "bait-counter"] } };
var achievementGroup = (id) => Object.keys(achievementGroups).find((g) => achievementGroups[g].ids.includes(id)) ?? "growth";
function trackAchievement(state, id) {
  if (!achievements.some((a) => a.id === id) || state.unlocked.includes(id)) return false;
  state.tracked = id;
  return true;
}
function achievementProgress(id, state) {
  if (id === "hunter") return `${Math.min(state.kills, 100)}/100\u67B6\u654C\u673A`;
  if (id === "magnetic-master") return ["field-wide", "field-link"].map((k) => `${magneticAugments[k].name}${state.magneticCertifications.includes(k) ? "\u2713" : "\u5F85\u8BA4\u8BC1"}`).join(" / ");
  if (id === "versatile") return !state.certifiedBuilds.length && state.unlocked.includes("proof") ? "0/3\u79CD \xB7 \u65E7\u8BB0\u5F55\u672A\u5206\u7C7B\u578B\uFF0C\u8BF7\u91CD\u65B0\u8BA4\u8BC1" : `${Math.min(state.certifiedBuilds.length, 3)}/3\u79CD \xB7 \u5DF2\u8BA4\u8BC1\uFF1A${state.certifiedBuilds.slice(0, 2).map((k) => buildProofs[k].name).join(" / ") || "\u6682\u65E0"}${state.certifiedBuilds.length > 2 ? "\u2026" : ""}`;
  return state.unlocked.includes(id) ? "\u6311\u6218\u8BB0\u5F55\u5DF2\u4FDD\u5B58\u5728\u672C\u673A" : "\u9009\u62E9\u5E76\u5B8C\u6210\u5BF9\u5E94\u6311\u6218\uFF0C\u81EA\u52A8\u8BB0\u5F55";
}
function awardAchievements(state, ranks, weapons, fractureBursts = 0, tacticalWins = 0, conduitTacticalWins = 0, proofWins = 0, evidence = {}) {
  for (const kind of Object.keys(buildProofs)) if (evidence.certifiedBuilds?.includes(kind) && !state.certifiedBuilds.includes(kind)) state.certifiedBuilds.push(kind);
  for (const kind of ["field-wide", "field-link"]) if (evidence.magneticCertifications?.includes(kind) && !state.magneticCertifications.includes(kind)) state.magneticCertifications.push(kind);
  const values = Object.values(ranks), spent = values.reduce((a, b) => a + b, 0);
  const met = [state.kills >= 100, state.bosses >= 1, spent === 3 && values.includes(3), spent === 3 && values.every((v) => v === 1), ranks.ballistic >= 3 && ranks.electric >= 1, fractureBursts >= 10, weapons >= 5, tacticalWins > 0, conduitTacticalWins > 0, proofWins > 0, (evidence.aceWins ?? 0) > 0, (evidence.flawlessAceWins ?? 0) > 0, state.certifiedBuilds.length >= 3, state.certifiedBuilds.includes("ricochet"), state.magneticCertifications.length >= 2, (evidence.interceptorBreaks ?? 0) > 0, (evidence.lockPreemptWins ?? 0) > 0, (evidence.lockBaitWins ?? 0) > 0];
  const fresh = achievements.filter((a, i) => met[i] && !state.unlocked.includes(a.id));
  state.unlocked.push(...fresh.map((a) => a.id));
  return fresh;
}

// src/game/run-report.ts
function nextRunGoal(w, unlocked, tracked) {
  const target = achievements.find((a) => a.id === tracked);
  if (target) return unlocked.includes(target.id) ? `\u5DF2\u8FBE\u6210${target.name}\uFF0C\u5230\u6210\u5C31\u9875\u9009\u62E9\u65B0\u76EE\u6807` : `\u76EE\u6807\uFF1A${target.name} \xB7 ${target.detail}`;
  if (w.pickups === 0) return "\u5148\u51FB\u788E\u5E76\u62FE\u53D6\u88C5\u5907\u7BB1\uFF0C\u53D6\u5F97\u9996\u6B21\u7814\u53D1\u70B9";
  if (!unlocked.includes("boss")) return "\u5F3A\u5316\u6784\u7B51\u5E76\u51FB\u7834\u9996\u9886\uFF0C\u6311\u6218\u9996\u9886\u7EC8\u7ED3\u8005";
  if (!unlocked.includes("fracture") && w.fractureUnlocked()) return "\u5355\u5C40\u89E6\u53D110\u6B21\u88C2\u7532\u7206\u7834\uFF0C\u6311\u6218\u88C2\u7532\u5DE5\u7A0B\u5E08";
  if (!unlocked.includes("hybrid")) return "\u524D\u4E09\u70B9\u5206\u6295\u4E09\u8DEF\u7EBF\uFF0C\u6311\u6218\u8DE8\u754C\u8BD5\u9A8C";
  if (!unlocked.includes("specialist")) return "\u524D\u4E09\u70B9\u6295\u5165\u96F7\u7535\u6216\u5149\u5B66\uFF0C\u6311\u6218\u4E13\u7CBE\u5DE5\u7A0B\u5E08";
  if (!unlocked.includes("storm")) return "\u7EC4\u5408\u5F39\u9053\u4E0E\u96F7\u7535\uFF0C\u5B8C\u6210\u96F7\u66B4\u9730\u5C04";
  if (!unlocked.includes("proof") && w.availableProofs().length) return "\u63A5\u53D6\u6784\u7B51\u68C0\u9A8C\uFF0C\u7528\u5B9E\u9645\u7EC4\u5408\u6548\u679C\u6311\u6218\u5B9E\u6218\u5DE5\u7A0B\u5E08";
  if (!unlocked.includes("magnetic-master") && w.build.magneticAugment) return "\u5E7F\u57DF\u4E0E\u5206\u6D41\u5206\u522B\u901A\u8FC7\u78C1\u66B4\u68C0\u9A8C\uFF0C\u6311\u6218\u78C1\u66B4\u53CC\u4FEE";
  if (!unlocked.includes("ace") && w.activeWeapons.some((k) => w.weaponStage(k) >= 2)) return "\u63A5\u53D6\u53CC\u7EBF\u738B\u724C\u5E76\u5168\u7834\uFF0C\u6311\u6218\u738B\u724C\u730E\u624B";
  if (!unlocked.includes("flawless-ace") && unlocked.includes("ace")) return "\u63A5\u53D6\u540E\u65E0\u4F24\u5168\u7834\u53CC\u7EBF\u738B\u724C\uFF0C\u6311\u6218\u4EA4\u706B\u96F6\u4F24";
  if (!unlocked.includes("versatile") && unlocked.includes("proof")) return "\u6362\u4E00\u79CD\u6784\u7B51\u5B8C\u6210\u68C0\u9A8C\uFF0C\u6311\u6218\u6784\u7B51\u5168\u624D";
  if (!unlocked.includes("disruptor")) return "\u4E00\u6B21\u4E2D\u7EE7\u7206\u7834\u4E2D\u65AD\u4E24\u53F0\u84C4\u80FD\u654C\u673A\uFF0C\u6311\u6218\u65AD\u7535\u65F6\u673A";
  if (!unlocked.includes("tactician")) return "\u5168\u7834\u9996\u9886\u7F16\u961F\u5E76\u65E0\u4F24\u83B7\u80DC\uFF0C\u6311\u6218\u6218\u672F\u62C6\u89E3";
  return "\u63A8\u8FDB\u66F4\u9AD8\u8F6E\u6B21\uFF0C\u6311\u6218\u672C\u673A\u6700\u9AD8\u5206";
}
function runReport(w, fresh, unlocked, tracked) {
  const ballistic = w.build.ballisticBranch === "ricochet" ? `\u8DF3\u5F39 ${w.scatterRicochets}` : `\u8D2F\u7A7F ${w.scatterPierces}`;
  const fracture = `\u88C2\u7532 ${w.fractureBursts}${w.fractureWaveHits ? " \xB7 \u7A7F\u9707" + w.fractureWaveHits : ""}`;
  const electric = w.build.electricBranch === "seeker" ? `\u730E\u96BC ${w.seekerLinks}` : `\u94FE\u4F24 ${w.arcLinks}`;
  const names2 = achievements.filter((a) => fresh.includes(a.id)).map((a) => a.name);
  return {
    growth: `\u5145\u80FD\u7A81\u7834 ${w.growth.mastery ?? 0}\u6B21 \xB7 \u4E13\u5C5E\u7CBE\u6821 ${w.activeWeapons.reduce((n, k) => n + w.weaponCalibration(k), 0)}\u6B21 \xB7 \u7814\u53D1 ${w.researchPoints}\u70B9${w.refitsClaimed ? " \xB7 \u6539\u88C5" + w.refitsClaimed + "\u6B21" : ""}`,
    weapons: w.activeWeapons.map((k) => `${weaponNames[k]} T${w.weaponStage(k)}`),
    routes: routes.map((r, i) => `${["\u5F39\u9053", "\u96F7\u7535", "\u5149\u5B66"][i]} ${w.build.ranks[r]}/3 \xB7 ${w.build.ranks[r] ? w.build.node(r, Math.min(1, w.build.ranks[r] - 1)).name : "\u672A\u6295\u5165"}${w.build.refinements[r] ? " \xB7 \u7CBE\u8C03" + w.build.refinements[r] : ""}${r === "ballistic" && w.build.fractureAugment ? " \xB7 " + fractureAugments[w.build.fractureAugment].name : ""}${r === "electric" && w.build.magneticAugment ? " \xB7 " + magneticAugments[w.build.magneticAugment].name : ""}${r === "electric" && w.build.ionAugment ? " \xB7 " + ionAugments[w.build.ionAugment].name : ""}${r === "optical" && w.build.photonAugment ? " \xB7 " + photonAugments[w.build.photonAugment].name : ""}`),
    combat: `\u9996\u9886 ${w.bossWins} \xB7 \u6218\u5229\u54C1 ${w.bossLootStats.claimed} \xB7 \u51FB\u7834 ${w.kills} \xB7 \u95E8 ${w.gatesTaken}`,
    contracts: w.contractStats.accepted ? `\u5951\u7EA6\u6210\u529F ${w.contractStats.won}/${w.contractStats.accepted} \xB7 \u9886\u5956 ${w.contractStats.claimed} \xB7 \u5931\u8D25 ${w.contractStats.failed}${w.proofWins ? ` \xB7 \u6784\u7B51\u8BA4\u8BC1${w.proofWins}` : ""}` : "\u672C\u5C40\u672A\u63A5\u53D6\u5951\u7EA6 \xB7 \u6BCF\u8F6E\u53EF\u81EA\u9009\u4E00\u6B21",
    mechanics: w.magneticLinkHits + w.magneticHits + w.scatterRicochets + w.scatterPierces + w.scatterSplashHits + w.fractureBursts + w.fractureWaveHits + w.capacitorBursts + w.burnHits + w.relayHits + w.arcLinks + w.empTargets + w.ionBursts + w.laserArcHits + w.laserFocusHits === 0 ? w.build.electricBranch === "seeker" ? ["\u730E\u96BC\u5C1A\u672A\u6709\u6548\u547D\u4E2D", "\u501F\u524D\u6392\u76EE\u6807\uFF0C\u9996\u8DF3\u8FDC\u8DDD\u6253\u51FB\u540E\u6392\u5C04\u624B"] : ["\u5C1A\u672A\u89E6\u53D1\u6D3E\u751F\u80FD\u529B", "\u7814\u53D1\u5206\u652F\u4E0E\u914D\u4EF6\u7EC4\u5408\u53EF\u5F3A\u5316\u706B\u529B"] : w.laserArcHits + w.laserFocusHits + w.magneticHits + w.magneticLinkHits > 0 ? [`${ballistic} \xB7 \u6E85\u5C04 ${w.scatterSplashHits} \xB7 ${fracture}${w.magneticHits + w.magneticLinkHits ? ` \xB7 \u78C1\u66B4${w.magneticHits}/${w.magneticLinkHits}` : ""}`, `${electric} \xB7 \u84C4\u7206 ${w.capacitorBursts} \xB7 \u98CE\u66B4 ${w.ionBursts} \xB7 \u505C\u706B ${w.empTargets}`, `\u707C\u70E7 ${w.burnHits} \xB7 \u5206\u5149 ${w.relayHits} \xB7 \u5149\u94FE ${w.laserArcHits} \xB7 \u805A\u80FD ${w.laserFocusHits}`] : [`${ballistic} \xB7 \u6E85\u5C04 ${w.scatterSplashHits} \xB7 ${fracture} \xB7 \u505C\u706B ${w.empTargets}`, `${electric} \xB7 \u84C4\u7206 ${w.capacitorBursts} \xB7 \u707C\u70E7 ${w.burnHits} \xB7 \u5206\u5149 ${w.relayHits}${w.ionBursts ? ` \xB7 \u98CE\u66B4${w.ionBursts}` : ""}${w.magneticHits + w.magneticLinkHits ? ` \xB7 \u78C1\u66B4${w.magneticHits}/${w.magneticLinkHits}` : ""}`],
    fresh: names2.length ? `\u65B0\u6210\u5C31 ${names2.length} \xB7 ${names2.slice(0, 2).join(" / ")}${names2.length > 2 ? "\u2026" : ""}` : `\u672C\u5C40\u65E0\u65B0\u6210\u5C31 \xB7 \u7D2F\u8BA1 ${unlocked.length}/${achievements.length}`,
    next: nextRunGoal(w, unlocked, tracked)
  };
}

// src/game/capacitor-light.ts
function capacitorMarks(c, x, y, width, hits, time) {
  c.save();
  c.translate(x, y);
  c.lineWidth = 2;
  c.strokeStyle = "#b6a0ee";
  for (let i = 0; i < 3; i++) {
    c.fillStyle = i < hits ? "#c6b5ff" : "#243d48";
    c.fillRect(-19 + i * 14, width * 0.45, 10, 7);
    c.strokeRect(-19 + i * 14, width * 0.45, 10, 7);
  }
  c.globalAlpha = 0.6 + 0.2 * Math.sin(time * 14);
  c.strokeStyle = "#a5ffe4";
  for (let i = 0; i < Math.min(2, hits); i++) {
    const side = i ? 1 : -1;
    c.beginPath();
    c.moveTo(side * width * 0.3, -15);
    c.lineTo(side * width * 0.22, -4);
    c.lineTo(side * width * 0.35, 4);
    c.lineTo(side * width * 0.26, 15);
    c.stroke();
  }
  c.restore();
}
function capacitorLight(c, x, y, size, age, weak) {
  if (age < 0 || age >= 1) return;
  c.save();
  c.translate(x, y);
  c.globalAlpha = (1 - age) * (weak ? 0.7 : 0.95);
  c.globalCompositeOperation = "lighter";
  const radius = size * (0.2 + age * 0.8);
  for (let pass = 0; pass < (weak ? 1 : 2); pass++) {
    c.strokeStyle = pass ? "#edfff8" : "#a99aff";
    c.lineWidth = pass ? 1.5 : 5;
    c.beginPath();
    for (let j = 0; j <= 24; j++) {
      const a = j * Math.PI / 12, r = radius * (j % 2 ? 1 : 0.75), px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (j === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.stroke();
  }
  c.strokeStyle = "#9bffda";
  c.lineWidth = 2;
  for (let j = 0; j < (weak ? 4 : 8); j++) {
    const a = j * Math.PI / 4 + age * 0.8;
    c.save();
    c.rotate(a);
    c.beginPath();
    c.moveTo(radius * 0.35, 0);
    c.lineTo(radius * 0.7, -5);
    c.lineTo(radius * 0.6, 5);
    c.lineTo(radius * 1.2, 0);
    c.stroke();
    c.restore();
  }
  c.restore();
}

// src/game/formation-shield.ts
function formationShield(c, x, y, time, breakAge, weak) {
  const breaking = breakAge > 0, r = 214 + breakAge * 90, alpha = breaking ? 1 - breakAge : 0.52;
  c.save();
  c.translate(x, y);
  c.scale(1, 0.62);
  c.globalCompositeOperation = "lighter";
  c.strokeStyle = "#8ce8ff";
  c.globalAlpha = alpha * (weak ? 0.55 : 1);
  c.lineWidth = breaking ? 2 : 3;
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6 + Math.sin(time * 0.8) * 0.04;
    c.beginPath();
    c.arc(0, 0, r, a, a + Math.PI / 8);
    c.stroke();
    if (!weak && !breaking) {
      c.globalAlpha = alpha * 0.25;
      c.lineWidth = 8;
      c.beginPath();
      c.arc(0, 0, r + 5, a, a + Math.PI / 8);
      c.stroke();
      c.globalAlpha = alpha;
      c.lineWidth = 3;
    }
  }
  c.restore();
}

// src/game/burn-light.ts
function burnLight(c, x, y, w, h, time, weak) {
  c.save();
  c.translate(x, y);
  for (const side of [-1, 1]) {
    const sway = Math.sin(time * 19 + side) * w * 0.06;
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = weak ? 0.2 : 0.35;
    c.fillStyle = "#ff943f";
    c.beginPath();
    c.moveTo(side * w * 0.32, h * 0.22);
    c.bezierCurveTo(side * w * 0.5, h * 0.03, side * w * 0.63, -h * 0.18, side * w * 0.46 + sway, -h * 0.6);
    c.quadraticCurveTo(side * w * 0.44, -h * 0.06, side * w * 0.32, h * 0.22);
    c.closePath();
    c.fill();
    c.globalAlpha = 0.9;
    c.strokeStyle = "#fff1d0";
    c.lineWidth = weak ? 1.5 : 2.5;
    c.beginPath();
    c.moveTo(side * w * 0.4, h * 0.12);
    c.bezierCurveTo(side * w * 0.52, -h * 0.04, side * w * 0.38, -h * 0.18, side * w * 0.44 + sway, -h * 0.4);
    c.stroke();
  }
  for (let i = 0; i < (weak ? 3 : 7); i++) {
    const phase = (time * 1.9 + i * 0.173) % 1, side = i % 2 ? 1 : -1;
    c.globalAlpha = (1 - phase) * 0.9;
    c.fillStyle = i % 3 ? "#ffca72" : "#fff4dd";
    const ex = side * w * (0.25 + Math.sin(i * 4.7) * 0.18), ey = h * (0.1 - phase * 0.9), r = 2 + (1 - phase) * 1.5;
    c.beginPath();
    c.moveTo(ex, ey - r);
    c.lineTo(ex + r * 0.6, ey);
    c.lineTo(ex, ey + r);
    c.lineTo(ex - r * 0.6, ey);
    c.closePath();
    c.fill();
  }
  c.restore();
}

// src/game/fracture-light.ts
function fractureMarks(c, x, y, width, hits, required = 3) {
  c.save();
  c.translate(x, y);
  c.strokeStyle = "#ffdc9d";
  c.lineWidth = 2.5;
  for (let i = 0; i < Math.min(required - 1, hits); i++) {
    const side = i ? 1 : -1;
    c.beginPath();
    c.moveTo(side * width * 0.25, -12);
    c.lineTo(side * 5, -2);
    c.lineTo(side * width * 0.2, 5);
    c.lineTo(side * 3, 16);
    c.stroke();
  }
  for (let i = 0; i < required; i++) {
    c.fillStyle = i < hits ? "#ffdc9d" : "#314a58";
    c.fillRect(-(required * 12 - 4) / 2 + i * 12, -width * 0.55, 8, 5);
  }
  c.restore();
}
function fractureWaveLight(c, x, y, tx, ty, life, weak) {
  const length = y - ty;
  if (length < 0 || life <= 0) return;
  const age = Math.min(1, 1 - life / 0.24);
  c.save();
  c.translate(x, y);
  c.globalAlpha = (1 - age) * (weak ? 0.65 : 0.9);
  c.strokeStyle = "#ffc078";
  c.lineWidth = weak ? 2 : 4;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 18, 0);
    c.lineTo(side * 40, -8);
    c.lineTo(side * 68, 0);
    if (!weak) {
      c.lineTo(side * 90, -8);
      c.lineTo(side * 116, -2);
    }
    c.stroke();
  }
  if (length === 0) {
    c.restore();
    return;
  }
  c.beginPath();
  c.moveTo(-9, 0);
  c.lineTo(-18, -length * 0.32);
  c.lineTo(12, -length * 0.55);
  c.lineTo(-7, -length * 0.8);
  c.lineTo(tx - x, -length);
  c.stroke();
  c.strokeStyle = "#fff0c9";
  c.lineWidth = 2;
  if (!weak) {
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(side * 12, 0);
      c.lineTo(side * 30, -length * 0.25);
      c.lineTo(side * 12, -length * 0.7);
      c.lineTo(side * 4, -length);
      c.stroke();
    }
    const tip = length * Math.min(1, age * 2), h = Math.min(18, tip);
    c.fillStyle = "#ffe4a6";
    c.beginPath();
    c.moveTo(0, -tip);
    c.lineTo(7, -tip + h * 0.55);
    c.lineTo(0, -tip + h);
    c.lineTo(-7, -tip + h * 0.55);
    c.closePath();
    c.fill();
  }
  for (let i = 0; i < (weak ? 1 : 3); i++) {
    const t = (age + i / 3) % 1, d = length * t, w = 30 + 90 * (1 - t);
    c.beginPath();
    c.moveTo(-w, -d + Math.min(12, d));
    c.lineTo(0, -d);
    c.lineTo(w, -d + Math.min(12, d));
    c.stroke();
  }
  c.restore();
}
function fractureLight(c, x, y, size, age, weak) {
  if (age < 0 || age >= 1) return;
  const fade = 1 - age, r = size * (0.18 + age * 0.82);
  c.save();
  c.translate(x, y);
  c.globalAlpha = fade * (weak ? 0.65 : 0.95);
  c.strokeStyle = "#ffd9a0";
  c.lineWidth = weak ? 2 : 3;
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3 + age * 0.3;
    c.beginPath();
    c.arc(0, 0, r, angle, angle + Math.PI / 5);
    c.stroke();
  }
  c.strokeStyle = "#a2d7e8";
  c.lineWidth = 2;
  for (let i = 0; i < (weak ? 3 : 6); i++) {
    const a = i * Math.PI / 3 + 0.4, travel = size * (0.2 + age * 0.8);
    c.save();
    c.translate(Math.cos(a) * travel, Math.sin(a) * travel);
    c.rotate(a + age * 2);
    c.fillStyle = "#526d7c";
    c.beginPath();
    c.moveTo(-8, -3);
    c.lineTo(4, -5);
    c.lineTo(9, 3);
    c.lineTo(-4, 5);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }
  c.restore();
}

// src/game/mounted-rig.ts
var mountedRig = {
  pulse: { frame: 0, x: -70, y: -20, size: 66 },
  scatter: { frame: 1, x: 70, y: -20, size: 72 },
  pierce: { frame: 2, x: -48, y: -85, size: 76 },
  blast: { frame: 3, x: 48, y: -85, size: 72 },
  arc: { frame: 4, x: 0, y: -92, size: 92 }
};

// src/core/contracts.ts
var HUNTER = { targets: 2, spacing: 6, hoverY: 500, holdSeconds: 20, retry: 0.5 };
var hunts = {
  staggered: { name: "\u5206\u6279\u60AC\u8D4F", detail: "\u4E24\u540D\u7CBE\u82F1\u5206\u6279\u5165\u573A \xB7 30\u79D2\u5168\u7834", research: 0, durability: 1 },
  crossfire: { name: "\u53CC\u7EBF\u738B\u724C", detail: "30\u79D2\u5168\u7834\u5F3A\u5316\u6247\u5C04\u53CC\u673A \xB7 \u5EFA\u8BAET3\u706B\u529B", research: 1, durability: 1.6 }
};
var contracts = {
  precision: { name: "\u65E0\u4F24\u730E\u6740", detail: "30\u79D2\u5185\u51FB\u6BC115\u654C\uFF0C\u5168\u7A0B\u4E0D\u53D7\u4F24", charge: 100 },
  specialist: { name: "\u4E13\u7CBE\u8BD5\u70BC", detail: "30\u79D2\u5185\u51FB\u6BC115\u654C\uFF0C\u4E0D\u65B0\u589E\u6B66\u5668\u79CD\u7C7B", charge: 75 },
  hunter: { name: "\u5371\u9669\u730E\u624B", detail: "30\u79D2\u5185\u51FB\u78342\u540D\u6807\u8BB0\u7CBE\u82F1 \xB7 \u5141\u8BB8\u53D7\u4F24", charge: 150 },
  research: { name: "\u6784\u7B51\u68C0\u9A8C", detail: "\u68C0\u9A8C\u5DF2\u6210\u5F62\u6784\u7B51\u7684\u771F\u5B9E\u6218\u6597\u6548\u679C", charge: 100 }
};
var Contract = class {
  constructor(kind, round, startKills, weapons, damage, proof, hunt = "staggered") {
    this.kind = kind;
    this.round = round;
    this.startKills = startKills;
    this.weapons = weapons;
    this.damage = damage;
    this.proof = proof;
    this.hunt = hunt;
  }
  kind;
  round;
  startKills;
  weapons;
  damage;
  proof;
  hunt;
  reinforcements = 0;
  nextReinforcement = 0;
  killedTargets = /* @__PURE__ */ new Set();
  lostTarget = false;
  get targetKills() {
    return this.killedTargets.size;
  }
  targetKilled(id, round) {
    if (this.kind !== "hunter" || this.status !== "active" || round !== this.round || this.killedTargets.has(id)) return false;
    this.killedTargets.add(id);
    return true;
  }
  targetEscaped(round) {
    if (this.kind === "hunter" && this.status === "active" && round === this.round) this.lostTarget = true;
  }
  proofGroups = /* @__PURE__ */ new Set();
  get proofGroupCount() {
    return this.proofGroups.size;
  }
  recordRicochetGroup(group, round) {
    this.recordGroup("ricochet", group, round);
  }
  recordMagneticGroup(group, round) {
    return this.recordGroup("magnetic", group, round);
  }
  recordGroup(kind, group, round) {
    if (this.kind !== "research" || this.proof?.kind !== kind || this.status !== "active" || round !== this.round || !Number.isInteger(group) || group < 1 || group > Math.min(this.reinforcements, PROOF_WAVES.groups)) return false;
    this.proofGroups.add(group);
    return true;
  }
  proofProgress = 0;
  elapsed = 0;
  status = "active";
  reason = "";
  update(dt, kills, weapons, damage, alive, proofTotal = 0) {
    if (this.status !== "active") return false;
    this.elapsed += dt;
    const broken = !alive ? "\u673A\u4F53\u88AB\u6467\u6BC1" : this.kind === "hunter" && this.lostTarget ? "\u60AC\u8D4F\u76EE\u6807\u5DF2\u8131\u79BB" : this.kind === "precision" && damage > this.damage ? "\u53D7\u5230\u4F24\u5BB3" : this.kind === "specialist" && weapons > this.weapons ? "\u65B0\u589E\u4E86\u6B66\u5668\u79CD\u7C7B" : "";
    if (broken) {
      this.status = "failed";
      this.reason = broken;
      return true;
    }
    if (this.kind === "hunter" && this.targetKills >= HUNTER.targets && this.elapsed <= 30 + 1e-8) {
      this.status = "won";
      this.reason = "\u60AC\u8D4F\u76EE\u6807\u5168\u7834";
      return true;
    }
    if (this.kind === "research") {
      if (this.proof) this.proofProgress = Math.max(0, proofTotal - this.proof.start);
      if (this.proof && this.proofProgress >= buildProofs[this.proof.kind].goal && this.proofGroupCount >= requiredProofGroups(this.proof.kind) && this.elapsed <= 30 + 1e-8) {
        this.status = "won";
        this.reason = `${buildProofs[this.proof.kind].name}\u68C0\u9A8C\u901A\u8FC7`;
        return true;
      }
      if (this.elapsed + 1e-8 < 30) return false;
      this.status = "failed";
      this.reason = this.proof?.kind === "magnetic" ? this.proofProgress >= buildProofs.magnetic.goal ? this.proofGroupCount >= requiredProofGroups("magnetic") ? "\u8D85\u8FC7\u9A8C\u8BC1\u65F6\u9650" : "\u9A8C\u8BC1\u6279\u6B21\u4E0D\u8DB3" : "\u6709\u6548\u7CBE\u7814\u547D\u4E2D\u4E0D\u8DB3" : this.proof?.kind === "ricochet" ? this.proofProgress >= buildProofs.ricochet.goal ? "\u9A8C\u8BC1\u6279\u6B21\u4E0D\u8DB3" : "\u6709\u6548\u8DF3\u5F39\u4E0D\u8DB3" : "\u7EC4\u5408\u6709\u6548\u89E6\u53D1\u4E0D\u8DB3";
      return true;
    }
    if (this.elapsed + 1e-8 < 30) return false;
    this.status = this.kind !== "hunter" && kills - this.startKills >= 15 ? "won" : "failed";
    this.reason = this.status === "won" ? "\u6311\u6218\u5B8C\u6210" : this.kind === "hunter" ? "\u60AC\u8D4F\u76EE\u6807\u672A\u5168\u7834" : "\u51FB\u6BC1\u6570\u91CF\u4E0D\u8DB3";
    return true;
  }
};

// src/game/combat-light.ts
function overloadWake(c, x, y, time, remaining, weak) {
  if (remaining <= 0) return;
  const fade = Math.min(1, remaining / 0.6);
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = fade * (weak ? 0.45 : 0.7);
  for (const side of [-1, 1]) {
    const length = 38 + Math.sin(time * 18 + side) * 8;
    const points = [side * 72, -12, side * 78, 24, side * 66, 24 + length];
    if (!weak) line(c, "#ffbd4e28", 16, points);
    line(c, "#ffcc76", weak ? 2 : 4, points);
    if (!weak) {
      line(c, "#fff7d6", 1.5, [side * 72, -10, side * 77, 20, side * 70, 41]);
      const flow = (time * 2.8 + (side + 1) * 0.25) % 1;
      c.globalAlpha = fade * (1 - flow) * 0.6;
      line(c, "#ffd58c", 2, [side * (87 + flow * 5), 10 + flow * 45, side * (87 + flow * 5), 22 + flow * 45]);
      c.globalAlpha = fade * 0.7;
    }
  }
  c.restore();
}
function coilDischarge(c, x, y, life, stage, weak) {
  if (life <= 0) return;
  const age = 1 - Math.min(1, life);
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = life * (weak ? 0.55 : 0.8);
  const count = weak ? 1 : Math.max(1, Math.min(3, stage));
  for (let i = 0; i < count; i++) {
    const radius = 9 + age * 23 + i * 5;
    c.strokeStyle = i % 2 ? "#e9ffe6" : "#9fffad";
    c.lineWidth = weak ? 1.5 : 2;
    c.beginPath();
    c.ellipse(0, -i * 10 - age * 18, radius, radius * 0.32, 0, age * 3 + i, age * 3 + i + Math.PI * 1.65);
    c.stroke();
  }
  if (!weak) for (const side of [-1, 1]) {
    line(c, "#dbffd7", 1.5, [side * 17, 12, side * (23 + age * 8), 3, side * 15, -6, side * 21, -17]);
  }
  c.restore();
}
function chainArc(c, x, y, tx, ty, life, weak, photon = false, seeker = false) {
  const dx = tx - x, dy = ty - y, length = Math.max(1, Math.hypot(dx, dy)), points = [x, y];
  for (let i = 1; i < 8; i++) {
    const bend = (i % 2 ? 1 : -1) * 7;
    points.push(x + dx * i / 8 - dy / length * bend, y + dy * i / 8 + dx / length * bend);
  }
  points.push(tx, ty);
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = Math.max(0, life / (photon ? 0.24 : 0.16)) * (weak ? 0.65 : 1);
  if (!weak) line(c, photon ? "#b5a8ff33" : seeker ? "#ffc76028" : "#80ff8028", photon ? 12 : 10, points);
  line(c, photon ? "#83eaff" : seeker ? "#ffda92" : "#9fffad", weak ? 2 : photon ? 4 : 3, points);
  line(c, photon ? "#fff1ff" : "#f5ffed", photon ? 1.5 : 1, points);
  if (seeker) {
    c.strokeStyle = "#fff0c5";
    c.lineWidth = weak ? 1 : 2;
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(tx + side * 12, ty - 8);
      c.lineTo(tx + side * 6, ty);
      c.lineTo(tx + side * 12, ty + 8);
      c.stroke();
    }
  }
  if (photon) {
    const r = 6 + (1 - life / 0.24) * 8;
    c.strokeStyle = "#d8bdff";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x, y - r);
    c.lineTo(x + r, y);
    c.lineTo(x, y + r);
    c.lineTo(x - r, y);
    c.closePath();
    c.stroke();
  }
  c.restore();
}
function focusDischarge(c, x, y, life, weak) {
  const t = Math.max(0, Math.min(1, 1 - life / 0.32)), r = 44 + t * 40;
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = (1 - t) * (weak ? 0.7 : 1);
  if (!weak) {
    c.strokeStyle = "#a9a0ff55";
    c.lineWidth = 8;
    c.beginPath();
    c.ellipse(0, 0, r, r * 0.65, -0.35, 0, Math.PI * 2);
    c.stroke();
  }
  c.strokeStyle = "#83eaff";
  c.lineWidth = weak ? 1.5 : 3;
  c.beginPath();
  c.ellipse(0, 0, r, r * 0.65, -0.35, 0, Math.PI * 2);
  c.stroke();
  line(c, "#fff2ff", weak ? 1 : 2, [0, -42 * (1 - t), 8, -12, 0, 0, -7, 12, 0, 42 * (1 - t)]);
  if (!weak) for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + 0.4 + t * 0.4;
    line(c, "#d3c2ff", 2, [Math.cos(a) * (r + 5), Math.sin(a) * (r + 5), Math.cos(a) * (r + 18), Math.sin(a) * (r + 18)]);
  }
  c.restore();
}
function line(c, color, width, points) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.stroke();
}
function glow(c, x, y, rx, ry, color, weak) {
  for (const [scale, alpha] of weak ? [[1.3, 0.1], [1, 0.24]] : [[2.4, 0.025], [1.8, 0.05], [1.3, 0.1], [1, 0.24]]) {
    c.globalAlpha = alpha;
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx * scale, ry * scale, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}
function energyShot(c, x, y, vx, vy, kind, time, weak) {
  const color = weaponColors[kind], tail = kind === "blast" ? 28 : kind === "pierce" ? 86 : kind === "scatter" ? 48 : 60;
  const width = kind === "blast" ? 9 : kind === "pierce" ? 5 : kind === "scatter" ? 4 : 3;
  c.save();
  c.translate(x, y);
  c.rotate(Math.atan2(vx, -vy));
  c.globalCompositeOperation = "screen";
  c.lineCap = "round";
  if (!weak) glow(c, 0, 9, width * 2.2, 18, color, false);
  line(c, `${color}18`, width * 5, [0, tail, 0, -9]);
  line(c, `${color}66`, width * 2.2, [0, tail * 0.65, 0, -10]);
  line(c, `${color}99`, width, [0, tail * 0.38, 0, -12]);
  if (kind === "arc") {
    const sway = Math.sin(time * 32 + x * 0.1) * 3;
    const path2 = [0, -10, 4 + sway, 6, -5, 22, 5 - sway, 38, -3, 56, 0, 74];
    if (!weak) line(c, "#82ffa344", 8, path2);
    line(c, "#a2ff9cbb", weak ? 2 : 3, path2);
    line(c, "#edffda", 1.2, path2);
  }
  c.globalCompositeOperation = "screen";
  if (!weak) {
    const phase = time * 15 + x * 0.13;
    for (let i = 0; i < 3; i++) {
      const side = i % 2 ? -1 : 1, yy = 17 + i * 15 + Math.sin(phase + i) * 5;
      line(c, `${color}aa`, 1.3, [side * (5 + i * 2), yy, side * (7 + i * 2), yy + 6]);
    }
    if (kind === "pierce") line(c, `${color}aa`, 1.4, [-6, 4, 6, 17, -5, 29, 4, 40, -3, 52]);
  }
  c.restore();
}
function projectileBody(c, x, y, vx, vy, kind) {
  const color = weaponColors[kind], width = kind === "blast" ? 9 : kind === "pierce" ? 5 : kind === "scatter" ? 4 : 3;
  c.save();
  c.translate(x, y);
  c.rotate(Math.atan2(vx, -vy));
  c.lineCap = "round";
  c.globalCompositeOperation = "source-over";
  if (kind === "blast") {
    c.fillStyle = "#74431a";
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -15);
    c.lineTo(7, -5);
    c.lineTo(5, 13);
    c.lineTo(-5, 13);
    c.lineTo(-7, -5);
    c.closePath();
    c.fill();
    c.stroke();
    line(c, "#ffe1a0", 2, [0, -9, 0, 4]);
  } else if (kind === "arc") {
    c.fillStyle = "#163e28";
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(0, 0, 7, 12, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    line(c, "#d7ffba", 1.5, [2, -8, -3, 0, 3, 1, -2, 8]);
  } else {
    line(c, color, width + 1, [0, 10, 0, -12]);
    line(c, kind === "pierce" ? "#e7d7ff" : kind === "scatter" ? "#ffd69a" : "#bceeff", 1, [0, 3, 0, -12]);
  }
  c.restore();
}
function muzzleLight(c, x, y, kind, phase, weak) {
  const color = weaponColors[kind], length = (kind === "scatter" ? 62 : 48) * (0.7 + phase * 0.3);
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = "lighter";
  glow(c, 0, -8, kind === "scatter" ? 5 : 8, 16, color, weak);
  c.globalAlpha = 0.3 + phase * 0.35;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(-4, 4);
  c.lineTo(-6, -16);
  c.lineTo(-2, -12);
  c.lineTo(0, -length);
  c.lineTo(2, -15);
  c.lineTo(6, -23);
  c.lineTo(4, 4);
  c.closePath();
  c.fill();
  line(c, "#fffde9", 3, [0, 2, 0, -length * 0.55]);
  if (!weak && kind !== "scatter") {
    line(c, `${color}99`, 2, [-16, -5, 16, -5]);
    line(c, "#fff3cc", 1, [-7, -5, 7, -5]);
  }
  c.restore();
}
function detonationSpriteAlpha(age, weak) {
  if (age < 0 || age >= 1) return 0;
  return (0.24 * (1 - age) ** 2 + 0.6 * Math.max(0, 1 - age / 0.22)) * (weak ? 0.6 : 1);
}
function detonationLight(c, x, y, size, age, weak) {
  if (age < 0 || age >= 1 || size <= 0) return;
  const p = age, fade = (1 - p) ** 1.5, radius = size * (0.22 + Math.sqrt(p) * 1.1);
  c.save();
  c.beginPath();
  c.rect(0, C.playerShotTop, C.width, C.height - C.playerShotTop);
  c.clip();
  c.translate(x, y);
  c.globalCompositeOperation = "lighter";
  const hot = Math.max(0, 1 - p / 0.12);
  if (hot > 0) {
    c.globalAlpha = hot * (weak ? 0.35 : 0.65);
    c.strokeStyle = "#ffdd9b";
    c.lineWidth = weak ? 2 : 3;
    c.beginPath();
    c.ellipse(0, 0, size * (0.08 + p * 0.35), size * (0.06 + p * 0.25), 0, 0, Math.PI * 2);
    c.stroke();
    line(c, "#fff0cf", weak ? 1 : 2, [-size * 0.24 * hot, 0, size * 0.24 * hot, 0]);
  }
  const segments = weak ? 4 : 7;
  c.globalAlpha = fade * (weak ? 0.45 : 0.78);
  c.strokeStyle = "#ffb45b";
  c.lineWidth = weak ? 1.5 : 2.5;
  for (let i = 0; i < segments; i++) {
    const a = i * Math.PI * 2 / segments + 0.18;
    c.beginPath();
    c.ellipse(0, 0, radius, radius * 0.64, 0, a, a + (i % 2 ? 0.46 : 0.62));
    c.stroke();
    if (!weak) {
      c.globalAlpha = fade * 0.55;
      line(c, i % 2 ? "#ffd68a" : "#a3dcf2", 1.3, [Math.cos(a) * radius * 0.86, Math.sin(a) * radius * 0.64 * 0.86, Math.cos(a) * radius * 1.03, Math.sin(a) * radius * 0.64 * 1.03]);
      c.globalAlpha = fade * 0.78;
    }
  }
  for (let i = 0; i < (weak ? 2 : 5); i++) {
    const a = i * Math.PI * 2 / (weak ? 2 : 5) + 0.4, d = size * (0.22 + (1 - (1 - p) ** 2) * 0.72);
    impactChip(c, Math.cos(a) * d, Math.sin(a) * d * 0.7, a + p * (i % 2 ? 2 : -2), "#e3a268", Math.min(weak ? 3 : 5, size * 0.055), fade * (weak ? 0.55 : 0.8));
  }
  c.restore();
}
function sparkLight(c, x, y, vx, vy, color, fade, weak) {
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = Math.max(0, fade);
  c.lineCap = "round";
  const pts = [x, y, x - vx * 0.045, y - vy * 0.045];
  if (!weak) line(c, `${color}30`, 7, pts);
  line(c, color, 2.5, pts);
  line(c, "#fff3d6", 1, [x, y, x - vx * 0.016, y - vy * 0.016]);
  c.restore();
}
function impactLight(c, x, y, kind, age, weak) {
  if (age < 0 || age >= 1) return;
  const p = age, fade = (1 - p) ** 1.6, color = weaponColors[kind];
  c.save();
  c.beginPath();
  c.rect(0, C.playerShotTop, C.width, C.playerY - C.playerShotTop);
  c.clip();
  c.translate(x, y);
  c.globalAlpha = fade * (weak ? 0.65 : 0.9);
  c.lineCap = "round";
  if (kind === "scatter") {
    for (let i = 0; i < (weak ? 3 : 5); i++) {
      const a = -Math.PI * 0.88 + i * Math.PI * 0.19, d = 8 + (1 - (1 - p) ** 2) * (30 + i % 2 * 14);
      impactChip(c, Math.cos(a) * d, Math.sin(a) * d * 0.7, a + p * (i % 2 ? 3 : -3), color, weak ? 3.5 : 6, Math.sqrt(fade) * (weak ? 0.7 : 0.95));
    }
    c.globalCompositeOperation = "lighter";
    line(c, "#fff1c3", weak ? 1.5 : 2.5, [-7, -2, 0, -7, 7, -2]);
    if (!weak) for (const side of [-1, 1]) line(c, color, 1.5, [side * 9, 4, side * (18 + p * 26), 9 + p * 12]);
  } else if (kind === "pierce") {
    c.globalCompositeOperation = "lighter";
    const end = 18 + p * 38;
    line(c, color, weak ? 2 : 3, [0, 14 * (1 - p), 0, -end]);
    line(c, "#fff0ff", 1.2, [-3, 5, 2, -10, 0, -end * 0.78]);
    for (const side of [-1, 1]) {
      line(c, color, weak ? 1 : 1.5, [side * 5, 1, side * (12 + p * 17), -10 - p * 12]);
      if (!weak) impactChip(c, side * (10 + p * 18), -p * 14, side * p * 2, "#d5b4ff", 4.5, Math.sqrt(fade) * 0.85);
    }
  } else if (kind === "arc") {
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < (weak ? 2 : 3); i++) {
      const a = i * Math.PI * 2 / 3 + 0.25, r = 15 + p * 23;
      const path2 = [0, 0, Math.cos(a - 0.2) * r * 0.42, Math.sin(a - 0.2) * r * 0.42, Math.cos(a + 0.16) * r * 0.7, Math.sin(a + 0.16) * r * 0.7, Math.cos(a) * r, Math.sin(a) * r];
      if (!weak) line(c, "#90ffbd2c", 5, path2);
      line(c, color, weak ? 1.5 : 2, path2);
      line(c, "#efffe3", 0.8, path2.slice(0, 6));
    }
    c.strokeStyle = "#d3ffdc";
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(0, 0, 4, 7, 0.4, 0, Math.PI * 2);
    c.stroke();
  } else if (kind === "blast") {
    const r = 10 + p * 35;
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = color;
    c.lineWidth = weak ? 1.5 : 2.5;
    for (let i = 0; i < (weak ? 3 : 6); i++) {
      const a = i * Math.PI * 2 / (weak ? 3 : 6);
      c.beginPath();
      c.ellipse(0, 0, r, r * 0.62, 0, a, a + 0.65);
      c.stroke();
    }
    if (!weak) for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3 + 0.5;
      impactChip(c, Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.55, a + p * 2, "#ffc382", 4.5, Math.sqrt(fade) * 0.9);
    }
    line(c, "#fff3c5", weak ? 2 : 3, [-5, 0, 0, -5, 5, 0]);
  } else {
    c.globalCompositeOperation = "lighter";
    line(c, "#ecfcff", weak ? 2 : 3, [0, 5, 0, -10 * (1 - p)]);
    for (const side of [-1, 1]) {
      const r = 9 + p * 23;
      line(c, color, 1.5, [side * 4, 0, side * r, -r * 0.6]);
      if (!weak) line(c, "#ffdd9d", 1, [side * (r * 0.6), 5, side * (r + 7), 12 + p * 9]);
    }
  }
  c.restore();
}
function impactChip(c, x, y, angle, color, size, opacity) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = opacity;
  c.fillStyle = "#334854";
  c.strokeStyle = color;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-size, -size * 0.45);
  c.lineTo(size * 0.6, -size * 0.7);
  c.lineTo(size * 1.4, size * 0.25);
  c.lineTo(-size * 0.4, size * 0.65);
  c.closePath();
  c.fill();
  c.stroke();
  line(c, "#b9c8ce", 0.8, [-size * 0.6, -size * 0.25, size * 0.6, size * 0.1]);
  c.restore();
}

// src/core/relay-screen.ts
var RELAY_SCREEN = { at: 44.5, guardY: 480, sniperY: 320, conduitY: 560, hold: 4.5, guardOpening: 0.1, sniperOpening: 0.25, durability: 4, relayDelay: 1.2 };
var hasRelayScreen = (round) => round >= 5 && (round - 1) % 3 === 1;

// src/core/supply-convoy.ts
var SUPPLY_CONVOY = { firstRound: 4, interval: 2, armoryAt: 48, guardAt: 49, y: 550, hold: 5.5, lanes: [150, 570] };
var hasSupplyConvoy = (round) => round >= SUPPLY_CONVOY.firstRound && (round - SUPPLY_CONVOY.firstRound) % SUPPLY_CONVOY.interval === 0;

// src/core/boss-formations.ts
var formations = [
  {
    id: "bulwark",
    name: "\u62A4\u536B\u5C4F\u969C",
    hint: "\u5148\u62C6\u60AC\u505C\u62A4\u536B\uFF0C\u89E3\u9664\u9996\u988645%\u51CF\u4F24",
    shieldReduction: 0.45,
    groups: [{ at: 0.2, troops: [{ kind: "guard", x: 220 }, { kind: "guard", x: 500 }] }]
  },
  {
    id: "pincer",
    name: "\u4FA7\u7FFC\u7A81\u88AD",
    hint: "\u7A81\u8FDB\u5206\u6279\u5207\u5165\uFF0C\u7559\u610F\u673A\u4F53\u84C4\u80FD",
    shieldReduction: 0,
    groups: [{ at: 0.4, troops: [{ kind: "charger", x: 140, pattern: "flank", lane: 240 }] }, { at: 2.8, troops: [{ kind: "charger", x: 580, pattern: "flank", lane: 480 }] }]
  },
  {
    id: "crossfire",
    name: "\u72D9\u51FB\u4EA4\u53C9",
    hint: "\u5DE6\u53F3\u54E8\u673A\u4EA4\u9519\u5165\u573A\uFF0C\u53EF\u5148\u51FB\u7834\u4FA7\u7FFC",
    shieldReduction: 0,
    groups: [{ at: 0.2, troops: [{ kind: "sniper", x: 180 }] }, { at: 2.6, troops: [{ kind: "sniper", x: 540 }] }]
  }
];
var bossFormationFor = (round) => {
  const r = Math.max(1, Math.floor(round));
  if (r < 4) return void 0;
  return formations[(r - 1 + Math.floor((r - 4) / 3)) % 3];
};
var ESCORT = { charge: 15, guardDurability: 3, hoverY: 440, holdSeconds: 12, retry: 0.5, deadline: 3 };

// src/core/difficulty.ts
function enemyHealthScale(kind, round) {
  const depth = Math.max(0, Math.floor(round) - 1);
  if (kind === "drone" || kind === "conduit") return 1;
  if (kind === "boss") return (1 + 0.6 * depth + 0.09 * depth * depth) * (1 + Math.max(0, depth - 5));
  if (kind === "charger") return 1 + 0.18 * depth + 0.015 * depth * depth;
  return 1 + 0.4 * depth + 0.06 * depth * depth;
}
function firstAttackDelay(kind) {
  return kind === "boss" ? 0.45 : kind === "elite" ? 1.2 : kind === "armor" || kind === "guard" ? 1.5 : 2.4;
}

// src/core/armory-offers.ts
function armoryOffers(owned, preferred) {
  const order = [.../* @__PURE__ */ new Set([...preferred, "pulse", "scatter", "pierce", "blast", "arc"])];
  return [...order.filter((kind) => !owned.includes(kind)), ...order.filter((kind) => owned.includes(kind))].slice(0, 2);
}
function refitFocus(owned, current, ranks) {
  const linked = [["scatter", ranks.ballistic], ["arc", ranks.electric]].filter(([kind, rank]) => rank > 0 && owned.includes(kind)).sort((a, b) => b[1] - a[1] || Number(b[0] === current) - Number(a[0] === current));
  return linked[0]?.[0] ?? (owned.includes(current) ? current : owned[0]);
}
function armoryChoices(owned, preferred, focus) {
  if (owned.length < 2 || !focus || !owned.includes(focus)) return armoryOffers(owned, preferred).map((kind) => ({ kind, refit: false }));
  const missing = armoryOffers(owned, preferred).find((kind) => !owned.includes(kind));
  if (missing) return [{ kind: missing, refit: false }, { kind: focus, refit: true }];
  const other = [...preferred, ...owned].find((kind) => owned.includes(kind) && kind !== focus);
  return [{ kind: focus, refit: true }, { kind: other, refit: true }];
}

// src/core/conduit.ts
var CONDUIT = { radius: 300, duration: 1.5, hoverY: 560, holdSeconds: 3.5 };
var canDisrupt = (kind) => kind === "guard" || kind === "sniper" || kind === "armor" || kind === "elite";

// src/core/collision.ts
function sweep(ax, ay, bx, by, tx0, ty0, tx1, ty1, rx, ry) {
  const x = ax - tx0, y = ay - ty0;
  const dx = bx - ax - (tx1 - tx0), dy = by - ay - (ty1 - ty0);
  let entry = 0, exit = 1;
  for (const [p, d, r] of [[x, dx, rx], [y, dy, ry]]) {
    if (Math.abs(d) < 1e-10) {
      if (Math.abs(p) > r) return null;
    } else {
      const a = (-r - p) / d, b = (r - p) / d;
      entry = Math.max(entry, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (entry > exit) return null;
    }
  }
  return entry >= 0 && entry <= 1 ? entry : null;
}

// src/core/director.ts
var MID_GATE_AT = 39;
var SWARM = { arrivalY: 360, grace: 0.45 };
var ARMOURED_PACK = { droneRows: [32, 34.2, 34.9], pairXs: [290, 430], screenLead: 1.4 };
var sectorNames = ["\u7A81\u56F4\u8D70\u5ECA", "\u4FA7\u7FFC\u5939\u51FB", "\u91CD\u88C5\u5C01\u9501"];
var sectorIndex = (round) => (Math.max(1, round) - 1) % 3;
var Random = class {
  constructor(seed) {
    this.seed = seed;
  }
  seed;
  next() {
    let x = this.seed | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0;
    return this.seed / 4294967296;
  }
};
function timeline(round, seed, plan = 0) {
  const rng = new Random(seed || 1);
  const mirror = round > 1 && rng.next() > 0.5;
  const out = [];
  const sector = sectorIndex(round);
  const encounter = battleIndex(round, plan);
  const add = (at, kind, x, stage, pair, pattern, lane) => out.push({ at, kind, x: mirror ? 720 - x : x, stage, pair, pattern, lane: lane === void 0 ? void 0 : mirror ? 720 - lane : lane });
  if (sector === 0) [1, 3.5, 5.5].forEach((t, i) => add(t, "drone", [360, 210, 510][i]));
  else if (sector === 1) {
    add(1, "drone", 200, void 0, void 0, "weave");
    add(2.2, "drone", 520, void 0, void 0, "weave");
    add(4.5, "charger", 140, void 0, void 0, "flank", 480);
  } else {
    add(1, "armor", 360, void 0, void 0, "fan");
    add(4, "drone", 360);
    add(5.5, "drone", 360);
  }
  add(8, "crate", 240, 2);
  add(16, "armory", 360);
  add(15.5, "drone", 500, void 0, void 0, sector === 1 ? "weave" : void 0);
  add(17, "drone", 360, void 0, void 0, sector === 1 ? "weave" : void 0);
  add(20, "gates", 360);
  add(27, "gates", 360, void 0, true);
  if (encounter === 0) {
    if (sector === 0) for (let t = 34; t < 42; t += 1.4) {
      add(t, "drone", [200, 360, 520][Math.floor(rng.next() * 3)]);
      add(t + 0.35, "drone", [240, 480][Math.floor(rng.next() * 2)]);
    }
    if (sector === 0) {
      add(38, "armor", 190);
      add(42, "elite", 500);
    } else if (sector === 1) {
      for (const [time, x, lane] of [[31, 140, 480], [37, 580, 240], [43, 140, 480]]) add(time, "charger", x, void 0, void 0, "flank", lane);
      for (let t = 33; t < 42; t += 2) {
        add(t, "drone", 230, void 0, void 0, "weave");
        add(t + 0.5, "drone", 490, void 0, void 0, "weave");
      }
      add(32, "sniper", 500);
      add(38, "guard", 500);
      add(45, "elite", 360, void 0, void 0, "fan");
    } else {
      add(31, "sniper", 180);
      add(35, "guard", 540);
      add(40, "elite", 360, void 0, void 0, "fan");
      for (let t = 33; t < 43; t += 2.5) for (const x of [180, 540]) add(t, "drone", x, void 0, void 0, "weave");
    }
  } else if (sector === 0) {
    if (encounter === 1) {
      add(31, "sniper", 220);
      add(32, "drone", 220);
      add(33.5, "drone", 220);
      add(36, "charger", 520);
      add(39, "armor", 520);
      add(42, "drone", 360);
    } else {
      add(31, "charger", 140, void 0, void 0, "flank", 240);
      add(33, "charger", 580, void 0, void 0, "flank", 480);
      add(36, "drone", 360);
      add(37, "drone", 360);
      add(40, "elite", 220);
      add(43, "drone", 520);
    }
  } else if (sector === 1) {
    if (encounter === 1) {
      add(31, "sniper", 180);
      add(35, "sniper", 540);
      for (const t of [32, 35, 38, 41]) add(t, "drone", 360, void 0, void 0, "weave");
      add(43, "charger", 140, void 0, void 0, "flank", 480);
    } else {
      add(31, "elite", 500, void 0, void 0, "fan");
      add(33, "charger", 140, void 0, void 0, "flank", 320);
      add(37, "charger", 580, void 0, void 0, "flank", 400);
      add(40, "sniper", 180);
      add(43, "drone", 500);
    }
  } else {
    if (encounter === 1) {
      add(31, "guard", 360);
      add(33, "armor", 360);
      add(36, "sniper", 180);
      add(39, "drone", 540);
      add(41, "elite", 540);
    } else {
      add(31, "elite", 180, void 0, void 0, "fan");
      add(34, "drone", 540);
      add(37, "armor", 540, void 0, void 0, "fan");
      add(40, "drone", 180);
      add(42, "sniper", 360);
    }
  }
  add(MID_GATE_AT, "gates", 500);
  add(48, "armory", 360, 3);
  add(58, "gates", 360, void 0, true);
  if (sector === 0) for (let t = 62; t < 68; t += 1.2) {
    for (const x of [200, 360, 520]) add(t + Math.abs(360 - x) / 800, "drone", x);
  }
  else if (sector === 1) for (let t = 61; t < 68; t += 1.5) {
    add(t, "drone", 200, void 0, void 0, "weave");
    add(t + 0.4, "drone", 520, void 0, void 0, "weave");
  }
  else {
    add(60, "armor", 360, void 0, void 0, "fan");
    for (const t of [62, 64, 66]) for (const x of [200, 520]) add(t, "drone", x, void 0, void 0, "weave");
  }
  if (round > 1 && sector === 0) {
    add(13, "charger", 500);
    add(32, "charger", 200);
    add(55, "armor", 500);
  }
  if (round === 1) {
    add(23, "charger", 520);
    add(51, "sniper", 180);
    add(54, "drone", 180);
  } else {
    for (const [time, x] of [[10, 180], [23, 540], [50, 180], [56, 540]]) {
      add(time, sector === 2 ? "guard" : "sniper", x);
      add(time + 1.2, "drone", x, void 0, void 0, "weave");
      add(time + 2.4, "charger", 720 - x, void 0, void 0, "flank", 360);
    }
  }
  if (round > 1) {
    if (sector === 2) {
      add(35, "armor", 220);
      add(36.5, "armor", 220);
    } else for (const x of ARMOURED_PACK.pairXs) add(35, "armor", x);
    for (const spawn of out) if (spawn.kind === "drone" && spawn.at >= 33 && spawn.at < 35) spawn.at -= ARMOURED_PACK.screenLead;
  }
  if (round > 1) {
    const rows = sector === 0 ? [[240, 300, 360, 420, 480], [240, 300, 360, 420, 480], [240, 300, 360, 420, 480]] : sector === 1 ? [[180, 240, 300], [420, 480, 540], [240, 300, 360, 420, 480]] : [[300, 420], [300, 420], [300, 420]];
    rows.forEach((xs, row) => xs.forEach((x, index) => {
      add(ARMOURED_PACK.droneRows[row], "drone", x);
      out[out.length - 1].drop = true;
      out[out.length - 1].dropNotice = row === 0 && index === 0;
    }));
    const reinforcement = (at, kind, x, y, label) => {
      add(at, kind, x);
      Object.assign(out[out.length - 1], { drop: true, dropY: y, dropLabel: label });
    };
    if (sector === 0) {
      reinforcement(44.5, "guard", 360, 440, "\u54E8\u536B\u62A4\u822A");
      reinforcement(44.5, "sniper", 360, 320);
      for (const x of [300, 420]) reinforcement(44.5, "drone", x, 360);
      reinforcement(55.5, "guard", 360, 440, "\u62A4\u822A\u8865\u9635");
      for (const x of [300, 420]) reinforcement(55.5, "drone", x, 360);
    } else if (sector === 1) {
      reinforcement(44.5, "sniper", 240, 360, "\u4EA4\u53C9\u54E8\u9635");
      reinforcement(44.5, "sniper", 480, 360);
      for (const x of [300, 420]) reinforcement(44.5, "drone", x, 420);
      reinforcement(55.5, "guard", 360, 440, "\u5C4F\u969C\u589E\u63F4");
      for (const x of [300, 420]) reinforcement(55.5, "drone", x, 360);
    } else {
      reinforcement(44.5, "armor", 300, 440, "\u88C5\u7532\u7A81\u51FB");
      reinforcement(44.5, "armor", 300, 320);
      reinforcement(44.5, "charger", 480, 360);
      reinforcement(55.5, "armor", 420, 440, "\u7A7F\u7532\u7EB5\u5217");
      reinforcement(55.5, "armor", 420, 320);
      reinforcement(55.5, "drone", 300, 360);
    }
    reinforcement(44.5, "conduit", sector === 0 ? 500 : sector === 1 ? 360 : 540, sector === 1 ? 560 : 360);
    for (const spawn of out) if (spawn.kind in { drone: 1, sniper: 1, guard: 1, charger: 1, armor: 1, elite: 1 } && (spawn.at <= 13 || spawn.at >= 60)) {
      spawn.drop = true;
      spawn.dropY = SWARM.arrivalY;
    }
  }
  if (round === 1) {
    for (const [i, x] of [240, 300, 360].entries()) {
      add(24.5, "drone", x);
      Object.assign(out[out.length - 1], {
        drop: true,
        dropY: SWARM.arrivalY,
        dropLabel: i === 0 ? "\u706B\u529B\u68C0\u9A8C" : void 0,
        dropDetail: "\u5BC6\u96C6\u654C\u7FA4 \xB7 \u8BA9\u65B0\u706B\u529B\u53D1\u6325\u4F5C\u7528"
      });
    }
    for (const s of out) if (s.kind in { drone: 1, sniper: 1, guard: 1, charger: 1, armor: 1, elite: 1 } && (s.at <= 17 || s.at >= 31)) {
      s.drop = true;
      s.dropY = s.at <= 17 ? 320 : s.kind === "armor" ? 500 : SWARM.arrivalY;
    }
  }
  if (round > 1) {
    const sentry = out.filter((s) => s.kind === "sniper" && s.at >= 30 && s.at < 44).sort((a, b) => a.at - b.at)[0] ?? out.find((s) => s.kind === "sniper" && s.at >= 50 && s.at <= 56);
    if (sentry) Object.assign(sentry, {
      pattern: "relocate",
      lane: sentry.x,
      drop: true,
      dropY: SWARM.arrivalY,
      dropLabel: "\u673A\u52A8\u54E8\u673A",
      dropDetail: "\u5165\u573A\u4FA7\u79FB\u62A2\u4F4D \xB7 \u9F50\u5C04\u540E\u518D\u6B21\u6362\u4F4D"
    });
  }
  if (round > 1) {
    const elite = out.find((s) => s.kind === "elite");
    if (elite) Object.assign(elite, { pattern: "intercept", drop: true, dropY: SWARM.arrivalY, dropLabel: "\u622A\u51FB\u7CBE\u82F1", dropDetail: "\u7FFC\u70AE\u538B\u8FB9 \xB7 \u6838\u5FC3\u8FDE\u5C04 \xB7 \u84C4\u80FD\u53EF\u6253\u65AD" });
  }
  if (round > 1) {
    const charger = out.filter((s) => s.kind === "charger" && s.drop).sort((a, b) => a.at - b.at)[0];
    if (charger) Object.assign(charger, { pattern: "rebound", lane: charger.x < 360 ? 480 : 240, dropLabel: "\u6298\u8FD4\u51B2\u950B", dropDetail: "\u5185\u5207\u51B2\u523A \xB7 \u518D\u84C4\u80FD\u6298\u8FD4 \xB7 \u6CE8\u610F\u673A\u4F53\u8F6C\u5411" });
  }
  if (hasSupplyConvoy(round)) {
    const armory = out.find((s) => s.kind === "armory" && s.at === SUPPLY_CONVOY.armoryAt);
    const guard = out.find((s) => s.at === 50 && (s.kind === "sniper" || s.kind === "guard") && s.pattern !== "relocate") ?? out.find((s) => s.at === 56 && (s.kind === "sniper" || s.kind === "guard") && s.pattern !== "relocate");
    if (armory && guard) {
      armory.convoy = true;
      Object.assign(guard, { kind: "guard", at: SUPPLY_CONVOY.guardAt, x: 360, pattern: "convoy", drop: true, dropY: SUPPLY_CONVOY.y, dropLabel: "\u8865\u7ED9\u62A4\u536B", dropDetail: "\u5916\u4FA7\u8865\u7ED9\u4E8C\u9009\u4E00 \xB7 \u4E2D\u592E\u76FE\u536B\u9A7B\u5B88\u538B\u5236" });
    }
  }
  if (round >= 4 && sector === 0) {
    for (const s of out) if (s.kind === "drone" && s.at >= 60) {
      const row = Math.round((s.at - 62) / 1.2), center = s.x === 360, armored = !center && s.x < 360 !== !!(row % 2);
      Object.assign(s, {
        kind: armored ? row % 3 === 0 ? "elite" : "armor" : "drone",
        at: 58 + row * 2 + (center ? 0 : 0.2),
        drop: true,
        dropY: center ? SWEEPER.centerY : armored ? SWEEPER.upperY : SWEEPER.lowerY,
        pattern: center ? void 0 : "sweep",
        lane: center ? void 0 : 720 - s.x,
        dropLabel: center && row === 0 ? "\u659C\u63A0\u62A4\u822A" : void 0,
        dropDetail: center && row === 0 ? "\u62A4\u822A\u6A2A\u7A7F\u6247\u5C04 \xB7 \u8F7B\u673A\u5206\u5C42\u659C\u63A0 \xB7 \u51FB\u7834\u7CBE\u82F1\u5F97\u5145\u80FD" : void 0
      });
    }
  }
  if (hasRelayScreen(round)) {
    for (const s of out) if (s.at === RELAY_SCREEN.at) {
      if (s.kind === "drone") Object.assign(s, { kind: "guard", x: s.x < 360 ? 200 : 520, dropY: RELAY_SCREEN.guardY });
      else if (s.kind === "sniper") Object.assign(s, { x: s.x < 360 ? 200 : 520, dropY: RELAY_SCREEN.sniperY });
      else if (s.kind === "conduit") {
        s.dropY = RELAY_SCREEN.conduitY;
        s.at += RELAY_SCREEN.relayDelay;
      }
      s.pattern = "relay-screen";
      if (s.dropLabel) {
        s.dropLabel = "\u53CC\u76FE\u54E8\u9635";
        s.dropDetail = "\u524D\u76FE\u540E\u54E8 \xB7 \u4E2D\u8DEF\u4E2D\u7EE7\u53EF\u51FB\u7834\u505C\u706B\u5F00\u76FE";
      }
    }
  }
  if (round % 3 === 0) {
    const guns = out.filter((s) => s.at === BATTERY.at && s.kind === "armor");
    guns.forEach((s, i) => Object.assign(s, { x: i === 0 ? mirror ? 500 : 220 : mirror ? 220 : 500, at: BATTERY.at + i * BATTERY.delay, dropY: BATTERY.y, pattern: "battery", dropLabel: i === 0 ? "\u4EA4\u66FF\u70AE\u9635" : void 0, dropDetail: i === 0 ? "\u5DE6\u53F3\u9A7B\u70AE\u9519\u65F6\u6247\u5C04 \xB7 \u4E2D\u8DEF\u4E2D\u7EE7\u53EF\u51FB\u7834\u505C\u706B" : void 0 }));
    const relay = out.find((s) => s.at === BATTERY.at && s.kind === "conduit");
    if (relay) Object.assign(relay, { x: 360, at: BATTERY.at + BATTERY.relayDelay, dropY: BATTERY.relayY, pattern: "battery" });
  }
  if (hasDriftSupply(round)) {
    const supply = out.find((s) => s.kind === "armory" && s.at === DRIFT_SUPPLY.at);
    if (supply) supply.pattern = "drift-supply";
  }
  if (round > 1 && sector === 1) {
    const gun = out.find((s) => s.kind === "sniper" && s.at === LOCKSHOT.at);
    if (gun) {
      Object.assign(gun, { pattern: "lockshot", drop: true, dropY: LOCKSHOT.y, dropLabel: "\u659C\u5C04\u54E8\u673A", dropDetail: "\u9501\u5B9A\u5165\u573A\u4F4D\u7F6E \xB7 \u84C4\u80FD\u53EF\u6253\u65AD \xB7 \u4E09\u8FDE\u5F39\u540E\u64A4\u79BB" });
      if (encounter > 0) Object.assign(gun, { forkshot: true, dropLabel: "\u4E09\u89D2\u54E8\u673A", dropDetail: "\u9996\u5F39\u9501\u4F4D \xB7 \u4E24\u4FA7\u9519\u65F6\u5C04\u51FB \xB7 \u62A2\u5148\u62C6\u70AE\u6216\u7B49\u5B9E\u5F39\u901A\u8FC7" });
    }
  }
  if (round % 3 === 0) {
    const group = out.filter((s) => s.at === FIRE_CONTROL.at), guns = group.filter((s) => s.kind === "armor");
    guns.forEach((s, i) => Object.assign(s, { x: mirror ? 720 - FIRE_CONTROL.gunX : FIRE_CONTROL.gunX, dropY: FIRE_CONTROL.gunYs[i], pattern: "fire-control", dropLabel: void 0, dropDetail: void 0 }));
    const relay = group.find((s) => s.kind === "drone");
    if (relay) Object.assign(relay, { kind: "conduit", x: mirror ? 720 - FIRE_CONTROL.relayX : FIRE_CONTROL.relayX, dropY: FIRE_CONTROL.relayY, pattern: "fire-control", dropLabel: "\u706B\u63A7\u4E2D\u7EE7\u7F16\u961F", dropDetail: "\u4E2D\u7EE7\u589E\u5E45\u53CC\u70AE \xB7 \u51FB\u7834\u53EF\u505C\u706B\u65AD\u4F9B" });
    const screen = out.find((s) => s.kind === "guard" && s.at === 56);
    if (screen) screen.x = mirror ? 720 - FIRE_CONTROL.screenX : FIRE_CONTROL.screenX;
  }
  return out.sort((a, b) => a.at - b.at);
}

// src/core/behavior.ts
var guardClosed = (b) => b.kind === "guard" && b.burst === 0 && !(b.empRemaining ?? 0);
function fanWarningVelocities(b) {
  if (b.kind === "guard") return [-70, 0, 70];
  return b.kind === "elite" ? b.burst ? [-50, 0, 50] : [-100, -50, 0, 50, 100] : [-100, 0, 100];
}
function bossWarningLanes(b) {
  if (b.attack === 3) return [80, 150, 220, 290, 360, 430, 500, 570, 640].filter((x) => Math.abs(x - b.lane) >= 110);
  if (b.attack === 2) return [200, 520];
  return b.attack ? b.burst ? [360] : [b.lane, 360] : [b.lane];
}
function bossAttackForCycle(variant, cycle, counterfire = false) {
  if (counterfire) return counterAttack(variant, cycle);
  if (variant === 1) return [2, 1, 2, 0][((cycle - 2) % 4 + 4) % 4];
  if (variant === 2) return [3, 0, 3, 1][((cycle - 3) % 4 + 4) % 4];
  return cycle % 2;
}
function advanceBody(b, dt, phase, phaseTime, emit, formation = []) {
  if (!b.active) return;
  if (b.pattern === "fire-control" && b.kind === "armor") b.controlLinked = !!fireControlSource(b, formation);
  const scale = b.shotScale ?? 1;
  const shot = scale === 1 ? emit : (x, y, vx = 0, vy = 280) => emit(x, y, vx * scale, vy * scale);
  if (b.dropGrace !== void 0) b.dropGrace = Math.max(0, b.dropGrace - dt);
  const offline = (b.empRemaining ?? 0) > 0;
  if (offline) b.empRemaining = Math.max(0, b.empRemaining - dt);
  b.age += dt;
  b.hit = Math.max(0, b.hit - dt);
  if (b.kind === "boss" && phase !== "boss") return;
  if (!offline) b.timer -= dt;
  if (b.deploying) {
    b.y = Math.min(C.shooterEntry.stationY, b.y + C.shooterEntry.speed * dt);
    if (b.y >= C.shooterEntry.stationY) b.deploying = false;
    return;
  }
  if (b.kind === "crate" && b.pattern === "drift-supply") {
    b.x = b.lane + driftOffset(b.age);
    b.y += b.speed * dt;
    return;
  }
  if (b.kind === "boss") {
    if (!b.counterfire && b.hp <= b.maxHp * BOSS_COUNTER.health) {
      b.counterfire = true;
      b.counterReady = true;
      if (!b.warning && !b.burst) b.timer = Math.min(b.timer, BOSS_COUNTER.lead);
    }
    b.x = 360 + Math.sin(phaseTime * 0.4) * 65;
    if (b.timer <= 1e-9) {
      const finish = () => {
        b.warning = 0;
        b.burst = 0;
        b.attackCycle++;
        b.timer = b.counterReady ? BOSS_COUNTER.lead : b.counterfire ? BOSS_COUNTER.recovery : phaseTime > 35 ? 3.5 : 2.8;
      };
      if (b.burst) {
        if (b.attack === 3) {
          for (const x of bossWarningLanes(b)) for (let i = 0; i < 2; i++) shot(x, b.y + 90 - i * 75, 0, 280);
        } else for (let i = 0; i < 3; i++) shot(360, b.y + 90 - i * 60, 0, 300);
        finish();
      } else if (b.warning <= 0) {
        b.attack = b.counterReady ? 4 : bossAttackForCycle(b.bossVariant, b.attackCycle, !!b.counterfire);
        b.counterReady = false;
        b.warning = b.attack === 4 ? BOSS_COUNTER.warning : 1.35;
        b.timer = b.warning;
        b.lane = b.attack === 3 ? [140, 360, 580][Math.floor(b.attackCycle / 4) % 3] : b.attack ? Math.floor(b.attackCycle / 2) % 2 ? 520 : 200 : [200, 360, 520][Math.floor(b.attackCycle / 2) % 3];
      } else {
        if (b.attack === 4) {
          for (const muzzle of counterMuzzles(b)) for (const vx of BOSS_COUNTER.vx) shot(muzzle.x, muzzle.y, vx, BOSS_COUNTER.vy);
          b.counterVolleys = (b.counterVolleys ?? 0) + 1;
          b.counterShotAge = b.age;
          finish();
        } else if (b.attack === 3) {
          for (const x of bossWarningLanes(b)) for (let i = 0; i < 2; i++) shot(x, b.y + 90 - i * 75, 0, 280);
          b.lane = b.lane === 360 ? 580 : 360;
          b.burst = 1;
          b.warning = 1.8;
          b.timer = 1.8;
        } else if (b.attack === 2) {
          for (const x of [200, 520]) for (let i = 0; i < 4; i++) shot(x, b.y + 90 - i * 50, 0, 300);
          finish();
        } else if (!b.attack) {
          for (let i = 0; i < 5; i++) shot(b.lane, b.y + 90 - i * 45, 0, 320);
          finish();
        } else {
          for (let i = 0; i < 3; i++) shot(b.lane, b.y + 90 - i * 60, 0, 300);
          b.burst = 1;
          b.warning = 0.35;
          b.timer = 0.35;
        }
      }
    }
  } else if (b.kind === "guard") {
    if (b.pattern === "relay-screen" && b.age < RELAY_SCREEN.hold) {
      if (b.y < RELAY_SCREEN.guardY) b.y = Math.min(RELAY_SCREEN.guardY, b.y + b.speed * dt);
    } else if (b.pattern === "convoy" && b.age < SUPPLY_CONVOY.hold) {
      if (b.y < SUPPLY_CONVOY.y) b.y = Math.min(SUPPLY_CONVOY.y, b.y + b.speed * dt);
    } else if (b.escort && b.age < ESCORT.holdSeconds) {
      if (b.y < ESCORT.hoverY) b.y = Math.min(ESCORT.hoverY, b.y + b.speed * dt);
    } else b.y += b.speed * dt;
    if (b.y >= 650) {
      b.warning = 0;
      b.burst = 0;
    } else if (b.y > 0 && b.timer <= 1e-9 && !offline) {
      if (!b.burst) {
        b.burst = 1;
        b.warning = 0.8;
        b.timer = 0.8;
      } else if (b.burst === 1) {
        for (const vx of fanWarningVelocities(b)) shot(b.x, b.y + b.height / 2, vx, 280);
        b.warning = 0;
        b.burst = 2;
        b.timer = 0.8;
      } else {
        b.burst = 0;
        b.timer = 2.4;
      }
    }
  } else if (b.kind === "sniper" && b.pattern === "lockshot") {
    if (lockshotLeaving(b)) {
      b.warning = 0;
      b.burst = 0;
      b.y += LOCKSHOT.exitSpeed * dt;
      return;
    }
    if (b.y < 320) {
      b.y = Math.min(320, b.y + b.speed * dt);
      b.timer = LOCKSHOT.opening;
      return;
    }
    if (b.timer <= 1e-9 && !offline) {
      if (b.warning <= 0 && (!b.burst || b.forkshot)) {
        b.warning = b.forkshot && (b.lockShots ?? 0) > 0 ? FORKSHOT.warning : LOCKSHOT.warning;
        b.timer = b.warning;
      } else {
        const p = lockshotProfile(b);
        b.warning = 0;
        b.burst = 1;
        shot(p.x, p.y, p.vx, p.vy);
        b.lockShots = (b.lockShots ?? 0) + 1;
        b.timer = b.forkshot ? FORKSHOT.recovery : LOCKSHOT.spacing;
      }
    }
  } else if (b.kind === "sniper") {
    const destination = sentryDestination(b);
    if (destination !== void 0) b.x += clamp(destination - b.x, -MOBILE_SENTRY.speed * dt, MOBILE_SENTRY.speed * dt);
    if (b.age >= 10) {
      b.warning = 0;
      b.y += 220 * dt;
    } else if (b.y < 320) {
      b.y = Math.min(320, b.y + b.speed * dt);
      b.timer = 0.6;
    } else if (b.timer <= 1e-9 && !offline) {
      if (b.warning <= 0) {
        b.warning = 1.2;
        b.timer = 1.2;
      } else {
        for (let i = 0; i < 3; i++) shot(b.x, b.y + 58 - i * 45, 0, 620);
        if (b.pattern === "relocate") b.sentryVolleys = (b.sentryVolleys ?? 0) + 1;
        b.warning = 0;
        b.timer = 2.4;
      }
    }
  } else if (b.kind === "conduit") {
    if (b.pattern === "fire-control") {
      if (!fireControlHolding(b)) b.y += b.speed * dt;
      return;
    }
    if (b.age < CONDUIT.holdSeconds) {
      if (b.y < CONDUIT.hoverY) b.y = Math.min(CONDUIT.hoverY, b.y + b.speed * dt);
    } else b.y += b.speed * dt;
  } else if (b.kind === "charger") {
    if (b.pattern === "rebound") {
      b.reboundOrigin ??= b.x;
      const state = reboundState(b);
      b.warning = state.warning;
      b.speed = state.speed;
      if (state.dashing) b.x += clamp(state.destination - b.x, -REBOUND.lateralSpeed * dt, REBOUND.lateralSpeed * dt);
      b.y += b.speed * dt;
      return;
    }
    if (b.age > C.chargerBehavior.warningAge && b.age < C.chargerBehavior.dashAge) b.warning = C.chargerBehavior.dashAge - b.age;
    if (b.age >= C.chargerBehavior.dashAge) {
      b.warning = 0;
      b.speed = C.chargerBehavior.dashSpeed;
      if (b.pattern === "flank") b.x += clamp(b.lane - b.x, -240 * dt, 240 * dt);
    }
    b.y += b.speed * dt;
  } else if (b.kind === "elite" && b.pattern === "intercept") {
    b.y += b.speed * dt;
    if (b.y >= 600) {
      b.warning = 0;
      b.burst = 0;
      b.interceptCoreRemaining = 0;
      return;
    }
    if (b.timer <= 1e-9 && !offline) {
      if ((b.interceptCoreRemaining ?? 0) > 0) {
        shot(b.x, b.y + b.height / 2, 0, INTERCEPTOR.coreVy);
        b.interceptCoreRemaining = (b.interceptCoreRemaining ?? 0) - 1;
        if (!b.interceptCoreRemaining) b.burst = 0;
        b.timer = b.interceptCoreRemaining ? INTERCEPTOR.coreSpacing : INTERCEPTOR.recovery;
      } else if (b.warning <= 0) {
        b.warning = b.burst ? INTERCEPTOR.coreWarning : INTERCEPTOR.wingWarning;
        b.timer = b.warning;
      } else {
        if (b.burst) {
          shot(b.x, b.y + b.height / 2, 0, INTERCEPTOR.coreVy);
          b.interceptCoreRemaining = 2;
          b.timer = INTERCEPTOR.coreSpacing;
        } else {
          for (const muzzle of interceptorMuzzles(b)) shot(muzzle.x, muzzle.y, Math.sign(muzzle.x - b.x) * INTERCEPTOR.wingVx, INTERCEPTOR.wingVy);
          b.burst = 1;
          b.timer = INTERCEPTOR.between;
        }
        b.warning = 0;
      }
    }
  } else {
    if (b.pattern === "sweep") b.x += sweeperDirection(b) * Math.min(Math.abs(b.lane - b.x), SWEEPER.speed * dt);
    if (b.kind === "drone" && b.pattern === "weave") b.x = clamp(b.lane + Math.sin(b.age * 2) * 70, C.minX, C.maxX);
    if (b.kind === "elite" && b.bountyRound !== void 0 && b.age < HUNTER.holdSeconds) {
      if (b.y < HUNTER.hoverY) b.y = Math.min(HUNTER.hoverY, b.y + b.speed * dt);
    } else if (!batteryHolding(b) && !fireControlHolding(b)) b.y += b.speed * dt;
    if ((b.kind === "armor" || b.kind === "elite") && b.y > 0 && b.y < 600) {
      if (b.timer <= 1e-9 && !offline) {
        if (b.warning <= 0) {
          b.warning = b.pattern === "fire-control" ? FIRE_CONTROL.warning : 0.6;
          b.timer = b.warning;
        } else {
          if (b.pattern === "fan" || b.pattern === "sweep" || b.pattern === "battery" || b.pattern === "fire-control" && b.controlLinked) for (const vx of b.kind === "elite" && b.burst ? [-50, 0, 50] : [-100, 0, 100]) shot(b.x, b.y + b.height / 2, vx, 280);
          else shot(b.x, b.y + b.height / 2);
          if (b.kind === "elite" && b.pattern === "fan" && !b.burst) {
            b.burst = 1;
            b.warning = 0.6;
            b.timer = 0.6;
          } else {
            b.burst = 0;
            b.warning = 0;
            b.timer = b.pattern === "fire-control" ? b.controlLinked ? FIRE_CONTROL.boostedRecovery : FIRE_CONTROL.recovery : b.pattern === "fan" || b.pattern === "battery" ? 3.2 : 2.4;
          }
        }
      }
    } else if (b.y >= 600) {
      b.warning = 0;
      b.burst = 0;
    }
  }
}

// src/core/reachability.ts
function dangerTimeline(bodies, bullets, horizon, options = {}) {
  const forecastBodies = bodies.filter((b) => b.active).map((b) => ({ ...b }));
  let forecastBullets = bullets.filter((b) => b.active && b.hostile).map((b) => ({ ...b }));
  const phase = options.phase ?? (forecastBodies.some((b) => b.kind === "boss") ? "boss" : "running");
  const slabs = [];
  let nextId = -1, time = 0;
  for (let step = 0; step < Math.ceil(horizon / 0.1); step++) {
    const intervals = [];
    const reserve = (x0, y0, x1, y1, halfX, halfY) => {
      if (Math.min(y0, y1) - halfY <= C.playerY && Math.max(y0, y1) + halfY >= C.playerY)
        intervals.push([Math.min(x0, x1) - halfX, Math.max(x0, x1) + halfX]);
    };
    for (let sub = 0; sub < 6; sub++) {
      time += C.step;
      for (const b of forecastBodies) {
        const x = b.x, y = b.y;
        advanceBody(b, C.step, phase, (options.phaseTime ?? 0) + time, (sx, sy, vx = 0, vy = 280) => {
          forecastBullets.push({ id: nextId--, x: sx, y: sy, px: sx, py: sy, vx, vy, damage: 1, age: 0, active: true, hostile: true });
        }, forecastBodies);
        if (b.kind !== "gate" && b.kind !== "pickup" && b.kind !== "boss")
          reserve(x, y, b.x, b.y, b.width / 2 + C.playerRadius + 12, b.height / 2 + C.playerRadius + 12);
      }
      for (const b of forecastBullets) {
        const x = b.x, y = b.y;
        b.x += b.vx * C.step;
        b.y += b.vy * C.step;
        b.age += C.step;
        reserve(x, y, b.x, b.y, 39, 43);
      }
      forecastBullets = forecastBullets.filter((b) => b.age < 6 && b.y < 1370 && b.x > -40 && b.x < 760);
    }
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const interval of intervals) {
      const last = merged[merged.length - 1];
      if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]);
      else merged.push([...interval]);
    }
    slabs.push(merged);
  }
  return slabs;
}
function safeRoute(x, bodies, bullets, horizon = 3, options = {}) {
  const start = clamp(x, C.minX, C.maxX);
  const positions = [.../* @__PURE__ */ new Set([start, ...Array.from({ length: 25 }, (_, i) => C.minX + (C.maxX - C.minX) * i / 24)])].sort((a, b) => a - b);
  let reachable = /* @__PURE__ */ new Map([[start, { cost: 0, path: [] }]]);
  const reaction = options.reaction ?? 0.45;
  const timeline2 = dangerTimeline(bodies, bullets, horizon, options);
  for (let step = 0; step < timeline2.length; step++) {
    const next = /* @__PURE__ */ new Map();
    const availableMove = C.moveSpeed * Math.max(0, Math.min(0.1, (step + 1) * 0.1 - reaction));
    for (const px of positions) for (const [previous, value] of reachable) {
      const distance = Math.abs(previous - px);
      if (distance > availableMove + 1e-8) continue;
      if (timeline2[step].some(([lo, hi]) => Math.max(previous, px) >= lo && Math.min(previous, px) <= hi)) continue;
      const cost = value.cost + distance;
      if (!next.has(px) || next.get(px).cost > cost) next.set(px, { cost, path: [...value.path, px] });
    }
    reachable = next;
    if (!reachable.size) return null;
  }
  return [...reachable.values()].sort((a, b) => a.cost - b.cost)[0]?.path ?? [];
}

// src/core/world.ts
var World = class {
  // initialRound supports deterministic replay fixtures; normal UI always starts
  // with the default round 1, T1 and zero bonus.
  constructor(seed = 1337, initialRound = 1, openingWeapon, battlePlan = 0) {
    this.openingWeapon = openingWeapon;
    this.battlePlan = battlePlan;
    this.seed = seed;
    this.round = Math.max(1, Math.floor(initialRound));
    this.scheduled = timeline(this.round, seed, this.battlePlan);
  }
  openingWeapon;
  battlePlan;
  interceptorBreaks = 0;
  lockPreemptWins = 0;
  lockBaitWins = 0;
  build = new BuildTree();
  firstEquipmentResearch = false;
  firstArmoryResearch = false;
  bossResearchPoints = 0;
  contractResearchPoints = 0;
  get researchPoints() {
    return Number(this.firstEquipmentResearch) + Number(this.firstArmoryResearch) + this.bossResearchPoints + this.contractResearchPoints;
  }
  get buildPoints() {
    return (this.growth.mastery ?? 0) + this.researchPoints;
  }
  equipmentResearch(exclusive) {
    const before = this.researchPoints;
    this.firstEquipmentResearch = true;
    if (exclusive) this.firstArmoryResearch = true;
    return this.researchPoints - before;
  }
  chooseBuild(route, branch) {
    if (isIonAugment(branch) && !this.canRefineIon()) return false;
    if (isFractureAugment(branch) && !this.canRefineFracture()) return false;
    if (isPhotonAugment(branch) && !this.canRefinePhoton()) return false;
    if (isMagneticAugment(branch) && !this.canRefineMagnetic()) return false;
    if (!this.build.choose(route, this.buildPoints, branch)) return false;
    if (isFractureAugment(branch)) this.effects.push({ type: "combination", x: this.player.x, y: C.playerY, text: "\u88C2\u7532\u7CBE\u7814 \xB7 " + fractureAugments[branch].name, detail: fractureAugments[branch].detail + " \xB7 \u5E38\u89C4\u7CBE\u8C03\u4FDD\u7559" });
    if (isPhotonAugment(branch)) this.effects.push({ type: "combination", x: this.player.x, y: C.playerY, text: "\u5149\u94FE\u7CBE\u7814 \xB7 " + photonAugments[branch].name, detail: photonAugments[branch].detail + " \xB7 \u5E38\u89C4\u7CBE\u8C03\u4FDD\u7559" });
    if (isMagneticAugment(branch)) this.effects.push({ type: "combination", x: this.player.x, y: C.playerY, text: "\u78C1\u66B4\u7CBE\u7814 \xB7 " + magneticAugments[branch].name, detail: branch === "field-wide" ? `\u534A\u5F84${MAGNETIC_REFINEMENT.wideRadius} \xB7 \u6BCF\u62CD${MAGNETIC_REFINEMENT.wideDamage * 100}% \xB7 \u5E38\u89C4\u7CBE\u8C03\u4FDD\u7559` : `\u573A\u5916${MAGNETIC_REFINEMENT.linkRange}\u5185\u4E00\u654C \xB7 \u539F\u4E09\u62CD/\u5E38\u89C4\u7CBE\u8C03\u4FDD\u7559` });
    if (isIonAugment(branch)) this.effects.push({ type: "combination", x: this.player.x, y: C.playerY, text: "\u79BB\u5B50\u7CBE\u7814 \xB7 " + ionAugments[branch].name, detail: ionAugments[branch].detail + " \xB7 \u539F\u653E\u7535\u4E0E\u5E38\u89C4\u7CBE\u8C03\u4FDD\u7559" });
    const kind = route === "ballistic" ? "scatter" : route === "electric" ? "arc" : null;
    if (kind && !this.activeWeapons.includes(kind)) {
      for (const owned of this.activeWeapons) {
        this.weaponStages.set(owned, this.weaponStage(owned));
        this.acquiredWeapons.add(owned);
      }
      this.weaponStages.set(kind, 1);
      this.acquiredWeapons.add(kind);
    }
    this.announceMagnetic();
    this.announceLaserChain();
    return true;
  }
  dropSpawns = 0;
  dropKills = 0;
  arcLinks = 0;
  fireControlShots = 0;
  fireControlBoostedShots = 0;
  lastFireControlBreak;
  conduitBursts = 0;
  empTargets = 0;
  conduitTacticalWins = 0;
  dischargeConduit(source) {
    this.conduitBursts++;
    let affected = 0, interrupted = 0;
    for (const b of this.bodies) if (b.active && canDisrupt(b.kind) && !(b.dropGrace ?? 0) && b.y >= C.playerShotTop && b.y <= C.playerY && Math.hypot(b.x - source.x, b.y - source.y) <= CONDUIT.radius) {
      if (b.warning > 0) interrupted++;
      if ((b.empRemaining ?? 0) < CONDUIT.duration) {
        affected++;
        this.empTargets++;
      }
      b.empRemaining = Math.max(b.empRemaining ?? 0, CONDUIT.duration);
      b.warning = 0;
      b.burst = 0;
      b.timer = Math.max(b.timer, 0.6);
      if (b.pattern === "intercept") b.interceptCoreRemaining = 0;
    }
    if (interrupted >= 2) this.conduitTacticalWins++;
    if (source.pattern === "fire-control") this.lastFireControlBreak = { time: this.time, id: source.id, affected, interrupted };
    this.effects.push({ type: "emp", x: source.x, y: source.y, size: CONDUIT.radius, text: `${source.pattern === "fire-control" ? "\u706B\u63A7\u65AD\u4F9B" : "\u4E2D\u7EE7\u51FB\u7834"} \xB7 ${affected}\u53F0\u505C\u706B`, detail: source.pattern === "fire-control" ? `\u4E2D\u65AD${interrupted}\u53F0\u84C4\u80FD \xB7 \u6062\u590D\u5355\u7EBF\uFF0C\u65E7\u5F39\u4ECD\u5371\u9669` : interrupted ? `\u4E2D\u65AD${interrupted}\u53F0\u84C4\u80FD \xB7 \u5DF2\u53D1\u654C\u5F39\u4ECD\u5371\u9669` : "\u505C\u706B1.5\u79D2 \xB7 \u5DF2\u53D1\u654C\u5F39\u4ECD\u5371\u9669" });
  }
  scatterPierces = 0;
  scatterBursts = 0;
  scatterSplashHits = 0;
  scatterRicochets = 0;
  ionCharge = 0;
  ionBursts = 0;
  ionHits = 0;
  ionOrbs = [];
  ionSpears = [];
  ionOrbSpawns = 0;
  ionOrbHits = 0;
  ionSpearShots = 0;
  ionSpearHits = 0;
  ionBonusDamage = 0;
  canRefineIon() {
    return this.build.ranks.electric >= 3 && this.build.refinements.electric >= 2 && !this.build.ionAugment && this.activeWeapons.includes("arc") && this.weaponStage("arc") >= 3 && !this.canRefineMagnetic();
  }
  ionLive() {
    return this.player.hp > 0 && !this.bossVictory && (this.phase === "running" || this.phase === "boss");
  }
  launchIon(body, damage) {
    if (!this.ionLive() || body.y <= C.playerShotTop) return;
    const base = { x: body.x, y: body.y, px: body.x, py: body.y, age: 0, damage, active: true, originId: body.id };
    if (this.build.ionAugment === "ion-orb" && this.ionOrbs.filter((p) => p.active).length < ION_ORB.limit) {
      const y = Math.min(C.playerY - 24, body.y + Math.min(80, body.height / 2 + 32));
      this.ionOrbs.push({ ...base, y, py: y, id: this.nextId++, pulses: 0 });
      this.ionOrbSpawns++;
    }
    if (this.build.ionAugment === "ion-spear" && body.y - 12 > C.playerShotTop && this.ionSpears.filter((p) => p.active).length <= ION_SPEAR.limit - 2) {
      for (const side of [-1, 1]) {
        let x = body.x + side * 12, y = body.y - 12;
        const target = this.bodies.filter((b) => b.active && b.id !== body.id && b.kind in C.enemies && !guardClosed(b) && !(b.dropGrace ?? 0) && (b.x - body.x) * side > 24 && b.y <= body.y + 32 && b.y >= C.playerShotTop && b.y <= C.playerY && !(b.kind === "boss" && this.phase !== "boss") && Math.hypot(b.x - x, b.y - y) <= ION_SPEAR.aimRange).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y) || a.id - b.id)[0];
        const fallback = !target && side === -1 && body.active && body.hp > 0 && !guardClosed(body) && !(body.dropGrace ?? 0);
        if (fallback) {
          x = body.x - body.width / 2 - 16;
          y = body.y + 16;
        }
        const aim = target ?? (fallback ? body : void 0);
        const dx = aim ? aim.x - x : side, dy = aim ? Math.min(-16, aim.y - y) : -1, length = Math.hypot(dx, dy), speed = ION_SPEAR.speed * Math.SQRT2;
        this.ionSpears.push({ ...base, id: this.nextId++, x, px: x, y, py: y, vx: dx / length * speed, vy: dy / length * speed, remaining: ION_SPEAR.targets, hitBodies: fallback ? [] : [body.id] });
      }
      this.ionSpearShots += 2;
    }
  }
  ionBonusHit(body, damage, orb) {
    const before = body.hp;
    this.hit(body, damage, "arc");
    if (body.hp < before) {
      if (orb) this.ionOrbHits++;
      else this.ionSpearHits++;
      this.ionBonusDamage += Math.min(before, before - body.hp);
    }
  }
  /** Derived projectiles share chronological contact resolution, without calling electric procs. */
  advanceIon(dt, add) {
    if (!this.ionLive()) {
      this.ionOrbs = [];
      this.ionSpears = [];
      return;
    }
    for (const p of [...this.ionOrbs, ...this.ionSpears]) {
      if (!p.active) continue;
      const orb = "pulses" in p, life = orb ? ION_ORB.life : ION_SPEAR.life, oldAge = p.age;
      const duration = Math.min(dt, Math.max(0, life - oldAge));
      p.px = p.x;
      p.py = p.y;
      p.x += (orb ? 0 : p.vx) * duration;
      p.y += (orb ? -ION_ORB.speed : p.vy) * duration;
      p.age += dt;
      const fraction = Math.min(duration / dt, p.y < C.playerShotTop ? (p.py - C.playerShotTop) / (p.py - p.y) * duration / dt : 1);
      for (const b of this.bodies) {
        if (!b.active || b.kind === "pickup" || b.kind === "boss" && this.phase !== "boss" || b.id === p.originId && (orb || p.hitBodies.includes(b.id))) continue;
        const blocker = b.kind === "crate" || b.kind === "gate" || guardClosed(b);
        if (orb && !blocker) continue;
        const scale = duration > 0 ? fraction * dt / duration : 0;
        const contact = sweep(p.px, p.py, p.px + (p.x - p.px) * scale, p.py + (p.y - p.py) * scale, b.px, b.py, b.px + (b.x - b.px) * fraction, b.py + (b.y - b.py) * fraction, b.width / 2 + 5, b.height / 2 + 5);
        add(contact === null ? null : contact * fraction, 0, p.id, () => {
          if (!p.active || !b.active || !this.ionLive()) return;
          if (orb) {
            if (b.kind === "crate" || b.kind === "gate" || guardClosed(b)) p.active = false;
            return;
          }
          if (p.hitBodies.includes(b.id)) return;
          p.hitBodies.push(b.id);
          if (b.kind === "crate" || b.kind === "gate" || (b.dropGrace ?? 0) > 0) {
            p.active = false;
            return;
          }
          this.ionBonusHit(b, p.damage * ION_SPEAR.damage, false);
          if (guardClosed(b) || --p.remaining <= 0) p.active = false;
        });
      }
      if (orb) while (p.pulses < ION_ORB.pulses.length && ION_ORB.pulses[p.pulses] <= Math.min(life, p.age) + 1e-9) {
        const t = Math.max(0, (ION_ORB.pulses[p.pulses++] - oldAge) / dt), y = p.py - ION_ORB.speed * t * dt;
        add(t, 0.5, p.id, () => {
          if (!p.active || !this.ionLive() || y < C.playerShotTop) return;
          const targets = this.bodies.filter((b) => b.active && b.kind in C.enemies && !guardClosed(b) && !(b.dropGrace ?? 0) && !(b.kind === "boss" && this.phase !== "boss") && b.y >= C.playerShotTop && b.y <= C.playerY).map((b) => ({ b, d: Math.hypot(b.px + (b.x - b.px) * t - p.x, b.py + (b.y - b.py) * t - y) })).filter((v) => v.d <= ION_ORB.radius).sort((a, b) => a.d - b.d || a.b.id - b.b.id).slice(0, ION_ORB.targets);
          this.effects.push({ type: "ion-storm", x: p.x, y, size: ION_ORB.radius, weaponKind: "arc" });
          for (const { b } of targets) {
            if (!this.ionLive()) break;
            if (b.active) this.ionBonusHit(b, p.damage * ION_ORB.damage, true);
          }
        });
      }
    }
  }
  ionReadyAt = 0;
  ionImpact(body, damage) {
    if (this.build.ranks.electric < 3 || this.bossVictory || this.phase !== "running" && this.phase !== "boss") return;
    this.ionCharge = Math.min(ION_STORM.hits, this.ionCharge + 1);
    if (this.ionCharge < ION_STORM.hits || this.time + 1e-9 < this.ionReadyAt) return;
    const targets = this.bodies.filter((target) => target.active && target.kind in C.enemies && !guardClosed(target) && !(target.dropGrace ?? 0) && target.y >= C.playerShotTop && target.y <= C.playerY && !(target.kind === "boss" && this.phase !== "boss") && Math.hypot(target.x - body.x, target.y - body.y) <= ION_STORM.radius);
    if (!targets.length) return;
    this.ionCharge = 0;
    this.ionReadyAt = this.time + ION_STORM.cooldown;
    this.ionBursts++;
    this.effects.push({ type: "ion-storm", x: body.x, y: body.y, size: ION_STORM.radius, weaponKind: "arc" });
    for (const target of targets) {
      if (!target.active || this.bossVictory || this.phase !== "running" && this.phase !== "boss") continue;
      const before = target.hp;
      this.hit(target, damage * ION_STORM.damage, "arc");
      if (target.hp < before) this.ionHits++;
    }
    this.launchIon(body, damage);
  }
  seekerLinks = 0;
  capacitorBursts = 0;
  capacitor(body, damage) {
    if (this.build.electricBranch !== "capacitor" || !body.active || !(body.kind in C.enemies) || guardClosed(body) || body.y < C.playerShotTop || body.y > C.playerY || body.kind === "boss" && this.phase !== "boss") return;
    body.capacitorHits = (body.capacitorHits ?? 0) + 1;
    if (body.capacitorHits < ELECTRIC_FORK.hits) return;
    body.capacitorHits = 0;
    this.capacitorBursts++;
    this.effects.push({ type: "capacitor", x: body.x, y: body.y, size: 100, weaponKind: "arc" });
    this.hit(body, damage * ELECTRIC_FORK.damage, "arc");
  }
  burnHits = 0;
  relayHits = 0;
  opticalSecondary(body, damage) {
    if (!(body.kind in C.enemies) || guardClosed(body) || (body.dropGrace ?? 0) > 0) return;
    if (this.build.opticalBranch === "burn") {
      if (!body.active) return;
      body.burnDamage = Math.max(body.burnDamage ?? 0, damage * OPTICAL_FORK.burnDamage);
      body.burnTicks = OPTICAL_FORK.burnTicks;
      body.burnTimer = Math.min(body.burnTimer ?? OPTICAL_FORK.burnInterval, OPTICAL_FORK.burnInterval);
    }
  }
  splitLaser(damage) {
    const x = this.player.x, start = C.playerY - 100;
    const candidates = this.bodies.filter((b) => b.active && b.kind in C.enemies && b.y >= C.playerShotTop && b.y < start && !(b.kind === "boss" && this.phase !== "boss") && Math.abs(b.x - x) > b.width / 2 + 8 && Math.abs(b.x - x) <= OPTICAL_FORK.relayRange).sort((a, b) => Math.hypot(a.x - x, a.y - start) - Math.hypot(b.x - x, b.y - start) || a.id - b.id);
    const target = candidates[0];
    if (!target) return;
    const contacts = this.bodies.filter((b) => b.active && b.kind !== "pickup" && b.y >= C.playerShotTop && b.y < start && !(b.kind === "boss" && this.phase !== "boss")).map((body) => ({ body, t: sweep(x, start, target.x, target.y, body.x, body.y, body.x, body.y, body.width / 2 + 5, body.height / 2 + 5) })).filter((hit2) => hit2.t !== null).sort((a, b) => a.t - b.t || a.body.id - b.body.id);
    const hit = contacts[0];
    if (!hit) return;
    const endX = x + (target.x - x) * hit.t, endY = start + (target.y - start) * hit.t;
    this.relayHits++;
    this.effects.push({ type: "refract", x, y: start, targetX: endX, targetY: endY });
    this.hit(hit.body, damage * OPTICAL_FORK.relayDamage, "pulse");
    return hit.body.id;
  }
  laserArcHits = 0;
  laserFocusHits = 0;
  laserLinkEnergy = 0;
  laserLinkTargets = /* @__PURE__ */ new Set();
  get laserChainReady() {
    return this.laserLinkEnergy > 0;
  }
  announcedLaserChain = false;
  laserChainUnlocked() {
    return canLaserChain(this.build, this.activeWeapons.includes("arc") ? this.weaponStage("arc") : 0);
  }
  canRefinePhoton() {
    return this.laserChainUnlocked() && !this.build.photonAugment;
  }
  announceLaserChain() {
    if (this.announcedLaserChain || !this.laserChainUnlocked()) return;
    this.announcedLaserChain = true;
    this.laserTimer = 0;
    this.effects.push({ type: "combination", x: this.player.x, y: C.playerY, text: "\u7EC4\u5408\u5B8C\u6210 \xB7 \u7535\u5149\u8FDE\u9501", detail: "\u5168\u6B66\u5668\u76F4\u51FB\u91CA\u51FA \xB7 \u7FA4\u654C\u8DF3\u94FE / \u5355\u4F53\u805A\u80FD" });
  }
  laserChain(origin, damage, visited) {
    if (!this.laserChainUnlocked() || this.bossVictory || this.phase !== "running" && this.phase !== "boss") return "blocked";
    const hits = this.laserArcHits, profile = laserChainProfile(this.build.photonAugment);
    let from = origin;
    for (let hop = 0; hop < profile.hops; hop++) {
      if (this.bossVictory) break;
      const target = this.bodies.filter((b) => b.active && b.kind in C.enemies && (!visited.has(b.id) || guardClosed(b) || (b.dropGrace ?? 0) > 0) && b.y >= C.playerShotTop && b.y <= C.playerY && !(b.kind === "boss" && this.phase !== "boss") && Math.hypot(b.x - from.x, b.y - from.y) <= profile.range).sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y) || a.id - b.id)[0];
      if (!target) break;
      if (guardClosed(target) || (target.dropGrace ?? 0) > 0) return this.laserArcHits > hits ? "hit" : "blocked";
      visited.add(target.id);
      damage *= profile.decay;
      const before = target.hp;
      this.hit(target, damage, "pulse");
      if (target.hp < before) {
        this.laserArcHits++;
        this.effects.push({ type: "laser-arc", x: from.x, y: from.y, targetX: target.x, targetY: target.y });
      }
      from = target;
    }
    return this.laserArcHits > hits ? "hit" : "none";
  }
  releaseLaserLink(source) {
    if (this.laserLinkEnergy <= 0 || source.y < C.playerShotTop || source.y > C.playerY) return;
    const visited = new Set(this.laserLinkTargets);
    visited.add(source.id);
    let result = this.laserChain(source, this.laserLinkEnergy, visited);
    if (result === "none") {
      const target = this.bodies.find((b) => b.id === source.id && b.active && b.kind in C.enemies && !guardClosed(b) && !(b.dropGrace ?? 0));
      if (target) {
        const before = target.hp;
        this.hit(target, this.laserLinkEnergy * laserChainProfile(this.build.photonAugment).focus, "pulse");
        if (target.hp < before) {
          this.laserFocusHits++;
          this.effects.push({ type: "laser-focus", x: target.x, y: target.y });
          result = "hit";
        }
      }
    }
    if (result === "hit") {
      this.laserLinkEnergy = 0;
      this.laserLinkTargets.clear();
    }
  }
  advanceBurn(dt) {
    if (this.phase !== "running" && this.phase !== "boss") return;
    for (const body of this.bodies) {
      if (!body.active || !body.burnTicks || body.y < C.playerShotTop || body.y > C.playerY || body.kind === "boss" && this.phase !== "boss") continue;
      body.burnTimer = (body.burnTimer ?? OPTICAL_FORK.burnInterval) - dt;
      while (body.active && body.burnTicks > 0 && body.burnTimer <= 1e-9) {
        body.burnTimer += OPTICAL_FORK.burnInterval;
        body.burnTicks--;
        this.burnHits++;
        this.effects.push({ type: "burn-tick", x: body.x, y: body.y, weaponKind: "blast" });
        this.hit(body, body.burnDamage ?? 0, "blast");
      }
      if (!body.burnTicks) body.burnDamage = void 0;
    }
  }
  fractureBursts = 0;
  magneticFields = [];
  magneticBursts = 0;
  magneticHits = 0;
  magneticLinkHits = 0;
  magneticWideHits = 0;
  lastMagneticRefinementHit;
  lastMagneticHit;
  magneticProofHits = 0;
  magneticCertifications = /* @__PURE__ */ new Set();
  recordMagneticProofHit(target) {
    if (target.proofRound === this.round && target.proofGroup && this.contract?.recordMagneticGroup(target.proofGroup, this.round)) this.magneticProofHits++;
  }
  magneticReadyAt = 0;
  magneticId = 0;
  announcedMagnetic = false;
  magneticUnlocked() {
    return this.activeWeapons.includes("blast") && this.weaponStage("blast") >= 2 && this.build.ranks.electric >= 2;
  }
  canRefineMagnetic() {
    return this.magneticUnlocked() && this.build.ranks.electric >= 3 && !this.build.magneticAugment;
  }
  announceMagnetic() {
    if (this.announcedMagnetic || !this.magneticUnlocked()) return;
    this.announcedMagnetic = true;
    this.effects.push({ type: "combination", x: this.player.x, y: C.playerY, text: "\u7EC4\u5408\u5B8C\u6210 \xB7 \u78C1\u66B4\u69B4\u5F39", detail: "\u7206\u88C2\u547D\u4E2D\u7559\u4E0B\u4E09\u62CD\u7535\u573A \xB7 \u539F\u706B\u529B\u4FDD\u7559" });
  }
  leaveMagnetic(body, damage) {
    if (!this.magneticUnlocked() || this.bossVictory || this.phase !== "running" && this.phase !== "boss" || this.time + 1e-9 < this.magneticReadyAt || this.magneticFields.length >= MAGNETIC.limit) return;
    this.magneticReadyAt = this.time + MAGNETIC.cooldown;
    this.magneticBursts++;
    this.magneticFields.push({ id: ++this.magneticId, x: body.x, y: body.y, age: 0, damage: damage * (this.build.magneticAugment === "field-wide" ? MAGNETIC_REFINEMENT.wideDamage : MAGNETIC.damage), pulses: 0, radius: this.build.magneticAugment === "field-wide" ? MAGNETIC_REFINEMENT.wideRadius : MAGNETIC.radius, link: this.build.magneticAugment === "field-link" });
  }
  advanceMagnetic(dt) {
    if (this.phase !== "running" && this.phase !== "boss") {
      this.magneticFields = [];
      return;
    }
    for (const field of this.magneticFields) {
      field.age += dt;
      field.y += C.scrollSpeed * dt;
      while (field.pulses < MAGNETIC.pulses.length && field.age + 1e-9 >= MAGNETIC.pulses[field.pulses]) {
        field.pulses++;
        for (const target of this.bodies) {
          if (this.bossVictory || this.player.hp <= 0) break;
          if (!target.active || !(target.kind in C.enemies) || guardClosed(target) || (target.dropGrace ?? 0) > 0 || target.y < C.playerShotTop || target.y > C.playerY || target.kind === "boss" && this.phase !== "boss" || Math.hypot(target.x - field.x, target.y - field.y) > (field.radius ?? MAGNETIC.radius)) continue;
          const before = target.hp;
          this.hit(target, field.damage, "blast");
          if (target.hp < before) {
            this.magneticHits++;
            if ((field.radius ?? MAGNETIC.radius) > MAGNETIC.radius && Math.hypot(target.x - field.x, target.y - field.y) > MAGNETIC.radius) {
              this.magneticWideHits++;
              this.recordMagneticProofHit(target);
              this.lastMagneticRefinementHit = { mode: "field-wide", fieldId: field.id, targetId: target.id, time: this.time, x: target.x, y: target.y, fromX: field.x, fromY: field.y, distance: Math.hypot(target.x - field.x, target.y - field.y) };
            }
            this.lastMagneticHit = { fieldId: field.id, targetId: target.id, time: this.time, x: target.x, y: target.y };
            this.effects.push({ type: "magnetic-hit", x: target.x, y: target.y, weaponKind: "arc", fieldId: field.id, targetId: target.id });
          }
        }
        if (field.link && !this.bossVictory && this.player.hp > 0) {
          const distance = (b) => Math.hypot(b.x - field.x, b.y - field.y), priority = (b) => ["sniper", "armor", "elite", "guard", "boss"].includes(b.kind) && b.warning > 0 ? 1 : 0;
          const target = this.bodies.filter((b) => b.active && b.kind in C.enemies && !guardClosed(b) && !(b.dropGrace ?? 0) && b.y >= C.playerShotTop && b.y <= C.playerY && !(b.kind === "boss" && this.phase !== "boss") && distance(b) > (field.radius ?? MAGNETIC.radius) && distance(b) <= MAGNETIC_REFINEMENT.linkRange).sort((a, b) => priority(b) - priority(a) || distance(a) - distance(b) || a.id - b.id)[0];
          if (target) {
            const before = target.hp;
            this.hit(target, field.damage, "arc");
            if (target.hp < before) {
              this.magneticLinkHits++;
              this.recordMagneticProofHit(target);
              this.lastMagneticRefinementHit = { mode: "field-link", fieldId: field.id, targetId: target.id, time: this.time, x: target.x, y: target.y, fromX: field.x, fromY: field.y, distance: distance(target) };
              this.lastMagneticHit = { fieldId: field.id, targetId: target.id, time: this.time, x: target.x, y: target.y, link: true };
              this.effects.push({ type: "magnetic-link", x: field.x, y: field.y, targetX: target.x, targetY: target.y, fieldId: field.id, targetId: target.id, weaponKind: "arc" });
            }
          }
        }
      }
    }
    this.magneticFields = this.magneticFields.filter((f) => f.age < MAGNETIC.life && f.y - (f.radius ?? MAGNETIC.radius) < C.playerY);
    if (this.bossVictory || this.player.hp <= 0) this.magneticFields = [];
  }
  announcedFracture = false;
  fractureUnlocked() {
    return this.activeWeapons.includes("pierce") && this.activeWeapons.includes("blast") && this.weaponStage("pierce") >= 2 && this.weaponStage("blast") >= 2;
  }
  canRefineFracture() {
    return this.fractureUnlocked() && this.build.ranks.ballistic >= 3 && !this.build.fractureAugment;
  }
  fractureProfile() {
    return fractureProfile(this.build.fractureAugment);
  }
  fractureWaves = 0;
  fractureWaveHits = 0;
  fractureFinishWaves = 0;
  fractureFinishHits = 0;
  fractureWaveDamage = 0;
  lastFractureWaveHit;
  announceFracture() {
    this.announceMagnetic();
    if (!this.announcedFracture && this.fractureUnlocked()) {
      this.announcedFracture = true;
      this.effects.push({ type: "combination", x: this.player.x, y: C.playerY, text: "\u7EC4\u5408\u5B8C\u6210 \xB7 \u88C2\u7532\u7206\u7834", detail: "\u7A7F\u7532\u8FDE\u7EED\u547D\u4E2D3\u6B21\u5F15\u7206 \xB7 \u539F\u6709\u706B\u529B\u4FDD\u7559" });
    }
  }
  fracture(body, damage) {
    if (this.bossVictory || this.player.hp <= 0 || !this.fractureUnlocked() || !body.active || !(body.kind in C.enemies) || guardClosed(body) || this.time < (body.fractureReadyAt ?? 0)) return;
    const profile = this.fractureProfile();
    body.fractureHits = (body.fractureHits ?? 0) + 1;
    if (body.fractureHits < profile.hits) return;
    body.fractureHits = 0;
    body.fractureReadyAt = this.time + FRACTURE.cooldown;
    this.fractureBursts++;
    this.effects.push({ type: "fracture", x: body.x, y: body.y, size: FRACTURE.radius, weaponKind: "blast" });
    this.hit(body, damage * FRACTURE.direct, "blast");
    if (this.bossVictory) return;
    for (const other of this.bodies) if (other !== body && other.active && other.kind in C.enemies && other.y >= C.playerShotTop && other.y <= C.playerY && !(other.kind === "boss" && this.phase !== "boss") && Math.hypot(other.x - body.x, other.y - body.y) <= FRACTURE.radius) {
      if (this.bossVictory) break;
      this.hit(other, damage * FRACTURE.splash, "blast");
    }
    if (this.build.fractureAugment === "fracture-line" && !this.bossVictory) this.fractureWave(body, damage);
  }
  fractureWave(source, damage, fromKill = false) {
    if (this.bossVictory || this.player.hp <= 0) return;
    const start = source.y, top = Math.max(C.playerShotTop, start - FRACTURE_LINE.range);
    if (top >= start) return;
    const candidates = this.bodies.filter((b) => b.active && b.id !== source.id && b.kind !== "pickup" && b.y - b.height / 2 <= start && b.y >= C.playerShotTop && b.y <= C.playerY && !(b.kind === "boss" && this.phase !== "boss")).map((b) => ({ b, t: sweep(source.x, start, source.x, top, b.x, b.y, b.x, b.y, b.width / 2 + FRACTURE_LINE.width / 2, b.height / 2) })).filter((h) => h.t !== null).sort((a, b) => a.t - b.t || a.b.id - b.b.id);
    let end = top, count = 0;
    for (const { b } of candidates) {
      if (this.bossVictory || this.player.hp <= 0) break;
      if (!b.active) continue;
      const contact = Math.min(start, b.y + b.height / 2), blocked = guardClosed(b) || (b.dropGrace ?? 0) > 0;
      if (b.kind === "gate" || b.kind === "crate" || (b.dropGrace ?? 0) > 0) {
        end = contact;
        break;
      }
      const before = b.hp;
      this.hit(b, damage * FRACTURE_LINE.damage, "blast");
      if (b.hp < before) {
        const applied = Math.min(before, before - b.hp);
        this.fractureWaveHits++;
        this.fractureWaveDamage += applied;
        if (fromKill) this.fractureFinishHits++;
        this.lastFractureWaveHit = { time: this.time, sourceId: source.id, targetId: b.id, fromKill, x: source.x, y: start, targetX: b.x, targetY: b.y, damage: applied };
      }
      if (blocked || ++count >= FRACTURE_LINE.targets || this.bossVictory) {
        end = contact;
        break;
      }
    }
    this.fractureWaves++;
    if (fromKill) this.fractureFinishWaves++;
    this.effects.push({ type: "fracture-wave", x: source.x, y: start, targetX: source.x, targetY: end });
  }
  /** Player intent affects future offers only; never upgrades or rewrites an admitted reward. */
  refitTarget;
  setRefitTarget(kind) {
    if (kind !== void 0 && !this.activeWeapons.includes(kind)) return false;
    this.refitTarget = kind;
    return true;
  }
  calibrations = /* @__PURE__ */ new Map();
  weaponCalibration(kind) {
    return this.calibrations.get(kind) ?? 0;
  }
  profileFor(kind) {
    return builtWeapon(kind, this.weaponStage(kind), this.weaponCalibration(kind), this.build);
  }
  supportProfile() {
    return builtSupport(this.growth.mastery, this.build);
  }
  bossWins = 0;
  bossLootRounds = [];
  get bossRewardRound() {
    return this.bossLootRounds[0] ?? null;
  }
  bossLootStats = { claimed: 0, research: 0, equipment: 0 };
  claimBossReward(kind) {
    if (this.bossRewardRound === null || this.player.hp <= 0 || this.phase === "dead") return false;
    if (kind !== "research" && !this.activeWeapons.includes(kind)) return false;
    this.bossLootRounds.shift();
    this.bossLootStats.claimed++;
    if (kind === "research") {
      this.bossResearchPoints++;
      this.bossLootStats.research++;
      this.effects.push({ type: "research", x: this.player.x, y: C.playerY, text: "\u9996\u9886\u84DD\u56FE \xB7 \u7814\u53D1+1\u70B9", detail: "\u53EF\u63A8\u8FDB\u6280\u80FD\u8DEF\u7EBF \xB7 \u5DF2\u6709\u706B\u529B\u4FDD\u7559" });
    } else {
      this.bossLootStats.equipment++;
      this.upgradeOwnedWeapon(kind);
    }
    this.announceFracture();
    this.announceLaserChain();
    return true;
  }
  upgradeOwnedWeapon(kind) {
    for (const owned of this.activeWeapons) if (!this.weaponStages.has(owned)) this.weaponStages.set(owned, this.weaponStage(owned));
    const stage = this.weaponStage(kind);
    if (stage < 3) {
      this.weaponStages.set(kind, stage + 1);
      this.growth.stage = Math.max(this.growth.stage, stage + 1);
      this.maxStage = Math.max(this.maxStage, stage + 1);
    } else this.calibrations.set(kind, this.weaponCalibration(kind) + 1);
    this.effects.push({ type: "upgrade", x: this.player.x, y: C.playerY, weaponKind: kind, text: stage < 3 ? `${weaponNames[kind]} \xB7 \u5347\u81F3T${stage + 1}` : `${weaponNames[kind]} \xB7 \u4E13\u5C5E\u7CBE\u6821${this.weaponCalibration(kind)}`, detail: stage < 3 ? "\u5176\u4ED6\u914D\u4EF6\u4E0E\u5DF2\u6709\u706B\u529B\u4FDD\u7559" : `\u8BE5\u6B66\u5668\u4F24\u5BB3\u7CFB\u6570 ${100 + this.weaponCalibration(kind) * 50}%` });
  }
  stormLinks = 0;
  prismHits = 0;
  proofWins = 0;
  aceWins = 0;
  flawlessAceWins = 0;
  certifiedBuilds = /* @__PURE__ */ new Set();
  availableProofs() {
    return Object.keys(buildProofs).filter((kind) => kind === "magnetic" ? this.magneticUnlocked() && !!this.build.magneticAugment : kind === "storm" ? this.build.ranks.ballistic >= 3 && this.build.ranks.electric >= 1 : kind === "prism" ? this.supportProfile().prism : kind === "fracture" ? this.fractureUnlocked() : kind === "ion" ? this.build.ranks.electric >= 3 : kind === "ricochet" ? this.build.ballisticBranch === "ricochet" && this.activeWeapons.includes("scatter") : this.laserChainUnlocked());
  }
  proofCount(kind) {
    return kind === "magnetic" ? this.magneticProofHits : kind === "storm" ? this.stormLinks : kind === "prism" ? this.prismHits : kind === "fracture" ? this.fractureBursts : kind === "ion" ? this.ionHits : kind === "ricochet" ? this.scatterRicochets : this.laserArcHits;
  }
  contractStats = { accepted: 0, won: 0, failed: 0, claimed: 0 };
  refitsClaimed = 0;
  contract;
  contractReward;
  claimContractReward(kind) {
    if (!this.contractReward || this.player.hp <= 0) return false;
    if (kind !== "energy" && !this.activeWeapons.includes(kind)) return false;
    const reward = this.contractReward;
    this.contractReward = void 0;
    this.contractStats.claimed++;
    if (kind === "energy") {
      const result = grantGate(this.growth, reward.charge, "energy");
      if (result.activated) this.emit("overload", this.player.x, C.playerY);
      this.effects.push({ type: "reward", x: this.player.x, y: C.playerY, text: `\u5951\u7EA6\u5956\u52B1 \xB7 \u5145\u80FD+${reward.charge}`, detail: this.chargeReceipt(result.activated) });
    } else {
      this.upgradeOwnedWeapon(kind);
    }
    if (reward.research) {
      this.contractResearchPoints += reward.research;
      this.effects.push({ type: "research", x: this.player.x, y: C.playerY, text: `\u738B\u724C\u60AC\u8D4F \xB7 \u7814\u53D1+${reward.research}\u70B9`, detail: "\u9886\u53D6\u989D\u5916\u7814\u53D1 \xB7 \u9009\u62E9\u5347\u7EA7\u8DEF\u7EBF" });
    }
    this.announceFracture();
    this.announceLaserChain();
    return true;
  }
  bountyShots = 0;
  damageTaken = 0;
  canAcceptContract(kind, proof, hunt) {
    return kind in contracts && !this.contractReward && this.phase === "running" && this.roundTime <= 40 && this.player.hp > 0 && this.contract?.status !== "active" && this.contract?.round !== this.round && (kind !== "hunter" || this.activeWeapons.some((k) => this.weaponStage(k) >= 2)) && (kind === "research" ? this.availableProofs().includes(proof ?? this.availableProofs()[0]) : proof === void 0) && (hunt === void 0 || kind === "hunter" && Object.hasOwn(hunts, hunt));
  }
  acceptContract(kind, proof, hunt) {
    if (!this.canAcceptContract(kind, proof, hunt)) return false;
    const selected = kind === "research" ? proof ?? this.availableProofs()[0] : void 0;
    this.contract = new Contract(kind, this.round, this.kills, this.activeWeapons.length, this.damageTaken, selected ? { kind: selected, start: this.proofCount(selected) } : void 0, hunt);
    this.contractStats.accepted++;
    return true;
  }
  spawnCrossfire(challenge) {
    if (challenge.reinforcements || challenge.elapsed < challenge.nextReinforcement) return;
    if (this.bodies.filter((b) => b.active && b.kind in C.enemies).length + 2 > C.limits.enemies) {
      challenge.nextReinforcement = challenge.elapsed + HUNTER.retry;
      return;
    }
    const candidates = [220, 500].map((x) => {
      const b = this.spawn("elite", x, 180);
      b.hp *= hunts.crossfire.durability;
      b.maxHp = b.hp;
      b.pattern = "fan";
      b.bountyRound = challenge.round;
      return b;
    });
    if (!safeRoute(this.player.x, this.bodies, this.bullets, 22, { phase: this.phase, phaseTime: this.phaseTime })) {
      for (const b of candidates) {
        delete b.bountyRound;
        b.active = false;
      }
      this.fallbackCount++;
      challenge.nextReinforcement = challenge.elapsed + HUNTER.retry;
      return;
    }
    challenge.reinforcements = 2;
    this.effects.push({ type: "drop-wave", x: 360, y: C.playerY, text: "\u53CC\u7EBF\u738B\u724C \xB7 \u540C\u65F6\u51FA\u51FB", detail: "\u4E24\u4FA7\u5F3A\u5316\u6247\u5C04\u7CBE\u82F1 \xB7 \u5168\u7834\u989D\u5916\u7814\u53D11\u70B9" });
  }
  spawnProofWave(challenge) {
    if (!challenge.proof || challenge.reinforcements >= PROOF_WAVES.groups || challenge.elapsed < challenge.nextReinforcement) return;
    const troops = proofFormation(challenge.proof.kind);
    if (this.bodies.filter((b) => b.active && b.kind in C.enemies).length + troops.length > C.limits.enemies) {
      challenge.nextReinforcement = challenge.elapsed + PROOF_WAVES.retry;
      return;
    }
    const candidates = troops.map((t) => {
      const b = this.spawn(t.kind, t.x, t.y);
      b.proofTarget = true;
      if ("pattern" in t) b.pattern = t.pattern;
      if (challenge.proof?.kind === "magnetic") {
        b.hp *= MAGNETIC_PROOF.durability;
        b.maxHp = b.hp;
      }
      if (challenge.proof?.kind === "ricochet" || challenge.proof?.kind === "magnetic") {
        b.proofGroup = challenge.reinforcements + 1;
        b.proofRound = this.round;
      }
      b.dropGrace = SWARM.grace;
      return b;
    });
    const horizon = Math.max(...candidates.map((b) => (C.playerY - b.y) / b.speed + 1));
    if (!safeRoute(this.player.x, this.bodies, this.bullets, horizon, { phase: this.phase, phaseTime: this.phaseTime })) {
      for (const b of candidates) b.active = false;
      this.fallbackCount++;
      challenge.nextReinforcement = challenge.elapsed + PROOF_WAVES.retry;
      return;
    }
    challenge.reinforcements++;
    challenge.nextReinforcement = challenge.elapsed + PROOF_WAVES.spacing;
    this.effects.push({ type: "drop-wave", x: 360, y: C.playerY, text: `\u6784\u7B51\u68C0\u9A8C \xB7 ${buildProofs[challenge.proof.kind].name}`, detail: `\u9A8C\u8BC1\u654C\u9635 ${challenge.reinforcements}/${PROOF_WAVES.groups} \xB7 \u6295\u9001\u5C4F\u969C\u540E\u53EF\u547D\u4E2D` });
  }
  growth = { stage: 1, bonus: 0, energy: 0, overload: 0 };
  weaponKind = "pulse";
  player = { x: 360, px: 360, hp: 3, invulnerable: 0 };
  lastDamageCause = null;
  bodies = [];
  bullets = [];
  effects = [];
  phase = "running";
  round = 1;
  time = 0;
  roundTime = 0;
  phaseTime = 0;
  score = 0;
  lockshotSpawns = 0;
  lockshotShots = 0;
  shots = 0;
  hits = 0;
  kills = 0;
  cratesBroken = 0;
  pickups = 0;
  gatesTaken = 0;
  lastEquipmentPickup;
  maxStage = 1;
  peakBodies = 0;
  peakBullets = 0;
  fallbackCount = 0;
  attackDeferrals = 0;
  nextId = 1;
  nextRow = 1;
  fireTimers = /* @__PURE__ */ new Map();
  laserTimer = 0;
  laserCharge() {
    const support = this.supportProfile();
    if (!support.laserUnlocked || this.player.hp <= 0 || this.phase !== "running" && this.phase !== "boss") return 0;
    return clamp(1 - this.laserTimer / support.laserInterval, 0, 1);
  }
  acquiredWeapons = /* @__PURE__ */ new Set();
  weaponStages = /* @__PURE__ */ new Map();
  weaponStage(kind) {
    return this.weaponStages.get(kind) ?? this.growth.stage;
  }
  get activeWeapons() {
    return this.acquiredWeapons.size ? [...this.acquiredWeapons] : [this.weaponKind];
  }
  scheduled;
  scheduleIndex = 0;
  escortSpawns = 0;
  escortKills = 0;
  tacticalWins = 0;
  escortGroup = 0;
  escortRetry = 0;
  bossEscortKills = 0;
  bossEscortSpawns = 0;
  bossStartDamage = 0;
  get bossFormation() {
    return bossFormationFor(this.round);
  }
  get activeEscorts() {
    return this.bodies.filter((b) => b.active && b.escort && b.y < 1344);
  }
  bossShieldActive() {
    return this.phase === "boss" && this.bossFormation?.id === "bulwark" && this.activeEscorts.some((b) => b.kind === "guard");
  }
  spawnEscorts() {
    const formation = this.bossFormation;
    if (!formation || !this.bodies.some((b) => b.active && b.kind === "boss")) return;
    while (this.escortGroup < formation.groups.length) {
      const group = formation.groups[this.escortGroup];
      if (this.phaseTime < group.at || this.phaseTime < this.escortRetry) return;
      if (this.phaseTime > group.at + ESCORT.deadline) {
        this.escortGroup++;
        continue;
      }
      if (this.bodies.filter((b) => b.active && b.kind in C.enemies).length + group.troops.length > C.limits.enemies) {
        this.escortRetry = this.phaseTime + ESCORT.retry;
        return;
      }
      const candidates = group.troops.map((t) => {
        const b = this.spawn(t.kind, t.x, 180);
        b.escort = true;
        if (b.kind === "guard") {
          b.hp *= ESCORT.guardDurability;
          b.maxHp = b.hp;
        }
        b.pattern = t.pattern;
        b.lane = t.lane ?? t.x;
        return b;
      });
      const horizon = Math.max(...candidates.map((b) => Math.max(3, (C.playerY - b.y) / Math.max(1, b.speed) + 1)));
      if (!safeRoute(this.player.x, this.bodies, this.bullets, horizon, { phase: this.phase, phaseTime: this.phaseTime })) {
        for (const b of candidates) b.active = false;
        this.fallbackCount++;
        this.escortRetry = this.phaseTime + ESCORT.retry;
        return;
      }
      this.escortSpawns += candidates.length;
      this.bossEscortSpawns += candidates.length;
      this.escortGroup++;
      this.effects.push({ type: "formation", x: 360, y: 400, text: formation.name, detail: formation.hint });
    }
  }
  bossVictory = false;
  secondChance = false;
  nextSpawnRetry = 0;
  seed;
  emit(type, x, y, text, size) {
    this.effects.push({ type, x, y, text, size });
  }
  drainEffects() {
    const out = this.effects;
    this.effects = [];
    return out;
  }
  overloadNotice() {
    const level = this.growth.mastery ?? 0;
    const milestone = supportMilestone(level);
    return milestone ? `${milestone} \xB7 \u6C38\u4E45\u706B\u529B+10%` : "\u5145\u80FD\u7A81\u7834 \xB7 \u6C38\u4E45\u706B\u529B+10% \xB7 \u8D85\u8F7D6\u79D2";
  }
  spawn(kind, x, y = -80, stage = 2) {
    const enemy = kind in C.enemies ? C.enemies[kind] : null;
    const hpScale = enemy ? enemyHealthScale(kind, this.round) : 1;
    const hp = enemy ? enemy.hp * hpScale : kind === "crate" ? stage === 3 ? 112 : 48 : 1;
    const body = {
      id: this.nextId++,
      kind,
      x,
      y,
      px: x,
      py: y,
      width: enemy?.width ?? (kind === "gate" ? 240 : kind === "pickup" ? 46 : 96),
      height: enemy?.height ?? (kind === "gate" ? 138 : kind === "pickup" ? 54 : 110),
      hp,
      maxHp: hp,
      speed: enemy ? enemy.speed * Math.min(1.15, 1 + (this.round - 1) * 0.05) : this.scrollSpeed,
      active: true,
      age: 0,
      timer: enemy ? firstAttackDelay(kind) : 2.4,
      warning: 0,
      hit: 0,
      shotScale: enemy ? enemyProjectileScale(this.round) : 1,
      deploying: y < 0 && ["armor", "elite", "guard"].includes(kind),
      energy: 0,
      row: 0,
      stage,
      rewardKind: this.growth.bonus >= 100 ? "energy" : "power",
      attack: 0,
      lane: kind === "boss" ? 360 : x,
      attackCycle: 0,
      burst: 0
    };
    this.bodies.push(body);
    return body;
  }
  get scrollSpeed() {
    return C.scrollSpeed + Math.min(2, this.round - 1) * 10;
  }
  spawnGates(x, pair) {
    const row = this.nextRow++;
    for (const cx of pair ? [222, 498] : [x]) {
      const g = this.spawn("gate", cx, 180);
      g.row = row;
      if (pair && this.growth.bonus < 100) g.rewardKind = cx < 360 ? "power" : "energy";
      if (!pair && x === 360) g.width = 264;
    }
  }
  admit(candidate) {
    const arrival = candidate.pattern === "fire-control" ? Math.max(0, FIRE_CONTROL.hold - candidate.age) + (C.playerY - candidate.y) / Math.max(1, candidate.speed) : candidate.kind === "conduit" ? Math.max(0, CONDUIT.holdSeconds - candidate.age) + (C.playerY - Math.max(candidate.y, CONDUIT.hoverY)) / Math.max(1, candidate.speed) : (C.playerY - candidate.y) / Math.max(1, candidate.speed);
    const horizon = Math.max(3, arrival + 1);
    if (safeRoute(this.player.x, this.bodies, this.bullets, horizon, { reaction: C.spawnSafetyReaction })) return true;
    candidate.active = false;
    this.fallbackCount++;
    this.nextSpawnRetry = this.roundTime + 0.5;
    return false;
  }
  rewardSlots(needed) {
    return this.bodies.filter((b) => b.active && (b.kind === "gate" || b.kind === "crate" || b.kind === "pickup")).length + needed <= C.limits.rewards;
  }
  director(dt) {
    if (this.phase === "running") {
      this.roundTime += dt;
      if (!this.secondChance && this.roundTime >= 25 && this.growth.stage === 1 && this.roundTime >= this.nextSpawnRetry && this.rewardSlots(1)) {
        this.secondChance = this.admit(this.spawn("crate", 480, 180, 2));
      }
      while (this.scheduleIndex < this.scheduled.length && this.scheduled[this.scheduleIndex].at <= this.roundTime && this.roundTime >= this.nextSpawnRetry) {
        const s = this.scheduled[this.scheduleIndex++];
        if (s.pattern === "fire-control") {
          const group = [s];
          while (this.scheduled[this.scheduleIndex + group.length - 1]?.pattern === "fire-control" && this.scheduled[this.scheduleIndex + group.length - 1]?.at === s.at) group.push(this.scheduled[this.scheduleIndex + group.length - 1]);
          if (this.bodies.filter((b) => b.active && b.kind in C.enemies).length + group.length > C.limits.enemies) {
            this.scheduleIndex--;
            break;
          }
          const units = group.map((spawn) => {
            const b = this.spawn(spawn.kind, spawn.x, spawn.dropY);
            b.pattern = "fire-control";
            b.controlGroup = this.round;
            b.dropGrace = SWARM.grace;
            b.timer = FIRE_CONTROL.opening;
            b.hp *= b.kind === "armor" ? FIRE_CONTROL.durability : FIRE_CONTROL.relayDurability;
            b.maxHp = b.hp;
            return b;
          });
          const longest = units.reduce((a, b) => (C.playerY - a.y) / a.speed > (C.playerY - b.y) / b.speed ? a : b);
          if (!this.admit(longest)) {
            for (const b of units) b.active = false;
            this.scheduleIndex--;
            break;
          }
          this.scheduleIndex += group.length - 1;
          this.dropSpawns += units.length;
          this.effects.push({ type: "drop-wave", x: 360, y: C.playerY, text: "\u706B\u63A7\u4E2D\u7EE7\u7F16\u961F", detail: "\u4E2D\u7EE7\u589E\u5E45\u53CC\u70AE \xB7 \u51FB\u7834\u53EF\u505C\u706B\u65AD\u4F9B" });
          continue;
        }
        if (s.kind === "armory") {
          if (!this.rewardSlots(2)) {
            this.scheduleIndex--;
            break;
          }
          const row = this.nextRow++;
          const choices = this.round > 3 ? [["arc", "scatter"], ["blast", "pierce"], ["pulse", "arc"]] : [["scatter", "pierce"], ["blast", "arc"], ["pulse", "blast"]];
          const chapterChoices = choices[sectorIndex(this.round)];
          const offered = armoryChoices(this.activeWeapons, chapterChoices, this.round > 1 ? this.refitTarget ?? refitFocus(this.activeWeapons, this.weaponKind, this.build.ranks) : void 0);
          const crates = (s.convoy ? SUPPLY_CONVOY.lanes : [222, 498]).map((x, i) => {
            const offer = offered[i], stage = offer.refit ? Math.min(3, this.weaponStage(offer.kind) + 1) : Math.max(2, s.stage ?? 2, this.growth.stage);
            const b = this.spawn("crate", x, 180, stage);
            b.row = row;
            b.weaponKind = offer.kind;
            b.refit = offer.refit;
            if (offer.refit && this.refitTarget === offer.kind) b.directedRefit = true;
            if (s.pattern === "drift-supply") {
              b.pattern = s.pattern;
              b.dropGrace = DRIFT_SUPPLY.opening;
            }
            return b;
          });
          if (!this.admit(crates[0])) {
            for (const b of crates) b.active = false;
            this.scheduleIndex--;
            break;
          }
          if (s.pattern === "drift-supply") this.effects.push({ type: "drop-wave", x: 360, y: C.playerY, text: "\u6ED1\u884C\u519B\u68B0\u7BB1", detail: "\u62A4\u76D60.45\u79D2\u540E\u5F00\u542F \xB7 \u6A2A\u79FB\u8DDF\u67AA \xB7 \u788E\u540E\u62FE\u53D6" });
        } else if (s.kind === "gates") {
          if (this.growth.overload > 0 && this.growth.energy >= 100) {
            if (!this.admit(this.spawn("drone", 360))) {
              this.scheduleIndex--;
              break;
            }
          } else {
            if (!this.rewardSlots(s.pair ? 2 : 1)) {
              this.scheduleIndex--;
              break;
            }
            this.spawnGates(s.x, !!s.pair);
          }
        } else if (s.kind === "crate") {
          if (!this.rewardSlots(1)) {
            this.scheduleIndex--;
            break;
          }
          const crate = this.spawn("crate", s.x, 180, s.stage);
          if (this.round === 1 && s.at === 8 && this.openingWeapon) {
            crate.weaponKind = this.openingWeapon;
            crate.openingSupply = true;
          }
          if (!this.admit(crate)) {
            this.scheduleIndex--;
            break;
          }
        } else {
          const enemyCount = this.bodies.filter((b) => b.active && b.kind in C.enemies).length;
          if (enemyCount >= C.limits.enemies) {
            this.scheduleIndex--;
            break;
          }
          const candidate = this.spawn(s.kind, s.x, s.drop ? s.dropY ?? SWARM.arrivalY : void 0);
          if (s.drop) candidate.dropGrace = SWARM.grace;
          candidate.pattern = s.pattern;
          candidate.lane = s.lane ?? s.x;
          if (s.pattern === "battery" && s.kind === "armor") {
            candidate.timer = s.at === BATTERY.at ? BATTERY.opening : BATTERY.secondOpening;
            candidate.hp *= BATTERY.durability;
            candidate.maxHp = candidate.hp;
          }
          if (s.pattern === "lockshot") {
            candidate.lockX = this.player.x;
            candidate.timer = LOCKSHOT.opening;
            if (s.forkshot) candidate.forkshot = true;
          }
          if (s.pattern === "intercept") candidate.timer = INTERCEPTOR.opening;
          if (s.pattern === "sweep" && s.kind !== "drone") candidate.timer = SWEEPER.opening;
          if (s.pattern === "relay-screen") {
            candidate.timer = s.kind === "guard" ? RELAY_SCREEN.guardOpening : RELAY_SCREEN.sniperOpening;
            if (s.kind === "guard" || s.kind === "sniper") {
              candidate.hp *= RELAY_SCREEN.durability;
              candidate.maxHp = candidate.hp;
            }
          }
          if (!this.admit(candidate)) {
            this.scheduleIndex--;
            break;
          }
          if (s.drop) this.dropSpawns++;
          if (s.pattern === "lockshot") {
            candidate.lockDamageStart = this.damageTaken;
            this.lockshotSpawns++;
          }
          if (s.dropNotice) this.effects.push({ type: "drop-wave", x: 360, y: C.playerY, text: "\u7A81\u964D\u673A\u7FA4", detail: "\u77ED\u6682\u6295\u9001\u5C4F\u969C \xB7 \u7FA4\u653B\u53EF\u5FEB\u901F\u6E05\u573A" });
          if (s.dropLabel) this.effects.push({ type: "drop-wave", x: 360, y: C.playerY, text: s.dropLabel, detail: s.dropDetail ?? (s.kind === "guard" ? "\u524D\u76FE\u540E\u63F4 \xB7 \u7559\u610F\u8F6C\u706B\u89D2\u5EA6" : s.kind === "sniper" ? "\u4E24\u4FA7\u54E8\u673A \xB7 \u4F18\u5148\u538B\u5236\u4E00\u7FFC" : "\u88C5\u7532\u7EB5\u5217 \xB7 \u96C6\u4E2D\u706B\u529B\u7A81\u7834") });
        }
      }
      if (this.roundTime >= 72 && this.scheduleIndex >= this.scheduled.length && !this.bodies.some((b) => b.active)) {
        this.phase = "boss-entry";
        this.phaseTime = 0;
        this.escortGroup = 0;
        this.escortRetry = 0;
        this.bossEscortKills = 0;
        this.bossEscortSpawns = 0;
        this.bossStartDamage = this.damageTaken;
        const boss = this.spawn("boss", 360, -150);
        boss.speed = 0;
        boss.bossVariant = sectorIndex(this.round);
        boss.attackCycle = [0, 2, 3][boss.bossVariant];
        this.emit("alert", 360, 360, `${sectorNames[sectorIndex(this.round)]} \xB7 \u9996\u9886\u8B66\u6212`);
      }
    } else if (this.phase === "boss-entry") {
      this.phaseTime += dt;
      const boss = this.bodies.find((b) => b.kind === "boss" && b.active);
      if (boss) boss.y = -150 + Math.min(1, this.phaseTime / 2) * (C.bossY + 150);
      if (this.phaseTime >= 2) {
        this.phase = "boss";
        this.phaseTime = 0;
      }
    } else if (this.phase === "boss") {
      this.phaseTime += dt;
      this.spawnEscorts();
    } else if (this.phase === "recovery") {
      this.phaseTime += dt;
      if (this.phaseTime >= 4) {
        this.round++;
        this.roundTime = 0;
        this.phaseTime = 0;
        this.phase = "running";
        this.scheduleIndex = 0;
        this.secondChance = this.growth.stage > 1;
        this.nextSpawnRetry = 0;
        this.scheduled = timeline(this.round, this.seed + this.round * 719, this.battlePlan);
        this.effects.push({
          type: "round",
          x: 360,
          y: 400,
          text: `\u7B2C ${this.round} \u8F6E \xB7 ${sectorNames[sectorIndex(this.round)]}`,
          detail: `${battleBrief(this.round, this.battlePlan)} \xB7 \u654C\u5F39+${Math.round((enemyProjectileScale(this.round) - 1) * 100)}% \xB7 \u7559\u610F\u5B9E\u5F39`
        });
      }
    }
  }
  arcVelocity(x, y) {
    const straight = { vx: 0, vy: -ARC_SHOT.speed };
    if (this.bodies.some((b) => b.active && (b.kind === "crate" || b.kind === "gate") && b.y >= C.playerShotTop && b.y < y && Math.abs(b.x - x) <= b.width / 2 + 3)) return straight;
    const target = this.bodies.filter((b) => b.active && b.kind in C.enemies && (b.kind !== "boss" || this.phase === "boss") && b.y >= C.playerShotTop && b.y <= y - ARC_SHOT.minLead && !(b.dropGrace ?? 0) && Math.abs(b.x - x) <= Math.min(ARC_SHOT.aimWidth, (y - b.y) * ARC_SHOT.maxSlope)).sort((a, b) => b.y - a.y || a.id - b.id)[0];
    if (!target) return straight;
    const dx = target.x - x, dy = target.y - y, length = Math.hypot(dx, dy);
    return { vx: dx / length * ARC_SHOT.speed, vy: dy / length * ARC_SHOT.speed };
  }
  shoot(dt) {
    if (this.phase === "boss-entry" || this.phase === "recovery") {
      this.fireTimers.clear();
      this.laserTimer = 0;
      return;
    }
    for (const kind of this.activeWeapons) {
      let timer = (this.fireTimers.get(kind) ?? 0) - dt;
      const w = this.profileFor(kind), calibrationBand = calibrationVisualBand(this.weaponCalibration(kind));
      while (timer <= 1e-9) {
        if (this.bullets.filter((b) => b.active && !b.hostile).length + w.offsets.length > C.limits.bullets) throw new Error("Player bullet budget exceeded");
        for (let i = 0; i < w.offsets.length; i++) {
          const x = this.player.x + w.offsets[i], y = C.playerY - (w.muzzleY ?? 72);
          const velocity = kind === "arc" ? this.arcVelocity(x, y) : { vx: w.vx[i], vy: -C.bulletSpeed };
          this.bullets.push({
            id: this.nextId++,
            x,
            y,
            px: x,
            py: y,
            ...velocity,
            damage: w.damage[i] * (1 + permanentPower(this.growth) / 100) * (this.growth.overload > 0 ? 1.35 : 1),
            age: 0,
            active: true,
            hostile: false,
            weaponKind: kind,
            remainingTargets: w.targets,
            hitBodies: [],
            splashRadius: w.splashRadius,
            chainHops: w.chainHops,
            ...calibrationBand ? { calibrationBand } : {}
          });
          this.shots++;
        }
        this.effects.push({ type: "fire", x: this.player.x, y: C.playerY - 70, size: this.weaponStage(kind), weaponKind: kind });
        timer += 1 / w.rate;
      }
      this.fireTimers.set(kind, timer);
    }
    const support = this.supportProfile();
    if (support.laserUnlocked) {
      this.laserTimer -= dt;
      if (this.laserTimer <= 0) {
        this.laserTimer += support.laserInterval;
        const start = C.playerY - 100, laserDamage = support.laserDamage * (1 + permanentPower(this.growth) / 100) * (this.growth.overload > 0 ? 1.35 : 1);
        const opticalBand = laserVisualBand(this.growth.mastery, this.build.ranks.optical);
        const visited = /* @__PURE__ */ new Set();
        let origin, mainBlocked = false;
        for (const side of support.prism ? [0, -1, 1] : [0]) {
          const x = this.player.x + side * 42, topX = this.player.x + side * 180;
          const beamX = (y) => x + (topX - x) * (start - y) / (start - C.playerShotTop);
          const targets = this.bodies.filter((b) => b.active && b.kind !== "pickup" && (b.kind !== "boss" || this.phase === "boss") && b.y >= C.playerShotTop && b.y < start && Math.abs(b.x - beamX(b.y)) <= b.width / 2 + 8).sort((a, b) => b.y - a.y || a.id - b.id);
          let end = C.playerShotTop, count = 0;
          for (const body of targets) {
            const blocked = body.kind === "crate" || body.kind === "gate" || guardClosed(body) || (body.dropGrace ?? 0) > 0;
            const damage = support.laserDamage * (side === 0 ? 1 : 0.45) * (1 + permanentPower(this.growth) / 100) * (this.growth.overload > 0 ? 1.35 : 1);
            visited.add(body.id);
            if (side === 0 && count === 0) {
              mainBlocked = blocked;
              if (!blocked && body.kind in C.enemies) origin = { x: body.x, y: body.y, id: body.id };
            }
            const before = body.hp, beforeEnergy = body.energy;
            this.hit(body, damage, "pulse");
            if (side !== 0 && body.kind in C.enemies && body.hp < before) this.prismHits++;
            if (body.hp < before || body.kind === "gate" && body.energy > beforeEnergy) {
              const contactY = blocked ? Math.min(start, body.y + body.height / 2) : body.y;
              this.effects.push({ type: "laser-impact", x: body.x, y: body.y, targetX: beamX(contactY), targetY: contactY, opticalBand, prism: side !== 0 });
            }
            if (side === 0 && count === 0 && !blocked) this.opticalSecondary(body, damage);
            if (blocked || ++count >= support.laserTargets) {
              end = Math.min(start, body.y + body.height / 2);
              break;
            }
          }
          this.effects.push({ type: "laser", x, y: start, targetX: beamX(end), targetY: end, prism: side !== 0, opticalBand });
        }
        if (this.build.opticalBranch === "relay") {
          const id = this.splitLaser(laserDamage);
          if (id !== void 0) visited.add(id);
        }
        if (this.laserChainUnlocked() && !mainBlocked) {
          this.laserLinkEnergy = laserDamage;
          this.laserLinkTargets = visited;
          if (origin) this.releaseLaserLink(origin);
        }
      }
    }
  }
  hostile(x, y, vx = 0, vy = 280) {
    if (this.bullets.filter((b) => b.active && b.hostile).length >= C.limits.hostile) return;
    this.bullets.push({ id: this.nextId++, x, y, px: x, py: y, vx, vy, damage: 1, age: 0, active: true, hostile: true });
  }
  step(dt, targetX = this.player.x) {
    if (this.phase === "dead") return;
    this.time += dt;
    this.player.px = this.player.x;
    this.player.invulnerable = Math.max(0, this.player.invulnerable - dt);
    const distance = clamp(targetX, C.minX, C.maxX) - this.player.x;
    this.player.x += clamp(distance, -C.moveSpeed * dt, C.moveSpeed * dt);
    if (this.phase !== "boss-entry" && this.phase !== "recovery") {
      this.growth.overload = Math.max(0, this.growth.overload - dt);
      if (activateOverload(this.growth)) this.emit("overload", this.player.x, C.playerY, this.overloadNotice());
    }
    this.director(dt);
    const challenge = this.contract;
    if (challenge?.status === "active" && challenge.kind === "hunter" && challenge.hunt === "crossfire" && this.phase === "running") this.spawnCrossfire(challenge);
    if (challenge?.status === "active" && this.phase === "running" && challenge.kind === "research") this.spawnProofWave(challenge);
    if (challenge?.status === "active" && challenge.kind !== "research" && !(challenge.kind === "hunter" && challenge.hunt === "crossfire") && this.phase === "running" && challenge.reinforcements < (challenge.kind === "hunter" ? HUNTER.targets : 22) && challenge.elapsed >= challenge.nextReinforcement) {
      const count = this.bodies.filter((b) => b.active && b.kind in C.enemies).length;
      if (count < C.limits.enemies) {
        const hunter = challenge.kind === "hunter", x = hunter ? [220, 500][challenge.reinforcements] : [200, 360, 520, 360][challenge.reinforcements % 4];
        const candidate = this.spawn(hunter ? "elite" : "drone", x, 180);
        if (this.admit(candidate)) {
          if (hunter) candidate.bountyRound = challenge.round;
          challenge.reinforcements++;
          challenge.nextReinforcement = challenge.elapsed + (hunter ? HUNTER.spacing : 0.8);
        } else challenge.nextReinforcement = challenge.elapsed + HUNTER.retry;
      }
    }
    const hadBossShield = this.bossShieldActive();
    this.advanceBurn(dt);
    this.advanceMagnetic(dt);
    this.shoot(dt);
    for (const b of this.bodies) {
      b.px = b.x;
      b.py = b.y;
      const previousWarning = b.warning;
      const wasCounter = b.counterfire, wasCounterVolleys = b.counterVolleys ?? 0;
      advanceBody(b, dt, this.phase, this.phaseTime, (x, y, vx, vy) => {
        const before = this.bullets.length;
        this.hostile(x, y, vx, vy);
        if (this.bullets.length <= before) return;
        this.bullets[this.bullets.length - 1].sourceId = b.id;
        if (b.pattern === "relay-screen") b.formationShots = (b.formationShots ?? 0) + 1;
        if (b.pattern === "lockshot") {
          b.lockAcceptedShots = (b.lockAcceptedShots ?? 0) + 1;
          b.lockFiredAt = b.age;
          if (b.forkshot) b.lockFiredAngle = Math.atan2(vx ?? 0, vy ?? 280);
          this.lockshotShots++;
        }
        if (b.pattern === "battery") b.batteryShots = (b.batteryShots ?? 0) + 1;
        if (b.pattern === "fire-control") {
          b.controlShots = (b.controlShots ?? 0) + 1;
          this.fireControlShots++;
          if (b.controlLinked) {
            b.controlBoostedShots = (b.controlBoostedShots ?? 0) + 1;
            this.fireControlBoostedShots++;
          }
        }
        if (b.proofTarget) b.proofShots = (b.proofShots ?? 0) + 1;
        if (b.pattern === "sweep") b.sweeperShots = (b.sweeperShots ?? 0) + 1;
        if (b.pattern === "intercept") {
          if (b.burst) b.interceptCoreShots = (b.interceptCoreShots ?? 0) + 1;
          else b.interceptWingShots = (b.interceptWingShots ?? 0) + 1;
          b.interceptFiredAt = b.age;
          b.interceptFireBeat = b.burst ? 1 : 0;
        }
        if (b.bountyRound !== void 0) {
          b.bountyShots = (b.bountyShots ?? 0) + 1;
          this.bountyShots++;
        }
      }, this.bodies);
      if (b.kind === "boss" && !wasCounter && b.counterfire) this.effects.push({ type: "boss-counter", x: b.x, y: b.y, text: "\u9996\u9886\u8FC7\u70ED \xB7 \u53CC\u70AE\u53CD\u51FB", detail: "\u53CC\u70AE\u52A0\u5165\u653B\u51FB\u5FAA\u73AF \xB7 \u5DF2\u53D1\u654C\u5F39\u4ECD\u5371\u9669" });
      if (b.kind === "boss" && (b.counterVolleys ?? 0) > wasCounterVolleys) this.effects.push({ type: "counter-fire", x: b.x, y: b.y });
      if (b.kind === "boss" && previousWarning <= 0 && b.warning > 0 && !safeRoute(this.player.x, this.bodies, this.bullets, b.attack === 3 ? 8 : 4, { phase: this.phase, phaseTime: this.phaseTime })) {
        if (b.attack === 4) b.counterReady = true;
        b.warning = 0;
        b.timer = 0.3;
        this.attackDeferrals++;
      }
    }
    for (const b of this.bullets) {
      b.px = b.x;
      b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.age += dt;
    }
    const contacts = [];
    const add = (t, rank, id, apply) => {
      if (t !== null) contacts.push({ t, rank, id, apply });
    };
    this.advanceIon(dt, add);
    for (const bullet of this.bullets) {
      if (bullet.hostile) {
        add(sweep(bullet.px, bullet.py, bullet.x, bullet.y, this.player.px, C.playerY, this.player.x, C.playerY, 27, 31), 1, bullet.id, () => {
          if (!bullet.active || this.player.hp <= 0) return;
          bullet.active = false;
          this.hurt("bullet");
        });
        const passY = C.playerY + 40;
        if (bullet.vy > 0 && bullet.py <= passY && bullet.y > passY) {
          const source = this.bodies.find((b) => b.active && b.id === bullet.sourceId && b.pattern === "lockshot");
          if (source) add((passY - bullet.py) / (bullet.y - bullet.py), 4, bullet.id, () => {
            if (bullet.active && source.active && this.player.hp > 0 && !this.bossVictory)
              source.lockPassed = Math.min(LOCKSHOT.shots, (source.lockPassed ?? 0) + 1);
          });
        }
      } else for (const body of this.bodies) {
        if (!body.active || body.kind === "pickup" || body.kind === "boss" && this.phase !== "boss") continue;
        if (bullet.py <= C.playerShotTop) continue;
        const fraction = bullet.y < C.playerShotTop ? (bullet.py - C.playerShotTop) / (bullet.py - bullet.y) : 1;
        const contact = sweep(
          bullet.px,
          bullet.py,
          bullet.px + (bullet.x - bullet.px) * fraction,
          bullet.py + (bullet.y - bullet.py) * fraction,
          body.px,
          body.py,
          body.px + (body.x - body.px) * fraction,
          body.py + (body.y - body.py) * fraction,
          body.width / 2 + 3,
          body.height / 2 + 8
        );
        add(contact === null ? null : contact * fraction, 0, bullet.id, () => {
          if (!bullet.active || !body.active || bullet.hitBodies?.includes(body.id)) return;
          bullet.hitBodies?.push(body.id);
          bullet.remainingTargets = (bullet.remainingTargets ?? 1) - 1;
          if (bullet.remainingTargets <= 0 || body.kind === "gate" || body.kind === "crate" || guardClosed(body) || (body.dropGrace ?? 0) > 0) bullet.active = false;
          const protectedEntry = (body.dropGrace ?? 0) > 0;
          if (!protectedEntry && bullet.weaponKind === "scatter" && this.build.ballisticBranch === "penetrator" && body.kind in C.enemies && (bullet.hitBodies?.length ?? 0) > 1) {
            this.scatterPierces++;
            this.effects.push({ type: "scatter-pierce", x: body.x, y: body.y, weaponKind: "scatter" });
          }
          const ionEligible = bullet.weaponKind === "arc" && body.kind in C.enemies && !guardClosed(body) && !protectedEntry;
          const linkEligible = body.kind in C.enemies && !guardClosed(body) && !protectedEntry;
          const hpBefore = body.hp;
          this.hit(body, bullet.damage, bullet.weaponKind);
          if (protectedEntry) return;
          if (linkEligible && body.hp < hpBefore && bullet.weaponKind === "blast") this.leaveMagnetic(body, bullet.damage);
          if (linkEligible && body.hp < hpBefore && bullet.weaponKind === "scatter" && this.build.ballisticBranch === "ricochet") {
            const target = this.bodies.filter((other) => other !== body && other.active && other.kind in C.enemies && !(other.dropGrace ?? 0) && !guardClosed(other) && !(other.kind === "boss" && this.phase !== "boss") && other.y >= C.playerShotTop && other.y <= C.playerY && Math.abs(other.x - body.x) >= RICOCHET.minSide && Math.hypot(other.x - body.x, other.y - body.y) <= RICOCHET.range).sort((a, b) => Math.hypot(a.x - body.x, a.y - body.y) - Math.hypot(b.x - body.x, b.y - body.y) || a.id - b.id)[0];
            if (target) {
              const before = target.hp;
              this.hit(target, bullet.damage * RICOCHET.damage, "scatter");
              if (target.hp < before) {
                this.scatterRicochets++;
                if (target.proofRound === this.round && target.proofGroup) this.contract?.recordRicochetGroup(target.proofGroup, this.round);
                this.effects.push({ type: "ricochet", x: body.x, y: body.y, targetX: target.x, targetY: target.y, weaponKind: "scatter" });
              }
            }
          }
          if (bullet.weaponKind === "pierce") {
            if (body.kind in C.enemies && hpBefore > 0 && body.hp <= 0 && !body.active && this.build.fractureAugment === "fracture-line") this.fractureWave(body, bullet.damage, true);
            else this.fracture(body, bullet.damage);
          }
          if (bullet.weaponKind === "arc") this.capacitor(body, bullet.damage);
          if (ionEligible && body.hp < hpBefore) this.ionImpact(body, bullet.damage);
          const support = this.supportProfile();
          if (support.refractionTargets > 0 && bullet.weaponKind === "pulse" && body.kind in C.enemies && !guardClosed(body)) {
            const reflected = this.bodies.filter((other) => other !== body && other.active && other.kind in C.enemies && other.y >= C.playerShotTop && other.y <= C.playerY && !(other.kind === "boss" && this.phase !== "boss") && Math.hypot(other.x - body.x, other.y - body.y) <= support.refractionRange).sort((a, b) => Math.hypot(a.x - body.x, a.y - body.y) - Math.hypot(b.x - body.x, b.y - body.y) || a.id - b.id).slice(0, support.refractionTargets);
            for (const next of reflected) {
              this.effects.push({ type: "refract", x: body.x, y: body.y, targetX: next.x, targetY: next.y });
              this.hit(next, bullet.damage * support.refractionDamage, "pulse");
            }
          }
          if (bullet.chainHops && body.kind in C.enemies) {
            const visited = /* @__PURE__ */ new Set([body.id]);
            let origin = body, damage = bullet.damage;
            for (let hop = 0; hop < bullet.chainHops && !guardClosed(origin) && !(origin.dropGrace ?? 0); hop++) {
              const seeker = hop === 0 && bullet.weaponKind === "arc" && this.build.electricBranch === "seeker";
              const candidates = this.bodies.filter((other) => other.active && !visited.has(other.id) && (!seeker || !(other.dropGrace ?? 0)) && other.kind in C.enemies && other.y >= C.playerShotTop && other.y <= C.playerY && !(other.kind === "boss" && this.phase !== "boss") && Math.hypot(other.x - origin.x, other.y - origin.y) <= (seeker ? SEEKER_BRIDGE.range : this.build.ranks.electric >= 2 ? 220 : 160));
              const priority = (target) => seeker && !guardClosed(target) && ["sniper", "armor", "elite", "guard", "boss"].includes(target.kind) ? target.warning > 0 ? 2 : 1 : 0;
              candidates.sort((a, b) => priority(b) - priority(a) || Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y) || a.id - b.id);
              const next = candidates[0];
              if (!next) break;
              visited.add(next.id);
              damage *= this.build.ranks.electric >= 3 ? 0.8 : 0.65;
              this.effects.push({ type: "arc", x: origin.x, y: origin.y, targetX: next.x, targetY: next.y, seeker });
              const before = next.hp, conducts = !guardClosed(next) && !(next.dropGrace ?? 0);
              this.hit(next, damage, bullet.weaponKind);
              if (bullet.weaponKind === "arc" && next.hp < before) {
                this.arcLinks++;
                if (seeker) this.seekerLinks++;
                if (conducts) this.ionImpact(next, damage);
              }
              if (bullet.weaponKind === "scatter" && next.hp < before) this.stormLinks++;
              origin = next;
            }
          }
          if (bullet.splashRadius && body.kind in C.enemies && !(bullet.weaponKind === "scatter" && guardClosed(body))) {
            if (bullet.weaponKind === "scatter") this.scatterBursts++;
            this.effects.push({ type: bullet.weaponKind === "scatter" ? "scatter-burst" : "blast", x: body.x, y: body.y, size: bullet.splashRadius, weaponKind: bullet.weaponKind });
            for (const other of this.bodies) if (other !== body && other.active && other.kind in C.enemies && other.y >= C.playerShotTop && other.y <= C.playerY && !(other.kind === "boss" && this.phase !== "boss") && !(other.dropGrace ?? 0) && Math.hypot(other.x - body.x, other.y - body.y) <= bullet.splashRadius) {
              if (bullet.weaponKind === "scatter") this.scatterSplashHits++;
              this.hit(other, bullet.damage * BALLISTIC_FORK.splash, bullet.weaponKind);
            }
          }
          if (linkEligible && body.hp < hpBefore) this.releaseLaserLink(body);
        });
      }
    }
    const rows = /* @__PURE__ */ new Map();
    for (const b of this.bodies) {
      if (!b.active) continue;
      if (b.kind === "gate") {
        const list = rows.get(b.row) ?? [];
        list.push(b);
        rows.set(b.row, list);
      } else if (b.kind === "pickup") {
        const x = this.player.px - b.px, y = C.playerY - b.py;
        const dx = this.player.x - this.player.px - (b.x - b.px), dy = -(b.y - b.py);
        const a = dx * dx + dy * dy, c = x * x + y * y - C.pickupRadius ** 2;
        const q = 2 * (x * dx + y * dy), discriminant = q * q - 4 * a * c;
        const t = c <= 0 ? 0 : a > 0 && discriminant >= 0 ? (-q - Math.sqrt(discriminant)) / (2 * a) : -1;
        if (t >= 0 && t <= 1) add(t, 2, b.id, () => {
          if (!b.active || this.player.hp <= 0) return;
          b.active = false;
          this.pickups++;
          this.lastEquipmentPickup = { id: b.id, row: b.row, kind: b.weaponKind, refit: !!b.refit, time: this.time, x: b.x, y: b.y };
          const previousWeapon = this.weaponKind;
          if (b.refit && b.weaponKind && this.activeWeapons.includes(b.weaponKind)) {
            if (b.row) {
              for (const alternative of this.bodies) if (alternative.row === b.row) alternative.active = false;
            }
            this.upgradeOwnedWeapon(b.weaponKind);
            this.refitsClaimed++;
            const research2 = this.equipmentResearch(b.row > 0);
            if (research2) this.effects.push({ type: "research", x: this.player.x, y: C.playerY, text: `\u88C5\u5907\u7814\u53D1 +${research2}\u70B9`, detail: "\u53EF\u9009\u62E9\u6280\u80FD\u8DEF\u7EBF \xB7 \u5DF2\u6709\u706B\u529B\u4FDD\u7559" });
            this.announceFracture();
            this.announceLaserChain();
            return;
          }
          for (const kind2 of this.activeWeapons) if (!this.weaponStages.has(kind2)) this.weaponStages.set(kind2, this.weaponStage(kind2));
          const addedWeapon = b.weaponKind && !this.activeWeapons.includes(b.weaponKind);
          if (b.weaponKind) {
            this.acquiredWeapons.add(this.weaponKind);
            this.acquiredWeapons.add(b.weaponKind);
            this.weaponKind = b.weaponKind;
          }
          if (b.row) {
            for (const alternative of this.bodies) if (alternative.row === b.row) alternative.active = false;
          }
          const kind = b.weaponKind ?? this.weaponKind;
          const localGrowth = { ...this.growth, stage: this.weaponStages.get(kind) ?? 1 };
          const result = grantEquipment(localGrowth, b.stage);
          this.weaponStages.set(kind, localGrowth.stage);
          Object.assign(this.growth, localGrowth, { stage: Math.max(this.growth.stage, localGrowth.stage) });
          this.maxStage = Math.max(this.maxStage, this.growth.stage);
          const research = this.equipmentResearch(b.row > 0);
          const title = addedWeapon ? `\u65B0\u589E${weaponNames[this.weaponKind]} \xB7 ${this.activeWeapons.length}\u79CD\u706B\u529B\u53E0\u52A0` : result.upgraded ? `${weaponNames[kind]} \xB7 \u5347\u81F3T${localGrowth.stage}` : "\u91CD\u590D\u88C5\u5907 \xB7 \u5145\u80FD+30";
          const detail = [
            result.upgraded ? `${weaponNames[kind]} T${localGrowth.stage} \xB7 \u5176\u4ED6\u914D\u4EF6\u4FDD\u7559` : addedWeapon ? "\u5145\u80FD+30" : "",
            result.activated ? this.chargeReceipt(true) : !result.upgraded ? `\u5F53\u524D\u5145\u80FD ${this.growth.energy}/100` : ""
          ].filter(Boolean).join(" \xB7 ");
          this.effects.push({ type: result.upgraded ? "upgrade" : "pickup", x: this.player.x, y: C.playerY, text: title, detail, size: b.stage });
          if (research) this.effects.push({ type: "research", x: this.player.x, y: C.playerY, text: `\u88C5\u5907\u7814\u53D1 +${research}\u70B9`, detail: "\u53EF\u9009\u62E9\u6280\u80FD\u8DEF\u7EBF \xB7 \u5DF2\u6709\u706B\u529B\u4FDD\u7559" });
          this.announceFracture();
          this.announceLaserChain();
          if (previousWeapon !== this.weaponKind) this.emit("weapon", this.player.x, C.playerY);
          if (result.activated) this.emit("overload", this.player.x, C.playerY);
        });
      } else {
        add(sweep(
          this.player.px,
          C.playerY,
          this.player.x,
          C.playerY,
          b.px,
          b.py,
          b.x,
          b.y,
          b.width / 2 + C.playerRadius,
          b.height / 2 + C.playerRadius
        ), 1, b.id, () => {
          if (!b.active || this.player.hp <= 0) return;
          b.active = false;
          this.hurt(b.kind === "crate" ? "crate" : "enemy");
          this.emit("crash", b.x, b.y, void 0, b.width);
        });
      }
    }
    for (const [, gates] of rows) {
      const first = gates[0];
      if (first.py < C.playerY && first.y >= C.playerY) {
        const t = (C.playerY - first.py) / (first.y - first.py);
        add(t, 3, first.id, () => {
          if (!first.active) return;
          const x = this.player.px + (this.player.x - this.player.px) * t;
          const chosen = gates.find((g) => x >= g.x - g.width / 2 && x < g.x + g.width / 2);
          if (chosen && this.player.hp > 0) {
            const result = grantGate(this.growth, gateValue(chosen.energy, chosen.rewardKind), chosen.rewardKind);
            this.gatesTaken++;
            this.emit("gate-taken", chosen.x, C.playerY, gateRewardLabel(result), chosen.width);
            if (result.activated) this.emit("overload", this.player.x, C.playerY, this.overloadNotice());
          }
          for (const gate of gates) gate.active = false;
        });
      }
    }
    contacts.sort((a, b) => Math.round(a.t * 1e8) - Math.round(b.t * 1e8) || a.rank - b.rank || a.id - b.id);
    for (const contact of contacts) contact.apply();
    const liveBoss = this.bodies.find((b) => b.active && b.kind === "boss");
    if (hadBossShield && !this.bossShieldActive() && liveBoss && this.player.hp > 0) this.emit("shield-down", liveBoss.x, liveBoss.y, "\u62A4\u536B\u5C4F\u969C\u74E6\u89E3");
    if (this.player.hp <= 0) {
      this.phase = "dead";
      this.emit("death", this.player.x, C.playerY, "\u672C\u6B21\u7A81\u56F4\u7ED3\u675F", 150);
    } else if (this.bossVictory) {
      this.bossWins++;
      this.bossLootRounds.push(this.round);
      const planned = this.bossFormation?.groups.reduce((n, g) => n + g.troops.length, 0) ?? 0;
      if (planned > 0 && this.bossEscortSpawns === planned && this.bossEscortKills === planned && this.damageTaken === this.bossStartDamage) {
        this.tacticalWins++;
        this.emit("formation-clear", 360, 400, "\u6218\u672F\u62C6\u89E3 \xB7 \u7F16\u961F\u5168\u7834\u4E14\u65E0\u4F24\u83B7\u80DC");
      }
      this.bossVictory = false;
      this.bullets = [];
      this.bodies = [];
      const restored = this.player.hp < 3;
      this.player.hp = Math.min(3, this.player.hp + 1);
      this.player.invulnerable = 1;
      this.phase = "recovery";
      this.phaseTime = 0;
      const reward = grantGate(this.growth, C.killCharge.boss, "energy");
      if (reward.activated) this.emit("overload", this.player.x, C.playerY);
      this.effects.push({
        type: "victory",
        x: 360,
        y: 430,
        text: `\u9996\u9886\u51FB\u7834 \xB7 \u5145\u80FD+${C.killCharge.boss}`,
        detail: [restored ? "\u88C5\u7532\u6062\u590D+1" : "\u88C5\u7532\u5B8C\u597D", this.chargeReceipt(reward.activated)].join(" \xB7 ")
      });
    }
    for (const b of this.bodies) if (b.bountyRound !== void 0 && b.hp > 0 && (!b.active || b.y >= 1344)) this.contract?.targetEscaped(b.bountyRound);
    this.bodies = this.bodies.filter((b) => b.active && b.y < 1344);
    this.bullets = this.bullets.filter((b) => b.active && b.y > (b.hostile ? -90 : C.playerShotTop) && b.y < 1370 && b.x > -40 && b.x < 760 && b.age < (b.hostile ? 6 : C.bulletLife));
    if (!this.ionLive()) {
      this.ionOrbs = [];
      this.ionSpears = [];
    } else {
      this.ionOrbs = this.ionOrbs.filter((p) => p.active && p.age < ION_ORB.life && p.y > C.playerShotTop);
      this.ionSpears = this.ionSpears.filter((p) => p.active && p.age < ION_SPEAR.life && p.y > C.playerShotTop && p.x > -40 && p.x < 760);
    }
    const contract = this.contract;
    if (contract?.update(this.phase === "running" || this.phase === "boss" ? dt : 0, this.kills, this.activeWeapons.length, this.damageTaken, this.player.hp > 0, contract.proof ? this.proofCount(contract.proof.kind) : 0)) {
      if (contract.status === "won") {
        this.contractStats.won++;
        if (contract.kind === "research" && contract.proof) {
          this.proofWins++;
          this.certifiedBuilds.add(contract.proof.kind);
          if (contract.proof.kind === "magnetic" && this.build.magneticAugment) this.magneticCertifications.add(this.build.magneticAugment);
        }
        if (contract.kind === "hunter" && contract.hunt === "crossfire") {
          this.aceWins++;
          if (this.damageTaken === contract.damage) this.flawlessAceWins++;
        }
        this.contractReward = { charge: contracts[contract.kind].charge, round: this.round, ...contract.kind === "hunter" && hunts[contract.hunt].research ? { research: hunts[contract.hunt].research } : {} };
      }
      if (contract.status === "failed") this.contractStats.failed++;
      this.effects.push({ type: "contract", x: this.player.x, y: C.playerY, text: contract.status === "won" ? "\u5951\u7EA6\u5B8C\u6210 \xB7 \u9009\u62E9\u5F3A\u5316\u5956\u52B1" : `\u5951\u7EA6\u5931\u8D25 \xB7 ${contract.reason}`, detail: "\u6BCF\u8F6E\u53EF\u63A5\u53D6\u4E00\u6B21 \xB7 \u5931\u8D25\u4EC5\u5931\u53BB\u989D\u5916\u5956\u52B1" });
    }
    if (this.phase !== "running" && this.phase !== "boss") this.magneticFields = [];
    this.peakBodies = Math.max(this.peakBodies, this.bodies.length);
    this.peakBullets = Math.max(this.peakBullets, this.bullets.length);
  }
  hurt(cause) {
    if (this.player.invulnerable > 0 || this.player.hp <= 0) return;
    this.lastDamageCause = cause;
    this.damageTaken++;
    this.player.hp--;
    this.player.invulnerable = C.invulnerability;
    this.emit("hurt", this.player.x, C.playerY);
  }
  chargeReceipt(activated) {
    if (!activated) return `\u5145\u80FD ${this.growth.energy}/100`;
    const mastery = this.growth.mastery ?? 0;
    const milestone = supportMilestone(mastery);
    return milestone ? `${milestone} \xB7 \u706B\u529B+10%` : "\u706B\u529B+10% \xB7 \u8D85\u8F7D6\u79D2";
  }
  hit(b, damage, weaponKind) {
    if ((b.dropGrace ?? 0) > 0) {
      this.effects.push({ type: "drop-impact", x: b.x, y: b.y, weaponKind });
      return;
    }
    this.hits++;
    b.hit = 0.07;
    if (b.kind === "gate") {
      const before = gateValue(b.energy, b.rewardKind);
      b.energy = Math.min(144, b.energy + damage);
      if (gateValue(b.energy, b.rewardKind) > before) this.emit("gate-level", b.x, b.y, `+${gateValue(b.energy, b.rewardKind)}${b.rewardKind === "power" ? "%" : ""}`);
      this.emit("impact-gate", b.x, b.y);
      return;
    }
    const shield = b.kind === "boss" && this.bossShieldActive() ? 1 - (this.bossFormation?.shieldReduction ?? 0) : 1;
    b.hp = Math.max(0, b.hp - damage * (guardClosed(b) ? 0.5 : 1) * shield);
    this.effects.push({ type: "impact", x: b.x, y: b.y, size: b.width, weaponKind });
    if (b.hp > 0) return;
    b.active = false;
    if (b.kind === "crate") {
      this.cratesBroken++;
      const pickup = this.spawn("pickup", b.x, b.y, b.stage);
      pickup.weaponKind = b.weaponKind;
      pickup.row = b.row;
      pickup.refit = b.refit;
      pickup.openingSupply = b.openingSupply;
      if (b.directedRefit) pickup.directedRefit = true;
      this.effects.push({ type: "crate-break", x: b.x, y: b.y, text: "\u9760\u8FD1\u9886\u53D6", size: 110, equipmentStage: b.stage });
    } else {
      if (b.kind === "sniper" && b.pattern === "lockshot") {
        if (b.warning > 0 && !(b.lockAcceptedShots ?? 0)) this.lockPreemptWins++;
        if ((b.lockAcceptedShots ?? 0) === LOCKSHOT.shots && (b.lockPassed ?? 0) === LOCKSHOT.shots && b.lockDamageStart === this.damageTaken) this.lockBaitWins++;
      }
      if (b.dropGrace !== void 0) this.dropKills++;
      if (b.kind === "conduit") this.dischargeConduit(b);
      this.kills++;
      this.score += C.enemies[b.kind].score;
      this.effects.push({ type: b.kind === "boss" ? "boss-kill" : "kill", x: b.x, y: b.y, size: b.width * 1.4, enemyKind: b.kind, bossVariant: b.bossVariant });
      if (b.kind === "boss") this.bossVictory = true;
      else if (b.escort) {
        this.escortKills++;
        this.bossEscortKills++;
        const reward = grantGate(this.growth, ESCORT.charge, "energy");
        if (reward.activated) this.emit("overload", this.player.x, C.playerY);
        this.effects.push({ type: "reward", escortReward: true, x: b.x, y: b.y, text: `\u7F16\u961F\u51FB\u7834 \xB7 \u5145\u80FD+${ESCORT.charge}`, detail: this.chargeReceipt(reward.activated) });
      } else if (b.kind === "elite") {
        const brokeCore = b.pattern === "intercept" && (b.interceptWingShots ?? 0) > 0 && !(b.interceptCoreShots ?? 0);
        if (brokeCore) this.interceptorBreaks++;
        const reward = grantGate(this.growth, C.killCharge.elite, "energy");
        if (reward.activated) this.emit("overload", this.player.x, C.playerY);
        this.effects.push({ type: "reward", x: b.x, y: b.y, text: `${brokeCore ? "\u622A\u51FB\u65AD\u6838" : b.pattern === "intercept" ? "\u622A\u51FB\u7CBE\u82F1\u51FB\u7834" : "\u7CBE\u82F1\u51FB\u7834"} \xB7 \u5145\u80FD+${C.killCharge.elite}`, detail: this.chargeReceipt(reward.activated) });
      }
      if (b.bountyRound !== void 0 && this.contract?.targetKilled(b.id, b.bountyRound)) {
        this.effects.push({ type: "bounty-progress", x: b.x, y: b.y, text: `\u60AC\u8D4F\u7CBE\u82F1 ${this.contract.targetKills}/2`, detail: this.contract.targetKills < 2 ? "\u518D\u51FB\u7834\u4E00\u540D\u9886\u53D6\u5951\u7EA6\u5F3A\u5316" : "\u76EE\u6807\u5168\u7834 \xB7 \u5373\u5C06\u9009\u62E9\u5F3A\u5316" });
      }
    }
  }
};

// src/game/frame-window.ts
var FrameWindow = class {
  constructor(capacity = 36e3) {
    this.capacity = capacity;
    if (!Number.isInteger(capacity) || capacity <= 0) throw new RangeError("Invalid frame sample capacity");
    this.values = new Float64Array(capacity);
    this.scratch = new Float64Array(capacity);
  }
  capacity;
  values;
  scratch;
  cursor = 0;
  count = 0;
  add(milliseconds) {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return;
    this.values[this.cursor] = milliseconds;
    this.cursor = (this.cursor + 1) % this.capacity;
    this.count = Math.min(this.count + 1, this.capacity);
  }
  clear() {
    this.cursor = 0;
    this.count = 0;
  }
  snapshot() {
    const sorted = this.scratch.subarray(0, this.count);
    sorted.set(this.values.subarray(0, this.count));
    sorted.sort();
    let total = 0, slow = 0;
    for (let i = 0; i < sorted.length; i++) {
      total += sorted[i];
      if (sorted[i] > 1e3 / 30) slow++;
    }
    const percentile = (fraction) => sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? 0;
    return {
      frameSamples: this.count,
      sampleLimit: this.capacity,
      frameSampleSeconds: total / 1e3,
      p95: percentile(0.95),
      p99: percentile(0.99),
      over33msPercent: this.count ? slow / this.count * 100 : 0
    };
  }
};

// src/game/player-motion.ts
var PlayerMotion = class {
  x = 360;
  time = 0;
  phase = 0;
  weight = 0;
  reset() {
    this.x = 360;
    this.time = 0;
    this.phase = 0;
    this.weight = 0;
  }
  sample(x, time) {
    if (time < this.time) this.reset();
    const dt = time - this.time;
    if (dt > 0) {
      const distance = Math.abs(x - this.x);
      const speed = Math.min(1, distance / (C.moveSpeed * dt));
      this.weight += (speed - this.weight) * (1 - Math.exp(-18 * dt));
      this.phase = (this.phase + distance * Math.PI * 2 / 112) % (Math.PI * 2);
      this.x = x;
      this.time = time;
    }
    const stride = Math.sin(this.phase) * 4 * this.weight;
    return { left: stride, right: -stride, bob: -Math.abs(Math.sin(this.phase * 2)) * this.weight };
  }
};

// src/game/weapon-motion.ts
var WeaponMotion = class {
  firedAt = -Infinity;
  kind = "pulse";
  stage = 1;
  reset() {
    this.firedAt = -Infinity;
  }
  discharge(kind, stage, time) {
    if (kind !== "arc" || kind !== this.kind || stage !== this.stage) return 0;
    const age = time - this.firedAt;
    return age < 0 ? 0 : Math.max(0, 1 - age / 0.28);
  }
  fire(kind, stage, time) {
    this.kind = kind;
    this.stage = stage;
    this.firedAt = time;
  }
  flash(kind, stage, time) {
    if (kind !== this.kind || stage !== this.stage) return 0;
    const age = time - this.firedAt;
    const duration = kind === "blast" ? 0.12 : kind === "pulse" ? 0.05 : kind === "scatter" ? 0.075 : 0.095;
    return age < 0 ? 0 : Math.max(0, 1 - age / duration);
  }
  sample(kind, stage, time) {
    if (kind !== this.kind || stage !== this.stage) return 0;
    const age = time - this.firedAt;
    if (kind === "arc") {
      if (age < 0 || age >= 0.28) return 0;
      const t2 = age / 0.28;
      return (3 + Math.max(1, Math.min(3, stage))) * Math.sin(t2 * Math.PI * 4) * (1 - t2) ** 2;
    }
    const duration = kind === "blast" ? 0.28 : kind === "pulse" ? 0.085 : kind === "scatter" ? 0.18 : 0.195;
    if (age < 0 || age >= duration) return 0;
    const t = age / duration;
    const strength = (kind === "blast" ? 7 : kind === "pulse" ? 3 : kind === "scatter" ? 7 : 5.5) * (1 + (Math.max(1, Math.min(3, stage)) - 1) * 0.12);
    if (kind === "scatter") return strength * Math.sin(t * Math.PI * 2) * (1 - t);
    if (kind === "pierce" || kind === "blast") return strength * (t < 0.15 ? t / 0.15 : t < 0.4 ? 1 : (1 + Math.cos((t - 0.4) / 0.6 * Math.PI)) / 2);
    return strength * Math.sin(t * Math.PI) * (1 - t);
  }
};

// src/game/crate-debris.ts
var CrateDebris = class {
  pieces = [];
  burst(x, y) {
    while (this.pieces.length > 3) this.pieces.shift();
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI + i * Math.PI * 2 / 6;
      this.pieces.push({
        frame: 3 + i,
        x: x + Math.cos(angle) * 18,
        y: y + Math.sin(angle) * 14,
        vx: Math.cos(angle) * (80 + i * 8),
        vy: 70 + Math.sin(angle) * 65,
        angle: 0,
        spin: (i % 2 ? -1 : 1) * (1 + i * 0.15),
        age: 0,
        life: 0.75 + i * 0.045,
        size: i === 0 ? 54 : 38
      });
    }
  }
  advance(dt) {
    for (const p of this.pieces) {
      p.x += p.vx * dt;
      p.y += p.vy * dt + 90 * dt * dt;
      p.vy += 180 * dt;
      p.angle += p.spin * dt;
      p.age += dt;
    }
    for (let i = this.pieces.length - 1; i >= 0; i--) if (this.pieces[i].age >= this.pieces[i].life) this.pieces.splice(i, 1);
  }
  clear() {
    this.pieces.length = 0;
  }
};
var crateFrame = (hp, maxHp) => hp > maxHp * 0.75 ? 0 : hp > maxHp * 0.35 ? 1 : 2;

// src/game/gate-feedback.ts
var GateFeedback = class {
  live = /* @__PURE__ */ new Map();
  receipts = [];
  sync(bodies, time) {
    const next = /* @__PURE__ */ new Map();
    for (const b of bodies) if (b.kind === "gate" && b.active) {
      const previous = this.live.get(b.id), tier = gateValue(b.energy, b.rewardKind);
      next.set(b.id, { x: b.x, width: b.width, tier, until: previous && tier > previous.tier ? time + 0.12 : previous?.until ?? 0 });
    }
    this.live = next;
  }
  pulse(id, time) {
    return Math.max(0, Math.min(1, ((this.live.get(id)?.until ?? 0) - time) / 0.12));
  }
  claim(x, y, text, width) {
    const gate = [...this.live.values()].find((g) => Math.abs(g.x - x) < 1);
    if (this.receipts.length >= 2) this.receipts.shift();
    this.receipts.push({ x, y: y - 180, width: width ?? gate?.width ?? 240, lines: text.split(" \xB7 "), age: 0 });
  }
  advance(dt) {
    for (const r of this.receipts) r.age += dt;
    for (let i = this.receipts.length - 1; i >= 0; i--) if (this.receipts[i].age >= 0.8) this.receipts.splice(i, 1);
  }
  clear() {
    this.live.clear();
    this.receipts.length = 0;
  }
};

// src/game/context-guide.ts
var movement = { kind: "move", title: "\u5DE6\u53F3\u62D6\u52A8 \xB7 \u81EA\u52A8\u5F00\u706B", detail: "" };
function weaponGuide(kind, stage, profile = weaponProfile(kind, stage)) {
  const details = {
    pulse: "\u5BF9\u51C6\u76EE\u6807\u6301\u7EED\u8F93\u51FA \xB7 \u9002\u5408\u96C6\u4E2D\u706B\u529B",
    scatter: "\u8FD1\u8DDD\u805A\u5F39\u66F4\u5F3A \xB7 \u7559\u610F\u78B0\u649E\u4E0E\u654C\u5F39",
    pierce: `\u5BF9\u51C6\u7EB5\u5217 \xB7 \u6700\u591A\u8D2F\u7A7F${profile.targets}\u4E2A\u654C\u4EBA`,
    blast: "\u76F4\u51FB\u654C\u7FA4\u4E2D\u5FC3 \xB7 \u7206\u70B8\u6CE2\u53CA\u9644\u8FD1\u654C\u4EBA",
    arc: `\u524D\u65B9\u7D22\u654C\u5FEB\u5F39 \xB7 \u6700\u591A\u8FFD\u52A0${profile.chainHops ?? 0}\u6B21\u8DF3\u7535`
  };
  return { kind: "weapon", title: `${weaponNames[kind]} \xB7 T${stage}`, detail: details[kind] };
}
function contextGuide(world) {
  const blockade = world.phase === "boss" && world.bodies.some((b) => b.active && b.kind === "boss" && b.attack === 3 && b.warning > 0);
  if (blockade) return { kind: "boss", title: "\u9996\u9886\u5C01\u9501\uFF1A\u89C2\u5BDF\u5B9E\u9645\u5F39\u5E55", detail: "\u7559\u610F\u4ECD\u5728\u98DE\u884C\u7684\u5B50\u5F39 \xB7 \u968F\u5F39\u5E55\u79FB\u52A8" };
  if (world.phase !== "running") return movement;
  const visible = world.bodies.filter((b) => b.active && b.y >= 160 && b.y <= C.playerY + (b.kind === "pickup" ? 52 : 0));
  if (visible.some((b) => b.pattern === "rebound" && b.warning > 0)) return { kind: "enemy", title: "\u6298\u8FD4\u51B2\u950B\uFF1A\u770B\u6E05\u7B2C\u4E8C\u6B21\u8F6C\u5411", detail: "\u4E24\u6BB5\u51B2\u523A \xB7 \u53EF\u96C6\u706B\u51FB\u6BC1\uFF0C\u6216\u7559\u51FA\u6A2A\u5411\u7A7A\u9699" };
  const interceptor = visible.find((b) => b.pattern === "intercept" && (b.warning > 0 || (b.interceptCoreRemaining ?? 0) > 0));
  if (interceptor) return { kind: "enemy", title: interceptor.burst ? "\u622A\u51FB\u6838\u5FC3\uFF1A\u53CA\u65F6\u79BB\u5F00\u4E2D\u8DEF" : "\u622A\u51FB\u7FFC\u70AE\uFF1A\u7559\u610F\u4E24\u4FA7\u5B9E\u5F39", detail: "\u53EF\u62A2\u5148\u51FB\u6BC1\u6216\u51FB\u7834\u4E2D\u7EE7 \xB7 \u5DF2\u53D1\u5F39\u4ECD\u5371\u9669" };
  if (visible.some((b) => b.pattern === "fire-control" && b.kind === "conduit")) return { kind: "enemy", title: "\u706B\u63A7\u4E2D\u7EE7\uFF1A\u65AD\u4F9B\u6216\u96C6\u706B\u7EB5\u5217", detail: "\u4E2D\u7EE7\u589E\u5E45\u6247\u5C04 \xB7 \u51FB\u7834\u505C\u706B1.5\u79D2\uFF0C\u65E7\u5F39\u4ECD\u5371\u9669" };
  if (visible.some((b) => b.pattern === "fire-control" && b.kind === "armor")) return { kind: "enemy", title: "\u706B\u63A7\u65AD\u4F9B\uFF1A\u8D81\u505C\u706B\u7A81\u7834", detail: "\u6062\u590D\u540E\u53EA\u53D1\u5355\u7EBF\u5F39 \xB7 \u7559\u610F\u4ECD\u5728\u98DE\u884C\u7684\u5B50\u5F39" };
  const locked = visible.find((b) => b.pattern === "lockshot" && !lockshotLeaving(b));
  if (locked) return { kind: "enemy", title: (locked.empRemaining ?? 0) > 0 ? "\u659C\u5C04\u505C\u706B\uFF1A\u5DF2\u53D1\u5B50\u5F39\u4ECD\u5371\u9669" : locked.forkshot ? "\u4E09\u89D2\u54E8\u673A\uFF1A\u9501\u4F4D\u540E\u5206\u4E09\u70B9\u5C04\u51FB" : "\u659C\u5C04\u54E8\u673A\uFF1A\u5165\u573A\u9501\u4F4D\u540E\u4E0D\u518D\u8FFD\u8E2A", detail: locked.forkshot ? "\u53EF\u84C4\u80FD\u62A2\u5148\u62C6\u70AE \xB7 \u9996\u5F39\u901A\u8FC7\u540E\u53EF\u56DE\u4E2D\u8DEF" : "\u53EF\u5728\u84C4\u80FD\u65F6\u51FB\u7834 \xB7 \u6A2A\u79FB\u907F\u5F00\u539F\u4F4D\u7F6E\u7684\u5B9E\u5F39" };
  if (visible.some((b) => b.pattern === "relocate")) return { kind: "enemy", title: "\u673A\u52A8\u54E8\u673A\uFF1A\u5165\u573A\u62A2\u4F4D\uFF0C\u9F50\u5C04\u518D\u6362\u4F4D", detail: "\u505C\u7A33\u518D\u84C4\u80FD \xB7 \u91CD\u65B0\u5BF9\u9F50\u76EE\u6807" };
  if (visible.some((b) => b.kind === "sniper" && b.warning > 0))
    return { kind: "enemy", title: "\u72D9\u51FB\u84C4\u80FD\uFF1A\u4FDD\u6301\u6A2A\u5411\u79FB\u52A8", detail: "\u4E5F\u53EF\u62A2\u5148\u51FB\u6BC1 \xB7 \u547D\u4E2D\u4E0D\u4F1A\u6253\u65AD\u84C4\u80FD" };
  if (visible.some((b) => b.kind === "guard" && b.warning > 0))
    return { kind: "enemy", title: "\u76FE\u536B\u5F00\u76FE\uFF1A\u907F\u5F00\u6247\u5F62\u5F39\u9053", detail: "\u5F31\u70B9\u5DF2\u66B4\u9732 \xB7 \u8D81\u5F00\u76FE\u96C6\u4E2D\u706B\u529B" };
  if (visible.some((b) => b.pattern === "convoy")) return { kind: "enemy", title: "\u8865\u7ED9\u62A4\u536B\uFF1A\u5C3D\u65E9\u51B3\u5B9A\u5916\u4FA7\u8DEF\u7EBF", detail: "\u53EF\u96C6\u706B\u51FB\u6BC1\u6216\u7B49\u5F31\u70B9\u66B4\u9732 \xB7 \u7559\u610F\u5B9E\u9645\u6247\u5F62\u5F39\u5E55" };
  const equipment = visible.filter((b) => b.weaponKind && (b.kind === "pickup" || b.kind === "crate"));
  if (equipment.some((b) => b.refit)) return {
    kind: equipment.some((b) => b.refit && b.kind === "pickup") ? "pickup" : "crate",
    title: equipment.some((b) => !b.refit && !world.activeWeapons.includes(b.weaponKind)) ? "\u8865\u7ED9\u53D6\u820D\uFF1A\u6269\u5C55\u706B\u529B\u6216\u6539\u88C5\u6838\u5FC3" : "\u914D\u4EF6\u6539\u88C5\uFF1A\u9009\u62E9\u5F3A\u5316\u5DF2\u6709\u914D\u4EF6",
    detail: world.refitTarget ? "\u540C\u6392\u53EA\u9886\u4E00\u4EF6 \xB7 \u6253\u788E\u540E\u62FE\u53D6\u624D\u5347\u7EA7" : "\u540C\u6392\u53EA\u9886\u4E00\u4EF6 \xB7 \u6682\u505C\u2192\u5F53\u524D\u706B\u529B\u53EF\u5B9A\u5411"
  };
  if (equipment.length && equipment.every((b) => world.activeWeapons.includes(b.weaponKind)))
    return { kind: equipment.some((b) => b.kind === "pickup") ? "pickup" : "crate", title: "\u5DF2\u6709\u6B66\u5668\uFF1A\u9886\u53D6\u5347\u9636\u6216\u5145\u80FD", detail: "\u540C\u9636\u88C5\u5907\u5145\u80FD+30 \xB7 \u6EE1100\u7A81\u7834\u5F3A\u5316" };
  if (visible.some((b) => b.weaponKind && b.kind === "pickup"))
    return { kind: "pickup", title: "\u9760\u8FD1\u9886\u53D6\uFF0C\u53E0\u52A0\u65B0\u706B\u529B", detail: "\u540C\u6392\u9009\u4E00\u79CD\u5956\u52B1 \xB7 \u5DF2\u6709\u6B66\u5668\u7EE7\u7EED\u5F00\u706B" };
  if (visible.some((b) => b.weaponKind && b.kind === "crate"))
    return { kind: "crate", title: "\u5BF9\u51C6\u4E00\u7BB1\uFF0C\u589E\u52A0\u706B\u529B\u80FD\u529B", detail: "\u6253\u788E\u518D\u9886\u53D6 \xB7 \u65E7\u80FD\u529B\u4FDD\u7559\u5230\u672C\u5C40\u7ED3\u675F" };
  if (visible.some((b) => b.kind === "conduit")) return { kind: "enemy", title: "\u5BFC\u7535\u4E2D\u7EE7\uFF1A\u51FB\u7834\u6253\u65AD\u90BB\u654C", detail: "\u505C\u706B1.5\u79D2 \xB7 \u5DF2\u53D1\u654C\u5F39\u4ECD\u5371\u9669" };
  if (visible.some((b) => b.kind === "guard" && guardClosed(b) && b.y < 650))
    return { kind: "enemy", title: "\u76FE\u536B\u95ED\u76FE\uFF1A\u6B63\u9762\u4F24\u5BB3\u51CF\u534A", detail: "\u95ED\u76FE\u6321\u4F4F\u7A7F\u7532\u4E0E\u8DF3\u7535 \xB7 \u7559\u610F\u5F00\u76FE\u65F6\u673A" };
  if (world.round !== 1) return movement;
  if (world.pickups === 0) {
    if (visible.some((b) => b.kind === "pickup")) return { kind: "pickup", title: "\u88C5\u5907\u5DF2\u6389\u843D\uFF0C\u79FB\u5230\u5B83\u4E0B\u65B9", detail: "\u9760\u8FD1\u62FE\u53D6\u540E\uFF0C\u624D\u4F1A\u5F3A\u5316\u706B\u529B" };
    if (visible.some((b) => b.kind === "crate")) return { kind: "crate", title: "\u5BF9\u51C6\u88C5\u5907\u7BB1\u6301\u7EED\u5C04\u51FB", detail: "\u6253\u788E\u540E\u518D\u62FE\u53D6 \xB7 \u672A\u788E\u7BB1\u4F53\u4F1A\u649E\u4F24" };
  }
  const gates = visible.filter((b) => b.kind === "gate");
  if (gates.some((g) => gates.some((other) => other.id !== g.id && other.row === g.row)) && world.gatesTaken < 2)
    return { kind: "pair", title: "\u5148\u5C04\u51FB\uFF0C\u628A\u95E8\u7684\u5956\u52B1\u6253\u9AD8", detail: "\u7A7F\u8FC7\u624D\u9886\u53D6 \xB7 \u540C\u6392\u53EA\u9886\u4E00\u6247" };
  if (gates.length && world.gatesTaken === 0)
    return { kind: "gate", title: "\u6301\u7EED\u5C04\u51FB\uFF0C\u628A\u95E8\u7684\u5956\u52B1\u6253\u9AD8", detail: "\u79FB\u5230\u95E8\u5185\uFF0C\u7A7F\u8FC7\u65F6\u624D\u9886\u53D6" };
  return movement;
}

// src/game/support-light.ts
var turn2 = Math.PI * 2;
function segment(c, x, y, tx, ty, width, color) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(tx, ty);
  c.stroke();
}
function supportLight(c, x, y, tx, ty, life, laser, weak, prism = false, powerBand = 1) {
  if (life <= 0) return;
  const dx = tx - x, dy = ty - y, length = Math.hypot(dx, dy);
  if (length < 1) return;
  if (laser) {
    laserPulse(c, x, y, tx, ty, life, weak, prism, Math.max(1, Math.min(3, powerBand)));
    return;
  }
  const alpha = Math.min(1, life / 0.12), nx = -dy / length, ny = dx / length, age = Math.max(0, 0.12 - life);
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = alpha;
  c.lineCap = "round";
  if (!weak) segment(c, x, y, tx, ty, 12, "#6aeaff55");
  segment(c, x, y, tx, ty, 3, "#a2f9ed");
  segment(c, x, y, tx, ty, 1, "#efffff");
  if (!weak) {
    c.strokeStyle = "#b7ffdf";
    c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const t = (i / 3 + age * 4) % 1, px = x + dx * t, py = y + dy * t;
      c.beginPath();
      c.moveTo(px + nx * 6, py + ny * 6);
      c.lineTo(px + dx / length * 5, py + dy / length * 5);
      c.lineTo(px - nx * 6, py - ny * 6);
      c.lineTo(px - dx / length * 5, py - dy / length * 5);
      c.closePath();
      c.stroke();
    }
  }
  c.strokeStyle = "#87e8ff";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(tx, ty, 6 + (1 - alpha) * 12, 0, turn2);
  c.stroke();
  c.restore();
}
function laserPulse(c, x, y, tx, ty, life, weak, prism, band) {
  const dx = tx - x, dy = ty - y, length = Math.hypot(dx, dy), nx = -dy / length, ny = dx / length, age = Math.max(0, 0.32 - life), alpha = Math.min(1, life / 0.16), shock = Math.max(0, 1 - age / 0.055), tint = prism ? "#c89aff" : "#62dfff";
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = alpha * (prism ? 0.78 : 1);
  c.lineCap = "round";
  if (!weak) segment(c, x, y, tx, ty, prism ? 18 : Math.min(35, 20 + band * 5), prism ? "#9549d944" : "#1389df44");
  segment(c, x, y, tx, ty, prism ? 3.5 : 5 + band * 2 + shock, tint);
  segment(c, x, y, tx, ty, prism ? 1 : 1.5 + band * 0.5 + shock * 0.5, prism ? "#efdaff" : "#efffff");
  const rails = weak ? 0 : prism ? 1 : band >= 2 ? 2 : 0;
  for (let rail = 0; rail < rails; rail++) {
    const side = rail ? 1 : -1, amplitude = prism ? 4 : 3 + band * 2;
    c.strokeStyle = prism ? "#edbbff" : rail ? "#a99bff" : "#a5f8ff";
    c.lineWidth = prism ? 1 : 1.3;
    c.globalAlpha = alpha * (prism ? 0.5 : 0.66);
    c.beginPath();
    for (let i = 0; i <= 20; i++) {
      const t = i / 20, wave = Math.sin(t * Math.PI * (band + 2) - age * 38) * Math.sin(t * Math.PI) * amplitude * side, px = x + dx * t + nx * wave, py = y + dy * t + ny * wave;
      if (i) c.lineTo(px, py);
      else c.moveTo(px, py);
    }
    c.stroke();
  }
  const count = weak ? 1 : prism ? 2 : band + 1;
  for (let i = 0; i < count; i++) {
    const t = (i / count + age * 3.5) % 1, px = x + dx * t, py = y + dy * t, r = (prism ? 8 : 6 + band * 3) * (0.65 + 0.35 * Math.sin(t * Math.PI));
    c.save();
    c.translate(px, py);
    c.rotate(Math.atan2(dy, dx));
    c.globalAlpha = alpha * (0.3 + 0.55 * Math.sin(t * Math.PI));
    c.strokeStyle = prism ? "#e7b8ff" : "#baf7ff";
    c.lineWidth = weak ? 1.2 : 1.8;
    c.beginPath();
    if (prism) {
      c.moveTo(0, -r);
      c.lineTo(4, 0);
      c.lineTo(0, r);
      c.lineTo(-4, 0);
      c.closePath();
    } else c.ellipse(0, 0, 2 + band, r, 0, 0, turn2);
    c.stroke();
    if (!weak && !prism && band >= 2) {
      for (const side of [-1, 1]) {
        c.beginPath();
        c.moveTo(-4, side * r);
        c.lineTo(0, side * (r + 3));
        c.lineTo(4, side * r);
        c.stroke();
      }
    }
    c.restore();
  }
  if (prism) {
    c.globalAlpha = alpha * 0.8;
    c.strokeStyle = "#d5a7ff";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x, y - 11);
    c.lineTo(x + 8, y);
    c.lineTo(x, y + 11);
    c.lineTo(x - 8, y);
    c.closePath();
    c.stroke();
  }
  c.restore();
}
function opticalImpactLight(c, x, y, life, band, weak, prism = false) {
  if (life <= 0) return;
  band = Math.max(1, Math.min(3, band));
  const t = 1 - Math.min(1, life / 0.22), r = 14 + band * 5 + t * 18;
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = (1 - t) * (weak ? 0.65 : 0.85);
  c.strokeStyle = prism ? "#d5aaff" : "#85eaff";
  c.lineWidth = weak ? 1.5 : 2 + (1 - t) * band * 0.5;
  c.beginPath();
  c.ellipse(0, 0, r, r * (0.5 + t * 0.14), -0.2, 0, turn2);
  c.stroke();
  const shards = weak ? 1 : 2 + band;
  c.fillStyle = prism ? "#ecd3ff" : "#ddfcff";
  c.strokeStyle = prism ? "#edc8ff" : "#b4f4ff";
  c.lineWidth = 1;
  for (let i = 0; i < shards; i++) {
    const a = i * turn2 / shards + 0.4 + t * 0.7, ux = Math.cos(a), uy = Math.sin(a), distance = r + 5 + t * 5, px = ux * distance, py = uy * distance, size = weak ? 4 : 5 + band;
    c.beginPath();
    c.moveTo(px + ux * size, py + uy * size);
    c.lineTo(px - uy * 2, py + ux * 2);
    c.lineTo(px - ux * size, py - uy * size);
    c.closePath();
    c.fill();
  }
  c.restore();
}
function opticalEmitterLight(c, x, y, pulse, band, weak) {
  if (pulse <= 0) return;
  const r = 10 + band * 4 + (1 - pulse) * 7;
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = pulse * (weak ? 0.6 : 0.9);
  c.strokeStyle = "#8cecff";
  c.lineWidth = weak ? 1.5 : 2.5;
  for (let i = 0; i < (weak ? 1 : band); i++) {
    const angle = i * turn2 / band + (1 - pulse) * 2;
    c.beginPath();
    c.ellipse(0, 0, r + i * 2, (r + i * 2) * 0.5, -0.2, angle, angle + Math.PI * 1.3);
    c.stroke();
  }
  c.strokeStyle = "#f2efff";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, 4);
  c.lineTo(0, -18 - band * 5);
  c.stroke();
  c.restore();
}
function opticalChargeLight(c, x, y, charge, band, weak, prism = false) {
  charge = Math.max(0, Math.min(1, charge));
  if (charge < 0.03) return;
  band = Math.max(1, Math.min(3, band));
  const r = 12 + band * 3, segments = weak ? 6 : 6 + band * 2, gap = 0.13, part = turn2 / segments;
  c.save();
  c.translate(x, y);
  c.scale(1, 0.65);
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round";
  c.lineWidth = weak ? 1.5 : 2;
  for (let i = 0; i < segments; i++) {
    const a = -Math.PI / 2 + i * part, amount = Math.max(0, Math.min(1, charge * segments - i));
    c.globalAlpha = 0.17;
    c.strokeStyle = prism ? "#a08bc4" : "#6fabc2";
    c.beginPath();
    c.arc(0, 0, r, a, a + part - gap);
    c.stroke();
    if (amount > 0) {
      c.globalAlpha = 0.35 + charge * 0.5;
      c.strokeStyle = prism ? "#d5b3ff" : "#89edff";
      c.beginPath();
      c.arc(0, 0, r, a, a + (part - gap) * amount);
      c.stroke();
    }
  }
  if (!weak && band >= 2 && charge > 0.7) {
    c.globalAlpha = (charge - 0.7) * 2;
    c.strokeStyle = "#d9fbff";
    c.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(side * (r + 7), 14);
      c.lineTo(side * (r - 2), 8);
      c.stroke();
    }
  }
  c.restore();
}

// src/game/horizontal-keys.ts
var left = /* @__PURE__ */ new Set(["KeyA", "ArrowLeft"]);
var right = /* @__PURE__ */ new Set(["KeyD", "ArrowRight"]);
var HorizontalKeys = class {
  held = /* @__PURE__ */ new Set();
  press(code) {
    if (!left.has(code) && !right.has(code)) return false;
    this.held.add(code);
    return true;
  }
  release(code) {
    return this.held.delete(code);
  }
  clear() {
    this.held.clear();
  }
  get active() {
    return this.held.size > 0;
  }
  get direction() {
    return Number([...this.held].some((code) => right.has(code))) - Number([...this.held].some((code) => left.has(code)));
  }
};

// src/game/drone-motion.ts
function droneFrame(age) {
  if (!Number.isFinite(age) || age < 0) return 1;
  return [1, 2, 1, 0][Math.floor(age * 8) % 4];
}

// src/game/charger-motion.ts
function chargerFrame(b) {
  if (b.warning > 0) return 1;
  return b.speed >= C.chargerBehavior.dashSpeed ? 2 : 0;
}

// src/game/armor-motion.ts
function armorFrame(b, braced = false) {
  if (b.warning > 0) return 1;
  if (braced) return 0;
  const distance = Math.max(0, b.age * b.speed);
  return Number.isFinite(distance) && Math.floor(distance / 14) % 2 ? 2 : 0;
}

// src/game/elite-motion.ts
function eliteFrame(b) {
  if (b.warning > 0 || (b.interceptCoreRemaining ?? 0) > 0) return 1;
  const distance = Math.max(0, b.age * b.speed);
  return Number.isFinite(distance) && Math.floor(distance / 48) % 2 ? 2 : 0;
}

// src/game/boss-motion.ts
var bossFrame = (b) => b.warning > 0 ? 1 : 0;

// src/game/enemy-wreck.ts
var wreckLayout = {
  conduit: { w: 150, h: 165, life: 0.65 },
  drone: { w: 92.4, h: 92.4, life: 0.55 },
  charger: { w: 105.3, h: 105.3, life: 0.55 },
  sniper: { w: 140, h: 140, life: 0.55 },
  guard: { w: 160, h: 160, life: 0.65 },
  armor: { w: 124.7, h: 140.76, life: 0.55 },
  elite: { w: 198.24, h: 184.96, life: 0.65 }
};
var isWreckKind = (kind) => typeof kind === "string" && Object.prototype.hasOwnProperty.call(wreckLayout, kind);
var EnemyWreck = class {
  pieces = [];
  trim(limit) {
    while (this.pieces.length > Math.max(0, limit)) this.pieces.shift();
  }
  burst(x, y, limit, kind = "drone") {
    if (limit < 3) return;
    this.trim(Math.min(6, limit) - 3);
    const layout = wreckLayout[kind], heavy = kind === "armor" || kind === "elite";
    for (const [index, from, width] of [[0, 0, 0.34], [1, 0.34, 0.32], [2, 0.66, 0.34]]) {
      this.pieces.push({
        kind,
        ...layout,
        from,
        width,
        x: x + (from + width / 2 - 0.5) * layout.w,
        y,
        vx: (index - 1) * (heavy ? 38 : 52),
        vy: (heavy ? 55 : 90) + index * 12,
        angle: 0,
        spin: (index - 1) * (heavy ? 0.8 : 1.5),
        age: 0
      });
    }
  }
  advance(dt) {
    for (const p of this.pieces) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
    }
    for (let i = this.pieces.length - 1; i >= 0; i--) if (this.pieces[i].age >= this.pieces[i].life) this.pieces.splice(i, 1);
  }
  clear() {
    this.pieces.length = 0;
  }
};

// src/game/canvas-runtime.ts
var fonts = '"Microsoft YaHei", "PingFang SC", sans-serif';
var CanvasRuntime = class {
  constructor(platform) {
    this.platform = platform;
    this.ctx = platform.canvas.getContext("2d");
    this.save = platform.read();
    this.resize(platform.width, platform.height, platform.dpr, platform.menuBottom);
  }
  platform;
  world = new World();
  mode = "loading";
  proofChoice = "ion";
  huntChoice = "staggered";
  buildFeedback;
  equipmentFeedback = new EquipmentReceiptQueue();
  achievementToast = "";
  achievementUntil = 0;
  contractReturn = "loadout";
  treeReturn = "loadout";
  dossierWeapon = "pulse";
  combosReturn = "loadout";
  goalWasReady = false;
  pendingRecipeCompletion = null;
  save;
  previousMode = "menu";
  ctx;
  images = /* @__PURE__ */ new Map();
  runNewBest = false;
  runAchievements = [];
  achievementReturn = "menu";
  achievementTab = "growth";
  achievementPage = 0;
  buttons = [];
  particles = [];
  blasts = [];
  impacts = [];
  arcs = [];
  empWaves = [];
  supportBeams = [];
  destruction;
  playerMotion = new PlayerMotion();
  crateDebris = new CrateDebris();
  enemyWreck = new EnemyWreck();
  gateFeedback = new GateFeedback();
  accumulator = 0;
  lastTime = 0;
  visualTime = 0;
  groundDistance = 0;
  renderBudget = C.step;
  renderElapsed = 0;
  renderedMode = "";
  controlsMode = "";
  target = 360;
  pointer = null;
  keys = new HorizontalKeys();
  inputMode = "touch";
  pointerX = 0;
  downAction = "";
  notice = "";
  noticeDetail = "";
  noticeY = 277;
  noticeUntil = 0;
  shakeUntil = 0;
  shieldBreak;
  weaponMotion = new WeaponMotion();
  mountedMotion = new Map(dossierWeapons.map((kind) => [kind, new WeaponMotion()]));
  branchRoute = "optical";
  opticalFiredAt = -Infinity;
  weaponGuideUntil = 0;
  weaponGuideKind = "pulse";
  drawCount = 0;
  callbackCount = 0;
  framePulses = 0;
  pausePreview = false;
  upgradeUntil = 0;
  error = "";
  started = false;
  hidden = false;
  loadAttempt;
  frameTimes = new FrameWindow();
  callbackWork = new FrameWindow(3600);
  previousCallbackWorkMs = 0;
  maxCallbackWorkMs = 0;
  interruptedFrames = [];
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  hudTop = 28;
  resize(width, height, devicePixelRatio, menuBottom = 0) {
    this.cancelTouch();
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      this.pause("\u7A97\u53E3\u53D8\u5316\uFF0C\u5DF2\u6682\u505C");
      return;
    }
    this.platform.width = width;
    this.platform.height = height;
    this.platform.dpr = devicePixelRatio;
    const dpr = Math.min(2, devicePixelRatio || 1);
    this.platform.canvas.width = Math.round(width * dpr);
    this.platform.canvas.height = Math.round(height * dpr);
    this.scale = Math.min(width / 720, height / 1280);
    this.offsetX = (width - 720 * this.scale) / 2;
    this.offsetY = (height - 1280 * this.scale) / 2;
    this.hudTop = Math.max(28, (menuBottom - this.offsetY) / this.scale + 12);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render(0);
    if (this.mode === "playing") this.drawCount++;
  }
  async load() {
    this.loadAttempt?.fail();
    let fail = () => {
    };
    const interrupted = new Promise((_resolve, reject) => {
      fail = () => reject(new Error("Asset load interrupted"));
    });
    const attempt = { since: this.platform.now(), fail };
    this.loadAttempt = attempt;
    this.mode = "loading";
    this.error = "";
    this.images.clear();
    this.buttons = [];
    this.lastTime = this.platform.now();
    if (!this.started) {
      this.started = true;
      this.platform.requestFrame((time) => this.frame(time));
    }
    try {
      const images = await Promise.race([interrupted, Promise.all(["units.png", "mounted-modules-v1.png", "scatter-player-v1.png", "pierce-player-v2.png", "blast-player-v1.png", "arc-player-v1.png", "props.png", "gate-frame-v1.png", "runway.jpg", "cooling-corridor-v1.jpg", "armored-corridor-v1.jpg", "explosion-v1.png", "crate-v1.png", "drone-v1.png", "charger-v1.png", "armor-v1.png", "elite-v1.png", "conduit-v1.png", "sniper-v1.png", "sniper-wreck-v1.png", "guard-v1.png", "guard-wreck-v1.png", "boss-v1.png", "boss-flanker-v1.png", "boss-bastion-v1.png", "drone-wreck-v1.png", "charger-wreck-v1.png", "armor-wreck-v1.png", "elite-wreck-v1.png"].map(async (key) => [key, await this.platform.image(`assets/${key}`)]))]);
      if (this.loadAttempt !== attempt) return;
      this.images = new Map(images);
      this.mode = "menu";
    } catch {
      if (this.loadAttempt !== attempt) return;
      this.error = "\u8D44\u6E90\u52A0\u8F7D\u672A\u5B8C\u6210\uFF0C\u8BF7\u70B9\u51FB\u91CD\u8BD5";
      this.mode = "error";
    } finally {
      if (this.loadAttempt === attempt) {
        this.loadAttempt = void 0;
        this.lastTime = this.platform.now();
        this.render(0);
      }
    }
  }
  frame(_timestamp) {
    this.framePulses++;
    const time = this.platform.now(), measuredPlaying = this.mode === "playing";
    const elapsed = Math.max(0, (time - this.lastTime) / 1e3);
    this.lastTime = time;
    const dt = Math.min(elapsed, 0.1);
    if (!this.hidden && this.loadAttempt && time - this.loadAttempt.since >= 15e3) this.loadAttempt.fail();
    if (this.mode === "playing") {
      this.callbackCount++;
      this.frameTimes.add(elapsed * 1e3);
      if (elapsed > 0.25) {
        let context = {};
        try {
          context = this.platform.frameContext?.() ?? {};
        } catch {
        }
        this.interruptedFrames.push({ gapMs: elapsed * 1e3, previousCallbackWorkMs: this.previousCallbackWorkMs, hidden: context.hidden, focused: context.focused });
        if (this.interruptedFrames.length > 12) this.interruptedFrames.shift();
        this.pause("\u753B\u9762\u66F4\u65B0\u4E2D\u65AD\uFF0C\u5DF2\u6682\u505C");
      } else {
        this.accumulator += dt;
        let steps = 0;
        try {
          while (this.accumulator + 1e-9 >= C.step && steps++ < 5 && this.mode === "playing") {
            if (this.keys.active) this.target = clamp(this.world.player.x + this.keys.direction * C.moveSpeed * C.step, C.minX, C.maxX);
            this.groundDistance += C.step * this.world.scrollSpeed;
            const previousBuildPoints = this.world.buildPoints;
            const equipmentBefore = this.world.bodies.some((b) => b.active && b.kind === "pickup") ? captureEquipment(this.world) : void 0;
            this.world.step(C.step, this.target);
            this.accumulator -= C.step;
            const equipmentHandled = equipmentBefore ? this.recordEquipment(equipmentBefore) : false;
            for (const e of this.world.drainEffects()) this.effect(e, equipmentHandled);
            this.checkRecipeGoal();
            const reveal = this.world.bossRewardRound !== null && this.world.phase === "recovery" && this.world.phaseTime < C.bossLootReveal;
            if (this.world.player.hp > 0 && !reveal && this.world.bossRewardRound !== null) {
              this.mode = "boss-reward";
              this.cancelTouch();
              this.accumulator = 0;
              this.platform.silence();
            } else if (this.world.player.hp > 0 && !reveal && this.world.contractReward) {
              this.mode = "contract-reward";
              this.cancelTouch();
              this.accumulator = 0;
              this.platform.silence();
            } else if (this.world.player.hp > 0 && !reveal && this.world.buildPoints > previousBuildPoints && this.world.build.available(this.world.buildPoints).length) {
              this.mode = "choice";
              this.cancelTouch();
              this.accumulator = 0;
              this.platform.silence();
            }
            if (this.world.player.hp <= 0) {
              this.mode = "result";
              this.cancelTouch();
              this.runNewBest = this.world.score > this.save.best;
              this.save.best = Math.max(this.save.best, this.world.score);
              this.platform.write(this.save);
              this.platform.silence();
            }
          }
          if (this.accumulator > C.step * 2) this.pause("\u8BBE\u5907\u6682\u65F6\u7E41\u5FD9\uFF0C\u5DF2\u6682\u505C");
        } catch {
          this.error = "\u8FD0\u884C\u5F02\u5E38\uFF0C\u8BF7\u91CD\u65B0\u5F00\u59CB";
          this.mode = "error";
          this.cancelTouch();
          this.platform.silence();
        }
      }
    }
    if (this.mode === "playing" || this.mode === "menu" || this.mode === "result") this.visualTime += dt;
    this.updateMusic();
    this.renderBudget += dt;
    this.renderElapsed += dt;
    if (this.renderBudget + 1e-9 >= C.step || this.renderedMode !== this.mode) {
      if (this.mode === "playing") this.drawCount++;
      this.render(this.mode === "paused" || this.mode === "settings" || this.mode === "choice" ? 0 : Math.min(this.renderElapsed, 0.1));
      this.renderBudget = Math.max(0, this.renderBudget - Math.floor((this.renderBudget + 1e-9) / C.step) * C.step);
      this.renderElapsed = 0;
      this.renderedMode = this.mode;
    }
    this.previousCallbackWorkMs = Math.max(0, this.platform.now() - time);
    if (measuredPlaying) {
      this.callbackWork.add(this.previousCallbackWorkMs);
      this.maxCallbackWorkMs = Math.max(this.maxCallbackWorkMs, this.previousCallbackWorkMs);
    }
    this.platform.requestFrame((next) => this.frame(next));
  }
  start() {
    this.buttons = [];
    for (const motion of this.mountedMotion.values()) motion.reset();
    this.opticalFiredAt = -Infinity;
    this.buildFeedback = void 0;
    this.equipmentFeedback.clear();
    this.runNewBest = false;
    this.runAchievements = [];
    this.achievementReturn = "menu";
    this.achievementUntil = 0;
    this.supportBeams = [];
    this.pausePreview = false;
    this.groundDistance = 0;
    this.keys.clear();
    this.inputMode = "touch";
    this.gateFeedback.clear();
    this.crateDebris.clear();
    this.enemyWreck.clear();
    this.playerMotion.reset();
    this.weaponMotion.reset();
    this.weaponGuideUntil = 0;
    this.drawCount = 0;
    this.callbackCount = 0;
    this.world = new World(1337, 1, this.save.openingWeapon, this.save.nextBattlePlan);
    this.save.nextBattlePlan = nextBattlePlan(this.world.battlePlan);
    this.mode = "playing";
    this.target = 360;
    this.goalWasReady = false;
    this.pendingRecipeCompletion = null;
    this.accumulator = 0;
    this.lastTime = this.platform.now();
    this.pointer = null;
    this.frameTimes.clear();
    this.callbackWork.clear();
    this.maxCallbackWorkMs = 0;
    this.previousCallbackWorkMs = 0;
    this.interruptedFrames = [];
    this.downAction = "";
    this.particles = [];
    this.blasts = [];
    this.impacts = [];
    this.arcs = [];
    this.empWaves = [];
    this.destruction = void 0;
    this.notice = "";
    this.shakeUntil = 0;
    this.shieldBreak = void 0;
    this.upgradeUntil = 0;
    this.platform.silence();
    this.updateMusic();
    this.platform.write(this.save);
  }
  pauseReason = "";
  pause(message = "\u6682\u505C") {
    if (this.mode !== "playing") return;
    this.pausePreview = false;
    this.pauseReason = message === "\u6682\u505C" ? "\u51C6\u5907\u597D\u4E86\uFF0C\u518D\u7EE7\u7EED\u7A81\u56F4\u3002" : message;
    this.mode = "paused";
    this.cancelTouch();
    this.accumulator = 0;
    this.notify(message);
    this.platform.silence();
    this.updateMusic();
  }
  hide() {
    this.platform.write(this.save);
    this.hidden = true;
    this.pause("\u5207\u6362\u81F3\u540E\u53F0\uFF0C\u5DF2\u6682\u505C");
    this.cancelTouch();
    this.platform.silence();
  }
  show() {
    this.hidden = false;
    this.lastTime = this.platform.now();
    if (this.loadAttempt) this.loadAttempt.since = this.lastTime;
    this.accumulator = 0;
    this.cancelTouch();
  }
  updateMusic() {
    try {
      this.platform.music?.(this.mode === "playing" && this.save.settings.music);
    } catch {
    }
  }
  keyDown(code) {
    if (this.mode !== "playing" || this.pointer !== null || !this.keys.press(code)) return false;
    this.inputMode = "keyboard";
    return true;
  }
  keyUp(code) {
    if (!this.keys.release(code)) return false;
    this.target = this.world.player.x;
    return true;
  }
  point(x, y) {
    return { x: (x - this.offsetX) / this.scale, y: (y - this.offsetY) / this.scale };
  }
  touchStart(id, x, y) {
    if (this.pointer !== null) return;
    this.cancelTouch();
    this.inputMode = "touch";
    const p = this.point(x, y);
    this.pointer = id;
    this.pointerX = p.x;
    this.downAction = this.buttons.find((b) => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h)?.action ?? "";
  }
  touchMove(id, x, y) {
    if (id !== this.pointer || this.downAction || this.mode !== "playing") return;
    const p = this.point(x, y);
    this.target = clamp(this.target + p.x - this.pointerX, C.minX, C.maxX);
    this.pointerX = p.x;
  }
  touchEnd(id, x, y) {
    if (id !== this.pointer) return;
    const p = this.point(x, y), action = this.buttons.find((b) => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h)?.action;
    const pressed = this.downAction;
    this.cancelTouch();
    if (action && action === pressed) {
      this.action(action);
      this.checkRecipeGoal();
    }
  }
  cancelTouch(id) {
    if (id !== void 0 && id !== this.pointer) return;
    this.keys.clear();
    this.pointer = null;
    this.downAction = "";
    this.target = this.world.player.x;
  }
  /** Native back never resumes a paused run or silently abandons a live one. */
  back() {
    this.cancelTouch();
    if (this.mode === "branch") {
      this.mode = "choice";
      return "stay";
    }
    if (this.mode === "choice" || this.mode === "contract-reward" || this.mode === "boss-reward") return "stay";
    if (this.mode === "armory" || this.mode === "opening") {
      this.mode = "menu";
      return "stay";
    }
    if (this.mode === "achievements") {
      this.mode = this.achievementReturn;
      return "stay";
    }
    if (this.mode === "combos") {
      this.mode = this.combosReturn;
      return "stay";
    }
    if (this.mode === "rig") {
      this.mode = "loadout";
      return "stay";
    }
    if (this.mode === "contracts") {
      this.mode = this.contractReturn;
      return "stay";
    }
    if (this.mode === "tree") {
      this.mode = this.treeReturn;
      return "stay";
    }
    if (this.mode === "refit-plan") {
      this.mode = "loadout";
      return "stay";
    }
    if (this.mode === "loadout") {
      this.mode = "paused";
      return "stay";
    }
    if (this.mode === "playing") {
      this.pause();
      return "stay";
    }
    if (this.mode === "settings") {
      this.action("back");
      return "stay";
    }
    if (this.mode === "paused") {
      this.pausePreview = false;
      this.notify("\u8BF7\u7EE7\u7EED\u6218\u6597\uFF0C\u6216\u9009\u62E9\u8FD4\u56DE\u4E3B\u754C\u9762");
      return "stay";
    }
    if (this.mode === "result") {
      this.action("home");
      return "stay";
    }
    return "exit";
  }
  /** Standard browser controls share the exact same actions as canvas touches. */
  activateControl(action) {
    if (this.controlsMode !== this.mode || !this.buttons.some((button) => button.action === action)) return false;
    this.cancelTouch();
    this.action(action);
    this.checkRecipeGoal();
    this.render(0);
    return true;
  }
  selectBuild(route, branch) {
    const preview = buildPreview(this.world, route, branch);
    const chosenNode = isIonAugment(branch) ? ionAugments[branch] : isFractureAugment(branch) ? fractureAugments[branch] : isPhotonAugment(branch) ? photonAugments[branch] : isMagneticAugment(branch) ? magneticAugments[branch] : this.world.build.ranks[route] < 3 ? this.world.build.node(route, this.world.build.ranks[route], branch) : this.world.build.next(route);
    const hadPrism = this.world.supportProfile().prism, hadStorm = this.world.build.ranks.ballistic >= 3;
    if (!this.world.chooseBuild(route, branch)) return;
    this.upgradeUntil = this.world.time + 0.45;
    if (isMagneticAugment(branch) && this.world.contract?.status !== "active") this.proofChoice = "magnetic";
    const earnedEffects = this.world.drainEffects();
    this.checkAchievements();
    const combo = !hadPrism && this.world.supportProfile().prism ? "\u68F1\u955C\u6FC0\u5149" : !hadStorm && this.world.build.ranks.ballistic >= 3 ? "\u96F7\u66B4\u9730\u5C04" : "";
    this.setBuildFeedback({ title: combo ? `\u7EC4\u5408\u5B8C\u6210 \xB7 ${combo}` : `\u914D\u4EF6\u5F3A\u5316 \xB7 ${chosenNode.name}`, detail: combo === "\u68F1\u955C\u6FC0\u5149" ? "\u4E3B\u675F\u4FDD\u7559 \xB7 \u4E24\u4FA7\u8FFD\u52A045%\u4F24\u5BB3" : combo === "\u96F7\u66B4\u9730\u5C04" ? "\u6BCF\u9897\u9730\u5F39\u547D\u4E2D\u540E\u8FFD\u52A0\u4E00\u6B21\u8DF3\u7535" : preview.gain, until: this.world.time + 4, combo: !!combo });
    if (this.save.settings.sound && !earnedEffects.some((e) => e.type === "combination")) this.platform.sound("upgrade", this.world.weaponStage(this.world.weaponKind));
    for (const effect of earnedEffects) this.effect(effect);
    this.mode = "choice";
    if (!this.world.build.available(this.world.buildPoints).length) this.action("resume");
  }
  action(action) {
    if (action.startsWith("build:") && this.mode === "choice") {
      const route = action.slice(6);
      if (!routes.includes(route)) return;
      if ((this.world.build.ranks[route] === 1 || route === "ballistic" && this.world.canRefineFracture() || route === "electric" && (this.world.canRefineMagnetic() || this.world.canRefineIon()) || route === "optical" && this.world.canRefinePhoton()) && this.world.build.available(this.world.buildPoints).includes(route)) {
        this.branchRoute = route;
        this.mode = "branch";
      } else this.selectBuild(route);
    } else if (action === "branch-back" && this.mode === "branch") this.mode = "choice";
    else if (action.startsWith("branch:") && this.mode === "branch") {
      const branch = action.slice(7), route = this.branchRoute;
      if (isIonAugment(branch) && route === "electric" && this.world.canRefineIon()) this.selectBuild(route, branch);
      else if (isFractureAugment(branch) && route === "ballistic" && this.world.canRefineFracture()) this.selectBuild(route, branch);
      else if (isPhotonAugment(branch) && route === "optical" && this.world.canRefinePhoton()) this.selectBuild(route, branch);
      else if (isMagneticAugment(branch) && route === "electric" && this.world.canRefineMagnetic()) this.selectBuild(route, branch);
      else if (this.world.build.ranks[route] === 1 && (route === "ballistic" && (branch === "penetrator" || branch === "fragment" || branch === "ricochet") || route === "optical" && (branch === "burn" || branch === "relay") || route === "electric" && (branch === "spread" || branch === "capacitor" || branch === "seeker"))) this.selectBuild(route, branch);
    } else if (action === "reload") {
      this.mode = "loading";
      void this.load();
    } else if (action === "start") this.start();
    else if (action === "achievements") {
      this.achievementReturn = this.mode === "result" ? "result" : "menu";
      const focus = this.achievementReturn === "result" ? this.runAchievements.at(-1) : this.save.achievements.tracked;
      if (focus) this.achievementTab = achievementGroup(focus);
      const ids = achievementGroups[this.achievementTab].ids;
      this.achievementPage = focus && ids.length > 6 ? Math.floor(ids.indexOf(focus) / 4) : 0;
      this.mode = "achievements";
    } else if (action.startsWith("achievement-group:") && this.mode === "achievements") {
      const group = action.slice(18);
      if (Object.hasOwn(achievementGroups, group)) {
        this.achievementTab = group;
        this.achievementPage = 0;
      }
    } else if (action === "achievement-page:next" && this.mode === "achievements") this.achievementPage++;
    else if (action === "achievement-page:previous" && this.mode === "achievements") this.achievementPage--;
    else if (action.startsWith("track:") && this.mode === "achievements") trackAchievement(this.save.achievements, action.slice(6));
    else if (action === "track-clear" && this.mode === "achievements") this.save.achievements.tracked = null;
    else if (action === "achievements-back" && this.mode === "achievements") this.mode = this.achievementReturn;
    else if (action === "opening-menu" && this.mode === "menu") this.mode = "opening";
    else if (action === "opening-back" && this.mode === "opening") this.mode = "menu";
    else if (action.startsWith("opening:") && this.mode === "opening") {
      const kind = action.slice(8);
      if (isOpeningWeapon(kind)) this.save.openingWeapon = kind;
    } else if (action === "armory") {
      this.dossierWeapon = "pulse";
      this.mode = "armory";
    } else if (action.startsWith("dossier:")) {
      const weapon = action.slice(8);
      if (dossierWeapons.includes(weapon)) this.dossierWeapon = weapon;
    } else if (action === "armory-back") this.mode = "menu";
    else if (action === "combos" && this.mode === "loadout") {
      this.combosReturn = "loadout";
      this.mode = "combos";
    } else if (action === "combos-menu" && this.mode === "menu") {
      this.combosReturn = "menu";
      this.mode = "combos";
    } else if (action === "combos-back") this.mode = this.combosReturn;
    else if (action.startsWith("recipe-goal:") && this.mode === "combos") {
      const goal = parseRecipeGoal(action.slice(12));
      if (goal) {
        this.save.recipeGoal = this.save.recipeGoal === goal ? null : goal;
        this.pendingRecipeCompletion = null;
        this.goalWasReady = this.save.recipeGoal ? recipeStatus(this.world, this.save.recipeGoal).ready : false;
        this.platform.write(this.save);
      }
    } else if (action === "rig-view" && this.mode === "loadout") this.mode = "rig";
    else if (action === "rig-back") this.mode = "loadout";
    else if (action === "contracts-live" && this.mode === "playing") {
      this.pause();
      this.contractReturn = "paused";
      this.mode = "contracts";
    } else if (action === "contracts") {
      this.contractReturn = "loadout";
      this.mode = "contracts";
    } else if (action.startsWith("contract-claim:") && this.mode === "contract-reward") {
      const kind = action.slice(15);
      const before = captureEquipment(this.world);
      if (this.world.claimContractReward(kind)) {
        const handled = this.recordEquipment(before);
        for (const e of this.world.drainEffects()) this.effect(e, handled);
        if (this.world.build.available(this.world.buildPoints).length) this.mode = "choice";
        else this.action("resume");
      }
    } else if (action.startsWith("boss-claim:") && this.mode === "boss-reward") {
      const kind = action.slice(11);
      const before = captureEquipment(this.world);
      if (this.world.claimBossReward(kind)) {
        const handled = this.recordEquipment(before);
        for (const e of this.world.drainEffects()) this.effect(e, handled);
        if (this.world.bossRewardRound !== null) this.mode = "boss-reward";
        else if (this.world.contractReward) this.mode = "contract-reward";
        else if (this.world.build.available(this.world.buildPoints).length) this.mode = "choice";
        else this.action("resume");
      }
    } else if (action === "contracts-back") this.mode = this.contractReturn;
    else if (action === "hunt-next" && this.mode === "contracts" && this.world.contract?.round !== this.world.round) {
      this.huntChoice = this.huntChoice === "staggered" ? "crossfire" : "staggered";
    } else if (action === "proof-next" && this.mode === "contracts") {
      const options = this.world.availableProofs();
      if (options.length) {
        const at = options.indexOf(this.proofChoice);
        this.proofChoice = options[((at < 0 ? 0 : at) + 1) % options.length];
      }
    } else if (action.startsWith("contract:") && this.mode === "contracts") {
      const kind = action.slice(9);
      if (kind in contracts) {
        const options = this.world.availableProofs();
        this.world.acceptContract(kind, kind === "research" ? options.includes(this.proofChoice) ? this.proofChoice : options[0] : void 0, kind === "hunter" ? this.huntChoice : void 0);
      }
    } else if (action === "tree" && (this.mode === "choice" || this.mode === "loadout")) {
      this.treeReturn = this.mode;
      this.mode = "tree";
    } else if (action === "tree-back") this.mode = this.treeReturn;
    else if (action === "refit-plan" && this.mode === "loadout") this.mode = "refit-plan";
    else if (action === "refit-plan-back" && this.mode === "refit-plan") this.mode = "loadout";
    else if (action === "refit-auto" && this.mode === "refit-plan") this.world.setRefitTarget();
    else if (action.startsWith("refit-focus:") && this.mode === "refit-plan") {
      const kind = action.slice("refit-focus:".length);
      if (dossierWeapons.includes(kind)) this.world.setRefitTarget(kind);
    } else if (action === "loadout") this.mode = "loadout";
    else if (action === "loadout-back") this.mode = "paused";
    else if (action === "pause") this.pause();
    else if (action === "preview") this.pausePreview = true;
    else if (action === "pause-menu") this.pausePreview = false;
    else if (action === "resume") {
      this.pausePreview = false;
      this.mode = "playing";
      this.accumulator = 0;
      this.lastTime = this.platform.now();
      this.target = this.world.player.x;
    } else if (action === "home") {
      this.shieldBreak = void 0;
      this.mode = "menu";
      this.world = new World();
      this.platform.silence();
      this.notice = "";
      this.particles = [];
      this.blasts = [];
      this.impacts = [];
      this.arcs = [];
      this.empWaves = [];
      this.destruction = void 0;
      this.crateDebris.clear();
      this.enemyWreck.clear();
      this.gateFeedback.clear();
    } else if (action === "settings") {
      this.previousMode = this.mode === "menu" ? "menu" : "paused";
      this.mode = "settings";
    } else if (action === "back") this.mode = this.previousMode;
    else if (action === "licenses") this.platform.openLicenses?.();
    else if (action === "effects") this.save.settings.effects = this.save.settings.effects === "standard" ? "weak" : "standard";
    else if (action === "shake") this.save.settings.shake = !this.save.settings.shake;
    else if (action === "sound") {
      this.save.settings.sound = !this.save.settings.sound;
      this.platform.silence();
    } else if (action === "music") this.save.settings.music = !this.save.settings.music;
    if (action !== "start") this.platform.write(this.save);
    this.updateMusic();
  }
  notify(text, y = 277, detail = "") {
    this.notice = text;
    this.noticeDetail = detail;
    this.noticeY = y;
    this.noticeUntil = this.platform.now() + 2200;
  }
  checkRecipeGoal() {
    const goal = this.save.recipeGoal, status = goal ? recipeStatus(this.world, goal) : null;
    if (status?.ready && !this.goalWasReady && this.world.time > 0) this.pendingRecipeCompletion = status.id;
    this.goalWasReady = status?.ready ?? false;
  }
  checkAchievements() {
    const beforeCertifications = this.save.achievements.certifiedBuilds.length, beforeMagnetic = this.save.achievements.magneticCertifications.length;
    const fresh = awardAchievements(this.save.achievements, this.world.build.ranks, this.world.activeWeapons.length, this.world.fractureBursts, this.world.tacticalWins, this.world.conduitTacticalWins, this.world.proofWins, { aceWins: this.world.aceWins, flawlessAceWins: this.world.flawlessAceWins, certifiedBuilds: [...this.world.certifiedBuilds], interceptorBreaks: this.world.interceptorBreaks, lockPreemptWins: this.world.lockPreemptWins, lockBaitWins: this.world.lockBaitWins, magneticCertifications: [...this.world.magneticCertifications] });
    if (fresh.length) {
      this.runAchievements.push(...fresh.map((a) => a.id));
      this.achievementToast = fresh.map((a) => a.name).join(" \xB7 ");
      this.achievementUntil = this.world.time + 4;
    }
    if (fresh.length || beforeCertifications !== this.save.achievements.certifiedBuilds.length || beforeMagnetic !== this.save.achievements.magneticCertifications.length) this.platform.write(this.save);
  }
  recordEquipment(before) {
    const changes = equipmentChanges(before, this.world);
    for (const change of changes) {
      const current = this.buildFeedback;
      if (current?.equipment?.kind === change.kind && this.world.time < current.until) {
        const equipment = { ...change, before: current.equipment.before };
        this.buildFeedback = { ...equipmentReceipt(equipment), equipment, until: this.world.time + 3.2, combo: false };
      } else this.equipmentFeedback.push(change);
    }
    return changes.length > 0;
  }
  setBuildFeedback(feedback) {
    const current = this.buildFeedback;
    if (current?.equipment && this.world.time < current.until) this.equipmentFeedback.interrupt(current.equipment, Math.max(0.1, current.until - this.world.time));
    this.buildFeedback = feedback;
  }
  effect(e, equipmentHandled = false) {
    if (e.type === "fracture-wave") {
      if (this.supportBeams.length >= 16) this.supportBeams.shift();
      this.supportBeams.push({ x: e.x, y: e.y, tx: e.targetX ?? e.x, ty: e.targetY ?? e.y, life: 0.24, laser: false, fractureWave: true });
      return;
    }
    if (e.type === "counter-fire") {
      if (this.save.settings.sound) this.platform.sound("boss-volley", 1);
      return;
    }
    if (e.type === "boss-counter") {
      this.notify(e.text ?? "\u9996\u9886\u8FC7\u70ED", 1195, e.detail);
      if (this.save.settings.sound) this.platform.sound("alert", 1);
      return;
    }
    if (e.type === "round") {
      this.notify(e.text ?? "\u4E0B\u4E00\u8F6E", 1195, e.detail);
      if (this.save.settings.sound) this.platform.sound("round", this.world.weaponStage(this.world.weaponKind));
      return;
    }
    if (e.type === "emp") {
      if (this.empWaves.length >= 2) this.empWaves.shift();
      this.empWaves.push({ x: e.x, y: e.y, radius: e.size ?? 300, life: 0.5 });
      this.notify(e.text ?? "\u4E2D\u7EE7\u51FB\u7834", 1195, e.detail);
      if (this.save.settings.sound) this.platform.sound("alert", 1);
      return;
    }
    if (e.type === "drop-wave") {
      this.notify(e.text ?? "\u7A81\u964D\u673A\u7FA4", 1195, e.detail);
      if (this.save.settings.sound) this.platform.sound("alert", 1);
      return;
    }
    if (e.type === "bounty-progress") {
      this.notify(e.text ?? "\u60AC\u8D4F\u63A8\u8FDB", 1195, e.detail);
      if (this.save.settings.sound) this.platform.sound("pickup", this.world.weaponStage(this.world.weaponKind));
      return;
    }
    if (e.escortReward) {
      this.notify(e.text ?? "\u7F16\u961F\u51FB\u7834", 1195, e.detail);
      if (this.save.settings.sound) this.platform.sound("pickup", this.world.weaponStage(this.world.weaponKind));
      return;
    }
    if (e.type === "formation") {
      if (this.save.settings.sound) this.platform.sound("alert", this.world.weaponStage(this.world.weaponKind));
      return;
    }
    if (e.type === "shield-down") {
      this.shieldBreak = { x: e.x, y: e.y + BOSS_VISUAL.offsetY, until: this.world.time + 0.45 };
      if (this.save.settings.sound) this.platform.sound("shield-down", this.world.weaponStage(this.world.weaponKind));
      return;
    }
    if (e.type === "combination") {
      this.setBuildFeedback({ title: e.text ?? "\u7EC4\u5408\u5B8C\u6210", detail: e.detail ?? "", until: this.world.time + 4, combo: true });
      if (this.save.settings.sound) this.platform.sound("upgrade", this.world.weaponStage(this.world.weaponKind));
      return;
    }
    if (e.type === "kill" || e.type === "boss-kill") this.save.achievements.kills++;
    if (e.type === "boss-kill") this.save.achievements.bosses++;
    if (["contract", "formation-clear", "fracture", "kill", "boss-kill", "pickup", "upgrade"].includes(e.type)) this.checkAchievements();
    if (e.type === "ricochet" && e.targetX !== void 0 && e.targetY !== void 0) {
      if (this.supportBeams.length < 16) this.supportBeams.push({ x: e.x, y: e.y, tx: e.targetX, ty: e.targetY, life: 0.2, laser: false, ricochet: true });
      return;
    }
    if (e.type === "scatter-pierce" && this.supportBeams.length < 16) this.supportBeams.push({ x: e.x, y: e.y + 25, tx: e.x, ty: e.y - 35, life: 0.12, laser: false });
    if (e.type === "laser") this.opticalFiredAt = this.world.time;
    if ((e.type === "laser" || e.type === "refract") && e.targetX !== void 0 && e.targetY !== void 0) {
      if (this.save.settings.sound) this.platform.sound(e.type, this.world.weaponStage(this.world.weaponKind));
      if (this.supportBeams.length < 16) this.supportBeams.push({ x: e.x, y: e.y, tx: e.targetX, ty: e.targetY, life: e.type === "laser" ? 0.32 : 0.12, laser: e.type === "laser", prism: e.prism, opticalBand: e.opticalBand });
      return;
    }
    if (e.type === "laser-impact") {
      const marker = { x: e.targetX ?? e.x, y: e.targetY ?? e.y, kind: "pulse", life: 0.22, opticalBand: e.opticalBand ?? 1, prism: e.prism };
      const old = this.impacts.find((hit) => Math.hypot(hit.x - e.x, hit.y - e.y) < 28);
      if (old) Object.assign(old, marker);
      else if (this.impacts.length < (this.save.settings.effects === "weak" ? 4 : 12)) this.impacts.push(marker);
      else {
        const index = this.impacts.findIndex((hit) => !hit.opticalBand);
        if (index >= 0) this.impacts[index] = marker;
      }
      return;
    }
    if (e.type === "laser-focus") {
      if (this.arcs.length >= 12) {
        const index = this.arcs.findIndex((a) => !a.photon);
        this.arcs.splice(index < 0 ? 0 : index, 1);
      }
      this.arcs.push({ x: e.x, y: e.y, tx: e.x, ty: e.y, life: 0.32, photon: true, focus: true });
      if (this.save.settings.sound) this.platform.sound("refract", 1);
      return;
    }
    if (e.type === "laser-arc" && e.targetX !== void 0 && e.targetY !== void 0) {
      if (this.arcs.length >= 12) {
        const index = this.arcs.findIndex((a) => !a.photon);
        this.arcs.splice(index < 0 ? 0 : index, 1);
      }
      this.arcs.push({ x: e.x, y: e.y, tx: e.targetX, ty: e.targetY, life: 0.24, photon: true });
      if (this.save.settings.sound) this.platform.sound("refract", 1);
      return;
    }
    if (this.save.settings.sound) this.platform.sound(e.type, this.world.weaponStage(e.weaponKind ?? this.world.weaponKind), e.weaponKind ?? this.world.weaponKind);
    if ((e.type === "arc" || e.type === "magnetic-link") && e.targetX !== void 0 && e.targetY !== void 0 && this.arcs.length < 12) this.arcs.push({ x: e.x, y: e.y, tx: e.targetX, ty: e.targetY, life: 0.16, seeker: e.seeker });
    if (e.type === "fire") {
      const kind = e.weaponKind ?? this.world.weaponKind;
      this.mountedMotion.get(kind)?.fire(kind, this.world.weaponStage(kind), this.world.time);
      if (!e.weaponKind || e.weaponKind === this.world.weaponKind) this.weaponMotion.fire(this.world.weaponKind, this.world.weaponStage(this.world.weaponKind), this.world.time);
      return;
    }
    if (e.type === "weapon" || e.type === "upgrade") {
      this.weaponGuideUntil = this.world.time + 5;
      this.weaponGuideKind = e.weaponKind ?? this.world.weaponKind;
    }
    if (e.type === "upgrade" || e.type === "overload" || e.type === "weapon") this.upgradeUntil = this.world.time + 0.45;
    if (e.type === "gate-taken") this.gateFeedback.claim(e.x, e.y, e.text ?? "\u5DF2\u9886\u53D6", e.size);
    if (e.text && !(equipmentHandled && (e.type === "upgrade" || e.type === "pickup" && e.text.startsWith("\u65B0\u589E"))) && !e.type.startsWith("impact") && e.type !== "gate-level" && e.type !== "gate-taken" && e.type !== "crate-break") {
      if (e.type === "upgrade") this.setBuildFeedback({ title: e.text, detail: e.detail ?? "", until: this.world.time + 4, combo: false });
      else this.notify(e.text, e.type === "victory" ? 820 : 277, e.detail);
    }
    if (e.type === "impact") admitWeaponImpact(this.impacts, e.x, e.y, e.weaponKind ?? this.world.weaponKind, this.save.settings.effects === "weak");
    const explosion = ["ion-storm", "scatter-burst", "capacitor", "fracture", "blast", "kill", "crate-break", "boss-kill", "crash", "death"].includes(e.type);
    if (e.type === "crate-break") {
      this.crateDebris.burst(e.x, e.y);
      this.enemyWreck.trim(9 - this.crateDebris.pieces.length);
    }
    if (e.type === "kill" && isWreckKind(e.enemyKind)) this.enemyWreck.burst(e.x, e.y, Math.min(this.save.settings.effects === "weak" ? 3 : 6, 9 - this.crateDebris.pieces.length), e.enemyKind);
    if (e.type === "boss-kill") this.destruction = new BossDestruction(e.x, e.y, e.bossVariant);
    else if (explosion) {
      if ((e.type === "ion-storm" || e.type === "fracture" || e.type === "capacitor" || e.type === "scatter-burst") && this.blasts.length >= 4) {
        const ordinary = this.blasts.findIndex((b) => !b.fracture && !b.electric && !b.ion);
        this.blasts.splice(ordinary < 0 ? 0 : ordinary, 1);
      }
      if (this.blasts.length < 4) this.blasts.push({ ion: e.type === "ion-storm", electric: e.type === "capacitor", fracture: e.type === "fracture", x: e.x, y: e.y, size: e.size ?? 80, life: 0.45, total: 0.45 });
    }
    if ((e.type === "hurt" || e.type === "boss-kill") && this.save.settings.shake) this.shakeUntil = this.platform.now() + 100;
    const cap = this.save.settings.effects === "weak" ? 50 : 160;
    const amount = explosion ? this.save.settings.effects === "weak" ? 14 : 32 : e.type.startsWith("impact") ? 4 : 7;
    for (let i = 0; i < amount && this.particles.length < cap; i++) {
      const angle = Math.random() * Math.PI * 2, speed = (explosion ? 130 : 75) + Math.random() * (explosion ? 330 : 180), life = 0.18 + Math.random() * 0.4;
      this.particles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, total: life, color: e.type === "drop-impact" ? "#b6efff" : e.type === "capacitor" || e.type === "ion-storm" ? i % 3 === 0 ? "#efffff" : i % 2 ? "#c5a9ff" : "#80ffd1" : explosion ? i % 4 === 0 ? "#99ddff" : i % 3 === 0 ? "#ffe2a0" : "#ffad42" : weaponColors[e.weaponKind ?? this.world.weaponKind] });
    }
  }
  gateText(text, x, y, size, color, bold = false) {
    const c = this.ctx;
    c.save();
    c.font = `${bold ? "700 " : ""}${size}px ${fonts}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.strokeStyle = "#020b13";
    c.lineWidth = Math.max(2, size * 0.09);
    c.lineJoin = "round";
    c.strokeText(text, x, y);
    this.text(text, x, y, size, color, "center", bold);
    c.restore();
  }
  text(text, x, y, size, color = "#ecf7ff", align = "center", bold = false) {
    const c = this.ctx;
    c.fillStyle = color;
    c.font = `${bold ? "700 " : ""}${size}px ${fonts}`;
    c.textAlign = align;
    c.textBaseline = "middle";
    c.fillText(text, x, y);
  }
  rect(x, y, width, height, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }
  frameSprite(key, frame, columns, x, y, width, height, rows = 2) {
    const img = this.images.get(key);
    if (!img) return;
    const sw = img.width / columns, sh = img.height / rows;
    this.ctx.drawImage(img, frame % columns * sw, Math.floor(frame / columns) * sh, sw, sh, x - width / 2, y - height / 2, width, height);
  }
  /** Reuse the actual sprite alpha: no rectangular flash or extra atlas. */
  hitSprite(key, frame, columns, x, y, width, height, remaining, duration = 0.07, rows = 2) {
    if (remaining <= 0) return;
    const c = this.ctx;
    c.save();
    c.globalCompositeOperation = "lighter";
    c.globalAlpha *= Math.min(1, remaining / duration) * (this.save.settings.effects === "weak" ? 0.18 : 0.48);
    this.frameSprite(key, frame, columns, x, y, width, height, rows);
    c.restore();
  }
  playerSprite(frame, x, y, pose, recoil) {
    const dedicated = this.world.weaponKind !== "pulse";
    const key = this.world.weaponKind === "arc" ? "arc-player-v1.png" : this.world.weaponKind === "blast" ? "blast-player-v1.png" : this.world.weaponKind === "scatter" ? "scatter-player-v1.png" : this.world.weaponKind === "pierce" ? "pierce-player-v2.png" : "units.png";
    const img = this.images.get(key);
    if (!img) return;
    const c = this.ctx, sw = img.width / (dedicated ? 3 : 4), sh = img.height / (dedicated ? 1 : 2);
    const width = 160, height = 213, left2 = x - width / 2, top = y - height / 2;
    for (let leg = 0; leg < 2; leg++) {
      c.drawImage(
        img,
        frame * sw + leg * sw / 2,
        sh * 0.625,
        sw / 2,
        sh * 0.375,
        left2 + leg * width / 2,
        top + height * 0.625 + (leg ? pose.right : pose.left),
        width / 2,
        height * 0.375
      );
    }
    c.drawImage(img, frame * sw, 0, sw, sh * 0.6875, left2, top + pose.bob + recoil, width, height * 0.6875);
  }
  drawMountedRig(y, pose) {
    const w = this.world;
    for (const kind of w.activeWeapons) {
      if (kind === w.weaponKind) continue;
      const mount = mountedRig[kind], stage = w.weaponStage(kind), band = calibrationVisualBand(w.weaponCalibration(kind));
      const motion = this.calibratedRecoil(kind, this.mountedMotion.get(kind)) * 0.65;
      const size = mount.size * (1 + (stage - 1) * 0.07) * (1 + band * 0.05);
      const c = this.ctx, px = w.player.x + Math.sign(mount.x) * 25, py = y - 24 + pose.bob;
      const tx = w.player.x + mount.x, ty = y + mount.y + pose.bob + motion + size * 0.22;
      c.save();
      c.lineCap = "round";
      for (const [width, color] of [[10, "#101b25"], [5, "#9aaab4"], [1, "#e0e6df"]]) {
        c.lineWidth = width;
        c.strokeStyle = color;
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(tx, ty);
        c.stroke();
      }
      c.fillStyle = "#d0d7d3";
      c.beginPath();
      c.arc(tx, ty, 3, 0, Math.PI * 2);
      c.fill();
      c.restore();
      this.frameSprite("mounted-modules-v1.png", mount.frame, 3, w.player.x + mount.x, y + mount.y + pose.bob + motion, size, size, 2);
      calibrationMount(c, w.player.x + mount.x, y + mount.y + pose.bob + motion - size * 0.12, size * 0.75, kind, band, this.mountedMotion.get(kind).flash(kind, stage, w.time), this.save.settings.effects === "weak");
    }
  }
  drawOpticalRig(y, pose) {
    const w = this.world, support = w.supportProfile();
    if (!support.laserUnlocked) return;
    const band = laserVisualBand(w.growth.mastery, w.build.ranks.optical), pulse = Math.max(0, 1 - (w.time - this.opticalFiredAt) / 0.22), kick = pulse * (3 + band), charge = w.laserCharge();
    const size = 50 + band * 6;
    for (const side of support.prism ? [-1, 0, 1] : [0]) {
      const c = this.ctx, x = w.player.x + side * 42;
      c.save();
      c.lineWidth = 4;
      c.strokeStyle = "#9aaab4";
      c.beginPath();
      c.moveTo(w.player.x, y - 72 + pose.bob);
      c.lineTo(x, y - 82 + pose.bob + kick);
      c.stroke();
      c.restore();
      this.frameSprite("mounted-modules-v1.png", 5, 3, w.player.x + side * 42, y - 100 + pose.bob + kick, side === 0 ? size : 42, side === 0 ? size : 42, 2);
      opticalChargeLight(this.ctx, x, y - 100 + pose.bob + kick - (side === 0 ? size : 42) * 0.25, charge, side === 0 ? band : 1, this.save.settings.effects === "weak", side !== 0);
      opticalEmitterLight(this.ctx, x, y - 100 + pose.bob + kick - (side === 0 ? size : 42) * 0.25, pulse, side === 0 ? band : 1, this.save.settings.effects === "weak");
    }
  }
  drawCalibrationRig(y, pose, recoil) {
    const w = this.world, kind = w.weaponKind, band = calibrationVisualBand(w.weaponCalibration(kind));
    calibrationMount(this.ctx, w.player.x, y - (w.profileFor(kind).muzzleY ?? 78) + pose.bob + recoil, 96 * (1 + band * 0.07), kind, band, this.weaponMotion.flash(kind, w.weaponStage(kind), w.time), this.save.settings.effects === "weak");
  }
  calibratedRecoil(kind, motion = this.weaponMotion) {
    return motion.sample(kind, this.world.weaponStage(kind), this.world.time) * (1 + calibrationVisualBand(this.world.weaponCalibration(kind)) * 0.12);
  }
  bar(x, y, width, ratio, color) {
    this.rect(x - width / 2 - 2, y - 2, width + 4, 12, "#07121b");
    this.rect(x - width / 2, y, width, 8, "#314852");
    this.rect(x - width / 2, y, width * clamp(ratio, 0, 1), 8, color);
  }
  button(label, y, action, primary = false) {
    const b = { x: 112, y, w: 496, h: 86, action, label };
    this.buttons.push(b);
    this.rect(b.x, b.y, b.w, b.h, primary ? "#77d6f6" : "#1a2d3c");
    this.ctx.strokeStyle = primary ? "#a1e7ff" : "#47667a";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(b.x, b.y, b.w, b.h);
    this.text(label, 360, y + 43, 32, primary ? "#0a1823" : "#d8eaf5", "center", true);
  }
  render(dt) {
    this.renderFrame(dt);
    this.controlsMode = this.mode;
    try {
      this.platform.controls?.(this.buttons.map((button) => ({ ...button })), { scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY });
    } catch {
    }
  }
  renderFrame(dt) {
    const c = this.ctx, p = this.platform, w = this.world;
    c.save();
    c.fillStyle = "#0a1119";
    c.fillRect(0, 0, p.width, p.height);
    c.translate(this.offsetX, this.offsetY);
    c.scale(this.scale, this.scale);
    c.beginPath();
    c.rect(0, 0, 720, 1280);
    c.clip();
    this.buttons = [];
    if (this.mode === "loading" || this.mode === "error") {
      this.text(this.mode === "error" ? this.error : "\u88C5\u8F7D\u706B\u529B\u4E2D\u2026", 360, 570, 32);
      if (this.mode === "error") this.button("\u91CD\u65B0\u52A0\u8F7D", 700, "reload", true);
      c.restore();
      return;
    }
    if (this.mode === "achievements") {
      this.drawAchievements();
      c.restore();
      return;
    }
    if (this.mode === "opening") {
      this.drawOpening();
      c.restore();
      return;
    }
    if (this.mode === "armory") {
      this.drawArmory();
      c.restore();
      return;
    }
    if (this.mode === "rig") {
      this.drawRigView();
      c.restore();
      return;
    }
    if (this.mode === "combos") {
      this.drawCombos();
      c.restore();
      return;
    }
    if (this.mode === "branch") {
      this.drawBuildBranch();
      c.restore();
      return;
    }
    if (this.mode === "contract-reward") {
      this.drawContractReward();
      c.restore();
      return;
    }
    if (this.mode === "boss-reward") {
      this.drawBossReward();
      c.restore();
      return;
    }
    if (this.mode === "contracts") {
      this.drawContracts();
      c.restore();
      return;
    }
    if (this.mode === "refit-plan") {
      this.drawRefitPlan();
      c.restore();
      return;
    }
    if (this.mode === "loadout") {
      this.drawLoadout();
      c.restore();
      return;
    }
    if (this.mode === "tree") {
      this.drawBuildTree();
      c.restore();
      return;
    }
    const sector = this.mode === "menu" ? 0 : sectorIndex(w.round);
    const ground = this.images.get(["runway.jpg", "cooling-corridor-v1.jpg", "armored-corridor-v1.jpg"][sector]);
    const h = ground.height / ground.width * 720;
    const distance = this.mode === "menu" ? this.visualTime * 12 : this.groundDistance;
    if (sector !== 0) {
      const scroll = distance % (h * 2);
      for (let tile = -2; tile <= Math.ceil(1280 / h); tile++) {
        const y = scroll + tile * h;
        if (y >= 1280 || y + h <= 0) continue;
        c.save();
        if (tile % 2 !== 0) {
          c.translate(0, y + h);
          c.scale(1, -1);
        } else c.translate(0, y);
        c.drawImage(ground, 0, 0, 720, h);
        c.restore();
      }
    } else {
      const scroll = distance % h;
      c.drawImage(ground, 0, scroll - h, 720, h);
      c.drawImage(ground, 0, scroll, 720, h);
    }
    this.rect(0, 0, 720, 1280, "#07111b25");
    c.save();
    if (this.platform.now() < this.shakeUntil) c.translate(Math.sin(this.platform.now()) * 3, Math.cos(this.platform.now()) * 3);
    this.drawWorld(dt);
    c.restore();
    if (this.mode === "playing" && this.pendingRecipeCompletion && this.save.recipeGoal === this.pendingRecipeCompletion) {
      const completed = recipeStatus(w, this.pendingRecipeCompletion);
      if (completed.ready) this.setBuildFeedback({ title: `\u76EE\u6807\u6210\u5F62 \xB7 ${completed.name}`, detail: completed.effect, until: w.time + 4, combo: true });
      this.pendingRecipeCompletion = null;
    }
    const receiptThreat = w.bodies.some((b) => b.active && (b.kind === "boss" || b.bountyRound !== void 0));
    let f = this.buildFeedback;
    if (f && this.mode === "playing") {
      if (f.hidden && f.observedAt !== void 0) f.until += Math.max(0, w.time - f.observedAt);
      f.observedAt = w.time;
    }
    if (this.mode === "playing" && (!f || w.time >= f.until)) {
      const equipment = this.equipmentFeedback.take();
      if (equipment) {
        f = { ...equipmentReceipt(equipment), equipment, until: w.time + equipment.remaining, combo: false, observedAt: w.time };
        this.buildFeedback = f;
      }
    }
    const receiptPosition = f ? this.buildReceiptLocation() : null;
    if (f) f.hidden = w.time < f.until && receiptPosition === null;
    const activeBuild = this.mode === "playing" && this.buildFeedback && w.time < this.buildFeedback.until && receiptPosition !== null;
    const noticeVisible = this.mode === "playing" && this.notice && this.platform.now() < this.noticeUntil && !activeBuild;
    const bottomNotice = receiptThreat || this.noticeY === 1195;
    const bottomBusy = activeBuild && receiptPosition !== 240 || noticeVisible && bottomNotice;
    if (bottomBusy && w.time < this.achievementUntil) this.achievementUntil = Math.max(
      this.achievementUntil,
      activeBuild ? this.buildFeedback.until + 3 : w.time + (this.noticeUntil - this.platform.now()) / 1e3 + 3
    );
    if (this.mode === "menu") this.drawMenu();
    else {
      this.drawHud();
      if (noticeVisible) {
        const y = bottomNotice ? 1208 : this.noticeY;
        this.rect(58, y - 31, 604, this.noticeDetail ? bottomNotice ? 94 : 104 : 62, "#0a1c2af0");
        this.text(this.notice, 360, y, 28, "#d2f2ff");
        if (this.noticeDetail) this.text(this.noticeDetail, 360, y + (bottomNotice ? 37 : 43), bottomNotice ? 22 : 24, "#f2d598");
      }
    }
    if (activeBuild && receiptPosition !== null) {
      const f2 = this.buildFeedback, top = receiptPosition, bottom = top === 1180, height = bottom ? 88 : 104;
      this.rect(58, top, 604, height, "#0a1c2af0");
      this.rect(58, top, 5, height, f2.equipment ? weaponColors[f2.equipment.kind] : f2.combo ? "#d3a3ff" : "#7fe4ff");
      this.text(f2.title, 360, top + (bottom ? 28 : 32), bottom ? 28 : 30, f2.equipment ? weaponColors[f2.equipment.kind] : f2.combo ? "#e1bfff" : "#d2f2ff", "center", true);
      this.text(f2.detail, 360, top + (bottom ? 63 : 76), bottom ? 22 : 23, "#f2d598");
    }
    if (this.mode === "choice") this.drawBuildChoices();
    const contract = w.contract;
    if (this.mode === "playing" && contract?.status === "active") {
      const y = w.bodies.some((b) => b.active && b.kind === "boss") ? 1130 : this.hudTop + 164;
      const progress = contract.kind === "research" && contract.proof ? `${buildProofs[contract.proof.kind].name} ${Math.min(contract.proofProgress, buildProofs[contract.proof.kind].goal)}/${buildProofs[contract.proof.kind].goal}${requiredProofGroups(contract.proof.kind) ? " \xB7 \u6279\u6B21" + Math.min(contract.proofGroupCount, requiredProofGroups(contract.proof.kind)) + "/" + requiredProofGroups(contract.proof.kind) : ""}` : contract.kind === "hunter" ? `${contract.targetKills}/2\u7CBE\u82F1` : `${Math.min(15, w.kills - contract.startKills)}/15\u654C`;
      this.rect(40, y, 640, 44, "#102330");
      this.text(`${contracts[contract.kind].name} \xB7 ${Math.max(0, Math.ceil(30 - contract.elapsed))}\u79D2 \xB7 ${progress}`, 360, y + 22, 24, "#ffdc8a");
    }
    if (this.mode === "playing" && w.time < this.achievementUntil && !bottomBusy) {
      this.rect(40, 1190, 640, 55, "#102330");
      this.text(`\u6210\u5C31\u8FBE\u6210 \xB7 ${this.achievementToast}`, 360, 1218, 24, "#ffdc8a");
    }
    if (this.mode === "paused" || this.mode === "settings" || this.mode === "result") this.drawDialog();
    c.restore();
  }
  drawWorld(dt) {
    const c = this.ctx, w = this.world;
    for (const beam of this.supportBeams) beam.life -= dt;
    this.supportBeams = this.supportBeams.filter((beam) => beam.life > 0);
    this.gateFeedback.sync(w.bodies, w.time);
    this.gateFeedback.advance(dt);
    this.drawGuide();
    this.drawDestruction(dt);
    this.enemyWreck.trim(Math.min(this.save.settings.effects === "weak" ? 3 : 6, 9 - this.crateDebris.pieces.length));
    this.enemyWreck.advance(dt);
    for (const piece of this.enemyWreck.pieces) {
      const wreckImage = this.images.get(piece.kind === "conduit" ? "conduit-v1.png" : `${piece.kind}-wreck-v1.png`);
      if (!wreckImage) continue;
      c.save();
      c.translate(piece.x, piece.y);
      c.rotate(piece.angle);
      c.globalAlpha = Math.min(1, (piece.life - piece.age) / 0.22) * (this.save.settings.effects === "weak" ? 0.5 : 0.85);
      c.drawImage(
        wreckImage,
        piece.from * wreckImage.width,
        0,
        piece.width * wreckImage.width,
        wreckImage.height,
        -piece.width * piece.w / 2,
        -piece.h / 2,
        piece.width * piece.w,
        piece.h
      );
      c.restore();
    }
    this.crateDebris.advance(dt);
    for (const piece of this.crateDebris.pieces) {
      c.save();
      c.translate(piece.x, piece.y);
      c.rotate(piece.angle);
      c.globalAlpha = Math.min(1, (piece.life - piece.age) / 0.3) * (this.save.settings.effects === "weak" ? 0.55 : 0.9);
      this.frameSprite("crate-v1.png", piece.frame, 3, 0, 0, piece.size, piece.size, 3);
      c.restore();
    }
    ionEvolutionLight(c, w.ionOrbs, w.ionSpears, this.save.settings.effects === "weak");
    for (const field of w.magneticFields) magneticLight(c, field, this.save.settings.effects === "weak");
    for (const b of w.bodies) if (b.kind === "gate") {
      const value = previewReward(w.growth, gateValue(b.energy, b.rewardKind), b.rewardKind), image = this.images.get("gate-frame-v1.png");
      if (image) gateMachine(c, image, b, value.power > 0 && value.energy > 0, this.gateFeedback.pulse(b.id, w.time), this.save.settings.effects === "weak", pairedGate(b, w.bodies));
    }
    for (const b of w.bodies) {
      if (b.kind === "gate") continue;
      c.fillStyle = "#0005";
      c.beginPath();
      c.ellipse(b.x + 5, b.y + b.height * 0.3, b.width * 0.45, b.height * 0.2, 0, 0, Math.PI * 2);
      c.fill();
      if (b.kind === "crate") {
        const frame = crateFrame(b.hp, b.maxHp);
        if (b.pattern === "drift-supply") driftCarrier(c, b.x, b.y, b.age, this.save.settings.effects === "weak");
        this.frameSprite("crate-v1.png", frame, 3, b.x, b.y, 148, 154, 3);
        this.hitSprite("crate-v1.png", frame, 3, b.x, b.y, 148, 154, b.hit, 0.07, 3);
      } else if (b.kind === "pickup") continue;
      else {
        const y = b.y + (b.kind === "boss" ? BOSS_VISUAL.offsetY : 0);
        const width = b.kind === "boss" ? BOSS_VISUAL.width : b.width * 1.4;
        const height = b.kind === "boss" ? BOSS_VISUAL.height : b.height * 1.55;
        if (b.kind === "drone") {
          const frame = droneFrame(b.age), side = b.width * 1.65;
          const direction = sweeperDirection(b), bank = direction * Math.min(1, b.age / 0.12, Math.abs(b.lane - b.x) / 36);
          c.save();
          c.translate(b.x, y);
          c.rotate(-bank * 0.14);
          sweeperLight(c, direction, b.age, this.save.settings.effects === "weak");
          this.frameSprite("drone-v1.png", frame, 3, 0, 0, side, side, 1);
          this.hitSprite("drone-v1.png", frame, 3, 0, 0, side, side, b.hit, 0.07, 1);
          c.restore();
        } else if (b.kind === "charger") {
          const frame = chargerFrame(b), side = b.height * 1.35;
          const local = b.pattern === "rebound";
          c.save();
          if (local) {
            c.translate(b.x, y);
            c.rotate(reboundState(b).direction * 0.14);
          }
          this.frameSprite("charger-v1.png", frame, 3, local ? 0 : b.x, local ? 0 : y, side, side, 1);
          this.hitSprite("charger-v1.png", frame, 3, local ? 0 : b.x, local ? 0 : y, side, side, b.hit, 0.07, 1);
          c.restore();
        } else if (b.kind === "armor") {
          const braced = batteryHolding(b) || fireControlHolding(b), frame = armorFrame(b, braced), width2 = b.width * 1.45, height2 = b.height * 1.38, direction = sweeperDirection(b);
          c.save();
          c.translate(b.x, y);
          c.rotate(-direction * 0.08);
          sweeperLight(c, direction, b.age, this.save.settings.effects === "weak", width2 * 0.4);
          if (braced) batteryMount(c, b.warning, (b.empRemaining ?? 0) > 0, this.save.settings.effects === "weak");
          if (b.pattern === "fire-control") controlReceiver(c, b.age, !!fireControlSource(b, w.bodies), (b.empRemaining ?? 0) > 0, this.save.settings.effects === "weak");
          this.frameSprite("armor-v1.png", frame, 3, 0, 0, width2, height2, 1);
          this.hitSprite("armor-v1.png", frame, 3, 0, 0, width2, height2, b.hit, 0.07, 1);
          c.restore();
        } else if (b.kind === "conduit") {
          const bob = Math.sin(b.age * 3) * 2;
          if (b.pattern === "fire-control") {
            c.save();
            c.translate(b.x, y + bob);
            controlTransmitter(c, b.age, w.bodies.filter((g) => fireControlSource(g, w.bodies)?.id === b.id).length, this.save.settings.effects === "weak");
            c.restore();
          }
          this.frameSprite("conduit-v1.png", 0, 1, b.x, y + bob, 150, 165, 1);
          this.hitSprite("conduit-v1.png", 0, 1, b.x, y + bob, 150, 165, b.hit, 0.07, 1);
          c.save();
          c.globalAlpha = 0.35 + 0.3 * Math.sin(b.age * 6) ** 2;
          c.fillStyle = "#ffd889";
          for (const side of [-1, 1]) c.fillRect(b.x + side * 24 - 2, y - 35 + bob, 4, 6);
          c.restore();
        } else if (b.kind === "guard") {
          const frame = b.burst > 0 || (b.empRemaining ?? 0) > 0 ? 1 : 0;
          this.frameSprite("guard-v1.png", frame, 3, b.x, y, 160, 160, 1);
          this.hitSprite("guard-v1.png", frame, 3, b.x, y, 160, 160, b.hit, 0.07, 1);
        } else if (b.kind === "sniper") {
          const frame = b.warning > 0 ? 1 : 0;
          const direction = sentryDirection(b);
          c.save();
          c.translate(b.x, y);
          c.rotate(direction * 0.07);
          sentryThrust(c, direction, b.age, this.save.settings.effects === "weak");
          this.frameSprite("sniper-v1.png", frame, 3, 0, 0, 140, 140, 1);
          this.hitSprite("sniper-v1.png", frame, 3, 0, 0, 140, 140, b.hit, 0.07, 1);
          c.restore();
          if (b.pattern === "lockshot") lockshotMount(c, b, this.save.settings.effects === "weak");
        } else if (b.kind === "elite") {
          const frame = eliteFrame(b), width2 = b.width * 1.68, height2 = b.height * 1.36, direction = sweeperDirection(b);
          c.save();
          c.translate(b.x, y);
          c.rotate(-direction * 0.08);
          sweeperLight(c, direction, b.age, this.save.settings.effects === "weak", width2 * 0.4);
          this.frameSprite("elite-v1.png", frame, 3, 0, 0, width2, height2, 1);
          this.hitSprite("elite-v1.png", frame, 3, 0, 0, width2, height2, b.hit, 0.07, 1);
          c.restore();
        } else {
          const frame = bossFrame(b), bossArt = b.bossVariant === 2 ? "boss-bastion-v1.png" : b.bossVariant === 1 ? "boss-flanker-v1.png" : "boss-v1.png";
          this.frameSprite(bossArt, frame, 3, b.x, y, width, height, 1);
          this.hitSprite(bossArt, frame, 3, b.x, y, width, height, b.hit, 0.07, 1);
          if (b.counterfire) bossHeatLight(c, b, this.save.settings.effects === "weak");
        }
      }
    }
    for (const b of w.bodies) if (b.active && b.proofTarget && w.contract?.kind === "research" && w.contract.status === "active") this.text(b.proofGroup ? `\u9A8C\u8BC1\xB7\u7B2C${b.proofGroup}\u6279` : "\u9A8C\u8BC1\u76EE\u6807", b.x, b.y - b.height / 2 - 24, 20, "#a9f4d7");
    for (const b of w.bodies) if (b.active && (b.dropGrace ?? 0) > 0) dropLight(c, b.x, b.y, (b.dropGrace ?? 0) / SWARM.grace, this.save.settings.effects === "weak");
    for (const b of w.bodies) if (b.active && (b.empRemaining ?? 0) > 0) offlineLight(c, b.x, b.y, b.width, b.empRemaining ?? 0);
    const protectedBoss = w.bodies.find((b) => b.active && b.kind === "boss");
    if (protectedBoss && w.bossShieldActive()) formationShield(c, protectedBoss.x, protectedBoss.y + BOSS_VISUAL.offsetY, w.time, 0, this.save.settings.effects === "weak");
    if (this.shieldBreak && w.time < this.shieldBreak.until) formationShield(c, this.shieldBreak.x, this.shieldBreak.y, w.time, 1 - (this.shieldBreak.until - w.time) / 0.45, this.save.settings.effects === "weak");
    for (const b of w.bodies) if (b.active && b.bountyRound === w.contract?.round && w.contract?.kind === "hunter" && w.contract.status === "active") {
      c.save();
      c.strokeStyle = "#ffd884";
      c.lineWidth = 3;
      c.globalAlpha = 0.7 + 0.2 * Math.sin(w.time * 7);
      for (const side of [-1, 1]) {
        const x = b.x + side * b.width * 0.65;
        c.beginPath();
        c.moveTo(x - side * 14, b.y - 24);
        c.lineTo(x, b.y - 14);
        c.lineTo(x, b.y + 14);
        c.lineTo(x - side * 14, b.y + 24);
        c.stroke();
      }
      c.restore();
    }
    for (const b of w.bodies) if (b.active && b.capacitorHits) capacitorMarks(c, b.x, b.y + (b.kind === "boss" ? BOSS_VISUAL.offsetY : 0), b.width, b.capacitorHits, w.time);
    for (const b of w.bodies) if (b.active && b.burnTicks) burnLight(c, b.x, b.y, b.width, b.height, w.time, this.save.settings.effects === "weak");
    for (const b of w.bodies) if (b.active && b.fractureHits) fractureMarks(c, b.x, b.y + (b.kind === "boss" ? BOSS_VISUAL.offsetY : 0), b.width, b.fractureHits, w.fractureProfile().hits);
    for (const b of w.bullets.filter((b2) => !b2.hostile)) {
      energyShot(c, b.x, b.y, b.vx, b.vy, b.weaponKind ?? "pulse", w.time, this.save.settings.effects === "weak");
    }
    for (const beam of this.supportBeams) if (this.mode !== "menu") {
      if (beam.fractureWave) fractureWaveLight(c, beam.x, beam.y, beam.tx, beam.ty, beam.life, this.save.settings.effects === "weak");
      else if (beam.ricochet) ricochetLight(c, beam.x, beam.y, beam.tx, beam.ty, beam.life, this.save.settings.effects === "weak");
      else supportLight(c, beam.x, beam.y, beam.tx, beam.ty, beam.life, beam.laser, this.save.settings.effects === "weak", beam.prism, beam.opticalBand);
    }
    for (const b of w.bullets) if (!b.hostile) {
      calibrationShot(c, b.x, b.y, b.vx, b.vy, b.weaponKind ?? "pulse", b.calibrationBand ?? 0, b.age, this.save.settings.effects === "weak");
      projectileBody(c, b.x, b.y, b.vx, b.vy, b.weaponKind ?? "pulse");
    }
    const playerY = this.mode === "menu" ? 570 : C.playerY;
    if ((this.mode === "playing" || this.mode === "paused") && w.player.hp > 0)
      overloadWake(c, w.player.x, playerY, w.time, w.growth.overload, this.save.settings.effects === "weak");
    c.fillStyle = "#0005";
    c.beginPath();
    c.ellipse(this.mode === "menu" ? 365 : w.player.x + 5, playerY + 32, 53, 30, 0, 0, Math.PI * 2);
    c.fill();
    c.save();
    if (w.player.invulnerable > 0 && Math.floor(w.time * 15) % 2 === 0) c.globalAlpha = 0.65;
    const recoil = this.calibratedRecoil(w.weaponKind);
    const pose = this.playerMotion.sample(w.player.x, w.time);
    if (w.player.hp > 0 || this.mode === "menu") {
      if (this.mode === "menu") this.frameSprite(weaponDossier[this.save.openingWeapon].asset, 1, 3, 360, playerY, 110, 147, 1);
      else {
        this.drawMountedRig(playerY, pose);
        this.playerSprite(w.weaponStage(w.weaponKind) - 1, w.player.x, playerY, pose, recoil);
        this.drawCalibrationRig(playerY, pose, recoil);
        this.drawOpticalRig(playerY, pose);
        const remaining = w.player.invulnerable - (C.invulnerability - 0.12);
        if (remaining > 0) {
          c.save();
          c.globalCompositeOperation = "lighter";
          c.globalAlpha *= Math.min(1, remaining / 0.12) * (this.save.settings.effects === "weak" ? 0.18 : 0.48);
          this.playerSprite(w.weaponStage(w.weaponKind) - 1, w.player.x, playerY, pose, recoil);
          c.restore();
        }
      }
    }
    c.restore();
    if (w.build.ranks.electric >= 3 && (this.mode === "playing" || this.mode === "paused")) ionChargeLight(c, w.player.x, C.playerY - 117, w.ionCharge, w.build.ionAugment);
    if (w.laserChainUnlocked() && w.laserChainReady && (this.mode === "playing" || this.mode === "paused")) {
      c.save();
      c.strokeStyle = "#a7e7ff";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(w.player.x, C.playerY - 157);
      c.lineTo(w.player.x + 7, C.playerY - 148);
      c.lineTo(w.player.x, C.playerY - 139);
      c.lineTo(w.player.x - 7, C.playerY - 148);
      c.closePath();
      c.stroke();
      c.restore();
    }
    const flash = this.weaponMotion.flash(w.weaponKind, w.weaponStage(w.weaponKind), w.time);
    if ((this.mode === "playing" || this.mode === "paused") && w.player.hp > 0) {
      const discharge = this.weaponMotion.discharge(w.weaponKind, w.weaponStage(w.weaponKind), w.time);
      if (discharge > 0) coilDischarge(
        c,
        w.player.x,
        C.playerY - (weaponProfile(w.weaponKind, w.weaponStage(w.weaponKind)).muzzleY ?? 78) + pose.bob + recoil,
        discharge,
        w.weaponStage(w.weaponKind),
        this.save.settings.effects === "weak"
      );
    }
    if ((this.mode === "playing" || this.mode === "paused") && w.player.hp > 0 && flash > 0) {
      const weapon = weaponProfile(w.weaponKind, w.weaponStage(w.weaponKind));
      for (const offset of weapon.offsets) {
        const x = w.player.x + offset, y = C.playerY - (weapon.muzzleY ?? 78) + pose.bob + recoil;
        muzzleLight(c, x, y, w.weaponKind, flash, this.save.settings.effects === "weak");
      }
    }
    if (this.mode === "playing" && w.time < this.upgradeUntil) {
      const remaining = (this.upgradeUntil - w.time) / 0.45;
      c.save();
      c.globalAlpha = remaining * 0.8;
      c.strokeStyle = "#80e4ff";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(w.player.x, C.playerY, 48 + (1 - remaining) * 100, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
    for (const e of this.blasts) {
      e.life -= dt;
      const age = 1 - e.life / e.total;
      if (e.ion) {
        ionStormLight(c, e.x, e.y, e.size, age, this.save.settings.effects === "weak");
        continue;
      }
      if (e.electric) {
        capacitorLight(c, e.x, e.y, e.size, age, this.save.settings.effects === "weak");
        continue;
      }
      c.save();
      c.globalAlpha = detonationSpriteAlpha(age, this.save.settings.effects === "weak");
      this.frameSprite("explosion-v1.png", Math.min(8, Math.floor(age * 9)), 3, e.x, e.y, e.size * 2, e.size * 2, 3);
      c.restore();
      detonationLight(c, e.x, e.y, e.size, age, this.save.settings.effects === "weak");
      if (e.fracture) fractureLight(c, e.x, e.y, e.size, age, this.save.settings.effects === "weak");
    }
    this.blasts = this.blasts.filter((e) => e.life > 0);
    for (const s of this.particles) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 70 * dt;
      sparkLight(c, s.x, s.y, s.vx, s.vy, s.color, s.life / s.total, this.save.settings.effects === "weak");
    }
    this.particles = this.particles.filter((s) => s.life > 0);
    for (const e of this.empWaves) {
      e.life -= dt;
      empWave(c, e.x, e.y, e.radius, 1 - e.life / 0.5, this.save.settings.effects === "weak");
    }
    this.empWaves = this.empWaves.filter((e) => e.life > 0);
    for (const arc of this.arcs) {
      arc.life -= dt;
      if (arc.focus) focusDischarge(c, arc.x, arc.y, arc.life, this.save.settings.effects === "weak");
      else chainArc(c, arc.x, arc.y, arc.tx, arc.ty, arc.life, this.save.settings.effects === "weak", arc.photon, arc.seeker);
    }
    this.arcs = this.arcs.filter((arc) => arc.life > 0);
    trimImpactBudget(this.impacts, this.save.settings.effects === "weak");
    for (const hit of this.impacts) {
      hit.life -= dt;
      if (hit.opticalBand) opticalImpactLight(c, hit.x, hit.y, hit.life, hit.opticalBand, this.save.settings.effects === "weak", hit.prism);
      else impactLight(c, hit.x, hit.y, hit.kind, 1 - hit.life / (hit.total ?? 0.14), this.save.settings.effects === "weak");
    }
    this.impacts = this.impacts.filter((hit) => hit.life > 0);
    for (const receipt of this.gateFeedback.receipts) {
      const y = receipt.y - receipt.age * 18, height = receipt.lines.length > 1 ? 116 : 84;
      if (w.bodies.some((b) => Math.abs(receipt.x - b.x) < (receipt.width + b.width * 1.4 + 40) / 2 && Math.abs(y - b.y - (b.kind === "boss" ? BOSS_VISUAL.offsetY : 0)) < (height + b.height * 1.55 + 140) / 2)) continue;
      c.save();
      c.globalAlpha = Math.min(1, (0.8 - receipt.age) / 0.25);
      this.rect(receipt.x - receipt.width / 2 + 8, y - height / 2, receipt.width - 16, height, "#102d3bf0");
      this.text("\u5DF2\u9886\u53D6", receipt.x, y - height / 2 + 20, 28, "#b1e8f7");
      receipt.lines.forEach((line2, i) => this.text(line2, receipt.x, y - height / 2 + 52 + i * 32, 30, "#effaff", "center", true));
      c.restore();
    }
    for (const b of w.bodies) if (b.kind === "pickup") this.frameSprite("props.png", 2, 3, b.x, b.y, 65, 65);
    for (const b of w.bodies) {
      if (b.pattern === "rebound") reboundLight(c, b, this.save.settings.effects === "weak");
      if (b.pattern === "intercept") interceptorLight(c, b, this.save.settings.effects === "weak");
      if (b.warning > 0 && b.pattern !== "lockshot" && b.pattern !== "intercept" && !(b.kind === "boss" && b.attack === 4)) {
        const charge = 0.65 + Math.sin(w.time * 22) * 0.2;
        const muzzleY = b.y + b.height * 0.32;
        c.save();
        c.globalAlpha = charge;
        c.strokeStyle = "#ffbc76";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(b.x, muzzleY, b.kind === "boss" ? 22 : 10, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "#ffe4aa";
        c.beginPath();
        c.arc(b.x, muzzleY, 3, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      if (b.kind === "crate") {
        if (b.weaponKind) {
          const choice = b.openingSupply ? "\u9884\u5B9A" : w.activeWeapons.includes(b.weaponKind) ? "\u5F3A\u5316" : "\u53E0\u52A0";
          const role = b.weaponKind === "pulse" ? "\u9AD8\u901F\u96C6\u4E2D\u706B\u529B" : b.weaponKind === "scatter" ? "\u8FD1\u8DDD\u805A\u5F39 \xB7 \u6247\u9762\u8986\u76D6" : b.weaponKind === "blast" ? "\u547D\u4E2D\u654C\u4EBA \xB7 \u8303\u56F4\u7206\u7834" : b.weaponKind === "arc" ? "\u524D\u65B9\u7D22\u654C \xB7 \u547D\u4E2D\u8DF3\u7535" : `\u8D2F\u7A7F${weaponProfile("pierce", b.stage).targets}\u4E2A\u654C\u4EBA`;
          const panelY = b.y - 158 >= this.hudTop + 172 ? b.y - 158 : Math.max(this.hudTop + 172, b.y + 70);
          const goalSupply = recipeSupplyMatch(w, this.save.recipeGoal, b);
          this.rect(b.x - 118, panelY, 236, 100, "#0b1723ef");
          this.text(b.refit ? `${b.directedRefit ? "\u5B9A\u5411" : ""}${w.weaponStage(b.weaponKind) >= 3 ? "\u7CBE\u6821" : "\u6539\u88C5"} ${weaponNames[b.weaponKind]}` : `${choice} ${weaponNames[b.weaponKind]} T${b.stage}`, b.x - (goalSupply ? 18 : 0), panelY + 23, goalSupply ? 23 : 25, weaponColors[b.weaponKind], "center", true);
          if (goalSupply) {
            c.strokeStyle = "#ffe19a";
            c.lineWidth = 2;
            c.strokeRect(b.x - 118, panelY, 236, 100);
            this.text("\u76EE\u6807", b.x + 108, panelY + 23, 18, "#ffe19a", "right", true);
          }
          this.text(b.refit ? refitLabel(w, b.weaponKind) : role, b.x, panelY + 51, b.refit ? 21 : 24, "#cfdee9");
          this.text(b.pattern === "drift-supply" ? `${(b.dropGrace ?? 0) > 0 ? "\u62A4\u76D6" : b.age < DRIFT_SUPPLY.settle ? "\u6ED1\u884C" : "\u505C\u7A33"} \xB7 \u788E\u540E\u62FE\u53D6 ${Math.ceil(b.hp)}` : `\u6253\u788E\u518D\u62FE\u53D6 \xB7 ${Math.ceil(b.hp)}`, b.x, panelY + 78, b.pattern === "drift-supply" ? 21 : 23, "#fff0c8");
          this.bar(b.x, b.y - 52, 102, b.hp / b.maxHp, "#e5b96a");
        } else {
          this.rect(b.x - 105, b.y - 110, 210, 40, "#0b1723df");
          this.text(`T${b.stage} ${w.weaponStage(w.weaponKind) >= b.stage ? "\u5145\u80FD+30" : "\u88C5\u5907"} \xB7 ${Math.ceil(b.hp)}`, b.x, b.y - 90, 28, "#fff0c8", "center", true);
          this.bar(b.x, b.y - 64, 102, b.hp / b.maxHp, "#e5b96a");
        }
      } else if (b.kind === "pickup") {
        const target = recipeSupplyMatch(w, this.save.recipeGoal, b), width = target ? 264 : 232, x = clamp(b.x, width / 2 + 12, 720 - width / 2 - 12);
        const behindEnemy = w.bodies.some((other) => other.active && other.kind in C.enemies && Math.abs(x - other.x) < width / 2 + Math.max(80, other.width * 0.85) && Math.abs(b.y - 54 - other.y) < 20 + Math.max(84, other.height * 0.8) + 40);
        if (!behindEnemy) this.rect(x - width / 2, b.y - 74, width, 40, "#0b1723f7");
        this.text((target ? "\u76EE\u6807\xB7" : "") + (b.weaponKind ? `\u62FE\u53D6${b.refit ? "\u6539\u88C5" : w.activeWeapons.includes(b.weaponKind) ? "\u5F3A\u5316" : "\u53E0\u52A0"}${weaponNames[b.weaponKind]}` : `\u62FE\u53D6 T${b.stage}`), x, b.y - 54, 24, "#ffe7b1", "center", true);
      } else if (b.kind === "gate") {
        const value = previewReward(w.growth, gateValue(b.energy, b.rewardKind), b.rewardKind);
        const mixed = value.power > 0 && value.energy > 0;
        const paired = pairedGate(b, w.bodies), panelWidth = b.width - (paired ? 60 : 10);
        const pulse = this.gateFeedback.pulse(b.id, w.time);
        const numberScale = 1 + Math.sin(pulse * Math.PI) * (this.save.settings.effects === "weak" ? 0.03 : 0.08);
        if (!gatePanelBlocked(b, w.bodies, mixed)) this.rect(b.x - panelWidth / 2, b.y - (mixed ? 80 : 54), panelWidth, mixed ? 164 : 108, "#071927f5");
        this.gateText(mixed ? "\u7A7F\u8FC7\u9886\u53D6" : value.power ? "\u7A7F\u8FC7\u9886\u53D6 \xB7 \u706B\u529B" : value.energy ? "\u7A7F\u8FC7\u9886\u53D6 \xB7 \u5145\u80FD" : "\u50A8\u80FD\u5DF2\u6EE1", b.x, b.y - (mixed ? 60 : 33), paired ? 23 : 25, b.rewardKind === "energy" ? "#e7c789" : "#a4d6e9");
        if (mixed) {
          this.gateText(`+${value.power}%`, b.x, b.y - 18, 50 * numberScale, "#effaff", true);
          this.gateText(`\u5145\u80FD +${value.energy}`, b.x, b.y + 32, 36 * numberScale, "#ffe4ac", true);
        } else this.gateText(`+${value.power || value.energy}${value.power ? "%" : ""}`, b.x, b.y + 8, 50 * numberScale, "#effaff", true);
        const tier = C.thresholds.findIndex((t) => t > b.energy);
        const progress = tier < 0 ? 1 : (b.energy - C.thresholds[tier - 1]) / (C.thresholds[tier] - C.thresholds[tier - 1]);
        this.bar(b.x, b.y + (mixed ? 72 : 46), panelWidth - 22, progress, b.rewardKind === "power" ? "#5bddff" : "#e5b96a");
      } else if (b.kind === "boss") {
      } else if ((b.empRemaining ?? 0) > 0) {
        this.bar(b.x, b.y - b.height / 2 - 14, b.width, b.hp / b.maxHp, "#8bdce9");
        if (b.pattern === "fire-control") this.text("\u706B\u63A7\xB7\u505C\u706B", b.x, b.y - b.height / 2 - 36, 21, "#b5f4ff", "center", true);
        else this.text("\u505C\u706B", b.x, b.y - b.height / 2 - 34, 22, "#b5f4ff", "center", true);
      } else if (b.kind === "guard") {
        this.bar(b.x, b.y - 88, b.width, b.hp / b.maxHp, b.burst ? "#ffb45d" : "#87c7de");
        this.text(b.burst ? "\u5F31\u70B9\u66B4\u9732" : b.pattern === "convoy" ? "\u8865\u7ED9\u62A4\u536B" : b.pattern === "relay-screen" ? "\u54E8\u9635\u524D\u76FE" : b.escort && w.bossFormation?.id === "bulwark" ? "\u4F9B\u80FD\u62A4\u536B" : "\u88C5\u7532\u51CF\u4F24", b.x, b.y - 106, 23, b.burst ? "#ffd99b" : "#d0eaff", "center", true);
      } else if (b.kind === "conduit") {
        this.bar(b.x, b.y - b.height / 2 - 14, b.width, b.hp / b.maxHp, "#7de4ed");
        this.text(b.pattern === "fire-control" ? `\u706B\u63A7\u4E2D\u7EE7 \xB7 \u589E\u5E45${w.bodies.filter((g) => fireControlSource(g, w.bodies)?.id === b.id).length}\u53F0` : b.pattern === "relay-screen" ? "\u4E2D\u7EE7\xB7\u505C\u706B\u5F00\u76FE" : "\u4E2D\u7EE7\xB7\u51FB\u7834\u505C\u706B", b.x, b.y + 92, 21, "#a5f2fb", "center", true);
      } else if (b.pattern === "rebound") {
        const state = reboundState(b);
        this.text(state.phase === "turn" ? "\u6298\u8FD4\xB7\u518D\u84C4\u80FD" : state.phase === "return" ? "\u6298\u8FD4\xB7\u51B2\u523A" : "\u6298\u8FD4\u51B2\u950B", b.x, b.y - 82, 20, state.phase === "turn" ? "#ffb59b" : "#a7edff", "center", true);
      } else if (b.kind === "armor" || b.kind === "elite" || b.kind === "sniper") {
        this.bar(b.x, b.y - b.height / 2 - 14, b.width, b.hp / b.maxHp, "#f39b69");
        if (b.pattern === "fire-control") this.text((b.empRemaining ?? 0) > 0 ? "\u706B\u63A7\xB7\u505C\u706B" : fireControlSource(b, w.bodies) ? b.warning > 0 ? "\u589E\u5E45\xB7\u84C4\u80FD" : "\u589E\u5E45\xB7\u6247\u5C04" : "\u65AD\u4F9B\xB7\u5355\u7EBF", b.x, b.y - b.height / 2 - 36, 21, (b.empRemaining ?? 0) > 0 ? "#adf0ff" : "#ffd49a", "center", true);
        if (b.pattern === "relay-screen") this.text(b.warning > 0 ? "\u540E\u54E8\xB7\u84C4\u80FD" : "\u540E\u6392\u54E8\u673A", b.x, b.y - b.height / 2 - 36, 21, "#b8eaff", "center", true);
        if (b.pattern === "lockshot") {
          const target = !this.save.achievements.unlocked.includes(this.save.achievements.tracked ?? "") ? lockshotTargetLabel(w, b, this.save.achievements.tracked) : null;
          this.text(target ?? (b.forkshot ? lockshotLeaving(b) ? "\u4E09\u89D2\xB7\u64A4\u79BB" : (b.empRemaining ?? 0) > 0 ? "\u4E09\u89D2\xB7\u505C\u706B" : b.warning > 0 ? "\u4E09\u89D2\xB7\u84C4\u80FD" : "\u4E09\u89D2\u54E8\u673A" : lockshotLeaving(b) ? "\u659C\u5C04\xB7\u64A4\u79BB" : (b.empRemaining ?? 0) > 0 ? "\u659C\u5C04\xB7\u505C\u706B" : b.warning > 0 ? "\u659C\u5C04\xB7\u84C4\u80FD" : "\u659C\u5C04\u54E8\u673A"), b.x, b.y - b.height / 2 - 36, 22, target ? "#adf0ff" : "#ffce9b", "center", true);
        }
        if (b.pattern === "relocate") this.text(sentryDirection(b) ? "\u6362\u4F4D\u4E2D" : b.warning > 0 ? "\u673A\u52A8\xB7\u84C4\u80FD" : "\u673A\u52A8\u54E8\u673A", b.x, b.y + 92, 21, "#b8eaff", "center", true);
        if (b.pattern === "intercept") this.text(b.warning > 0 ? b.burst ? "\u622A\u51FB\xB7\u6838\u5FC3\u84C4\u80FD" : "\u622A\u51FB\xB7\u7FFC\u70AE\u84C4\u80FD" : (b.interceptCoreRemaining ?? 0) > 0 ? "\u622A\u51FB\xB7\u6838\u5FC3\u8FDE\u5C04" : "\u622A\u51FB\u7CBE\u82F1", b.x, b.y - b.height * 0.68 - 20, 21, b.burst ? "#ffb19c" : "#ffe1a7", "center", true);
        if (b.bountyRound === w.contract?.round && w.contract?.kind === "hunter" && w.contract.status === "active") this.text(w.contract.hunt === "crossfire" ? "\u738B\u724C \xB7 \u6247\u5C04" : "\u60AC\u8D4F\u7CBE\u82F1", b.x, b.y - b.height / 2 - 42, 23, "#ffd884", "center", true);
      }
    }
    for (const b of w.bullets.filter((b2) => b2.hostile)) {
      hostileShot(c, b);
    }
  }
  drawDestruction(dt) {
    const wreck = this.destruction;
    if (!wreck) return;
    for (const burst of wreck.advance(dt)) {
      if (this.blasts.length >= 4) this.blasts.shift();
      this.blasts.push({ ...burst, life: 0.6, total: 0.6 });
    }
    if (wreck.finished) {
      this.destruction = void 0;
      return;
    }
    const img = this.images.get(wreck.variant === 2 ? "boss-bastion-v1.png" : wreck.variant === 1 ? "boss-flanker-v1.png" : "boss-v1.png");
    if (!img) return;
    const c = this.ctx, sw = img.width / 3, sh = img.height;
    for (const piece of wreck.pieces) {
      c.save();
      c.globalAlpha = piece.alpha;
      c.translate(wreck.x + (piece.from + piece.width / 2 - 0.5) * BOSS_VISUAL.width + piece.dx, wreck.y + BOSS_VISUAL.offsetY + piece.dy);
      c.rotate(piece.angle);
      c.drawImage(img, (2 + piece.from) * sw, 0, piece.width * sw, sh, -piece.width * BOSS_VISUAL.width / 2, -BOSS_VISUAL.height / 2, piece.width * BOSS_VISUAL.width, BOSS_VISUAL.height);
      c.restore();
    }
  }
  drawHud() {
    const y = this.hudTop, w = this.world;
    const boss = w.bodies.find((b) => b.active && b.kind === "boss");
    this.rect(0, 0, 720, y + (boss ? 210 : 162), "#08131be8");
    this.text("\u5206\u6570", 30, y + 6, 20, "#91adbf", "left");
    this.text(w.score.toString().padStart(6, "0"), 28, y + 43, 42, "#e9f6ff", "left", true);
    this.text("\u25C8 ".repeat(w.player.hp) + "\u25C7 ".repeat(3 - w.player.hp), 430, y + 35, 34, "#82deff");
    this.rect(624, y + 2, 64, 64, "#1a2e3e");
    this.text("\u2161", 656, y + 34, 36);
    this.buttons.push({ x: 624, y: y + 2, w: 64, h: 64, label: "\u6682\u505C", action: "pause" });
    this.text(`T${w.weaponStage(w.weaponKind)} \xB7 ${w.activeWeapons.length}\u79CD\u6B66\u5668\u53E0\u52A0`, 30, y + 88, 25, weaponColors[w.weaponKind], "left", true);
    this.text(`\u706B\u529B +${permanentPower(w.growth)}%`, 300, y + 88, 24, "#74dcff", "left", true);
    this.text(`${w.round}\u8F6E\xB7${boss && w.bossFormation ? w.bossFormation.name : w.round > 1 ? battleBrief(w.round, w.battlePlan) : sectorNames[sectorIndex(w.round)]}`, 686, y + 88, 26, "#b0c4d1", "right");
    this.bar(360, y + 115, 660, w.growth.overload > 0 ? w.growth.overload / 6 : w.growth.energy / 100, w.growth.overload > 0 ? "#ffc66b" : "#5bddff");
    this.text(w.growth.overload > 0 ? `\u8D85\u8F7D\xD71.35 \xB7 ${w.growth.overload.toFixed(1)}\u79D2  |  \u518D\u5145\u80FD ${Math.floor(w.growth.energy)}/100` : `\u5145\u80FD ${Math.floor(w.growth.energy)}/100 \xB7 \u6EE1100\uFF1A\u672C\u5C40\u706B\u529B+10% / \u8D85\u8F7D6\u79D2`, 360, y + 144, 22, "#d4e8ee");
    if (this.mode === "playing" && w.phase === "running" && w.roundTime <= 40 && !w.contractReward && w.contract?.status !== "active" && w.contract?.round !== w.round && !w.bodies.some((b) => b.active && Math.abs(b.x - 585) < b.width / 2 + 125 && Math.abs(b.y - (y + 200)) < b.height / 2 + 48)) {
      this.rect(480, y + 170, 210, 44, "#213d4d");
      this.text("\u6311\u6218\u5951\u7EA6\u3000\u203A", 585, y + 192, 24, "#ffd598");
      this.buttons.push({ x: 480, y: y + 170, w: 210, h: 44, action: "contracts-live", label: "\u6311\u6218\u5951\u7EA6" });
    }
    if (boss) {
      this.text(`${boss.bossVariant === 2 ? "\u5C01\u9501\u5821\u5792" : boss.bossVariant === 1 ? "\u53CC\u7FFC\u538B\u5236\u8005" : "\u91CD\u88C5\u9996\u9886"}${boss.counterfire ? "\xB7\u8FC7\u70ED" : ""}${w.bossShieldActive() ? "\xB7\u5C4F\u969C45%" : ""}\u3000${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)}`, 360, y + 172, 25, "#ffd59e");
      this.bar(360, y + 196, 620, boss.hp / boss.maxHp, w.bossShieldActive() ? "#82dfff" : "#ff925d");
    }
  }
  buildReceiptLocation() {
    if (this.buildFeedback?.equipment && this.notice && this.noticeY === 1195 && this.platform.now() < this.noticeUntil) return null;
    const w = this.world, position = buildReceiptPosition(w);
    const combat = w.bodies.some((b) => b.active && (b.kind === "boss" || b.bountyRound !== void 0));
    const guide = contextGuide(w), weaponBrief = guide.kind === "move" && w.phase === "running" && w.time < this.weaponGuideUntil;
    if (position === 1180 && !combat && (guide.kind !== "move" || weaponBrief)) return null;
    return position;
  }
  drawGuide() {
    if (this.mode !== "playing") return;
    const receiptThreat = this.world.bodies.some((b) => b.active && (b.kind === "boss" || b.bountyRound !== void 0));
    if (this.world.time < this.achievementUntil) return;
    if (this.buildFeedback && this.world.time < this.buildFeedback.until && this.buildReceiptLocation() === 1180) return;
    const activeReceipt = this.buildFeedback && this.world.time < this.buildFeedback.until && this.buildReceiptLocation() !== null;
    if (!activeReceipt && this.notice && (this.noticeY === 1195 || receiptThreat) && this.platform.now() < this.noticeUntil) return;
    if (this.world.bodies.some((b) => b.active && b.y + b.height * 0.8 >= 1150 && b.y - b.height * 0.8 <= 1256)) return;
    if (this.world.bullets.some((b) => b.active && b.hostile && b.x + 8 >= 44 && b.x - 8 <= 676 && b.y + 12 >= 1150 && b.y - 7 <= 1256)) return;
    let guide = contextGuide(this.world);
    if (this.world.phase === "boss" && this.world.phaseTime < 8 && this.world.bossFormation) guide = { kind: "move", title: this.world.bossFormation.name, detail: this.world.bossFormation.hint };
    if (guide.kind === "move" && this.world.phase === "running" && this.world.time < this.weaponGuideUntil)
      guide = weaponGuide(this.weaponGuideKind, this.world.weaponStage(this.weaponGuideKind), this.world.profileFor(this.weaponGuideKind));
    const goal = this.save.recipeGoal;
    if (goal && this.world.phase === "running") {
      const status = recipeStatus(this.world, goal);
      const supplies = this.world.bodies.filter((b) => recipeSupplyMatch(this.world, goal, b) && b.y >= 160 && b.y <= C.playerY + (b.kind === "pickup" ? 52 : 0));
      if (supplies.length && (guide.kind === "crate" || guide.kind === "pickup")) {
        const drops = supplies.filter((b) => b.kind === "pickup"), shown = drops.length ? drops : supplies;
        const names2 = [...new Set(shown.map((b) => weaponNames[b.weaponKind]))].join(" / ");
        guide = { kind: guide.kind, title: `\u76EE\u6807\u8865\u7ED9 \xB7 ${status.name}`, detail: `${names2} \xB7 ${drops.length ? "\u9760\u8FD1\u62FE\u53D6" : "\u6253\u788E\u518D\u62FE\u53D6"} \xB7 \u540C\u6392\u53EA\u9886\u4E00\u4EF6` };
      } else if (guide.kind === "move") guide = { kind: "move", title: `\u6784\u7B51\u76EE\u6807 \xB7 ${status.name}${status.ready ? " \xB7 \u5DF2\u6210\u5F62" : ""}`, detail: status.ready ? "\u6309\u914D\u65B9\u6761\u4EF6\u89E6\u53D1 \xB7 \u6682\u505C\u53EF\u9009\u62E9\u65B0\u76EE\u6807" : status.need };
    }
    const tactic = !this.save.achievements.unlocked.includes(this.save.achievements.tracked ?? "") && this.world.phase === "running" ? lockshotGoal(this.world, this.save.achievements.tracked) : null;
    if (tactic && (guide.kind === "move" || guide.kind === "enemy" && guide.title.startsWith("\u659C\u5C04"))) guide = tactic;
    if (guide.detail) {
      this.rect(44, 1150, 632, 106, "#081a25df");
      this.text(guide.title, 360, 1180, 28, "#e3f4ff", "center", true);
      this.text(guide.detail, 360, 1224, 25, "#b8d4e3");
    } else this.text(this.inputMode === "keyboard" ? "\u2039\u3000A/D \u6216 \u2190/\u2192 \xB7 \u81EA\u52A8\u5F00\u706B\u3000\u203A" : "\u2039\u3000\u5DE6\u53F3\u62D6\u52A8 \xB7 \u81EA\u52A8\u5F00\u706B\u3000\u203A", 360, 1230, 24, "#b8d4e3");
  }
  drawMenu() {
    this.rect(0, 0, 720, 510, "#07111b88");
    this.rect(0, 920, 720, 360, "#07111bea");
    this.text("\u706B\u529B\u7A81\u56F4", 360, 290, 82, "#e5f3fa", "center", true);
    this.text("G A T E  S H O O T E R", 360, 370, 27, "#72cde9");
    this.rect(280, 420, 160, 2, "#5bddff");
    this.text("\u628A\u5956\u52B1\u6253\u9AD8\u3002\u628A\u706B\u529B\u6253\u6EE1\u3002", 360, 475, 29, "#c2dbe8");
    this.text(`\u6700\u9AD8\u5206\u3000${this.save.best}`, 360, 890, 26, "#e8c98d");
    this.rect(176, 650, 368, 96, "#173442");
    const openingLabel = `\u9996\u7BB1\u9884\u5B9A \xB7 ${weaponNames[this.save.openingWeapon]} T2\u3000\u203A`;
    this.text(openingLabel, 360, 685, 25, weaponColors[this.save.openingWeapon], "center", true);
    this.buttons.push({ x: 176, y: 650, w: 368, h: 96, action: "opening-menu", label: openingLabel });
    this.text("8\u79D2\u6295\u9001 \xB7 \u51FB\u788E\u540E\u62FE\u53D6", 360, 734, 21, "#b8d4e3");
    this.rect(176, 754, 368, 70, "#173442");
    const goal = this.save.recipeGoal;
    const goalLabel = goal ? `\u6784\u7B51\u76EE\u6807 \xB7 ${recipes[goal].name}` : "\u9009\u62E9\u6784\u7B51\u76EE\u6807\u3000\u203A";
    this.text(goalLabel, 360, 789, 25, "#d3e9b7", "center", true);
    this.buttons.push({ x: 176, y: 754, w: 368, h: 70, action: "combos-menu", label: goalLabel });
    this.text(`\u4E0B\u6B21\u4FA7\u7FFC\u6218\u51B5 \xB7 ${sideBattlePreview(this.save.nextBattlePlan)}`, 360, 850, 22, "#b8d4e3");
    this.button("\u5F00\u59CB\u7A81\u56F4\u3000\u203A", 932, "start", true);
    this.button("\u6B66\u5668\u6863\u6848", 1030, "armory");
    for (const [i, label] of ["\u6210\u5C31", "\u8BBE\u7F6E"].entries()) {
      const x = 112 + i * 258;
      this.rect(x, 1128, 238, 86, "#1a2d3c");
      this.text(label, x + 119, 1171, 30, "#d8eaf5");
      this.buttons.push({ x, y: 1128, w: 238, h: 86, label, action: i ? "settings" : "achievements" });
    }
    const tracked = achievements.find((a) => a.id === this.save.achievements.tracked);
    this.text(tracked ? `${this.save.achievements.unlocked.includes(tracked.id) ? "\u5DF2\u8FBE\u6210" : "\u4E0B\u5C40\u76EE\u6807"} \xB7 ${tracked.name} \xB7 \u5230\u6210\u5C31\u9875\u67E5\u770B` : "\u5C04\u51FB\u88C5\u5907\uFF0C\u518D\u8D70\u4F4D\u9886\u53D6\u5F3A\u5316", 360, 1230, 23, "#99b6c9");
  }
  drawOpening() {
    this.rect(40, 100, 640, 1100, "#102330");
    this.text("\u9996\u7BB1\u9884\u5B9A", 360, 180, 44, "#e7f5ff", "center", true);
    this.text("\u51B3\u5B9A\u65E9\u671F\u914D\u4EF6 \xB7 \u540E\u7EED\u4ECD\u53EF\u81EA\u7531\u53E0\u52A0", 360, 235, 24, "#bdd8e7");
    for (const [i, kind] of openingWeapons.entries()) {
      const y = 270 + i * 180, selected = this.save.openingWeapon === kind, color = weaponColors[kind], entry = weaponDossier[kind];
      this.rect(65, y, 590, 160, selected ? "#2a4b59" : "#1a3242");
      this.rect(65, y, 5, 160, color);
      this.frameSprite(entry.asset, 1, 3, 139, y + 80, 100, 133, 1);
      this.text(`${weaponNames[kind]} T2`, 220, y + 38, 31, color, "left", true);
      this.text(selected ? "\u5DF2\u9884\u5B9A" : "\u9009\u62E9 \u203A", 625, y + 38, 23, selected ? "#f5dfa0" : "#c5e0ec", "right");
      this.text(entry.role, 220, y + 82, 24, "#e5f3fa", "left");
      this.text(openingHints[kind], 220, y + 124, 22, "#bdd8e7", "left");
      this.buttons.push({ x: 65, y, w: 590, h: 160, action: `opening:${kind}`, label: `\u9884\u5B9A${weaponNames[kind]}` });
    }
    this.text("8\u79D2\u9996\u7BB1 \xB7 \u6253\u788E\u540E\u4ECD\u9700\u62FE\u53D6 \xB7 \u5F00\u5C40\u4E0D\u76F4\u63A5\u53D1\u67AA", 360, 1040, 23, "#e2c994");
    this.button("\u8FD4\u56DE\u4E3B\u754C\u9762", 1100, "opening-back", true);
  }
  drawAchievements() {
    this.rect(40, 90, 640, 1120, "#102330");
    this.text("\u7A81\u56F4\u6210\u5C31", 360, 155, 42, "#effaff", "center", true);
    const state = this.save.achievements;
    this.text(`\u5DF2\u8FBE\u6210 ${state.unlocked.length}/${achievements.length} \xB7 \u6784\u7B51\u8BA4\u8BC1 ${state.certifiedBuilds.length}/${Object.keys(buildProofs).length}`, 360, 210, 25, "#bdd8e7");
    for (const [i, group] of Object.keys(achievementGroups).entries()) {
      const x = 65 + i * 198, selected = group === this.achievementTab;
      this.rect(x, 245, 186, 66, selected ? "#31556a" : "#1a2d3c");
      this.text(achievementGroups[group].name, x + 93, 278, 27, selected ? "#bceeff" : "#d1e0e8");
      this.buttons.push({ x, y: 245, w: 186, h: 66, label: achievementGroups[group].name, action: `achievement-group:${group}` });
    }
    const ids = achievementGroups[this.achievementTab].ids;
    const all = achievements.filter((a) => ids.includes(a.id)), paged = all.length > 6, pages = paged ? Math.ceil(all.length / 4) : 1;
    this.achievementPage = Math.max(0, Math.min(pages - 1, this.achievementPage));
    const items = paged ? all.slice(this.achievementPage * 4, this.achievementPage * 4 + 4) : all, compact = items.length > 5, step = compact ? 108 : 130, height = compact ? 98 : 120;
    for (const [i, a] of items.entries()) {
      const y = 335 + i * step, done = state.unlocked.includes(a.id), tracked = state.tracked === a.id;
      this.rect(65, y, 590, height, done ? "#263d43" : tracked ? "#203f52" : "#142b39");
      if (tracked) this.rect(65, y, 4, height, "#7fe4ff");
      this.text(a.name, 85, y + (compact ? 24 : 29), compact ? 27 : 29, done ? "#ffdc8a" : "#effaff", "left", true);
      this.text(done ? this.achievementReturn === "result" && this.runAchievements.includes(a.id) ? "\u672C\u5C40\u65B0\u8FBE\u6210" : "\u5DF2\u8FBE\u6210" : tracked ? "\u8FFD\u8E2A\u4E2D" : "\u8BBE\u4E3A\u76EE\u6807", 635, y + (compact ? 24 : 29), 22, done ? "#ffdc8a" : "#8bddf5", "right");
      this.text(a.detail, 85, y + (compact ? 52 : 66), compact ? 22 : 23, "#c6dce9", "left");
      this.text(achievementProgress(a.id, state), 85, y + (compact ? 80 : 100), compact ? 18 : 20, "#9fbccf", "left");
      if (!done) this.buttons.push({ x: 65, y, w: 590, h: height, label: `\u8FFD\u8E2A${a.name}`, action: `track:${a.id}` });
    }
    if (paged) {
      this.text(`${this.achievementPage + 1}/${pages}\u9875`, 360, 920, 23, "#bceeff");
      for (const [offset, label, x] of [[-1, "\u4E0A\u4E00\u9875", 85], [1, "\u4E0B\u4E00\u9875", 475]]) {
        const page = this.achievementPage + offset;
        if (page < 0 || page >= pages) continue;
        this.rect(x, 889, 160, 62, "#21414b");
        this.text(label, x + 80, 920, 24, "#d1e8ee");
        this.buttons.push({ x, y: 889, w: 160, h: 62, label, action: offset < 0 ? "achievement-page:previous" : "achievement-page:next" });
      }
    }
    const target = achievements.find((a) => a.id === state.tracked);
    this.text(target ? `\u5DF2\u8FFD\u8E2A\uFF1A${target.name}` : "\u70B9\u9009\u672A\u8FBE\u6210\u6210\u5C31\uFF0C\u8BBE\u4E3A\u4E0B\u5C40\u76EE\u6807", target ? 85 : 360, 1025, 23, "#bceeff", target ? "left" : "center");
    if (target) {
      this.rect(480, 995, 170, 58, "#21414b");
      this.text("\u53D6\u6D88\u8FFD\u8E2A", 565, 1024, 23, "#d1e8ee");
      this.buttons.push({ x: 480, y: 995, w: 170, h: 58, label: "\u53D6\u6D88\u8FFD\u8E2A", action: "track-clear" });
    }
    this.button(this.achievementReturn === "result" ? "\u8FD4\u56DE\u672C\u5C40\u6218\u7EE9" : "\u8FD4\u56DE\u4E3B\u754C\u9762", 1070, "achievements-back", true);
    this.text("\u8BB0\u5F55\u4FDD\u5B58\u5728\u672C\u673A \xB7 \u4E0D\u589E\u52A0\u5C40\u5916\u4F24\u5BB3", 360, 1184, 21, "#9fbccf");
  }
  drawArmory() {
    const kind = this.dossierWeapon, entry = weaponDossier[kind], color = weaponColors[kind];
    this.rect(40, 90, 640, 1130, "#102330");
    this.text("\u6B66\u5668\u6863\u6848", 360, 156, 46, "#e7f5ff", "center", true);
    this.text("\u8BA4\u6E05\u706B\u529B\uFF0C\u518D\u9009\u62E9\u4F60\u7684\u7A81\u7834\u65B9\u5F0F", 360, 205, 24, "#a5c4d6");
    for (const [i, weapon] of dossierWeapons.entries()) {
      const x = 56 + i * 122;
      this.rect(x, 246, 120, 70, weapon === kind ? "#2d5368" : "#172f40");
      this.text(weaponNames[weapon], x + 60, 281, 26, weaponColors[weapon], "center", true);
      if (weapon === kind) this.rect(x + 12, 311, 96, 3, color);
      this.buttons.push({ x, y: 246, w: 120, h: 70, action: `dossier:${weapon}`, label: weaponNames[weapon] });
    }
    for (let tier = 0; tier < 3; tier++) {
      const x = 170 + tier * 190;
      this.rect(x - 84, 350, 168, 276, "#091723");
      this.frameSprite(entry.asset, tier, kind === "pulse" ? 4 : 3, x, 480, 160, 213, kind === "pulse" ? 2 : 1);
      this.text(`T${tier + 1}`, x, 603, 25, color, "center", true);
    }
    this.text(entry.role, 360, 684, 32, color, "center", true);
    this.text("\u9002\u5408\u8FD9\u6837\u6253", 92, 756, 25, "#f0d19a", "left", true);
    this.text(entry.strength, 92, 803, 25, "#d6e7f0", "left");
    this.text("\u7559\u610F\u53D6\u820D", 92, 868, 25, "#f0d19a", "left", true);
    this.text(entry.tradeoff, 92, 915, 25, "#d6e7f0", "left");
    this.rect(86, 963, 548, 1, "#355064");
    this.text("\u51FB\u788E\u540E\u62FE\u53D6 \xB7 \u65B0\u6B66\u5668\u4E0E\u5DF2\u6709\u6B66\u5668\u5171\u540C\u5F00\u706B", 360, 1004, 25, "#b8d4e3");
    this.text("\u540C\u6392\u9009\u4E00\u79CD\u5956\u52B1 \xB7 \u65E7\u80FD\u529B\u4FDD\u7559\u5230\u672C\u5C40\u7ED3\u675F", 360, 1045, 25, "#b8d4e3");
    this.button("\u8FD4\u56DE\u4E3B\u754C\u9762", 1100, "armory-back", true);
  }
  drawRefitPlan() {
    const w = this.world;
    this.rect(40, 100, 640, 1100, "#102330");
    this.text("\u519B\u68B0\u8865\u7ED9 \xB7 \u6539\u88C5\u76EE\u6807", 360, 165, 38, "#effaff", "center", true);
    this.text("\u6B21\u8F6E\u8D77\u5F71\u54CD\u540E\u7EED\u6539\u88C5\u7BB1 \xB7 \u5DF2\u6295\u9001\u7684\u4E0D\u53D8", 360, 222, 23, "#bdd8e7");
    this.text("\u540C\u6392\u4ECD\u9009\u4E00\u4E2A \xB7 \u6253\u788E\u540E\u62FE\u53D6\u624D\u5347\u7EA7", 360, 260, 23, "#f0d19a");
    for (const [i, kind] of w.activeWeapons.entries()) {
      const y = 292 + i * 134, preview = equipmentPreview(w, kind), chosen = w.refitTarget === kind;
      this.rect(66, y, 588, 124, chosen ? "#26475a" : "#132d3c");
      this.rect(66, y, 4, 124, preview.color);
      const entry = weaponDossier[kind];
      this.frameSprite(entry.asset, w.weaponStage(kind) - 1, kind === "pulse" ? 4 : 3, 126, y + 62, 76, 100, kind === "pulse" ? 2 : 1);
      this.text(preview.title, 182, y + 29, 26, preview.color, "left", true);
      this.text(chosen ? "\u5DF2\u6307\u5B9A" : "\u9009\u62E9", 632, y + 29, 21, chosen ? "#ffe19a" : "#bdd8e7", "right", chosen);
      this.text(preview.detail, 182, y + 67, 23, "#e1f7ff", "left");
      this.text(preview.hint, 182, y + 103, 21, "#c4dca9", "left");
      this.buttons.push({ x: 66, y, w: 588, h: 124, action: `refit-focus:${kind}`, label: `\u6307\u5B9A\u6539\u88C5${weaponNames[kind]}` });
    }
    this.text("\u76F4\u4F24\u4E0D\u8BA1\u8D85\u8F7D\u3001\u547D\u4E2D\u7387\u4E0E\u6D3E\u751F \xB7 \u672C\u5C40\u6709\u6548", 360, 1004, 21, "#bdd8e7");
    this.rect(120, 1030, 480, 66, "#203e50");
    this.text(w.refitTarget ? "\u6062\u590D\u81EA\u52A8\u6539\u88C5" : "\u81EA\u52A8\u6539\u88C5 \xB7 \u5F53\u524D\u751F\u6548", 360, 1063, 26, "#d8eaf5");
    this.buttons.push({ x: 120, y: 1030, w: 480, h: 66, action: "refit-auto", label: "\u6062\u590D\u81EA\u52A8\u6539\u88C5" });
    this.button("\u8FD4\u56DE\u5F53\u524D\u706B\u529B", 1130, "refit-plan-back");
  }
  drawLoadout() {
    const w = this.world, power = permanentPower(w.growth);
    this.rect(40, 100, 640, 1100, "#102330");
    this.text("\u5F53\u524D\u706B\u529B", 330, 165, 46, "#e7f5ff", "center", true);
    this.rect(490, 135, 160, 60, "#203e50");
    this.text("\u67E5\u770B\u673A\u7532", 570, 165, 25, "#80e4ff");
    this.buttons.push({ x: 490, y: 135, w: 160, h: 60, action: "rig-view", label: "\u67E5\u770B\u673A\u7532" });
    this.text(`\u5DF2\u53E0\u52A0 ${w.activeWeapons.length} \u79CD\u6B66\u5668`, 82, 228, 25, "#a5d9ed", "left");
    this.rect(300, 202, 348, 54, "#203e50");
    this.text(`\u6539\u88C5\u76EE\u6807 \xB7 ${w.refitTarget ? weaponNames[w.refitTarget] : "\u81EA\u52A8"}\u3000\u203A`, 474, 229, 24, "#ffe19a");
    this.buttons.push({ x: 300, y: 202, w: 348, h: 54, action: "refit-plan", label: "\u9009\u62E9\u6539\u88C5\u76EE\u6807" });
    this.text(`\u672C\u5C40\u706B\u529B +${power}% \xB7 \u5145\u80FD\u7A81\u7834 ${w.growth.mastery ?? 0} \u6B21`, 360, 278, 27, "#f0d19a");
    this.text(`\u6280\u80FD\u70B9\uFF1A\u53EF\u7528${w.buildPoints - w.build.spent} \xB7 \u7814\u53D1${w.researchPoints} \uFF0B \u5145\u80FD\u7A81\u7834${w.growth.mastery ?? 0}`, 360, 310, 21, "#bdd8e7");
    for (const [index, kind] of w.activeWeapons.entries()) {
      const profile = w.profileFor(kind), y = 342 + index * 102;
      const damage = profile.damage.map((n) => +(n * (1 + power / 100)).toFixed(1));
      this.rect(72, y, 576, 94, "#091723");
      this.text(`${weaponNames[kind]} T${w.weaponStage(kind)}${kind === "arc" && w.build.electricBranch === "capacitor" ? " \xB7 \u84C4\u7206" : kind === "arc" && w.build.electricBranch === "spread" ? " \xB7 \u6269\u6563" : kind === "arc" && w.build.electricBranch === "seeker" ? " \xB7 \u730E\u96BC" : ""}${w.weaponCalibration(kind) ? " \xB7 \u7CBE\u6821" + w.weaponCalibration(kind) : ""}`, 92, y + 28, 28, weaponColors[kind], "left", true);
      this.text(kind === "arc" ? `${w.build.electricBranch === "seeker" ? "\u9996\u8DF3340" : "\u7D22\u654C" + ARC_SHOT.aimWidth} \xB7 \u8DF3\u7535${profile.chainHops}\xD7${w.build.ranks.electric >= 3 ? 80 : 65}%` : kind === "blast" ? `\u8303\u56F4${profile.splashRadius}${w.magneticUnlocked() ? w.build.magneticAugment === "field-wide" ? " \xB7 \u5E7F\u57DF\u7535\u573A" : w.build.magneticAugment === "field-link" ? " \xB7 \u5206\u6D41\u7535\u573A" : " \xB7 \u4E09\u62CD\u7535\u573A" : ""}` : kind === "pierce" ? `\u8D2F\u7A7F${profile.targets}\u654C${w.fractureUnlocked() ? " \xB7 \u88C2\u7532" + w.fractureProfile().hits + "\u51FB" : ""}` : kind === "scatter" ? w.build.ballisticBranch === "penetrator" ? "\u8D2F\u7A7F2\u654C" : w.build.ballisticBranch === "fragment" ? "140\u8303\u56F4 \xB7 50%\u6E85\u5C04" : w.build.ballisticBranch === "ricochet" ? "280\u8303\u56F4 \xB7 55%\u4FA7\u8DF3" : "\u8FD1\u8DDD\u805A\u5F39" : "\u96C6\u4E2D\u76F4\u5C04", 628, y + 28, 23, "#a9c9d9", "right");
      const perShot = Math.min(...damage) === Math.max(...damage) ? `${damage[0]}` : `${Math.min(...damage)}\u2013${Math.max(...damage)}`;
      this.text(`${profile.rate}\u8F6E/\u79D2 \xB7 \u6BCF\u8F6E${profile.offsets.length}\u53D1 \xB7 \u5355\u53D1\u4F24\u5BB3${perShot}`, 92, y + 68, 23, "#d6e7f0", "left");
    }
    const support = w.supportProfile();
    this.text(support.laserUnlocked ? `\u6FC0\u5149${w.build.opticalBranch === "burn" ? "\xB7\u707C\u70ED" : w.build.opticalBranch === "relay" ? "\xB7\u5206\u5149" : ""}\uFF1A\u6BCF${support.laserInterval}\u79D2${+(support.laserDamage * (1 + power / 100)).toFixed(1)}\u4F24\u5BB3 \xB7 \u8D2F\u7A7F${support.laserTargets}\u654C` : "\u7B2C3\u6B21\u5145\u80FD\u7A81\u7834\uFF1A\u8FFD\u52A0\u8D2F\u7A7F\u6FC0\u5149", 360, 890, 24, "#7fe4ff");
    this.text(support.refractionTargets > 0 ? `\u6298\u5C04\uFF1A\u547D\u4E2D\u540E\u8FFD\u52A0${support.refractionTargets}\u654C \xB7 \u540460%\u4F24\u5BB3` : "\u7B2C5\u6B21\u5145\u80FD\u7A81\u7834\uFF1A\u8FFD\u52A0\u5F39\u4E38\u6298\u5C04", 360, 930, 23, "#a2f9ed");
    this.text(w.laserChainUnlocked() ? `\u5149\u94FE${laserChainProfile(w.build.photonAugment).hops}\u8DF3/${laserChainProfile(w.build.photonAugment).range} \xB7 \u805A\u80FD${Math.round(laserChainProfile(w.build.photonAugment).focus * 100)}%${support.prism ? " \xB7 \u68F1\u955C45%" : ""}` : support.prism ? "\u68F1\u955C\u53CC\u675F\uFF1A\u4E24\u4FA7\u540445%\u4F24\u5BB3 \xB7 \u4E3B\u675F\u4FDD\u7559" : "\u6570\u503C\u542B\u6C38\u4E45\u52A0\u6210\uFF1B\u8D85\u8F7D\u65F6\u989D\u5916\xD71.35", 360, 970, 23, "#c7deeb");
    this.text(w.build.ranks.electric >= 3 ? w.build.ionAugment ? `\u79BB\u5B50 ${w.ionCharge}/6 \xB7 ${ionAugments[w.build.ionAugment].name} \xB7 \u8FFD\u52A0\u547D\u4E2D${w.ionOrbHits + w.ionSpearHits}` : `\u79BB\u5B50\u98CE\u66B4 ${w.ionCharge}/${ION_STORM.hits} \xB7 \u8303\u56F4${ION_STORM.radius} \xB7 ${ION_STORM.damage * 100}%\u4F24\u5BB3` : `\u6280\u80FD ${w.build.baseSpent}/9 \xB7 \u7CBE\u8C03 ${w.build.spent - w.build.baseSpent}\u6B21`, 360, 1004, 23, "#f0d19a");
    for (const [i, label] of ["\u6280\u80FD\u6811", "\u7EC4\u5408\u914D\u65B9", "\u6311\u6218\u5951\u7EA6"].entries()) {
      const x = 72 + i * 198;
      this.rect(x, 1030, 180, 86, "#1a2d3c");
      this.text(label, x + 90, 1073, 25, "#d8eaf5");
      this.buttons.push({ x, y: 1030, w: 180, h: 86, label, action: ["tree", "combos", "contracts"][i] });
    }
    this.button("\u8FD4\u56DE\u6682\u505C\u83DC\u5355", 1130, "loadout-back");
  }
  drawCombos() {
    const w = this.world, goal = this.save.recipeGoal, tracked = goal ? recipeStatus(w, goal) : null;
    this.rect(35, 90, 650, 1120, "#102330");
    this.text("\u6784\u7B51\u76EE\u6807\u4E0E\u914D\u65B9", 360, 150, 40, "#effaff", "center", true);
    this.text(tracked ? `\u5DF2\u8FFD\u8E2A \xB7 ${tracked.name}` : "\u5148\u9009\u76EE\u6807\uFF0C\u518D\u5BFB\u627E\u9700\u8981\u7684\u8865\u7ED9\u4E0E\u5347\u7EA7", 360, 207, 24, "#d4e7ad");
    this.text(tracked ? tracked.ready ? "\u5DF2\u6210\u5F62 \xB7 \u6309\u914D\u65B9\u6761\u4EF6\u89E6\u53D1" : tracked.need : "\u6253\u788E\u540E\u4ECD\u9700\u62FE\u53D6 \xB7 \u540C\u6392\u53EA\u9886\u4E00\u4EF6", 360, 237, 20, "#bdd8e7");
    for (const [i, id] of recipeIds.entries()) {
      const row = recipeStatus(w, id), performance = recipePerformance(w, id), selected = goal === id, y = 260 + i * 128;
      this.rect(65, y, 590, 120, selected ? "#294b4c" : "#203e50");
      this.rect(65, y, 5, 120, row.color);
      this.text(row.name, 90, y + 28, 28, row.color, "left", true);
      this.text(performance.label, 470, y + 28, 18, performance.ready ? performance.count ? "#a2ffbb" : "#f0d19a" : "#b9cad6", "right");
      this.rect(492, y + 7, 146, 42, selected ? "#46614c" : "#112a39");
      const label = selected ? "\u53D6\u6D88\u76EE\u6807" : "\u8BBE\u4E3A\u76EE\u6807";
      this.text(label, 565, y + 28, 21, selected ? "#ffdf93" : "#c4e8f5", "center", true);
      this.buttons.push({ x: 492, y: y + 7, w: 146, h: 42, action: `recipe-goal:${id}`, label: `${label} \xB7 ${row.name}` });
      this.text(row.progress, 90, y + 58, id === "photon" ? 18 : 20, "#effaff", "left");
      this.text(row.effect, 90, y + 83, 21, "#dbeaf3", "left");
      this.text(row.hint, 90, y + 107, 19, "#bdd8e7", "left");
    }
    this.text(`\u88C2\u7532\u5F15\u7206 ${w.fractureBursts}\u6B21 \xB7 \u8DF3\u4F24 ${w.laserArcHits}\u6B21 \xB7 \u805A\u80FD ${w.laserFocusHits}\u6B21`, 360, 1055, 23, "#ffca8b");
    this.button(this.combosReturn === "menu" ? "\u8FD4\u56DE\u4E3B\u754C\u9762" : "\u8FD4\u56DE\u5F53\u524D\u706B\u529B", 1100, "combos-back", true);
  }
  drawRigView() {
    const w = this.world, c = this.ctx;
    this.rect(35, 90, 650, 1120, "#102330");
    this.text("\u672C\u5C40\u673A\u7532", 360, 150, 42, "#effaff", "center", true);
    this.text(`${w.activeWeapons.length}\u79CD\u6B66\u5668\u53E0\u52A0 \xB7 \u673A\u4F53\u4E0E\u6302\u8F7D\u4FDD\u7559`, 360, 208, 25, "#bdd8e7");
    const ground = this.images.get("runway.jpg");
    if (ground) c.drawImage(ground, 70, 260, 580, 660);
    this.rect(70, 260, 580, 660, "#06121c55");
    c.save();
    c.translate(360, 610);
    c.scale(2.25, 2.25);
    c.translate(-w.player.x, -C.playerY);
    const pose = this.playerMotion.sample(w.player.x, w.time);
    this.drawMountedRig(C.playerY, pose);
    this.playerSprite(w.weaponStage(w.weaponKind) - 1, w.player.x, C.playerY, pose, this.calibratedRecoil(w.weaponKind));
    this.drawCalibrationRig(C.playerY, pose, this.calibratedRecoil(w.weaponKind));
    this.drawOpticalRig(C.playerY, pose);
    c.restore();
    this.text(w.activeWeapons.map((kind) => `${weaponNames[kind]}T${w.weaponStage(kind)}`).join(" \xB7 "), 360, 965, 22, "#d6e7f0");
    const combinations = [w.build.ranks.ballistic >= 3 ? "\u96F7\u66B4\u9730\u5C04" : "", w.supportProfile().prism ? "\u68F1\u955C\u6FC0\u5149" : "", w.fractureUnlocked() ? "\u88C2\u7532\u7206\u7834" : "", w.laserChainUnlocked() ? "\u7535\u5149\u8FDE\u9501" : "", w.magneticUnlocked() ? "\u78C1\u66B4\u69B4\u5F39" : ""].filter(Boolean);
    this.text(combinations.length ? `\u7EC4\u5408\uFF1A${combinations.slice(0, 3).join(" \xB7 ")}` : "\u5DF2\u6709\u914D\u4EF6\u968F\u771F\u5B9E\u5C04\u51FB\u72EC\u7ACB\u56DE\u5F39", 360, 1e3, 25, "#d6b5ff");
    if (combinations.length > 3) this.text(combinations.slice(3).join(" \xB7 "), 360, 1031, 25, "#d6b5ff");
    this.text(w.supportProfile().laserUnlocked ? `\u955C\u7EC4\u84C4\u80FD ${Math.round(w.laserCharge() * 100)}% \xB7 \u6218\u6597\u65F6\u95F4\u5DF2\u6682\u505C` : "\u68C0\u67E5\u6302\u8F7D\u4E0E\u7B49\u7EA7 \xB7 \u6218\u6597\u65F6\u95F4\u5DF2\u6682\u505C", 360, 1065, 22, "#a6c5d7");
    this.button("\u8FD4\u56DE\u5F53\u524D\u706B\u529B", 1100, "rig-back", true);
  }
  weaponUpgradeOptions() {
    return this.world.activeWeapons.map((kind) => equipmentPreview(this.world, kind));
  }
  drawRewardOption(o, y, prefix) {
    this.rect(65, y, 590, 118, "#203e50");
    this.rect(65, y, 4, 118, o.color);
    this.rect(81, y + 7, 91, 104, "#102733");
    if (o.kind === "research" || o.kind === "energy") {
      const c = this.ctx;
      c.save();
      c.strokeStyle = o.color;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(101, y + 22);
      c.lineTo(140, y + 22);
      c.lineTo(155, y + 37);
      c.lineTo(155, y + 92);
      c.lineTo(101, y + 92);
      c.closePath();
      c.stroke();
      c.beginPath();
      c.moveTo(140, y + 22);
      c.lineTo(140, y + 37);
      c.lineTo(155, y + 37);
      c.stroke();
      c.restore();
      this.text(o.kind === "research" ? "+1" : "\u03DF", 128, y + 61, 30, o.color, "center", true);
    } else {
      const entry = weaponDossier[o.kind];
      this.frameSprite(entry.asset, (o.toTier ?? this.world.weaponStage(o.kind)) - 1, o.kind === "pulse" ? 4 : 3, 126, y + 59, 78, 104, o.kind === "pulse" ? 2 : 1);
    }
    this.text(o.title, 190, y + 29, 27, o.color, "left", true);
    this.text(o.detail, 190, y + 64, 22, "#e1f1f8", "left");
    this.text(o.hint, 190, y + 96, 20, "#bdd8e7", "left");
    this.text("\u203A", 632, y + 56, 30, o.color, "right");
    this.buttons.push({ x: 65, y, w: 590, h: 118, action: `${prefix}:${o.kind}`, label: o.title });
  }
  drawBossReward() {
    const w = this.world;
    if (w.bossRewardRound === null) return;
    this.rect(35, 120, 650, 1080, "#102330");
    this.text(`\u7B2C${w.bossRewardRound}\u8F6E\u9996\u9886\u6218\u5229\u54C1`, 360, 184, 38, "#ffdc8a", "center", true);
    this.text("\u5168\u5F39\u547D\u4E2D\u65F6\u7684\u76F4\u4F24 \xB7 \u4E0D\u542B\u8D85\u8F7D\u4E0E\u6D3E\u751F", 360, 237, 22, "#bdd8e7");
    this.text(`\u9996\u9886\u5145\u80FD+50\u5DF2\u7ED3\u7B97 \xB7 \u5F53\u524D\u88C5\u7532 ${w.player.hp}/3`, 360, 271, 21, "#9db8c8");
    const points = w.buildPoints - w.build.spent;
    const options = [{ kind: "research", title: "\u7814\u53D1\u84DD\u56FE \xB7 \u6280\u80FD\u70B9+1", detail: `\u53EF\u7528\u6280\u80FD\u70B9 ${points} \u2192 ${points + 1}`, hint: "\u9886\u53D6\u540E\u9009\u62E9\u5347\u7EA7\u8DEF\u7EBF \xB7 \u4E0D\u6539\u53D8\u5145\u80FD", color: "#9fe7ff" }, ...this.weaponUpgradeOptions()];
    for (const [i, o] of options.entries()) {
      this.drawRewardOption(o, 300 + i * 130, "boss-claim");
    }
    this.text("\u4EC5\u9886\u53D6\u4E00\u6B21 \xB7 \u5176\u4ED6\u6B66\u5668\u4E0E\u5DF2\u6709\u80FD\u529B\u4FDD\u7559", 360, 1135, 23, "#bdd8e7");
  }
  drawContractReward() {
    const w = this.world, reward = w.contractReward;
    if (!reward) return;
    this.rect(35, 120, 650, 1080, "#102330");
    const proof = w.contract?.proof ? buildProofs[w.contract.proof.kind] : void 0;
    this.text(proof ? `${proof.name} \xB7 \u68C0\u9A8C\u901A\u8FC7` : "\u5951\u7EA6\u5B8C\u6210 \xB7 \u9009\u62E9\u5F3A\u5316", 360, 190, 38, "#ffdc8a", "center", true);
    this.text(proof ? `${Math.min(w.contract.proofProgress, proof.goal)}/${proof.goal}${proof.unit} \xB7 \u4EFB\u9009\u4E00\u9879\uFF0C\u65E7\u80FD\u529B\u4FDD\u7559` : "\u4EFB\u9009\u4E00\u9879 \xB7 \u5176\u4ED6\u6B66\u5668\u4E0E\u80FD\u529B\u5168\u90E8\u4FDD\u7559", 360, 245, 24, "#bdd8e7");
    if (w.contract?.proof?.kind === "magnetic" && w.build.magneticAugment) this.text(`\u672C\u5C40\u8BA4\u8BC1\uFF1A${magneticAugments[w.build.magneticAugment].name} \xB7 \u53E6\u4E00\u7CBE\u7814\u53EF\u8DE8\u5C40\u5B8C\u6210`, 360, 278, 21, "#aee8ce");
    const total = w.growth.energy + reward.charge;
    const options = [
      { kind: "energy", title: `\u5145\u80FD +${reward.charge}`, detail: `\u5145\u80FD ${Math.floor(w.growth.energy)} \u2192 ${Math.floor(total % 100)} \xB7 \u7A81\u7834${Math.floor(total / 100)}\u6B21`, hint: "\u6EE1100\uFF1A\u672C\u5C40\u706B\u529B+10% \xB7 \u8D85\u8F7D6\u79D2", color: "#7fe4ff" },
      ...this.weaponUpgradeOptions()
    ];
    for (const [i, option] of options.entries()) {
      this.drawRewardOption(option, 300 + i * 130, "contract-claim");
    }
    this.text("\u5168\u5F39\u547D\u4E2D\u65F6\u7684\u76F4\u4F24 \xB7 \u4E0D\u542B\u8D85\u8F7D\u4E0E\u6D3E\u751F", 360, 1093, 21, "#9db8c8");
    this.text(reward.research ? "\u4EFB\u9009\u4E00\u9879\uFF0C\u989D\u5916\u7814\u53D1+1\u540C\u65F6\u9886\u53D6" : "\u6218\u6597\u5DF2\u6682\u505C \xB7 \u9009\u62E9\u540E\u7EE7\u7EED", 360, 1135, 24, "#bdd8e7");
  }
  drawContracts() {
    const w = this.world, current = w.contract?.round === w.round ? w.contract : void 0, proofs = w.availableProofs();
    const hunt = hunts[current?.kind === "hunter" ? current.hunt : this.huntChoice];
    const chosen = proofs.includes(this.proofChoice) ? this.proofChoice : proofs[0], proof = chosen ? buildProofs[chosen] : void 0;
    this.rect(35, 120, 650, 1080, "#102330");
    this.text("\u6311\u6218\u5951\u7EA6", 360, 180, 42, "#effaff", "center", true);
    this.text("\u6BCF\u8F6E\u524D40\u79D2\u53EF\u9009 \xB7 \u63A5\u53D6\u540E\u76EE\u6807\u9501\u5B9A", 360, 235, 24, "#bdd8e7");
    for (const [i, kind] of Object.keys(contracts).entries()) {
      const entry = contracts[kind], y = 285 + i * 160, can = w.canAcceptContract(kind, kind === "research" ? chosen : void 0);
      const needTier = kind === "hunter" && !w.activeWeapons.some((k) => w.weaponStage(k) >= 2);
      this.rect(65, y, 590, 148, can ? "#203e50" : "#172c3b");
      this.text(kind === "hunter" ? `${entry.name} \xB7 ${hunt.name}` : entry.name, 90, y + 26, 28, "#ffdc8a", "left", true);
      const proofDetail = chosen === "magnetic" ? `${w.build.magneticAugment === "field-wide" ? "\u5E7F\u57DF\u6269\u5708" : "\u5206\u6D41\u6865\u51FB"} \xB7 30\u79D2\u547D\u4E2D6\u6B21/2\u6279\u5F3A\u5316\u7CBE\u82F1` : proof ? `${proof.name} \xB7 ${proof.detail}` : "\u5148\u5F62\u6210\u7EC4\u5408\u6216\u9009\u62E9\u8DF3\u5F39\u5206\u652F";
      this.text(kind === "research" ? proofDetail : kind === "hunter" ? hunt.detail : entry.detail, 90, y + 62, 22, "#effaff", "left");
      this.text(`\u6210\u529F\uFF1A\u5145\u80FD+${entry.charge} \u6216\u5F3A\u5316\u5DF2\u6709\u914D\u4EF6${kind === "hunter" && hunt.research ? " \uFF0B\u7814\u53D11\u70B9" : ""}`, 90, y + 96, 21, "#bdd8e7", "left");
      this.text(can ? "\u63A5\u53D6\u5951\u7EA6\u3000\u203A" : needTier ? "\u9700\u8981\u4EFB\u4E00T2\u914D\u4EF6" : kind === "research" && !proof ? "\u5C1A\u65E0\u53EF\u68C0\u9A8C\u6784\u7B51" : "\u672C\u8F6E\u5DF2\u63A5\u53D6\u6216\u5F53\u524D\u4E0D\u53EF\u63A5\u53D6", 625, y + 127, 21, can ? "#80e4ff" : "#97adbd", "right");
      if (kind === "research") {
        if (can) this.buttons.push({ x: 65, y, w: 590, h: 148, label: `\u63A5\u53D6\u6784\u7B51\u68C0\u9A8C\uFF1A${proof.name}`, action: "contract:research" });
      } else if (can) this.buttons.push({ x: 65, y, w: 590, h: 148, label: kind === "hunter" ? `${entry.name}\uFF1A${hunt.name}` : entry.name, action: `contract:${kind}` });
    }
    const proofProgress = current?.proof ? ` ${buildProofs[current.proof.kind].name} ${Math.min(current.proofProgress, buildProofs[current.proof.kind].goal)}/${buildProofs[current.proof.kind].goal}${requiredProofGroups(current.proof.kind) ? " \xB7 \u6279\u6B21" + Math.min(current.proofGroupCount, requiredProofGroups(current.proof.kind)) + "/" + requiredProofGroups(current.proof.kind) : ""}` : "";
    if (!current) {
      this.rect(65, 935, 282, 82, "#214a4e");
      this.text("\u5207\u6362\u72E9\u730E\u76EE\u6807 \u21BB", 206, 976, 24, "#ffdc8a", "center", true);
      this.buttons.push({ x: 65, y: 935, w: 282, h: 82, label: "\u5207\u6362\u72E9\u730E\u76EE\u6807", action: "hunt-next" });
      if (proofs.length > 1) {
        this.rect(359, 935, 296, 82, "#214a4e");
        this.text("\u5207\u6362\u68C0\u9A8C\u76EE\u6807 \u21BB", 507, 976, 24, "#b9ffe1", "center", true);
        this.buttons.push({ x: 359, y: 935, w: 296, h: 82, label: "\u5207\u6362\u68C0\u9A8C\u76EE\u6807", action: "proof-next" });
      } else this.text("\u76EE\u6807\u5728\u63A5\u53D6\u540E\u9501\u5B9A", 507, 976, 21, "#bdd8e7");
    } else {
      this.text(current ? `${contracts[current.kind].name} \xB7 ${current.status === "active" ? "\u8FDB\u884C\u4E2D" + (current.kind === "hunter" ? ` ${current.targetKills}/2` : proofProgress) : current.status === "won" ? "\u5DF2\u5B8C\u6210" + proofProgress : "\u5931\u8D25\uFF1A" + current.reason}` : "\u6BCF\u8F6E\u524D40\u79D2\u53EF\u63A5\u53D6 \xB7 \u6784\u7B51\u68C0\u9A8C\u53EA\u8BA1\u63A5\u53D6\u540E\u89E6\u53D1", 360, 950, 22, "#ffdc8a");
      this.text(current?.kind === "hunter" ? hunts[current.hunt].detail : current?.kind === "research" ? "\u6700\u591A6\u7EC4\u9A8C\u8BC1\u654C\u9635 \xB7 \u6548\u679C\u8FBE\u6807\u7ACB\u5373\u9009\u5F3A\u5316" : "\u730E\u624B\u8FFD\u52A0\u7CBE\u82F1 \xB7 \u6784\u7B51\u68C0\u9A8C\u8FFD\u52A0\u5BF9\u5E94\u654C\u9635", 360, 992, 22, "#bdd8e7");
    }
    this.button(current?.status === "active" ? "\u7EE7\u7EED\u6311\u6218" : this.contractReturn === "paused" ? "\u8FD4\u56DE\u6682\u505C\u83DC\u5355" : "\u8FD4\u56DE\u5F53\u524D\u706B\u529B", 1080, current?.status === "active" ? "resume" : "contracts-back", true);
  }
  drawBuildTree() {
    this.rect(35, 90, 650, 1120, "#102330");
    this.text("\u672C\u5C40\u6280\u80FD\u6811", 360, 145, 40, "#effaff", "center", true);
    this.text(`\u6280\u80FD ${this.world.build.baseSpent}/9 \xB7 \u53EF\u7528${this.world.buildPoints - this.world.build.spent}\u70B9 \xB7 \u7CBE\u8C03${this.world.build.spent - this.world.build.baseSpent}\u6B21`, 360, 192, 24, "#bdd8e7");
    for (const [i, route] of routes.entries()) {
      const rank = this.world.build.ranks[route], top = 235 + i * 265;
      const color = ["#ffd28a", "#c6a1ff", "#7fe4ff"][i];
      this.text(`${["\u5F39\u9053", "\u96F7\u7535", "\u5149\u5B66"][i]}\u8DEF\u7EBF \xB7 \u7CBE\u8C03${this.world.build.refinements[route]}\u6B21${route === "ballistic" && this.world.build.fractureAugment ? " \xB7 " + fractureAugments[this.world.build.fractureAugment].name : ""}${route === "electric" && this.world.build.ionAugment ? " \xB7 " + ionAugments[this.world.build.ionAugment].name : route === "electric" && this.world.build.magneticAugment ? " \xB7 " + magneticAugments[this.world.build.magneticAugment].name : ""}${route === "optical" && this.world.build.photonAugment ? " \xB7 " + photonAugments[this.world.build.photonAugment].name : ""}`, 72, top, 27, color, "left", true);
      this.rect(85, top + 28, 2, 155, "#456478");
      for (const j of tree[route].keys()) {
        const node = this.world.build.node(route, j);
        const y = top + 42 + j * 68, owned = j < rank;
        const locked = route === "ballistic" && j === 2 && this.world.build.ranks.electric === 0;
        const status = owned ? "\u5DF2\u751F\u6548" : locked ? "\u9700\u5BFC\u7535\u7EBF\u5708" : j === rank ? "\u4E0B\u4E00\u8282\u70B9" : "\u524D\u7F6E\u672A\u5B8C\u6210";
        this.rect(77, y - 8, 18, 18, owned ? color : "#456478");
        this.text(node.name, 110, y, 26, owned ? color : "#e1edf5", "left", true);
        this.text(status, 645, y, 22, owned ? color : "#a5bac8", "right");
        this.text(node.detail, 110, y + 29, 21, "#bdd8e7", "left");
      }
    }
    this.text(this.world.build.ionAugment ? "\u79BB\u5B50\u7CBE\u7814\u5DF2\u751F\u6548 \xB7 \u539F\u653E\u7535\u4E0E\u5E38\u89C4\u7CBE\u8C03\u4FDD\u7559" : "\u79BB\u5B50\u7CBE\u7814\uFF1A\u96F7\u75353 + \u7CBE\u8C032 + T3\u7535\u5F27", 360, 1055, 23, "#bdd8e7");
    this.button(this.treeReturn === "choice" ? "\u8FD4\u56DE\u5347\u7EA7\u9009\u62E9" : "\u8FD4\u56DE\u5F53\u524D\u706B\u529B", 1100, "tree-back", true);
  }
  drawBuildBranch() {
    if (this.branchRoute === "ballistic" && this.world.canRefineFracture()) {
      this.drawFractureBranch();
      return;
    }
    if (this.branchRoute === "optical" && this.world.canRefinePhoton()) {
      this.drawPhotonBranch();
      return;
    }
    if (this.branchRoute === "electric") {
      if (this.world.canRefineMagnetic()) this.drawMagneticBranch();
      else if (this.world.canRefineIon()) this.drawIonBranch();
      else this.drawElectricBranch();
      return;
    }
    if (this.branchRoute === "ballistic") {
      this.drawBallisticBranch();
      return;
    }
    this.rect(35, 120, 650, 1080, "#102330");
    this.text("\u5149\u5B66\u6539\u9020 \xB7 \u4E8C\u9009\u4E00", 360, 190, 40, "#effaff", "center", true);
    this.text("\u90FD\u4FDD\u7559\u539F\u6FC0\u5149 \xB7 \u53D1\u5C04\u95F4\u9694\u7F29\u77ED25%", 360, 250, 25, "#bdd8e7");
    for (const [i, branch] of ["burn", "relay"].entries()) {
      const node = opticalBranches[branch], y = 315 + i * 290, color = branch === "burn" ? "#ffc187" : "#a3efff";
      this.rect(65, y, 590, 250, "#203e50");
      this.rect(65, y, 5, 250, color);
      this.text(node.name, 90, y + 42, 34, color, "left", true);
      this.text(node.role, 90, y + 88, 25, "#effaff", "left");
      this.text(branch === "burn" ? "\u4E3B\u675F\u9996\u654C\u8FFD\u52A03\u6B21\u707C\u70E7" : "\u4E3B\u675F\u4FDD\u7559 \xB7 \u989D\u5916\u7784\u51C6\u4E00\u540D\u4FA7\u7FFC\u654C\u4EBA", 90, y + 133, 24, "#d9e8f1", "left");
      this.text(branch === "burn" ? `\u6BCF${OPTICAL_FORK.burnInterval}\u79D2${OPTICAL_FORK.burnDamage * 100}%\u4F24\u5BB3 \xB7 \u4E0D\u53E0\u5C42` : `\u6A2A\u8DDD${OPTICAL_FORK.relayRange} \xB7 ${OPTICAL_FORK.relayDamage * 100}%\u4F24\u5BB3 \xB7 \u4E0D\u9012\u5F52`, 90, y + 175, 23, "#bdd8e7", "left");
      this.text("\u9009\u62E9\u6B64\u6539\u9020\u3000\u203A", 625, y + 219, 25, color, "right");
      this.buttons.push({ x: 65, y, w: 590, h: 250, action: `branch:${branch}`, label: node.name });
    }
    this.text("\u672C\u5C40\u9009\u5B9A\u4E0D\u53EF\u5207\u6362 \xB7 \u4E09\u9636\u68F1\u955C\u4E0E\u65E7\u6B66\u5668\u4FDD\u7559", 360, 965, 23, "#f0d19a");
    this.button("\u8FD4\u56DE\u5347\u7EA7\u9009\u62E9", 1050, "branch-back");
  }
  drawBallisticBranch() {
    this.rect(35, 120, 650, 1080, "#102330");
    this.text("\u5F39\u9053\u6539\u9020 \xB7 \u4E09\u9009\u4E00", 360, 190, 40, "#effaff", "center", true);
    this.text("\u90FD\u4FDD\u7559\u9730\u5C04\u603B\u4F24\u5BB3+30% \xB7 \u5F39\u6570\u4E0E\u6247\u89D2\u4E0D\u53D8", 360, 250, 24, "#bdd8e7");
    for (const [i, branch] of ["penetrator", "fragment", "ricochet"].entries()) {
      const node = ballisticBranches[branch], y = 300 + i * 215, color = branch === "penetrator" ? "#aee6ff" : branch === "ricochet" ? "#ffe3a4" : "#ffd092";
      this.rect(65, y, 590, 200, "#203e50");
      this.rect(65, y, 5, 200, color);
      this.text(node.name, 90, y + 35, 32, color, "left", true);
      this.text(node.role, 90, y + 68, 24, "#effaff", "left");
      this.text(branch === "penetrator" ? "\u6BCF\u9897\u9730\u5F39\u6700\u591A\u547D\u4E2D\u4E24\u654C\uFF0C\u76F4\u4F24\u4FDD\u7559" : branch === "ricochet" ? "\u6BCF\u9897\u547D\u4E2D\u540E\u8DF3\u5411280\u8303\u56F4\u5185\u4E00\u540D\u4FA7\u654C" : `\u547D\u4E2D\u654C\u4EBA\u540E\u8FFD\u52A0${BALLISTIC_FORK.radius}\u8303\u56F4\u90BB\u654C\u7206\u7834`, 90, y + 105, 23, "#d9e8f1", "left");
      this.text(branch === "penetrator" ? "\u7BB1\u5B50\u3001\u6570\u5B57\u95E8\u4E0E\u95ED\u5408\u62A4\u76FE\u4F1A\u622A\u65AD" : branch === "ricochet" ? "\u6A2A\u8DDD\u81F3\u5C1180 \xB7 55%\u4F24\u5BB3 \xB7 \u4E0D\u9012\u5F52/\u4E0D\u5145\u95E8" : `${BALLISTIC_FORK.splash * 100}%\u4F24\u5BB3 \xB7 \u4E0D\u5145\u95E8 \xB7 \u95ED\u76FE\u4E0D\u6269\u6563`, 90, y + 141, 22, "#bdd8e7", "left");
      this.text("\u9009\u62E9\u6B64\u6539\u9020\u3000\u203A", 625, y + 177, 24, color, "right");
      this.buttons.push({ x: 65, y, w: 590, h: 200, action: `branch:${branch}`, label: node.name });
    }
    this.text("\u672C\u5C40\u9009\u5B9A\u4E0D\u53EF\u5207\u6362 \xB7 \u96F7\u66B4\u7EC4\u5408\u4E0E\u65E7\u6B66\u5668\u4FDD\u7559", 360, 985, 23, "#f0d19a");
    this.button("\u8FD4\u56DE\u5347\u7EA7\u9009\u62E9", 1050, "branch-back");
  }
  drawFractureBranch() {
    this.rect(35, 120, 650, 1080, "#102330");
    this.text("\u88C2\u7532\u7CBE\u7814 \xB7 \u4E8C\u9009\u4E00", 360, 190, 40, "#effaff", "center", true);
    this.text("\u5F39\u9053\u7CBE\u8C03\u7167\u5E38\u589E\u4F24 \xB7 \u539F\u6B66\u5668\u4E0E\u7EC4\u5408\u4FDD\u7559", 360, 250, 23, "#bdd8e7");
    for (const [i, branch] of ["fracture-quick", "fracture-line"].entries()) {
      const node = fractureAugments[branch], y = 325 + i * 305, color = i ? "#ffb57f" : "#ffe0a3";
      this.rect(65, y, 590, 275, "#203e50");
      this.rect(65, y, 5, 275, color);
      this.text(node.name, 90, y + 38, 34, color, "left", true);
      this.text(node.role, 90, y + 82, 23, "#effaff", "left");
      this.text(node.detail, 90, y + 126, 23, "#d9e8f1", "left");
      this.text(i ? "\u5411\u4E0A320 \xB7 \u5BBD240 \xB7 \u6700\u591A2\u654C\u540475%" : "\u989D\u5916200%\u76F4\u4F24 \xB7 \u90BB\u654C75% / \u8303\u56F4120", 90, y + 166, 22, "#bdd8e7", "left");
      this.text(i ? "\u7BB1\u95E8/\u4FDD\u62A4\u963B\u65AD \xB7 \u95ED\u76FE\u51CF\u4F24\u540E\u963B\u65AD" : "\u6BCF\u76EE\u6807\u51B7\u53740.35\u79D2 \xB7 \u4E0D\u9012\u5F52\u5F15\u7206", 90, y + 207, 22, "#bdd8e7", "left");
      this.text("\u9009\u6B64\u7CBE\u7814\u3000\u203A", 625, y + 244, 25, color, "right");
      this.buttons.push({ x: 65, y, w: 590, h: 275, action: `branch:${branch}`, label: node.name });
    }
    this.text(`\u82B1\u8D391\u6280\u80FD\u70B9 \xB7 \u5F39\u9053\u7CFB\u6570+10% \xB7 \u672C\u5C40\u4E0D\u6539\u9009`, 360, 1e3, 22, "#f0d19a");
    this.button("\u8FD4\u56DE\u5347\u7EA7\u9009\u62E9", 1080, "branch-back");
  }
  drawIonBranch() {
    this.rect(35, 120, 650, 1080, "#102330");
    this.text("\u79BB\u5B50\u7CBE\u7814 \xB7 \u4E8C\u9009\u4E00", 360, 190, 40, "#effaff", "center", true);
    this.text("\u539F6\u51FB\u653E\u7535\u4FDD\u7559 \xB7 \u672C\u6B21\u7535\u5F27\u7CBE\u8C03\u4ECD\u589E\u4F24", 360, 250, 23, "#bdd8e7");
    for (const [i, branch] of ["ion-orb", "ion-spear"].entries()) {
      const node = ionAugments[branch], y = 325 + i * 305, color = i ? "#b8dcff" : "#b7fff0", preview = buildPreview(this.world, "electric", branch), power = 1 + permanentPower(this.world.growth) / 100;
      this.rect(65, y, 590, 275, "#203e50");
      this.rect(65, y, 5, 275, color);
      this.text(node.name, 90, y + 38, 34, color, "left", true);
      this.text(node.role, 90, y + 82, 21, "#effaff", "left");
      this.text(node.detail, 90, y + 126, 22, "#d9e8f1", "left");
      this.text(i ? "\u5BFB\u654C400 \xB7 \u5355\u77DB\u56DE\u51FB75% \xB7 \u7BB1\u95E8/\u95ED\u76FE\u963B\u6321" : "\u6301\u7EED1\u79D2 \xB7 \u5411\u524D\u6F02\u79FB260 \xB7 \u7BB1\u95E8/\u95ED\u76FE\u963B\u6321", 90, y + 166, 21, "#bdd8e7", "left");
      this.text(`\u7535\u5F27\u76F4\u51FB ${+(preview.before.damage[0] * power).toFixed(1)} \u2192 ${+(preview.after.damage[0] * power).toFixed(1)}`, 90, y + 207, 22, "#bdd8e7", "left");
      this.text("\u9009\u6B64\u7CBE\u7814\u3000\u203A", 625, y + 244, 25, color, "right");
      this.buttons.push({ x: 65, y, w: 590, h: 275, action: `branch:${branch}`, label: node.name });
    }
    this.text("\u82B1\u8D391\u6280\u80FD\u70B9 \xB7 \u672C\u5C40\u4E0D\u6539\u9009 \xB7 \u540E\u7EED\u4ECD\u53EF\u7CBE\u8C03", 360, 1e3, 22, "#f0d19a");
    this.button("\u8FD4\u56DE\u5347\u7EA7\u9009\u62E9", 1080, "branch-back");
  }
  drawPhotonBranch() {
    this.rect(35, 120, 650, 1080, "#102330");
    this.text("\u5149\u94FE\u7CBE\u7814 \xB7 \u4E8C\u9009\u4E00", 360, 190, 40, "#effaff", "center", true);
    this.text("\u5E38\u89C4\u7CBE\u8C03\u7167\u5E38\u589E\u4F24 \xB7 \u65E7\u6FC0\u5149\u3001\u5149\u94FE\u4E0E\u805A\u80FD\u4FDD\u7559", 360, 250, 23, "#bdd8e7");
    for (const [i, branch] of ["photon-reach", "photon-focus"].entries()) {
      const node = photonAugments[branch], y = 325 + i * 305, color = i ? "#e7b7ff" : "#9defff", preview = buildPreview(this.world, "optical", branch), power = 1 + permanentPower(this.world.growth) / 100;
      this.rect(65, y, 590, 275, "#203e50");
      this.rect(65, y, 5, 275, color);
      this.text(node.name, 90, y + 38, 34, color, "left", true);
      this.text(node.role, 90, y + 82, 23, "#effaff", "left");
      this.text(node.detail, 90, y + 126, 23, "#d9e8f1", "left");
      this.text(i ? "\u65E0\u90BB\u654C\u624D\u805A\u80FD \xB7 \u4E0D\u7ED5\u8FC7\u62A4\u76FE\u4E0E\u4FDD\u62A4" : "\u8DF3\u4F2480% / 64% / 51.2% \xB7 \u4E0D\u91CD\u590D\u547D\u4E2D", 90, y + 166, 22, "#bdd8e7", "left");
      this.text(`\u6FC0\u5149\u76F4\u4F24 ${+(preview.laserBefore.laserDamage * power).toFixed(1)} \u2192 ${+(preview.laserAfter.laserDamage * power).toFixed(1)}`, 90, y + 207, 22, "#bdd8e7", "left");
      this.text("\u9009\u6B64\u7CBE\u7814\u3000\u203A", 625, y + 244, 25, color, "right");
      this.buttons.push({ x: 65, y, w: 590, h: 275, action: `branch:${branch}`, label: node.name });
    }
    this.text("\u82B1\u8D391\u6280\u80FD\u70B9 \xB7 \u672C\u5C40\u4E0D\u6539\u9009 \xB7 \u540E\u7EED\u4ECD\u53EF\u7CBE\u8C03", 360, 1e3, 22, "#f0d19a");
    this.button("\u8FD4\u56DE\u5347\u7EA7\u9009\u62E9", 1080, "branch-back");
  }
  drawMagneticBranch() {
    this.rect(35, 120, 650, 1080, "#102330");
    this.text("\u78C1\u66B4\u7CBE\u7814 \xB7 \u4E8C\u9009\u4E00", 360, 190, 40, "#effaff", "center", true);
    this.text("\u7535\u5F27\u7CBE\u8C03\u7167\u5E38\u751F\u6548 \xB7 \u539F\u4E09\u62CD\u4E0E\u65E7\u6B66\u5668\u4FDD\u7559", 360, 250, 23, "#bdd8e7");
    for (const [i, branch] of ["field-wide", "field-link"].entries()) {
      const power = 1 + permanentPower(this.world.growth) / 100, node = magneticAugments[branch], y = 325 + i * 305, preview = buildPreview(this.world, "electric", branch), color = i ? "#b6dbff" : "#9df5e5";
      this.rect(65, y, 590, 275, "#203e50");
      this.rect(65, y, 5, 275, color);
      this.text(node.name, 90, y + 38, 34, color, "left", true);
      this.text(node.role, 90, y + 82, 23, "#effaff", "left");
      this.text(node.detail, 90, y + 126, 23, "#d9e8f1", "left");
      this.text(i ? "\u6BCF\u62CD\u573A\u5916\u4E00\u654C \xB7 \u4E0D\u9012\u5F52\u3001\u4E0D\u5145\u7BB1\u95E8" : "\u6BCF\u62CD35%\u219250% \xB7 \u573A\u5185\u538B\u5236\u4E0E\u8986\u76D6\u517C\u987E", 90, y + 166, 22, "#bdd8e7", "left");
      this.text(`\u7535\u5F27\u76F4\u51FB ${+(preview.before.damage[0] * power).toFixed(1)} \u2192 ${+(preview.after.damage[0] * power).toFixed(1)}`, 90, y + 207, 22, "#bdd8e7", "left");
      this.text("\u9009\u6B64\u7CBE\u7814\u3000\u203A", 625, y + 244, 25, color, "right");
      this.buttons.push({ x: 65, y, w: 590, h: 275, action: `branch:${branch}`, label: node.name });
    }
    this.text("\u82B1\u8D391\u6280\u80FD\u70B9 \xB7 \u672C\u5C40\u9009\u5B9A\u4E0D\u6539\u9009 \xB7 \u540E\u7EED\u4ECD\u53EF\u7CBE\u8C03", 360, 1e3, 22, "#f0d19a");
    this.button("\u8FD4\u56DE\u5347\u7EA7\u9009\u62E9", 1080, "branch-back");
  }
  drawElectricBranch() {
    this.rect(35, 120, 650, 1080, "#102330");
    this.text("\u96F7\u7535\u6539\u9020 \xB7 \u4E09\u9009\u4E00", 360, 190, 40, "#effaff", "center", true);
    this.text("\u539F\u7535\u5F27\u4FDD\u7559 \xB7 \u90FD\u5C06\u8DF3\u7535\u8303\u56F4\u63D0\u5347\u81F3220", 360, 250, 25, "#bdd8e7");
    for (const [i, branch] of ["spread", "capacitor", "seeker"].entries()) {
      const node = electricBranches[branch], y = 295 + i * 215, color = branch === "spread" ? "#adf3bf" : branch === "seeker" ? "#ffda92" : "#c7b1ff";
      this.rect(65, y, 590, 200, "#203e50");
      this.rect(65, y, 5, 200, color);
      this.text(node.name, 90, y + 32, 31, color, "left", true);
      this.text(node.role, 90, y + 68, 24, "#effaff", "left");
      this.text(branch === "spread" ? "\u6BCF\u53D1\u7535\u5F27\u989D\u5916\u591A\u8DF3\u4E00\u540D\u654C\u4EBA" : branch === "seeker" ? "\u9996\u8DF3340 \xB7 \u4F18\u5148\u84C4\u80FD\u5C04\u624B\uFF0C\u518D\u666E\u901A\u5C04\u624B" : "\u540C\u4E00\u654C\u4EBA\u7D2F\u8BA13\u6B21\u7535\u5F27\u76F4\u51FB\u540E\u653E\u7535", 90, y + 105, 23, "#d9e8f1", "left");
      this.text(branch === "spread" ? "\u4F24\u5BB3\u4E0E\u539F\u8DF3\u6570\u4FDD\u7559 \xB7 \u9002\u5408\u5BC6\u96C6\u7FA4\u654C" : branch === "seeker" ? "\u539F\u4F24\u5BB3\u4E0E\u8DF3\u6570\u4FDD\u7559 \xB7 \u540E\u7EED\u8DF3\u8DDD220" : `\u8FFD\u52A0${ELECTRIC_FORK.damage * 100}%\u76F4\u51FB\u4F24\u5BB3 \xB7 \u94FE\u7535\u4E0D\u79EF\u5C42`, 90, y + 141, 22, "#bdd8e7", "left");
      this.text("\u9009\u62E9\u6B64\u6539\u9020\u3000\u203A", 625, y + 177, 24, color, "right");
      this.buttons.push({ x: 65, y, w: 590, h: 200, action: `branch:${branch}`, label: node.name });
    }
    this.text("\u672C\u5C40\u9009\u5B9A\u4E0D\u53EF\u5207\u6362 \xB7 \u540E\u7EED\u98CE\u66B4\u4E0E\u65E7\u6B66\u5668\u4FDD\u7559", 360, 965, 23, "#f0d19a");
    this.button("\u8FD4\u56DE\u5347\u7EA7\u9009\u62E9", 1050, "branch-back");
  }
  drawBuildChoices() {
    this.buttons = [];
    this.rect(35, 150, 650, 1e3, "#102330");
    this.text((this.world.growth.mastery ?? 0) === 0 && this.world.researchPoints > 0 ? "\u88C5\u5907\u7814\u53D1 \xB7 \u9009\u62E9\u5347\u7EA7\u8DEF\u7EBF" : "\u6218\u5730\u6539\u9020 \xB7 \u9009\u62E9\u5347\u7EA7\u8DEF\u7EBF", 360, 220, 34, "#effaff", "center", true);
    this.text(`\u53EF\u7528${this.world.buildPoints - this.world.build.spent}\u70B9 \xB7 \u7814\u53D1${this.world.researchPoints} + \u5145\u80FD\u7A81\u7834${this.world.growth.mastery ?? 0}`, 360, 270, 24, "#b8d4e3");
    this.text("\u76F4\u4F24\u542B\u5E38\u9A7B\u706B\u529B \xB7 \u4E0D\u8BA1\u8D85\u8F7D\u3001\u547D\u4E2D\u7387\u4E0E\u6D3E\u751F", 360, 305, 20, "#bdd8e7");
    const available = this.world.build.available(this.world.buildPoints);
    for (const [i, route] of routes.entries()) {
      const rank = this.world.build.ranks[route], y = 330 + i * 235, node = route === "ballistic" && this.world.canRefineFracture() ? { name: "\u88C2\u7532\u7CBE\u7814 \xB7 \u4E8C\u9009\u4E00" } : route === "optical" && this.world.canRefinePhoton() ? { name: "\u5149\u94FE\u7CBE\u7814 \xB7 \u4E8C\u9009\u4E00" } : route === "electric" && this.world.canRefineMagnetic() ? { name: "\u78C1\u66B4\u7CBE\u7814 \xB7 \u4E8C\u9009\u4E00" } : route === "electric" && this.world.canRefineIon() ? { name: "\u79BB\u5B50\u7CBE\u7814 \xB7 \u4E8C\u9009\u4E00" } : this.world.build.next(route);
      const enabled = available.includes(route);
      const preview = buildPreview(this.world, route), color = ["#ffd28a", "#c6a1ff", "#7fe4ff"][i], goalHint = recipeRouteHint(this.world, this.save.recipeGoal, route);
      this.rect(65, y, 590, 205, enabled ? "#203e50" : "#15232e");
      this.rect(65, y, 4, 205, enabled ? color : "#435462");
      this.text(`${["\u5F39\u9053", "\u96F7\u7535", "\u5149\u5B66"][i]}\u8DEF\u7EBF \xB7 ${rank}/3 \xB7 \u7CBE\u8C03${this.world.build.refinements[route]}`, 90, y + 35, 26, color, "left");
      this.text(node?.name ?? "\u8DEF\u7EBF\u5DF2\u5B8C\u6210", 90, y + 83, 30, enabled ? "#effaff" : "#8396a2", "left", true);
      this.text(preview.gain, 90, y + 128, 23, enabled ? "#e1f7ff" : "#8396a2", "left");
      this.text(goalHint?.text ?? preview.plan, 90, y + 174, 21, enabled ? "#c4dca9" : "#8396a2", "left");
      if (goalHint?.advances) this.text("\u76EE\u6807\u6240\u9700", 625, y + 35, 20, "#ffe19a", "right", true);
      if (enabled) this.text("\u203A", 625, y + 80, 32, color, "right", true);
      if (enabled) this.buttons.push({ x: 65, y, w: 590, h: 205, action: `build:${route}`, label: node.name });
    }
    this.button("\u67E5\u770B\u5B8C\u6574\u6280\u80FD\u6811", 1050, "tree");
  }
  drawRunReport() {
    const w = this.world, r = runReport(w, this.runAchievements, this.save.achievements.unlocked, this.save.achievements.tracked);
    this.buttons = [];
    this.rect(0, 0, 720, 1280, "#050e18dd");
    this.rect(35, 90, 650, 1140, "#102330");
    this.text("\u672C\u5C40\u6218\u7EE9", 360, 145, 34, "#effaff", "center", true);
    this.text(w.score.toString(), 360, 218, 68, "#eff8ff", "center", true);
    this.text(`${this.runNewBest ? "\u5237\u65B0\u6700\u9AD8\u5206" : "\u6700\u9AD8\u5206"} ${this.save.best}`, 360, 276, 23, "#e8c88b");
    this.text(`\u5B58\u6D3B ${Math.floor(w.time / 60)}:${Math.floor(w.time % 60).toString().padStart(2, "0")} \xB7 \u7B2C${w.round}\u8F6E \xB7 \u706B\u529B\u53E0\u52A0${w.activeWeapons.length}\u79CD`, 360, 319, 23, "#bdd8e7");
    this.text(r.growth, 360, 344, 20, "#bdd8e7");
    for (let i = 0; i < 2; i++) this.text(r.weapons.slice(i * 3, i * 3 + 3).join(" / "), 360, 374 + i * 34, 23, "#c2edff");
    for (const [i, line2] of r.routes.entries()) this.text(line2, 78, 450 + i * 36, 23, ["#ffd28a", "#c6a1ff", "#7fe4ff"][i], "left");
    this.text(r.combat, 360, 577, 24, "#effaff");
    this.text(r.contracts, 360, 614, 23, "#bdd8e7");
    for (const [i, line2] of r.mechanics.entries()) this.text(line2, 360, r.mechanics.length > 2 ? 644 + i * 28 : 655 + i * 34, 22, "#cddfea");
    const goal = this.save.recipeGoal ? recipeStatus(w, this.save.recipeGoal) : null;
    const next = goal ? goal.ready ? `${goal.name}\u5DF2\u6210\u5F62 \xB7 \u4E0B\u5C40\u53EF\u6362\u76EE\u6807\u6216\u6311\u6218\u6784\u7B51\u68C0\u9A8C` : `\u7EE7\u7EED${goal.name}\uFF1A${goal.need}` : r.next;
    this.text(r.fresh, 360, 737, 23, "#ffdc8a");
    this.text("\u4E0B\u4E00\u5C40\u76EE\u6807", 360, 786, 24, "#aee7ff", "center", true);
    this.text(next, 360, 824, goal ? 20 : 22, "#d6e7f0");
    if (w.lastDamageCause) this.text({ bullet: "\u654C\u5F39\u51FB\u6BC1 \xB7 \u7559\u610F\u5DF2\u53D1\u5C04\u5B50\u5F39\u7684\u7A7A\u9699", enemy: "\u78B0\u649E\u654C\u673A \xB7 \u7559\u51FA\u6A2A\u5411\u907F\u8BA9\u7A7A\u95F4", crate: "\u649E\u4E0A\u7BB1\u4F53 \xB7 \u5148\u51FB\u788E\u518D\u62FE\u53D6" }[w.lastDamageCause], 360, 873, 22, "#edbc98");
    this.button("\u518D\u6B21\u7A81\u56F4\u3000\u203A", 920, "start", true);
    this.button("\u67E5\u770B\u6210\u5C31", 1020, "achievements");
    this.button("\u8FD4\u56DE\u4E3B\u754C\u9762", 1120, "home");
  }
  drawDialog() {
    if (this.mode === "result") {
      this.drawRunReport();
      return;
    }
    if (this.mode === "paused" && this.pausePreview) {
      this.buttons = [];
      const bannerY = this.world.phase === "boss" || this.world.phase === "boss-entry" ? 980 : 170;
      this.rect(80, bannerY, 560, 64, "#081a25ee");
      this.text("\u6218\u573A\u5DF2\u51BB\u7ED3 \xB7 \u770B\u6E05\u5371\u9669\u518D\u7EE7\u7EED", 360, bannerY + 32, 27, "#e3f4ff", "center", true);
      this.button("\u7EE7\u7EED\u6218\u6597", 1070, "resume", true);
      this.button("\u8FD4\u56DE\u6682\u505C\u83DC\u5355", 1170, "pause-menu");
      return;
    }
    this.rect(0, 0, 720, 1280, "#050e18cc");
    this.rect(70, 340, 580, this.mode === "settings" ? this.platform.openLicenses ? 800 : 710 : this.mode === "paused" ? 790 : 640, "#122331f5");
    this.buttons = [];
    if (this.mode === "paused") {
      this.text("\u6682\u505C", 360, 420, 48, "#eff8ff", "center", true);
      this.text(this.pauseReason || "\u51C6\u5907\u597D\u4E86\uFF0C\u518D\u7EE7\u7EED\u7A81\u56F4\u3002", 360, 490, 26, "#a9bfce");
      this.button("\u7EE7\u7EED\u6218\u6597", 560, "resume", true);
      this.button("\u8BBE\u7F6E", 670, "settings");
      this.button("\u8FD4\u56DE\u4E3B\u754C\u9762", 780, "home");
      this.button("\u67E5\u770B\u6218\u573A", 890, "preview");
      this.button("\u5F53\u524D\u706B\u529B\u4E0E\u53C2\u6570", 1e3, "loadout");
    } else if (this.mode === "settings") {
      const s = this.save.settings;
      this.text("\u8BBE\u7F6E", 360, 415, 48, "#eff8ff", "center", true);
      this.button(`\u7279\u6548\u3000${s.effects === "standard" ? "\u6807\u51C6" : "\u5F31\u5316"}`, 490, "effects");
      this.button(`\u5C4F\u5E55\u9707\u52A8\u3000${s.shake ? "\u5F00" : "\u5173"}`, 600, "shake");
      this.button(`\u97F3\u6548\u3000${s.sound ? "\u5F00" : "\u5173"}`, 710, "sound");
      this.button(`\u97F3\u4E50\u3000${s.music ? "\u5F00" : "\u5173"}`, 810, "music");
      if (this.platform.openLicenses) {
        this.button("\u5F00\u6E90\u8BB8\u53EF", 910, "licenses");
        this.button("\u8FD4\u56DE", 1010, "back", true);
      } else this.button("\u8FD4\u56DE", 920, "back", true);
    }
  }
  diagnostics() {
    return {
      drawCount: this.drawCount,
      callbackCount: this.callbackCount,
      mode: this.mode,
      time: this.world.time,
      roundTime: this.world.roundTime,
      phaseTime: this.world.phaseTime,
      round: this.world.round,
      phase: this.world.phase,
      buildRanks: { ...this.world.build.ranks },
      buildRefinements: { ...this.world.build.refinements },
      activeWeapons: this.world.activeWeapons,
      supportBeams: this.supportBeams.length,
      laserCharge: this.world.laserCharge(),
      lastLaserAt: Number.isFinite(this.opticalFiredAt) ? this.opticalFiredAt : null,
      opticalBand: laserVisualBand(this.world.growth.mastery, this.world.build.ranks.optical),
      laserBands: this.supportBeams.filter((b) => b.laser).map((b) => b.opticalBand ?? 1),
      opticalImpacts: this.impacts.filter((i) => i.opticalBand).length,
      weaponLevels: Object.fromEntries(this.world.activeWeapons.map((kind) => [kind, this.world.weaponStage(kind)])),
      weaponCalibrations: Object.fromEntries(this.world.activeWeapons.map((kind) => [kind, this.world.weaponCalibration(kind)])),
      calibrationBands: Object.fromEntries(this.world.activeWeapons.map((kind) => [kind, calibrationVisualBand(this.world.weaponCalibration(kind))])),
      calibratedShots: this.world.bullets.filter((b) => !b.hostile && b.calibrationBand).map((b) => ({ id: b.id, kind: b.weaponKind, band: b.calibrationBand })),
      contractStatus: this.world.contract?.status ?? null,
      contractRewardPending: !!this.world.contractReward,
      bossRewardRound: this.world.bossRewardRound,
      bossLootStats: { ...this.world.bossLootStats },
      battlePlan: this.world.battlePlan,
      battleBrief: battleBrief(this.world.round, this.world.battlePlan),
      nextBattlePlan: this.save.nextBattlePlan,
      openingWeapon: this.world.openingWeapon ?? null,
      savedOpeningWeapon: this.save.openingWeapon,
      openingSupplies: this.world.bodies.filter((b) => b.active && b.openingSupply).map((b) => ({ id: b.id, kind: b.kind, x: b.x, y: b.y, weapon: b.weaponKind, stage: b.stage })),
      score: this.world.score,
      hp: this.world.player.hp,
      growth: { ...this.world.growth },
      weaponKind: this.world.weaponKind,
      playerX: this.world.player.x,
      inputMode: this.inputMode,
      magneticProofTargets: this.world.bodies.filter((b) => b.active && b.proofTarget && b.proofRound === this.world.round).map((b) => ({ id: b.id, kind: b.kind, x: b.x, y: b.y, hp: b.hp, maxHp: b.maxHp, age: b.age, warning: b.warning, group: b.proofGroup, shots: b.proofShots ?? 0 })),
      magneticProofHits: this.world.magneticProofHits,
      magneticCertifications: [...this.world.magneticCertifications],
      savedMagneticCertifications: [...this.save.achievements.magneticCertifications],
      proofKind: this.world.contract?.proof?.kind ?? null,
      proofGroupCount: this.world.contract?.proofGroupCount ?? 0,
      proofProgress: this.world.contract?.proofProgress ?? 0,
      proofWins: this.world.proofWins,
      aceWins: this.world.aceWins,
      flawlessAceWins: this.world.flawlessAceWins,
      certifiedBuilds: [...this.world.certifiedBuilds],
      trackedAchievement: this.save.achievements.tracked,
      savedCertifications: [...this.save.achievements.certifiedBuilds],
      stormLinks: this.world.stormLinks,
      prismHits: this.world.prismHits,
      contractKind: this.world.contract?.kind ?? null,
      huntChoice: this.huntChoice,
      huntKind: this.world.contract?.kind === "hunter" ? this.world.contract.hunt : null,
      bountyShots: this.world.bountyShots,
      bountyEnemies: this.world.bodies.filter((b) => b.active && b.bountyRound !== void 0).map((b) => ({ id: b.id, x: b.x, y: b.y, hp: b.hp, maxHp: b.maxHp, warning: b.warning, shots: b.bountyShots ?? 0, pattern: b.pattern })),
      bountyKills: this.world.contract?.targetKills ?? 0,
      bountyTargets: this.world.bodies.filter((b) => b.active && b.bountyRound !== void 0 && b.bountyRound === this.world.contract?.round).length,
      bossCounterfire: this.world.bodies.some((b) => b.active && b.kind === "boss" && b.counterfire),
      bossCounterVolleys: this.world.bodies.find((b) => b.active && b.kind === "boss")?.counterVolleys ?? 0,
      bossFormation: this.world.bossFormation?.id ?? null,
      activeEscorts: this.world.activeEscorts.length,
      escortSpawns: this.world.escortSpawns,
      escortKills: this.world.escortKills,
      tacticalWins: this.world.tacticalWins,
      bossShield: this.world.bossShieldActive(),
      dropSpawns: this.world.dropSpawns,
      dropKills: this.world.dropKills,
      arcLinks: this.world.arcLinks,
      protectedDrops: this.world.bodies.filter((b) => b.active && (b.dropGrace ?? 0) > 0).length,
      fireControlShots: this.world.fireControlShots,
      fireControlBoostedShots: this.world.fireControlBoostedShots,
      lastFireControlBreak: this.world.lastFireControlBreak,
      fireControlUnits: this.world.bodies.filter((b) => b.active && b.pattern === "fire-control").map((b) => ({ id: b.id, kind: b.kind, x: b.x, y: b.y, hp: b.hp, maxHp: b.maxHp, age: b.age, warning: b.warning, group: b.controlGroup, source: fireControlSource(b, this.world.bodies)?.id, emp: b.empRemaining ?? 0, shots: b.controlShots ?? 0, boosted: b.controlBoostedShots ?? 0 })),
      relayScreen: this.world.bodies.filter((b) => b.active && b.pattern === "relay-screen").map((b) => ({ id: b.id, kind: b.kind, x: b.x, y: b.y, hp: b.hp, maxHp: b.maxHp, age: b.age, warning: b.warning, empRemaining: b.empRemaining ?? 0, shots: b.formationShots ?? 0 })),
      conduitBursts: this.world.conduitBursts,
      empTargets: this.world.empTargets,
      conduitTacticalWins: this.world.conduitTacticalWins,
      offlineEnemies: this.world.bodies.filter((b) => b.active && (b.empRemaining ?? 0) > 0).length,
      empWaves: this.empWaves.length,
      recipeGoal: this.save.recipeGoal ? recipeStatus(this.world, this.save.recipeGoal) : null,
      goalSupplies: this.world.bodies.filter((b) => recipeSupplyMatch(this.world, this.save.recipeGoal, b)).map((b) => ({ id: b.id, kind: b.kind, weapon: b.weaponKind, stage: b.stage, refit: !!b.refit })),
      mobileSentries: this.world.bodies.filter((b) => b.active && b.pattern === "relocate").map((b) => ({ x: b.x, y: b.y, lane: b.lane, age: b.age, warning: b.warning, volleys: b.sentryVolleys ?? 0, direction: sentryDirection(b) })),
      interceptorBreaks: this.world.interceptorBreaks,
      interceptors: this.world.bodies.filter((b) => b.active && b.pattern === "intercept").map((b) => ({ id: b.id, x: b.x, y: b.y, hp: b.hp, maxHp: b.maxHp, warning: b.warning, beat: b.burst, wingShots: b.interceptWingShots ?? 0, coreShots: b.interceptCoreShots ?? 0 })),
      refitsClaimed: this.world.refitsClaimed,
      enemyProjectileScale: enemyProjectileScale(this.world.round),
      framePulses: this.framePulses,
      renderedMode: this.renderedMode,
      imageCount: this.images.size,
      runNewBest: this.runNewBest,
      bossWins: this.world.bossWins,
      contractStats: { ...this.world.contractStats },
      runAchievements: [...this.runAchievements],
      researchPoints: this.world.researchPoints,
      buildPoints: this.world.buildPoints,
      unspentBuildPoints: this.world.buildPoints - this.world.build.spent,
      ballisticBranch: this.world.build.ballisticBranch ?? null,
      scatterRicochets: this.world.scatterRicochets,
      ricochetTraces: this.supportBeams.filter((b) => b.ricochet).length,
      scatterPierces: this.world.scatterPierces,
      scatterBursts: this.world.scatterBursts,
      scatterSplashHits: this.world.scatterSplashHits,
      weaponImpacts: this.impacts.filter((h) => !h.opticalBand).map((h) => ({ ...h })),
      upgradePulseRemaining: Math.max(0, this.upgradeUntil - this.world.time),
      equipmentReceipts: this.equipmentFeedback.pending.map((r) => ({ ...r })),
      equipmentReceipt: this.buildFeedback?.equipment ? { ...this.buildFeedback } : null,
      ionAugment: this.world.build.ionAugment ?? null,
      ionOrbSpawns: this.world.ionOrbSpawns,
      ionOrbHits: this.world.ionOrbHits,
      ionSpearShots: this.world.ionSpearShots,
      ionSpearHits: this.world.ionSpearHits,
      ionBonusDamage: this.world.ionBonusDamage,
      ionOrbs: this.world.ionOrbs,
      ionSpears: this.world.ionSpears,
      ionCharge: this.world.ionCharge,
      ionBursts: this.world.ionBursts,
      ionHits: this.world.ionHits,
      electricBranch: this.world.build.electricBranch ?? null,
      seekerLinks: this.world.seekerLinks,
      capacitorBursts: this.world.capacitorBursts,
      opticalBranch: this.world.build.opticalBranch ?? null,
      burnHits: this.world.burnHits,
      relayHits: this.world.relayHits,
      photonAugment: this.world.build.photonAugment ?? null,
      laserChainProfile: laserChainProfile(this.world.build.photonAugment),
      laserChainUnlocked: this.world.laserChainUnlocked(),
      laserChainReady: this.world.laserChainReady,
      laserArcHits: this.world.laserArcHits,
      laserFocusHits: this.world.laserFocusHits,
      laserArcBeams: this.arcs.filter((a) => a.photon && !a.focus).length,
      laserFocusBeams: this.arcs.filter((a) => a.focus).length,
      fractureAugment: this.world.build.fractureAugment ?? null,
      fractureProfile: this.world.fractureProfile(),
      fractureFinishWaves: this.world.fractureFinishWaves,
      fractureFinishHits: this.world.fractureFinishHits,
      fractureWaveDamage: this.world.fractureWaveDamage,
      lastFractureWaveHit: this.world.lastFractureWaveHit,
      fractureWaves: this.world.fractureWaves,
      fractureWaveHits: this.world.fractureWaveHits,
      fractureWaveBeams: this.supportBeams.filter((b) => b.fractureWave).length,
      fractureUnlocked: this.world.fractureUnlocked(),
      fractureBursts: this.world.fractureBursts,
      lastMagneticHit: this.world.lastMagneticHit,
      lastMagneticRefinementHit: this.world.lastMagneticRefinementHit,
      magneticWideHits: this.world.magneticWideHits,
      magneticAugment: this.world.build.magneticAugment ?? null,
      magneticLinkHits: this.world.magneticLinkHits,
      magneticUnlocked: this.world.magneticUnlocked(),
      magneticBursts: this.world.magneticBursts,
      magneticHits: this.world.magneticHits,
      magneticFields: this.world.magneticFields.map((f) => ({ ...f })),
      sweepers: this.world.bodies.filter((b) => b.active && b.pattern === "sweep").map((b) => ({ id: b.id, kind: b.kind, x: b.x, y: b.y, age: b.age, lane: b.lane, dropGrace: b.dropGrace, hp: b.hp, warning: b.warning, shots: b.sweeperShots ?? 0, direction: sweeperDirection(b) })),
      lockPreemptWins: this.world.lockPreemptWins,
      lockBaitWins: this.world.lockBaitWins,
      lockshotSpawns: this.world.lockshotSpawns,
      lockshotShots: this.world.lockshotShots,
      lockshotEnemies: this.world.bodies.filter((b) => b.active && b.pattern === "lockshot").map((b) => ({ id: b.id, x: b.x, y: b.y, age: b.age, hp: b.hp, lockedX: b.lockX, warning: b.warning, attempted: b.lockShots ?? 0, accepted: b.lockAcceptedShots ?? 0, passed: b.lockPassed ?? 0, damageAtAdmission: b.lockDamageStart, firedAt: b.lockFiredAt, emp: b.empRemaining ?? 0 })),
      hostileProjectiles: this.world.bullets.filter((b) => b.hostile).map((b) => ({ id: b.id, source: b.sourceId, x: b.x, y: b.y, vx: b.vx, vy: b.vy })),
      refitTarget: this.world.refitTarget ?? null,
      directedSupplies: this.world.bodies.filter((b) => b.active && b.directedRefit).map((b) => ({ id: b.id, kind: b.kind, weapon: b.weaponKind, row: b.row, x: b.x, y: b.y })),
      lastEquipmentPickup: this.world.lastEquipmentPickup,
      driftSupplies: this.world.bodies.filter((b) => b.active && b.pattern === "drift-supply").map((b) => ({ id: b.id, row: b.row, x: b.x, y: b.y, age: b.age, hp: b.hp, maxHp: b.maxHp, kind: b.weaponKind, refit: b.refit, settled: b.age >= DRIFT_SUPPLY.settle })),
      bodies: this.world.bodies.length,
      bullets: this.world.bullets.length,
      particles: this.particles.length,
      blasts: this.blasts.length,
      arcs: this.arcs.length,
      bossDestructionAge: this.destruction?.age ?? null,
      crateFragments: this.crateDebris.pieces.length,
      droneFragments: this.enemyWreck.pieces.filter((p) => p.kind === "drone").length,
      enemyFragments: this.enemyWreck.pieces.length,
      gateReceipts: this.gateFeedback.receipts.length,
      callbackWork: { ...this.callbackWork.snapshot(), maxMs: this.maxCallbackWorkMs },
      interruptedFrames: this.interruptedFrames.map((frame) => ({ ...frame })),
      ...this.frameTimes.snapshot()
    };
  }
};
export {
  CanvasRuntime,
  World
};
