import{World}from'../src/core/world';import{runDefaultPressure}from'../tests/helpers/default-pressure-driver';import{observedNoFireRoute}from'../tests/helpers/observed-route-driver';import{writeFileSync,mkdirSync}from'node:fs';
const out=process.env.CLOSING_AUDIT_OUT??'build/qa/Stage-256',mode=process.argv[2],path='./baseline.mjs',Before=(await import(path)).World as typeof World;
mkdirSync(out,{recursive:true});
if(mode==='routes'){
 const rows=[];for(const round of[4,5,6])for(const plan of[0,1,2]as const)for(const start of[68,360,652]){const row=observedNoFireRoute(round,plan,start);rows.push(row);writeFileSync(out+'/routes.json',JSON.stringify({complete:false,rows},null,2));console.log(JSON.stringify(row));}
 writeFileSync(out+'/routes.json',JSON.stringify({complete:true,rows},null,2));if(rows.some(r=>r.failureTime!==null||r.hp!==3||r.phase!=='boss-entry'||r.unknownEmitterBullets))throw Error('Inspect retained route failures');
}else{
 mkdirSync(out+'/normal',{recursive:true});const rows=[];
 for(const route of['ballistic','electric','optical']as const)for(const plan of[0,1,2]as const){const pair:any={route,plan};for(const[label,Runtime]of[['before',Before],['after',World]]as const){
  const terminal:any[]=[];let current:any=null;
  class Observe extends Runtime{drainEffects(){const events=super.drainEffects();for(const e of events){if(e.type==='drop-wave'&&e.text?.startsWith('终线')){current={round:this.round,start:this.time,label:e.text,ids:this.bodies.filter(b=>b.active).map(b=>b.id),rewarded:false};terminal.push(current);}if(e.type==='closing-clear'&&current){current.rewarded=true;current.clear=this.time;current.receipt=e.text;}}
   if(current&&current.end===undefined&&this.phase!=='running'){current.end=this.time;current.seconds=this.time-current.start;current.kills=(this as any).closingStatus?.kills??null;current.hp=this.player.hp;}
   return events;}}
  const result={...runDefaultPressure(Observe,route,'safe',450,'auto',plan),terminal};pair[label]=result;writeFileSync(`${out}/normal/${route}-p${plan}-${label}.json`,JSON.stringify(result));console.log(JSON.stringify({route,plan,label,time:result.time,round:result.round,hp:result.hp,mastery:result.mastery,pickups:result.pickups,gates:result.gates,terminal}));
 }rows.push(pair);writeFileSync(out+'/normal/combined.json',JSON.stringify({complete:false,method:'Earned progression, omniscient pointer; not human difficulty or FPS',rows}));}
 writeFileSync(out+'/normal/combined.json',JSON.stringify({complete:true,method:'Earned progression, omniscient pointer; not human difficulty or FPS',rows}));
}
