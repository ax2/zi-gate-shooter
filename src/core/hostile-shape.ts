import{C}from'./config';import{MINELAYER}from'./minelayer';
/** Same physical footprint for live contacts and the conservative route model. */
const standard={x:C.playerRadius+7,y:C.playerRadius+11}as const,mine={x:C.playerRadius+MINELAYER.radius,y:C.playerRadius+MINELAYER.radius}as const;
export function hostileContactShape(b:{mine?:boolean}){return b.mine?mine:standard;}
