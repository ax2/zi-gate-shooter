import{FlightWorld,F,type FlightEvent}from'./world';
import{FlightHangar,hangarById,type HangarSave}from'./hangar';
import{hangarCombo}from'./hangar-combos';
export const rangePatterns=['column','spread','close']as const;
export type RangePattern=typeof rangePatterns[number];
export const rangeRules={duration:5,hold:1}as const;
export const rangeTargets:Record<RangePattern,readonly{x:number;y:number}[]>={column:[{x:360,y:820},{x:360,y:680},{x:360,y:540}],spread:[{x:150,y:740},{x:360,y:650},{x:570,y:740}],close:[{x:235,y:1000},{x:485,y:1000},{x:360,y:855}]};
/** The right pane changes one explicit slot only. No parents, currency or slots are granted. */
export function rangePreview(raw:HangarSave,id:string,level:number){const weapon=hangarById.get(id);if(!weapon||!Number.isInteger(level)||level<1||level>5)return;const save=structuredClone(raw),old=save.weapons[id],index=save.equipped[weapon.kind].indexOf(id),slot=index>=0?index:0,replaced=save.equipped[weapon.kind][slot];save.weapons[id]={level,paid:old?.paid??0,gift:old?.gift??false};save.equipped[weapon.kind][slot]=id;return{garage:new FlightHangar(save),slot,replaced,kind:weapon.kind};}
/** Two normal-rule simulations share fixtures and time, never the actual run/garage. */
export class WeaponRange{
 readonly original:HangarSave;readonly id:string;level:number;pattern:RangePattern='column';paused=false;elapsed=0;round=1;private accumulator=0;
 before!:FlightWorld;after!:FlightWorld;slot=0;kind:'main'|'side'='main';replaced?:string;
 constructor(g:FlightHangar,id:string,level:number){this.original=g.snapshot();this.id=id;if(!rangePreview(this.original,id,level))throw Error('Invalid weapon range selection');this.level=level;this.restart();}
 private restart(){const view=rangePreview(this.original,this.id,this.level)!;this.kind=view.kind;this.slot=view.slot;this.replaced=view.replaced;this.before=FlightWorld.shootingRange(new FlightHangar(this.original),rangeTargets[this.pattern]);this.after=FlightWorld.shootingRange(view.garage,rangeTargets[this.pattern]);this.elapsed=0;this.accumulator=0;}
 select(level:number){if(!rangePreview(this.original,this.id,level))return false;this.level=level;this.paused=false;this.round=1;this.restart();return true;}
 layout(value:string){if(!rangePatterns.some(p=>p===value))return false;this.pattern=value as RangePattern;this.paused=false;this.round=1;this.restart();return true;}
 replay(){this.paused=false;this.round=1;this.restart();}
 toggle(){this.paused=!this.paused;this.accumulator=0;}
 advance(dt:number):FlightEvent[]{if(this.paused||!Number.isFinite(dt)||dt<=0)return[];this.accumulator+=Math.min(.15,dt);const events:FlightEvent[]=[];while(this.accumulator>=F.step){this.accumulator-=F.step;this.elapsed+=F.step;if(this.elapsed<=rangeRules.duration+1e-8){this.before.step(F.step,360,1040);this.after.step(F.step,360,1040);this.before.drainEvents();events.push(...this.after.drainEvents());}if(this.elapsed>=rangeRules.duration+rangeRules.hold-1e-8){const round=this.round+1,left=this.accumulator;this.restart();this.round=round;this.accumulator=left;}}return events;}
 view(){const damage=(w:FlightWorld)=>Object.values(w.contribution).reduce((n,x)=>n+x,0),a=damage(this.before),b=damage(this.after),weapon=hangarById.get(this.id)!,view=weapon.combo?hangarCombo(this.after.hangar!,this.id):undefined;return{id:this.id,level:this.level,pattern:this.pattern,paused:this.paused,elapsed:this.elapsed,round:this.round,slot:this.slot,kind:this.kind,replaced:this.replaced,beforeDamage:a,afterDamage:b,delta:b-a,combo:view?.status,comboName:view?.name,requirement:new FlightHangar(this.original).requirement(this.id)};}
 snapshot(){return{...this.view(),before:this.before.diagnostics(),after:this.after.diagnostics()};}
}
