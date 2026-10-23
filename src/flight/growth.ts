import{componentPairs}from'./early-parts';
import{techById,type Assembly}from'./technology';
/** First earned supply supports the chosen starter; it remains physical loot. */
export const openingGrowth={parts:3,minChoices:2}as const;
export function openingForkReady(a:Assembly){if(a.installed.size!==1)return true;const starter=a.installed.values().next().value,column=starter?techById.get(starter)?.column:undefined;return column!==undefined&&componentPairs[column].filter(id=>a.can(id)).length>=openingGrowth.minChoices;}
