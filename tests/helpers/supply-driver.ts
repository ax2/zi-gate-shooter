import type {World} from '../../src/core/world';import {progressionTarget} from './progression-driver';
/** Controlled normal-play comparison: no World writes, grants or hidden enemies. */
export function supplyTarget(w:World,mode:'early'|'early-right'|'late'|'clear'|'forecast'){
 if(mode==='clear'&&w.round===4&&w.roundTime>=47.5&&w.roundTime<=54.5)return w.roundTime<50.5?360:570;
 if(mode!=='forecast'&&w.round===4&&w.roundTime>=47.5&&w.roundTime<=54.5)return mode==='early-right'||mode==='late'&&w.roundTime>=52.2?570:150;
 return progressionTarget(w);
}
