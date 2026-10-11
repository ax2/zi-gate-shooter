const left = new Set(['KeyA', 'ArrowLeft']);
const right = new Set(['KeyD', 'ArrowRight']);

/** Physical aliases are independent: releasing A must not release Left. */
export class HorizontalKeys {
  private held = new Set<string>();
  press(code: string) {
    if (!left.has(code) && !right.has(code)) return false;
    this.held.add(code); return true;
  }
  release(code: string) { return this.held.delete(code); }
  clear() { this.held.clear(); }
  get active() { return this.held.size > 0; }
  get direction() {
    return Number([...this.held].some(code => right.has(code))) - Number([...this.held].some(code => left.has(code)));
  }
}
