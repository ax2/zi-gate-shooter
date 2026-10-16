import type {Body} from './world';
export const REBOUND={lead:.35,firstWarning:.7,firstDash:.65,turnWarning:.65,approach:100,turnSpeed:80,dashSpeed:380,lateralSpeed:260} as const;
export function reboundState(b:Pick<Body,'age'|'x'|'lane'|'reboundOrigin'>){
 const firstAt=REBOUND.lead+REBOUND.firstWarning,turnAt=firstAt+REBOUND.firstDash,returnAt=turnAt+REBOUND.turnWarning;
 const phase=b.age<REBOUND.lead-1e-9?'approach':b.age<firstAt-1e-9?'charge':b.age<turnAt-1e-9?'inward':b.age<returnAt-1e-9?'turn':'return';
 const dashing=phase==='inward'||phase==='return',origin=b.reboundOrigin??b.x;
 return {phase,dashing,warning:phase==='charge'?firstAt-b.age:phase==='turn'?returnAt-b.age:0,
  speed:dashing?REBOUND.dashSpeed:phase==='turn'?REBOUND.turnSpeed:REBOUND.approach,
  destination:phase==='return'?origin:b.lane,direction:Math.sign(b.lane-origin)*(phase==='turn'||phase==='return'?-1:1)};
}
