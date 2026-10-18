import{it,expect}from'vitest';import{BossArmorFragments}from'../src/game/boss-armor-fragments';
it('bounds repeated multi-threshold bursts, freezes at zero dt and expires every fragment',()=>{
 const fx=new BossArmorFragments();for(let i=0;i<10;i++)fx.burst(360,360,2,false);expect(fx.pieces).toHaveLength(3);const before=JSON.stringify(fx.pieces);fx.advance(0);expect(JSON.stringify(fx.pieces)).toBe(before);fx.advance(.66);expect(fx.pieces).toHaveLength(0);fx.burst(360,360,1,true);expect(fx.pieces).toHaveLength(2);fx.clear();expect(fx.pieces).toHaveLength(0);
});
it('crops real first-frame metal from the matching boss asset instead of drawing colored blocks',()=>{
 const fx=new BossArmorFragments(),calls:any[]=[];fx.burst(360,360,2,false);const c=new Proxy({},{get:(_t,k)=>(...args:any[])=>calls.push({k,args})})as unknown as CanvasRenderingContext2D;
 const image={width:768,height:256};fx.draw(c,key=>{expect(key).toBe('boss-bastion-v1.png');return image as HTMLImageElement;},false);const draws=calls.filter(c=>c.k==='drawImage');expect(draws).toHaveLength(3);expect(draws.every(c=>c.args[0]===image&&c.args[1]>=0&&c.args[1]+c.args[3]<=256)).toBe(true);
});
