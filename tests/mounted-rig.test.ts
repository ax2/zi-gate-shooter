import {expect,it} from 'vitest';
import {C} from '../src/core/config';
import {mountedCenter,mountedRig,mountedPose} from '../src/game/mounted-rig';

it('keeps every full-size tier and calibration mount within the canvas at both movement limits',()=>{
 for(const mount of Object.values(mountedRig))for(const stage of [1,2,3])for(const band of [0,1,2,3]){
  const size=mount.size*(1+(stage-1)*.07)*(1+band*.05);
  let previous=mountedCenter(C.minX,mount.x,size);
  for(let x=C.minX;x<=C.maxX;x++){
   const center=mountedCenter(x,mount.x,size);
   expect(center-size/2).toBeGreaterThanOrEqual(8-1e-9);
   expect(center+size/2).toBeLessThanOrEqual(C.width-8+1e-9);
   expect(center-previous).toBeGreaterThanOrEqual(0);
   expect(center-previous).toBeLessThanOrEqual(1+1e-9);
   previous=center;
  }
  expect(mountedCenter(360,mount.x,size)).toBe(360+mount.x);
 }
});
it('lifts retracted side guns above the primary body and keeps upper and central sockets at their original height',()=>{
 for(const [kind,mount] of Object.entries(mountedRig)){
  const size=mount.size*1.14*1.15;
  expect(mountedPose(360,mount,size)).toEqual({x:360+mount.x,y:mount.y,fold:0});
  const edge=mountedPose(mount.x<0?C.minX:C.maxX,mount,size);
  if(kind==='pulse'||kind==='scatter')expect(edge.y+size/2).toBeLessThan(-120);
  else expect(edge.y).toBe(mount.y);
 }
});
it('preserves the two-cartridge carrier at the right edge without shrinking or changing the inner socket',()=>{
 expect(mountedCenter(360,51,64)).toBe(411);
 expect(mountedCenter(C.maxX,51,64)+32).toBe(712);
 expect(mountedCenter(C.minX,51,64)).toBe(119);
});
