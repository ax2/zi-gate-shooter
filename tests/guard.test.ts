import {expect,it} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {advanceBody,guardClosed} from '../src/core/behavior';
import {safeRoute} from '../src/core/reachability';

it.each([0,2])('guard state %s controls both damage and actual piercing obstruction',burst=>{
 const w=new World();w.player.x=68;
 const front=w.spawn('guard',360,500);front.speed=0;front.burst=burst;front.timer=10;
 const rear=w.spawn('drone',360,350);rear.speed=0;
 w.bullets.push({id:9999,x:360,y:600,px:360,py:600,vx:0,vy:-1200,damage:20,age:0,active:true,hostile:false,weaponKind:'pierce',remainingTargets:2,hitBodies:[]});
 for(let i=0;i<15;i++){w.step(C.step,68);w.drainEffects();}
 expect(front.hp).toBe(burst?44:54);
 expect(rear.active).toBe(!burst);
});

it('opens before its warned fan, remains vulnerable during recovery then closes',()=>{
 const w=new World(),b=w.spawn('guard',360,320);b.timer=0;
 const shots:number[]=[];
 advanceBody(b,C.step,'running',0,()=>{throw Error('unwarned shot');});
 expect(guardClosed(b)).toBe(false);expect(b.warning).toBe(.8);
 for(let i=0;i<47;i++)advanceBody(b,C.step,'running',0,(_x,_y,vx)=>shots.push(vx!));
 expect(shots).toHaveLength(0);
 advanceBody(b,C.step,'running',0,(_x,_y,vx)=>shots.push(vx!));
 expect(shots).toEqual([-70,0,70]);expect(b.burst).toBe(2);expect(b.warning).toBe(0);
 for(let i=0;i<48;i++)advanceBody(b,C.step,'running',0,()=>{});
 expect(guardClosed(b)).toBe(true);
});

it('keeps a no-kill route through a shielded column and stops shooting near the player',()=>{
 const w=new World(),b=w.spawn('guard',360,320);b.timer=0;
 const sniper=w.spawn('sniper',180,320);sniper.timer=0;
 for(const x of [68,360,652])expect(safeRoute(x,[b,sniper],[],6)).not.toBeNull();
 b.y=651;b.burst=1;b.warning=.8;b.timer=0;
 advanceBody(b,C.step,'running',0,()=>{throw Error('close-range shot');});
 expect(b.warning).toBe(0);
});
