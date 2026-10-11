/** Offline selectable legal text; the game remains in its existing settings state. */
export function createLicenseViewer(text: string, beforeOpen: () => void) {
  const style = document.createElement('style');
  style.textContent = `
    .game-licenses { box-sizing:border-box; width:min(100vw,960px); max-width:100vw;
      height:min(100dvh,900px); max-height:100dvh; margin:auto; padding:0; border:1px solid #47667a;
      color:#d8eaf5; background:#122331; font-family:system-ui,sans-serif; overflow:hidden; }
    .game-licenses:not([open]) { display:none; }
    .game-licenses[open] { position:fixed; inset:0; display:flex; flex-direction:column; }
    .game-licenses::backdrop { background:#050e18e8; }
    .game-licenses header { padding:max(20px,var(--safe-area-inset-top,env(safe-area-inset-top,0px))) max(20px,var(--safe-area-inset-right,env(safe-area-inset-right,0px))) 12px max(20px,var(--safe-area-inset-left,env(safe-area-inset-left,0px))); flex:none; }
    .game-licenses h1 { font-size:24px; margin:0 0 8px; }
    .game-licenses p { margin:0; font-size:14px; line-height:1.6; color:#a9bfce; }
    .game-licenses pre { margin:0; padding:16px 20px; overflow:auto; overscroll-behavior:contain;
      min-height:0; flex:1; white-space:pre-wrap; overflow-wrap:anywhere; font:14px/1.65 ui-monospace,monospace;
      background:#0a1823; -webkit-user-select:text; user-select:text; touch-action:pan-y; }
    .game-licenses pre { scrollbar-color:#47667a #0a1823; scrollbar-width:thin; }
    .game-licenses pre::-webkit-scrollbar { width:8px; }
    .game-licenses pre::-webkit-scrollbar-track { background:#0a1823; }
    .game-licenses pre::-webkit-scrollbar-thumb { background:#47667a; border-radius:4px; }
    .game-licenses footer { flex:none; padding:12px 20px max(12px,var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))); }
    .game-licenses button { width:100%; min-height:48px; font:600 16px system-ui,sans-serif;
      border:1px solid #a1e7ff; border-radius:4px; background:#77d6f6; color:#0a1823; touch-action:manipulation; cursor:pointer; }
    .game-licenses :focus-visible { outline:3px solid #f5cc7a; outline-offset:-3px; }
    @supports not (height:100dvh) { .game-licenses { height:100vh; max-height:100vh; } }
  `;
  document.head.append(style);
  const dialog = document.createElement('dialog'); dialog.className = 'game-licenses';
  dialog.setAttribute('aria-labelledby', 'game-licenses-title');
  dialog.setAttribute('aria-describedby', 'game-licenses-description');
  const header = document.createElement('header');
  const title = document.createElement('h1'); title.id = 'game-licenses-title'; title.textContent = '开源许可';
  const description = document.createElement('p'); description.id = 'game-licenses-description'; description.textContent = '以下为相关开源组件及许可原文，可滚动查看。';
  header.append(title, description);
  const body = document.createElement('pre'); body.tabIndex = 0; body.setAttribute('aria-label', '开源组件和许可原文'); body.textContent = text;
  const footer = document.createElement('footer'); const button = document.createElement('button'); button.type = 'button'; button.textContent = '返回设置'; footer.append(button);
  dialog.append(header, body, footer); document.body.append(dialog);
  let previousFocus: HTMLElement | null = null;
  const close = () => {
    if (!dialog.hasAttribute('open')) return false;
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    previousFocus?.focus({ preventScroll: true });
    return true;
  };
  button.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    // Also contain focus in WebViews that need the open-attribute fallback.
    if (event.key === 'Tab') {
      event.preventDefault();
      if (document.activeElement === body) button.focus(); else body.focus();
    }
  });
  return {
    open() {
      if (dialog.hasAttribute('open')) return;
      beforeOpen(); previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else { dialog.setAttribute('open', ''); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); }
      body.scrollTop = 0; button.focus({ preventScroll: true });
    },
    close,
  };
}
