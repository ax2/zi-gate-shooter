import {heavyEscorts} from './heavy-escorts';
import{applyMinelayer}from'./minelayer';
import {flankHunters} from './flank-hunters';
import {continuityReserves} from './continuity-reserves';
import {heavyCounterPush} from './heavy-counter-push';
import {vanguardPatrol,introPursuit} from './vanguard-patrol';
import{BOOSTER}from'./booster';
import {closingAssault} from './closing-assault';
import {openingAssaults} from './opening-assaults';
import {earlyReinforcements} from './early-reinforcements';
import {BANKSHOT,hasBankshot} from './bankshot';
import {chapterAssaults} from './chapter-assaults';
import {pursuitWaves} from './pursuit-waves';
import {FIRE_CONTROL,hasControlPatrol} from './fire-control';
import {LOCKSHOT,INTRO_LOCKSHOT} from './lockshot';
import {SUPPLY_CONVOY,hasSupplyConvoy} from './supply-convoy';
import {BATTERY} from './battery';
import {DRIFT_SUPPLY,hasDriftSupply} from './drift-supply';
import {SWEEPER} from './sweeper';
import {RELAY_SCREEN,hasRelayScreen,hasRotatingShields,ROTATING_SHIELD} from './relay-screen';
import {battleIndex,type BattlePlan} from './battle-plan';
import type { EnemyKind } from './config';
export interface Spawn { at: number; kind: EnemyKind | 'crate' | 'gates' | 'armory'; x: number; stage?: number; pair?: boolean; pattern?: 'weave' | 'flank' | 'fan' | 'relocate' | 'intercept' | 'rebound' | 'convoy' | 'sweep' | 'relay-screen' | 'battery' | 'drift-supply' | 'lockshot' | 'fire-control' | 'bankshot' | 'rake' | 'booster' | 'minelayer' | 'scissor'; lane?: number; opening?:number; openingAssault?:boolean; earlyReserve?:boolean;lateAssault?:boolean; closing?:boolean; shieldTurn?:0|1;forkshot?:boolean;convoy?:boolean; controlPatrol?:boolean; drop?:boolean; dropNotice?:boolean; dropY?:number; dropLabel?:string; dropDetail?:string; breach?:boolean; heavyReserve?:boolean;flankReserve?:boolean }
export const MID_GATE_AT=39;
export const INTRO_MID_GATE_AT=35;
export const INTRO_ARMORY_AT=46.5;
export const INTRO_ESCORT={originalAt:42,at:43.5,x:500,gunY:340,guardY:550,hold:2} as const;
export const AMMO_TRIAL={at:24.5,troops:[{x:300,y:500},{x:300,y:330},{x:420,y:500}]} as const;
export const SWARM={arrivalY:360,grace:.45} as const;
// Light screens pass first; the armoured pair keeps a readable firing window.
export const ARMOURED_PACK={droneRows:[32,34.2,34.9],pairXs:[290,430],screenLead:1.4} as const;
export const sectorNames = ['突围走廊', '侧翼夹击', '重装封锁'];
export const sectorIndex = (round: number) => (Math.max(1, round) - 1) % 3;
export const encounterIndex = (round: number) => Math.floor((Math.max(1, round) - 1) / 3) % 3;
export class Random {
  constructor(public seed: number) {}
  next() { let x = this.seed | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.seed = x >>> 0; return this.seed / 4294967296; }
}
/** Authored, mirrored motifs. Every row leaves an independent, wide escape lane. */
export function timeline(round: number, seed: number,plan:BattlePlan=0): Spawn[] {
  const rng = new Random(seed || 1);
  const mirror = round > 1 && rng.next() > 0.5;
  const out: Spawn[] = [];
  const sector = sectorIndex(round);
  const encounter = battleIndex(round,plan);
  const add = (at: number, kind: Spawn['kind'], x: number, stage?: number, pair?: boolean, pattern?: Spawn['pattern'], lane?: number) =>
    out.push({ at, kind, x: mirror ? 720 - x : x, stage, pair, pattern, lane: lane === undefined ? undefined : mirror ? 720 - lane : lane });
  // Eight authored motifs: introduction, crate, single gate, paired gate,
  // alternating wave, elite pressure, equipment choice, release wave.
  if (sector === 0) [1, 3.5, 5.5].forEach((t, i) => add(t, 'drone', [360, 210, 510][i]));
  else if (sector === 1) {
    add(1, 'drone', 200, undefined, undefined, 'weave');
    add(2.2, 'drone', 520, undefined, undefined, 'weave');
    add(4.5, 'charger', 140, undefined, undefined, 'flank', 480);
  } else {
    add(1, 'armor', 360, undefined, undefined, 'fan');
    add(4, 'drone', 360); add(5.5, 'drone', 360);
  }
  const initialPatrol=out.slice();
  add(8, 'crate', 240, 2);
  add(16, 'armory', 360);
  add(15.5, 'drone', 500, undefined, undefined, sector === 1 ? 'weave' : undefined);
  add(17, 'drone', 360, undefined, undefined, sector === 1 ? 'weave' : undefined);
  add(20, 'gates', 360);
  add(27, 'gates', 360, undefined, true);
  if (encounter === 0) {
    if (sector === 0) for (let t = 34; t < 42; t += 1.4) {
      add(t, 'drone', [200, 360, 520][Math.floor(rng.next() * 3)]);
      add(t + 0.35, 'drone', [240, 480][Math.floor(rng.next() * 2)]);
    }
    if (sector === 0) { add(38, 'armor', 190); add(42, 'elite', 500); }
    else if (sector === 1) {
      for (const [time, x, lane] of [[31, 140, 480], [37, 580, 240], [43, 140, 480]]) add(time, 'charger', x, undefined, undefined, 'flank', lane);
      for (let t = 33; t < 42; t += 2) { add(t, 'drone', 230, undefined, undefined, 'weave'); add(t + .5, 'drone', 490, undefined, undefined, 'weave'); }
      add(32, 'sniper', 500); add(38, 'guard', 500); add(45, 'elite', 360, undefined, undefined, 'fan');
    } else {
      add(31, 'sniper', 180); add(35, 'guard', 540);
      add(40, 'elite', 360, undefined, undefined, 'fan');
      for (let t = 33; t < 43; t += 2.5) for (const x of [180, 540]) add(t, 'drone', x, undefined, undefined, 'weave');
    }
  } else if (sector === 0) {
    if (encounter === 1) {
      // Sentry escort: break the static gun before its mobile screen arrives.
      add(31, 'sniper', 220); add(32, 'drone', 220); add(33.5, 'drone', 220);
      add(36, 'charger', 520); add(39, 'armor', 520); add(42, 'drone', 360);
    } else {
      // Two separated pincers; the center remains available between charges.
      add(31, 'charger', 140, undefined, undefined, 'flank', 240);
      add(33, 'charger', 580, undefined, undefined, 'flank', 480);
      add(36, 'drone', 360); add(37, 'drone', 360);
      add(40, 'elite', 220); add(43, 'drone', 520);
    }
  } else if (sector === 1) {
    if (encounter === 1) {
      // Staggered stationary lanes with a moving central screen.
      add(31, 'sniper', 180); add(35, 'sniper', 540);
      for (const t of [32, 35, 38, 41]) add(t, 'drone', 360, undefined, undefined, 'weave');
      add(43, 'charger', 140, undefined, undefined, 'flank', 480);
    } else {
      add(31, 'elite', 500, undefined, undefined, 'fan');
      add(33, 'charger', 140, undefined, undefined, 'flank', 320);
      add(37, 'charger', 580, undefined, undefined, 'flank', 400);
      add(40, 'sniper', 180); add(43, 'drone', 500);
    }
  } else {
    if (encounter === 1) {
      // Central armor column rewards concentrated or piercing fire.
      add(31, 'guard', 360); add(33, 'armor', 360);
      add(36, 'sniper', 180); add(39, 'drone', 540); add(41, 'elite', 540);
    } else {
      // Alternating heavy lanes, with a lighter release after each anchor.
      add(31, 'elite', 180, undefined, undefined, 'fan'); add(34, 'drone', 540);
      add(37, 'armor', 540, undefined, undefined, 'fan'); add(40, 'drone', 180);
      add(42, 'sniper', 360);
    }
  }
  // Separate the middle combat reward from the late equipment pickup.
  add(round===1?INTRO_MID_GATE_AT:MID_GATE_AT, 'gates', 500);add(round===1?INTRO_ARMORY_AT:48, 'armory', 360, 3);
  add(58, 'gates', 360, undefined, true);
  if (sector === 0) for (let t = 62; t < 68; t += 1.2) {
    for (const x of [200, 360, 520]) add(t + Math.abs(360 - x) / 800, 'drone', x);
  }
  else if (sector === 1) for (let t = 61; t < 68; t += 1.5) { add(t, 'drone', 200, undefined, undefined, 'weave'); add(t + .4, 'drone', 520, undefined, undefined, 'weave'); }
  else { add(60, 'armor', 360, undefined, undefined, 'fan'); for (const t of [62, 64, 66]) for (const x of [200, 520]) add(t, 'drone', x, undefined, undefined, 'weave'); }
  if (round > 1 && sector === 0) { add(13, 'charger', 500); add(32, 'charger', 200); add(55, 'armor', 500); }
  // Coordinated pressure around supply windows. No damage-scaled health inflation.
  if(round===1){add(23,'charger',520);add(51,'sniper',180);add(54,'drone',180);}
  else {
    for(const [time,x] of [[10,180],[23,540],[50,180],[56,540]]){
      add(time,sector===2?'guard':'sniper',x);
      add(time+1.2,'drone',x,undefined,undefined,'weave');
      add(time+2.4,'charger',720-x,undefined,undefined,'flank',360);
    }
  }
  // From chapter two, armoured formations test the chosen ammunition geometry.
  // These ordinary authored spawns still use each admission's no-kill safety check.
  if(round>1){
    if(sector===2){add(35,'armor',220);add(36.5,'armor',220);}
    else for(const x of ARMOURED_PACK.pairXs)add(35,'armor',x);
    // The old light screen and the last drop row otherwise converge on the
    // deployed armour during its first charge. Keep their roster and motion.
    for(const spawn of out)if(spawn.kind==='drone'&&spawn.at>=33&&spawn.at<35)spawn.at-=ARMOURED_PACK.screenLead;
  }
  // Visible reinforcement packs, each leaving the outer road open. The existing
  // director still admits each actual body through its conservative route check.
  if(round>1){
    const rows=sector===0?[[240,300,360,420,480],[240,300,360,420,480],[240,300,360,420,480]]
      :sector===1?[[180,240,300],[420,480,540],[240,300,360,420,480]]
      :[[300,420],[300,420],[300,420]];
    rows.forEach((xs,row)=>xs.forEach((x,index)=>{
      add(ARMOURED_PACK.droneRows[row],'drone',x);out[out.length-1].drop=true;
      out[out.length-1].dropNotice=row===0&&index===0;
    }));
    // Fixed tactical phrases between supply windows. Front shields, rear guns
    // and vertical armour offer different aiming problems without scaling HP
    // to the player. Every body still passes the existing admission forecast.
    const reinforcement=(at:number,kind:EnemyKind,x:number,y:number,label?:string)=>{
      add(at,kind,x);Object.assign(out[out.length-1],{drop:true,dropY:y,dropLabel:label});
    };
    if(sector===0){
      reinforcement(44.5,'guard',360,440,'哨卫护航');reinforcement(44.5,'sniper',360,320);
      for(const x of [300,420])reinforcement(44.5,'drone',x,360);
      reinforcement(55.5,'guard',360,440,'护航补阵');for(const x of [300,420])reinforcement(55.5,'drone',x,360);
    }else if(sector===1){
      reinforcement(44.5,'sniper',240,360,'交叉哨阵');reinforcement(44.5,'sniper',480,360);
      for(const x of [300,420])reinforcement(44.5,'drone',x,420);
      reinforcement(55.5,'guard',360,440,'屏障增援');for(const x of [300,420])reinforcement(55.5,'drone',x,360);
    }else{
      reinforcement(44.5,'armor',300,440,'装甲突击');reinforcement(44.5,'armor',300,320);reinforcement(44.5,'charger',480,360);
      reinforcement(55.5,'armor',420,440,'穿甲纵列');reinforcement(55.5,'armor',420,320);reinforcement(55.5,'drone',300,360);
    }
    reinforcement(44.5,'conduit',sector===0?500:sector===1?360:540,sector===1?560:360);
    // Preserve the authored opening/tail roster, but let upgraded weapons meet
    // those enemies inside the visible battlefield before they can be erased.
    for(const spawn of out)if(spawn.kind in {drone:1,sniper:1,guard:1,charger:1,armor:1,elite:1}
      &&(spawn.at<=13||spawn.at>=60)){spawn.drop=true;spawn.dropY=SWARM.arrivalY;}
  }
  if(round===1){
    // The first equipment branch needs a real, compact group to demonstrate
    // its effect. The player still shoots the nearer gate before these units.
    for(const [i,t] of AMMO_TRIAL.troops.entries()){
      add(AMMO_TRIAL.at,'armor',t.x);Object.assign(out[out.length-1],{drop:true,dropY:t.y,
        dropLabel:i===0?'弹芯检验':undefined,dropDetail:'纵列与侧翼 · 可试贯穿、爆破或跳弹'});
    }
    // Keep the original tutorial roster/timing and make its machinery visible.
    // The first three simple targets appear higher than the later combat wave.
    for(const s of out)if(s.kind in {drone:1,sniper:1,guard:1,charger:1,armor:1,elite:1}
      &&(s.at<=17||s.at>=31)){s.drop=true;s.dropY=s.at<=17?320:s.kind==='armor'?500:SWARM.arrivalY;}
  }
  if(round>1){
    const sentry=out.filter(s=>s.kind==='sniper'&&s.at>=30&&s.at<44).sort((a,b)=>a.at-b.at)[0]
      ??out.find(s=>s.kind==='sniper'&&s.at>=50&&s.at<=56);
    if(sentry)Object.assign(sentry,{pattern:'relocate',lane:sentry.x,drop:true,dropY:SWARM.arrivalY,
      dropLabel:'机动哨机',dropDetail:'入场侧移抢位 · 齐射后再次换位'});
  }
  if(round>1){
    const elite=out.find(s=>s.kind==='elite');
    if(elite)Object.assign(elite,{pattern:'intercept',drop:true,dropY:SWARM.arrivalY,dropLabel:'截击精英',dropDetail:'翼炮压边 · 核心连射 · 蓄能可打断'});
  }
  if(round>1){
    const charger=out.filter(s=>s.kind==='charger'&&s.drop).sort((a,b)=>a.at-b.at)[0];
    if(charger)Object.assign(charger,{pattern:'rebound',lane:charger.x<360?480:240,dropLabel:'折返冲锋',dropDetail:'内切冲刺 · 再蓄能折返 · 注意机体转向'});
  }
  if(hasSupplyConvoy(round)){
    const armory=out.find(s=>s.kind==='armory'&&s.at===SUPPLY_CONVOY.armoryAt);
    // Keep the chapter's mobile sentry; use the other late pressure gun if needed.
    const guard=out.find(s=>s.at===50&&(s.kind==='sniper'||s.kind==='guard')&&s.pattern!=='relocate')
      ??out.find(s=>s.at===56&&(s.kind==='sniper'||s.kind==='guard')&&s.pattern!=='relocate');
    if(armory&&guard){armory.convoy=true;Object.assign(guard,{kind:'guard',at:SUPPLY_CONVOY.guardAt,x:360,pattern:'convoy',drop:true,dropY:SUPPLY_CONVOY.y,dropLabel:'补给护卫',dropDetail:'外侧补给二选一 · 中央盾卫驻守压制'});}
  }
  if(round>=4&&sector===0)for(const s of out)if(s.kind==='drone'&&s.at>=60){
    const row=Math.round((s.at-62)/1.2),center=s.x===360,armored=!center&&((s.x<360)!==!!(row%2));
    Object.assign(s,{kind:armored?(row%3===0?'elite':'armor'):'drone',at:58+row*2+(center?0:.2),drop:true,dropY:center?SWEEPER.centerY:(armored?SWEEPER.upperY:SWEEPER.lowerY),
      pattern:center?undefined:'sweep',lane:center?undefined:720-s.x,
      dropLabel:center&&row===0?'斜掠护航':undefined,dropDetail:center&&row===0?'护航横穿扇射 · 轻机分层斜掠 · 击破精英得充能':undefined});
  }
  if(hasRelayScreen(round))for(const s of out)if(s.at===RELAY_SCREEN.at){
    if(s.kind==='drone'){Object.assign(s,{kind:'guard',x:s.x<360?200:520,dropY:RELAY_SCREEN.guardY});if(hasRotatingShields(round))s.shieldTurn=s.x<360?0:1;}
    else if(s.kind==='sniper')Object.assign(s,{x:s.x<360?200:520,dropY:RELAY_SCREEN.sniperY});
    else if(s.kind==='conduit'){s.dropY=RELAY_SCREEN.conduitY;s.at+=hasRotatingShields(round)?ROTATING_SHIELD.relayDelay:RELAY_SCREEN.relayDelay;}
    s.pattern='relay-screen';
    if(s.dropLabel){s.dropLabel=hasRotatingShields(round)?'轮换盾阵':'双盾哨阵';s.dropDetail=hasRotatingShields(round)?'追开盾窗口转火 · 或击破中继同时开盾':'前盾后哨 · 中路中继可击破停火开盾';}
  }
  if(round%3===0){
    const guns=out.filter(s=>s.at===BATTERY.at&&s.kind==='armor');
    guns.forEach((s,i)=>Object.assign(s,{x:i===0?(mirror?500:220):(mirror?220:500),at:BATTERY.at+i*BATTERY.delay,dropY:BATTERY.y,pattern:'battery',dropLabel:i===0?'交替炮阵':undefined,dropDetail:i===0?'左右驻炮错时扇射 · 中路中继可击破停火':undefined}));
    const relay=out.find(s=>s.at===BATTERY.at&&s.kind==='conduit');
    if(relay)Object.assign(relay,{x:360,at:BATTERY.at+BATTERY.relayDelay,dropY:BATTERY.relayY,pattern:'battery'});
  }
  if(hasDriftSupply(round)){const supply=out.find(s=>s.kind==='armory'&&s.at===DRIFT_SUPPLY.at);if(supply)supply.pattern='drift-supply';}
  if(round>1&&sector===1){const gun=out.find(s=>s.kind==='sniper'&&s.at===LOCKSHOT.at);if(gun){Object.assign(gun,{pattern:'lockshot',drop:true,dropY:LOCKSHOT.y,dropLabel:'斜射哨机',dropDetail:'锁定入场位置 · 蓄能可打断 · 三连弹后撤离'});if(encounter>0)Object.assign(gun,{forkshot:true,dropLabel:'三角哨机',dropDetail:'首弹锁位 · 两侧错时射击 · 抢先拆炮或等实弹通过'});}}
  if(round%3===0){
    const group=out.filter(s=>s.at===FIRE_CONTROL.at),guns=group.filter(s=>s.kind==='armor');
    guns.forEach((s,i)=>Object.assign(s,{x:mirror?720-FIRE_CONTROL.gunX:FIRE_CONTROL.gunX,dropY:FIRE_CONTROL.gunYs[i],pattern:'fire-control',dropLabel:undefined,dropDetail:undefined}));
    const relay=group.find(s=>s.kind==='drone');
    if(relay)Object.assign(relay,{kind:'conduit',x:mirror?720-FIRE_CONTROL.relayX:FIRE_CONTROL.relayX,dropY:FIRE_CONTROL.relayY,pattern:'fire-control',dropLabel:'火控中继编队',dropDetail:'中继增幅双炮 · 击破可停火断供'});
    if(hasControlPatrol(round)){
      if(guns[1])guns[1].controlPatrol=true;
      if(relay){relay.dropLabel='游弋火控';relay.dropDetail='后炮横移 · 越界失去增幅 · 中继可拆';}
    }
    const screen=out.find(s=>s.kind==='guard'&&s.at===56);if(screen)screen.x=mirror?720-FIRE_CONTROL.screenX:FIRE_CONTROL.screenX;
  }
  if(hasBankshot(round)){const guns=out.filter(s=>s.kind==='armor'&&s.at===BANKSHOT.at);guns.forEach((s,i)=>Object.assign(s,{x:mirror?720-BANKSHOT.xs[i]:BANKSHOT.xs[i],pattern:'bankshot',drop:true,dropY:BANKSHOT.y,dropLabel:i===0?'折返炮阵':undefined,dropDetail:'外射弹沿场边反弹一次 · 抢拆炮台或看实弹换位'}));}
  if(round===1){
    const elite=out.find(s=>s.kind==='elite'&&s.at===INTRO_ESCORT.originalAt);
    if(elite){Object.assign(elite,{at:INTRO_ESCORT.at,pattern:'fan',drop:true,dropY:INTRO_ESCORT.gunY,dropLabel:'门后护炮',dropDetail:'前盾挡枪 · 后炮扇射 · 打门后换位领取'});out.push({at:INTRO_ESCORT.at,kind:'guard',x:INTRO_ESCORT.x,pattern:'convoy',drop:true,dropY:INTRO_ESCORT.guardY});}
    const gun=out.find(s=>s.kind==='sniper'&&s.at===INTRO_LOCKSHOT.at);if(gun)Object.assign(gun,{pattern:'lockshot',dropLabel:'锁位三连',dropDetail:'蓄能时抢先拆炮 · 或避过三连再反击'});
  }
  if(sector===0){const gun=out.find(s=>s.kind==='armor'&&[38,39,55].includes(s.at)&&!s.pattern);if(gun)Object.assign(gun,{pattern:'booster',drop:true,dropY:round===1?500:350,opening:BOOSTER.opening,dropLabel:'脉冲火箭炮',dropDetail:'火箭先缓行再加速 · 抢拆炮机或看实弹换位'});}
  out.push(...chapterAssaults(round,mirror,encounter));
  out.push(...openingAssaults(round,mirror,encounter));
  out.push(...earlyReinforcements(round,mirror,encounter));
  out.push(...pursuitWaves(round,mirror,encounter));
  out.push(...closingAssault(round,mirror,plan));
  out.push(...heavyCounterPush(round,mirror,encounter));
  out.push(...continuityReserves(round,mirror,encounter));
  out.push(...flankHunters(round,mirror,encounter));
  out.push(...heavyEscorts(round,mirror,encounter));
  applyMinelayer(out,round);
  // Replace only the original three patrol slots after legacy transformations.
  // Later encounters retain their original target selection and authored data.
  return [...out.filter(s=>!initialPatrol.includes(s)),...vanguardPatrol(round,mirror),...(round===1?introPursuit():[])].sort((a,b)=>a.at-b.at);
}
