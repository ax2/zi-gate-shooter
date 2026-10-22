import{it,expect}from'vitest';
import{World}from'../src/core/world';
import{technologies,technologyOptions,weaponPortrait}from'../src/game/technology';
import{drawTechnologyTree,drawTechnologyChoices}from'../src/game/technology-screen';
import{createRenderFixture}from'./helpers/render-fixture';
import type{WeaponKind}from'../src/core/weapons';
import type{EquipmentChange}from'../src/game/equipment-receipt';
it.each(['ballistic','electric','optical']as const)('the learned %s branch and its successor show the same real technology',route=>{
 for(const option of (()=>{const w=new World();w.growth.mastery=30;w.chooseBuild(route);return technologyOptions(w,route);})()){
  const w=new World();w.growth.mastery=30;w.chooseBuild(route);w.chooseBuild(route,option.branch);
  const before=JSON.stringify(w),nodes=technologies(w),node=nodes.find(n=>n.id===route+':1')!,next=nodes.find(n=>n.id===route+':2')!;
  expect(node.name).toBe(option.name);expect(node.icon).toBe(option.icon);expect(next.requirements[0].label).toBe(option.name);expect(next.requirements[0].icon).toBe(option.icon);expect(next.requirements[0].ready).toBe(true);expect(JSON.stringify(w)).toBe(before);
 }
});
it('five collected weapon types use five distinct original mounted sprite cells, all within the image',async()=>{
 const f=createRenderFixture();await f.runtime.load();const c=(f.runtime as any).ctx as CanvasRenderingContext2D,img={width:768,height:512}as HTMLImageElement;
 const crops=[];for(const kind of ['pulse','scatter','pierce','blast','arc']as WeaponKind[]){f.calls.length=0;weaponPortrait(c,img,kind,120,268,58);const call=f.calls.find(c=>c.kind==='drawImage')!;const[x,y,w,h]=call.args.slice(1,5);expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(x+w).toBeLessThanOrEqual(768);expect(y+h).toBeLessThanOrEqual(512);crops.push([x,y,w,h].join(','));}expect(new Set(crops).size).toBe(5);
});
it('an empty wallet never labels a node purchasable but preserves future inspection',async()=>{
 const f=createRenderFixture();await f.runtime.load();f.runtime.start();const w=f.runtime.world,before=JSON.stringify(w),buttons=drawTechnologyTree((f.runtime as any).ctx,undefined,w,{tab:'base',selected:'ballistic:0'},'返回');
 expect(buttons.some(b=>b.label.startsWith('可研究'))).toBe(false);expect(buttons.some(b=>b.action.startsWith('tech-unlock:'))).toBe(false);expect(buttons.some(b=>b.action==='tech-node:ballistic:2')).toBe(true);expect(JSON.stringify(w)).toBe(before);
});
it('pickup identity uses the mounted portrait rather than an ability picture and preserves its real tier label',async()=>{
 const f=createRenderFixture();await f.runtime.load();f.runtime.start();f.calls.length=0;const img={width:768,height:512,src:'mounted-modules-v1.png'}as HTMLImageElement;
 const after={stage:2,calibration:0,pellets:2,targets:1,radius:0,hops:0,rate:5,direct:100};const pickup:EquipmentChange={kind:'pulse',after};
 drawTechnologyChoices((f.runtime as any).ctx,undefined,f.runtime.world,pickup,img);
 expect(f.calls.some(c=>c.kind==='drawImage'&&c.args[0]===img)).toBe(true);expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='+ T2')).toBe(true);
});
