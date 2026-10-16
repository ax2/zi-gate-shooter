/** Authored heavy-chapter encounter; independent of player damage or choices. */
export const BATTERY={at:44.5,delay:1.1,relayDelay:1.1,y:420,relayY:560,hold:4,opening:.1,secondOpening:.5,durability:3} as const;
export const batteryHolding=(b:{kind:string;pattern?:string;age:number})=>b.kind==='armor'&&b.pattern==='battery'&&b.age<BATTERY.hold;
