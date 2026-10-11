/** Relative segment vs expanded AABB. Returns normalized time of first contact. */
export function sweep(
  ax: number, ay: number, bx: number, by: number,
  tx0: number, ty0: number, tx1: number, ty1: number, rx: number, ry: number,
): number | null {
  const x = ax - tx0, y = ay - ty0;
  const dx = bx - ax - (tx1 - tx0), dy = by - ay - (ty1 - ty0);
  let entry = 0, exit = 1;
  for (const [p, d, r] of [[x, dx, rx], [y, dy, ry]]) {
    if (Math.abs(d) < 1e-10) { if (Math.abs(p) > r) return null; }
    else {
      const a = (-r - p) / d, b = (r - p) / d;
      entry = Math.max(entry, Math.min(a, b)); exit = Math.min(exit, Math.max(a, b));
      if (entry > exit) return null;
    }
  }
  return entry >= 0 && entry <= 1 ? entry : null;
}
