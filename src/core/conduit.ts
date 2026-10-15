export const CONDUIT={radius:300,duration:1.5,hoverY:560,holdSeconds:3.5} as const;
export const canDisrupt=(kind:string)=>kind==='guard'||kind==='sniper'||kind==='armor'||kind==='elite';
