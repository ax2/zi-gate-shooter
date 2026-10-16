import type {Body} from './world';
export const INTERCEPTOR={opening:.15,wingWarning:.75,coreWarning:.65,between:.25,recovery:1.8,wingOffset:52,wingVx:90,wingVy:320,coreVy:360,coreSpacing:.15} as const;
export function interceptorMuzzles(b:Pick<Body,'x'|'y'|'height'|'burst'>){
 const y=b.y+b.height/2;
 return b.burst?[{x:b.x,y}]:[-1,1].map(side=>({x:b.x+side*INTERCEPTOR.wingOffset,y}));
}
