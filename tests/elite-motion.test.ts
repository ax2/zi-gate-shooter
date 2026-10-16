import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {advanceBody, fanWarningVelocities} from '../src/core/behavior';
import {C} from '../src/core/config';
import {eliteFrame} from '../src/game/elite-motion';

it('fan elite advertises both beats and retains the narrow warning until the delayed volley', () => {
 const b=new World().spawn('elite',360,100);b.pattern='fan';b.timer=0;
 const shots:{time:number;vx:number}[]=[];
 const step=()=>advanceBody(b,C.step,'running',0,(_x,_y,vx=0)=>shots.push({time:b.age,vx}));
 step();expect(fanWarningVelocities(b)).toEqual([-100,-50,0,50,100]);
 for(let i=0;i<36;i++)step();
 expect(shots.map(s=>s.vx)).toEqual([-100,0,100]);expect(b.burst).toBe(1);
 expect(fanWarningVelocities(b)).toEqual([-50,0,50]);expect(b.warning).toBeGreaterThan(0);
 for(let i=0;i<36;i++)step();
 expect(shots.map(s=>s.vx)).toEqual([-100,0,100,-50,0,50]);
 expect(shots[3].time-shots[0].time).toBeCloseTo(.6);
 expect(b.burst).toBe(0);expect(b.warning).toBe(0);
});

it('cancels the queued second volley after passing the firing boundary', () => {
 const b=new World().spawn('elite',360,590);b.pattern='fan';b.burst=1;b.warning=.6;b.timer=.6;
 let shots=0;
 for(let i=0;i<60;i++)advanceBody(b,C.step,'running',0,()=>shots++);
 expect(shots).toBe(0);expect(b.warning).toBe(0);expect(b.burst).toBe(0);
});

it('killing the elite between beats prevents the pending second volley', () => {
 const w=new World();w.player.x=200;
 const b=w.spawn('elite',200,400);b.pattern='fan';b.burst=1;b.warning=.6;b.timer=.6;b.hp=1;
 w.bullets.push({id:999,x:200,y:440,px:200,py:440,vx:0,vy:-1200,damage:4,age:0,active:true,hostile:false});
 for(let i=0;i<60;i++){w.step(C.step,200);w.drainEffects();}
 expect(w.bodies.some(body=>body.id===b.id)).toBe(false);
 expect(w.kills).toBe(1);expect(w.bullets.some(bullet=>bullet.hostile)).toBe(false);
});

it('tracks travel distance, gives actual warning priority and never advances an unchanged body',()=>{
 expect(eliteFrame({age:0,speed:90,warning:0})).toBe(0);
 expect(eliteFrame({age:49/90,speed:90,warning:0})).toBe(2);
 expect(eliteFrame({age:97/90,speed:90,warning:0})).toBe(0);
 expect(eliteFrame({age:49/144,speed:144,warning:0})).toBe(2);
 const state={age:.4,speed:90,warning:.6};
 for(let i=0;i<120;i++)expect(eliteFrame(state)).toBe(1);
 expect(state).toEqual({age:.4,speed:90,warning:.6});
});

it('prepares for the unchanged real 0.6-second warning and returns to travel on the actual shot',()=>{
 const b=new World().spawn('elite',100,-100);let shots=0,warningAt=0,shotAt=0,passedCutoff=false;
 const positions:number[][]=[];
 for(let i=0;i<480;i++){
  const before=shots;
  advanceBody(b,C.step,'running',0,(x,y)=>{shots++;positions.push([x,y]);if(!shotAt)shotAt=b.age;});
  if(b.warning>0){if(!warningAt)warningAt=b.age;expect(eliteFrame(b)).toBe(1);}
  if(shots>before){expect(b.warning).toBe(0);expect(eliteFrame(b)).not.toBe(1);}
  if(b.y>=600){passedCutoff=true;expect(b.warning).toBe(0);}
 }
 expect(warningAt).toBeCloseTo(1.2);expect(shotAt).toBeCloseTo(1.8);
 // Stage159's deployment reaches the visible station earlier and leaves the
 // firing zone before a second cycle. The opening clock/charge remain intact.
 expect(shotAt-warningAt).toBeCloseTo(.6);expect(shots).toBe(1);
 expect(passedCutoff).toBe(true);expect(positions).toHaveLength(1);
 expect(positions[0][0]).toBe(100);expect(positions[0][1]).toBeCloseTo(490);
});
