import{BASTION_BARRAGE,barrageVolley,barrageNextGap}from'./bastion-barrage';
import{BOSS_WEAVE,isWeaveBoss,weaveVolley}from'./boss-weave';
import{WING_SHEAR,wingShearVolley}from'./wing-shear';
import {CONTROL_SHUTTER,shutterClosed,type ShutterState}from'./control-shutter';
import {BANKSHOT} from './bankshot';
import {BOOSTER} from './booster';
import{MINELAYER,minelayerMuzzles}from'./minelayer';
import{RAKE,rakeVelocity,rakeMuzzle}from'./rake-gun';
import {FIRE_CONTROL,fireControlHolding,fireControlSource,patrolControl} from './fire-control';
import {LOCKSHOT,FORKSHOT,lockshotProfile,lockshotLeaving} from './lockshot';
import {driftOffset} from './drift-supply';
import {SUPPLY_CONVOY} from './supply-convoy';
import {batteryHolding} from './battery';
import {heavyEscortHolding} from './heavy-escorts';
import {SWEEPER,sweeperDirection} from './sweeper';
import {RELAY_SCREEN,ROTATING_SHIELD} from './relay-screen';
import {REBOUND,reboundState} from './rebound-charger';
import {BOSS_COUNTER,counterMuzzles,counterAttack,counterSequence,counterVolley} from './boss-counter';
import { HUNTER } from './contracts';
import { ESCORT } from './boss-formations';
import type { Body, Phase } from './world';
import { C, clamp } from './config';
import {CONDUIT} from './conduit';
import {MOBILE_SENTRY,sentryDestination} from './mobile-sentry';
import {INTERCEPTOR,interceptorMuzzles} from './interceptor';
import {advanceAce} from './ace-duo';
export type EnemyShot = (x: number, y: number, vx?: number, vy?: number) => void;
export const guardClosed = (b: Pick<Body, 'kind' | 'burst' | 'empRemaining'> & ShutterState) => shutterClosed(b)||(b.kind === 'guard' && b.burst === 0 && !(b.empRemaining??0));

export const guardDamageScale=(b:Pick<Body,'kind'|'burst'|'empRemaining'|'shieldTurn'> & ShutterState)=>shutterClosed(b)?CONTROL_SHUTTER.closedScale:guardClosed(b) ? (b.shieldTurn===undefined ? .5 : ROTATING_SHIELD.closedScale) : 1;

export function fanWarningVelocities(b: Body) {
  if (b.kind === 'guard') return [-70, 0, 70];
  return b.kind === 'elite' ? b.burst ? [-50, 0, 50] : [-100, -50, 0, 50, 100] : [-100, 0, 100];
}

export function bossWarningLanes(b: Body) {
  if (b.attack === 3) return [80, 150, 220, 290, 360, 430, 500, 570, 640].filter(x => Math.abs(x - b.lane) >= 110);
  if (b.attack === 2) return [200, 520];
  return b.attack ? b.burst ? [360] : [b.lane, 360] : [b.lane];
}

/** Chapters have different pressure/recovery phrases, not one shared playlist. */
export function bossAttackForCycle(variant: number | undefined, cycle: number,counterfire=false) {
  if(counterfire)return counterAttack(variant,cycle);
  if (variant === 1) return [2, 1, 2, 0][((cycle - 2) % 4 + 4) % 4];
  if (variant === 2) return [3, 0, 3, 1][((cycle - 3) % 4 + 4) % 4];
  return cycle % 2;
}

/** Shared by the live simulation and conservative no-kill route forecast. */
export function advanceBody(b: Body, dt: number, phase: Phase, phaseTime: number, emit: EnemyShot, formation:readonly Body[]=[]) {
  // Instant weapons resolve before movement: a killed emitter cannot launch a new volley.
  if(!b.active)return;
  patrolControl(b,dt);
  if(b.pattern==='fire-control'&&b.kind==='armor')b.controlLinked=!!fireControlSource(b,formation);
  const scale=b.shotScale??1;
  const shot:EnemyShot=scale===1?emit:(x,y,vx=0,vy=280)=>emit(x,y,vx*scale,vy*scale);
  if(b.dropGrace!==undefined)b.dropGrace=Math.max(0,b.dropGrace-dt);
  const offline=(b.empRemaining??0)>0;
  if(offline)b.empRemaining=Math.max(0,b.empRemaining!-dt);
  b.age += dt; b.hit = Math.max(0, b.hit - dt);
  if (b.kind === 'boss' && phase !== 'boss') return;
  if(!offline)b.timer -= dt;
  // Top-entry shooters reach a fully visible station before charging. Keep the
  // opening clock and use this same movement in the route forecast.
  if(b.deploying){
    b.y=Math.min(C.shooterEntry.stationY,b.y+C.shooterEntry.speed*dt);
    if(b.y>=C.shooterEntry.stationY)b.deploying=false;
    return;
  }
  if(b.kind==='crate'&&b.pattern==='drift-supply'){b.x=b.lane+driftOffset(b.age);b.y+=b.speed*dt;return;}
  if (b.kind === 'boss') {
    if(!b.counterfire&&b.hp<=b.maxHp*BOSS_COUNTER.health){
      b.counterfire=true;b.counterReady=true;
      if(!b.warning&&!b.burst)b.timer=Math.min(b.timer,BOSS_COUNTER.lead);
    }
    b.x = 360 + Math.sin(phaseTime * 0.4) * 65;
    if (b.timer <= 1e-9) {
      const finish = (elapsed=0) => {
        b.warning = 0; b.burst = 0; b.attackCycle++;
        b.timer = b.counterReady?BOSS_COUNTER.lead:b.counterfire?BOSS_COUNTER.recovery-elapsed:Math.max(.1,(phaseTime-elapsed > 35 ? 3.5 : 2.8)-elapsed);
      };
      const sequencedCounter=()=>{
        const beat=b.counterBeat??0,p=counterSequence(b.bossVariant);
        b.counterShotBeat=beat;b.counterShotAge=b.age;
        for(const s of counterVolley(b,beat))shot(s.x,s.y,s.vx,s.vy);
        b.warning=0;
        if(beat+1<p.beats){b.counterBeat=beat+1;b.burst=1;b.timer=p.spacing;}
        else{b.counterBeat=0;b.counterVolleys=(b.counterVolleys??0)+1;finish(p.spacing*(p.beats-1));}
      };
      const weave=()=>{
        const beat=b.weaveBeat??0;b.weaveShotBeat=beat;b.weaveShotPhrase=b.weaveVolleys??0;
        for(const s of weaveVolley(b,beat))shot(s.x,s.y,s.vx,s.vy);
        b.warning=0;
        if(beat+1<BOSS_WEAVE.beats){b.weaveBeat=beat+1;b.burst=1;b.timer=BOSS_WEAVE.spacing;}
        else{b.weaveBeat=0;b.weaveVolleys=(b.weaveVolleys??0)+1;finish(BOSS_WEAVE.spacing*(BOSS_WEAVE.beats-1));}
      };
      const wingShear=()=>{
        const beat=b.wingBeat??0;b.wingShotBeat=beat;b.wingShotAge=b.age;
        for(const s of wingShearVolley(b,beat))shot(s.x,s.y,s.vx,s.vy);
        b.warning=0;
        if(beat+1<WING_SHEAR.beats){b.wingBeat=beat+1;b.burst=1;b.timer=WING_SHEAR.spacing;}
        else{b.wingBeat=0;b.wingVolleys=(b.wingVolleys??0)+1;finish(WING_SHEAR.spacing*(WING_SHEAR.beats-1));}
      };
      const bastionBarrage=()=>{
        const beat=b.barrageBeat??0;b.barrageLane??=b.lane;b.barrageShotBeat=beat;
        for(const s of barrageVolley(b,beat)){b.barrageShotPort=s.port;shot(s.x,s.y,s.vx,s.vy);}
        b.burst=1;
        if(beat===0){b.barrageBeat=1;b.lane=barrageNextGap(b.barrageLane);b.warning=BASTION_BARRAGE.spacing;b.timer=BASTION_BARRAGE.echo;}
        else if(beat===1){b.barrageBeat=2;b.warning=BASTION_BARRAGE.spacing-BASTION_BARRAGE.echo;b.timer=b.warning;}
        else if(beat===2){b.barrageBeat=3;b.warning=0;b.timer=BASTION_BARRAGE.echo;}
        else{b.barrageBeat=0;b.barrageVolleys=(b.barrageVolleys??0)+1;finish(BASTION_BARRAGE.echo);}
      };
      if (b.burst) {
        if(b.attack===0&&isWeaveBoss(b)){weave();return;}
        if(b.attack===3&&b.bossVariant===2){bastionBarrage();return;}
        if(b.attack===2&&b.bossVariant===1){wingShear();return;}
        if(b.attack===4&&(b.bossVariant===1||b.bossVariant===2)){sequencedCounter();return;}
        if (b.attack === 3) {
          for (const x of bossWarningLanes(b)) for (let i = 0; i < 2; i++) shot(x, b.y + 90 - i * 75, 0, 280);
        } else for (let i = 0; i < 3; i++) shot(360, b.y + 90 - i * 60, 0, 300);
        finish();
      } else if (b.warning <= 0) {
        b.attack=b.counterReady?4:bossAttackForCycle(b.bossVariant,b.attackCycle,!!b.counterfire);b.counterReady=false;
        if(b.attack===0&&isWeaveBoss(b))b.weaveBeat=0;
        if(b.attack===4&&(b.bossVariant===1||b.bossVariant===2))b.counterBeat=0;
        if(b.attack===2&&b.bossVariant===1)b.wingBeat=0;
        if(b.attack===3&&b.bossVariant===2){b.barrageBeat=0;b.barrageLane=undefined;}
        b.warning = b.attack===4?BOSS_COUNTER.warning:1.35; b.timer = b.warning;
        // Advance only after an attack finishes, so delayed warnings cannot
        // accidentally repeat/skip a pattern. B alternates left/right sweep.
        b.lane = b.attack === 3 ? [140, 360, 580][Math.floor(b.attackCycle / 4) % 3]
          : b.attack ? Math.floor(b.attackCycle / 2) % 2 ? 520 : 200
          : [200, 360, 520][Math.floor(b.attackCycle / 2) % 3];
      } else {
        if(b.attack===4){
          if(b.bossVariant===1||b.bossVariant===2){sequencedCounter();return;}
          for(const muzzle of counterMuzzles(b))for(const vx of BOSS_COUNTER.vx)shot(muzzle.x,muzzle.y,vx,BOSS_COUNTER.vy);
          b.counterVolleys=(b.counterVolleys??0)+1;b.counterShotAge=b.age;finish();
        }else if (b.attack === 3) {
          if(b.bossVariant===2){bastionBarrage();return;}
          for (const x of bossWarningLanes(b)) for (let i = 0; i < 2; i++) shot(x, b.y + 90 - i * 75, 0, 280);
          // Only the third chapter locks twice. Advertise the adjacent new gap
          // before the second volley; never move an already-fired projectile.
          b.lane = b.lane === 360 ? 580 : 360;
          b.burst = 1; b.warning = 1.8; b.timer = 1.8;
        } else if (b.attack === 2) {
          if(b.bossVariant===1){wingShear();return;}
          for (const x of [200, 520]) for (let i = 0; i < 4; i++) shot(x, b.y + 90 - i * 50, 0, 300);
          finish();
        } else if (!b.attack) {
          if(isWeaveBoss(b)){weave();return;}
          for (let i = 0; i < 5; i++) shot(b.lane, b.y + 90 - i * 45, 0, 320);
          finish();
        } else {
          for (let i = 0; i < 3; i++) shot(b.lane, b.y + 90 - i * 60, 0, 300);
          // Both lanes were advertised for 1.35s. Keep the second lane visible
          // through the actual 350ms separation; the other outer lane is safe.
          b.burst = 1; b.warning = 0.35; b.timer = 0.35;
        }
      }
    }
  } else if (b.kind === 'guard') {
    if(b.pattern==='relay-screen'&&b.age<RELAY_SCREEN.hold){if(b.y<RELAY_SCREEN.guardY)b.y=Math.min(RELAY_SCREEN.guardY,b.y+b.speed*dt);}
    else if(b.pattern==='convoy'&&b.age<(b.convoyHold??SUPPLY_CONVOY.hold)){if(b.y<SUPPLY_CONVOY.y)b.y=Math.min(SUPPLY_CONVOY.y,b.y+b.speed*dt);}
    else if(b.escort&&b.age<(b.escortHold??ESCORT.holdSeconds)){if(b.y<ESCORT.hoverY)b.y=Math.min(ESCORT.hoverY,b.y+b.speed*dt);}
    else b.y += b.speed * dt;
    if (b.y >= 650) { b.warning = 0; b.burst = 0; }
    else if (b.y > 0 && b.timer <= 1e-9 && !offline) {
      if (!b.burst) { b.burst = 1; b.warning = 0.8; b.timer = 0.8; }
      else if (b.burst === 1) {
        for (const vx of fanWarningVelocities(b)) shot(b.x, b.y + b.height / 2, vx, 280);
        b.warning = 0; b.burst = 2; b.timer = 0.8;
      } else { b.burst = 0; b.timer = 2.4; }
    }
  } else if(b.kind==='sniper'&&b.pattern==='lockshot'){
    if(lockshotLeaving(b)){b.warning=0;b.burst=0;b.y+=LOCKSHOT.exitSpeed*dt;return;}
    if(b.y<320){b.y=Math.min(320,b.y+b.speed*dt);b.timer=LOCKSHOT.opening;return;}
    if(b.timer<=1e-9&&!offline){
      if(b.warning<=0&&(!b.burst||b.forkshot)){b.warning=b.forkshot&&(b.lockShots??0)>0?FORKSHOT.warning:(b.lockWarning??LOCKSHOT.warning);b.timer=b.warning;}
      else {const p=lockshotProfile(b);b.warning=0;b.burst=1;shot(p.x,p.y,p.vx,p.vy);b.lockShots=(b.lockShots??0)+1;b.timer=b.forkshot?FORKSHOT.recovery:LOCKSHOT.spacing;}
    }
  } else if (b.kind === 'sniper') {
    const destination=sentryDestination(b);
    if(destination!==undefined)b.x+=clamp(destination-b.x,-MOBILE_SENTRY.speed*dt,MOBILE_SENTRY.speed*dt);
    // A short-lived firing position: kill during charge or leave its fixed lane.
    // Leaving after ten seconds prevents an unkillable off-axis stall at boss entry.
    if (b.age >= 10) { b.warning = 0; b.y += 220 * dt; }
    else if (b.y < 320) { b.y = Math.min(320, b.y + b.speed * dt); b.timer = 0.6; }
    else if (b.timer <= 1e-9 && !offline) {
      if (b.warning <= 0) { b.warning = 1.2; b.timer = 1.2; }
      else {
        for (let i = 0; i < 3; i++) shot(b.x, b.y + 58 - i * 45, 0, 620);
        if(b.pattern==='relocate')b.sentryVolleys=(b.sentryVolleys??0)+1;
        b.warning = 0; b.timer = 2.4;
      }
    }
  } else if(b.kind==='armor'&&b.pattern==='bankshot'){
    if(b.age>=BANKSHOT.hold)b.y+=b.speed*dt;
    if(b.y>=600){b.warning=0;return;}
    if(b.timer<=1e-9&&!offline){if(b.warning<=0){b.warning=BANKSHOT.warning;b.timer=b.warning;}else{b.warning=0;shot(b.x,b.y+b.height/2,Math.sign(b.x-360)*BANKSHOT.vx,BANKSHOT.vy);b.timer=BANKSHOT.recovery;}}
  } else if(b.kind==='conduit'){
    if(b.pattern==='fire-control'){if(!fireControlHolding(b))b.y+=b.speed*dt;return;}
    if(b.age<CONDUIT.holdSeconds){if(b.y<CONDUIT.hoverY)b.y=Math.min(CONDUIT.hoverY,b.y+b.speed*dt);}
    else b.y+=b.speed*dt;
  } else if (b.kind === 'charger') {
    if(b.pattern==='rebound'){
      b.reboundOrigin??=b.x;const state=reboundState(b);b.warning=state.warning;b.speed=state.speed;
      if(state.dashing)b.x+=clamp(state.destination-b.x,-REBOUND.lateralSpeed*dt,REBOUND.lateralSpeed*dt);
      b.y+=b.speed*dt;return;
    }
    if (b.age > C.chargerBehavior.warningAge && b.age < C.chargerBehavior.dashAge) b.warning = C.chargerBehavior.dashAge - b.age;
    if (b.age >= C.chargerBehavior.dashAge) {
      b.warning = 0; b.speed = C.chargerBehavior.dashSpeed;
      if (b.pattern === 'flank') b.x += clamp(b.lane - b.x, -240 * dt, 240 * dt);
    }
    b.y += b.speed * dt;
  } else if(b.kind==='elite'&&b.pattern==='intercept'){
    b.y+=b.speed*dt;
    if(b.y>=600){b.warning=0;b.burst=0;b.interceptCoreRemaining=0;return;}
    if(b.timer<=1e-9&&!offline){
      if((b.interceptCoreRemaining??0)>0){
        shot(b.x,b.y+b.height/2,0,INTERCEPTOR.coreVy);b.interceptCoreRemaining=(b.interceptCoreRemaining??0)-1;
        if(!b.interceptCoreRemaining)b.burst=0;
        b.timer=b.interceptCoreRemaining?INTERCEPTOR.coreSpacing:INTERCEPTOR.recovery;
      }
      else if(b.warning<=0){b.warning=b.burst?INTERCEPTOR.coreWarning:INTERCEPTOR.wingWarning;b.timer=b.warning;}
      else {
        if(b.burst){shot(b.x,b.y+b.height/2,0,INTERCEPTOR.coreVy);b.interceptCoreRemaining=2;b.timer=INTERCEPTOR.coreSpacing;}
        else {for(const muzzle of interceptorMuzzles(b))shot(muzzle.x,muzzle.y,Math.sign(muzzle.x-b.x)*INTERCEPTOR.wingVx,INTERCEPTOR.wingVy);b.burst=1;b.timer=INTERCEPTOR.between;}
        b.warning=0;
      }
    }
  } else if(b.kind==='armor'&&b.pattern==='minelayer'){
    if(b.mineSpent||b.age>=MINELAYER.hold)b.y+=b.speed*dt;
    if(b.mineSpent||b.y>=600){b.warning=0;return;}
    if(b.timer<=1e-9&&!offline){
      if(b.warning<=0){b.warning=MINELAYER.warning;b.timer=b.warning;}
      else{for(const s of minelayerMuzzles(b))shot(s.x,s.y,s.vx,s.vy);b.mineSpent=true;b.warning=0;}
    }
  } else if(b.kind==='armor'&&b.pattern==='booster'){
    if(b.boosterSpent||b.age>=BOOSTER.hold)b.y+=b.speed*dt;
    if(b.boosterSpent){b.warning=0;return;}
    if(b.y>=600){b.warning=0;b.burst=0;return;}
    if(b.timer<=1e-9&&!offline){
      if(!b.burst&&b.warning<=0){b.warning=BOOSTER.warning;b.timer=BOOSTER.warning;}
      else{
        const side=b.burst?1:-1;shot(b.x+side*BOOSTER.muzzle,b.y+b.height/2,side*BOOSTER.vx,BOOSTER.vy);
        b.boosterSpent=!!b.burst;b.burst=b.burst?0:1;b.warning=0;b.timer=b.burst?BOOSTER.spacing:0;
      }
    }
  } else if(b.kind==='armor'&&b.pattern==='rake'){
    b.y+=b.speed*dt;
    if(b.y>=600){b.warning=0;b.rakeFiring=false;return;}
    if(b.timer<=1e-9&&!offline){
      if(!b.rakeFiring&&b.warning<=0){b.warning=RAKE.warning;b.timer=RAKE.warning;}
      else{
        const volley=b.rakeVolley??0,muzzle=rakeMuzzle(b),vx=rakeVelocity(b.x,volley);
        for(const spread of[-RAKE.spread,0,RAKE.spread])shot(muzzle.x,muzzle.y,vx+spread,RAKE.vy);
        b.rakeVolley=(volley+1)%3;b.rakeFiring=volley<2;b.warning=0;b.timer=volley<2?RAKE.spacing:RAKE.recovery;
      }
    }
  } else {
    if(b.pattern==='sweep')b.x+=sweeperDirection(b)*Math.min(Math.abs(b.lane-b.x),SWEEPER.speed*dt);
    if (b.kind === 'drone' && b.pattern === 'weave') b.x = clamp(b.lane + Math.sin(b.age * 2) * 70, C.minX, C.maxX);
    if(b.kind==='elite'&&b.bountyRound!==undefined&&b.age<HUNTER.holdSeconds){if(b.y<HUNTER.hoverY)b.y=Math.min(HUNTER.hoverY,b.y+b.speed*dt);}
    else if(!batteryHolding(b)&&!fireControlHolding(b)&&!heavyEscortHolding(b))b.y += b.speed * dt;
    if ((b.kind === 'armor' || b.kind === 'elite') && b.y > 0 && b.y < 600) {
      if(b.aceRole){advanceAce(b,offline,shot);return;}
      if (b.timer <= 1e-9 && !offline) {
        if (b.warning <= 0) { b.warning = b.pattern==='fire-control'?FIRE_CONTROL.warning:.6; b.timer = b.warning; }
        else {
          if (b.pattern === 'fan'||b.pattern==='sweep'||b.pattern==='battery'||(b.pattern==='fire-control'&&b.controlLinked)) for (const vx of b.kind === 'elite' && b.burst ? [-50, 0, 50] : [-100, 0, 100]) shot(b.x, b.y + b.height / 2, vx, 280);
          else shot(b.x, b.y + b.height / 2);
          if (b.kind === 'elite' && b.pattern === 'fan' && !b.burst) {
            b.burst = 1; b.warning = 0.6; b.timer = 0.6;
          } else {
            if(b.controlShutter)b.controlOpenUntil=b.age+CONTROL_SHUTTER.openSeconds;
            b.burst = 0; b.warning = 0; b.timer = b.pattern==='fire-control'?(b.controlLinked?FIRE_CONTROL.boostedRecovery:FIRE_CONTROL.recovery):b.pattern === 'fan'||b.pattern==='battery' ? 3.2 : 2.4;
          }
        }
      }
    } else if (b.y >= 600) { b.warning = 0; b.burst = 0; }
  }
}
