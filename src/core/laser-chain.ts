import type {BuildTree} from './build-tree';
export const LASER_CHAIN={hops:2,range:220,decay:.8} as const;
export function canLaserChain(build:Pick<BuildTree,'ranks'|'refinements'>,arcStage:number){return build.ranks.optical>=3&&build.refinements.optical>=1&&arcStage>=2;}
