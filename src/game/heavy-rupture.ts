/** Cosmetic reactor rupture. Absolute simulation time keeps pause and redraw deterministic. */
export class HeavyRuptures {
  readonly items: Array<{x:number;y:number;started:number;size:number}> = [];
  sync(now:number,weak:boolean){for(let i=this.items.length-1;i>=0;i--)if(now-this.items[i].started>=.64)this.items.splice(i,1);while(this.items.length>(weak?1:2))this.items.shift();}
  burst(kind:unknown,x:number,y:number,now:number,weak:boolean){this.sync(now,weak);if(!['armor','guard','elite'].includes(String(kind))||this.items.length>=(weak?1:2))return false;this.items.push({x,y,started:now,size:kind==='elite'?218:kind==='guard'?190:174});return true;}
  clear(){this.items.length=0;}
}
