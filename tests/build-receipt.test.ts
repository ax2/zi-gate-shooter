import {expect,it} from 'vitest';
import {World} from '../src/core/world';
import {buildReceiptPosition} from '../src/game/build-receipt';

it('uses actual rendered targets and labels, not only collision boxes, without mutating the world',()=>{
 const w=new World();const b=w.spawn('crate',360,430,2);
 // Its label envelope overlaps the lower edge of the top reading area.
 const before=JSON.stringify(w);expect(buildReceiptPosition(w)).toBe(1180);expect(JSON.stringify(w)).toBe(before);
 b.active=false;expect(buildReceiptPosition(w)).toBe(240);
});
it('waits when both areas contain danger and never moves boss feedback over its battlefield',()=>{
 const w=new World();const a=w.spawn('crate',360,300,2);const b=w.spawn('pickup',360,1200,2);
 expect(buildReceiptPosition(w)).toBeNull();a.active=false;expect(buildReceiptPosition(w,true)).toBe(240);
 const boss=w.spawn('boss',360,330);expect(buildReceiptPosition(w)).toBeNull();b.active=false;expect(buildReceiptPosition(w)).toBe(1180);
 boss.active=false;expect(buildReceiptPosition(w,true)).toBe(1180);
});
it('avoids active enemy projectiles while ignoring inactive and friendly projectiles',()=>{
 const w=new World();const b={id:999,x:360,y:300,px:360,py:300,vx:0,vy:0,damage:1,age:0,active:true,hostile:true};w.bullets.push(b);
 expect(buildReceiptPosition(w)).toBe(1180);b.hostile=false;expect(buildReceiptPosition(w)).toBe(240);b.hostile=true;b.active=false;expect(buildReceiptPosition(w)).toBe(240);
});
