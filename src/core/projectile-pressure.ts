/** Round-authored pressure, capped independently of all player growth. */
export function enemyProjectileScale(round:number){return 1+Math.min(3,Math.max(0,Math.floor(round)-1))*.1;}
