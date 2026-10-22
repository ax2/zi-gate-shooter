import{Assembly,parts,type Part}from'./technology';
export const F={width:720,height:1280,minY:196,maxY:1198,speed:600,playerRadius:12,step:1/60,enemyLimit:26,hostileLimit:200,bulletLimit:280,lootLimit:32,fxLimit:220}as const;
export type EnemyKind='drone'|'diver'|'sentry'|'spinner'|'lancer'|'boss';
export interface Enemy{id:number;kind:EnemyKind;x:number;y:number;px:number;py:number;hp:number;maxHp:number;r:number;age:number;timer:number;angle:number;seed:number;burn:number;burnTick:number;hit:number;aimX?:number;aimY?:number}
export interface Bullet{id:number;x:number;y:number;px:number;py:number;vx:number;vy:number;r:number;damage:number;hostile:boolean;age:number;life:number;bounce:number;pierce:number;style:'pulse'|'wing'|'rail'|'enemy'|'orb';hits:Set<number>;explosive:boolean}
export interface Loot{id:number;x:number;y:number;part:Part|'repair';amount:number;age:number;phase:number}
export interface Effect{x:number;y:number;kind:'explosion'|'spark'|'arc'|'laser'|'ring'|'pickup'|'install';age:number;life:number;size:number;color:string;points?:{x:number;y:number}[];hostile?:boolean;icon?:number;label?:string}
export interface Notice{title:string;detail:string;time:number;icon?:number}
export interface FlightEvent{type:string;value?:string}
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
export function segmentDistance(x:number,y:number,ax:number,ay:number,bx:number,by:number){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-ax-dx*t,y-ay-dy*t);}
const stats:Record<EnemyKind,{hp:number;r:number;score:number}>={drone:{hp:16,r:25,score:25},diver:{hp:25,r:28,score:40},sentry:{hp:70,r:35,score:80},spinner:{hp:95,r:39,score:110},lancer:{hp:75,r:34,score:90},boss:{hp:2400,r:110,score:1200}};
/** Deterministic free-flight rules. Rendering, UI, audio and randomness do not share clocks. */
export class FlightWorld{
 readonly assembly=new Assembly();
 readonly player={x:360,y:1040,px:360,py:1040,hp:5,maxHp:5,invulnerable:1.4};
 enemies:Enemy[]=[];bullets:Bullet[]=[];loot:Loot[]=[];effects:Effect[]=[];events:FlightEvent[]=[];
 time=0;sector=0;sectorTime=0;kills=0;score=0;bossKills=0;damageTaken=0;partsCollected=0;scoreAwards=0;
 get scoreProgress(){const previous=this.scoreAwards?this.nextAward-(300+this.scoreAwards*150):0;return{next:this.nextAward,previous,ratio:clamp((this.score-previous)/(this.nextAward-previous),0,1)};}
 phase:'running'|'boss'|'dead'='running';notice:Notice={title:'自由空战',detail:'拖动任意方向 · 击敌拾取零件 · 点组装打开科技树',time:5};
 readonly contribution:Record<string,number>={};
 target?:string;private rng:number;private serial=0;private wave=0;private spawnTimer=1;private shotTimer=0;private arcTimer=0;private laserTimer=0;private railTimer=0;private empTimer=5;private sunTimer=4;private shots=0;private stormHits=0;private dryKills=0;private nextAward=300;
 constructor(seed=Date.now()){this.rng=seed>>>0||1;}
 random(){let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x>>>0;return this.rng/4294967296;}
 start(id:string){if(this.time||this.assembly.installed.size||!['split','coil','laser'].includes(id))return false;const p=parts[['split','coil','laser'].indexOf(id)];this.assembly.inventory[p]=2;return this.install(id);}
 install(id:string){const was=this.assembly.has(id);if(this.phase==='dead'||this.player.hp<=0||!this.assembly.install(id))return false;if(this.target===id)this.target=undefined;this.fx({kind:'install',x:this.player.x,y:this.player.y,size:100,color:'#a9f3e5',life:.8});this.notice={title:was?'组件精校 +1':'新组件已装配',detail:id,time:2,icon:undefined};this.events.push({type:'upgrade',value:id});return true;}
 private fx(e:Omit<Effect,'age'>){if(this.effects.length>=F.fxLimit)this.effects.shift();this.effects.push({...e,age:0});}
 private bullet(x:number,y:number,vx:number,vy:number,damage:number,hostile=false,style:Bullet['style']='pulse',pierce=0,explosive=false){
  if(this.bullets.filter(b=>b.hostile===hostile).length>=(hostile?F.hostileLimit:F.bulletLimit))return;
  this.bullets.push({id:++this.serial,x,y,px:x,py:y,vx,vy,damage,hostile,style,r:hostile?(style==='orb'?9:6):style==='rail'?9:4,age:0,life:hostile?9:2.8,bounce:!hostile&&this.assembly.has('bounce')?1:0,pierce,hits:new Set(),explosive});
 }
 private spawn(kind:EnemyKind,x:number,y=-60){if(this.enemies.length>=F.enemyLimit)return;const s=stats[kind],hp=s.hp*(1+this.sector*.4);this.enemies.push({id:++this.serial,kind,x,y,px:x,py:y,hp,maxHp:hp,r:s.r,age:0,timer:kind==='drone'?2.1:1.4,angle:0,seed:this.random()*Math.PI*2,burn:0,burnTick:0,hit:0});}
 private spawnWave(){
  this.wave++;const p=this.sector%3,late=this.sectorTime>30,n=3+Math.min(3,this.sector),side=this.random()<.5?1:-1;
  if(this.wave%5===0){this.spawn(p===0?'lancer':p===1?'spinner':'sentry',120+this.random()*480);this.spawn('sentry',side===1?100:620,-240);return;}
  for(let i=0;i<n;i++){let x=90+(540/(n-1))*i,y=-60-i*62;
   if(p===1)x=side===1?110+i*70:610-i*70;
   if(p===2){x=i%2?540:180;y=-60-Math.floor(i/2)*110;}
   this.spawn(this.wave%3===0?(p===1?'diver':late?'sentry':'diver'):'drone',x,y);
  }
  if(late&&this.wave%2===0)this.spawn(p===0?'spinner':p===1?'lancer':'sentry',360,-300);
 }
 private enemyShot(e:Enemy){
  const dx=(e.kind==='lancer'?e.aimX??this.player.x:this.player.x)-e.x,dy=(e.kind==='lancer'?e.aimY??this.player.y:this.player.y)-e.y,a=Math.atan2(dy,dx),speed=210+Math.min(90,this.sector*12);
  const emit=(angle:number,scale=1,style:Bullet['style']='enemy')=>this.bullet(e.x,e.y+e.r*.6,Math.cos(angle)*speed*scale,Math.sin(angle)*speed*scale,1,true,style);
  if(e.kind==='drone'){emit(a);e.timer=2.8;}
  else if(e.kind==='sentry'){for(const d of[-.22,0,.22])emit(a+d);e.timer=2.5;}
  else if(e.kind==='spinner'){for(let i=0;i<10;i++)emit(e.angle+i*Math.PI/5,.75,'orb');e.angle+=.25;e.timer=2.8;}
  else if(e.kind==='lancer'){
   // The beam is already firing; only this visible finite segment can hurt.
   const end={x:e.x+Math.cos(a)*1600,y:e.y+Math.sin(a)*1600};this.fx({kind:'laser',x:e.x,y:e.y,points:[{x:e.x,y:e.y},end],size:11,color:'#ff7868',life:.2,hostile:true});
   if(segmentDistance(this.player.x,this.player.y,e.x,e.y,end.x,end.y)<F.playerRadius+5)this.hurt();e.timer=3.1;e.aimX=undefined;e.aimY=undefined;
  }else if(e.kind==='boss'){
   if(this.sector%3===0){for(let i=0;i<14;i++)emit(e.angle+i*Math.PI/7,.8,'orb');for(const d of[-.3,-.15,0,.15,.3])emit(a+d,1.25);}
   else if(this.sector%3===1){for(const side of[-1,1]){const x=e.x+side*90,y=e.y+40,aim=Math.atan2(this.player.y-y,this.player.x-x);for(const d of[-.34,-.17,0,.17,.34])this.bullet(x,y,Math.cos(aim+d)*speed*1.3,Math.sin(aim+d)*speed*1.3,1,true,'enemy');}}
   else{for(let i=0;i<10;i++)emit(e.angle+i*Math.PI/5,.55,'orb');for(const side of[-1,1])for(const d of[-.1,0,.1])this.bullet(e.x+side*80,e.y+50,Math.sin(d)*speed,Math.cos(d)*speed*1.6,1,true);}
   e.angle+=.21;e.timer=e.hp<e.maxHp*.5?1.05:1.6;
   if(this.enemies.length<5){this.spawn(this.sector%2?'diver':'sentry',100,-80);this.spawn('drone',620,-150);}
  }
 }
 private hurt(){if(this.player.invulnerable>0||this.phase==='dead')return;this.player.hp--;this.damageTaken++;this.player.invulnerable=1.25;this.events.push({type:'hurt'});this.fx({kind:'ring',x:this.player.x,y:this.player.y,size:90,color:'#ff806d',life:.4});if(this.player.hp<=0){this.phase='dead';this.events.push({type:'death'});this.fx({kind:'explosion',x:this.player.x,y:this.player.y,size:170,color:'#ffbe70',life:.8});}}
 private addDrop(x:number,y:number,part:Loot['part'],amount=1){if(this.loot.length>=F.lootLimit){const same=this.loot.find(l=>l.part===part);if(same){same.amount+=amount;return;}return;}this.loot.push({id:++this.serial,x:clamp(x,40,680),y:clamp(y,158,1160),part,amount,age:0,phase:this.random()*6.28});}
 private randomPart():Part{const roll=this.random();if(this.target&&roll<.55){const cost=this.assembly.cost(this.target);const needed=parts.filter(p=>(cost[p]??0)>this.assembly.inventory[p]);if(needed.length)return needed[Math.floor(this.random()*needed.length)];}return parts[Math.floor(this.random()*parts.length)];}
 private hit(e:Enemy,amount:number,source:string){if(e.hp<=0||this.player.hp<=0||this.phase==='dead')return;const dealt=Math.min(e.hp,amount);e.hp-=amount;e.hit=.07;this.contribution[source]=(this.contribution[source]??0)+dealt;if(e.hp>0)return;
  this.kills++;this.score+=stats[e.kind].score;this.dryKills++;
  this.fx({kind:'explosion',x:e.x,y:e.y,size:e.kind==='boss'?280:e.r*2.7,color:'#ffc383',life:.65});this.events.push({type:e.kind==='boss'?'boss-kill':'kill'});
  if(this.dryKills>=4||this.random()<.36||e.kind==='boss'){this.addDrop(e.x,e.y,this.randomPart(),e.kind==='boss'?3:1);this.dryKills=0;}
  if(e.kind==='boss'){for(const [i,p]of parts.entries())this.addDrop(e.x+(i-1)*95,e.y+80,p,2);this.addDrop(e.x,e.y+150,'repair');this.bossKills++;this.sector++;this.sectorTime=0;this.phase='running';this.spawnTimer=2;this.notice={title:'空域突破',detail:['冷却港湾','侧翼突袭','重装封锁'][this.sector%3]+' · 首领留下组装零件',time:4};for(const b of this.bullets)if(b.hostile)b.life=0;}
  while(this.score>=this.nextAward){this.scoreAwards++;const earned=this.nextAward;this.nextAward+=300+this.scoreAwards*150;this.addDrop(e.x-42,e.y+38,parts[(this.scoreAwards-1)%3],2);if(this.scoreAwards%3===0)this.addDrop(e.x+42,e.y+38,'repair');this.notice={title:`${earned} 分 · 击破补给`,detail:'双份组件已掉落 · 飞近拾取',time:3};this.events.push({type:'reward'});}
 }
 private arc(from:{x:number;y:number},damage:number,source='coil'){
  const count=this.assembly.has('chain')?4:2,range=this.assembly.has('seeker')?470:330,visited=new Set<number>();let pos=from;
  for(let i=0;i<count;i++){
   const candidates=this.enemies.filter(e=>e.hp>0&&e.y>=155&&e.y<=1280&&!visited.has(e.id)&&Math.hypot(e.x-pos.x,e.y-pos.y)<(i===0?range:280));
   candidates.sort((a,b)=>this.assembly.has('seeker')?Number(b.timer<.6)-Number(a.timer<.6)||Math.hypot(a.x-pos.x,a.y-pos.y)-Math.hypot(b.x-pos.x,b.y-pos.y):Math.hypot(a.x-pos.x,a.y-pos.y)-Math.hypot(b.x-pos.x,b.y-pos.y));const e=candidates[0];if(!e)break;
   visited.add(e.id);this.fx({kind:'arc',x:pos.x,y:pos.y,points:[{x:pos.x,y:pos.y},{x:e.x,y:e.y}],size:3,color:'#c4a0ff',life:.18});this.fx({kind:'spark',x:e.x,y:e.y,size:28,color:'#e4ceff',life:.2});this.hit(e,damage*Math.pow(this.assembly.has('tempest')?1:.8,i),source);pos=e;
  }
 }
 private beam(start:{x:number;y:number},end:{x:number;y:number},damage:number,source:string,reflect=false){
  const contacts=this.enemies.filter(e=>e.hp>0&&e.y>=155&&e.y<=1280&&segmentDistance(e.x,e.y,start.x,start.y,end.x,end.y)<e.r+9).sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y)).slice(0,this.assembly.has('drill')?8:3);
  for(const e of contacts){this.hit(e,damage,source);if(this.assembly.has('burn')){e.burn=3;e.burnTick=.3;}}
  this.fx({kind:'laser',x:start.x,y:start.y,points:[start,end],size:reflect?7:11,color:source==='sun'?'#ffe4a0':'#8af6ff',life:.18});
 }
 private attacks(dt:number){
  const a=this.assembly,p=this.player;this.shotTimer-=dt;this.arcTimer-=dt;this.laserTimer-=dt;this.railTimer-=dt;this.empTimer-=dt;this.sunTimer-=dt;
  if(this.shotTimer<=0){this.shotTimer+=a.has('arsenal')?.1:.16;this.shots++;this.bullet(p.x,p.y-42,0,-1050,7*a.power('split'),false,'pulse',0,a.has('flak')&&this.shots%4===0);
   if(a.has('split')){const dirs=a.has('barrage')?[-.36,-.23,-.11,.11,.23,.36]:[-.17,.17];for(const ang of dirs){let vx=Math.sin(ang)*850,vy=-Math.cos(ang)*850;if(a.has('arsenal')){const e=this.enemies.filter(e=>e.hp>0&&e.y<p.y).sort((a,b)=>a.hp-b.hp)[0];if(e){const d=Math.hypot(e.x-p.x,e.y-p.y);vx=(e.x-p.x)/d*850+Math.sin(ang)*180;vy=(e.y-p.y)/d*850;}}this.bullet(p.x+Math.sign(ang)*38,p.y-24,vx,vy,5*a.power('split'),false,'wing');}}
   this.events.push({type:'fire'});
  }
  if(a.has('rail')&&this.railTimer<=0){this.railTimer=1.1;this.bullet(p.x,p.y-48,0,-1350,38*a.power('rail'),false,'rail',4);}
  if(a.has('coil')&&this.arcTimer<=0){this.arcTimer=.9;this.arc({x:p.x,y:p.y-38},18*a.power('coil'));if(a.has('tempest'))this.arc({x:p.x+65,y:p.y-20},18*a.power('tempest'),'tempest');this.events.push({type:'arc'});}
  if(a.has('laser')&&this.laserTimer<=0){this.laserTimer=a.has('drill')?.8:1.4;const d=30*a.power('laser');for(const x of a.has('twin')?[p.x-64,p.x,p.x+64]:[p.x])this.beam({x,y:p.y-40},{x,y:110},d,'laser');
   if(a.has('prism'))for(const side of[-1,1]){const x=side===-1?12:708,y=p.y-Math.abs(p.x-x)*1.2;this.beam({x:p.x,y:p.y-40},{x,y},d*.65,'prism',true);this.beam({x,y},{x:p.x,y:y-Math.abs(p.x-x)*1.2},d*.65,'prism',true);}this.events.push({type:'laser'});
  }
  if(a.has('emp')&&this.empTimer<=0){this.empTimer=5;this.fx({kind:'ring',x:p.x,y:p.y,size:260,color:'#c6a0ff',life:.5});for(const e of this.enemies)if(Math.hypot(e.x-p.x,e.y-p.y)<260)this.hit(e,65*a.power('emp'),'emp');for(const b of this.bullets)if(b.hostile&&Math.hypot(b.x-p.x,b.y-p.y)<260)b.life=0;this.events.push({type:'ion-storm'});}
  if(a.has('sun')&&this.sunTimer<=0){this.sunTimer=4;for(let i=0;i<8;i++){const angle=-Math.PI/2+(i-3.5)*.16;this.beam({x:p.x,y:p.y-40},{x:p.x+Math.cos(angle)*1400,y:p.y+Math.sin(angle)*1400},45*a.power('sun'),'sun');}this.events.push({type:'laser'});}
 }
 step(dt:number,targetX=this.player.x,targetY=this.player.y){
  if(this.phase==='dead'||!Number.isFinite(dt)||dt<=0)return;dt=clamp(dt,0,1/30);this.time+=dt;this.sectorTime+=dt;this.notice.time=Math.max(0,this.notice.time-dt);
  const p=this.player;p.px=p.x;p.py=p.y;const dx=clamp(targetX,32,688)-p.x,dy=clamp(targetY,F.minY,F.maxY)-p.y,d=Math.hypot(dx,dy),f=Math.min(1,F.speed*dt/(d||1));p.x+=dx*f;p.y+=dy*f;p.invulnerable=Math.max(0,p.invulnerable-dt);
  this.spawnTimer-=dt;if(this.phase==='running'&&this.sectorTime>=60){if(this.enemies.length<F.enemyLimit){this.phase='boss';this.spawn('boss',360,-140);this.notice={title:'旗舰接近',detail:'击破获得三系零件 · 注意实际弹幕',time:3};}}
  else if(this.phase==='running'&&this.spawnTimer<=0){this.spawnTimer=Math.max(1.45,3.3-this.sector*.18);this.spawnWave();}
  for(const e of this.enemies){e.px=e.x;e.py=e.y;e.age+=dt;e.hit=Math.max(0,e.hit-dt);if(e.y>155)e.timer-=dt;
   if(e.kind==='boss'){e.y=Math.min(285,e.y+130*dt);e.x=360+Math.sin(e.age*.5)*190;}
   else if(e.kind==='drone'){e.y+=130*dt;e.x+=Math.cos(e.seed+e.age*2)*45*dt;}
   else if(e.kind==='diver'){e.y+=(e.age>1.8?300:90)*dt;e.x+=Math.sin(e.seed)*95*dt;}
   else{e.y+=((e.age<2||e.age>8)?105:12)*dt;e.x+=Math.cos(e.seed+e.age)*30*dt;}
   e.x=clamp(e.x,32,688);if(e.kind==='lancer'&&e.y>155&&e.timer<=.65&&e.aimX===undefined){e.aimX=p.x;e.aimY=p.y;}if(e.hp>0&&e.y>155&&e.timer<=0&&e.kind!=='diver')this.enemyShot(e);
   if(e.burn>0){e.burnTick-=dt;if(e.burnTick<=0){e.burnTick=.3;e.burn--;this.hit(e,9*this.assembly.power('burn'),'burn');}}
   if(e.hp>0&&segmentDistance(0,0,e.px-p.px,e.py-p.py,e.x-p.x,e.y-p.y)<e.r*.7+F.playerRadius)this.hurt();
  }
  if(p.hp<=0)return;this.attacks(dt);
  for(const b of this.bullets){if(p.hp<=0)break;b.px=b.x;b.py=b.y;b.age+=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(!b.hostile&&b.bounce>0&&(b.x<10||b.x>710)){b.x=clamp(b.x,10,710);b.vx=-b.vx;b.bounce--;this.fx({kind:'spark',x:b.x,y:b.y,size:25,color:'#ffd989',life:.2});}
   if(b.life<=0)continue;
   if(b.hostile){if(segmentDistance(0,0,b.px-p.px,b.py-p.py,b.x-p.x,b.y-p.y)<F.playerRadius+b.r){this.hurt();b.life=0;}}
   else for(const e of this.enemies){if(e.hp<=0||e.y<125||b.hits.has(e.id)||segmentDistance(0,0,b.px-e.px,b.py-e.py,b.x-e.x,b.y-e.y)>e.r+b.r)continue;b.hits.add(e.id);this.hit(e,b.damage,b.style==='rail'?'rail':'guns');this.fx({kind:'spark',x:b.x,y:b.y,size:b.style==='rail'?36:18,color:'#ffcf87',life:.16});
    if(b.explosive){this.fx({kind:'explosion',x:e.x,y:e.y,size:130,color:'#ffd191',life:.4});for(const other of this.enemies)if(other.id!==e.id&&Math.hypot(other.x-e.x,other.y-e.y)<130)this.hit(other,b.damage*.65,'flak');}
    if(this.assembly.has('bounce')&&b.style!=='rail'){const other=this.enemies.filter(o=>o.hp>0&&o.y>=155&&o.y<=1280&&!b.hits.has(o.id)&&Math.hypot(o.x-e.x,o.y-e.y)<280).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];if(other){this.fx({kind:'arc',x:e.x,y:e.y,points:[{x:e.x,y:e.y},{x:other.x,y:other.y}],size:2,color:'#ffcc83',life:.14});this.hit(other,b.damage*.6,'bounce');}}
    if(this.assembly.has('stormgun')&&++this.stormHits%3===0)this.arc(e,12*this.assembly.power('stormgun'),'stormgun');
    if(b.pierce>0)b.pierce--;else{b.life=0;break;}
   }
  }
  for(const e of this.effects)if(e.hostile&&e.points&&e.age<e.life){const[a,b]=e.points;if(segmentDistance(p.x,p.y,a.x,a.y,b.x,b.y)<F.playerRadius+e.size/2)this.hurt();}
  if(p.hp>0)for(const l of this.loot){l.age+=dt;l.y+=22*dt;const dx=p.x-l.x,dy=p.y-l.y,d=Math.hypot(dx,dy);if(d<155){l.x+=dx/d*360*dt||0;l.y+=dy/d*360*dt||0;}if(Math.hypot(l.x-p.x,l.y-p.y)<30){if(l.part==='repair')p.hp=Math.min(p.maxHp,p.hp+1);else{this.assembly.inventory[l.part]+=l.amount;this.partsCollected+=l.amount;}l.age=99;this.fx({kind:'pickup',x:p.x,y:p.y,size:56,color:l.part==='repair'?'#9df0ba':l.part==='alloy'?'#ffd28a':l.part==='coil'?'#c5a4ff':'#8bf3ff',life:.55,icon:l.part==='repair'?undefined:l.part==='alloy'?3:l.part==='coil'?1:2,label:l.part==='repair'?'+ 维修':`+${l.amount}`});this.events.push({type:'pickup',value:l.part});}}
  this.enemies=this.enemies.filter(e=>e.hp>0&&e.y<1390);this.bullets=this.bullets.filter(b=>b.life>0&&b.age<b.life&&b.y>-100&&b.y<1390&&b.x>-120&&b.x<840);this.loot=this.loot.filter(l=>l.age<18&&l.y<1320);
  for(const e of this.effects)e.age+=dt;this.effects=this.effects.filter(e=>e.age<e.life);
 }
 drainEvents(){return this.events.splice(0);}
 diagnostics(){return{time:this.time,sector:this.sector,sectorTime:this.sectorTime,phase:this.phase,player:{...this.player},kills:this.kills,score:this.score,nextAward:this.nextAward,scoreProgress:this.scoreProgress,scoreAwards:this.scoreAwards,partsCollected:this.partsCollected,installed:[...this.assembly.installed],keystone:this.assembly.keystone,inventory:{...this.assembly.inventory},calibrated:{...this.assembly.calibrated},ready:this.assembly.ready.map(t=>t.id),target:this.target,contribution:{...this.contribution},bossKills:this.bossKills,damageTaken:this.damageTaken,enemies:this.enemies.map(e=>({...e})),loot:this.loot.map(l=>({...l})),counts:{bullets:this.bullets.filter(b=>!b.hostile).length,hostiles:this.bullets.filter(b=>b.hostile).length,effects:this.effects.length}};}
}
