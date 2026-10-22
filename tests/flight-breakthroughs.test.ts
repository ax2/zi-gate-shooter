import {it,expect} from 'vitest';
import {FlightWorld,F,type Enemy} from '../src/flight/world';
import {Assembly,techById,parts,breakthroughPairs,breakthroughIds} from '../src/flight/technology';
import {flightProfile,projectTechnology} from '../src/flight/profile';
function fund(w:FlightWorld,id:string){for(const p of parts)w.assembly.inventory[p]=100000;const add=(key:string)=>{for(const n of techById.get(key)!.parents)if(!w.assembly.has(n))add(n);if(!w.assembly.has(key))expect(w.install(key)).toBe(true);};add(id);}
function arena(id:string){const w=new FlightWorld(1337);fund(w,id);for(const key of ['spawnTimer','shotTimer','arcTimer','laserTimer','railTimer','empTimer','sunTimer'])(w as any)[key]=1e6;w.effects=[];return w;}
function foe(w:FlightWorld,x=360,y=700,hp=100000){const e:Enemy={id:7000+w.enemies.length,kind:'sentry',x,y,px:x,py:y,hp,maxHp:hp,r:30,age:3,timer:1e6,angle:0,seed:0,burn:0,burnTick:0,hit:0};w.enemies.push(e);return e;}
const core=(w:FlightWorld)=>w as any;
it.each(breakthroughIds)('%s validates multiple ancestors and excludes its sibling/foreign terminal paths without spending',id=>{
 const a=new Assembly();for(const p of parts)a.inventory[p]=10000;expect(a.install(id)).toBe(false);const w=arena(id),before={...w.assembly.inventory},siblings=breakthroughPairs.find(p=>p.includes(id))!;expect(w.assembly.breakthrough).toBe(id);for(const other of breakthroughIds)if(other!==id){expect(w.install(other)).toBe(false);expect(projectTechnology(w.assembly,other)).toBeUndefined();}expect(w.assembly.inventory).toEqual(before);expect(siblings).toHaveLength(2);expect(w.assembly.installed.size).toBeGreaterThan(8);
});
it('twelve real primary contacts emit exactly three additional rails and cannot charge themselves',()=>{
 const w=arena('railburst'),e=foe(w);for(let i=0;i<12;i++)core(w).bullet(e.x,e.y,0,0,1);w.step(F.step);const shots=w.bullets.filter(b=>b.damageSource==='railburst');expect(shots).toHaveLength(3);expect(shots.every(b=>b.damage===flightProfile(w.assembly).breakthrough.railDamage&&b.pierce===2)).toBe(true);expect(new Set(shots.map(b=>b.vx)).size).toBe(3);expect(w.breakthroughProgress()!.current).toBe(0);expect(w.assembly.has('split')).toBe(true);
});
it('a full projectile budget holds the earned rail charge until an atomic three-shot volley fits',()=>{
 const w=arena('railburst'),e=foe(w);for(let i=0;i<F.bulletLimit-12;i++)core(w).bullet(50,400,0,0,1);for(let i=0;i<12;i++)core(w).bullet(e.x,e.y,0,0,1);w.step(F.step);expect(w.breakthroughProgress()!.current).toBe(12);expect(w.bullets.some(b=>b.damageSource==='railburst')).toBe(false);core(w).bullet(e.x,e.y,0,0,1);w.step(F.step);expect(w.bullets.filter(b=>b.damageSource==='railburst')).toHaveLength(3);expect(w.bullets.length).toBeLessThanOrEqual(F.bulletLimit);
});
it('satellites emit at two actual orbit positions using the displayed damage and reload',()=>{
 const w=arena('satellites');w.step(F.step);const pos=w.satellitePositions(),shots=w.bullets.filter(b=>b.damageSource==='satellites'),p=flightProfile(w.assembly).breakthrough;expect(shots).toHaveLength(2);for(let i=0;i<2;i++){expect(shots[i].x).toBeCloseTo(pos[i].x);expect(shots[i].y-shots[i].vy*shots[i].age).toBeCloseTo(pos[i].y-14);expect(shots[i].damage).toBe(p.satelliteDamage);expect(shots[i].bounce).toBe(1);}expect(w.breakthroughProgress()!.max).toBe(p.satelliteInterval);
});
it('six actual laser contacts trigger a real electric chain, bounded by its cooldown',()=>{
 const w=arena('stormlens'),e=foe(w),beam=()=>core(w).beam({x:e.x,y:1040},{x:e.x,y:200},1,'laser');for(let i=0;i<5;i++)beam();expect(w.contribution.stormlens??0).toBe(0);beam();expect(w.contribution.stormlens).toBe(26);for(let i=0;i<6;i++)beam();expect(w.contribution.stormlens).toBe(26);for(let i=0;i<38;i++)w.step(F.step);beam();expect(w.contribution.stormlens).toBe(52);
});
function reflectScene(){const w=arena('reversefield'),e=foe(w,360,800);for(let i=0;i<5;i++)core(w).arc({x:360,y:1040},1,'coil');expect(w.fields[0]).toMatchObject({kind:'reflect',remaining:3});return{w,e};}
it('a charged field reverses only three physical hostile rounds with real friendly damage and no phantom enemy muzzle',()=>{
 const {w}=reflectScene();for(let i=0;i<4;i++)core(w).bullet(440,1040+i*2,-100,0,1,true,'enemy',0,false,12345);const hp=w.player.hp;w.step(F.step);const reflected=w.bullets.filter(b=>b.damageSource==='reversefield');expect(reflected).toHaveLength(3);expect(reflected.every(b=>!b.hostile&&b.vx===135&&b.damage===22&&b.sourceEnemy===undefined)).toBe(true);expect(w.bullets.filter(b=>b.hostile)).toHaveLength(1);expect(w.player.hp).toBe(hp);
});
it('reflection cannot exceed the friendly budget or silently delete an unreflected threat',()=>{
 const {w}=reflectScene();for(let i=0;i<F.bulletLimit;i++)core(w).bullet(50,300,0,0,1);core(w).bullet(440,1040,-100,0,1,true);w.step(F.step);expect(w.fields[0].remaining).toBe(3);expect(w.bullets.filter(b=>b.hostile)).toHaveLength(1);expect(w.bullets.filter(b=>!b.hostile)).toHaveLength(F.bulletLimit);
});
it('a last burn tick can trigger four real nova rays and subsequent kills cannot recurse into another burst',()=>{
 const w=arena('novaecho'),burned=foe(w,360,700,1),target=foe(w,250,590);burned.burn=1;burned.burnTick=F.step;w.step(F.step);const rays=w.effects.filter(e=>e.kind==='laser');expect(rays).toHaveLength(4);expect(w.contribution.novaecho).toBeGreaterThanOrEqual(50);expect(w.kills).toBe(1);expect(target.hp).toBeLessThan(target.maxHp);core(w).hit(target,1e9,'novaecho');expect(w.effects.filter(e=>e.kind==='laser')).toHaveLength(4);
});
it('eight actual main-beam contacts create a finite well whose real cross-beams cannot spawn further wells',()=>{
 const w=arena('lightwell'),e=foe(w),beam=()=>core(w).beam({x:e.x,y:1040},{x:e.x,y:200},1,'laser');for(let i=0;i<7;i++)beam();expect(w.fields).toHaveLength(0);beam();expect(w.fields).toHaveLength(1);w.step(F.step);expect(w.contribution.lightwell).toBe(70);expect(w.fields).toHaveLength(1);expect(w.breakthroughProgress()!.active).toBe(true);for(let i=0;i<150;i++){w.step(F.step);expect(w.fields.length).toBeLessThanOrEqual(F.fieldLimit);}expect(w.fields).toHaveLength(0);
});
it('dense friendly effects preserve an already firing hostile laser and its actual hit',()=>{
 const w=arena('lightwell');w.player.x=100;w.player.y=900;w.player.invulnerable=0;core(w).fx({kind:'laser',x:100,y:200,points:[{x:100,y:200},{x:100,y:1200}],size:11,color:'#f88',life:.2,hostile:true});for(let i=0;i<300;i++)core(w).fx({kind:'spark',x:400,y:400,size:20,color:'#fff',life:.2});expect(w.effects).toHaveLength(F.fxLimit);expect(w.effects.some(e=>e.hostile)).toBe(true);w.step(F.step,100,900);expect(w.player.hp).toBe(4);
});
