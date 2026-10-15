import type {WeaponKind} from '../core/weapons';
/** Fixed physical sockets. They do not change shot origin or collision radius. */
export const mountedRig:Record<WeaponKind,{frame:number;x:number;y:number;size:number}>={
 pulse:{frame:0,x:-70,y:-20,size:66},
 scatter:{frame:1,x:70,y:-20,size:72},
 pierce:{frame:2,x:-48,y:-85,size:76},
 blast:{frame:3,x:48,y:-85,size:72},
 arc:{frame:4,x:0,y:-92,size:92},
};
