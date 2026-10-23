export type BossCoreKind='barrage'|'crossbeam'|'minefield';
export interface BossCorePhase{parent:number;sector:number;kind:BossCoreKind;entered:number;casts:number;rounds:number;beams:number;mines:number;lastShot:number;lastPort:number;lastAim?:number;lastAttack:'fan'|'ring'|'beam'|'mines'|'';ended:boolean}
export const bossCoreRules={threshold:.5,warmup:.9,fanCount:5,fanSpread:.13,fanSpeed:260,fanInterval:1.15,ringCount:10,ringSpeed:175,ringInterval:1.65,beamLock:.7,beamLife:.24,beamWidth:12,beamInterval:1.7,laserRingCount:8,mineInterval:2.6,minePulseInterval:1.8,minePulseSpeed:165,minePulseCount:8,collapseLife:1.25}as const;
export const bossCoreSpec=(sector:number)=>({kind:(['barrage','crossbeam','minefield']as const)[sector%3],name:['交错炮阵','定点光袭','雷区封锁'][sector%3],brief:['双炮交替压制 · 每第三轮扩散绿弹','锁定后移位 · 双侧轮流发射','抢拆实雷 · 爆炸可连锁伤敌'][sector%3]});
export const bossCorePort=(state:BossCorePhase)=>state.casts%2===0?-1:1;
export const bossCoreMuzzle=(at:{x:number;y:number},side:number)=>({x:at.x+side*90,y:at.y+40});
