/** Fixed late heavy-chapter module, independent of all player stats. */
export const CONTROL_SHUTTER={round:9,closedScale:.2,openSeconds:.9} as const;
export const hasControlShutter=(round:number)=>round>=CONTROL_SHUTTER.round&&round%3===0;
export interface ShutterState {controlShutter?:boolean;controlLinked?:boolean;controlOpenUntil?:number;age?:number;empRemaining?:number}
export const shutterClosed=(b:ShutterState)=>!!b.controlShutter&&!!b.controlLinked&&!(b.empRemaining??0)&&(b.age??0)>=(b.controlOpenUntil??0);
