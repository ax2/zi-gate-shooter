import type {Body} from './world';
export const MOBILE_SENTRY={distance:140,speed:200,moveUntil:1.2,deploySeconds:.9} as const;
/** Current deployment/post-volley movement only; never a predicted projectile path. */
export function sentryDestination(b:Body){
  if(b.kind!=='sniper'||b.pattern!=='relocate'||b.warning>0||b.age>=10||b.y<320)return undefined;
  const volleys=b.sentryVolleys??0;
  if(volleys===0?b.age>=MOBILE_SENTRY.deploySeconds:b.timer<=MOBILE_SENTRY.moveUntil)return undefined;
  return b.lane+(volleys%2===0?(b.lane>=360?-1:1)*MOBILE_SENTRY.distance:0);
}
export function sentryDirection(b:Body){const x=sentryDestination(b);return x===undefined||Math.abs(x-b.x)<.5?0:Math.sign(x-b.x);}
