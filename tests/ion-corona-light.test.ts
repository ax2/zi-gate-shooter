import {it,expect} from 'vitest';
import {ionStormLight} from '../src/game/ion-storm-light';
it.each([false,true])('ion strike returns the centre to the machine while side conductors retain colored current (weak=%s)',weak=>{
 for(const age of [0,.08,.16,.3,.7,.999]){
  let state:Record<string,unknown>={globalAlpha:.4,globalCompositeOperation:'source-over'},points:number[][]=[],stack:Record<string,unknown>[]=[],strokes:{points:number[][];color:unknown;mode:unknown;alpha:unknown}[]=[];
  const c=new Proxy({}, {get(_t,k){if(k in state)return state[String(k)];return (...args:number[])=>{for(const n of args)expect(Number.isFinite(n)).toBe(true);if(k==='save')stack.push({...state});if(k==='restore')state=stack.pop()!;if(k==='beginPath')points=[];if(k==='moveTo'||k==='lineTo')points.push([...args]);if(k==='stroke')strokes.push({points:points.map(p=>[...p]),color:state.strokeStyle,mode:state.globalCompositeOperation,alpha:state.globalAlpha});};},set(_t,k,v){state[String(k)]=v;return true;}}) as CanvasRenderingContext2D;
  ionStormLight(c,360,500,140,age,weak);
  expect(stack).toHaveLength(0);expect(state).toEqual({globalAlpha:.4,globalCompositeOperation:'source-over'});
  const cores=strokes.filter(s=>s.color==='#f0fffa');expect(cores.length).toBe(age<.16?1:0);
  const sides=strokes.filter(s=>s.mode==='source-over'&&s.points.length===4);expect(sides.length).toBe(age>0?4:0);
  if(age>=.16)for(const s of sides){expect(s.points).toHaveLength(4);const sign=Math.sign(s.points[0][0]);expect(s.points.every(p=>Math.sign(p[0])===sign&&Math.abs(p[0])>=140*(.25+.75*age)*.45)).toBe(true);}
  expect(strokes.some(s=>s.mode==='source-over'&&s.color==='#7dffd9'&&s.points.length===11)).toBe(true);
  expect(strokes.filter(s=>s.mode==='lighter').every(s=>s.color==='#f0fffa')).toBe(true);
 }
});
