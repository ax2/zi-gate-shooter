import type {BuildTree} from './build-tree';
export const LASER_CHAIN={hops:2,range:220,decay:.8,focus:.8} as const;
export type PhotonAugment='photon-reach'|'photon-focus';
export const photonAugments={
 'photon-reach':{name:'远链矩阵',detail:'跳距220→300 · 两跳→三跳',role:'借前排命中，把光链送到分散敌群'},
 'photon-focus':{name:'聚焦增幅',detail:'孤立聚能80%→140% · 原两跳保留',role:'持续瞄准孤立精英与首领'},
} as const;
export const isPhotonAugment=(v:unknown):v is PhotonAugment=>v==='photon-reach'||v==='photon-focus';
export function laserChainProfile(augment?:PhotonAugment){return {...LASER_CHAIN,hops:augment==='photon-reach'?3:LASER_CHAIN.hops,range:augment==='photon-reach'?300:LASER_CHAIN.range,focus:augment==='photon-focus'?1.4:LASER_CHAIN.focus};}
export function canLaserChain(build:Pick<BuildTree,'ranks'|'refinements'>,arcStage:number){return build.ranks.optical>=3&&build.refinements.optical>=1&&arcStage>=2;}
