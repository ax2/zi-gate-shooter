import {expect,it} from 'vitest';
import sharp from 'sharp';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {BOSS_VISUAL} from '../src/game/boss-destruction';
it('real director entry docks at the same common centre used by battle fixtures',()=>{
 const w=new World();w.phase='boss-entry';w.phaseTime=0;const b=w.spawn('boss',360,-150);
 for(let i=0;i<121;i++)w.step(C.step,68);expect(w.phase).toBe('boss');expect(b.y).toBe(C.bossY);expect(b.y-b.height/2).toBeGreaterThanOrEqual(C.playerShotTop);expect(BOSS_VISUAL.offsetY).toBe(0);
});
it.each(['boss-v1.png','boss-flanker-v1.png','boss-bastion-v1.png'])('%s actual opaque frames clear the HUD and remain centred near the real hurtbox',async name=>{
 const {data,info}=await sharp(`public/assets/${name}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});const cell=info.width/3;
 for(let frame=0;frame<3;frame++){
  let top=info.height,bottom=-1,left=cell,right=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<cell;x++)if(data[(y*info.width+frame*cell+x)*4+3]>32){top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);}
  expect(bottom).toBeGreaterThan(top);const actualTop=C.bossY+BOSS_VISUAL.offsetY+(top/info.height-.5)*BOSS_VISUAL.height;
  const actualMiddle=C.bossY+BOSS_VISUAL.offsetY+((top+bottom)/2/info.height-.5)*BOSS_VISUAL.height;
  expect(actualTop,`frame ${frame} top`).toBeGreaterThanOrEqual(C.playerShotTop);expect(Math.abs(actualMiddle-C.bossY)).toBeLessThan(30);
  expect(Math.abs(((left+right)/2/cell-.5)*BOSS_VISUAL.width)).toBeLessThan(8);
 }
});
