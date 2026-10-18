import{readFile}from'node:fs/promises';
import{execFileSync}from'node:child_process';import path from'node:path';
/** Isolated prototype patch; the baseline full run keeps its existing sources. */
export function bossSalvageCandidate(baseline=false){
 const source=async a=>baseline?execFileSync('git',['show',`9158c27:${path.relative(process.cwd(),a.path).replaceAll('\\','/')}`],{encoding:'utf8',maxBuffer:8e6}):await readFile(a.path,'utf8');
 return{name:'boss-salvage-candidate',setup(b){b.onLoad({filter:/[\\/]world\.ts$/},async a=>{
 let src=await source(a);const marker='if(wasActive&&b.kind in C.enemies)this.#combatLedger.record(source,before,b.hp);';
 if(src.split(marker).length!==2)throw Error('Recheck boss salvage damage hook');
 src="import{claimBossSalvage,BOSS_SALVAGE}from './boss-salvage';\n"+src.replace(marker,marker+`
    const plateBreaks=claimBossSalvage(b,before,this.round,this.player.hp>0&&this.phase==='boss');
    if(plateBreaks.length){const charge=plateBreaks.length*BOSS_SALVAGE.charge,reward=grantGate(this.growth,charge,'energy');
      if(reward.activated)this.emit('overload',this.player.x,C.playerY);
      this.effects.push({type:'boss-salvage',x:b.x,y:b.y,bossVariant:b.bossVariant,gain:plateBreaks.length,text:'首领破甲 '+plateBreaks.length+'段 · 充能+'+charge,detail:this.chargeReceipt(reward.activated)});
    }`);
 return{contents:src,loader:'ts'};
});if(baseline)b.onLoad({filter:/[\\/]src[\\/]core[\\/].*\.ts$/},async a=>a.path.endsWith('boss-salvage.ts')?undefined:{contents:await source(a),loader:'ts'});}};}
