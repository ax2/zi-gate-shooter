/** Fixed side-chapter formation. No player-dependent durability or aiming. */
export const RELAY_SCREEN={at:44.5,guardY:480,sniperY:320,conduitY:560,hold:4.5,guardOpening:.1,sniperOpening:.25,durability:4,relayDelay:1.2} as const;
export const hasRelayScreen=(round:number)=>round>=5&&(round-1)%3===1;
