import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';import {execFileSync} from 'node:child_process';

// Append each finished case/module before the final JSON reporter runs. An
// interrupted run remains incomplete; this never converts partial work to pass.
export default class QaProgressReporter {
  cases=new Map();modules=new Map();planned=0;
  onInit(){
    const root=resolve(process.cwd());this.dir=resolve(root,process.env.GAME_QA_DIR??'build/qa/Stage-250/retry-full');
    if(!this.dir.startsWith(root+sep))throw Error('QA output must stay inside the workspace');
    mkdirSync(this.dir,{recursive:true});this.journal=resolve(this.dir,'events.jsonl');
    if(existsSync(this.journal))throw Error('Preserve prior QA journal; choose a fresh GAME_QA_DIR');
    this.started=Date.now();this.emit({event:'init',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),pid:process.pid});
  }
  emit(event){appendFileSync(this.journal,JSON.stringify({at:new Date().toISOString(),...event})+'\n');}
  errors(errors){return(errors??[]).map(e=>({name:e.name,message:String(e.message??e),stack:e.stack??null}));}
  snapshot(reason='running'){
    const cases=[...this.cases.values()],modules=[...this.modules.values()];
    const data={reason,started:new Date(this.started).toISOString(),seconds:(Date.now()-this.started)/1000,plannedModules:this.planned,completedModules:modules.filter(m=>m.ended).length,
      passedCases:cases.filter(c=>c.state==='passed').length,failedCases:cases.filter(c=>c.state==='failed').length,skippedCases:cases.filter(c=>c.state==='skipped').length,
      failedModules:modules.filter(m=>m.ended&&m.state==='failed').length,pendingModules:modules.filter(m=>!m.ended).map(m=>m.file)};
    writeFileSync(resolve(this.dir,'status.json'),JSON.stringify(data,null,2)+'\n');return data;
  }
  onTestRunStart(specs){this.planned=specs.length;this.emit({event:'run-start',plannedModules:this.planned,files:specs.map(s=>s.moduleId)});this.snapshot();}
  onTestModuleStart(module){this.modules.set(module.id,{file:module.relativeModuleId,ended:false});this.emit({event:'module-start',id:module.id,file:module.relativeModuleId});this.snapshot();}
  onTestCaseResult(test){const r=test.result(),row={event:'case-end',id:test.id,file:test.module.relativeModuleId,name:test.fullName,state:r.state,errors:this.errors(r.errors)};this.cases.set(test.id,row);this.emit(row);this.snapshot();}
  onTestModuleEnd(module){const row={event:'module-end',id:module.id,file:module.relativeModuleId,state:module.state(),errors:this.errors(module.errors()),ended:true};this.modules.set(module.id,row);this.emit(row);const s=this.snapshot();process.stdout.write(`[qa ${s.completedModules}/${s.plannedModules}] ${row.state} ${row.file} (${s.passedCases} passed, ${s.failedCases} failed)\n`);}
  onTestRunEnd(modules,errors,reason){const s=this.snapshot(reason);this.emit({event:'run-end',reason,unhandledErrors:this.errors(errors),...s});writeFileSync(resolve(this.dir,'summary.json'),JSON.stringify({...s,unhandledErrors:this.errors(errors)},null,2)+'\n');}
}
