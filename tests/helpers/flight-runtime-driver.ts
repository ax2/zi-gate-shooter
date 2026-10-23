import type{FlightRuntime}from'../../src/flight/runtime';
/** Existing full-tree regression routes explicitly bank the new prompt. New-choice tests do not. */
export function bankUpgrade(r:FlightRuntime){if(r.mode==='upgrade'&&!r.activate('upgrade-bank'))throw Error('Could not bank affordable upgrade');}
