/** Actual post-acceptance combat counters, never a mere unlock check. */
export const buildProofs={
 storm:{name:'雷暴霰射',goal:18,unit:'跳电',detail:'30秒跳电18次 · 瞄准紧群'},
 prism:{name:'棱镜激光',goal:6,unit:'侧束',detail:'30秒侧束命中6次 · 对齐侧翼'},
 fracture:{name:'裂甲爆破',goal:4,unit:'引爆',detail:'30秒引爆4次 · 集中穿甲'},
 photon:{name:'电光连锁',goal:4,unit:'跳伤',detail:'30秒光链跳伤4次 · 瞄准阵心'},
 ricochet:{name:'跳弹侧击',goal:12,groups:2,unit:'侧击',detail:'30秒跳弹12次 · 命中2批精英'},
 ion:{name:'离子风暴',goal:6,unit:'命中',detail:'30秒放电命中6次 · 瞄准阵心'},
} as const;
export type BuildProof=keyof typeof buildProofs;
export interface ProofTarget {kind:BuildProof;start:number}

export const PROOF_WAVES={groups:6,spacing:5,retry:.5} as const;
export function proofFormation(kind:BuildProof){
 if(kind==='ricochet')return [{kind:'elite',x:230,y:380,pattern:'fan'},{kind:'elite',x:490,y:380,pattern:'fan'}] as const;
 if(kind==='prism')return [{kind:'armor',x:215,y:420},{kind:'elite',x:360,y:420},{kind:'armor',x:505,y:420}] as const;
 if(kind==='fracture')return [{kind:'elite',x:360,y:500},{kind:'armor',x:360,y:330},{kind:'drone',x:520,y:420}] as const;
 return [{kind:'elite',x:360,y:500},{kind:'armor',x:250,y:430},{kind:'armor',x:470,y:430}] as const;
}
