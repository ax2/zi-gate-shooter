/** Read-only presentation phase. Body age is authoritative, so pause freezes it.
 * Wing articulation is in the art, not a whole-body transform. */
export function droneFrame(age: number): number {
  if (!Number.isFinite(age) || age < 0) return 1;
  return [1, 2, 1, 0][Math.floor(age * 8) % 4];
}
