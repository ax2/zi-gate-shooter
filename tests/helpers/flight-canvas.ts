/** Headless text/command sink, not pixels or an FPS test. Keep stable methods:
 * allocating a fresh function for every Canvas property read distorts long runs. */
export function flightCanvas(texts:string[]){
 const noop=()=>{},gradient={addColorStop:noop};
 const methods:Record<string,unknown>={fillText:(value:unknown)=>texts.push(String(value)),createLinearGradient:()=>gradient};
 return new Proxy({globalAlpha:1}as Record<PropertyKey,unknown>,{get(target,key){return key in target?target[key]:methods[String(key)]??noop;}})as unknown as CanvasRenderingContext2D;
}
