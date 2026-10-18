import{it,expect}from'vitest';import{createRenderFixture}from'./helpers/render-fixture';
it.each([false,true])('keeps plate/crate/enemy debris within shared budget and clears plates on boss death, home and restart weak=%s',async weak=>{
 const f=createRenderFixture(weak);await f.runtime.load();f.runtime.start();const r=f.runtime as any;r.mode='paused';f.tick();const physical=JSON.stringify(r.world);
 for(let i=0;i<8;i++){
  r.effect({type:'boss-salvage',x:360,y:360,bossVariant:i%3,text:'破甲',gain:1});r.effect({type:'crate-break',x:300,y:650});r.effect({type:'kill',x:400,y:500,enemyKind:'armor'});f.tick();
  expect(r.bossFragments.pieces.length+r.crateDebris.pieces.length+r.enemyWreck.pieces.length).toBeLessThanOrEqual(9);expect(JSON.stringify(r.world)).toBe(physical);
 }
 r.effect({type:'boss-kill',x:360,y:360,bossVariant:2});expect(r.bossFragments.pieces).toHaveLength(0);expect(r.enemyWreck.pieces.length+r.crateDebris.pieces.length+3).toBeLessThanOrEqual(12);
 r.effect({type:'boss-salvage',x:360,y:360});f.tick();expect(r.activateControl('home')).toBe(true);expect(r.bossFragments.pieces).toHaveLength(0);
 r.effect({type:'boss-salvage',x:360,y:360});r.start();expect(r.bossFragments.pieces).toHaveLength(0);
});
