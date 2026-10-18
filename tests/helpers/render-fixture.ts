import { CanvasRuntime } from '../../src/game/canvas-runtime';
import { defaults,type Save } from '../../src/ui/storage';
export function createRenderFixture(weak = false, contextProbe?:()=>{hidden?:boolean;focused?:boolean},captureWrite?:(save:Save)=>void,Runtime=CanvasRuntime) {
  let clock = 0, next: FrameRequestCallback = () => {};
  const calls: Array<{ kind: string; args: any[]; alpha: number; color: unknown; stroke?: unknown; composite: string; font?: string; lineWidth?:number }> = [];
  const state: Record<string, any> = { globalAlpha: 1, globalCompositeOperation: 'source-over' };
  const stack: Record<string, any>[] = [];
  const context = new Proxy(state, { get(target, key: string) {
    if (key in target) return target[key];
    if (key === 'measureText') return (text:string) => ({width:[...text].reduce((n,ch)=>n+(ch.charCodeAt(0)>255?1:.55),0)*(Number(/(\d+)px/.exec(state.font??'24px')?.[1])||24)});
    if (key === 'save') return () => stack.push({ ...state });
    if (key === 'restore') return () => Object.assign(state, stack.pop());
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => ({addColorStop(){}});
    return (...args: any[]) => {
      // A real full-canvas clear retires the previous screen. Control actions
      // can render between ticks; never count old menu text as still visible.
      if((key==='clearRect'||key==='fillRect'&&state.fillStyle==='#0a1119')&&args[0]===0&&args[1]===0&&args[2]===720&&args[3]===1280)calls.length=0;
      calls.push({ kind: key, args, alpha: state.globalAlpha, color: state.fillStyle, stroke:state.strokeStyle, composite: state.globalCompositeOperation, font: state.font,lineWidth:state.lineWidth });
    };
  } });
  const save = defaults(); save.settings.effects = weak ? 'weak' : 'standard';
  const runtime = new Runtime({ canvas: { getContext: () => context } as unknown as HTMLCanvasElement,
    width: 720, height: 1280, dpr: 1, menuBottom: 0,
    image: async src => ({ src, width: (src.includes('scatter-player') || src.includes('pierce-player')) ? 576 : 768, height: (src.includes('scatter-player') || src.includes('pierce-player')) || src.includes('drone-v1') || src.includes('charger-v1') || src.includes('armor-v1') || src.includes('elite-v1') || src.includes('boss-v1') || src.includes('boss-flanker-v1') || src.includes('boss-bastion-v1') ? 256 : src.includes('explosion') || src.includes('crate-v1') ? 768 : 512 }) as HTMLImageElement,
    read: () => save, write(value) {captureWrite?.(value);}, sound() {}, silence() {}, frameContext:contextProbe,now: () => clock,
    requestFrame: callback => { next = callback; } });
  return { runtime, calls, tick(ms = 1000 / 60) { calls.length = 0; clock += ms; next(clock); } };
}

