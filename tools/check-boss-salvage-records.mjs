import{readFile,writeFile}from'node:fs/promises';import assert from'node:assert/strict';
const baseline=JSON.parse(await readFile('build/qa/Stage-249/normal-1200-plan0.json','utf8')),rows=[];
for(const route of['ballistic','electric','optical']){
 const run=JSON.parse(await readFile(`build/qa/Stage-251/salvage-${route}-1200.json`,'utf8')),before=baseline.runs.find(r=>r.after.route===route).after,after=run.result;
 for(const field of['growth','sources','chapters'])assert.deepEqual(after[field].filter(r=>r.round<=3),before[field].filter(r=>r.round<=3),'early records '+route+'/'+field);
 rows.push({route,before:{round:before.round,hp:before.hp,pickups:before.pickups,gates:before.gates,maxGrowthGap:before.maxGrowthGap},after:{round:after.round,hp:after.hp,pickups:after.pickups,gates:after.gates,maxGrowthGap:after.maxGrowthGap},salvageReceipts:run.events.length,firstThreeRoundsSourceGrowthChapterRecordsEqual:true});
}
await writeFile('build/qa/Stage-251/long-summary.json',JSON.stringify({baseline:'Stage249 / 9158c27 core before Stage250 integration',candidate:'boss salvage only',method:'Omniscient earned operator, 1200 seconds, plan0. Not human experience or full-state equality.',rows},null,2)+'\n');console.log(JSON.stringify(rows));
