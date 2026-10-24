import type{FlightRuntime}from'../../src/flight/runtime';
/** Regression operator clicks the default pictured destination to keep the
 * existing growth routes running. Dedicated destination tests hold this page. */
export function chooseDefaultDestination(r:FlightRuntime){if(r.mode!=='sector')return;const choice=r.world.nextDestination;if(!choice||!r.activate('sector-choice:'+choice.defaultFamily))throw Error('Could not choose pictured destination');}
/** Existing full-tree regression routes explicitly bank the new prompt. New-choice tests do not. */
export function bankUpgrade(r:FlightRuntime){chooseDefaultDestination(r);if(r.mode==='upgrade'&&!r.activate('upgrade-bank'))throw Error('Could not bank affordable upgrade');}
