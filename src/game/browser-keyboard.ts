interface KeyboardGame {
  keyDown(code: string): boolean;
  keyUp(code: string): boolean;
}

/** Native input only; shortcuts, editing and composition keep their browser behavior. */
export function bindBrowserKeyboard(target: Window, game: KeyboardGame, unlock: () => void) {
  const down = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.repeat || e.isComposing || e.ctrlKey || e.altKey || e.metaKey
      || (e.target as Element | null)?.closest?.('input,textarea,select,[contenteditable]')) return;
    if (game.keyDown(e.code)) { e.preventDefault(); unlock(); }
  };
  const up = (e: KeyboardEvent) => { if (game.keyUp(e.code)) e.preventDefault(); };
  target.addEventListener('keydown', down);
  target.addEventListener('keyup', up);
  return () => { target.removeEventListener('keydown', down); target.removeEventListener('keyup', up); };
}
