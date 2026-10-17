import {it,expect} from 'vitest';import{timeline}from'../src/core/director';import{vanguardPatrol,introPursuit}from'../src/core/vanguard-patrol';import{World}from'../src/core/world';import{C}from'../src/core/config';import{enemyHealthScale}from'../src/core/difficulty';import{dangerTimeline}from'../src/core/reachability';
const path='../build/qa/Stage-239/baseline.mjs',old=await import(path);
it('changes only the first patrol plus the explicit6 introductory pursuers across108 schedules',()=>{
 for(let r=1;r<=12;r++)for(const seed of[1,29,1337])for(const plan of[0,1,2]as const){const a=timeline(r,seed,plan),b=old.timeline(r,seed,plan);const extra=new Set((r===1?introPursuit():[]).map(s=>JSON.stringify(s)));expect(a.filter(s=>s.at>=6.5&&!extra.has(JSON.stringify(s)))).toEqual(b.filter((s:any)=>s.at>=6.5));expect(a.length).toBe(b.length+2+(r===1?6:0));expect(a.filter(s=>s.at<6.5)).toHaveLength(b.filter((s:any)=>s.at<6.5).length+2);}
});
it.each([1,2,3,4,5,6])('keeps mirrored lanes/targets, original basic HP and fixed deployment grace in chapter%s',r=>{
 const a=vanguardPatrol(r,false),b=vanguardPatrol(r,true);expect(b).toEqual(a.map(s=>({...s,x:720-s.x,lane:s.lane===undefined?undefined:720-s.lane})));expect(a.every(s=>s.drop&&s.dropY!>=330&&s.dropY!<=460)).toBe(true);expect(a.filter(s=>s.dropLabel)).toHaveLength(1);
 const w=new World(1337,r);Object.assign(w,{scheduled:a});(w as any).shoot=()=>{};for(let f=0;f<63;f++)w.step(C.step,68);const body=w.bodies.find(b=>b.active)!;expect(body.y).toBeGreaterThan(0);expect(body.dropGrace).toBeGreaterThan(0);expect(body.maxHp).toBe(C.enemies[body.kind as keyof typeof C.enemies].hp*enemyHealthScale(body.kind as keyof typeof C.enemies,r));
});
it('offers genuinely different opening target priorities rather than recolored rosters',()=>{
 const a=vanguardPatrol(1,false),b=vanguardPatrol(2,false),c=vanguardPatrol(3,false);expect(a.every(s=>s.kind==='drone')).toBe(true);expect(b.filter(s=>s.kind==='charger').map(s=>s.lane)).toEqual([440,480]);expect(c[0]).toMatchObject({kind:'armor',pattern:'fan',opening:.35});expect(c.slice(1,3).every(s=>s.dropY!>c[0].dropY!)).toBe(true);
});
it('fires a visible ordinary fan after observation time and forecasts actual bullets without mutating state',()=>{
 const w=new World(1337,3);Object.assign(w,{scheduled:vanguardPatrol(3,false)});(w as any).shoot=()=>{};w.player.x=w.player.px=68;let first=0;for(let f=0;f<170;f++){w.step(C.step,68);if(w.bullets.some(b=>b.hostile)&&!first)first=w.time;w.drainEffects();}expect(first).toBeGreaterThan(1.8);expect(first).toBeLessThan(2.2);const bullets=w.bullets.filter(b=>b.hostile);expect(bullets).toHaveLength(3);expect(bullets.map(b=>b.vx)).toEqual([-100,0,100].map(v=>v*w.bodies.find(b=>b.kind==='armor')!.shotScale!));const before=JSON.stringify(w);expect(dangerTimeline(w.bodies,w.bullets,2).some(row=>row.length)).toBe(true);expect(JSON.stringify(w)).toBe(before);
});

it('keeps introductory pursuers in two opposite fixed groups, leaving reward slots and escape edges intact',()=>{const a=introPursuit();expect(a).toHaveLength(6);expect(a.every(s=>s.kind==='drone'&&s.drop&&s.x>=200&&s.x<=520)).toBe(true);expect(a.slice(0,3).every(s=>s.at>=57.5&&s.at<58)).toBe(true);expect(a.slice(3).every(s=>s.at>=59.5&&s.at<60)).toBe(true);expect(a.filter(s=>s.dropLabel)).toHaveLength(1);});
