import{it,expect}from'vitest';import{World}from'../src/core/world';import{combatNoticePosition}from'../src/game/combat-notice';import{pickupSignal}from'../src/game/pickup-signal';import{C}from'../src/core/config';
it('uses exact painted notice bounds and native target envelopes, without touching World',()=>{
 const w=new World(),b=w.spawn('pickup',360,1200);const before=JSON.stringify(w);expect(combatNoticePosition(w,1195,true)).toEqual({y:277,top:246,bottom:350});expect(JSON.stringify(w)).toBe(before);
 b.active=false;expect(combatNoticePosition(w,1195,true)).toEqual({y:1208,top:1177,bottom:1271});expect(combatNoticePosition(w,277,false)).toEqual({y:277,top:246,bottom:308});expect(combatNoticePosition(w,820,true)?.y).toBe(820);
});
it('yields when both areas are occupied; boss and bounty information never moves over the boss HUD',()=>{
 const w=new World(),a=w.spawn('drone',360,300),b=w.spawn('pickup',360,1200);expect(combatNoticePosition(w,1195,true)).toBeNull();a.active=false;w.spawn('boss',360,360);expect(combatNoticePosition(w,277,true)).toBeNull();b.active=false;expect(combatNoticePosition(w,277,true)?.y).toBe(1208);
 const t=new World();t.spawn('drone',360,1200).bountyRound=1;expect(combatNoticePosition(t,277,false)).toBeNull();
});
it('avoids actual hostile bullets at panel edges and ignores inactive or friendly bullets',()=>{
 const w=new World(),b={id:999,x:58-14,y:1271+18,px:44,py:1289,vx:0,vy:0,age:0,damage:1,active:true,hostile:true};w.bullets.push(b);expect(combatNoticePosition(w,1195,true)?.y).toBe(277);b.active=false;expect(combatNoticePosition(w,1195,true)?.y).toBe(1208);b.active=true;b.hostile=false;expect(combatNoticePosition(w,1195,true)?.y).toBe(1208);
});
it('pickup advice ends at the actual downstream collection limit, without granting or changing rewards',()=>{
 const w=new World(),b=w.spawn('pickup',120,500,2);const before=JSON.stringify(w);expect(pickupSignal(b)).toEqual({collectible:true,urgent:false});expect(JSON.stringify(w)).toBe(before);b.y=C.playerY-180;expect(pickupSignal(b)?.urgent).toBe(true);b.y=C.playerY+C.pickupRadius;expect(pickupSignal(b)?.collectible).toBe(true);b.y+=.001;expect(pickupSignal(b)?.collectible).toBe(false);b.active=false;expect(pickupSignal(b)).toBeNull();expect(pickupSignal(w.spawn('crate',360,500))).toBeNull();expect(w.pickups).toBe(0);
});
it('does not reserve a removed offscreen pickup label, but still avoids a passed module that is visibly on screen',()=>{
 const w=new World(),b=w.spawn('pickup',240,1336,2);expect(combatNoticePosition(w,1195,true)?.y).toBe(1208);
 b.y=1200;expect(combatNoticePosition(w,1195,true)?.y).toBe(277);
 b.y=325;expect(combatNoticePosition(w,277,true)?.y).toBe(1208);
});
it.each([0,.001])('matches a real stationary downstream pickup contact with offset %s',offset=>{
 const w=new World();Object.assign(w,{scheduled:[]});const b=w.spawn('pickup',w.player.x,C.playerY+C.pickupRadius+offset,2);b.speed=0;expect(pickupSignal(b)?.collectible).toBe(offset===0);w.step(C.step,w.player.x);expect(w.pickups).toBe(offset===0?1:0);
});
