import type { EnemyKind } from './config';
export interface Spawn { at: number; kind: EnemyKind | 'crate' | 'gates' | 'armory'; x: number; stage?: number; pair?: boolean; pattern?: 'weave' | 'flank' | 'fan'; lane?: number; drop?:boolean; dropNotice?:boolean; dropY?:number; dropLabel?:string }
export const SWARM={arrivalY:360,grace:.45} as const;
export const sectorNames = ['突围走廊', '侧翼夹击', '重装封锁'];
export const sectorIndex = (round: number) => (Math.max(1, round) - 1) % 3;
export const encounterIndex = (round: number) => Math.floor((Math.max(1, round) - 1) / 3) % 3;
export class Random {
  constructor(public seed: number) {}
  next() { let x = this.seed | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.seed = x >>> 0; return this.seed / 4294967296; }
}
/** Authored, mirrored motifs. Every row leaves an independent, wide escape lane. */
export function timeline(round: number, seed: number): Spawn[] {
  const rng = new Random(seed || 1);
  const mirror = round > 1 && rng.next() > 0.5;
  const out: Spawn[] = [];
  const sector = sectorIndex(round);
  const encounter = encounterIndex(round);
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
  add(48, 'armory', 360, 3); add(49.2, 'gates', 500);
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
    else {add(35,'armor',300);add(35,'armor',420);}
  }
  // Visible reinforcement packs, each leaving the outer road open. The existing
  // director still admits each actual body through its conservative route check.
  if(round>1){
    const rows=sector===0?[[240,300,360,420,480],[240,300,360,420,480],[240,300,360,420,480]]
      :sector===1?[[180,240,300],[420,480,540],[240,300,360,420,480]]
      :[[300,420],[300,420],[300,420]];
    rows.forEach((xs,row)=>xs.forEach((x,index)=>{
      add(32+row*2.2,'drone',x);out[out.length-1].drop=true;
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
    // Preserve the authored opening/tail roster, but let upgraded weapons meet
    // those enemies inside the visible battlefield before they can be erased.
    for(const spawn of out)if(spawn.kind in {drone:1,sniper:1,guard:1,charger:1,armor:1,elite:1}
      &&(spawn.at<=13||spawn.at>=60)){spawn.drop=true;spawn.dropY=SWARM.arrivalY;}
  }
  return out.sort((a, b) => a.at - b.at);
}
