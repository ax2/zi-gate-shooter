import type { CanvasControl } from './canvas-runtime';

/** Transparent native hit targets preserve the artwork and expose ordinary buttons. */
export function createBrowserControls(canvas: HTMLCanvasElement, activate: (action:string)=>void) {
  const layer = document.createElement('div');
  layer.setAttribute('aria-label', '游戏操作');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none';
  const style = document.createElement('style');
  style.textContent = '.gate-control:focus-visible{outline:3px solid #fff;outline-offset:2px;box-shadow:0 0 0 5px #147dbb}';
  document.head.append(style); document.body.append(layer);
  const buttons = new Map<string, HTMLButtonElement>();
  return {
    update(controls:readonly CanvasControl[], placement:{scale:number;offsetX:number;offsetY:number}) {
      layer.inert = !!document.querySelector('dialog[open]');
      const active = new Set(controls.map(control => control.action));
      for (const [action, button] of buttons) if (!active.has(action)) { button.remove(); buttons.delete(action); }
      const rect = canvas.getBoundingClientRect();
      for (const [index, control] of controls.entries()) {
        let button = buttons.get(control.action);
        if (!button) {
          button = document.createElement('button'); button.type = 'button'; button.className = 'gate-control';
          button.style.cssText = 'position:absolute;margin:0;padding:0;border:0;background:transparent;color:transparent;pointer-events:auto;touch-action:manipulation;cursor:pointer;font-size:1px';
          button.addEventListener('click', () => activate(control.action));
          layer.append(button); buttons.set(control.action, button);
        }
        if (layer.children[index] !== button) layer.insertBefore(button, layer.children[index] ?? null);
        if (button.textContent !== control.label) button.textContent = control.label;
        const values = {
          left: `${rect.left + placement.offsetX + control.x * placement.scale}px`,
          top: `${rect.top + placement.offsetY + control.y * placement.scale}px`,
          width: `${control.w * placement.scale}px`, height: `${control.h * placement.scale}px`,
        };
        for (const key of ['left','top','width','height'] as const) if (button.style[key] !== values[key]) button.style[key] = values[key];
      }
    },
  };
}
